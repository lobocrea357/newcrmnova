import supabase from '../config/supabase.js';

export class ChatService {
  /**
   * Obtiene o crea un chat
   */
  async getOrCreateChat(botId, chatId, contactId = null, chatData = {}) {
    try {
      console.log(`\n🔍 ========== CHAT SERVICE: getOrCreateChat ==========`);
      console.log(`Bot ID: ${botId}`);
      console.log(`Chat ID: ${chatId}`);
      console.log(`Contact ID: ${contactId}`);
      console.log(`Chat Data:`, JSON.stringify(chatData, null, 2));
      
      // Buscar chat existente por contact_number (campo que existe en tu schema)
      const { data: existingChat, error: searchError } = await supabase
        .from('chats')
        .select('*')
        .eq('bot_id', botId)
        .eq('contact_number', chatId.split('@')[0])
        .maybeSingle();

      if (existingChat) {
        console.log(`✅ Chat existente encontrado:`, {
          id: existingChat.id,
          contact_name: existingChat.contact_name || 'NULL',
          name: existingChat.name || 'NULL',
          contact_number: existingChat.contact_number
        });
        
        // Si el chat existe, NO actualizar el nombre para mantener consistencia
        // Solo actualizar si el chat no tiene nombre y ahora sí viene uno
        if (!existingChat.contact_name && chatData.name) {
          console.log(`🔄 Actualizando nombre del chat: ${chatData.name}`);
          
          const { data: updatedChat, error: updateError } = await supabase
            .from('chats')
            .update({
              contact_name: chatData.name,
              name: chatData.name
            })
            .eq('id', existingChat.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error actualizando nombre del chat:', updateError);
            console.log(`==========================================\n`);
            return existingChat; // Retornar el chat sin actualizar si hay error
          }
          console.log(`✅ Chat actualizado exitosamente`);
          console.log(`==========================================\n`);
          return updatedChat;
        }
        console.log(`➡️ No se actualiza el nombre del chat (ya tiene nombre)`);
        console.log(`==========================================\n`);
        return existingChat;
      }

      // Preparar datos del chat compatible con ambas estructuras
      console.log(`🆕 Creando nuevo chat...`);
      
      const chatInsertData = {
        bot_id: botId,
        contact_number: chatId.split('@')[0],
        contact_name: chatData.name || chatId.split('@')[0], // Fallback al número
        contact_id: contactId, // Siempre incluir contact_id
        chat_id: chatId, // Siempre incluir chat_id (el ID completo con @c.us)
        unread_count: chatData.unread_count || 0,
        is_group: chatData.is_group !== undefined ? chatData.is_group : false
      };
      
      console.log(`📝 contact_name que se va a guardar: ${chatInsertData.contact_name}`);

      // Agregar campos opcionales si existen en el schema
      if (chatData.name) chatInsertData.name = chatData.name; // Campo 'name' separado
      if (chatData.last_message) chatInsertData.last_message = chatData.last_message;
      if (chatData.last_message_at) chatInsertData.last_message_at = chatData.last_message_at;
      if (chatData.last_message_time) chatInsertData.last_message_time = chatData.last_message_time;
      if (chatData.archived !== undefined) chatInsertData.archived = chatData.archived;
      if (chatData.pinned !== undefined) chatInsertData.pinned = chatData.pinned;
      if (chatData.muted !== undefined) chatInsertData.muted = chatData.muted;
      if (chatData.metadata) chatInsertData.metadata = chatData.metadata;

      console.log(`📝 Datos completos de inserción:`, JSON.stringify(chatInsertData, null, 2));
      
      // Crear nuevo chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert([chatInsertData])
        .select()
        .single();

      if (createError) throw createError;
      
      console.log(`✅ Chat creado exitosamente: ID ${newChat.id}`);
      console.log(`==========================================\n`);
      return newChat;
    } catch (error) {
      console.error('Error en getOrCreateChat:', error);
      throw error;
    }
  }

  /**
   * Actualiza el último mensaje de un chat
   */
  async updateLastMessage(botId, chatId, timestamp, messageText = null) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      // Actualizar ambos campos de timestamp
      if (timestamp) {
        updateData.last_message_at = timestamp;
        updateData.last_message_time = timestamp; // Ambos campos con el mismo timestamp
      }
      
      if (messageText) {
        updateData.last_message = messageText;
      }

      const { data, error } = await supabase
        .from('chats')
        .update(updateData)
        .eq('bot_id', botId)
        .eq('contact_number', chatId.split('@')[0])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en updateLastMessage:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los chats de un bot
   */
  async getChatsByBot(botId) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('bot_id', botId)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getChatsByBot:', error);
      throw error;
    }
  }

  /**
   * Obtiene conversaciones recientes usando la vista
   */
  async getRecentConversations(botId = null, limit = 50) {
    try {
      let query = supabase
        .from('recent_conversations')
        .select('*')
        .limit(limit);

      if (botId) {
        query = query.eq('bot_id', botId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getRecentConversations:', error);
      throw error;
    }
  }

  /**
   * Guarda el análisis de IA en un chat
   * @param {string} chatId - ID del chat
   * @param {object} aiAnalysis - Objeto con el análisis de IA (sale_completed, failure_reason, etc.)
   */
  async saveAiAnalysis(chatId, aiAnalysis) {
    try {
      console.log(`\n🤖 ========== CHAT SERVICE: saveAiAnalysis ==========`);
      console.log(`Chat ID: ${chatId}`);
      console.log(`AI Analysis:`, JSON.stringify(aiAnalysis, null, 2));

      const { data, error } = await supabase
        .from('chats')
        .update({ 
          ai_analysis: aiAnalysis,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error guardando análisis IA:', error);
        throw error;
      }

      console.log(`✅ Análisis IA guardado exitosamente para chat ${chatId}`);
      console.log(`==========================================\n`);
      return data;
    } catch (error) {
      console.error('Error en saveAiAnalysis:', error);
      throw error;
    }
  }
}

export default new ChatService();
