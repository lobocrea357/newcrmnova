import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * GET /dashboard/stats
 * Obtiene estadísticas generales del dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const { botId } = req.query;

    // Obtener estadísticas de bot_statistics view
    let query = supabase.from('bot_statistics').select('*');
    
    if (botId) {
      query = query.eq('bot_id', botId);
    }

    const { data: stats, error } = await query;

    if (error) throw error;

    // Calcular totales
    const totals = stats.reduce((acc, bot) => {
      acc.total_contacts += bot.total_contacts || 0;
      acc.total_chats += bot.total_chats || 0;
      acc.total_messages += bot.total_messages || 0;
      acc.sent_messages += bot.sent_messages || 0;
      acc.received_messages += bot.received_messages || 0;
      return acc;
    }, {
      total_contacts: 0,
      total_chats: 0,
      total_messages: 0,
      sent_messages: 0,
      received_messages: 0
    });

    res.json({
      success: true,
      data: {
        bots: stats,
        totals
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /dashboard/activity
 * Obtiene actividad reciente
 */
router.get('/activity', async (req, res) => {
  try {
    const { botId, limit = 20 } = req.query;

    let query = supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (botId) {
      query = query.eq('bot_id', botId);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo actividad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /dashboard/messages-by-hour
 * Obtiene mensajes agrupados por hora
 */
router.get('/messages-by-hour', async (req, res) => {
  try {
    const { botId, hours = 24 } = req.query;

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(hours));

    let query = supabase
      .from('messages')
      .select('timestamp, from_me')
      .gte('timestamp', startDate.toISOString());

    if (botId) {
      query = query.eq('bot_id', botId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Agrupar por hora
    const messagesByHour = {};
    data.forEach(msg => {
      const hour = new Date(msg.timestamp).toISOString().slice(0, 13);
      if (!messagesByHour[hour]) {
        messagesByHour[hour] = { sent: 0, received: 0 };
      }
      if (msg.from_me) {
        messagesByHour[hour].sent++;
      } else {
        messagesByHour[hour].received++;
      }
    });

    res.json({ success: true, data: messagesByHour });
  } catch (error) {
    console.error('Error obteniendo mensajes por hora:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /dashboard/top-contacts
 * Obtiene los contactos más activos
 */
router.get('/top-contacts', async (req, res) => {
  try {
    const { botId, limit = 10 } = req.query;

    if (!botId) {
      return res.status(400).json({ success: false, error: 'botId es requerido' });
    }

    const { data, error } = await supabase.rpc('get_top_contacts', {
      p_bot_id: botId,
      p_limit: parseInt(limit)
    });

    if (error) {
      // Si la función no existe, hacer query manual
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('contact_id, contacts(name, phone_number)')
        .eq('bot_id', botId)
        .not('contact_id', 'is', null);

      if (msgError) throw msgError;

      // Contar mensajes por contacto
      const contactCounts = {};
      messages.forEach(msg => {
        const contactId = msg.contact_id;
        if (!contactCounts[contactId]) {
          contactCounts[contactId] = {
            contact: msg.contacts,
            count: 0
          };
        }
        contactCounts[contactId].count++;
      });

      const topContacts = Object.values(contactCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, parseInt(limit));

      return res.json({ success: true, data: topContacts });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo top contactos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
