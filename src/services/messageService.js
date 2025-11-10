import supabase from '../config/supabase.js';

export class MessageService {
  /**
   * Guarda un mensaje en la base de datos
   */
  async saveMessage(botId, chatDbId, contactId, messageData) {
    try {
      // Preparar datos compatibles con el schema existente
      const messageInsertData = {
        bot_id: botId,
        message_id: messageData.id,
        from_number: messageData.from?.split('@')[0] || '',
        to_number: messageData.to?.split('@')[0] || '',
        content: messageData.body || messageData.caption || '',
        message_type: messageData.type || 'chat',
        status: messageData.ack ? `ack_${messageData.ack}` : 'sent',
        timestamp: messageData.timestamp ? new Date(messageData.timestamp * 1000).toISOString() : new Date().toISOString()
      };

      // Agregar campos opcionales si existen en el schema
      if (messageData.mediaUrl) messageInsertData.media_url = messageData.mediaUrl;
      if (chatDbId) messageInsertData.chat_id = chatDbId;
      if (contactId) messageInsertData.contact_id = contactId;
      if (messageData.fromMe !== undefined) messageInsertData.from_me = messageData.fromMe;
      if (messageData.body) messageInsertData.body = messageData.body;
      if (messageData.type) messageInsertData.type = messageData.type;
      if (messageData.ack !== undefined) messageInsertData.ack = messageData.ack;
      if (messageData.hasMedia !== undefined) messageInsertData.has_media = messageData.hasMedia;
      if (messageData.mimetype) messageInsertData.media_mimetype = messageData.mimetype;
      if (messageData.caption) messageInsertData.caption = messageData.caption;
      if (messageData.quotedMsg?.id) messageInsertData.quoted_message_id = messageData.quotedMsg.id;
      if (messageData.isForwarded !== undefined) messageInsertData.is_forwarded = messageData.isForwarded;
      if (messageData.broadcast !== undefined) messageInsertData.broadcast = messageData.broadcast;
      if (messageData.metadata) messageInsertData.metadata = messageData.metadata;

      const { data, error } = await supabase
        .from('messages')
        .insert([messageInsertData])
        .select()
        .single();

      if (error) {
        // Si el mensaje ya existe (duplicate key), lo ignoramos
        if (error.code === '23505') {
          console.log(`Mensaje duplicado ignorado: ${messageData.id}`);
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en saveMessage:', error);
      throw error;
    }
  }

  /**
   * Obtiene mensajes de un chat
   */
  async getMessagesByChat(chatDbId, limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatDbId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getMessagesByChat:', error);
      throw error;
    }
  }

  /**
   * Obtiene mensajes de un bot
   */
  async getMessagesByBot(botId, limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages_detailed')
        .select('*')
        .eq('bot_id', botId)
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getMessagesByBot:', error);
      throw error;
    }
  }

  /**
   * Busca mensajes por texto
   */
  async searchMessages(botId, query, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('bot_id', botId)
        .ilike('body', `%${query}%`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en searchMessages:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de mensajes
   */
  async getMessageStats(botId, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('messages')
        .select('from_me, type', { count: 'exact' })
        .eq('bot_id', botId);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const stats = {
        total: count,
        sent: data.filter(m => m.from_me).length,
        received: data.filter(m => !m.from_me).length,
        byType: {}
      };

      data.forEach(msg => {
        stats.byType[msg.type] = (stats.byType[msg.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error en getMessageStats:', error);
      throw error;
    }
  }
}

export default new MessageService();
