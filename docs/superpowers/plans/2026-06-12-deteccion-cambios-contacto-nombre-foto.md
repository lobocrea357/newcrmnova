# Detección y Sincronización de Cambios en Contactos (Nombre y Foto de Perfil) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un mecanismo robusto para detectar y sincronizar cambios en el nombre y la foto de perfil de los contactos desde WAHA, usando una estrategia de actualización basada en tiempo para minimizar el impacto en rendimiento y asegurar consistencia de datos sin introducir regresiones.

**Architecture:** Estrategia de actualización basada en tiempo (Opción B) con un nuevo servicio `ContactSyncService` que encapsula la lógica de sincronización, normalización de nombres con soporte para acentos/caracteres especiales, y detección de cambios en foto de perfil mediante hash. La lógica se integra en `webhookService.js` sin modificar el comportamiento existente de procesamiento de mensajes.

**Tech Stack:** Node.js, Supabase (PostgreSQL), WAHA API, crypto (para hash de imágenes)

---

## File Structure

**Archivos a crear:**
- `src/config/contactSyncConfig.js` - Configuración centralizada de sincronización
- `src/services/contactSyncService.js` - Nuevo servicio encapsulando lógica de sincronización

**Archivos a modificar:**
- `src/services/webhookService.js` - Integrar ContactSyncService en getOrCreateContact
- `src/services/wahaContactService.js` - Agregar método para calcular hash de imagen
- `src/services/contactService.js` - Actualizar método getOrCreateContact para manejar nuevos campos

**Base de datos:**
- Agregar columnas `last_waha_sync` y `profile_picture_hash` a tabla `contacts`

---

## FASE 0: Preparación de Base de Datos

### Task 1: Agregar columnas de sincronización a tabla contacts

**Files:**
- Modify: Base de datos (ejecutar SQL manualmente en Supabase SQL Editor)

**SQL a ejecutar en Supabase SQL Editor:**

```sql
-- Agregar columna last_waha_sync para registrar última sincronización con WAHA
ALTER TABLE public.contacts
ADD COLUMN last_waha_sync timestamp with time zone DEFAULT NULL;

-- Agregar columna profile_picture_hash para detectar cambios en foto de perfil
ALTER TABLE public.contacts
ADD COLUMN profile_picture_hash text DEFAULT NULL;

-- Crear índice para optimizar consultas por last_waha_sync
CREATE INDEX idx_contacts_last_waha_sync ON public.contacts (last_waha_sync);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
AND column_name IN ('last_waha_sync', 'profile_picture_hash');
```

**Expected output:** Debe mostrar 2 filas con las columnas `last_waha_sync` (timestamp with time zone) y `profile_picture_hash` (text).

**Criterio de aceptación:** Las columnas existen en la tabla `contacts` y el índice fue creado exitosamente.

---

## FASE 1: Configuración y Servicios Base

### Task 2: Crear archivo de configuración de sincronización

**Files:**
- Create: `src/config/contactSyncConfig.js`

- [ ] **Step 1: Crear archivo de configuración**

```javascript
// src/config/contactSyncConfig.js
export const CONTACT_SYNC_CONFIG = {
  // Estrategia de actualización basada en tiempo (Opción B)
  HOURS_BETWEEN_WAHA_SYNC: 24, // Sincronizar con WAHA cada 24 horas
  
  // Flags para habilitar/deshabilitar funcionalidades
  ENABLE_NAME_SYNC: true, // Habilitar detección de cambios de nombre
  ENABLE_PROFILE_PICTURE_SYNC: true, // Habilitar detección de cambios de foto de perfil
  
  // Configuración de normalización de nombres
  NORMALIZE_NAMES: true, // Normalizar nombres antes de comparar (acentos, espacios, etc.)
  
  // Configuración de hash de imagen
  ENABLE_PROFILE_PICTURE_HASH: true, // Usar hash para detectar cambios reales en fotos
};
```

- [ ] **Step 2: Commit**

```bash
git add src/config/contactSyncConfig.js
git commit -m "feat: add contact sync configuration"
```

---

### Task 3: Agregar método para calcular hash de imagen en WahaContactService

**Files:**
- Modify: `src/services/wahaContactService.js`

- [ ] **Step 1: Agregar método para calcular hash de imagen**

Agregar este método después de la línea 161 (antes del export default):

