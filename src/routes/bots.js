import express from 'express';
import botService from '../services/botService.js';
import wahaClient from '../config/waha.js';

const router = express.Router();

/**
 * GET /bots
 * Obtiene todos los bots
 */
router.get('/', async (req, res) => {
  try {
    const bots = await botService.getAllBots();
    res.json({ success: true, data: bots });
  } catch (error) {
    console.error('Error obteniendo bots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /bots/sync
 * Sincroniza bots con WAHA
 */
router.post('/sync', async (req, res) => {
  try {
    const sessions = await botService.syncBotsWithWaha();
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error sincronizando bots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /bots/:sessionName/start
 * Inicia una sesión de WhatsApp
 */
router.post('/:sessionName/start', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    // Crear sesión en WAHA
    const response = await wahaClient.post('/api/sessions', {
      name: sessionName,
      config: {
        proxy: null,
        noweb: {
          store: {
            enabled: true,
            fullSync: false
          }
        }
      }
    });

    // Crear o actualizar en la base de datos
    await botService.getOrCreateBot(sessionName);
    await botService.updateBotStatus(sessionName, 'starting');

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error iniciando bot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /bots/:sessionName/stop
 * Detiene una sesión de WhatsApp
 */
router.post('/:sessionName/stop', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    await wahaClient.post(`/api/sessions/${sessionName}/stop`);
    await botService.updateBotStatus(sessionName, 'stopped');

    res.json({ success: true, message: 'Sesión detenida' });
  } catch (error) {
    console.error('Error deteniendo bot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /bots/:sessionName
 * Elimina una sesión de WhatsApp
 */
router.delete('/:sessionName', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    await wahaClient.delete(`/api/sessions/${sessionName}`);

    res.json({ success: true, message: 'Sesión eliminada' });
  } catch (error) {
    console.error('Error eliminando bot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /bots/:sessionName/qr
 * Obtiene el código QR de una sesión
 */
router.get('/:sessionName/qr', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    const response = await wahaClient.get(`/api/${sessionName}/auth/qr`, {
      params: { format: 'image' },
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Error obteniendo QR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
