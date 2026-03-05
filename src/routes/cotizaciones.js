import express from 'express';
import cotizacionesService from '../services/cotizacionesService.js';

const router = express.Router();

/**
 * POST /api/cotizaciones
 * Crear nueva cotización
 */
router.post('/', async (req, res) => {
  try {
    const { cotizacion, pasajeros } = req.body;

    if (!cotizacion) {
      return res.status(400).json({
        error: 'Faltan datos de la cotización'
      });
    }

    // Validaciones básicas
    const camposRequeridos = ['created_by', 'nombre_cliente', 'tipo_vista', 'tipo_vuelo', 'origen', 'destino', 'fecha_salida', 'moneda_precio', 'moneda_cotizacion', 'precio_final_cotizacion'];
    const faltantes = camposRequeridos.filter(campo => !cotizacion[campo] && cotizacion[campo] !== 0);

    if (faltantes.length > 0) {
      return res.status(400).json({
        error: `Faltan campos requeridos: ${faltantes.join(', ')}`
      });
    }

    const resultado = await cotizacionesService.crearCotizacion(cotizacion, pasajeros || []);

    res.status(201).json({
      success: true,
      data: resultado,
      message: 'Cotización creada exitosamente'
    });

  } catch (error) {
    console.error('[Cotizaciones API] Error creando cotización:', error);
    res.status(500).json({
      error: error.message || 'Error al crear cotización',
      details: error.toString()
    });
  }
});

/**
 * GET /api/cotizaciones/:id
 * Obtener cotización por ID con pasajeros e historial
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID de la cotización' });
    }

    const cotizacion = await cotizacionesService.obtenerCotizacion(id);

    res.json({
      success: true,
      data: cotizacion
    });

  } catch (error) {
    console.error('[Cotizaciones API] Error obteniendo cotización:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener cotización',
      details: error.toString()
    });
  }
});

/**
 * PUT /api/cotizaciones/:id
 * Actualizar cotización existente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updates, userId } = req.body;

    if (!id || !updates || !userId) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: id, updates, userId'
      });
    }

    const cotizacion = await cotizacionesService.actualizarCotizacion(id, updates, userId);

    res.json({
      success: true,
      data: cotizacion,
      message: 'Cotización actualizada exitosamente'
    });

  } catch (error) {
    console.error('[Cotizaciones API] Error actualizando cotización:', error);
    res.status(500).json({
      error: error.message || 'Error al actualizar cotización',
      details: error.toString()
    });
  }
});

/**
 * DELETE /api/cotizaciones/:id
 * Eliminar cotización
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID de la cotización' });
    }

    await cotizacionesService.eliminarCotizacion(id);

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });

  } catch (error) {
    console.error('[Cotizaciones API] Error eliminando cotización:', error);
    res.status(500).json({
      error: error.message || 'Error al eliminar cotización',
      details: error.toString()
    });
  }
});

/**
 * PATCH /api/cotizaciones/:id/estado
 * Cambiar estado de una cotización
 */
router.patch('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, userId, razon } = req.body;

    if (!id || !estado || !userId) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: estado, userId'
      });
    }

    const estadosValidos = ['PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }

    const cotizacion = await cotizacionesService.cambiarEstado(id, estado, userId, razon);

    res.json({
      success: true,
      data: cotizacion,
      message: `Estado cambiado a ${estado} exitosamente`
    });

  } catch (error) {
    console.error('[Cotizaciones API] Error cambiando estado:', error);
    res.status(500).json({
      error: error.message || 'Error al cambiar estado',
      details: error.toString()
    });
  }
});

export default router;
