import express from 'express';
import webhookService from '../services/webhookService.js';

const router = express.Router();

/**
 * POST /webhooks/waha
 * Recibe eventos de WAHA
 */
router.post('/waha', async (req, res) => {
  try {
    console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));
    
    await webhookService.processWebhook(req.body);
    
    res.status(200).json({ success: true, message: 'Webhook procesado correctamente' });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
