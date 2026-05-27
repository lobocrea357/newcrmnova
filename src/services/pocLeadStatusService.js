import { supabase } from '../config/supabase.js';

class PoCLeadStatusService {
  /**
   * Estados válidos de leads
   */
  STATUS_TYPES = {
    NUEVO: 'NUEVO',
    EN_NEGOCIACION: 'EN_NEGOCIACION',
    VENTA_CONCRETADA: 'VENTA_CONCRETADA',
    POST_VENTA: 'POST_VENTA',
    PERDIDO: 'PERDIDO'
  };

  /**
   * Flujo de estados permitido
   */
  STATUS_FLOW = {
    NUEVO: ['EN_NEGOCIACION', 'PERDIDO'],
    EN_NEGOCIACION: ['VENTA_CONCRETADA', 'PERDIDO'],
    VENTA_CONCRETADA: ['POST_VENTA'],
    POST_VENTA: [],
    PERDIDO: ['NUEVO'] // Permitir reactivación
  };

  /**
   * Obtiene el estado actual de un thread
   * @param {string} threadId - UUID del thread
   * @returns {Promise<Object>} Estado del thread
   */
  async getStatus(threadId) {
    const { data: status, error } = await supabase
      .from('poc_thread_status')
      .select('*')
      .eq('thread_id', threadId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error; // Error real, no es "not found"
    }

    // Si no existe estado, retornar null
    if (!status) {
      return null;
    }

    return status;
  }

  /**
   * Crea el estado inicial de un thread (NUEVO)
   * @param {string} threadId - UUID del thread
   * @returns {Promise<Object>} Estado inicial creado
   */
  async createInitialStatus(threadId) {
    // Verificar que el thread existe
    const { data: thread, error: threadError } = await supabase
      .from('poc_customer_threads')
      .select('id')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      throw new Error('Thread no encontrado');
    }

    // Verificar que no existe estado previo
    const existingStatus = await this.getStatus(threadId);
    if (existingStatus) {
      console.warn(`[PoC Lead Status] Thread ${threadId} ya tiene estado: ${existingStatus.current_status}`);
      return existingStatus;
    }

    // Crear estado inicial
    const { data: status, error } = await supabase
      .from('poc_thread_status')
      .insert({
        thread_id: threadId,
        current_status: this.STATUS_TYPES.NUEVO,
        first_contact_at: new Date().toISOString(),
        last_status_change_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[PoC Lead Status] Estado inicial creado: NUEVO para thread ${threadId}`);
    return status;
  }

  /**
   * Cambia el estado de un thread manualmente
   * ⚠️ IMPORTANTE: Usa import dinámico para evitar circular dependency
   * @param {string} threadId - UUID del thread
   * @param {Object} statusData - Datos del cambio de estado
   * @param {string} statusData.new_status - Nuevo estado
   * @param {string} statusData.notes - Notas del cambio
   * @returns {Promise<Object>} Estado actualizado
   */
  async changeStatus(threadId, statusData) {
    const { new_status, notes } = statusData;

    // Validaciones
    if (!threadId) {
      throw new Error('thread_id es requerido');
    }
    if (!new_status) {
      throw new Error('new_status es requerido');
    }
    if (!Object.values(this.STATUS_TYPES).includes(new_status)) {
      throw new Error(`new_status inválido. Valores válidos: ${Object.values(this.STATUS_TYPES).join(', ')}`);
    }

    // Obtener estado actual
    const currentStatus = await this.getStatus(threadId);
    const currentStatusValue = currentStatus?.current_status || this.STATUS_TYPES.NUEVO;

    // Validar flujo de estados
    const allowedTransitions = this.STATUS_FLOW[currentStatusValue] || [];
    if (allowedTransitions.length > 0 && !allowedTransitions.includes(new_status)) {
      throw new Error(`Transición no permitida: ${currentStatusValue} → ${new_status}. Transiciones permitidas: ${allowedTransitions.join(', ')}`);
    }

    // Actualizar estado
    const { data: status, error } = await supabase
      .from('poc_thread_status')
      .upsert({
        thread_id: threadId,
        current_status: new_status,
        first_contact_at: currentStatus?.first_contact_at || new Date().toISOString(),
        last_status_change_at: new Date().toISOString(),
        previous_status: currentStatusValue
      }, { onConflict: 'thread_id' })
      .select()
      .single();

    if (error) throw error;

    // Crear evento de cambio de estado usando import dinámico
    try {
      const pocEventService = (await import('./pocEventService.js')).default;
      await pocEventService.createEvent({
        thread_id: threadId,
        event_type: 'ESTADO_CAMBIADO',
        event_data: {
          from_status: currentStatusValue,
          to_status: new_status
        },
        notes: notes || `Estado cambiado de ${currentStatusValue} a ${new_status}`
      });
    } catch (eventError) {
      console.warn('[PoC Lead Status] Error creando evento ESTADO_CAMBIADO (no crítico):', eventError.message);
    }

    console.log(`[PoC Lead Status] Estado cambiado: ${currentStatusValue} → ${new_status} para thread ${threadId}`);
    return status;
  }

  /**
   * Obtiene estadísticas generales de estados
   * @returns {Promise<Object>} Estadísticas de estados
   */
  async getStatusStats() {
    const { data: statuses, error } = await supabase
      .from('poc_thread_status')
      .select('current_status');

    if (error) throw error;

    const stats = {
      total: statuses?.length || 0,
      by_status: {}
    };

    // Contar por estado
    for (const status of statuses || []) {
      const statusType = status.current_status;
      if (!stats.by_status[statusType]) {
        stats.by_status[statusType] = 0;
      }
      stats.by_status[statusType]++;
    }

    // Calcular porcentajes
    stats.by_status_percentage = {};
    for (const statusType in stats.by_status) {
      stats.by_status_percentage[statusType] = stats.total > 0 
        ? (stats.by_status[statusType] / stats.total * 100).toFixed(1)
        : 0;
    }

    return stats;
  }

  /**
   * Obtiene threads por estado
   * @param {string} status - Estado a filtrar
   * @param {number} limit - Límite de resultados (default: 50)
   * @returns {Promise<Array>} Threads con el estado especificado
   */
  async getThreadsByStatus(status, limit = 50) {
    if (!Object.values(this.STATUS_TYPES).includes(status)) {
      throw new Error(`status inválido. Valores válidos: ${Object.values(this.STATUS_TYPES).join(', ')}`);
    }

    const { data: statusRecords, error } = await supabase
      .from('poc_thread_status')
      .select(`
        *,
        thread:poc_customer_threads(
          *,
          metrics:poc_thread_metrics(*)
        )
      `)
      .eq('current_status', status)
      .order('last_status_change_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return statusRecords?.map(sr => sr.thread) || [];
  }

  /**
   * Obtiene historial de cambios de estado de un thread
   * @param {string} threadId - UUID del thread
   * @returns {Promise<Array>} Historial de cambios de estado
   */
  async getStatusHistory(threadId) {
    const { data: events, error } = await supabase
      .from('poc_thread_events')
      .select('*')
      .eq('thread_id', threadId)
      .eq('event_type', 'ESTADO_CAMBIADO')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return events || [];
  }
}

export default new PoCLeadStatusService();
