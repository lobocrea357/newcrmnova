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

/**
 * PUT /chats/:chatId/ai-analysis
 * Guarda el análisis de IA en un chat
 */
router.put('/:chatId/ai-analysis', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { ai_analysis } = req.body;

    if (!chatId) {
      return res.status(400).json({ success: false, error: 'chatId es requerido' });
    }

    if (!ai_analysis || typeof ai_analysis !== 'object') {
      return res.status(400).json({ success: false, error: 'ai_analysis debe ser un objeto válido' });
    }

    const updatedChat = await chatService.saveAiAnalysis(chatId, ai_analysis);
    res.json({ success: true, data: updatedChat });
  } catch (error) {
    console.error('Error guardando análisis IA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
