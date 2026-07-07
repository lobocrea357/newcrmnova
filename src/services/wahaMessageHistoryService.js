import wahaClient from '../config/waha.js';
import WahaContactService from './wahaContactService.js';
import supabase from '../config/supabase.js';
import { BotService } from './botService.js';
import { ContactService } from './contactService.js';
import { ChatService } from './chatService.js';
import { MessageService } from './messageService.js';
import { MediaService } from './mediaService.js';

const botService = new BotService();
const contactService = new ContactService();
const chatService = new ChatService();
const messageService = new MessageService();
const mediaService = new MediaService();

/**
 * Servicio de sincronización COMPLETA desde WAHA
 */
export class WahaMessageHistoryService {
  
  /**
   * Obtiene o crea un contacto desde WAHA con datos completos
   */
  async getOrCreateContactFromWaha(botId, sessionName, chatId, wahaChat = null) {
    try {
      const contactNumber = chatId.split('@')[0];
      
      // Buscar contacto existente
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('bot_id', botId)
        .eq('phone_number', contactNumber)
        .maybeSingle();

      // Si existe y tiene datos completos, retornarlo
      if (existingContact && existingContact.name && existingContact.profile_picture_url) {
        return existingContact;
      }

      // Obtener datos completos desde WAHA
      const wahaData = await WahaContactService.getFullContactData(sessionName, chatId);
      
      // Combinar con datos del chat si existen
      const finalData = {
        name: wahaData.name || wahaChat?.name || null,
        push_name: wahaData.push_name || wahaChat?.name || null,
        profile_picture_url: wahaData.profile_picture_url,
        is_business: wahaData.is_business,
        is_enterprise: wahaData.is_enterprise
      };

      // Crear o actualizar
      if (existingContact) {
        const { data: updated } = await supabase
          .from('contacts')
          .update({
            ...finalData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContact.id)
          .select()
          .single();
        
        return updated;
      } else {
        return await contactService.getOrCreateContact(botId, contactNumber, finalData);
      }
    } catch (error) {
      console.error('Error en getOrCreateContactFromWaha:', error);
      return null;
    }
  }

  /**
   * Procesa multimedia de un mensaje
   */
  async processMediaForMessage(botId, messageId, messageData, sessionName, transcribeAudio = true) {
    try {
      if (!messageData.hasMedia || !messageData.mediaUrl) {
        return null;
      }

      const wahaApiKey = process.env.WAHA_API_KEY;
      const fileName = `${messageData.id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const messageType = messageData.type || 'unknown';

      // Descargar y subir a Supabase
      const mediaData = await mediaService.processAndUploadMedia(
        messageData.mediaUrl,
        fileName,
        messageType,
        wahaApiKey
      );

      // Guardar referencia
      const savedMedia = await mediaService.saveMediaFile(botId, messageId, mediaData);

      // Transcribir audio si aplica
      if (transcribeAudio && (messageType === 'audio' || messageType === 'ptt' || messageType === 'voice')) {
        const { TranscriptionService } = await import('./transcriptionService.js');
        const transcriptionService = new TranscriptionService();
        
        transcriptionService.processAudioMessage(
          mediaData.publicUrl,
          messageId,
          botId,
          wahaApiKey
        ).catch(err => console.error('Error transcribiendo:', err.message));
      }

      return savedMedia;
    } catch (error) {
      console.error('Error procesando media:', error);
      return null;
    }
  }

  /**
   * Sincroniza todos los mensajes de un chat específico
   */
  async syncChatMessages(sessionName, chatId, options = {}) {
    const { limit = 100, includeMedia = true, transcribeAudio = true } = options;

    try {
      // Obtener bot
      const { data: bot } = await supabase
        .from('bots')
        .select('*')
        .eq('session_name', sessionName)
        .single();

      if (!bot) throw new Error(`Bot no encontrado: ${sessionName}`);

      const contactNumber = chatId.split('@')[0];
      console.log(`\n📱 Sincronizando chat: ${contactNumber}`);

      // Obtener mensajes desde WAHA con contenido completo (optimizado para remoto)
      const isRemoteServer = process.env.WAHA_BASE_URL && !process.env.WAHA_BASE_URL.includes('localhost');
      const messageLimit = Math.min(limit, isRemoteServer ? 200 : 100); // Límite optimizado para remoto
      
      const messagesResponse = await wahaClient.get('/api/messages', {
        params: {
          session: sessionName,
          chatId: chatId,
          limit: messageLimit,
          downloadMedia: false,
          includeBody: true,
          includeText: true,
          // Parámetros adicionales para servidor remoto
          format: 'json',
          includeQuoted: false // Reducir tamaño de respuesta
        },
        timeout: 180000 // 3 minutos para obtener mensajes de servidor remoto
      });

      const messages = messagesResponse.data || [];
      console.log(`   📊 Mensajes encontrados: ${messages.length}`);

      const stats = {
        total: messages.length,
        saved: 0,
        skipped: 0,
        fixed: 0,
        media: 0,
        errors: 0
      };

      // Obtener o crear contacto
      const contact = await this.getOrCreateContactFromWaha(bot.id, sessionName, chatId);
      
      // Obtener o crear chat
      const chat = await chatService.getOrCreateChat(
        bot.id,
        chatId,
        contact?.id,
        { name: contact?.name || contactNumber }
      );

      // Procesar cada mensaje
      for (const msg of messages) {
        try {
          // Verificar si existe y obtener datos completos
          const { data: existing } = await supabase
            .from('messages')
            .select('id, from_me, from_number, to_number, body, content')
            .eq('message_id', msg.id)
            .maybeSingle();

          // Determinar from_me correcto basándose en números de teléfono
          const correctFromMe = msg.from?.split('@')[0] === bot.phone_number;
          
          // Obtener contenido correcto del mensaje
          const correctContent = msg.body || msg.text || msg.caption || msg.content || '';
          
          if (existing) {
            let needsUpdate = false;
            let updateData = {};
            
            // Verificar si from_me está correcto
            if (existing.from_me !== correctFromMe) {
              console.log(`🔧 Corrigiendo from_me: ${msg.id} (${existing.from_me} → ${correctFromMe})`);
              updateData.from_me = correctFromMe;
              needsUpdate = true;
            }
            
            // Verificar si el contenido está vacío o incorrecto
            const currentContent = existing.body || existing.content || '';
            if (!currentContent && correctContent) {
              console.log(`📝 Agregando contenido faltante: ${msg.id} - "${correctContent.substring(0, 50)}..."`);
              updateData.body = correctContent;
              updateData.content = correctContent;
              needsUpdate = true;
            } else if (currentContent !== correctContent && correctContent) {
              console.log(`📝 Actualizando contenido: ${msg.id}`);
              updateData.body = correctContent;
              updateData.content = correctContent;
              needsUpdate = true;
            }
            
            // Aplicar actualizaciones si es necesario
            if (needsUpdate) {
              await supabase
                .from('messages')
                .update(updateData)
                .eq('id', existing.id);
                
              stats.fixed = (stats.fixed || 0) + 1;
              console.log(`   ✅ Mensaje actualizado: ${Object.keys(updateData).join(', ')}`);
            } else {
              console.log(`Mensaje duplicado (sin cambios): ${correctFromMe}_${chatId}_${msg.id}`);
            }
            
            stats.skipped++;
            continue;
          }

          // Asegurar que el mensaje tenga from_me correcto antes de guardarlo
          msg.fromMe = correctFromMe;

          // Guardar mensaje
          const saved = await messageService.saveMessage(bot.id, chat.id, contact?.id, msg);

          if (saved) {
            stats.saved++;

            // Procesar media
            if (includeMedia && msg.hasMedia && msg.mediaUrl) {
              await this.processMediaForMessage(bot.id, saved.id, msg, sessionName, transcribeAudio);
              stats.media++;
            }
          }
        } catch (error) {
          console.error(`   ❌ Error con mensaje ${msg.id}:`, error.message);
          stats.errors++;
        }
      }

      console.log(`   ✅ Guardados: ${stats.saved} | Omitidos: ${stats.skipped} | Corregidos: ${stats.fixed} | Media: ${stats.media} | Errores: ${stats.errors}`);
      
      if (stats.fixed > 0) {
        console.log(`   🔧 Se corrigieron ${stats.fixed} mensajes (from_me y/o contenido)`);
      }
      
      return stats;

    } catch (error) {
      console.error('Error en syncChatMessages:', error);
      throw error;
    }
  }

  /**
   * Sincroniza TODOS los mensajes de TODOS los chats
   */
  async syncAllMessages(sessionName, options = {}) {
    const { limit = 100, includeMedia = true, transcribeAudio = true } = options;

    try {
      console.log(`\n🚀 ========== SINCRONIZACIÓN COMPLETA ==========`);
      console.log(`Session: ${sessionName}\n`);

      // Obtener bot
      const { data: bot } = await supabase
        .from('bots')
        .select('*')
        .eq('session_name', sessionName)
        .single();

      if (!bot) throw new Error(`Bot no encontrado: ${sessionName}`);

      // Obtener todos los chats del bot (optimizado para servidor remoto)
      console.log('📊 Obteniendo chats desde WAHA remoto...');
      
      // Ajustar límite según si es servidor remoto
      const isRemoteServer = process.env.WAHA_BASE_URL && !process.env.WAHA_BASE_URL.includes('localhost');
      const chatLimit = isRemoteServer ? 500 : 100; // Más chats para servidor remoto optimizado
      
      const chatsResponse = await wahaClient.get(`/api/${sessionName}/chats`, {
        params: { 
          limit: chatLimit,
          // Parámetros adicionales para optimizar respuesta remota
          includeLastMessage: false, // Reducir tamaño de respuesta
          onlyWithMessages: true // Solo chats con mensajes
        },
        timeout: 120000 // 2 minutos para obtener chats de servidor remoto
      });

      const wahaChats = chatsResponse.data || [];
      console.log(`✅ Chats encontrados: ${wahaChats.length}\n`);

      const globalStats = {
        chats: 0,
        messages: 0,
        media: 0,
        errors: 0
      };

      // Procesar cada chat
      for (const wahaChat of wahaChats) {
        try {
          const chatId = wahaChat.id?._serialized || wahaChat.id;
          
          const chatStats = await this.syncChatMessages(sessionName, chatId, {
            limit,
            includeMedia,
            transcribeAudio
          });

          globalStats.chats++;
          globalStats.messages += chatStats.saved;
          globalStats.media += chatStats.media;
          globalStats.errors += chatStats.errors;

          // Pausa entre chats (ajustada para servidor remoto)
          const isRemoteServer = process.env.WAHA_BASE_URL && !process.env.WAHA_BASE_URL.includes('localhost');
          const pauseTime = isRemoteServer ? 500 : 200; // Pausa más larga para servidor remoto
          await new Promise(resolve => setTimeout(resolve, pauseTime));

        } catch (error) {
          console.error(`❌ Error procesando chat:`, error.message);
          globalStats.errors++;
        }
      }

      console.log(`\n✅ ========== COMPLETADO ==========`);
      console.log(`   Chats: ${globalStats.chats}`);
      console.log(`   Mensajes: ${globalStats.messages}`);
      console.log(`   Media: ${globalStats.media}`);
      console.log(`   Errores: ${globalStats.errors}\n`);

      return {
        success: true,
        stats: globalStats
      };

    } catch (error) {
      console.error('Error en syncAllMessages:', error);
      throw error;
    }
  }
}

export default new WahaMessageHistoryService();
