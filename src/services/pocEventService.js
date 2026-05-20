import { supabase } from '../config/supabase.js';
import pocThreadService from './pocThreadService.js';

class PoCEventService {
  /**
   * Tipos de eventos válidos
   */
  EVENT_TYPES = {
    SALE_CONFIRMED: 'SALE_CONFIRMED',
    QUOTATION_SENT: 'QUOTATION_SENT',
    FOLLOW_UP: 'FOLLOW_UP',
    STATUS_CHANGED: 'STATUS_CHANGED',
    BOT_REASSIGNED: 'BOT_REASSIGNED',
    MANUAL_NOTE: 'MANUAL_NOTE'
  };

  /**
   * Crea un evento manual en un thread
   * @param {Object} eventData - Datos del evento
   * @param {string} eventData.thread_id - UUID del thread
   * @param {string} eventData.event_type - Tipo de evento
   * @param {string} eventData.event_data - Datos adicionales (JSON)
   * @param {string} eventData.notes - Notas opcionales
   * @returns {Promise<Object>} Evento creado
   */
  async createEvent(eventData) {
    const { thread_id, event_type, event_data, notes } = eventData;

    // Validaciones
    if (!thread_id) {
      throw new Error('thread_id es requerido');
    }
    if (!event_type) {
      throw new Error('event_type es requerido');
    }
    if (!Object.values(this.EVENT_TYPES).includes(event_type)) {
      throw new Error(`event_type inválido. Valores válidos: ${Object.values(this.EVENT_TYPES).join(', ')}`);
    }

    // Verificar que el thread existe
    const { data: thread, error: threadError } = await supabase
      .from('poc_customer_threads')
      .select('id')
      .eq('id', thread_id)
      .single();

    if (threadError || !thread) {
      throw new Error('Thread no encontrado');
    }

    // Crear evento
    const { data: event, error } = await supabase
      .from('poc_thread_events')
      .insert({
        thread_id,
        event_type,
        event_data: event_data || {},
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[PoC Events] Evento creado: ${event_type} para thread ${thread_id}`);
    return event;
  }

  /**
   * Obtiene eventos de un thread con filtros opcionales
   * @param {string} threadId - UUID del thread
   * @param {Object} options - Opciones de filtrado
   * @param {string} options.event_type - Filtrar por tipo de evento
   * @param {number} options.limit - Límite de resultados (default: 50)
   * @param {number} options.offset - Offset para paginación
   * @returns {Promise<Array>} Lista de eventos
   */
  async getEventsByThread(threadId, options = {}) {
    const { event_type, limit = 50, offset = 0 } = options;

    let query = supabase
      .from('poc_thread_events')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    return events || [];
  }

  /**
   * Atajo para marcar una venta (crea evento SALE_CONFIRMED)
   * @param {string} threadId - UUID del thread
   * @param {Object} saleData - Datos de la venta
   * @param {string} saleData.amount - Monto de la venta
   * @param {string} saleData.currency - Moneda (USD, EUR, etc.)
   * @param {string} saleData.notes - Notas adicionales
   * @returns {Promise<Object>} Evento de venta creado
   */
  async markSale(threadId, saleData = {}) {
    const { amount, currency = 'USD', notes } = saleData;

    // Validaciones
    if (!amount) {
      throw new Error('amount es requerido para marcar venta');
    }

    // Crear evento de venta
    const event = await this.createEvent({
      thread_id: threadId,
      event_type: this.EVENT_TYPES.SALE_CONFIRMED,
      event_data: {
        amount: parseFloat(amount),
        currency
      },
      notes: notes || 'Venta confirmada'
    });

    console.log(`[PoC Events] Venta marcada: ${amount} ${currency} para thread ${threadId}`);
    return event;
  }

  /**
   * Obtiene timeline enriquecido (mensajes + eventos intercalados)
   * @param {string} threadId - UUID del thread
   * @returns {Promise<Array>} Timeline con mensajes y eventos ordenados cronológicamente
   */
  async getEnrichedTimeline(threadId) {
    // Obtener mensajes del thread usando pocThreadService
    const messages = await pocThreadService.getThreadTimeline(threadId);

    // Obtener eventos del thread
    const events = await this.getEventsByThread(threadId, { limit: 100 });

    // Combinar y ordenar cronológicamente
    const timeline = [
      ...messages.map(msg => ({
        type: 'message',
        timestamp: msg.timestamp || msg.created_at,
        data: msg
      })),
      ...events.map(event => ({
        type: 'event',
        timestamp: event.created_at,
        data: event
      }))
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return timeline;
  }

  /**
   * Obtiene eventos recientes de múltiples threads
   * @param {Array<string>} threadIds - Array de UUIDs de threads
   * @param {number} limit - Límite de resultados (default: 20)
   * @returns {Promise<Array>} Lista de eventos recientes
   */
  async getRecentEvents(threadIds, limit = 20) {
    const { data: events, error } = await supabase
      .from('poc_thread_events')
      .select('*')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return events || [];
  }

  /**
   * Elimina un evento (soft delete)
   * @param {string} eventId - UUID del evento
   * @returns {Promise<Object>} Evento eliminado
   */
  async deleteEvent(eventId) {
    const { data: event, error } = await supabase
      .from('poc_thread_events')
      .delete()
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    console.log(`[PoC Events] Evento eliminado: ${eventId}`);
    return event;
  }
}

export default new PoCEventService();