```javascript
  /**
   * Calcula hash SHA256 de una imagen desde su URL
   * Útil para detectar cambios reales en fotos de perfil
   */
  async calculateImageHash(imageUrl) {
    try {
      if (!imageUrl) return null;
      
      // Descargar imagen
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      
      const buffer = await response.arrayBuffer();
      const bufferArray = new Uint8Array(buffer);
      
      // Calcular hash SHA256 usando crypto de Node.js
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(bufferArray);
      return hash.digest('hex');
    } catch (error) {
      console.error('Error calculando hash de imagen:', error.message);
      return null;
    }
  }
```

- [ ] **Step 2: Verificar que el archivo compila**

Run: `node -c src/services/wahaContactService.js`
Expected: Sin errores de sintaxis

- [ ] **Step 3: Commit**

```bash
git add src/services/wahaContactService.js
git commit -m "feat: add image hash calculation method to WahaContactService"
```

---

### Task 4: Actualizar getFullContactData para incluir hash de imagen

**Files:**
- Modify: `src/services/wahaContactService.js`

- [ ] **Step 1: Modificar método getFullContactData para calcular hash**

Reemplazar el bloque de extracción de URL de foto de perfil (líneas 110-113) con:

```javascript
      // Extraer URL de foto de perfil y calcular hash
      if (profilePicture && profilePicture.profilePictureURL) {
        fullData.profile_picture_url = profilePicture.profilePictureURL;
        
        // Calcular hash de la imagen para detectar cambios
        fullData.profile_picture_hash = await this.calculateImageHash(profilePicture.profilePictureURL);
      }
```

También actualizar el objeto de retorno (líneas 82-89) para incluir el nuevo campo:

```javascript
      const fullData = {
        phone_number: contactId.split('@')[0],
        name: null,
        push_name: null,
        profile_picture_url: null,
        profile_picture_hash: null, // Nuevo campo
        is_business: false,
        is_enterprise: false
      };
```

Y actualizar el objeto de retorno en el bloque catch (líneas 127-134):

```javascript
      return {
        phone_number: contactId.split('@')[0],
        name: null,
        push_name: null,
        profile_picture_url: null,
        profile_picture_hash: null, // Nuevo campo
        is_business: false,
        is_enterprise: false
      };
```

- [ ] **Step 2: Verificar que el archivo compila**

Run: `node -c src/services/wahaContactService.js`
Expected: Sin errores de sintaxis

- [ ] **Step 3: Commit**

```bash
git add src/services/wahaContactService.js
git commit -m "feat: include profile picture hash in getFullContactData"
```

---

## FASE 2: Creación de ContactSyncService

### Task 5: Crear ContactSyncService con lógica de normalización de nombres

**Files:**
- Create: `src/services/contactSyncService.js`

- [ ] **Step 1: Crear estructura base del servicio**

```javascript
import { CONTACT_SYNC_CONFIG } from '../config/contactSyncConfig.js';
import WahaContactService from './wahaContactService.js';
import { ContactService } from './contactService.js';
import { ChatService } from './chatService.js';

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
```

- [ ] **Step 2: Agregar import de supabase al inicio del archivo**

Agregar al inicio del archivo después de los imports:

```javascript
import supabase from '../config/supabase.js';
```

- [ ] **Step 3: Verificar que el archivo compila**

Run: `node -c src/services/contactSyncService.js`
Expected: Sin errores de sintaxis

- [ ] **Step 4: Commit**

```bash
git add src/services/contactSyncService.js
git commit -m "feat: create ContactSyncService with name and profile picture change detection"
```

---

## FASE 3: Actualización de ContactService

### Task 6: Agregar método updateContact en ContactService

**Files:**
- Modify: `src/services/contactService.js`

- [ ] **Step 1: Agregar método updateContact**

Agregar este método después del método `getOrCreateContact` (después de la línea 99):

```javascript
  /**
   * Actualiza un contacto existente
   */
  async updateContact(contactId, updateData) {
    try {
      console.log(`\n🔍 ========== CONTACT SERVICE: updateContact ==========`);
      console.log(`Contact ID: ${contactId}`);
      console.log(`Update Data:`, JSON.stringify(updateData, null, 2));
      
      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      console.log(`✅ Contacto actualizado exitosamente`);
      console.log(`==========================================\n`);
      return updatedContact;
    } catch (error) {
      console.error('Error en updateContact:', error);
      throw error;
    }
  }
```

- [ ] **Step 2: Agregar método updateSyncTimestamp**

Agregar este método después del método `updateContact`:

```javascript
  /**
   * Actualiza solo el timestamp de sincronización de un contacto
   */
  async updateSyncTimestamp(contactId) {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ last_waha_sync: new Date().toISOString() })
        .eq('id', contactId);

      if (error) throw error;
      
      console.log(`✅ Timestamp de sincronización actualizado`);
    } catch (error) {
      console.error('Error en updateSyncTimestamp:', error);
      throw error;
    }
  }
```

