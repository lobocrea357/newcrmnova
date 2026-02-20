import { supabase } from '../config/supabase.js';

/**
 * Servicio para gestión de tasas de conversión con historial automático
 */
class TasasService {
  /**
   * Actualizar tasa de conversión y registrar en historial
   */
  async actualizarTasa(id, nuevaTasa, userId, motivo = 'Modificación manual') {
    try {
      console.log(`[TasasService] Actualizando tasa ${id} a ${nuevaTasa} por usuario ${userId}`);

      // 1. Obtener estado actual
      const { data: actual, error: errorActual } = await supabase
        .from('tasas_conversion')
        .select('*')
        .eq('id', id)
        .single();

      if (errorActual) {
        console.error('[TasasService] Error obteniendo tasa actual:', errorActual);
        throw errorActual;
      }

      if (!actual) {
        throw new Error('Tasa no encontrada');
      }

      // 2. Actualizar tasa
      const { data: updated, error: errorUpdate } = await supabase
        .from('tasas_conversion')
        .update({ 
          tasa: parseFloat(nuevaTasa),
          actualizado_por: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (errorUpdate) {
        console.error('[TasasService] Error actualizando tasa:', errorUpdate);
        throw errorUpdate;
      }

      // 3. Registrar en historial solo si cambió
      if (actual.tasa !== parseFloat(nuevaTasa)) {
        console.log(`[TasasService] Registrando cambio: ${actual.tasa} → ${nuevaTasa}`);
        await this.registrarCambio(
          id,
          actual.moneda_origen_id,
          actual.moneda_destino_id,
          actual.tasa,
          parseFloat(nuevaTasa),
          userId,
          motivo
        );
      } else {
        console.log('[TasasService] No hay cambio en la tasa, no se registra en historial');
      }

      return updated;

    } catch (error) {
      console.error('[TasasService] Error en actualizarTasa:', error);
      throw error;
    }
  }

  /**
   * Crear nueva conversión y registrar en historial
   */
  async crearConversion(origenId, destinoId, tasa, descripcion, userId) {
    try {
      console.log(`[TasasService] Creando conversión ${origenId} → ${destinoId} = ${tasa}`);

      // Validar que no sean la misma moneda
      if (origenId === destinoId) {
        throw new Error('No se puede crear una conversión de una moneda a sí misma');
      }

      // 1. Verificar si ya existe
      const { data: existente } = await supabase
        .from('tasas_conversion')
        .select('id')
        .eq('moneda_origen_id', origenId)
        .eq('moneda_destino_id', destinoId)
        .maybeSingle();

      if (existente) {
        throw new Error('Ya existe una conversión entre estas monedas');
      }

      // 2. Crear conversión
      const { data, error } = await supabase
        .from('tasas_conversion')
        .insert([{
          moneda_origen_id: origenId,
          moneda_destino_id: destinoId,
          tasa: parseFloat(tasa),
          descripcion,
          actualizado_por: userId,
          activa: true
        }])
        .select()
        .single();

      if (error) {
        console.error('[TasasService] Error creando conversión:', error);
        throw error;
      }

      // 3. Registrar creación en historial
      console.log(`[TasasService] Registrando creación de conversión en historial`);
      await this.registrarCambio(
        data.id,
        origenId,
        destinoId,
        null,
        parseFloat(tasa),
        userId,
        'Creación de conversión'
      );

      return data;

    } catch (error) {
      console.error('[TasasService] Error en crearConversion:', error);
      throw error;
    }
  }

  /**
   * Eliminar conversión y registrar en historial
   */
  async eliminarConversion(id, userId, motivo = 'Eliminación de conversión') {
    try {
      console.log(`[TasasService] Eliminando conversión ${id}`);

      // 1. Obtener datos antes de eliminar
      const { data: actual, error: errorActual } = await supabase
        .from('tasas_conversion')
        .select('*')
        .eq('id', id)
        .single();

      if (errorActual) {
        console.error('[TasasService] Error obteniendo conversión:', errorActual);
        throw errorActual;
      }

      if (!actual) {
        throw new Error('Conversión no encontrada');
      }

      // 2. Registrar eliminación ANTES de eliminar
      console.log(`[TasasService] Registrando eliminación en historial`);
      await this.registrarCambio(
        id,
        actual.moneda_origen_id,
        actual.moneda_destino_id,
        actual.tasa,
        null,
        userId,
        motivo
      );

      // 3. Eliminar historial asociado PRIMERO (respetar llave foránea)
      console.log(`[TasasService] Eliminando historial asociado`);
      const { error: errorHistorial } = await supabase
        .from('tasas_historial')
        .delete()
        .eq('tasa_conversion_id', id);

      if (errorHistorial) {
        console.error('[TasasService] Error eliminando historial:', errorHistorial);
        // No lanzar error, continuar con eliminación principal
      }

      // 4. Eliminar conversión
      console.log(`[TasasService] Eliminando conversión principal`);
      const { error: errorDelete } = await supabase
        .from('tasas_conversion')
        .delete()
        .eq('id', id);

      if (errorDelete) {
        console.error('[TasasService] Error eliminando conversión:', errorDelete);
        throw errorDelete;
      }

      console.log(`[TasasService] Conversión eliminada exitosamente`);

    } catch (error) {
      console.error('[TasasService] Error en eliminarConversion:', error);
      throw error;
    }
  }

  /**
   * Registrar cambio en historial
   */
  async registrarCambio(tasaConversionId, origenId, destinoId, tasaAnterior, tasaNueva, userId, motivo) {
    try {
      const { error } = await supabase
        .from('tasas_historial')
        .insert([{
          tasa_conversion_id: tasaConversionId,
          moneda_origen_id: origenId,
          moneda_destino_id: destinoId,
          tasa_anterior: tasaAnterior,
          tasa_nueva: tasaNueva,
          motivo,
          modificado_por: userId,
          fecha_cambio: new Date().toISOString()
        }]);

      if (error) {
        console.error('[TasasService] Error registrando en historial:', error);
        throw error;
      }

      console.log('[TasasService] Cambio registrado en historial exitosamente');

    } catch (error) {
      console.error('[TasasService] Error en registrarCambio:', error);
      // No lanzar error para no bloquear la operación principal
    }
  }

  /**
   * Crear nueva moneda
   */
  async crearMoneda(codigo, nombre, simbolo) {
    try {
      console.log(`[TasasService] Creando moneda ${codigo}`);

      const { data, error } = await supabase
        .from('monedas')
        .insert([{
          codigo: codigo.toUpperCase(),
          nombre,
          simbolo,
          activa: true
        }])
        .select()
        .single();

      if (error) {
        console.error('[TasasService] Error creando moneda:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('[TasasService] Error en crearMoneda:', error);
      throw error;
    }
  }

  /**
   * Actualizar moneda existente
   */
  async actualizarMoneda(id, codigo, nombre, simbolo) {
    try {
      console.log(`[TasasService] Actualizando moneda ${id}`);

      const { data, error } = await supabase
        .from('monedas')
        .update({
          codigo: codigo.toUpperCase(),
          nombre,
          simbolo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[TasasService] Error actualizando moneda:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('[TasasService] Error en actualizarMoneda:', error);
      throw error;
    }
  }

  /**
   * Eliminar moneda con eliminación en cascada
   */
  async eliminarMoneda(id) {
    try {
      console.log(`[TasasService] Eliminando moneda ${id} con cascada`);

      // 1. Obtener tasas de conversión asociadas
      const { data: tasasAsociadas, error: errorTasas } = await supabase
        .from('tasas_conversion')
        .select('id')
        .or(`moneda_origen_id.eq.${id},moneda_destino_id.eq.${id}`);

      if (errorTasas) {
        console.error('[TasasService] Error obteniendo tasas asociadas:', errorTasas);
        throw errorTasas;
      }

      // 2. Eliminar historial de tasas asociadas PRIMERO
      if (tasasAsociadas && tasasAsociadas.length > 0) {
        console.log(`[TasasService] Eliminando historial de ${tasasAsociadas.length} tasas asociadas`);
        
        const tasaIds = tasasAsociadas.map(t => t.id);
        
        const { error: errorHistorial } = await supabase
          .from('tasas_historial')
          .delete()
          .in('tasa_conversion_id', tasaIds);

        if (errorHistorial) {
          console.error('[TasasService] Error eliminando historial en cascada:', errorHistorial);
          // Continuar aunque falle el historial
        }
      }

      // 3. Eliminar tasas de conversión asociadas
      if (tasasAsociadas && tasasAsociadas.length > 0) {
        console.log(`[TasasService] Eliminando ${tasasAsociadas.length} tasas de conversión asociadas`);
        
        const { error: errorTasasDelete } = await supabase
          .from('tasas_conversion')
          .delete()
          .or(`moneda_origen_id.eq.${id},moneda_destino_id.eq.${id}`);

        if (errorTasasDelete) {
          console.error('[TasasService] Error eliminando tasas en cascada:', errorTasasDelete);
          throw errorTasasDelete;
        }
      }

      // 4. Desactivar moneda
      console.log(`[TasasService] Desactivando moneda principal`);
      const { data, error } = await supabase
        .from('monedas')
        .update({ 
          activa: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[TasasService] Error desactivando moneda:', error);
        throw error;
      }

      console.log(`[TasasService] Moneda eliminada exitosamente con ${tasasAsociadas?.length || 0} tasas asociadas`);
      return data;

    } catch (error) {
      console.error('[TasasService] Error en eliminarMoneda:', error);
      throw error;
    }
  }
}

export default new TasasService();
