import express from 'express';
import autoSyncService from '../services/autoSyncService.js';

const router = express.Router();

/**
 * GET /api/auto-sync/status
 * Obtiene el estado del servicio de auto-sincronización
 */
router.get('/status', (req, res) => {
  try {
    const status = autoSyncService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        message: status.enabled 
          ? (status.isRunning ? 'Auto-sincronización activa' : 'Auto-sincronización habilitada pero no iniciada')
          : 'Auto-sincronización deshabilitada'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-sync/start
 * Inicia el servicio de auto-sincronización
 */
router.post('/start', (req, res) => {
  try {
    autoSyncService.start();
    const status = autoSyncService.getStatus();
    
    res.json({
      success: true,
      message: 'Auto-sincronización iniciada',
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-sync/stop
 * Detiene el servicio de auto-sincronización
 */
router.post('/stop', (req, res) => {
  try {
    autoSyncService.stop();
    
    res.json({
      success: true,
      message: 'Auto-sincronización detenida'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-sync/force
 * Fuerza una sincronización inmediata
 */
router.post('/force', async (req, res) => {
  try {
    // Ejecutar sincronización en segundo plano
    autoSyncService.forceSyncNow().catch(err => {
      console.error('Error en sincronización forzada:', err);
    });
    
    res.json({
      success: true,
      message: 'Sincronización forzada iniciada. Revisa los logs para ver el progreso.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
