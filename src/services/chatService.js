import supabase from '../config/supabase.js';

export class ChatService {
  /**
   * Obtiene o crea un chat
   */
  async getOrCreateChat(botId, chatId, contactId = null, chatData = {}) {
    try {
      // Buscar chat existente por contact_number (campo que existe en tu schema)
      const { data: existingChat, error: searchError } = await supabase
        .from('chats')
        .select('*')
        .eq('bot_id', botId)
        .eq('contact_number', chatId.split('@')[0])
        .maybeSingle();

      if (existingChat) {
        // Si el chat existe, NO actualizar el nombre para mantener consistencia
        // Solo actualizar si el chat no tiene nombre y ahora sí viene uno
        if (!existingChat.contact_name && chatData.name) {
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
            return existingChat; // Retornar el chat sin actualizar si hay error
          }
          return updatedChat;
        }
        return existingChat;
      }

      // Preparar datos del chat compatible con ambas estructuras
      const chatInsertData = {
        bot_id: botId,
        contact_number: chatId.split('@')[0],
        contact_name: chatData.name || chatId.split('@')[0], // Fallback al número
        contact_id: contactId, // Siempre incluir contact_id
        chat_id: chatId, // Siempre incluir chat_id (el ID completo con @c.us)
        unread_count: chatData.unread_count || 0,
        is_group: chatData.is_group !== undefined ? chatData.is_group : false
      };

      // Agregar campos opcionales si existen en el schema
      if (chatData.name) chatInsertData.name = chatData.name; // Campo 'name' separado
      if (chatData.last_message) chatInsertData.last_message = chatData.last_message;
      if (chatData.last_message_at) chatInsertData.last_message_at = chatData.last_message_at;
      if (chatData.last_message_time) chatInsertData.last_message_time = chatData.last_message_time;
      if (chatData.archived !== undefined) chatInsertData.archived = chatData.archived;
      if (chatData.pinned !== undefined) chatInsertData.pinned = chatData.pinned;
      if (chatData.muted !== undefined) chatInsertData.muted = chatData.muted;
      if (chatData.metadata) chatInsertData.metadata = chatData.metadata;

      // Crear nuevo chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert([chatInsertData])
        .select()
        .single();

      if (createError) throw createError;
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
}

export default new ChatService();
