import supabase from '../config/supabase.js';
import { BotService } from './botService.js';
import { ContactService } from './contactService.js';
import { ChatService } from './chatService.js';
import { MessageService } from './messageService.js';
import { MediaService } from './mediaService.js';
import { TranscriptionService } from './transcriptionService.js';

const botService = new BotService();
const contactService = new ContactService();
const chatService = new ChatService();
const messageService = new MessageService();
const mediaService = new MediaService();
const transcriptionService = new TranscriptionService();

export class WebhookService {
  /**
   * Procesa un webhook de WAHA
   */
  async processWebhook(event) {
    try {
      console.log(`\n🔔 Webhook recibido [${event.event}]:`, {
        session: event.session,
        event: event.event,
        timestamp: new Date().toISOString()
      });

      // Guardar evento en la base de datos
      await this.saveWebhookEvent(event);

      // Procesar según el tipo de evento
      switch (event.event) {
        case 'session.status':
          await this.handleSessionStatus(event);
          break;
        
        case 'message':
        case 'message.any':
          await this.handleMessage(event);
          break;
        
        case 'message.ack':
          await this.handleMessageAck(event);
          break;
        
        case 'message.reaction':
          await this.handleMessageReaction(event);
          break;
        
        default:
          console.log(`⚠️ Evento no manejado: ${event.event}`);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error procesando webhook:', error);
      throw error;
    }
  }

  /**
   * Guarda el evento de webhook en la base de datos
   */
  async saveWebhookEvent(event) {
    try {
      const { error } = await supabase
        .from('webhook_events')
        .insert([{
          event_type: event.event,
          session_name: event.session,
          payload: event.payload,
          created_at: new Date().toISOString()
        }]);

      if (error && error.code !== '23505') { // Ignorar duplicados
        console.error('Error guardando webhook event:', error);
      }
    } catch (error) {
      console.error('Error en saveWebhookEvent:', error);
    }
  }

  /**
   * Maneja cambios de estado de sesión
   */
  async handleSessionStatus(event) {
    try {
      const { session, payload } = event;
      const status = payload.status;

      console.log(`📊 Estado de sesión: ${session} -> ${status}`);

      // Actualizar estado del bot
      await botService.updateBotStatus(session, status);

      console.log(`✅ Estado de sesión actualizado: ${session} -> ${status}`);
    } catch (error) {
      console.error('Error en handleSessionStatus:', error);
      throw error;
    }
  }

  /**
   * Maneja eventos de mensajes (LÓGICA MEJORADA)
   */
  async handleMessage(event) {
    try {
      const { session, payload } = event;

      console.log(`\n📨 ========== PROCESANDO MENSAJE ==========`);
      console.log(`Evento: ${event.event}`);
      console.log(`ID: ${payload.id}`);
      console.log(`From: ${payload.from}`);
      console.log(`To: ${payload.to}`);
      console.log(`FromMe: ${payload.fromMe}`);
      console.log(`Type: ${payload.type}`);
      console.log(`HasMedia: ${payload.hasMedia}`);
      console.log(`Body: ${payload.body?.substring(0, 50)}...`);
      console.log(`==========================================\n`);

      // PASO 1: Obtener o crear BOT
      const bot = await this.getOrCreateBot(session, payload);
      console.log(`✅ Bot obtenido: ${bot.session_name} (ID: ${bot.id})`);

      // PASO 2: Obtener o crear CONTACTO
      const contact = await this.getOrCreateContact(bot.id, payload);
      console.log(`✅ Contacto obtenido: ${contact.phone_number} (ID: ${contact.id})`);

      // PASO 3: Obtener o crear CHAT
      const chat = await this.getOrCreateChat(bot.id, contact.id, payload);
      console.log(`✅ Chat obtenido: ${chat.chat_id} (ID: ${chat.id})`);

      // PASO 4: Guardar MENSAJE
      const savedMessage = await this.saveMessage(bot.id, chat.id, contact.id, payload);
      
      if (!savedMessage) {
        console.log(`⚠️ Mensaje duplicado, omitiendo procesamiento`);
        return;
      }
      
      console.log(`✅ Mensaje guardado: ${savedMessage.id}`);

      // PASO 5: Procesar MULTIMEDIA (si existe)
      if (payload.hasMedia) {
        await this.processMedia(bot.id, savedMessage.id, payload);
      }

      console.log(`\n✅ ========== MENSAJE PROCESADO EXITOSAMENTE ==========\n`);

    } catch (error) {
      console.error('❌ Error en handleMessage:', error);
      throw error;
    }
  }

  /**
   * Obtiene o crea el bot
   */
  async getOrCreateBot(session, payload) {
    try {
      // Extraer número de teléfono del bot
      let phoneNumber = 'pending';
      
      if (payload.me?.id) {
        phoneNumber = payload.me.id.split('@')[0];
      } else if (payload.me?.user) {
        phoneNumber = payload.me.user;
      } else if (payload.from && payload.fromMe) {
        // Si es mensaje saliente, el 'from' podría no ser el bot
        // Intentar obtener de otros campos
        phoneNumber = payload.from.split('@')[0];
      }

      console.log(`🔍 Número del bot: ${phoneNumber}`);

      return await botService.getOrCreateBot(session, phoneNumber);
    } catch (error) {
      console.error('Error en getOrCreateBot:', error);
      throw error;
    }
  }

  /**
   * Obtiene o crea el contacto
   */
  async getOrCreateContact(botId, payload) {
    try {
      // El contacto SIEMPRE es el 'from' (la otra persona)
      // - En mensajes entrantes: from = quien envía (contacto)
      // - En mensajes salientes: from = quien recibe (contacto)
      
      const contactNumber = payload.from?.split('@')[0];
      
      if (!contactNumber) {
        throw new Error('No se pudo extraer número de contacto');
      }

      console.log(`🔍 Número del contacto: ${contactNumber}`);

      // Extraer nombre del contacto
      const contactName = payload._data?.notifyName || 
                         payload.pushName || 
                         payload.verifiedBizName || 
                         null;

      return await contactService.getOrCreateContact(botId, contactNumber, {
        name: contactName,
        push_name: contactName
      });
    } catch (error) {
      console.error('Error en getOrCreateContact:', error);
      throw error;
    }
  }

  /**
   * Obtiene o crea el chat
   */
  async getOrCreateChat(botId, contactId, payload) {
    try {
      // El chat ID es el 'from' (el número del contacto)
      const chatId = payload.from;
      
      if (!chatId) {
        throw new Error('No se pudo extraer chat ID');
      }

      console.log(`🔍 Chat ID: ${chatId}`);

      const isGroup = chatId.includes('@g.us');
      const chatName = payload._data?.notifyName || 
                      payload.pushName || 
                      chatId.split('@')[0];

      return await chatService.getOrCreateChat(botId, chatId, contactId, {
        name: chatName,
        is_group: isGroup
      });
    } catch (error) {
      console.error('Error en getOrCreateChat:', error);
      throw error;
    }
  }

  /**
   * Guarda el mensaje
   */
  async saveMessage(botId, chatId, contactId, payload) {
    try {
      console.log(`💾 Guardando mensaje...`);
      
      const savedMessage = await messageService.saveMessage(botId, chatId, contactId, payload);
      
      if (savedMessage) {
        console.log(`✅ Mensaje guardado en BD`);
      }
      
      return savedMessage;
    } catch (error) {
      console.error('Error en saveMessage:', error);
      throw error;
    }
  }

  /**
   * Procesa multimedia (LÓGICA MEJORADA)
   */
  async processMedia(botId, messageId, payload) {
    try {
      console.log(`\n📎 ========== PROCESANDO MULTIMEDIA ==========`);
      console.log(`Tipo: ${payload.type}`);
      console.log(`Media URL: ${payload.mediaUrl}`);
      console.log(`Mimetype: ${payload.mimetype}`);
      console.log(`==========================================\n`);

      if (!payload.mediaUrl) {
        console.log(`⚠️ No hay mediaUrl, omitiendo procesamiento`);
        return;
      }

      const wahaApiKey = process.env.WAHA_API_KEY;
      const fileName = `${payload.id}_${Date.now()}`;

      // PASO 1: Descargar y subir a Supabase Storage
      console.log(`📥 Descargando multimedia desde WAHA...`);
      const mediaData = await mediaService.processAndUploadMedia(
        payload.mediaUrl,
        fileName,
        payload.type,
        wahaApiKey
      );
      console.log(`✅ Multimedia subida a Supabase Storage: ${mediaData.publicUrl}`);

      // PASO 2: Guardar referencia en la base de datos
      console.log(`💾 Guardando referencia en BD...`);
      const savedMedia = await mediaService.saveMediaFile(botId, messageId, mediaData);
      console.log(`✅ Referencia guardada en media_files (ID: ${savedMedia.id})`);

      // PASO 3: Transcribir audio si aplica
      if (payload.type === 'audio' || payload.type === 'ptt' || payload.type === 'voice') {
        console.log(`🎤 Audio detectado, iniciando transcripción...`);
        
        // Transcribir en segundo plano (no bloqueante)
        transcriptionService.processAudioMessage(
          mediaData.publicUrl,
          messageId,
          wahaApiKey
        ).catch(err => {
          console.error('Error en transcripción (no bloqueante):', err);
        });
      }

      console.log(`\n✅ ========== MULTIMEDIA PROCESADA ==========\n`);

    } catch (error) {
      console.error('❌ Error procesando multimedia:', error);
      // No lanzar error para no bloquear el flujo principal
    }
  }

  /**
   * Maneja confirmaciones de lectura
   */
  async handleMessageAck(event) {
    try {
      const { payload } = event;
      
      console.log(`✓ ACK recibido para mensaje: ${payload.id} -> ${payload.ack}`);

      // Actualizar estado del mensaje
      const { error } = await supabase
        .from('messages')
        .update({ 
          ack: payload.ack,
          status: `ack_${payload.ack}`
        })
        .eq('message_id', payload.id);

      if (error) {
        console.error('Error actualizando ACK:', error);
      }
    } catch (error) {
      console.error('Error en handleMessageAck:', error);
    }
  }

  /**
   * Maneja reacciones a mensajes
   */
  async handleMessageReaction(event) {
    try {
      const { payload } = event;
      
      console.log(`❤️ Reacción recibida: ${payload.reaction} en mensaje ${payload.messageId}`);

      // Guardar reacción en metadata del mensaje
      const { error } = await supabase
        .from('messages')
        .update({ 
          metadata: supabase.raw(`
            COALESCE(metadata, '{}'::jsonb) || 
            jsonb_build_object('reaction', '${payload.reaction}', 'reaction_timestamp', '${new Date().toISOString()}')
          `)
        })
        .eq('message_id', payload.messageId);

      if (error) {
        console.error('Error guardando reacción:', error);
      }
    } catch (error) {
      console.error('Error en handleMessageReaction:', error);
    }
  }
}

export default new WebhookService();
