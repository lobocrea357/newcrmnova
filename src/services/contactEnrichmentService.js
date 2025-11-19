import supabase from '../config/supabase.js';
import WahaContactService from './wahaContactService.js';

/**
 * Servicio para enriquecer contactos con datos faltantes
 * Se ejecuta automáticamente para llenar nombres y fotos NULL
 */
export class ContactEnrichmentService {
  
  /**
   * Enriquece TODOS los contactos de TODOS los bots que tengan datos NULL
   */
  async enrichAllContactsWithNullData() {
    try {
      console.log(`\n🔍 Buscando contactos con datos faltantes...`);
      
      // Obtener todos los bots activos
      const { data: bots, error: botsError } = await supabase
        .from('bots')
        .select('id, session_name, status')
        .eq('status', 'working');

      if (botsError || !bots || bots.length === 0) {
        console.log('   ℹ️  No hay bots activos');
        return { total: 0, updated: 0 };
      }

      let totalProcessed = 0;
      let totalUpdated = 0;

      for (const bot of bots) {
        const result = await this.enrichContactsForBot(bot);
        totalProcessed += result.processed;
        totalUpdated += result.updated;
      }

      console.log(`\n✅ Enriquecimiento completado:`);
      console.log(`   📊 Procesados: ${totalProcessed}`);
      console.log(`   ✅ Actualizados: ${totalUpdated}\n`);

      return { total: totalProcessed, updated: totalUpdated };

    } catch (error) {
      console.error('❌ Error en enrichAllContactsWithNullData:', error);
      throw error;
    }
  }

  /**
   * Enriquece contactos de un bot específico
   */
  async enrichContactsForBot(bot) {
    try {
      console.log(`\n📱 Bot: ${bot.session_name}`);

      // Obtener contactos con datos NULL
      const { data: contactsWithNullData, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', bot.id)
        .or('name.is.null,profile_picture_url.is.null');

      if (error) throw error;

      if (!contactsWithNullData || contactsWithNullData.length === 0) {
        console.log(`   ✅ Todos los contactos tienen datos completos`);
        return { processed: 0, updated: 0 };
      }

      console.log(`   🔍 Contactos con datos faltantes: ${contactsWithNullData.length}`);

      let updated = 0;

      for (const contact of contactsWithNullData) {
        try {
          const contactId = `${contact.phone_number}@c.us`;
          
          // Obtener datos completos desde WAHA
          const wahaData = await WahaContactService.getFullContactData(bot.session_name, contactId);

          // Solo actualizar si obtuvimos datos nuevos
          const hasNewData = 
            (wahaData.name && !contact.name) ||
            (wahaData.push_name && !contact.push_name) ||
            (wahaData.profile_picture_url && !contact.profile_picture_url);

          if (hasNewData) {
            const updateData = {
              updated_at: new Date().toISOString()
            };

            // Solo actualizar campos que están NULL
            if (!contact.name && wahaData.name) {
              updateData.name = wahaData.name;
            }
            if (!contact.push_name && wahaData.push_name) {
              updateData.push_name = wahaData.push_name;
            }
            if (!contact.profile_picture_url && wahaData.profile_picture_url) {
              updateData.profile_picture_url = wahaData.profile_picture_url;
            }
            if (wahaData.is_business !== undefined) {
              updateData.is_business = wahaData.is_business;
            }
            if (wahaData.is_enterprise !== undefined) {
              updateData.is_enterprise = wahaData.is_enterprise;
            }

            await supabase
              .from('contacts')
              .update(updateData)
              .eq('id', contact.id);

            updated++;
            console.log(`      ✅ ${contact.phone_number} → ${wahaData.name || 'foto actualizada'}`);
          }

          // Pausa para no saturar la API
          await new Promise(resolve => setTimeout(resolve, 150));

        } catch (error) {
          console.error(`      ⚠️ Error con ${contact.phone_number}:`, error.message);
        }
      }

      console.log(`   ✅ Actualizados: ${updated}/${contactsWithNullData.length}`);

      return { processed: contactsWithNullData.length, updated };

    } catch (error) {
      console.error(`❌ Error en enrichContactsForBot:`, error);
      return { processed: 0, updated: 0 };
    }
  }

  /**
   * Enriquece un contacto específico si tiene datos NULL
   */
  async enrichContact(botId, contactId) {
    try {
      // Obtener contacto
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*, bots(session_name)')
        .eq('id', contactId)
        .single();

      if (error || !contact) {
        console.log(`⚠️ Contacto no encontrado: ${contactId}`);
        return null;
      }

      // Verificar si necesita actualización
      if (contact.name && contact.profile_picture_url) {
        console.log(`✅ Contacto ya tiene datos completos`);
        return contact;
      }

      console.log(`🔍 Enriqueciendo contacto: ${contact.phone_number}`);

      const wahaContactId = `${contact.phone_number}@c.us`;
      const wahaData = await WahaContactService.getFullContactData(
        contact.bots.session_name,
        wahaContactId
      );

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (!contact.name && wahaData.name) {
        updateData.name = wahaData.name;
      }
      if (!contact.push_name && wahaData.push_name) {
        updateData.push_name = wahaData.push_name;
      }
      if (!contact.profile_picture_url && wahaData.profile_picture_url) {
        updateData.profile_picture_url = wahaData.profile_picture_url;
      }
      if (wahaData.is_business !== undefined) {
        updateData.is_business = wahaData.is_business;
      }
      if (wahaData.is_enterprise !== undefined) {
        updateData.is_enterprise = wahaData.is_enterprise;
      }

      const { data: updated, error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log(`✅ Contacto enriquecido: ${updated.name || updated.phone_number}`);

      return updated;

    } catch (error) {
      console.error('❌ Error en enrichContact:', error);
      throw error;
    }
  }

  /**
   * Enriquece contactos de un chat específico
   */
  async enrichContactsInChat(chatId) {
    try {
      console.log(`\n💬 Enriqueciendo contactos del chat: ${chatId}`);

      // Obtener el chat con su bot
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*, bots(id, session_name), contacts(*)')
        .eq('id', chatId)
        .single();

      if (chatError || !chat) {
        console.log(`⚠️ Chat no encontrado`);
        return null;
      }

      // Enriquecer el contacto del chat si tiene datos NULL
      if (chat.contacts && (!chat.contacts.name || !chat.contacts.profile_picture_url)) {
        await this.enrichContact(chat.bots.id, chat.contacts.id);
      }

      console.log(`✅ Chat enriquecido`);

      return chat;

    } catch (error) {
      console.error('❌ Error en enrichContactsInChat:', error);
      throw error;
    }
  }
}

export default new ContactEnrichmentService();
