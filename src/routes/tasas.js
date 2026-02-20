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
