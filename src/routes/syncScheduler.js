import express from 'express';
import syncSchedulerService from '../services/syncSchedulerService.js';

const router = express.Router();

/**
 * GET /api/sync-scheduler/status
 * Obtiene el estado del servicio de auto-sincronización
 */
router.get('/status', (req, res) => {
  try {
    const status = syncSchedulerService.getStatus();
    
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
 * POST /api/sync-scheduler/start
 * Inicia el servicio de auto-sincronización
 */
router.post('/start', (req, res) => {
  try {
    syncSchedulerService.start();
    const status = syncSchedulerService.getStatus();
    
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
 * POST /api/sync-scheduler/stop
 * Detiene el servicio de auto-sincronización
 */
router.post('/stop', (req, res) => {
  try {
    syncSchedulerService.stop();
    
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
 * POST /api/sync-scheduler/force
 * Fuerza una sincronización inmediata
 */
router.post('/force', async (req, res) => {
  try {
    // Ejecutar sincronización en segundo plano
    syncSchedulerService.forceSyncNow().catch(err => {
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
