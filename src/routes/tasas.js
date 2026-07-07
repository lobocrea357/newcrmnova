import express from 'express';
import tasasService from '../services/tasasService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * PUT /api/tasas/actualizar
 * Actualizar tasa de conversión con registro en historial
 */
router.put('/actualizar', async (req, res) => {
  try {
    const { id, tasa, userId, motivo } = req.body;

    if (!id || !tasa || !userId) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: id, tasa, userId' 
      });
    }

    const updated = await tasasService.actualizarTasa(id, tasa, userId, motivo);

    res.json({ 
      success: true, 
      data: updated,
      message: 'Tasa actualizada exitosamente'
    });

  } catch (error) {
    console.error('[Tasas API] Error actualizando tasa:', error);
    res.status(500).json({ 
      error: error.message || 'Error al actualizar tasa',
      details: error.toString()
    });
  }
});

/**
 * POST /api/tasas/crear
 * Crear nueva conversión con registro en historial
 */
router.post('/crear', async (req, res) => {
  try {
    const { origenId, destinoId, tasa, descripcion, userId } = req.body;

    if (!origenId || !destinoId || !tasa || !userId) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: origenId, destinoId, tasa, userId' 
      });
    }

    const created = await tasasService.crearConversion(
      origenId, 
      destinoId, 
      tasa, 
      descripcion, 
      userId
    );

    res.json({ 
      success: true, 
      data: created,
      message: 'Conversión creada exitosamente'
    });

  } catch (error) {
    console.error('[Tasas API] Error creando conversión:', error);
    res.status(500).json({ 
      error: error.message || 'Error al crear conversión',
      details: error.toString()
    });
  }
});

/**
 * DELETE /api/tasas/eliminar/:id
 * Eliminar conversión con registro en historial
 */
router.delete('/eliminar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, motivo } = req.body;

    if (!id || !userId) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: id, userId' 
      });
    }

    await tasasService.eliminarConversion(id, userId, motivo);

    res.json({ 
      success: true,
      message: 'Conversión eliminada exitosamente'
    });

  } catch (error) {
    console.error('[Tasas API] Error eliminando conversión:', error);
    res.status(500).json({ 
      error: error.message || 'Error al eliminar conversión',
      details: error.toString()
    });
  }
});

/**
 * POST /api/tasas/crear-moneda
 * Crear nueva moneda
 */
router.post('/crear-moneda', async (req, res) => {
  try {
    const { codigo, nombre, simbolo } = req.body;

    if (!codigo || !nombre || !simbolo) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: codigo, nombre, simbolo' 
      });
    }

    const created = await tasasService.crearMoneda(codigo, nombre, simbolo);

    res.json({ 
      success: true, 
      data: created,
      message: 'Moneda creada exitosamente'
    });

  } catch (error) {
    console.error('[Tasas API] Error creando moneda:', error);
    res.status(500).json({ 
      error: error.message || 'Error al crear moneda',
      details: error.toString()
    });
  }
});

/**
 * PUT /api/tasas/actualizar-moneda
 * Actualizar moneda existente
 */
router.put('/actualizar-moneda', async (req, res) => {
  try {
    const { id, codigo, nombre, simbolo } = req.body;

    if (!id || !codigo || !nombre || !simbolo) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: id, codigo, nombre, simbolo' 
      });
    }

    const updated = await tasasService.actualizarMoneda(id, codigo, nombre, simbolo);

    res.json({ 
      success: true, 
      data: updated,
      message: 'Moneda actualizada exitosamente'
    });

  } catch (error) {
    console.error('[Tasas API] Error actualizando moneda:', error);
    res.status(500).json({ 
      error: error.message || 'Error al actualizar moneda',
      details: error.toString()
    });
  }
});

/**
 * DELETE /api/tasas/eliminar-moneda/:id
 * Eliminar (desactivar) moneda
 */
router.delete('/eliminar-moneda/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        error: 'Falta parámetro requerido: id' 
      });
    }

    const deleted = await tasasService.eliminarMoneda(id);

    res.json({ 
      success: true, 
      data: deleted,
      message: 'Moneda desactivada exitosamente'
    });

  } catch (error) {
    console.error('[Tasas API] Error eliminando moneda:', error);
    res.status(500).json({ 
      error: error.message || 'Error al eliminar moneda',
      details: error.toString()
    });
  }
});

/**
 * GET /api/tasas/activas
 * Obtener todas las tasas de cambio activas
 */
router.get('/activas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasas_conversion')
      .select(`
        *,
        moneda_origen:monedas!tasas_conversion_moneda_origen_id_fkey(id, codigo, nombre, simbolo),
        moneda_destino:monedas!tasas_conversion_moneda_destino_id_fkey(id, codigo, nombre, simbolo)
      `)
      .eq('activa', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tasasFormateadas = {}
    data.forEach(tasa => {
      const key = `${tasa.moneda_origen.codigo}_${tasa.moneda_destino.codigo}`
      tasasFormateadas[key] = tasa.tasa
    })

    res.json(tasasFormateadas);

  } catch (error) {
    console.error('[Tasas API] Error obteniendo tasas activas:', error);
    res.status(500).json({ 
      error: error.message || 'Error al obtener tasas activas',
      details: error.toString()
    });
  }
});

// Endpoint temporal para obtener monedas (debug)
router.get('/monedas-debug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('monedas')
      .select('*')
      .eq('activa', true)
      .order('codigo');

    if (error) throw error;

    res.json({ 
      success: true, 
      data: data,
      message: 'Monedas obtenidas para debug'
    });

  } catch (error) {
    console.error('[Tasas API] Error obteniendo monedas:', error);
    res.status(500).json({ 
      error: error.message || 'Error al obtener monedas',
      details: error.toString()
    });
  }
});

export default router;
