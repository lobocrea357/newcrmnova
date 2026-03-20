import express from 'express';
import multer from 'multer';
import vuelosService from '../services/vuelosService.js';
import { supabase } from '../config/supabase.js';
import { notificarNuevoVuelo, notificarVueloEmitido } from '../services/notificacionesService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/vuelos - Crear nuevo vuelo
 */
router.post('/', async (req, res) => {
  try {
    const { vuelo, pasajeros, adjuntos } = req.body;

    // Validaciones básicas
    const camposRequeridos = ['created_by', 'pax_nombre', 'contacto_nombre', 'contacto_telefono', 'fecha_vuelo', 'ruta', 'proveedor', 'monto_venta', 'tipo_vuelo'];
    const faltantes = camposRequeridos.filter(campo => !vuelo[campo] && vuelo[campo] !== 0);

    if (faltantes.length > 0) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        campos: faltantes
      });
    }

    // Validar tipo de vuelo
    const tiposValidos = ['solo_ida', 'ida_vuelta', 'migratorio'];
    if (!tiposValidos.includes(vuelo.tipo_vuelo)) {
      return res.status(400).json({
        error: 'Tipo de vuelo inválido',
        tiposValidos
      });
    }

    // Crear vuelo con pasajeros y adjuntos
    const resultado = await vuelosService.crearVuelo(vuelo, pasajeros || [], adjuntos || []);

    // Obtener nombre del creador para la notificación
    const { data: creadorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', vuelo.created_by)
      .single();

    const creadorNombre = creadorProfile?.full_name || 'Un asesor';
    const vueloCreado = resultado.vuelo || { ...vuelo, id: resultado.id };

    // Disparar notificaciones de forma asíncrona (no bloquea la respuesta)
    notificarNuevoVuelo(vueloCreado, creadorNombre).catch(err =>
      console.error('Error en notificaciones async:', err)
    );

    res.status(201).json({
      message: 'Vuelo creado exitosamente',
      ...resultado
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos:', error);
    res.status(500).json({
      error: 'Error al crear vuelo',
      details: error.message
    });
  }
});


/**
 * POST /api/vuelos/:id/adjuntos - Subir adjunto (comprobante o pasaporte)
 */
