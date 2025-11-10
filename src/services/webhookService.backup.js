import supabase from '../config/supabase.js';
import botService from './botService.js';
import contactService from './contactService.js';
import chatService from './chatService.js';
import messageService from './messageService.js';
import mediaService from './mediaService.js';
import transcriptionService from './transcriptionService.js';

export class WebhookService {
  /**
   * Procesa eventos de webhook de WAHA
   */
  async processWebhookEvent(event) {
    try {
      console.log('Procesando evento:', event.event);

      // Guardar evento en la base de datos
      await this.saveWebhookEvent(event);

      // Procesar según el tipo de evento
      switch (event.event) {
        case 'session.status':
          await this.handleSessionStatus(event);
          break;
        case 'message':
        case 'message.any':  // ← Captura TODOS los mensajes (entrantes y salientes)
          await this.handleMessage(event);
          break;
        case 'message.ack':
          await this.handleMessageAck(event);
          break;
        case 'message.reaction':
          await this.handleMessageReaction(event);
          break;
        default:
          console.log(`Evento no manejado: ${event.event}`);
      }

      // Marcar evento como procesado
      await this.markEventAsProcessed(event);

      return { success: true };
    } catch (error) {
      console.error('Error procesando webhook:', error);
      throw error;
    }
  }

  /**
   * Guarda el evento de webhook
   */
  async saveWebhookEvent(event) {
    try {
      // Extraer número de teléfono si está disponible
      const phoneNumber = event.payload?.me?.id?.split('@')[0] || 
                         event.payload?.me?.user || 
                         event.payload?.from?.split('@')[0] ||
                         'pending';
      
      const bot = await botService.getOrCreateBot(event.session, phoneNumber);

      const { data, error } = await supabase
        .from('webhook_events')
        .insert([
          {
            bot_id: bot.id,
            event_type: event.event,
            event_data: event
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error guardando webhook event:', error);
      throw error;
    }
  }

  /**
   * Marca un evento como procesado
   */
  async markEventAsProcessed(event) {
    try {
      const phoneNumber = event.payload?.me?.id?.split('@')[0] || 
                         event.payload?.me?.user || 
                         event.payload?.from?.split('@')[0] ||
                         'pending';
      
      const bot = await botService.getOrCreateBot(event.session, phoneNumber);

      const { error } = await supabase
        .from('webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('bot_id', bot.id)
        .eq('event_type', event.event)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
    } catch (error) {
      console.error('Error marcando evento como procesado:', error);
    }
  }

  /**
   * Maneja eventos de estado de sesión
   */
  async handleSessionStatus(event) {
    try {
      const { session, payload } = event;
      
      await botService.updateBotStatus(session, payload.status, {
        engine: payload.engine,
        me: payload.me
      });

      console.log(`Estado de sesión actualizado: ${session} -> ${payload.status}`);
    } catch (error) {
      console.error('Error en handleSessionStatus:', error);
      throw error;
    }
  }

  /**
   * Maneja eventos de mensajes
   */
  async handleMessage(event) {
    try {
      const { session, payload } = event;

      console.log(`📨 Procesando mensaje [${event.event}]:`, {
        id: payload.id,
        from: payload.from,
        to: payload.to,
        fromMe: payload.fromMe,
        type: payload.type,
        hasBody: !!payload.body,
        hasMedia: payload.hasMedia
      });

      // Extraer número de teléfono
      const phoneNumber = payload.me?.id?.split('@')[0] || 
                         payload.me?.user || 
                         payload.from?.split('@')[0] ||
                         'pending';

      // Obtener o crear bot
      const bot = await botService.getOrCreateBot(session, phoneNumber);

      // Extraer número de teléfono del remitente y destinatario
      const fromNumber = payload.from?.split('@')[0];
      const toNumber = payload.to?.split('@')[0];

      // Para mensajes salientes (fromMe=true), el contacto es 'from'
      // Para mensajes entrantes (fromMe=false), el contacto también es 'from'
      const contactNumber = fromNumber;
      
      // Validar que tengamos un número de contacto
      if (!contactNumber) {
        console.error('❌ No se pudo extraer número de contacto del mensaje');
        throw new Error('No contact number found in message');
      }

      const contact = await contactService.getOrCreateContact(bot.id, contactNumber, {
        name: payload._data?.notifyName || null,
        push_name: payload._data?.notifyName || null
      });

      // El chat ID es siempre 'from' (el número del contacto)
      const chatId = payload.from;
      const chat = await chatService.getOrCreateChat(bot.id, chatId, contact.id, {
        name: payload._data?.notifyName || contactNumber,
        is_group: chatId?.includes('@g.us') || false
      });

      // Guardar mensaje
      const savedMessage = await messageService.saveMessage(bot.id, chat.id, contact.id, payload);

      // Procesar multimedia si el mensaje tiene archivos
      if (payload.hasMedia && payload.mediaUrl && savedMessage) {
        try {
          const wahaApiKey = process.env.WAHA_API_KEY;
          const fileName = `${payload.id}_${Date.now()}`;
          
          // Subir multimedia a Supabase Storage
          const mediaData = await mediaService.processAndUploadMedia(
            payload.mediaUrl,
            fileName,
            payload.type,
            wahaApiKey
          );

          // Guardar referencia en la base de datos
          await mediaService.saveMediaFile(bot.id, savedMessage.id, mediaData);

          // Si es audio o PTT (nota de voz), transcribir
          if (payload.type === 'audio' || payload.type === 'ptt') {
            console.log(`🎤 Audio detectado, iniciando transcripción...`);
            
            // Transcribir en segundo plano (no bloqueante)
            transcriptionService.processAudioMessage(
              payload.mediaUrl,
              savedMessage.id,
              bot.id,
              wahaApiKey
            ).catch(err => {
              console.error('Error en transcripción (no bloqueante):', err.message);
            });
          }

          console.log(`📎 Multimedia procesada: ${mediaData.folder}/${fileName}`);
        } catch (mediaError) {
          console.error('Error procesando multimedia (no crítico):', mediaError);
          // No lanzar error, el mensaje ya se guardó
        }
      }

      // Actualizar último mensaje del chat
      await chatService.updateLastMessage(
        bot.id, 
        chatId, 
        new Date(payload.timestamp * 1000).toISOString(),
        payload.body || payload.caption || `[${payload.type || 'Media'}]`
      );

      console.log(`✅ Mensaje guardado: ${payload.id}`);
    } catch (error) {
      console.error('Error en handleMessage:', error);
      throw error;
    }
  }

  /**
   * Maneja eventos de ACK de mensajes
   */
  async handleMessageAck(event) {
    try {
      const { session, payload } = event;
      
      const phoneNumber = payload.me?.id?.split('@')[0] || 
                         payload.me?.user || 
                         'pending';
      
      const bot = await botService.getOrCreateBot(session, phoneNumber);

      const { error } = await supabase
        .from('messages')
        .update({ ack: payload.ack })
        .eq('bot_id', bot.id)
        .eq('message_id', payload.id);

      if (error) throw error;

      console.log(`ACK actualizado para mensaje: ${payload.id} -> ${payload.ack}`);
    } catch (error) {
      console.error('Error en handleMessageAck:', error);
      throw error;
    }
  }

  /**
   * Maneja eventos de reacciones a mensajes
   */
  async handleMessageReaction(event) {
    try {
      const { session, payload } = event;
      
      const phoneNumber = payload.me?.id?.split('@')[0] || 
                         payload.me?.user || 
                         'pending';
      
      const bot = await botService.getOrCreateBot(session, phoneNumber);

      // Actualizar metadata del mensaje con la reacción
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('metadata')
        .eq('bot_id', bot.id)
        .eq('message_id', payload.messageId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = message.metadata || {};
      metadata.reactions = metadata.reactions || [];
      metadata.reactions.push({
        reaction: payload.reaction,
        timestamp: new Date().toISOString()
      });

      const { error: updateError } = await supabase
        .from('messages')
        .update({ metadata })
        .eq('bot_id', bot.id)
        .eq('message_id', payload.messageId);

      if (updateError) throw updateError;

      console.log(`Reacción guardada para mensaje: ${payload.messageId}`);
    } catch (error) {
      console.error('Error en handleMessageReaction:', error);
      throw error;
    }
  }
}

export default new WebhookService();
