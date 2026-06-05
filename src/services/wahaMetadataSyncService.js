import wahaClient from '../config/waha.js';
import WahaContactService from './wahaContactService.js';
import contactService from './contactService.js';
import chatService from './chatService.js';
import botService from './botService.js';
import supabase from '../config/supabase.js';

/**
 * Servicio de sincronización de datos desde WAHA
 * 
 * ⚠️ IMPORTANTE: Este servicio SOLO actualiza datos NULL o desactualizados
 * NO crea duplicados ni modifica mensajes existentes
 */
export class WahaMetadataSyncService {
  
  /**
   * Lista todas las sesiones disponibles en WAHA
   */
  async listAllSessions() {
    try {
      const response = await wahaClient.get('/api/sessions?all=true');
      return response.data || [];
    } catch (error) {
      console.error('❌ Error listando sesiones de WAHA:', error.message);
      return [];
    }
  }

  /**
   * Verifica si una sesión existe y está activa en WAHA
   * Retorna el status de la sesión si existe, null si no existe, o lanza error en otros casos
   */
  async checkSessionExists(sessionName) {
    try {
      const response = await wahaClient.get(`/api/sessions/${sessionName}`);
      return response.data && response.data.status;
    } catch (error) {
      // 404 = Session not found, 422 = Session does not exist
      if (error.response?.status === 404 || error.response?.status === 422) {
        return null; // Sesión no existe
      }
      throw error;
    }
  }

