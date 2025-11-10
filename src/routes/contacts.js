import express from 'express';
import contactService from '../services/contactService.js';

const router = express.Router();

/**
 * GET /contacts/bot/:botId
 * Obtiene todos los contactos de un bot
 */
router.get('/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const contacts = await contactService.getContactsByBot(botId);
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error obteniendo contactos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /contacts/search
 * Busca contactos por nombre o teléfono
 */
router.get('/search', async (req, res) => {
  try {
    const { botId, query } = req.query;

    if (!botId || !query) {
      return res.status(400).json({ success: false, error: 'botId y query son requeridos' });
    }

    const contacts = await contactService.searchContacts(botId, query);
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error buscando contactos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