- [ ] **Step 3: Verificar que el archivo compila**

Run: `node -c src/services/contactService.js`
Expected: Sin errores de sintaxis

- [ ] **Step 4: Commit**

```bash
git add src/services/contactService.js
git commit -m "feat: add updateContact and updateSyncTimestamp methods to ContactService"
```

---

## FASE 4: Integración en WebhookService

### Task 7: Integrar ContactSyncService en webhookService

**Files:**
- Modify: `src/services/webhookService.js`

- [ ] **Step 1: Agregar import de ContactSyncService**

Agregar al inicio del archivo después de los imports existentes (después de la línea 10):

```javascript
import ContactSyncService from './contactSyncService.js';
```

- [ ] **Step 2: Reemplazar lógica de getOrCreateContact**

Reemplazar todo el método `getOrCreateContact` (líneas 307-426) con:

```javascript
  /**
   * Obtiene o crea el contacto (INTEGRADO CON CONTACT SYNC SERVICE)
   */
  async getOrCreateContact(botId, payload, session, eventMe = null) {
    try {
      // El contacto SIEMPRE es el 'from' (la otra persona)
      // - En mensajes entrantes: from = quien envía (contacto)
      // - En mensajes salientes: from = quien recibe (contacto)
      
      // IMPORTANTE: WhatsApp usa diferentes formatos de ID:
      // - @c.us o @s.whatsapp.net: número de teléfono tradicional
      // - @lid: ID interno de WhatsApp (nuevo formato)
      // Debemos normalizar usando remoteJidAlt cuando esté disponible
      
      let contactId = payload.from;
      let contactNumber = payload.from?.split('@')[0];
      
      // Si el from es un @lid, intentar usar remoteJidAlt que tiene el número real
      if (payload.from?.includes('@lid') && payload._data?.key?.remoteJidAlt) {
        const altId = payload._data.key.remoteJidAlt;
        // remoteJidAlt puede ser @s.whatsapp.net o @c.us
        if (altId.includes('@s.whatsapp.net') || altId.includes('@c.us')) {
          contactNumber = altId.split('@')[0];
          contactId = `${contactNumber}@c.us`;
          console.log(`   🔄 Normalizado de @lid a número real: ${contactNumber}`);
        }
      }
      
      if (!contactNumber) {
        throw new Error('No se pudo extraer número de contacto');
      }

      // Obtener el nombre del bot para detectar nombres incorrectos
      const botPushName = eventMe?.pushName || null;
      console.log(`   📞 Contacto: ${contactNumber}`);
      console.log(`   🤖 Nombre del bot: ${botPushName || 'Desconocido'}`);

      // Verificar si el contacto ya existe
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .eq('phone_number', contactNumber)
        .maybeSingle();

      // Si el contacto existe, usar ContactSyncService para sincronizar si es necesario
      if (existingContact) {
        console.log(`   ✅ Contacto existente encontrado: ${existingContact.name || contactNumber}`);
        
        // Usar ContactSyncService para sincronizar con WAHA si es necesario
        const syncedContact = await ContactSyncService.syncContactWithWaha(
          botId,
          contactNumber,
          contactId,
          session,
          existingContact,
          botPushName
        );
        
        return syncedContact;
      }

      // Si el contacto no existe, crearlo con datos de WAHA
      console.log(`   🆕 Contacto nuevo, consultando datos desde WAHA...`);
      const wahaContactData = await WahaContactService.getFullContactData(session, contactId);

      // Determinar el nombre correcto (NUNCA usar el nombre del bot)
      let finalName = null;
      
      // Prioridad: WAHA > verifiedBizName > número de teléfono
      if (wahaContactData.name && !ContactSyncService.isInvalidName(wahaContactData.name, botPushName)) {
        finalName = wahaContactData.name;
      } else if (payload.verifiedBizName && !ContactSyncService.isInvalidName(payload.verifiedBizName, botPushName)) {
        finalName = payload.verifiedBizName;
      } else if (payload._data?.verifiedName && !ContactSyncService.isInvalidName(payload._data?.verifiedName, botPushName)) {
        finalName = payload._data?.verifiedName;
      }
      
      // Si no hay nombre válido, usar el número de teléfono
      if (!finalName) {
        finalName = contactNumber;
        console.log(`   ⚠️ No se encontró nombre válido, usando número: ${contactNumber}`);
      }

      const finalContactData = {
        name: finalName,
        push_name: finalName,
        profile_picture_url: wahaContactData.profile_picture_url,
        profile_picture_hash: wahaContactData.profile_picture_hash,
        is_business: wahaContactData.is_business,
        is_enterprise: wahaContactData.is_enterprise,
        last_waha_sync: new Date().toISOString() // Marcar como sincronizado al crear
      };

      console.log(`   👤 Nombre final: ${finalContactData.name}`);

      return await contactService.getOrCreateContact(botId, contactNumber, finalContactData);
    } catch (error) {
      console.error('Error en getOrCreateContact:', error);
      throw error;
    }
  }
```