  /**
   * Sincroniza todos los contactos de un bot con datos de WAHA
   * Solo actualiza contactos que tienen campos NULL
   */
  async syncContacts(sessionName) {
    try {
      console.log(`\n🔄 Iniciando sincronización de contactos: ${sessionName}`);
      
      // 1. Obtener el bot
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('session_name', sessionName)
        .single();

      if (botError || !bot) {
        throw new Error(`Bot no encontrado en la base de datos: ${sessionName}`);
      }

      console.log(`✅ Bot encontrado: ${bot.name} (${bot.id})`);

      // 2. Verificar que la sesión existe en WAHA
      console.log(`🔍 Verificando sesión en WAHA...`);
      const sessionStatus = await this.checkSessionExists(sessionName);
      
      if (!sessionStatus) {
        // Listar sesiones disponibles para ayudar al usuario
        const availableSessions = await this.listAllSessions();
        const sessionNames = availableSessions.map(s => `${s.name} (${s.status})`).join(', ') || 'ninguna';
        
        throw new Error(
          `❌ La sesión "${sessionName}" NO existe en WAHA.\n\n` +
          `Sesiones disponibles: ${sessionNames}\n\n` +
          `Para sincronizar, debes:\n` +
          `  1. Ir a WAHA (http://localhost:3000)\n` +
          `  2. Crear/conectar la sesión "${sessionName}"\n` +
          `  3. Escanear el código QR\n` +
          `  4. Esperar que el estado sea "WORKING"\n` +
          `  5. Intentar la sincronización nuevamente`
        );
      }

      console.log(`✅ Sesión activa en WAHA (estado: ${sessionStatus})`);

      // 3. Obtener contactos existentes en la BD
      const existingContacts = await contactService.getContactsByBot(bot.id);
      console.log(`📊 Contactos en BD: ${existingContacts.length}`);

      // 3. Obtener contactos desde WAHA
      let wahaContacts = [];
      try {
        const response = await wahaClient.get('/api/contacts/all', {
          params: { session: sessionName }
        });
        wahaContacts = response.data || [];
        console.log(`📊 Contactos en WAHA: ${wahaContacts.length}`);
      } catch (error) {
        console.warn(`⚠️ No se pudieron obtener contactos desde WAHA:`, error.message);
        console.log(`ℹ️ Se actualizarán solo con datos individuales de cada contacto`);
        // Continuar con los contactos existentes en BD
      }

      const stats = {
        total: existingContacts.length,
        updated: 0,
        skipped: 0,
        errors: 0
      };

      // 4. Actualizar cada contacto que tenga campos NULL
      for (const contact of existingContacts) {
        try {
          // Verificar si el contacto necesita actualización
          const needsUpdate = !contact.name || !contact.push_name || !contact.profile_picture_url;
          
          if (!needsUpdate) {
            console.log(`   ⏭️  ${contact.phone_number} - Ya tiene datos completos`);
            stats.skipped++;
            continue;
          }

          console.log(`   🔄 Actualizando ${contact.phone_number}...`);

          // Obtener datos completos desde WAHA
          const contactId = `${contact.phone_number}@c.us`;
          const wahaData = await WahaContactService.getFullContactData(sessionName, contactId);

          // Solo actualizar si hay datos nuevos
          if (wahaData.name || wahaData.push_name || wahaData.profile_picture_url) {
            const { error: updateError } = await supabase
              .from('contacts')
              .update({
                name: wahaData.name || contact.name,
                push_name: wahaData.push_name || contact.push_name,
                profile_picture_url: wahaData.profile_picture_url || contact.profile_picture_url,
                is_business: wahaData.is_business ?? contact.is_business,
                is_enterprise: wahaData.is_enterprise ?? contact.is_enterprise,
                updated_at: new Date().toISOString()
              })
              .eq('id', contact.id);

            if (updateError) {
              throw updateError;
            }

            console.log(`      ✅ ${wahaData.name || 'Sin nombre'}`);
            stats.updated++;
          } else {
            console.log(`      ⚠️  Sin datos disponibles en WAHA`);
            stats.skipped++;
          }

          // Pequeña pausa para no saturar la API de WAHA
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`      ❌ Error actualizando ${contact.phone_number}:`, error.message);
          stats.errors++;
        }
      }

      console.log(`\n✅ Sincronización completada:`);
      console.log(`   Total: ${stats.total}`);
      console.log(`   Actualizados: ${stats.updated}`);
      console.log(`   Omitidos: ${stats.skipped}`);
      console.log(`   Errores: ${stats.errors}\n`);

      return stats;
    } catch (error) {
      console.error('❌ Error en syncContacts:', error);
      throw error;
    }
  }

  /**
   * Sincroniza todos los chats de un bot con datos de WAHA
   * Actualiza nombres, últimos mensajes y otros metadatos
   */
  async syncChats(sessionName) {
    try {
      console.log(`\n🔄 Iniciando sincronización de chats: ${sessionName}`);
      
      // 1. Obtener el bot
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('session_name', sessionName)
        .single();

      if (botError || !bot) {
        throw new Error(`Bot no encontrado en la base de datos: ${sessionName}`);
      }

      console.log(`✅ Bot encontrado: ${bot.name} (${bot.id})`);

      // 2. Verificar que la sesión existe en WAHA
      console.log(`🔍 Verificando sesión en WAHA...`);
      const sessionStatus = await this.checkSessionExists(sessionName);
      
      if (!sessionStatus) {
        // Listar sesiones disponibles para ayudar al usuario
        const availableSessions = await this.listAllSessions();
        const sessionNames = availableSessions.map(s => `${s.name} (${s.status})`).join(', ') || 'ninguna';
        
        throw new Error(
          `❌ La sesión "${sessionName}" NO existe en WAHA.\n\n` +
          `Sesiones disponibles: ${sessionNames}\n\n` +
          `Para sincronizar, debes:\n` +
          `  1. Ir a WAHA (http://localhost:3000)\n` +
          `  2. Crear/conectar la sesión "${sessionName}"\n` +
          `  3. Escanear el código QR\n` +
          `  4. Esperar que el estado sea "WORKING"\n` +
          `  5. Intentar la sincronización nuevamente`
        );
      }

      console.log(`✅ Sesión activa en WAHA (estado: ${sessionStatus})`);

      // 3. Obtener chats existentes en la BD
      const existingChats = await chatService.getChatsByBot(bot.id);
      console.log(`📊 Chats en BD: ${existingChats.length}`);

      // 3. Obtener overview de chats desde WAHA
      let wahaChats = [];
      try {
        const response = await wahaClient.get(`/api/${sessionName}/chats/overview`, {
          params: { limit: 100 }
        });
        wahaChats = response.data || [];
        console.log(`📊 Chats en WAHA: ${wahaChats.length}`);
      } catch (error) {
        console.warn(`⚠️ No se pudieron obtener chats desde WAHA:`, error.message);
        console.log(`ℹ️ Se actualizarán solo los campos básicos sin datos de WAHA`);
      }

      const stats = {
        total: existingChats.length,
        updated: 0,
        skipped: 0,
        errors: 0
      };

      // 4. Actualizar cada chat
      for (const chat of existingChats) {
        try {
          // Buscar el chat en WAHA por contact_number
          const wahaChat = wahaChats.find(wc => {
            const wahaNumber = wc.id?.user || wc.id?._serialized?.split('@')[0];
            return wahaNumber === chat.contact_number;
          });

          // Verificar si el chat necesita actualización
          const needsUpdate = !chat.name || !chat.last_message || !chat.chat_id || !chat.contact_id;
          
          if (!needsUpdate && !wahaChat) {
            console.log(`   ⏭️  ${chat.contact_number} - Ya tiene datos completos`);
            stats.skipped++;
            continue;
          }

          console.log(`   🔄 Actualizando chat ${chat.contact_number}...`);

          const updateData = {
            updated_at: new Date().toISOString()
          };

          // Actualizar nombre si está NULL
          if (!chat.name && wahaChat?.name) {
            updateData.name = wahaChat.name;
            updateData.contact_name = wahaChat.name;
          }

          // Actualizar chat_id si está NULL
          if (!chat.chat_id && chat.contact_number) {
            updateData.chat_id = `${chat.contact_number}@c.us`;
          }

          // Actualizar último mensaje desde WAHA
          if (wahaChat?.lastMessage) {
            updateData.last_message = wahaChat.lastMessage.body?.substring(0, 100) || '[Media]';
            if (wahaChat.lastMessage.timestamp) {
              const timestamp = new Date(wahaChat.lastMessage.timestamp * 1000).toISOString();
              updateData.last_message_at = timestamp;
              updateData.last_message_time = timestamp;
            }
          }

          // Actualizar metadatos adicionales
          if (wahaChat) {
            if (wahaChat.archived !== undefined) updateData.archived = wahaChat.archived;
            if (wahaChat.pinned !== undefined) updateData.pinned = wahaChat.pinned;
            if (wahaChat.muted !== undefined) updateData.muted = wahaChat.muted;
          }

          // Actualizar contact_id si está NULL
          if (!chat.contact_id && chat.contact_number) {
            // Buscar el contacto en la BD
            const { data: relatedContact } = await supabase
              .from('contacts')
              .select('id')
              .eq('bot_id', bot.id)
              .eq('phone_number', chat.contact_number)
              .maybeSingle();

            if (relatedContact) {
              updateData.contact_id = relatedContact.id;
            }
          }

          // Aplicar actualización
          const { error: updateError } = await supabase
            .from('chats')
            .update(updateData)
            .eq('id', chat.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`      ✅ ${updateData.name || chat.contact_number}`);
          stats.updated++;

          // Pequeña pausa
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.error(`      ❌ Error actualizando chat ${chat.contact_number}:`, error.message);
          stats.errors++;
        }
      }

      console.log(`\n✅ Sincronización completada:`);
      console.log(`   Total: ${stats.total}`);
      console.log(`   Actualizados: ${stats.updated}`);
      console.log(`   Omitidos: ${stats.skipped}`);
      console.log(`   Errores: ${stats.errors}\n`);

      return stats;
    } catch (error) {
      console.error('❌ Error en syncChats:', error);
      throw error;
    }
  }

  /**
   * Sincroniza todo: bot, contactos y chats
   */
  async syncAll(sessionName) {
    try {
      console.log(`\n🚀 ========== SINCRONIZACIÓN COMPLETA ==========`);
      console.log(`Session: ${sessionName}\n`);

      // 0. Verificar que la sesión existe en WAHA PRIMERO
      console.log(`🔍 Verificando sesión en WAHA...`);
      const sessionStatus = await this.checkSessionExists(sessionName);
      
      if (!sessionStatus) {
        // Listar sesiones disponibles para ayudar al usuario
        const availableSessions = await this.listAllSessions();
        const sessionNames = availableSessions.map(s => `${s.name} (${s.status})`).join(', ') || 'ninguna';
        
        throw new Error(
          `❌ La sesión "${sessionName}" NO existe en WAHA.\n\n` +
          `Sesiones disponibles: ${sessionNames}\n\n` +
          `Para sincronizar, el bot debe estar:\n` +
          `  1. Creado/conectado en WAHA (http://localhost:3000)\n` +
          `  2. Con código QR escaneado\n` +
          `  3. Con estado "WORKING"\n\n` +
          `Por favor, verifica/conecta el bot en WAHA primero.`
        );
      }

      console.log(`✅ Sesión verificada en WAHA (estado: ${sessionStatus})\n`);

      const results = {
        bot: null,
        contacts: null,
        chats: null
      };

      // 1. Sincronizar bot (solo actualizar phone_number si es "pending")
      try {
        const { data: bot } = await supabase
          .from('bots')
          .select('*')
          .eq('session_name', sessionName)
          .single();

        if (bot && bot.phone_number === 'pending') {
          console.log(`🔄 Actualizando número de teléfono del bot...`);
          
          // Obtener info de sesión desde WAHA
          const sessionResponse = await wahaClient.get(`/api/sessions/${sessionName}`);
          const phoneNumber = sessionResponse.data?.me?.id?.split('@')[0];

          if (phoneNumber) {
            await supabase
              .from('bots')
              .update({ 
                phone_number: phoneNumber,
                updated_at: new Date().toISOString()
              })
              .eq('id', bot.id);

            console.log(`✅ Número del bot actualizado: ${phoneNumber}\n`);
            results.bot = { updated: true, phoneNumber };
          }
        }
      } catch (error) {
        console.warn(`⚠️ No se pudo actualizar el bot:`, error.message);
      }

      // 2. Sincronizar contactos
      results.contacts = await this.syncContacts(sessionName);

      // 3. Sincronizar chats
      results.chats = await this.syncChats(sessionName);

      console.log(`\n✅ ========== SINCRONIZACIÓN COMPLETADA ==========\n`);

      return results;
    } catch (error) {
      console.error('❌ Error en syncAll:', error);
      throw error;
    }
  }
}

export default new WahaMetadataSyncService();
