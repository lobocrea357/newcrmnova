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
    const camposRequeridos = ['created_by', 'nombre_cliente', 'tipo_vuelo', 'origen', 'destino', 'fecha_salida', 'moneda_precio', 'moneda_cotizacion', 'precio_final_cotizacion'];
    const faltantes = camposRequeridos.filter(campo => !cotizacion[campo] && cotizacion[campo] !== 0);

    if (faltantes.length > 0) {
      return res.status(400).json({
        error: `Faltan campos requeridos: ${faltantes.join(', ')}`
      });
    }

    // Validación condicional: si es ida_vuelta, fecha_regreso es requerida
    if (cotizacion.tipo_vuelo === 'ida_vuelta' && !cotizacion.fecha_regreso) {
      return res.status(400).json({
        error: 'Para vuelos de ida y vuelta, la fecha de regreso es requerida'
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
    // El frontend envía { cotizacion, pasajeros } — compatibilidad con ambos formatos
    const { cotizacion, pasajeros, updates, userId } = req.body;
    const updatesData = cotizacion || updates;
    const userIdData = (cotizacion && cotizacion.created_by) || userId;

    if (!id || !updatesData || !userIdData) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: id, datos de la cotización y userId'
      });
    }

    // VERIFICAR que el usuario sea el creador de la cotización
    const cotizacionExistente = await cotizacionesService.obtenerCotizacion(id);
    if (cotizacionExistente.created_by !== userIdData) {
      return res.status(403).json({
        error: 'No tienes permiso para editar esta cotización. Solo el creador puede editarla.'
      });
    }

    const cotizacionActualizada = await cotizacionesService.actualizarCotizacion(id, updatesData, userIdData);

    // Si se envían pasajeros, actualizar (eliminar los existentes e insertar nuevos)
    if (pasajeros && Array.isArray(pasajeros) && pasajeros.length > 0) {
      await cotizacionesService.actualizarPasajeros(id, pasajeros);
    }

    res.json({
      success: true,
      data: cotizacionActualizada,
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

/**
 * PATCH /api/cotizaciones/:id/soft-delete
 * Marcar cotización como eliminada (soft delete)
 */
router.patch('/:id/soft-delete', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !userId) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: userId'
      });
    }

    const cotizacion = await cotizacionesService.softDeleteCotizacion(id, userId);

    res.json({
      success: true,
      data: cotizacion,
      message: 'Cotización eliminada de tu espacio de trabajo'
    });

  } catch (error) {
    console.error('[Cotizaciones API] Error en soft delete:', error);
    res.status(500).json({
      error: error.message || 'Error al eliminar cotización',
      details: error.toString()
    });
  }
});

export default router;