- [ ] **Step 3: Verificar que el archivo compila**

Run: `node -c src/services/webhookService.js`
Expected: Sin errores de sintaxis

- [ ] **Step 4: Commit**

```bash
git add src/services/webhookService.js
git commit -m "feat: integrate ContactSyncService in webhookService for automatic contact sync"
```

---

## FASE 5: Pruebas y Verificación

### Task 8: Verificar integración completa

**Files:**
- No se crean/modifican archivos (verificación manual)

- [ ] **Step 1: Verificar que no hay errores de sintaxis en todos los archivos modificados**

Run:
```bash
node -c src/config/contactSyncConfig.js
node -c src/services/wahaContactService.js
node -c src/services/contactSyncService.js
node -c src/services/contactService.js
node -c src/services/webhookService.js
```

Expected: Todos los comandos deben ejecutarse sin errores

- [ ] **Step 2: Verificar que las columnas de BD existen**

Ejecutar en Supabase SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
AND column_name IN ('last_waha_sync', 'profile_picture_hash');
```

Expected: Debe mostrar 2 filas con las columnas agregadas

- [ ] **Step 3: Verificar que el índice fue creado**

Ejecutar en Supabase SQL Editor:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'contacts' 
AND indexname = 'idx_contacts_last_waha_sync';
```

Expected: Debe mostrar el índice creado

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "chore: verify complete integration of contact sync feature"
```

---

## FASE 6: Pruebas Funcionales (Manual)

### Task 9: Prueba funcional - Creación de nuevo contacto

**Files:**
- No se crean/modifican archivos (prueba manual)

- [ ] **Step 1: Enviar un mensaje desde un número nuevo al bot**

- [ ] **Step 2: Verificar en logs que se creó el contacto con datos de WAHA**

Expected output en logs:
```
🆕 Contacto nuevo, consultando datos desde WAHA...
👤 Nombre final: [nombre del contacto]
✅ Contacto creado exitosamente
```

- [ ] **Step 3: Verificar en BD que el contacto tiene last_waha_sync y profile_picture_hash**

Ejecutar en Supabase SQL Editor:
```sql
SELECT id, phone_number, name, profile_picture_url, profile_picture_hash, last_waha_sync 
FROM contacts 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected: El contacto debe tener valores en `last_waha_sync` y `profile_picture_hash` (si tiene foto)

---

### Task 10: Prueba funcional - Sincronización de contacto existente

**Files:**
- No se crean/modifican archivos (prueba manual)

- [ ] **Step 1: Enviar un mensaje desde un contacto existente**

- [ ] **Step 2: Verificar en logs que se evalúa si necesita sincronización**

Expected output en logs:
```
✅ Contacto existente encontrado: [nombre]
ℹ️ Contacto no necesita sincronización (última sync: [timestamp])
```

O si necesita sincronización:
```
✅ Contacto existente encontrado: [nombre]
🔍 Sincronizando contacto con WAHA...
```

- [ ] **Step 3: Forzar sincronización cambiando last_waha_sync a NULL**

Ejecutar en Supabase SQL Editor:
```sql
UPDATE contacts 
SET last_waha_sync = NULL 
WHERE phone_number = '[número de teléfono de prueba]';
```

- [ ] **Step 4: Enviar otro mensaje desde el mismo contacto**

- [ ] **Step 5: Verificar en logs que se sincroniza con WAHA**

Expected output en logs:
```
🔍 Sincronizando contacto con WAHA...
✅ Sin cambios detectados, actualizando timestamp de sync
```

O si hubo cambios:
```
🔄 Cambios detectados: { nameChanged: true/false, pictureChanged: true/false, ... }
✅ Contacto sincronizado exitosamente
```

---

### Task 11: Prueba funcional - Detección de cambio de nombre

**Files:**
- No se crean/modifican archivos (prueba manual)

- [ ] **Step 1: Cambiar el nombre de un contacto en WhatsApp (desde el celular del contacto)**

- [ ] **Step 2: Forzar sincronización cambiando last_waha_sync a NULL**

Ejecutar en Supabase SQL Editor:
```sql
UPDATE contacts 
SET last_waha_sync = NULL 
WHERE phone_number = '[número de teléfono de prueba]';
```

