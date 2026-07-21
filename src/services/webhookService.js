import supabase from '../config/supabase.js';
import { BotService } from './botService.js';
import { ContactService } from './contactService.js';
import { ChatService } from './chatService.js';
import { MessageService } from './messageService.js';
import { MediaService } from './mediaService.js';
import { TranscriptionService } from './transcriptionService.js';
import WahaContactService from './wahaContactService.js';
import ContactSyncService from './contactSyncService.js';
import pocThreadService from './pocThreadService.js';
import { isBotInPoC, getPoCBots } from '../config/pocConfig.js';

const botService = new BotService();
const contactService = new ContactService();
const chatService = new ChatService();
const messageService = new MessageService();
const mediaService = new MediaService();
const transcriptionService = new TranscriptionService();

export class WebhookService {
  /**
   * Procesa un webhook de WAHA con reintentos
   */
  async processWebhook(event, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      console.log(`\n🔔 Webhook recibido [${event.event}]:`, {
        session: event.session,
        event: event.event,
        messageId: event.payload?.id,
        timestamp: new Date().toISOString(),
        retry: retryCount > 0 ? `${retryCount}/${maxRetries}` : 'first attempt'
      });

      // Guardar evento en la base de datos (no bloqueante)
      this.saveWebhookEvent(event).catch(err => {
        console.error('⚠️ Error guardando webhook event (no crítico):', err.message);
      });

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

      console.log(`✅ Webhook procesado exitosamente`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error procesando webhook (intento ${retryCount + 1}/${maxRetries + 1}):`, error.message);
      
      // Reintentar si no hemos alcanzado el máximo
      if (retryCount < maxRetries) {
        console.log(`🔄 Reintentando en 2 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.processWebhook(event, retryCount + 1);
      }
      
      // Si ya agotamos los reintentos, guardar en una tabla de errores
      await this.saveFailedWebhook(event, error);
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

      console.log(`\n📨 ========== PROCESANDO MENSAJE ==========`);
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
      console.log(`==========================================\n`);

      // PASO 1: Obtener o crear BOT (usar event.me para datos correctos)
      console.log(`\n📨 Procesando mensaje: ${payload.id}`);
      console.log(`   From: ${payload.from} | FromMe: ${payload.fromMe} | HasMedia: ${payload.hasMedia}`);
      const bot = await this.getOrCreateBot(session, payload, event.me);
      console.log(`✅ Bot obtenido: ${bot.session_name} (ID: ${bot.id})`);

      // PASO 2: Obtener o crear CONTACTO (con datos de WAHA API)
      // Pasamos event.me para detectar si el nombre del contacto es igual al del bot
      const contact = await this.getOrCreateContact(bot.id, payload, session, event.me);
      console.log(`✅ Contacto obtenido: ${contact.phone_number} (ID: ${contact.id})`);

      // PASO 3: Obtener o crear CHAT (pasando el objeto contact completo)
      const chat = await this.getOrCreateChat(bot.id, contact, payload);
      console.log(`✅ Chat obtenido: ${chat.chat_id} (ID: ${chat.id})`);

      // PASO 4: Guardar MENSAJE
      const savedMessage = await this.saveMessage(bot.id, chat.id, contact.id, payload);
      
      if (!savedMessage) {
        console.log(`⚠️ Mensaje duplicado, omitiendo procesamiento`);
        return;
      }
      
      console.log(`✅ Mensaje guardado: ${savedMessage.id}`);

      // PASO 4.5: Actualizar último mensaje del chat
      // IMPORTANTE: Usar chat.chat_id (normalizado) en vez de payload.from
      // porque payload.from puede ser @lid y el chat se guarda con número real
      const timestamp = payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : new Date().toISOString();
      const messageText = payload.body?.substring(0, 100) || (payload.hasMedia ? '[Media]' : '[Mensaje]');
      
      await chatService.updateLastMessage(bot.id, chat.chat_id, timestamp, messageText, payload.fromMe);
      console.log(`✅ Chat actualizado con último mensaje (chat_id: ${chat.chat_id})`);

      // PASO 5: Procesar MULTIMEDIA (si existe)
      if (payload.hasMedia) {
        await this.processMedia(bot.id, savedMessage.id, payload);
      }

      // 🔍 DEBUG ANTES DE POC - Confirmar que llegamos hasta aquí
      console.log(`\n🔍 [DEBUG] Llegando a sección POC - Bot: ${bot.session_name}, Contacto: ${contact.phone_number}`);

      // PASO 6: Actualizar thread de PoC (sincronización incremental - no bloqueante)
      const contactNumber = contact.phone_number;
      const contactName = contact.name || contactNumber;
      const messageTimestamp = payload.timestamp
        ? new Date(payload.timestamp * 1000).toISOString()
        : new Date().toISOString();

      // 🔍 DIAGNÓSTICO: Verificar si el bot está en la lista POC_BOTS (desde configuración centralizada)
      const botInPoC = isBotInPoC(bot.session_name);
      const pocBotsList = getPoCBots();
      
      console.log(`[Webhook PoC] ========== DIAGNÓSTICO ==========`);
      console.log(`[Webhook PoC] Bot: ${bot.session_name} (ID: ${bot.id})`);
      console.log(`[Webhook PoC] ¿Está en POC_BOTS? ${botInPoC ? '✅ SÍ' : '❌ NO'}`);
      console.log(`[Webhook PoC] Lista POC_BOTS (${pocBotsList.length}): ${JSON.stringify(pocBotsList)}`);
      console.log(`[Webhook PoC] Contacto: ${contactNumber}`);
      console.log(`[Webhook PoC] Chat ID: ${chat.id}`);
      
      // Solo procesar si el bot está en la lista PoC
      if (botInPoC) {
        console.log(`[Webhook PoC] ✅ Procesando mensaje para PoC...`);
        
        // Validación adicional: verificar que contactNumber no sea null/undefined
        if (!contactNumber) {
          console.error('[Webhook PoC] ❌ ERROR: contactNumber es null/undefined, omitiendo sincronización');
          console.error('[Webhook PoC] Datos del contacto:', { 
            phone_number: contact.phone_number, 
            name: contact.name,
            id: contact.id 
          });
        } else {
          // Llamada asíncrona - no bloquea el webhook
          pocThreadService.updateThreadForNewMessage(
            bot.id,
            chat.id,
            contactNumber,
            contactName,
            messageTimestamp
          ).then(result => {
            console.log(`[Webhook PoC] ✅ Thread actualizado exitosamente para ${contactNumber}`);
          }).catch(err => {
            console.error('[Webhook PoC] ❌ ERROR actualizando thread PoC:', err.message);
            console.error('[Webhook PoC] Stack:', err.stack);
            console.error('[Webhook PoC] Datos que causaron el error:', {
              botId: bot.id,
              chatId: chat.id,
              contactNumber,
              contactName,
              messageTimestamp
            });
          });
        }
      } else {
        console.log(`[Webhook PoC] ⚠️ Bot no está en POC_BOTS, omitiendo sincronización`);
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

  /**
   * Obtiene o crea el chat
   */
  async getOrCreateChat(botId, contact, payload) {
    try {
      // El chat ID es el 'from' (el número del contacto)
      // IMPORTANTE: Normalizar @lid a @c.us para evitar chats duplicados
      let chatId = payload.from;
      
      // Si el from es un @lid, usar el número del contacto normalizado
      if (payload.from?.includes('@lid') && payload._data?.key?.remoteJidAlt) {
        const altId = payload._data.key.remoteJidAlt;
        if (altId.includes('@s.whatsapp.net') || altId.includes('@c.us')) {
          const phoneNumber = altId.split('@')[0];
          chatId = `${phoneNumber}@c.us`;
          console.log(`   🔄 Chat ID normalizado de @lid a: ${chatId}`);
        }
      }
      
      if (!chatId) {
        throw new Error('No se pudo extraer chat ID');
      }

      console.log(`🔍 Chat ID: ${chatId}`);

      const isGroup = chatId.includes('@g.us');
      
      // 🔍 DEBUG: Analizar cada propiedad para el nombre del chat
      console.log(`\n🔍 ========== DEBUG: ANÁLISIS DE NOMBRES DEL CHAT ==========`);
      console.log(`isGroup: ${isGroup}`);
      console.log(`contact.name: ${contact.name || 'NULL'}`);
      console.log(`contact.push_name: ${contact.push_name || 'NULL'}`);
      console.log(`payload._data?.subject: ${payload._data?.subject || 'NULL'}`);
      console.log(`payload._data?.notifyName: ${payload._data?.notifyName || 'NULL'}`);
      console.log(`payload.pushName: ${payload.pushName || 'NULL'}`);
      console.log(`chatId.split('@')[0]: ${chatId.split('@')[0]}`);
      console.log(`payload.fromMe: ${payload.fromMe}`);
      console.log(`==========================================\n`);
      
      // Determinar el nombre del chat según el tipo
      let chatName;
      
      if (isGroup) {
        // Para GRUPOS: usar subject del payload (nombre del grupo)
        chatName = payload._data?.subject || 
                   payload._data?.notifyName ||
                   chatId.split('@')[0];  // Fallback al ID del grupo
        console.log(`📢 Nombre del GRUPO: ${chatName}`);
      } else {
        // Para CHATS INDIVIDUALES: usar nombre del contacto de la BD
        // Esto evita que el nombre cambie según quién envía el mensaje
        chatName = contact.name || 
                   contact.push_name || 
                   chatId.split('@')[0];  // Fallback al número de teléfono
      }

      console.log(`✅ Nombre del chat seleccionado: ${chatName}`);

      return await chatService.getOrCreateChat(botId, chatId, contact.id, {
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

      // PASO 2.5: Disparar UPDATE en el mensaje para notificar Realtime
      console.log(`🔔 Actualizando mensaje para notificar multimedia disponible...`);
      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('⚠️ Error actualizando mensaje (no crítico):', updateError.message);
      } else {
        console.log(`✅ Mensaje actualizado - Realtime notificará al frontend`);
      }

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

  /**
   * Guarda webhooks que fallaron después de todos los reintentos
   */
  async saveFailedWebhook(event, error) {
    try {
      console.log(`💾 Guardando webhook fallido para revisión posterior...`);
      
      const { data: bot } = await supabase
        .from('bots')
        .select('id')
        .eq('session_name', event.session)
        .single();

      if (bot) {
        await supabase
          .from('webhook_events')
          .insert([{
            bot_id: bot.id,
            event_type: `FAILED_${event.event}`,
            event_data: {
              ...event,
              error: {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
              }
            },
            processed: false
          }]);
        
        console.log(`✅ Webhook fallido guardado para revisión`);
      }
    } catch (saveError) {
      console.error('❌ Error guardando webhook fallido:', saveError.message);
    }
  }
}

export default new WebhookService();
