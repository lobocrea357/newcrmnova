import express from 'express';
import syncService from '../services/syncService.js';

const router = express.Router();

/**
 * POST /sync/:sessionName/contacts
 * Sincroniza todos los contactos de un bot
 * Solo actualiza contactos con campos NULL
 */
router.post('/:sessionName/contacts', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    console.log(`\n🔄 Solicitud de sincronización de contactos: ${sessionName}`);
    
    const result = await syncService.syncContacts(sessionName);
    
    res.status(200).json({
      success: true,
      message: 'Sincronización de contactos completada',
      data: result
    });
  } catch (error) {
    console.error('❌ Error en sincronización de contactos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /sync/:sessionName/chats
 * Sincroniza todos los chats de un bot
 * Actualiza nombres, últimos mensajes y metadatos
 */
router.post('/:sessionName/chats', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    console.log(`\n🔄 Solicitud de sincronización de chats: ${sessionName}`);
    
    const result = await syncService.syncChats(sessionName);
    
    res.status(200).json({
      success: true,
      message: 'Sincronización de chats completada',
      data: result
    });
  } catch (error) {
    console.error('❌ Error en sincronización de chats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /sync/:sessionName/all
 * Sincroniza TODOS los datos del bot: contactos y chats
 * Esta es la opción recomendada para sincronización completa
 */
router.post('/:sessionName/all', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    console.log(`\n🚀 Solicitud de sincronización COMPLETA: ${sessionName}`);
    
    const result = await syncService.syncAll(sessionName);
    
    res.status(200).json({
      success: true,
      message: 'Sincronización completa terminada',
      data: result
    });
  } catch (error) {
    console.error('❌ Error en sincronización completa:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /sync/:sessionName/enrich-contacts
 * Enriquece TODOS los contactos con datos NULL (nombre, foto)
 */
router.post('/:sessionName/enrich-contacts', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    console.log(`\n🔍 Solicitud de enriquecimiento de contactos: ${sessionName}`);
    
    // Importar contactEnrichmentService
    const { default: contactEnrichmentService } = await import('../services/contactEnrichmentService.js');
    
    // Ejecutar enriquecimiento
    const result = await contactEnrichmentService.enrichAllContactsWithNullData();
    
    res.status(200).json({
      success: true,
      message: 'Enriquecimiento de contactos completado',
      data: result
    });
  } catch (error) {
    console.error('❌ Error en enriquecimiento de contactos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /sync/status
 * Verifica el estado del servicio de sincronización
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servicio de sincronización disponible',
    endpoints: {
      contacts: 'POST /sync/:sessionName/contacts',
      chats: 'POST /sync/:sessionName/chats',
      all: 'POST /sync/:sessionName/all',
      enrichContacts: 'POST /sync/:sessionName/enrich-contacts'
    }
  });
});

export default router;
