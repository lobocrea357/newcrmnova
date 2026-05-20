import { Router } from 'express';
import pocThreadService from '../services/pocThreadService.js';
import pocEventService from '../services/pocEventService.js';
import pocLeadStatusService from '../services/pocLeadStatusService.js';

const router = Router();

/**
 * POST /api/poc/threads/sync
 * Sincroniza threads desde chats existentes
 * @returns {success: boolean, count: number}
 */
router.post('/threads/sync', async (req, res) => {
  try {
    const result = await pocThreadService.syncThreadsFromMessages();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[PoC API] Error syncing threads:', error);
    res.status(500).json({
      success: false,
      error: 'SyncError',
      message: 'Error sincronizando threads',
      details: error.message
    });
  }
});

/**
 * GET /api/poc/threads
 * Obtiene threads con métricas y chats vinculados
 * @query {number} limit - Cantidad de threads (default: 50)
 * @returns {success: boolean, data: Thread[], meta: object}
 */
router.get('/threads', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    if (limit < 1 || limit > 200) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Limit debe estar entre 1 y 200'
      });
    }

    const threads = await pocThreadService.getThreads(limit);
    
    res.json({
      success: true,
      data: threads,
      meta: {
        count: threads.length,
        limit
      }
    });
  } catch (error) {
    console.error('[PoC API] Error fetching threads:', error);
    res.status(500).json({
      success: false,
      error: 'FetchError',
      message: 'Error obteniendo threads',
      details: error.message
    });
  }
});

/**
 * GET /api/poc/threads/stats
 * Estadísticas generales de threads
 * @returns {success: boolean, data: {total, fragmented, reassignments, fragmentation_rate}}
 */
router.get('/threads/stats', async (req, res) => {
  try {
    const threads = await pocThreadService.getThreads(1000);

    const total = threads.length;
    const fragmented = threads.filter(t => (t.metrics?.[0]?.total_chats || 0) > 1).length;
    const reassignments = threads.reduce((sum, t) => {
      const chatsCount = t.metrics?.[0]?.total_chats || 1;
      return sum + (chatsCount - 1);
    }, 0);

    res.json({
      success: true,
      data: {
        total,
        fragmented,
        reassignments,
        fragmentation_rate: total > 0 ? (fragmented / total * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('[PoC API] Error calculating stats:', error);
    res.status(500).json({
      success: false,
      error: 'StatsError',
      message: 'Error calculando estadísticas',
      details: error.message
    });
  }
});

// ============================================================================
// EVENTOS
// ============================================================================

/**
 * POST /api/poc/threads/:id/events
 * Crea un evento manual en un thread
 * @param {string} id - UUID del thread
 * @body {event_type, event_data, notes}
 * @returns {success: boolean, data: Event}
 */
router.post('/threads/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const eventData = {
      thread_id: id,
      ...req.body
    };

    const event = await pocEventService.createEvent(eventData);

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('[PoC API] Error creating event:', error);
    res.status(400).json({
      success: false,
      error: 'EventCreationError',
      message: 'Error creando evento',
      details: error.message
    });
  }
});

/**
 * GET /api/poc/threads/:id/events
 * Obtiene eventos de un thread con filtros opcionales
 * @param {string} id - UUID del thread
 * @query {event_type, limit, offset}
 * @returns {success: boolean, data: Event[]}
 */
router.get('/threads/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const { event_type, limit, offset } = req.query;

    const options = {
      event_type,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };

    const events = await pocEventService.getEventsByThread(id, options);

    res.json({
      success: true,
      data: events,
      meta: {
        count: events.length,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    console.error('[PoC API] Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'EventsFetchError',
      message: 'Error obteniendo eventos',
      details: error.message
    });
  }
});

/**
 * POST /api/poc/threads/:id/mark-sale
 * Atajo para marcar una venta (crea evento SALE_CONFIRMED)
 * @param {string} id - UUID del thread
 * @body {amount, currency, notes}
 * @returns {success: boolean, data: Event}
 */
router.post('/threads/:id/mark-sale', async (req, res) => {
  try {
    const { id } = req.params;
    const saleData = req.body;

    const event = await pocEventService.markSale(id, saleData);

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('[PoC API] Error marking sale:', error);
    res.status(400).json({
      success: false,
      error: 'SaleMarkError',
      message: 'Error marcando venta',
      details: error.message
    });
  }
});

// ============================================================================
// TIMELINE
// ============================================================================

/**
 * GET /api/poc/threads/:id/timeline
 * Obtiene timeline de mensajes de un thread
 * @param {string} id - UUID del thread
 * @returns {success: boolean, data: Message[]}
 */
router.get('/threads/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;

    const messages = await pocThreadService.getThreadTimeline(id);

    res.json({
      success: true,
      data: messages,
      meta: {
        count: messages.length
      }
    });
  } catch (error) {
    console.error('[PoC API] Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      error: 'TimelineFetchError',
      message: 'Error obteniendo timeline',
      details: error.message
    });
  }
});

/**
 * GET /api/poc/threads/:id/timeline-enriched
 * Obtiene timeline enriquecido (mensajes + eventos intercalados)
 * @param {string} id - UUID del thread
 * @returns {success: boolean, data: TimelineItem[]}
 */
router.get('/threads/:id/timeline-enriched', async (req, res) => {
  try {
    const { id } = req.params;

    const timeline = await pocEventService.getEnrichedTimeline(id);

    res.json({
      success: true,
      data: timeline,
      meta: {
        count: timeline.length
      }
    });
  } catch (error) {
    console.error('[PoC API] Error fetching enriched timeline:', error);
    res.status(500).json({
      success: false,
      error: 'EnrichedTimelineFetchError',
      message: 'Error obteniendo timeline enriquecido',
      details: error.message
    });
  }
});

// ============================================================================
// ESTADOS
// ============================================================================

/**
 * GET /api/poc/threads/:id/status
 * Obtiene el estado actual de un thread
 * @param {string} id - UUID del thread
 * @returns {success: boolean, data: Status}
 */
router.get('/threads/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const status = await pocLeadStatusService.getStatus(id);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Estado no encontrado para este thread'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[PoC API] Error fetching status:', error);
    res.status(500).json({
      success: false,
      error: 'StatusFetchError',
      message: 'Error obteniendo estado',
      details: error.message
    });
  }
});

/**
 * PATCH /api/poc/threads/:id/status
 * Cambia el estado de un thread manualmente
 * @param {string} id - UUID del thread
 * @body {new_status, notes}
 * @returns {success: boolean, data: Status}
 */
router.patch('/threads/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, notes } = req.body;

    const status = await pocLeadStatusService.changeStatus(id, {
      new_status,
      notes
    });

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[PoC API] Error changing status:', error);
    res.status(400).json({
      success: false,
      error: 'StatusChangeError',
      message: 'Error cambiando estado',
      details: error.message
    });
  }
});

/**
 * GET /api/poc/status/stats
 * Obtiene estadísticas generales de estados
 * @returns {success: boolean, data: StatusStats}
 */
router.get('/status/stats', async (req, res) => {
  try {
    const stats = await pocLeadStatusService.getStatusStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[PoC API] Error fetching status stats:', error);
    res.status(500).json({
      success: false,
      error: 'StatusStatsError',
      message: 'Error obteniendo estadísticas de estados',
      details: error.message
    });
  }
});

export default router;
