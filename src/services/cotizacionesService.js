import { supabase } from '../config/supabase.js';

/**
 * Servicio para gestión de cotizaciones de vuelos
 */
class CotizacionesService {
  /**
   * Crear una nueva cotización con sus pasajeros (si aplica)
   */
  async crearCotizacion(cotizacionData, pasajeros = []) {
    try {
      console.log('[CotizacionesService] Creando cotización para:', cotizacionData.nombre_cliente);

      // 1. Insertar cotización principal con estado EN_REVISION por defecto
      const cotizacionConEstado = {
        ...cotizacionData,
        estado: 'EN_REVISION' // Estado inicial siempre EN_REVISION
      };

      const { data: cotizacion, error: errorCotizacion } = await supabase
        .from('cotizaciones')
        .insert([cotizacionConEstado])
        .select()
        .single();

      if (errorCotizacion) {
        console.error('[CotizacionesService] Error creando cotización:', errorCotizacion);
        throw errorCotizacion;
      }

      console.log('[CotizacionesService] Cotización creada:', cotizacion.id);

      // 2. Si hay pasajeros (vista múltiple), insertarlos
      if (pasajeros.length > 0) {
        const pasajerosConCotizacionId = pasajeros.map(p => ({
          ...p,
          cotizacion_id: cotizacion.id
        }));

        const { data: pasajerosCreados, error: errorPasajeros } = await supabase
          .from('cotizaciones_pasajeros')
          .insert(pasajerosConCotizacionId)
          .select();

        if (errorPasajeros) {
          console.error('[CotizacionesService] Error creando pasajeros:', errorPasajeros);
          // No lanzar error - la cotización ya se creó
          return { cotizacion, pasajeros: [], warning: 'Cotización creada pero error al guardar pasajeros' };
        }

        console.log(`[CotizacionesService] ${pasajerosCreados.length} pasajeros creados`);
        return { cotizacion, pasajeros: pasajerosCreados };
      }

      return { cotizacion, pasajeros: [] };

    } catch (error) {
      console.error('[CotizacionesService] Error en crearCotizacion:', error);
      throw error;
    }
  }

  /**
   * Obtener cotización por ID con pasajeros e historial
   */
  async obtenerCotizacion(id) {
    try {
      const { data: cotizacion, error } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          pasajeros:cotizaciones_pasajeros(*),
          historial:cotizaciones_historial(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[CotizacionesService] Error obteniendo cotización:', error);
        throw error;
      }

      return cotizacion;

    } catch (error) {
      console.error('[CotizacionesService] Error en obtenerCotizacion:', error);
      throw error;
    }
  }

  /**
   * Actualizar cotización existente
   */
  async actualizarCotizacion(id, updates, userId) {
    try {
      console.log(`[CotizacionesService] Actualizando cotización ${id}`);

      // Si se está cambiando el estado, el trigger automático registrará el historial
      const { data: cotizacion, error } = await supabase
        .from('cotizaciones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CotizacionesService] Error actualizando cotización:', error);
        throw error;
      }

      return cotizacion;

    } catch (error) {
      console.error('[CotizacionesService] Error en actualizarCotizacion:', error);
      throw error;
    }
  }

  /**
   * Eliminar cotización (CASCADE elimina pasajeros e historial)
   */
  async eliminarCotizacion(id) {
    try {
      console.log(`[CotizacionesService] Eliminando cotización ${id}`);

      const { error } = await supabase
        .from('cotizaciones')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[CotizacionesService] Error eliminando cotización:', error);
        throw error;
      }

      console.log('[CotizacionesService] Cotización eliminada exitosamente');

    } catch (error) {
      console.error('[CotizacionesService] Error en eliminarCotizacion:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de cotización
   */
  async cambiarEstado(id, nuevoEstado, userId, razon = null) {
    try {
      console.log(`[CotizacionesService] Cambiando estado de cotización ${id} a ${nuevoEstado}`);

      const updates = { estado: nuevoEstado };
      if (razon) {
        updates.razon_rechazo = razon;
      }

      const { data: cotizacion, error } = await supabase
        .from('cotizaciones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CotizacionesService] Error cambiando estado:', error);
        throw error;
      }

      return cotizacion;

    } catch (error) {
      console.error('[CotizacionesService] Error en cambiarEstado:', error);
      throw error;
    }
  }
}

export default new CotizacionesService();
