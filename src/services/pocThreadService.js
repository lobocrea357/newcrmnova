import { supabase } from '../config/supabase.js';
import { getPoCBots } from '../config/pocConfig.js';
import pocEventService from './pocEventService.js';

class PoCThreadService {
  /**
   * Obtiene la lista de bots PoC desde configuración centralizada
   * @returns {string[]}
   */
  get POC_BOTS() {
    return getPoCBots();
  }

  /**
   * Sincroniza threads basándose en chats y mensajes existentes
   * Lee datos actuales sin modificarlos
   * SOLO SINCRONIZA LOS BOTS EN POC_BOTS
   */
  async syncThreadsFromMessages() {
    console.log('[PoC Threads] Iniciando sincronización...');
    console.log('[PoC Threads] Filtrando solo bots:', this.POC_BOTS);

    try {
      console.log('[PoC Threads] Paso 1: Obteniendo chats con contacts...');
      const chats = await this._fetchAllChatsWithContacts();
      console.log(`[PoC Threads] Chats encontrados (filtrados): ${chats.length}`);

      console.log('[PoC Threads] Paso 2: Agrupando chats por teléfono...');
      const threadsByPhone = this._groupChatsByPhone(chats);
      console.log(`[PoC Threads] Threads únicos por teléfono: ${Object.keys(threadsByPhone).length}`);

      console.log('[PoC Threads] Paso 3: Creando/actualizando threads...');
      let syncedCount = 0;
      for (const phone in threadsByPhone) {
        console.log(`[PoC Threads] Procesando thread ${syncedCount + 1}/${Object.keys(threadsByPhone).length} - Teléfono: ${phone}`);
        const threadData = threadsByPhone[phone];
        await this.createOrUpdateThread(threadData);
        syncedCount++;
        console.log(`[PoC Threads] Thread ${syncedCount} procesado`);
      }

      console.log(`[PoC Threads] ✅ ${syncedCount} threads sincronizados`);
      return { success: true, count: syncedCount };
    } catch (error) {
      console.error('[PoC Threads] ❌ Error en sincronización:', error);
      console.error('[PoC Threads] Stack:', error.stack);
      throw error;
    }
  }

