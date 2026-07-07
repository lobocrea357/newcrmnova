import express from 'express';
import webhookService from '../services/webhookService.js';

const router = express.Router();

/**
 * POST /webhooks/waha
 * Recibe eventos de WAHA
 */
router.post('/waha', async (req, res) => {
  try {
    // 🔍 LOG CRÍTICO - Debe aparecer SIEMPRE que llegue un webhook
    console.log('\n\n🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔');
    console.log('🔔 WEBHOOK POST /webhooks/waha RECIBIDO');
    console.log('🔔 Timestamp:', new Date().toISOString());
    console.log('🔔 Body:', JSON.stringify(req.body, null, 2));
    console.log('🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔\n\n');
    
    await webhookService.processWebhook(req.body);
    
    res.status(200).json({ success: true, message: 'Webhook procesado correctamente' });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
