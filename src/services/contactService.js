import supabase from '../config/supabase.js';

export class ContactService {
  /**
   * Obtiene o crea un contacto
   */
  async getOrCreateContact(botId, phoneNumber, contactData = {}) {
    try {
      console.log(`\n🔍 ========== CONTACT SERVICE: getOrCreateContact ==========`);
      console.log(`Bot ID: ${botId}`);
      console.log(`Phone Number: ${phoneNumber}`);
      console.log(`Contact Data:`, JSON.stringify(contactData, null, 2));
      
      // Buscar contacto existente (usar maybeSingle para evitar errores cuando no existe)
      const { data: existingContact, error: searchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (searchError) {
        console.error('Error buscando contacto:', searchError);
        throw searchError;
      }

      if (existingContact) {
        console.log(`✅ Contacto existente encontrado:`, {
          id: existingContact.id,
          name: existingContact.name || 'NULL',
          push_name: existingContact.push_name || 'NULL',
          phone_number: existingContact.phone_number
        });
        
        // Actualizar datos si hay cambios
        if (contactData.name || contactData.push_name || contactData.profile_picture_url) {
          console.log(`🔄 Actualizando contacto con nuevos datos...`);
          
          const updateData = {
            name: contactData.name || existingContact.name,
            push_name: contactData.push_name || existingContact.push_name,
            profile_picture_url: contactData.profile_picture_url || existingContact.profile_picture_url,
            is_business: contactData.is_business ?? existingContact.is_business,
            is_enterprise: contactData.is_enterprise ?? existingContact.is_enterprise,
            metadata: contactData.metadata || existingContact.metadata
          };
          
          console.log(`📝 Datos de actualización:`, JSON.stringify(updateData, null, 2));
          
          const { data: updatedContact, error: updateError } = await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', existingContact.id)
            .select()
            .single();

          if (updateError) throw updateError;
          
          console.log(`✅ Contacto actualizado exitosamente`);
          console.log(`==========================================\n`);
          return updatedContact;
        }
        console.log(`➡️ No hay datos nuevos para actualizar`);
        console.log(`==========================================\n`);
        return existingContact;
      }

      // Crear nuevo contacto
      console.log(`🆕 Creando nuevo contacto...`);
      
      const insertData = {
        bot_id: botId,
        phone_number: phoneNumber,
        name: contactData.name || null,
        push_name: contactData.push_name || null,
        profile_picture_url: contactData.profile_picture_url || null,
        is_business: contactData.is_business || false,
        is_enterprise: contactData.is_enterprise || false,
        metadata: contactData.metadata || {}
      };
      
      console.log(`📝 Datos de inserción:`, JSON.stringify(insertData, null, 2));
      
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert([insertData])
        .select()
        .single();

      if (createError) throw createError;
      
      console.log(`✅ Contacto creado exitosamente: ID ${newContact.id}`);
      console.log(`==========================================\n`);
      return newContact;
    } catch (error) {
      console.error('Error en getOrCreateContact:', error);
      throw error;
    }
  }

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

  /**
   * Obtiene todos los contactos de un bot
   */
  async getContactsByBot(botId) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getContactsByBot:', error);
      throw error;
    }
  }

  /**
   * Busca contactos por nombre o teléfono
   */
  async searchContacts(botId, query) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .or(`name.ilike.%${query}%,phone_number.ilike.%${query}%,push_name.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en searchContacts:', error);
      throw error;
    }
  }

  /**
   * Obtiene contactos con datos incompletos (sin nombre o foto)
   */
  async getContactsWithMissingData(botId) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .or('name.is.null,profile_picture_url.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getContactsWithMissingData:', error);
      throw error;
    }
  }

  /**
   * Verifica si un contacto necesita actualización de datos
   */
  needsDataUpdate(contact) {
    return !contact.name || !contact.profile_picture_url || !contact.push_name;
  }
}

export default new ContactService();
