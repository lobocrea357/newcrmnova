import { supabase } from '../config/supabase.js';

/**
 * Servicio para gestión de vuelos
 */
class VuelosService {
  /**
   * Crear un nuevo vuelo con pasajeros y adjuntos
   */
  async crearVuelo(vueloData, pasajeros = [], adjuntos = []) {
    try {
      console.log('[VuelosService] Creando vuelo para:', vueloData.pax_nombre);

      // 1. Insertar vuelo principal
      const { data: vuelo, error: errorVuelo } = await supabase
        .from('vuelos')
        .insert([vueloData])
        .select()
        .single();

      if (errorVuelo) {
        console.error('[VuelosService] Error creando vuelo:', errorVuelo);
        throw errorVuelo;
      }

      console.log('[VuelosService] Vuelo creado:', vuelo.id);

      // 2. Insertar pasajeros si los hay
      let pasajerosCreados = [];
      if (pasajeros.length > 0) {
        const pasajerosConVueloId = pasajeros.map(p => ({
          ...p,
          vuelo_id: vuelo.id
        }));

        const { data: pasajerosData, error: errorPasajeros } = await supabase
          .from('vuelos_pasajeros')
          .insert(pasajerosConVueloId)
          .select();

        if (errorPasajeros) {
          console.error('[VuelosService] Error creando pasajeros:', errorPasajeros);
          // No lanzar error - el vuelo ya se creó
          return { 
            vuelo, 
            pasajeros: [], 
            adjuntos: [],
            warning: 'Vuelo creado pero error al guardar pasajeros' 
          };
        }

        pasajerosCreados = pasajerosData;
        console.log(`[VuelosService] ${pasajerosCreados.length} pasajeros creados`);
      }

      // 3. Insertar adjuntos si los hay
      let adjuntosCreados = [];
      if (adjuntos.length > 0) {
        const adjuntosConVueloId = adjuntos.map(adj => ({
          ...adj,
          vuelo_id: vuelo.id
        }));

        const { data: adjuntosData, error: errorAdjuntos } = await supabase
          .from('vuelos_adjuntos')
          .insert(adjuntosConVueloId)
          .select();

        if (errorAdjuntos) {
          console.error('[VuelosService] Error creando adjuntos:', errorAdjuntos);
          // No lanzar error
          return {
            vuelo,
            pasajeros: pasajerosCreados,
            adjuntos: [],
            warning: 'Vuelo creado pero error al guardar adjuntos'
          };
        }

        adjuntosCreados = adjuntosData;
        console.log(`[VuelosService] ${adjuntosCreados.length} adjuntos creados`);
      }

      return { 
        vuelo, 
        pasajeros: pasajerosCreados,
        adjuntos: adjuntosCreados
      };

    } catch (error) {
      console.error('[VuelosService] Error en crearVuelo:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de vuelos filtrada por rol del usuario
   * @param {Object} options - { userId, role, filters }
   */
  async obtenerVuelos({ userId, role, filters = {} } = {}) {
    try {
      // Construir query base
      let query = supabase
        .from('vuelos')
        .select(`
          *,
          creator:profiles!created_by(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Filtrado por rol
      if (role === 'asesor') {
        // Asesor solo ve sus propios vuelos
        query = query.eq('created_by', userId);
      } else if (role === 'gerente') {
        // Gerente ve sus vuelos + los de sus asesores (profiles en equipos donde gerente_id = userId)
        const { data: equipos } = await supabase
          .from('equipos')
          .select('id')
          .eq('gerente_id', userId)
          .eq('is_active', true);

        const equipoIds = (equipos || []).map(e => e.id);
        
        if (equipoIds.length > 0) {
          const { data: asesores } = await supabase
            .from('profiles')
            .select('id')
            .in('equipo_id', equipoIds);

          const asesorIds = (asesores || []).map(a => a.id);
          const todosIds = [userId, ...asesorIds];
          query = query.in('created_by', todosIds);
        } else {
          // Si no tiene equipos, solo ve sus propios vuelos
          query = query.eq('created_by', userId);
        }
      }
      // admin/superadmin: sin filtro, ve todos

      // Filtros adicionales de query params
      if (filters.tipo_vuelo) query = query.eq('tipo_vuelo', filters.tipo_vuelo);
      if (filters.estado) query = query.eq('estado', filters.estado);
      if (filters.fecha_desde) query = query.gte('fecha_vuelo', filters.fecha_desde);
      if (filters.fecha_hasta) query = query.lte('fecha_vuelo', filters.fecha_hasta);
      if (filters.search) {
        query = query.or(`pax_nombre.ilike.%${filters.search}%,ruta.ilike.%${filters.search}%,localizador.ilike.%${filters.search}%`);
      }

      const { data: vuelos, error: queryError } = await query;

      if (queryError) {
        console.error('[VuelosService] Error obteniendo vuelos:', queryError);
        throw queryError;
      }

      return vuelos || [];
    } catch (error) {
      console.error('[VuelosService] Error en obtenerVuelos:', error);
      throw error;
    }
  }

  /**
   * Obtener vuelo por ID con pasajeros y adjuntos
   */
  async obtenerVuelo(id) {
    try {
      const { data: vuelo, error } = await supabase
        .from('vuelos')
        .select(`
          *,
          pasajeros:vuelos_pasajeros(*),
          adjuntos:vuelos_adjuntos(*),
          cotizacion:cotizaciones(
            id,
            nombre_cliente,
            estado,
            pasajeros:cotizaciones_pasajeros(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[VuelosService] Error obteniendo vuelo:', error);
        throw error;
      }

      return vuelo;

    } catch (error) {
      console.error('[VuelosService] Error en obtenerVuelo:', error);
      throw error;
    }
  }

  /**
   * Obtener vuelos por estado
   */
  async obtenerVuelosPorEstado(estado) {
    try {
      const { data: vuelos, error } = await supabase
        .from('vuelos')
        .select(`
          *,
          pasajeros:vuelos_pasajeros(*),
          adjuntos:vuelos_adjuntos(*)
        `)
        .eq('estado', estado)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VuelosService] Error obteniendo vuelos por estado:', error);
        throw error;
      }

      return vuelos;

    } catch (error) {
      console.error('[VuelosService] Error en obtenerVuelosPorEstado:', error);
      throw error;
    }
  }

  /**
   * Confirmar pago de un vuelo (Admin)
   */
  async confirmarPago(id, userId) {
    try {
      console.log(`[VuelosService] Confirmando pago del vuelo ${id}`);

      const { data: vuelo, error } = await supabase
        .from('vuelos')
        .update({
          estado: 'PENDIENTE_EMISION',
          pago_confirmado_por: userId,
          pago_confirmado_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[VuelosService] Error confirmando pago:', error);
        throw error;
      }

      console.log('[VuelosService] Pago confirmado exitosamente');
      return vuelo;

    } catch (error) {
      console.error('[VuelosService] Error en confirmarPago:', error);
      throw error;
    }
  }

  /**
   * Marcar vuelo como emitido
   */
  async marcarEmitido(id, userId) {
    try {
      console.log(`[VuelosService] Marcando vuelo ${id} como emitido`);

      const { data: vuelo, error } = await supabase
        .from('vuelos')
        .update({
          estado: 'EMITIDO',
          emitido_por: userId,
          emitido_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[VuelosService] Error marcando como emitido:', error);
        throw error;
      }

      console.log('[VuelosService] Vuelo marcado como emitido');
      return vuelo;

    } catch (error) {
      console.error('[VuelosService] Error en marcarEmitido:', error);
      throw error;
    }
  }

  /**
   * Actualizar vuelo existente
   */
  async actualizarVuelo(id, updates) {
    try {
      console.log(`[VuelosService] Actualizando vuelo ${id}`);

      const { data: vuelo, error } = await supabase
        .from('vuelos')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[VuelosService] Error actualizando vuelo:', error);
        throw error;
      }

      return vuelo;

    } catch (error) {
      console.error('[VuelosService] Error en actualizarVuelo:', error);
      throw error;
    }
  }

  /**
   * Actualizar datos de un pasajero
   */
  async actualizarPasajero(pasajeroId, updates) {
    try {
      console.log(`[VuelosService] Actualizando pasajero ${pasajeroId}`);

      const { data: pasajero, error } = await supabase
        .from('vuelos_pasajeros')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', pasajeroId)
        .select()
        .single();

      if (error) {
        console.error('[VuelosService] Error actualizando pasajero:', error);
        throw error;
      }

      return pasajero;

    } catch (error) {
      console.error('[VuelosService] Error en actualizarPasajero:', error);
      throw error;
    }
  }

  /**
   * Eliminar vuelo (CASCADE elimina pasajeros y adjuntos)
   */
  async eliminarVuelo(id) {
    try {
      console.log(`[VuelosService] Eliminando vuelo ${id}`);

      const { error } = await supabase
        .from('vuelos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[VuelosService] Error eliminando vuelo:', error);
        throw error;
      }

      console.log('[VuelosService] Vuelo eliminado exitosamente');

    } catch (error) {
      console.error('[VuelosService] Error en eliminarVuelo:', error);
      throw error;
    }
  }

  /**
   * Copiar pasajeros de cotización a vuelo
   */
  async copiarPasajerosDeCotizacion(cotizacionId, vueloId) {
    try {
      console.log(`[VuelosService] Copiando pasajeros de cotización ${cotizacionId} a vuelo ${vueloId}`);

      // Obtener pasajeros de cotización
      const { data: pasajerosCotizacion, error: errorGetPasajeros } = await supabase
        .from('cotizaciones_pasajeros')
        .select('*')
        .eq('cotizacion_id', cotizacionId);

      if (errorGetPasajeros) {
        console.error('[VuelosService] Error obteniendo pasajeros de cotización:', errorGetPasajeros);
        throw errorGetPasajeros;
      }

      if (!pasajerosCotizacion || pasajerosCotizacion.length === 0) {
        console.log('[VuelosService] No hay pasajeros en la cotización');
        return [];
      }

      // Mapear a formato de vuelos_pasajeros
      const pasajerosVuelo = pasajerosCotizacion.map(p => ({
        vuelo_id: vueloId,
        cotizacion_pasajero_id: p.id,
        tipo: p.tipo,
        orden: p.orden,
        precio_pantalla: p.precio_pantalla,
        fee_emision: p.fee_emision,
        fee_agencia: p.fee_agencia,
        equipaje_completo: p.equipaje_completo,
        equipaje_mediano: p.equipaje_mediano,
        equipaje_ligero: p.equipaje_ligero
      }));

      // Insertar pasajeros
      const { data: pasajerosCreados, error: errorInsert } = await supabase
        .from('vuelos_pasajeros')
        .insert(pasajerosVuelo)
        .select();

      if (errorInsert) {
        console.error('[VuelosService] Error insertando pasajeros:', errorInsert);
        throw errorInsert;
      }

      console.log(`[VuelosService] ${pasajerosCreados.length} pasajeros copiados exitosamente`);
      return pasajerosCreados;

    } catch (error) {
      console.error('[VuelosService] Error en copiarPasajerosDeCotizacion:', error);
      throw error;
    }
  }
}

export default new VuelosService();