router.post('/:id/adjuntos', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_adjunto, uploaded_by, pasajero_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    if (!tipo_adjunto || !uploaded_by) {
      return res.status(400).json({ error: 'tipo_adjunto y uploaded_by son requeridos' });
    }

    // Validar tipo de adjunto
    if (!['COMPROBANTE_PAGO', 'PASAPORTE'].includes(tipo_adjunto)) {
      return res.status(400).json({ error: 'tipo_adjunto inválido' });
    }

    // Subir a Supabase Storage
    const timestamp = Date.now();
    const fileName = `${id}_${tipo_adjunto}_${timestamp}_${file.originalname}`;
    const filePath = `vuelos/${fileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('vuelos-adjuntos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (storageError) {
      console.error('Error subiendo a Storage:', storageError);
      return res.status(500).json({ error: 'Error al subir archivo', details: storageError.message });
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('vuelos-adjuntos')
      .getPublicUrl(filePath);

    // Guardar referencia en vuelos_adjuntos
    const { data: adjunto, error: dbError } = await supabase
      .from('vuelos_adjuntos')
      .insert({
        vuelo_id: id,
        tipo_adjunto,
        nombre_archivo: file.originalname,
        url_storage: publicUrlData.publicUrl,
        mime_type: file.mimetype,
        tamano_bytes: file.size,
        uploaded_by,
        pasajero_id: pasajero_id || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error guardando adjunto en BD:', dbError);
      return res.status(500).json({ error: 'Error al guardar adjunto', details: dbError.message });
    }

    res.status(201).json({
      message: 'Adjunto subido exitosamente',
      adjunto
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos/:id/adjuntos:', error);
    res.status(500).json({
      error: 'Error al subir adjunto',
      details: error.message
    });
  }
});

/**
 * GET /api/vuelos - Obtener lista de vuelos (filtrada por rol)
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, role, tipo_vuelo, estado, fecha_desde, fecha_hasta, search } = req.query;

    const vuelos = await vuelosService.obtenerVuelos({
      userId: user_id,
      role: role,
      filters: { tipo_vuelo, estado, fecha_desde, fecha_hasta, search }
    });

    res.json({
      data: vuelos,
      total: vuelos.length
    });

  } catch (error) {
    console.error('Error en GET /api/vuelos:', error);
    res.status(500).json({
      error: 'Error al obtener vuelos',
      details: error.message
    });
  }
});

/**
 * GET /api/vuelos/:id - Obtener vuelo por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vuelo = await vuelosService.obtenerVuelo(id);

    if (!vuelo) {
      return res.status(404).json({
        error: 'Vuelo no encontrado'
      });
    }

    res.json({ data: vuelo });

  } catch (error) {
    console.error('Error en GET /api/vuelos/:id:', error);
    res.status(500).json({
      error: 'Error al obtener vuelo',
      details: error.message
    });
  }
});

/**
 * GET /api/vuelos/estado/:estado - Obtener vuelos por estado
 */
router.get('/estado/:estado', async (req, res) => {
  try {
    const { estado } = req.params;

    // Validar estado
    const estadosValidos = ['PENDIENTE_CONFIRMACION_PAGO', 'PENDIENTE_EMISION', 'EMITIDO', 'CANCELADO'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido',
        estadosValidos
      });
    }

    const vuelos = await vuelosService.obtenerVuelosPorEstado(estado);

    res.json(vuelos);

  } catch (error) {
    console.error('Error en GET /api/vuelos/estado/:estado:', error);
    res.status(500).json({
      error: 'Error al obtener vuelos',
      details: error.message
    });
  }
});

/**
 * PATCH /api/vuelos/:id/confirmar-pago - Confirmar pago (Admin)
 */
router.patch('/:id/confirmar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId es requerido'
      });
    }

    const vuelo = await vuelosService.confirmarPago(id, userId);

    res.json({
      message: 'Pago confirmado exitosamente',
      vuelo
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos/:id/confirmar-pago:', error);
    res.status(500).json({
      error: 'Error al confirmar pago',
      details: error.message
    });
  }
});

/**
 * PATCH /api/vuelos/:id/marcar-emitido - Marcar como emitido
 */
router.patch('/:id/marcar-emitido', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId es requerido'
      });
    }

    const vuelo = await vuelosService.marcarEmitido(id, userId);

    res.json({
      message: 'Vuelo marcado como emitido exitosamente',
      vuelo
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos/:id/marcar-emitido:', error);
    res.status(500).json({
      error: 'Error al marcar como emitido',
      details: error.message
    });
  }
});

/**
 * PUT /api/vuelos/:id - Actualizar vuelo
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No permitir actualizar estos campos directamente
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    delete updates.estado; // Se actualiza con endpoints específicos
    delete updates.pago_confirmado_por;
    delete updates.pago_confirmado_at;
    delete updates.emitido_por;
    delete updates.emitido_at;

    const vuelo = await vuelosService.actualizarVuelo(id, updates);

    res.json({
      message: 'Vuelo actualizado exitosamente',
      vuelo
    });

  } catch (error) {
    console.error('Error en PUT /api/vuelos/:id:', error);
    res.status(500).json({
      error: 'Error al actualizar vuelo',
      details: error.message
    });
  }
});

/**
 * PUT /api/vuelos/pasajeros/:pasajeroId - Actualizar datos de pasajero
 */
router.put('/pasajeros/:pasajeroId', async (req, res) => {
  try {
    const { pasajeroId } = req.params;
    const updates = req.body;

    // No permitir actualizar estos campos
    delete updates.id;
    delete updates.vuelo_id;
    delete updates.created_at;

    const pasajero = await vuelosService.actualizarPasajero(pasajeroId, updates);

    res.json({
      message: 'Pasajero actualizado exitosamente',
      pasajero
    });

  } catch (error) {
    console.error('Error en PUT /api/vuelos/pasajeros/:pasajeroId:', error);
    res.status(500).json({
      error: 'Error al actualizar pasajero',
      details: error.message
    });
  }
});

/**
 * DELETE /api/vuelos/:id - Eliminar vuelo
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await vuelosService.eliminarVuelo(id);

    res.json({
      message: 'Vuelo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/vuelos/:id:', error);
    res.status(500).json({
      error: 'Error al eliminar vuelo',
      details: error.message
    });
  }
});

/**
 * POST /api/vuelos/:vueloId/copiar-pasajeros - Copiar pasajeros de cotización
 */
router.post('/:vueloId/copiar-pasajeros', async (req, res) => {
  try {
    const { vueloId } = req.params;
    const { cotizacionId } = req.body;

    if (!cotizacionId) {
      return res.status(400).json({
        error: 'cotizacionId es requerido'
      });
    }

    const pasajeros = await vuelosService.copiarPasajerosDeCotizacion(cotizacionId, vueloId);

    res.json({
      message: 'Pasajeros copiados exitosamente',
      pasajeros
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos/:vueloId/copiar-pasajeros:', error);
    res.status(500).json({
      error: 'Error al copiar pasajeros',
      details: error.message
    });
  }
});

export default router;
