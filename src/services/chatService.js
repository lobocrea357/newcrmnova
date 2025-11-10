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
        return existingChat;
      }

      // Preparar datos del chat compatible con ambas estructuras
      const chatInsertData = {
        bot_id: botId,
        contact_number: chatId.split('@')[0],
        contact_name: chatData.name || null,
        unread_count: chatData.unread_count || 0
      };

      // Agregar campos opcionales si existen en el schema
      if (chatData.chat_id) chatInsertData.chat_id = chatId;
      if (chatData.contact_id) chatInsertData.contact_id = contactId;
      if (chatData.is_group !== undefined) chatInsertData.is_group = chatData.is_group;
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
      const updateData = {};
      
      // Usar el campo que existe en el schema actual
      if (timestamp) updateData.last_message_at = timestamp;
      if (messageText) updateData.last_message = messageText;

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
