import express from 'express';
import chatService from '../services/chatService.js';

const router = express.Router();

/**
 * GET /chats/bot/:botId
 * Obtiene todos los chats de un bot
 */
router.get('/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const chats = await chatService.getChatsByBot(botId);
    res.json({ success: true, data: chats });
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /chats/recent
 * Obtiene conversaciones recientes
 */
router.get('/recent', async (req, res) => {
  try {
    const { botId, limit = 50 } = req.query;
    const conversations = await chatService.getRecentConversations(botId, parseInt(limit));
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error obteniendo conversaciones recientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
