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
 * POST /sync/:sessionName/contacts-without-names
 * Sincroniza SOLO los contactos que no tienen nombre
 */
router.post('/:sessionName/contacts-without-names', async (req, res) => {
  try {
    const { sessionName } = req.params;
    
    console.log(`\n👤 Solicitud de sincronización de contactos sin nombre: ${sessionName}`);
    
    // Importar autoSyncService
    const { default: autoSyncService } = await import('../services/autoSyncService.js');
    
    // Ejecutar sincronización
    await autoSyncService.syncContactsWithoutNames();
    
    res.status(200).json({
      success: true,
      message: 'Sincronización de contactos sin nombre completada'
    });
  } catch (error) {
    console.error('❌ Error en sincronización de contactos sin nombre:', error);
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
      contactsWithoutNames: 'POST /sync/:sessionName/contacts-without-names'
    }
  });
});

export default router;
