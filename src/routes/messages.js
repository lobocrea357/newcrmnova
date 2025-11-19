import express from 'express';
import messageService from '../services/messageService.js';
import wahaClient from '../config/waha.js';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * GET /messages/bot/:botId
 * Obtiene mensajes de un bot
 */
router.get('/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const messages = await messageService.getMessagesByBot(botId, parseInt(limit), parseInt(offset));
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /messages/chat/:chatId
 * Obtiene mensajes de un chat con archivos multimedia incluidos
 */
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 100, offset = 0, includeMedia = 'true' } = req.query;

    // Obtener mensajes
    const messages = await messageService.getMessagesByChat(chatId, parseInt(limit), parseInt(offset));

    // Si se solicita incluir media, obtener archivos multimedia
    if (includeMedia === 'true') {
      const messagesWithMedia = await Promise.all(
        messages.map(async (msg) => {
          if (msg.has_media) {
            const { data: mediaFiles } = await supabase
              .from('media_files')
              .select('*')
              .eq('message_id', msg.id);
            
            return {
              ...msg,
              media_files: mediaFiles || []
            };
          }
          return msg;
        })
      );
      
      res.json({ success: true, data: messagesWithMedia });
    } else {
      res.json({ success: true, data: messages });
    }
  } catch (error) {
    console.error('Error obteniendo mensajes del chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /messages/search
 * Busca mensajes por texto
 */
router.get('/search', async (req, res) => {
  try {
    const { botId, query, limit = 50 } = req.query;

    if (!botId || !query) {
      return res.status(400).json({ success: false, error: 'botId y query son requeridos' });
    }

    const messages = await messageService.searchMessages(botId, query, parseInt(limit));
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error buscando mensajes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /messages/stats/:botId
 * Obtiene estadísticas de mensajes
 */
router.get('/stats/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { startDate, endDate } = req.query;

    const stats = await messageService.getMessageStats(botId, startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /messages/send
 * Envía un mensaje a través de WAHA
 */
router.post('/send', async (req, res) => {
  try {
    const { session, chatId, text, mediaUrl } = req.body;

    if (!session || !chatId) {
      return res.status(400).json({ success: false, error: 'session y chatId son requeridos' });
    }

    let response;
    if (mediaUrl) {
      // Enviar mensaje con media
      response = await wahaClient.post(`/api/sendImage`, {
        session,
        chatId,
        file: {
          url: mediaUrl
        },
        caption: text
      });
    } else if (text) {
      // Enviar mensaje de texto
      response = await wahaClient.post(`/api/sendText`, {
        session,
        chatId,
        text
      });
    } else {
      return res.status(400).json({ success: false, error: 'text o mediaUrl es requerido' });
    }

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