- [ ] **Step 3: Enviar un mensaje desde ese contacto**

- [ ] **Step 4: Verificar en logs que se detectó el cambio de nombre**

Expected output en logs:
```
🔄 Cambios detectados: { nameChanged: true, pictureChanged: false, newName: [nuevo nombre], ... }
✅ Contacto sincronizado exitosamente
✅ Nombre actualizado en chats asociados
```

- [ ] **Step 5: Verificar en BD que el nombre se actualizó**

Ejecutar en Supabase SQL Editor:
```sql
SELECT id, phone_number, name, updated_at 
FROM contacts 
WHERE phone_number = '[número de teléfono de prueba]';
```

Expected: El nombre debe ser el nuevo nombre

- [ ] **Step 6: Verificar en BD que los chats se actualizaron**

Ejecutar en Supabase SQL Editor:
```sql
SELECT id, contact_name, name 
FROM chats 
WHERE contact_id = '[contact_id del contacto]';
```

Expected: `contact_name` y `name` deben ser el nuevo nombre

---

### Task 12: Prueba funcional - Detección de cambio de foto de perfil

**Files:**
- No se crean/modifican archivos (prueba manual)

- [ ] **Step 1: Cambiar la foto de perfil de un contacto en WhatsApp**

- [ ] **Step 2: Forzar sincronización cambiando last_waha_sync a NULL**

Ejecutar en Supabase SQL Editor:
```sql
UPDATE contacts 
SET last_waha_sync = NULL 
WHERE phone_number = '[número de teléfono de prueba]';
```

- [ ] **Step 3: Enviar un mensaje desde ese contacto**

- [ ] **Step 4: Verificar en logs que se detectó el cambio de foto**

Expected output en logs:
```
🔄 Cambios detectados: { nameChanged: false, pictureChanged: true, newPicture: 'cambiada', ... }
✅ Contacto sincronizado exitosamente
```

- [ ] **Step 5: Verificar en BD que la URL y el hash se actualizaron**

Ejecutar en Supabase SQL Editor:
```sql
SELECT id, phone_number, profile_picture_url, profile_picture_hash, updated_at 
FROM contacts 
WHERE phone_number = '[número de teléfono de prueba]';
```

Expected: `profile_picture_url` y `profile_picture_hash` deben tener nuevos valores

---

## Resumen de Cambios

**Archivos creados:**
1. `src/config/contactSyncConfig.js` - Configuración de sincronización
2. `src/services/contactSyncService.js` - Servicio de sincronización de contactos

**Archivos modificados:**
1. `src/services/wahaContactService.js` - Agregado método calculateImageHash y actualizado getFullContactData
2. `src/services/contactService.js` - Agregados métodos updateContact y updateSyncTimestamp
3. `src/services/webhookService.js` - Integrado ContactSyncService en getOrCreateContact

**Base de datos:**
- Agregadas columnas `last_waha_sync` y `profile_picture_hash` a tabla `contacts`
- Creado índice `idx_contacts_last_waha_sync`

**Comportamiento:**
- Los contactos nuevos se sincronizan con WAHA al crearse
- Los contactos existentes se sincronizan con WAHA cada 24 horas (configurable)
- Se detectan cambios de nombre (con normalización de acentos/caracteres especiales)
- Se detectan cambios de foto de perfil (usando hash para comparación robusta)
- Los chats asociados se actualizan cuando cambia el nombre del contacto
- No hay regresiones: el comportamiento existente de procesamiento de mensajes no cambia

---

## Notas Importantes

1. **Performance:** La estrategia de actualización basada en tiempo (24 horas) minimiza el impacto en la API de WAHA. Solo se consulta WAHA cuando es necesario.

2. **Normalización de nombres:** La función `normalizeName` maneja acentos, caracteres especiales y emojis, evitando actualizaciones innecesarias por diferencias de formato.

3. **Hash de imágenes:** El cálculo de hash SHA256 permite detectar cambios reales en las fotos de perfil, incluso si la URL no cambia.

4. **Consistencia de datos:** Cuando cambia el nombre de un contacto, se actualizan automáticamente todos los chats asociados para mantener consistencia.

5. **Configuración:** Todos los parámetros son configurables a través de `contactSyncConfig.js`, permitiendo ajustar el comportamiento sin modificar código.

6. **Error handling:** Si falla la sincronización con WAHA, el sistema continúa funcionando con los datos existentes, evitando bloqueos en el procesamiento de mensajes.

7. **Validación de nombres del bot:** Se mantiene la validación existente para evitar asignar el nombre del bot a un contacto.
