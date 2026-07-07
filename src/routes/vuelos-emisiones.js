import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * PATCH /api/vuelos-emisiones/:id/cambiar-cuenta
 * Actualizar solo cuenta_emision_asignada con validaciones
 */
router.patch('/:id/cambiar-cuenta', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, nueva_cuenta, observaciones } = req.body;

    // Validaciones de entrada
    if (!userId) {
      return res.status(400).json({
        error: 'userId es requerido'
      });
    }

    if (!nueva_cuenta) {
      return res.status(400).json({
        error: 'nueva_cuenta es requerida'
      });
    }

    // Obtener el vuelo actual
    const { data: vuelo, error: fetchError } = await supabase
      .from('vuelos')
      .select('id, estado, forma_emision, cuenta_emision_asignada, autorizado_emision')
      .eq('id', id)
      .single();

    if (fetchError || !vuelo) {
      return res.status(404).json({
        error: 'Vuelo no encontrado',
        details: fetchError?.message
      });
    }

    // Validación: solo permitir si está en PENDIENTE_EMISION y no autorizado
    if (vuelo.estado !== 'PENDIENTE_EMISION') {
      return res.status(400).json({
        error: 'Solo se puede cambiar la cuenta en vuelos PENDIENTE_EMISION'
      });
    }

    if (vuelo.autorizado_emision) {
      return res.status(400).json({
        error: 'No se puede cambiar la cuenta de un vuelo ya autorizado'
      });
    }

    // Validación: Si es CONTADO y selecciona Servivuelo/Chase -> OK
    // Si es CONTADO y selecciona otros -> OK
    // Si es CREDITO y selecciona Servivuelo/Chase -> ERROR
    if (vuelo.forma_emision === 'CREDITO') {
      const cuentasContadoOnly = ['SERVIVUELO_1', 'SERVIVUELO_2', 'CHASE_NOVA', 'CHASE_APOLO'];
      if (cuentasContadoOnly.includes(nueva_cuenta)) {
        return res.status(400).json({
          error: 'Las cuentas Servivuelo y Chase solo permiten emisiones CONTADO',
          details: 'Este vuelo es a CREDITO. Seleccione otra cuenta de emisión.'
        });
      }
    }

    // Actualizar la cuenta
    const { data: vueloActualizado, error: updateError } = await supabase
      .from('vuelos')
      .update({
        cuenta_emision_asignada: nueva_cuenta,
        observaciones_emision: observaciones || vuelo.observaciones_emision,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Error al actualizar cuenta de emisión',
        details: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cuenta de emisión actualizada exitosamente',
      vuelo: vueloActualizado
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos-emisiones/:id/cambiar-cuenta:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/vuelos-emisiones/pendientes/agrupados
 * Obtener vuelos pendientes agrupados por cuenta_emision_asignada
 * Query params: ?incluir_detalles=true
 */
router.get('/pendientes/agrupados', async (req, res) => {
  try {
    const { incluir_detalles = 'false' } = req.query;

    // Obtener todos los vuelos pendientes de emisión
    const { data: vuelos, error: fetchError } = await supabase
      .from('vuelos')
      .select(`
        id,
        pax_nombre,
        ruta,
        fecha_vuelo,
        localizador,
        proveedor,
        monto_venta,
        metodo_pago,
        forma_emision,
        cuenta_emision_original,
        cuenta_emision_asignada,
        autorizado_emision,
        observaciones_emision,
        created_at,
        pasajeros:vuelos_pasajeros(id, nombre_completo, precio_pantalla),
        adjuntos:vuelos_adjuntos(id, tipo_adjunto, url_storage)
      `)
      .eq('estado', 'PENDIENTE_EMISION')
      .eq('autorizado_emision', false)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return res.status(500).json({
        error: 'Error al obtener vuelos',
        details: fetchError.message
      });
    }

    // Agrupar por cuenta_emision_asignada
    const grupos = {};
    
    vuelos.forEach(vuelo => {
      const cuenta = vuelo.cuenta_emision_asignada || 'SIN_CUENTA';
      
      if (!grupos[cuenta]) {
        grupos[cuenta] = {
          vuelos: [],
          total_vuelos: 0,
          total_monto: 0,
          forma_emision: {
            CONTADO: 0,
            CREDITO: 0
          }
        };
      }

      grupos[cuenta].vuelos.push(vuelo);
      grupos[cuenta].total_vuelos += 1;
      grupos[cuenta].total_monto += parseFloat(vuelo.monto_venta || 0);
      
      if (vuelo.forma_emision === 'CONTADO') {
        grupos[cuenta].forma_emision.CONTADO += 1;
      } else if (vuelo.forma_emision === 'CREDITO') {
        grupos[cuenta].forma_emision.CREDITO += 1;
      }
    });

    // Calcular totales generales
    const total_general = vuelos.length;
    const monto_general = vuelos.reduce((sum, v) => sum + parseFloat(v.monto_venta || 0), 0);

    return res.status(200).json({
      success: true,
      grupos,
      total_general,
      monto_general: parseFloat(monto_general.toFixed(2))
    });

  } catch (error) {
    console.error('Error en GET /api/vuelos-emisiones/pendientes/agrupados:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

export default router;
