import express from 'express';
import fullSyncService from '../services/fullSyncService.js';

const router = express.Router();

/**
 * POST /api/full-sync/:session/messages
 * Sincroniza TODOS los mensajes de TODOS los chats de una sesión
 */
router.post('/:session/messages', async (req, res) => {
  try {
    const { session } = req.params;
    const { limit = 100, includeMedia = true, transcribeAudio = true } = req.body;

    console.log(`\n🔄 Iniciando sincronización completa de mensajes: ${session}`);

    const result = await fullSyncService.syncAllMessages(session, {
      limit,
      includeMedia,
      transcribeAudio
    });

    res.json({
      success: true,
      message: 'Sincronización completa exitosa',
      data: result.stats
    });

  } catch (error) {
    console.error('Error en full-sync messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/full-sync/:session/chat/:chatId
 * Sincroniza mensajes de un chat específico
 */
router.post('/:session/chat/:chatId', async (req, res) => {
  try {
    const { session, chatId } = req.params;
    const { limit = 100, includeMedia = true, transcribeAudio = true } = req.body;

    console.log(`\n🔄 Sincronizando chat específico: ${chatId}`);

    const stats = await fullSyncService.syncChatMessages(session, chatId, {
      limit,
      includeMedia,
      transcribeAudio
    });

    res.json({
      success: true,
      message: 'Chat sincronizado exitosamente',
      data: stats
    });

  } catch (error) {
    console.error('Error en full-sync chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
