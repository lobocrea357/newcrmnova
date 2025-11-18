import supabase from '../config/supabase.js';
import { BotService } from './botService.js';
import { ContactService } from './contactService.js';
import { ChatService } from './chatService.js';
import { MessageService } from './messageService.js';
import { MediaService } from './mediaService.js';
import { TranscriptionService } from './transcriptionService.js';
import WahaContactService from './wahaContactService.js';

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
        
        //case 'message':
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
      // Obtener el bot_id desde la sesión
      const { data: bot } = await supabase
        .from('bots')
        .select('id')
        .eq('session_name', event.session)
        .single();

      if (!bot) {
        console.warn(`⚠️ Bot no encontrado para sesión: ${event.session}`);
        return;
      }

      const { error } = await supabase
        .from('webhook_events')
        .insert([{
          bot_id: bot.id,
          event_type: event.event,
          event_data: event.payload || event,
          processed: false,
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
      const { session, payload, me } = event;
      const status = payload.status;

      console.log(`📊 Estado de sesión: ${session} -> ${status}`);

      // 🔍 DEBUG: Explorar datos disponibles en evento de sesión
    /*   console.log(`\n🔍 ========== DEBUG: SESSION STATUS EVENT ==========`);
      console.log(`event.me:`, JSON.stringify(me, null, 2));
      console.log(`event.payload:`, JSON.stringify(payload, null, 2));
      console.log(`event completo:`, JSON.stringify(event, null, 2));
      console.log(`==========================================\n`); */

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

     /*  console.log(`\n📨 ========== PROCESANDO MENSAJE ==========`);
      console.log(`Evento: ${event.event}`);
      console.log(`ID: ${payload.id}`);
      console.log(`From: ${payload.from}`);
      console.log(`To: ${payload.to}`);
      console.log(`FromMe: ${payload.fromMe}`);
      console.log(`Type: ${payload.type}`);
      console.log(`HasMedia: ${payload.hasMedia}`);
      console.log(`Body: ${payload.body?.substring(0, 50)}...`);
      
      // 🔍 DEBUG: Estructura completa del payload
      console.log(`\n🔍 ========== DEBUG: PAYLOAD COMPLETO ==========`);
      console.log(JSON.stringify(payload, null, 2));
      console.log(`\n🔍 ========== DEBUG: EVENT COMPLETO ==========`);
      console.log(JSON.stringify(event, null, 2));
      console.log(`==========================================\n`); */

      // PASO 1: Obtener o crear BOT (usar event.me para datos correctos)
      console.log(`\n📨 Procesando mensaje: ${payload.id}`);
      console.log(`   From: ${payload.from} | FromMe: ${payload.fromMe} | HasMedia: ${payload.hasMedia}`);
      const bot = await this.getOrCreateBot(session, payload, event.me);
      console.log(`✅ Bot obtenido: ${bot.session_name} (ID: ${bot.id})`);

      // PASO 2: Obtener o crear CONTACTO (con datos de WAHA API)
      const contact = await this.getOrCreateContact(bot.id, payload, session);
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

      // PASO 4.5: Actualizar último mensaje del chat
      const timestamp = payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : new Date().toISOString();
      const messageText = payload.body?.substring(0, 100) || (payload.hasMedia ? '[Media]' : '[Mensaje]');
      
      await chatService.updateLastMessage(bot.id, payload.from, timestamp, messageText);
      console.log(`✅ Chat actualizado con último mensaje`);

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
  async getOrCreateBot(session, payload, eventMe = null) {
    try {
      // Extraer número de teléfono del bot desde event.me (más confiable)
      let phoneNumber = 'pending';
      
      if (eventMe?.id) {
        // Usar event.me que viene del evento principal
        phoneNumber = eventMe.id.split('@')[0];
        console.log(`🔍 Número del bot desde event.me: ${phoneNumber}`);
      } else if (payload.me?.id) {
        phoneNumber = payload.me.id.split('@')[0];
        console.log(`🔍 Número del bot desde payload.me: ${phoneNumber}`);
      } else if (payload.me?.user) {
        phoneNumber = payload.me.user;
        console.log(`🔍 Número del bot desde payload.me.user: ${phoneNumber}`);
      } else if (payload.from && payload.fromMe) {
        // Si es mensaje saliente, el 'from' podría no ser el bot
        phoneNumber = payload.from.split('@')[0];
        console.log(`🔍 Número del bot desde payload.from (fromMe=true): ${phoneNumber}`);
      } else {
        console.log(`⚠️ No se pudo determinar número del bot, usando 'pending'`);
      }

      return await botService.getOrCreateBot(session, phoneNumber);
    } catch (error) {
      console.error('Error en getOrCreateBot:', error);
      throw error;
    }
  }

  /**
   * Obtiene o crea el contacto
   */
  async getOrCreateContact(botId, payload, session) {
    try {
      // El contacto SIEMPRE es el 'from' (la otra persona)
      // - En mensajes entrantes: from = quien envía (contacto)
      // - En mensajes salientes: from = quien recibe (contacto)
      
      const contactNumber = payload.from?.split('@')[0];
      const contactId = payload.from; // ID completo con @c.us o @newsletter
      
      if (!contactNumber) {
        throw new Error('No se pudo extraer número de contacto');
      }

    /*   console.log(`🔍 Número del contacto: ${contactNumber}`);

      // 🔍 DEBUG: Explorar todas las posibles ubicaciones de datos del contacto
      console.log(`\n🔍 ========== DEBUG: DATOS DE CONTACTO ==========`);
      console.log(`payload.pushName: ${payload.pushName}`);
      console.log(`payload.verifiedBizName: ${payload.verifiedBizName}`);
      console.log(`payload._data?.notifyName: ${payload._data?.notifyName}`);
      console.log(`payload._data?.pushName: ${payload._data?.pushName}`);
      console.log(`payload._data?.verifiedName: ${payload._data?.verifiedName}`);
      console.log(`payload.from: ${payload.from}`);
      console.log(`payload.author: ${payload.author}`);
      console.log(`payload.sender: ${payload.sender}`);
      
      // Verificar si hay datos de contacto en _data
      if (payload._data) {
        console.log(`\n🔍 payload._data keys:`, Object.keys(payload._data));
        if (payload._data.key) {
          console.log(`🔍 payload._data.key:`, JSON.stringify(payload._data.key, null, 2));
        }
      }
      console.log(`==========================================\n`); */

      // Extraer nombre del contacto desde payload (probablemente será NULL)
      console.log(`   📞 Contacto: ${contactNumber}`);
      const contactName = payload._data?.notifyName || 
                         payload.pushName || 
                         payload.verifiedBizName || 
                         payload._data?.pushName ||
                         payload._data?.verifiedName ||
                         null;

   /*    console.log(`✅ Nombre extraído del payload: ${contactName || 'NULL'}`);

      // 🚀 NUEVO: Consultar API de WAHA para obtener datos completos del contacto
      console.log(`\n🌐 Consultando API de WAHA para obtener datos completos...`); */
      const wahaContactData = await WahaContactService.getFullContactData(session, contactId);

      // Combinar datos del payload y de WAHA (priorizar WAHA)
      const finalContactData = {
        name: wahaContactData.name || contactName,
        push_name: wahaContactData.push_name || contactName,
        profile_picture_url: wahaContactData.profile_picture_url,
        is_business: wahaContactData.is_business,
        is_enterprise: wahaContactData.is_enterprise
      };

      console.log(`   👤 Nombre: ${finalContactData.name || 'Sin nombre'}`);

      return await contactService.getOrCreateContact(botId, contactNumber, finalContactData);
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

     /*  // 🔍 DEBUG: Explorar todas las posibles ubicaciones de datos del chat
      console.log(`\n🔍 ========== DEBUG: DATOS DE CHAT ==========`);
      console.log(`payload.from: ${payload.from}`);
      console.log(`payload.chatId: ${payload.chatId}`);
      console.log(`payload.id?.remote: ${payload.id?.remote}`);
      console.log(`payload._data?.id?.remote: ${payload._data?.id?.remote}`);
      console.log(`payload._data?.id?._serialized: ${payload._data?.id?._serialized}`);
      
      // Verificar si hay información de chat/grupo
      if (payload._data?.id) {
        console.log(`\n🔍 payload._data.id:`, JSON.stringify(payload._data.id, null, 2));
      }
      
      console.log(`\n🔍 Verificando nombres disponibles:`);
      console.log(`payload._data?.notifyName: ${payload._data?.notifyName}`);
      console.log(`payload.pushName: ${payload.pushName}`);
      console.log(`payload._data?.pushName: ${payload._data?.pushName}`);
      console.log(`payload.body (primeros 30 chars): ${payload.body?.substring(0, 30)}`);
      console.log(`==========================================\n`); */

      const isGroup = chatId.includes('@g.us');
      const chatName = payload._data?.notifyName || 
                      payload.pushName || 
                      payload._data?.pushName ||
                      chatId.split('@')[0];

     /*  console.log(`✅ Nombre extraído del chat: ${chatName}`);
      console.log(`✅ Es grupo: ${isGroup}`); */

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
      
      // Detectar el tipo de mensaje si no viene en payload.type
      if (!payload.type && payload.hasMedia && payload._data?.message) {
        const msg = payload._data.message;
        if (msg.imageMessage) payload.type = 'image';
        else if (msg.videoMessage) payload.type = 'video';
        else if (msg.audioMessage || msg.pttMessage) payload.type = 'audio';
        else if (msg.documentMessage || msg.documentWithCaptionMessage) payload.type = 'document';
        else if (msg.stickerMessage) payload.type = 'sticker';
        else if (msg.locationMessage) payload.type = 'location';
        else if (msg.contactMessage || msg.contactsArrayMessage) payload.type = 'contact';
      }
      
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
   * Procesa multimedia (LÓGICA MEJORADA Y CORREGIDA)
   */
  async processMedia(botId, messageId, payload) {
    try {
      // Extraer mediaUrl de múltiples posibles ubicaciones
      let mediaUrl = null;
      let mimetype = null;
      let messageType = payload.type || 'unknown';

      // Intentar extraer de diferentes formatos de WAHA
      if (payload.mediaUrl) {
        mediaUrl = payload.mediaUrl;
        mimetype = payload.mimetype;
      } else if (payload.media?.url) {
        mediaUrl = payload.media.url;
        mimetype = payload.media.mimetype;
      } else if (payload._data?.mediaUrl) {
        mediaUrl = payload._data.mediaUrl;
        mimetype = payload._data.mimetype;
      }

      // Detectar tipo de mensaje desde _data si no viene en payload.type
      if (payload._data?.message) {
        const msg = payload._data.message;
        if (msg.imageMessage) {
          messageType = 'image';
          mimetype = mimetype || msg.imageMessage.mimetype || 'image/jpeg';
        } else if (msg.videoMessage) {
          messageType = 'video';
          mimetype = mimetype || msg.videoMessage.mimetype || 'video/mp4';
        } else if (msg.audioMessage || msg.pttMessage) {
          messageType = 'audio';
          mimetype = mimetype || msg.audioMessage?.mimetype || msg.pttMessage?.mimetype || 'audio/ogg';
        } else if (msg.documentMessage || msg.documentWithCaptionMessage) {
          messageType = 'document';
          mimetype = mimetype || msg.documentMessage?.mimetype || 'application/pdf';
        } else if (msg.stickerMessage) {
          messageType = 'sticker';
          mimetype = mimetype || 'image/webp';
        }
      }

      console.log(`\n📎 ========== PROCESANDO MULTIMEDIA ==========`);
      console.log(`Tipo: ${messageType}`);
      console.log(`Media URL: ${mediaUrl}`);
      console.log(`Mimetype: ${mimetype}`);
      console.log(`Payload keys: ${Object.keys(payload).join(', ')}`);
      console.log(`==========================================\n`);

      if (!mediaUrl) {
        console.log(`⚠️ No hay mediaUrl en ningún formato conocido`);
        console.log(`Payload completo:`, JSON.stringify(payload, null, 2));
        return;
      }

      const wahaApiKey = process.env.WAHA_API_KEY;
      const fileName = `${payload.id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

      // PASO 1: Descargar y subir a Supabase Storage
      console.log(`📥 Descargando multimedia desde WAHA...`);
      const mediaData = await mediaService.processAndUploadMedia(
        mediaUrl,
        fileName,
        messageType,
        wahaApiKey
      );
      console.log(`✅ Multimedia subida a Supabase Storage: ${mediaData.publicUrl}`);

      // PASO 2: Guardar referencia en la base de datos
      console.log(`💾 Guardando referencia en BD...`);
      const savedMedia = await mediaService.saveMediaFile(botId, messageId, mediaData);
      console.log(`✅ Referencia guardada en media_files (ID: ${savedMedia.id})`);

      // PASO 3: Transcribir audio si aplica
      if (messageType === 'audio' || messageType === 'ptt' || messageType === 'voice') {
        console.log(`🎤 Audio detectado, iniciando transcripción...`);
        
        // Transcribir en segundo plano (no bloqueante)
        transcriptionService.processAudioMessage(
          mediaData.publicUrl,
          messageId,
          botId,
          wahaApiKey
        ).catch(err => {
          console.error('Error en transcripción (no bloqueante):', err.message);
        });
      }

      console.log(`\n✅ ========== MULTIMEDIA PROCESADA ==========\n`);

    } catch (error) {
      console.error('❌ Error procesando multimedia:', error);
      console.error('Stack:', error.stack);
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
