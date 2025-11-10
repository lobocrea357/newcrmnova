import express from 'express';
import mediaService from '../services/mediaService.js';
import transcriptionService from '../services/transcriptionService.js';

const router = express.Router();

/**
 * GET /media/bot/:botId
 * Obtiene archivos multimedia de un bot
 */
router.get('/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { type, limit = 50 } = req.query;

    const media = await mediaService.getMediaByBot(botId, type, parseInt(limit));
    res.json({ success: true, data: media });
  } catch (error) {
    console.error('Error obteniendo multimedia:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /media/message/:messageId
 * Obtiene archivos multimedia de un mensaje específico
 */
router.get('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const media = await mediaService.getMediaByMessage(messageId);
    res.json({ success: true, data: media });
  } catch (error) {
    console.error('Error obteniendo multimedia del mensaje:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /media/images/:botId
 * Obtiene solo imágenes de un bot
 */
router.get('/images/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 50 } = req.query;

    const images = await mediaService.getMediaByBot(botId, 'image', parseInt(limit));
    res.json({ success: true, data: images });
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /media/videos/:botId
 * Obtiene solo videos de un bot
 */
router.get('/videos/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 50 } = req.query;

    const videos = await mediaService.getMediaByBot(botId, 'video', parseInt(limit));
    res.json({ success: true, data: videos });
  } catch (error) {
    console.error('Error obteniendo videos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /media/audios/:botId
 * Obtiene solo audios de un bot
 */
router.get('/audios/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 50 } = req.query;

    const audios = await mediaService.getMediaByBot(botId, 'audio', parseInt(limit));
    res.json({ success: true, data: audios });
  } catch (error) {
    console.error('Error obteniendo audios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /media/:mediaId
 * Elimina un archivo multimedia
 */
router.delete('/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    await mediaService.deleteMedia(mediaId);
    res.json({ success: true, message: 'Archivo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando multimedia:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /media/transcriptions/:botId
 * Obtiene transcripciones de audios de un bot
 */
router.get('/transcriptions/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 50 } = req.query;

    const transcriptions = await transcriptionService.getTranscriptions(botId, parseInt(limit));
    res.json({ success: true, data: transcriptions });
  } catch (error) {
    console.error('Error obteniendo transcripciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /media/transcribe/:messageId
 * Fuerza la transcripción de un audio específico
 */
router.post('/transcribe/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { audioUrl, botId } = req.body;

    if (!audioUrl || !botId) {
      return res.status(400).json({ 
        success: false, 
        error: 'audioUrl y botId son requeridos' 
      });
    }

    const wahaApiKey = process.env.WAHA_API_KEY;
    const transcription = await transcriptionService.processAudioMessage(
      audioUrl,
      messageId,
      botId,
      wahaApiKey
    );

    res.json({ success: true, data: transcription });
  } catch (error) {
    console.error('Error transcribiendo audio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
