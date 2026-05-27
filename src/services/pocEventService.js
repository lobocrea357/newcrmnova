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

  /**
   * Sincroniza ventas históricas desde la tabla vuelos
   * Revisa todos los vuelos y crea eventos SALE_CONFIRMED para aquellos que no tienen uno
   * @param {Object} options - Opciones de sincronización
   * @param {boolean} options.dryRun - Si true, solo reporta sin crear eventos (default: false)
   * @param {Function} options.onProgress - Callback de progreso (processed, total, created)
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  async syncHistoricalSales(options = {}) {
    const { dryRun = false, onProgress } = options;

    console.log('[PoC Events] Iniciando sincronización histórica de ventas...');
    console.log(`[PoC Events] Modo: ${dryRun ? 'DRY RUN (solo reporte)' : 'EJECUCIÓN REAL'}`);

    try {
      // Paso 1: Obtener todos los vuelos
      const { data: vuelos, error: vuelosError } = await supabase
        .from('vuelos')
        .select('id, contacto_telefono, monto_venta, ruta, fecha_vuelo, created_at')
        .order('created_at', { ascending: false });

      if (vuelosError) throw vuelosError;

      if (!vuelos || vuelos.length === 0) {
        console.log('[PoC Events] No hay vuelos para procesar');
        return {
          success: true,
          total_vuelos: 0,
          threads_encontrados: 0,
          eventos_creados: 0,
          vuelos_sin_thread: 0,
          detalles: []
        };
      }

      console.log(`[PoC Events] ${vuelos.length} vuelos encontrados`);

      let threadsEncontrados = 0;
      let eventosCreados = 0;
      let vuelosSinThread = 0;
      const detalles = [];

      // Paso 2: Procesar cada vuelo
      for (let i = 0; i < vuelos.length; i++) {
        const vuelo = vuelos[i];
        const progress = ((i + 1) / vuelos.length * 100).toFixed(1);

        console.log(`[PoC Events] Procesando vuelo ${i + 1}/${vuelos.length}:`, {
          vuelo_id: vuelo.id,
          telefono: vuelo.contacto_telefono,
          monto: vuelo.monto_venta
        });

        // Buscar thread por teléfono
        const { data: thread, error: threadError } = await supabase
          .from('poc_customer_threads')
          .select('id, customer_phone, customer_name')
          .eq('customer_phone', vuelo.contacto_telefono)
          .single();

        console.log(`[PoC Events] Búsqueda de thread para teléfono ${vuelo.contacto_telefono}:`, {
          encontrado: !!thread,
          error: threadError?.message
        });

        if (threadError || !thread) {
          vuelosSinThread++;
          detalles.push({
            vuelo_id: vuelo.id,
            telefono: vuelo.contacto_telefono,
            estado: 'SIN_THREAD',
            razon: 'No existe thread con este teléfono'
          });
          
          if (onProgress) {
            onProgress(i + 1, vuelos.length, eventosCreados, progress);
          }
          continue;
        }

        threadsEncontrados++;
        console.log(`[PoC Events] Thread encontrado:`, {
          thread_id: thread.id,
          telefono_thread: thread.customer_phone,
          telefono_vuelo: vuelo.contacto_telefono
        });

        // Verificar si ya existe evento SALE_CONFIRMED para este vuelo
        // Usar .maybeSingle() en lugar de .single() para que retorne null si no hay evento
        // en lugar de lanzar un error PGRST116
        const { data: eventoExistente, error: eventoError } = await supabase
          .from('poc_thread_events')
          .select('id')
          .eq('thread_id', thread.id)
          .eq('related_vuelo_id', vuelo.id)
          .eq('event_type', 'SALE_CONFIRMED')
          .maybeSingle();

        console.log(`[PoC Events] Verificación de evento existente:`, {
          existe: !!eventoExistente,
          error: eventoError?.message
        });

        // Si hay error real (no el PGRST116 de "no rows"), logearlo y continuar
        if (eventoError) {
          console.warn(`[PoC Events] Error verificando evento existente:`, eventoError);
        }

        if (eventoExistente) {
          detalles.push({
            vuelo_id: vuelo.id,
            thread_id: thread.id,
            telefono: vuelo.contacto_telefono,
            estado: 'YA_EXISTE',
            razon: 'Evento SALE_CONFIRMED ya existe'
          });
          
          if (onProgress) {
            onProgress(i + 1, vuelos.length, eventosCreados, progress);
          }
          continue;
        }

        // Crear evento si no es dry run
        if (!dryRun) {
          console.log(`[PoC Events] Creando evento para vuelo ${vuelo.id}...`);
          
          const { data: evento, error: insertError } = await supabase
            .from('poc_thread_events')
            .insert({
              thread_id: thread.id,
              event_type: 'SALE_CONFIRMED',
              event_subtype: 'AUTO_DETECTED_HISTORICAL',
              occurred_at: vuelo.created_at || new Date().toISOString(),
              event_data: {
                vuelo_id: vuelo.id,
                amount: vuelo.monto_venta,
                origen: vuelo.ruta,
                destino: vuelo.ruta,
                fecha_salida: vuelo.fecha_vuelo
              },
              related_vuelo_id: vuelo.id,
              is_milestone: true,
              is_system_generated: true,
              notes: 'Venta detectada en sincronización histórica'
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[PoC Events] Error creando evento para vuelo ${vuelo.id}:`, insertError);
            detalles.push({
              vuelo_id: vuelo.id,
              thread_id: thread.id,
              telefono: vuelo.contacto_telefono,
              estado: 'ERROR',
              razon: insertError.message
            });
          } else {
            eventosCreados++;
            console.log(`[PoC Events] ✅ Evento creado exitosamente:`, {
              evento_id: evento.id,
              thread_id: thread.id,
              vuelo_id: vuelo.id
            });
            detalles.push({
              vuelo_id: vuelo.id,
              thread_id: thread.id,
              telefono: vuelo.contacto_telefono,
              estado: 'CREADO',
              evento_id: evento.id,
              monto: vuelo.monto_venta
            });
          }
        } else {
          // Dry run: solo reportar
          eventosCreados++;
          console.log(`[PoC Events] Dry run: Se crearía evento para vuelo ${vuelo.id}`);
          detalles.push({
            vuelo_id: vuelo.id,
            thread_id: thread.id,
            telefono: vuelo.contacto_telefono,
            estado: 'DRY_RUN_CREARIA',
            monto: vuelo.monto_venta
          });
        }

        if (onProgress) {
          onProgress(i + 1, vuelos.length, eventosCreados, progress);
        }
      }

      const resultado = {
        success: true,
        total_vuelos: vuelos.length,
        threads_encontrados: threadsEncontrados,
        eventos_creados: eventosCreados,
        vuelos_sin_thread: vuelosSinThread,
        detalles
      };

      console.log('[PoC Events] ✅ Sincronización histórica completada:', resultado);
      return resultado;
    } catch (error) {
      console.error('[PoC Events] ❌ Error en sincronización histórica:', error);
      throw error;
    }
  }
}

export default new PoCEventService();
