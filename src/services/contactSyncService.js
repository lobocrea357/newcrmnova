import { CONTACT_SYNC_CONFIG } from '../config/contactSyncConfig.js';
import WahaContactService from './wahaContactService.js';
import { ContactService } from './contactService.js';
import { ChatService } from './chatService.js';
import supabase from '../config/supabase.js';

const wahaContactService = new WahaContactService();
const contactService = new ContactService();
const chatService = new ChatService();

export class ContactSyncService {
  /**
   * Normaliza un nombre para comparación (case-insensitive, sin acentos, sin espacios extra)
   */
  normalizeName(name) {
    if (!name) return '';
    
    if (!CONTACT_SYNC_CONFIG.NORMALIZE_NAMES) {
      return name.toLowerCase().trim().replace(/\s+/g, '');
    }
    
    return name
      .toLowerCase()
      .normalize('NFD')  // Descomponer acentos
      .replace(/[\u0300-\u036f]/g, '')  // Remover diacríticos
      .replace(/[^\w\s]/g, '')  // Remover caracteres especiales (incluye emojis)
      .trim()
      .replace(/\s+/g, '');  // Remover espacios extra
  }

  /**
   * Verifica si un nombre es igual al nombre del bot (para evitar asignar nombre incorrecto)
   */
  isInvalidName(name, botPushName) {
    if (!name) return true;
    if (!botPushName) return false;
    return this.normalizeName(name) === this.normalizeName(botPushName);
  }

  /**
   * Determina si un contacto necesita sincronización con WAHA
   */
  shouldSyncWithWaha(contact) {
    // Si nunca se ha sincronizado, sincronizar
    if (!contact.last_waha_sync) {
      return true;
    }
    
    // Si ha pasado el tiempo configurado desde la última sincronización
    const hoursSinceSync = (Date.now() - new Date(contact.last_waha_sync).getTime()) / (1000 * 60 * 60);
    return hoursSinceSync >= CONTACT_SYNC_CONFIG.HOURS_BETWEEN_WAHA_SYNC;
  }

  /**
   * Detecta si hubo cambios en el nombre del contacto
   */
  hasNameChanged(existingContact, wahaData, botPushName) {
    if (!CONTACT_SYNC_CONFIG.ENABLE_NAME_SYNC) {
      return false;
    }
    
    const currentName = this.normalizeName(existingContact.name);
    const wahaName = this.normalizeName(wahaData.name);
    
    // Si el nombre de WAHA es inválido (igual al del bot), no actualizar
    if (this.isInvalidName(wahaData.name, botPushName)) {
      return false;
    }
    
    // Comparar nombres normalizados
    return wahaName && wahaName !== currentName;
  }

  /**
   * Detecta si hubo cambios en la foto de perfil
   */
  hasProfilePictureChanged(existingContact, wahaData) {
    if (!CONTACT_SYNC_CONFIG.ENABLE_PROFILE_PICTURE_SYNC) {
      return false;
    }
    
    // Si no hay hash configurado, usar comparación por URL
    if (!CONTACT_SYNC_CONFIG.ENABLE_PROFILE_PICTURE_HASH) {
      return wahaData.profile_picture_url !== existingContact.profile_picture_url;
    }
    
    // Usar comparación por hash (más robusto)
    const currentHash = existingContact.profile_picture_hash;
    const wahaHash = wahaData.profile_picture_hash;
    
    // Si no hay hash en WAHA pero sí en BD, no actualizar (evitar pérdida de hash)
    if (!wahaHash && currentHash) {
      return false;
    }
    
    return wahaHash && wahaHash !== currentHash;
  }

  /**
   * Sincroniza un contacto con WAHA si es necesario
   */
  async syncContactWithWaha(botId, contactNumber, contactId, session, existingContact, botPushName) {
    try {
      // Verificar si necesita sincronización
      if (!this.shouldSyncWithWaha(existingContact)) {
        console.log(`   ℹ️ Contacto no necesita sincronización (última sync: ${existingContact.last_waha_sync})`);
        return existingContact;
      }
      
      console.log(`   🔍 Sincronizando contacto con WAHA...`);
      
      // Obtener datos actualizados de WAHA
      const wahaContactData = await wahaContactService.getFullContactData(session, contactId);
      
      if (!wahaContactData) {
        console.warn(`   ⚠️ No se pudieron obtener datos de WAHA, usando datos existentes`);
        return existingContact;
      }
      
      // Detectar cambios
      const nameChanged = this.hasNameChanged(existingContact, wahaContactData, botPushName);
      const pictureChanged = this.hasProfilePictureChanged(existingContact, wahaContactData);
      
      // Si no hubo cambios, solo actualizar timestamp de sincronización
      if (!nameChanged && !pictureChanged) {
        console.log(`   ✅ Sin cambios detectados, actualizando timestamp de sync`);
        await contactService.updateSyncTimestamp(existingContact.id);
        return existingContact;
      }
      
      // Preparar datos de actualización
      const updateData = {
        name: nameChanged ? wahaContactData.name : existingContact.name,
        push_name: nameChanged ? wahaContactData.push_name : existingContact.push_name,
        profile_picture_url: pictureChanged ? wahaContactData.profile_picture_url : existingContact.profile_picture_url,
        profile_picture_hash: pictureChanged ? wahaContactData.profile_picture_hash : existingContact.profile_picture_hash,
        is_business: wahaContactData.is_business,
        is_enterprise: wahaContactData.is_enterprise,
        last_waha_sync: new Date().toISOString()
      };
      
      console.log(`   🔄 Cambios detectados:`, {
        nameChanged,
        pictureChanged,
        newName: nameChanged ? wahaContactData.name : 'sin cambio',
        newPicture: pictureChanged ? 'cambiada' : 'sin cambio'
      });
      
      // Actualizar contacto
      const updatedContact = await contactService.updateContact(existingContact.id, updateData);
      
      // Si cambió el nombre, actualizar también los chats asociados
      if (nameChanged) {
        await this.updateChatsContactName(existingContact.id, wahaContactData.name);
      }
      
      console.log(`   ✅ Contacto sincronizado exitosamente`);
      return updatedContact;
      
    } catch (error) {
      console.error('❌ Error en syncContactWithWaha:', error);
      // En caso de error, retornar el contacto existente para no bloquear el flujo
      return existingContact;
    }
  }

  /**
   * Actualiza el nombre del contacto en todos los chats asociados
   */
  async updateChatsContactName(contactId, newName) {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          contact_name: newName,
          name: newName
        })
        .eq('contact_id', contactId);
      
      if (error) {
        console.error('Error actualizando nombre en chats:', error);
      } else {
        console.log(`   ✅ Nombre actualizado en chats asociados`);
      }
    } catch (error) {
      console.error('Error en updateChatsContactName:', error);
    }
  }
}

export default new ContactSyncService();