  async _fetchAllChatsWithContacts() {
    console.log('[PoC Threads] _fetchAllChatsWithContacts: Obteniendo IDs de bots...');

    // Primero obtener IDs de los bots en POC_BOTS
    const { data: pocBots, error: botsError } = await supabase
      .from('bots')
      .select('id, session_name')
      .in('session_name', this.POC_BOTS);

    if (botsError) {
      console.error('[PoC Threads] Error obteniendo bots:', botsError);
      throw botsError;
    }

    if (!pocBots || pocBots.length === 0) {
      console.warn('[PoC Threads] ⚠️  No se encontraron bots con nombres:', this.POC_BOTS);
      return [];
    }

    const botIds = pocBots.map(b => b.id);
    console.log(`[PoC Threads] Bots encontrados: ${pocBots.map(b => b.session_name).join(', ')}`);
    console.log(`[PoC Threads] Bot IDs: ${botIds.join(', ')}`);

    console.log('[PoC Threads] Obteniendo chats de esos bots...');
    // Obtener chats solo de esos bots
    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        id,
        created_at,
        contact:contacts(phone_number, name),
        bot:bots(session_name)
      `)
      .in('bot_id', botIds)
      .not('contact', 'is', null);

    if (error) {
      console.error('[PoC Threads] Error obteniendo chats:', error);
      throw error;
    }

    console.log(`[PoC Threads] Chats obtenidos: ${chats?.length || 0}`);
    return chats || [];
  }

  _groupChatsByPhone(chats) {
    const threadsByPhone = {};

    for (const chat of chats) {
      const phone = chat.contact?.phone_number;
      if (!phone) continue;

      if (!threadsByPhone[phone]) {
        threadsByPhone[phone] = {
          customer_phone: phone,
          customer_name: chat.contact?.name,
          chats: []
        };
      }

      threadsByPhone[phone].chats.push({
        chat_id: chat.id,
        bot_name: chat.bot?.session_name,
        started_at: chat.created_at
      });
    }

    return threadsByPhone;
  }

  async createOrUpdateThread(threadData) {
    const { customer_phone, customer_name, chats } = threadData;

    const dates = chats.map(c => new Date(c.started_at)).sort((a, b) => a - b);
    const first_message_at = dates[0]?.toISOString();
    const last_message_at = dates[dates.length - 1]?.toISOString();

    const { data: thread, error: threadError } = await supabase
      .from('poc_customer_threads')
      .upsert({
        customer_phone,
        customer_name,
        first_message_at,
        last_message_at
      }, { onConflict: 'customer_phone' })
      .select()
      .single();

    if (threadError) throw threadError;
    if (!thread) return;

    await this._linkChatsToThread(thread.id, chats);
    await this.calculateThreadMetrics(thread.id);
  }

  async _linkChatsToThread(threadId, chats) {
    const records = chats.map(chat => ({
      thread_id: threadId,
      chat_id: chat.chat_id,
      bot_name: chat.bot_name,
      started_at: chat.started_at
    }));

    for (const record of records) {
      await supabase
        .from('poc_thread_chats')
        .upsert(record, { onConflict: 'thread_id,chat_id' });
    }
  }

  async calculateThreadMetrics(threadId) {
    console.log(`[PoC Threads] calculateThreadMetrics: Calculando métricas para thread ${threadId}`);

    const { data: threadChats } = await supabase
      .from('poc_thread_chats')
      .select('chat_id, bot_name')
      .eq('thread_id', threadId);

    if (!threadChats || threadChats.length === 0) {
      console.log(`[PoC Threads] Thread ${threadId} no tiene chats vinculados`);
      return;
    }

    const chatIds = threadChats.map(tc => tc.chat_id);
    const advisors = [...new Set(threadChats.map(tc => tc.bot_name).filter(Boolean))];
    console.log(`[PoC Threads] Thread ${threadId}: ${chatIds.length} chats, advisors: ${advisors.join(', ')}`);

    console.log(`[PoC Threads] Thread ${threadId}: Contando mensajes totales...`);
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('chat_id', chatIds);
    console.log(`[PoC Threads] Thread ${threadId}: ${totalMessages} mensajes totales`);

    console.log(`[PoC Threads] Thread ${threadId}: Contando menciones de pago...`);
    const { count: paymentMentions } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('chat_id', chatIds)
      .or('body.ilike.%pago%,body.ilike.%transferencia%,body.ilike.%zelle%,body.ilike.%paypal%');
    console.log(`[PoC Threads] Thread ${threadId}: ${paymentMentions} menciones de pago`);

    console.log(`[PoC Threads] Thread ${threadId}: Contando cotizaciones...`);
    const { data: cotizacionMessages } = await supabase
      .from('messages')
      .select('body')
      .in('chat_id', chatIds)
      .ilike('body', '%Cotizacion%');

    const cotizacionCount = cotizacionMessages?.length || 0;
    console.log(`[PoC Threads] Thread ${threadId}: ${cotizacionCount} cotizaciones`);

    console.log(`[PoC Threads] Thread ${threadId}: Calculando tiempo de respuesta (RPC)...`);
    let avgResponseMinutes = null;
    try {
      const { data: responseTimes, error: rpcError } = await supabase
        .rpc('calculate_poc_response_times', { p_chat_ids: chatIds })
        .single();

      if (rpcError) {
        console.warn(`[PoC Threads] Thread ${threadId}: RPC calculate_poc_response_times falló, usando null`, rpcError);
      } else {
        avgResponseMinutes = responseTimes?.avg_minutes || null;
        console.log(`[PoC Threads] Thread ${threadId}: Tiempo de respuesta promedio: ${avgResponseMinutes} minutos`);
      }
    } catch (rpcError) {
      console.warn(`[PoC Threads] Thread ${threadId}: Error en RPC, usando null`, rpcError);
    }

    console.log(`[PoC Threads] Thread ${threadId}: Guardando métricas...`);
    await supabase
      .from('poc_thread_metrics')
      .upsert({
        thread_id: threadId,
        total_messages: totalMessages || 0,
        total_chats: threadChats.length,
        advisors,
        avg_response_minutes: avgResponseMinutes,
        payment_mentions: paymentMentions || 0,
        cotizacion_count: cotizacionCount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'thread_id' });

    console.log(`[PoC Threads] Thread ${threadId}: Métricas guardadas exitosamente`);
  }

  async getThreads(limit = 50) {
    const { data: threads, error } = await supabase
      .from('poc_customer_threads')
      .select(`
        *,
        metrics:poc_thread_metrics(*),
        chats:poc_thread_chats(chat_id, bot_name, started_at)
      `)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return threads || [];
  }

  /**
   * Actualiza thread para un nuevo mensaje (sincronización incremental)
   * Se llama desde webhookService.handleMessage después de guardar cada mensaje
   * @param {string} botId - UUID del bot
   * @param {string} chatId - UUID del chat (messages.chat_id)
   * @param {string} contactPhone - Número de teléfono del cliente
   * @param {string} contactName - Nombre del cliente
   * @param {string} messageTimestamp - Timestamp del mensaje
   */
  async updateThreadForNewMessage(botId, chatId, contactPhone, contactName, messageTimestamp) {
    try {
      console.log(`[PoC Threads] ========== INICIO ACTUALIZACIÓN ==========`);
      console.log(`[PoC Threads] Parámetros recibidos:`);
      console.log(`  - botId: ${botId}`);
      console.log(`  - chatId: ${chatId}`);
      console.log(`  - contactPhone: ${contactPhone} (tipo: ${typeof contactPhone})`);
      console.log(`  - contactName: ${contactName}`);
      console.log(`  - messageTimestamp: ${messageTimestamp}`);
      
      // Validación de parámetros
      if (!botId) {
        console.error('[PoC Threads] ❌ ERROR CRÍTICO: botId es null/undefined');
        return;
      }
      if (!chatId) {
        console.error('[PoC Threads] ❌ ERROR CRÍTICO: chatId es null/undefined');
        return;
      }
      if (!contactPhone) {
        console.error('[PoC Threads] ❌ ERROR CRÍTICO: contactPhone es null/undefined');
        return;
      }
      
      console.log(`[PoC Threads] Actualizando thread para nuevo mensaje - Teléfono: ${contactPhone}, Chat UUID: ${chatId}`);

      // Obtener nombre del bot desde la base de datos
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .select('session_name')
        .eq('id', botId)
        .single();

      const botName = bot?.session_name || 'unknown';
      if (botError) {
        console.warn('[PoC Threads] Error obteniendo bot (usando unknown):', botError.message);
      }

      // Obtener o crear el thread
      console.log(`[PoC Threads] Ejecutando upsert para customer_phone: ${contactPhone}`);
      
      const upsertData = {
        customer_phone: contactPhone,
        customer_name: contactName || contactPhone, // Fallback si contactName es null
        first_message_at: messageTimestamp,
        last_message_at: messageTimestamp
      };
      console.log(`[PoC Threads] Datos de upsert:`, upsertData);
      
      const { data: thread, error: threadError } = await supabase
        .from('poc_customer_threads')
        .upsert(upsertData, { onConflict: 'customer_phone' })
        .select()
        .single();

      if (threadError) {
        console.error('[PoC Threads] ❌ ERROR en upsert thread:', threadError);
        console.error('  - Código:', threadError.code);
        console.error('  - Mensaje:', threadError.message);
        console.error('  - Detalles:', threadError.details);
        return; // No bloquear el webhook
      }

      if (!thread) {
        console.error('[PoC Threads] ❌ ERROR: upsert retornó null/undefined');
        console.error('  - Esto puede pasar si hay un trigger que bloquea la operación');
        return;
      }
      
      console.log(`[PoC Threads] ✅ Thread obtenido/creado: ${thread.id}`);

      // Verificar si ya existe un registro para este chat
      const { data: existingChat, error: existingError } = await supabase
        .from('poc_thread_chats')
        .select('id, bot_name, started_at')
        .eq('thread_id', thread.id)
        .eq('chat_id', chatId)
        .single();

      let botChanged = false;

      if (existingChat && existingChat.bot_name !== botName) {
        console.log(`[PoC Threads] 🔄 DETECTADO CAMBIO DE BOT: ${existingChat.bot_name} → ${botName}`);
        botChanged = true;

        // Actualizar ended_at del registro anterior
        const { error: updateError } = await supabase
          .from('poc_thread_chats')
          .update({ ended_at: messageTimestamp })
          .eq('id', existingChat.id);

        if (updateError) {
          console.error('[PoC Threads] ❌ ERROR actualizando ended_at:', updateError);
        } else {
          console.log(`[PoC Threads] ✅ ended_at actualizado para bot anterior: ${existingChat.bot_name}`);
        }

        // Crear nuevo registro con el nuevo bot
        const { error: newChatError } = await supabase
          .from('poc_thread_chats')
          .insert({
            thread_id: thread.id,
            chat_id: chatId,
            bot_name: botName,
            started_at: messageTimestamp
          });

        if (newChatError) {
          console.error('[PoC Threads] ❌ ERROR creando nuevo registro de chat:', newChatError);
        } else {
          console.log(`[PoC Threads] ✅ Nuevo registro creado para bot: ${botName}`);
        }

        // Crear evento de reasignación
        try {
          await pocEventService.createEvent({
            thread_id: thread.id,
            event_type: 'REASSIGNMENT',
            event_data: {
              previous_bot: existingChat.bot_name,
              new_bot: botName,
              chat_id: chatId
            },
            notes: `Reasignación de bot: ${existingChat.bot_name} → ${botName}`
          });
          console.log(`[PoC Threads] ✅ Evento REASSIGNMENT creado`);
        } catch (eventError) {
          console.error('[PoC Threads] ❌ ERROR creando evento REASSIGNMENT:', eventError.message);
        }
      } else {
        // No hay cambio de bot, hacer upsert normal
        const { error: linkError } = await supabase
          .from('poc_thread_chats')
          .upsert({
            thread_id: thread.id,
            chat_id: chatId,
            bot_name: botName,
            started_at: existingChat?.started_at || messageTimestamp
          }, { onConflict: 'thread_id,chat_id' });

        if (linkError) {
          console.error('[PoC Threads] ❌ ERROR linking chat:', linkError);
          console.error('  - Código:', linkError.code);
          console.error('  - Mensaje:', linkError.message);
          console.error('  - thread_id:', thread.id);
          console.error('  - chat_id:', chatId);
        } else {
          console.log(`[PoC Threads] ✅ Chat vinculado: ${chatId} (Bot: ${botName})`);
        }
      }

      // Actualizar métricas de forma asíncrona (no bloquear webhook)
      console.log(`[PoC Threads] Iniciando cálculo de métricas para thread ${thread.id}`);
      this.calculateThreadMetrics(thread.id).catch(err => {
        console.error('[PoC Threads] ❌ ERROR calculando métricas:', err.message);
        console.error('  - Stack:', err.stack);
      });

      console.log(`[PoC Threads] ✅ ========== THREAD ACTUALIZADO EXITOSAMENTE ==========`);
      console.log(`  - Thread ID: ${thread.id}`);
      console.log(`  - Customer: ${thread.customer_phone}`);
      console.log(`  - Chat vinculado: ${chatId}`);
      console.log(`  - Bot: ${botName}`);
    } catch (error) {
      console.error('[PoC Threads] ❌ ERROR CRÍTICO en updateThreadForNewMessage:', error);
      console.error('  - Mensaje:', error.message);
      console.error('  - Stack:', error.stack);
      console.error('  - Parámetros que causaron el error:');
      console.error('    - botId:', botId);
      console.error('    - chatId:', chatId);
      console.error('    - contactPhone:', contactPhone);
      // No lanzar error para no bloquear el webhook, pero loguear como ERROR no warning
    }
  }

  /**
   * Obtiene el timeline de mensajes de un thread
   * Lee de poc_thread_chats para obtener chat_ids
   * Lee de messages para obtener mensajes de esos chats
   * NO accede a tablas de eventos (eso lo hace pocEventService.getEnrichedTimeline)
   * @param {string} threadId - UUID del thread
   * @returns {Promise<Array>} Lista de mensajes ordenados cronológicamente
   */
  async getThreadTimeline(threadId) {
    console.log(`[PoC Threads] Obteniendo timeline para thread ${threadId}`);

    // Obtener chat_ids vinculados al thread
    const { data: threadChats, error: chatsError } = await supabase
      .from('poc_thread_chats')
      .select('chat_id')
      .eq('thread_id', threadId);

    if (chatsError) {
      console.error('[PoC Threads] Error obteniendo thread_chats:', chatsError);
      throw chatsError;
    }

    if (!threadChats || threadChats.length === 0) {
      console.log(`[PoC Threads] Thread ${threadId} no tiene chats vinculados`);
      return [];
    }

    const chatIds = threadChats.map(tc => tc.chat_id);
    console.log(`[PoC Threads] Thread ${threadId}: ${chatIds.length} chats vinculados`);

    // Obtener mensajes de esos chats con información del bot
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        bot:bots(session_name)
      `)
      .in('chat_id', chatIds)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('[PoC Threads] Error obteniendo mensajes:', messagesError);
      throw messagesError;
    }

    console.log(`[PoC Threads] Thread ${threadId}: ${messages?.length || 0} mensajes obtenidos`);
    return messages || [];
  }

}

export default new PoCThreadService();
