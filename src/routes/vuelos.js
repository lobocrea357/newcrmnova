import express from 'express';
import multer from 'multer';
import vuelosService from '../services/vuelosService.js';
import permisosService from '../services/permisosService.js';
import emisionesService from '../services/emisionesService.js';
import { obtenerHistorialCambios } from '../services/auditoriaService.js';
import { notificarNuevoVuelo, notificarVueloEmitido, notificarPagoObservado, notificarPagoConfirmado, notificarRecordatorioAutorizacion } from '../services/notificacionesService.js';
import { supabase } from '../config/supabase.js';

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

    // Validación condicional: si es ida_vuelta, fecha_regreso es requerida
    if (vuelo.tipo_vuelo === 'ida_vuelta' && !vuelo.fecha_regreso) {
      return res.status(400).json({
        error: 'Para vuelos de ida y vuelta, la fecha de regreso es requerida'
      });
    }

    // Validar tipo de documento de pasajeros
    if (pasajeros && pasajeros.length > 0) {
      const tiposDocumentoValidos = ['PASAPORTE', 'CEDULA'];
      
      for (const pasajero of pasajeros) {
        if (pasajero.tipo_documento && !tiposDocumentoValidos.includes(pasajero.tipo_documento)) {
          return res.status(400).json({
            error: `tipo_documento inválido para pasajero. Debe ser: ${tiposDocumentoValidos.join(', ')}`
          });
        }
      }
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
    if (!['COMPROBANTE_PAGO', 'PASAPORTE', 'CEDULA'].includes(tipo_adjunto)) {
      return res.status(400).json({ error: 'tipo_adjunto inválido. Debe ser: COMPROBANTE_PAGO, PASAPORTE, o CEDULA' });
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
 * PATCH /api/vuelos/:id/confirmar-pago - Confirmar pago (Solo admin, super_admin, administracion)
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

    // Validar que el usuario tenga un rol permitido
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        role:roles(
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        error: 'No tienes permisos para confirmar pagos. Esta acción está restringida a roles administrativos.',
        roles_permitidos: rolesPermitidos,
        tu_rol: userRole
      });
    }

    const vuelo = await vuelosService.confirmarPago(id, userId);

    // Obtener nombre del usuario para notificación
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const nombreUsuario = userProfile?.full_name || userRole;

    // Notificar al creador del vuelo (async, no bloquea respuesta)
    notificarPagoConfirmado(vuelo, nombreUsuario).catch(err =>
      console.error('Error en notificación async:', err)
    );

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
 * POST /api/vuelos/:id/observar-pago - Reportar observación en pago (Solo admin, super_admin, administracion)
 */
router.post('/:id/observar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, motivo, montoFaltante, observaciones } = req.body;

    if (!adminId || !motivo || !observaciones) {
      return res.status(400).json({
        error: 'Campos requeridos: adminId, motivo, observaciones'
      });
    }

    // Validar que el usuario tenga un rol permitido
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        role:roles(
          name
        )
      `)
      .eq('id', adminId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        error: 'No tienes permisos para reportar observaciones de pago. Esta acción está restringida a roles administrativos.',
        roles_permitidos: rolesPermitidos,
        tu_rol: userRole
      });
    }

    const motivosValidos = ['pago_no_recibido', 'monto_insuficiente', 'requiere_aclaracion'];
    if (!motivosValidos.includes(motivo)) {
      return res.status(400).json({
        error: 'Motivo inválido',
        motivosValidos
      });
    }

    if (observaciones.length < 20) {
      return res.status(400).json({
        error: 'Las observaciones deben tener al menos 20 caracteres'
      });
    }

    const { data: vuelo, error: vueloError } = await supabase
      .from('vuelos')
      .select('id, created_by, pax_nombre, ruta, monto_venta, estado')
      .eq('id', id)
      .single();

    if (vueloError || !vuelo) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }

    if (vuelo.estado !== 'PENDIENTE_CONFIRMACION_PAGO') {
      return res.status(400).json({
        error: 'El vuelo no está en estado PENDIENTE_CONFIRMACION_PAGO'
      });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', adminId)
      .single();

    const adminNombre = adminProfile?.full_name || 'Administrador';

    await notificarPagoObservado(
      vuelo,
      adminNombre,
      motivo,
      montoFaltante,
      observaciones
    );

    res.json({
      message: 'Observación registrada y notificación enviada',
      vuelo_id: id,
      asesor_id: vuelo.created_by
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos/:id/observar-pago:', error);
    res.status(500).json({
      error: 'Error al registrar observación',
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
 * PUT /api/vuelos/:id/editar - Editar vuelo con validaciones de permisos y límite de intentos
 */
router.put('/:id/editar', async (req, res) => {
  try {
    const { id } = req.params;
    const { vuelo: vueloUpdates, pasajeros: pasajerosUpdates, razon_edicion, user_id, user_role } = req.body;

    // Validar campos requeridos
    if (!user_id || !razon_edicion) {
      return res.status(400).json({
        error: 'user_id y razon_edicion son requeridos'
      });
    }

    if (!razon_edicion.trim() || razon_edicion.trim().length < 10) {
      return res.status(400).json({
        error: 'La razón de edición debe tener al menos 10 caracteres'
      });
    }

    // Obtener vuelo actual
    const { data: vueloActual, error: fetchError } = await supabase
      .from('vuelos')
      .select('*, created_by, estado, ediciones_disponibles')
      .eq('id', id)
      .single();

    if (fetchError || !vueloActual) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }

    // Validar estado - No permitir edición si está EMITIDO
    if (vueloActual.estado === 'EMITIDO') {
      return res.status(403).json({
        error: 'No se puede editar un vuelo que ya ha sido emitido'
      });
    }

    // Obtener perfil y permisos del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('equipo_id, role_id')
      .eq('id', user_id)
      .single();

    // Obtener permisos del rol
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions(name)')
      .eq('role_id', profile?.role_id);

    const permissions = rolePermissions?.map(rp => rp.permissions.name) || [];

    // Validar permisos y límite de intentos
    const esCreador = vueloActual.created_by === user_id;
    const tieneEditAll = permissions.includes('vuelos.edit_all');
    const tieneEditTeam = permissions.includes('vuelos.edit_team');
    const tieneEditOwn = permissions.includes('vuelos.edit_own');

    // Obtener equipo del creador para verificar si está en el mismo equipo
    const { data: creadorProfile } = await supabase
      .from('profiles')
      .select('equipo_id')
      .eq('id', vueloActual.created_by)
      .single();

    const mismoEquipo = profile?.equipo_id && profile.equipo_id === creadorProfile?.equipo_id;

    // Determinar si puede editar
    let puedeEditar = false;
    let requiereDecrementar = false;

    if (tieneEditAll) {
      // Admin/Super Admin pueden editar todo sin límite
      puedeEditar = true;
      requiereDecrementar = false;
    } else if (tieneEditTeam && mismoEquipo) {
      // Gerente puede editar vuelos de su equipo sin límite
      puedeEditar = true;
      requiereDecrementar = false;
    } else if (tieneEditOwn && esCreador) {
      // Asesor puede editar sus propios vuelos con límite
      const edicionesDisponibles = vueloActual.ediciones_disponibles ?? 3;
      if (edicionesDisponibles > 0) {
        puedeEditar = true;
        requiereDecrementar = true;
      }
    }

    if (!puedeEditar) {
      if (esCreador && tieneEditOwn) {
        return res.status(403).json({
          error: 'Has agotado tus intentos de edición para este vuelo',
          ediciones_disponibles: 0
        });
      }
      return res.status(403).json({
        error: 'No tienes permisos para editar este vuelo'
      });
    }

    // Obtener pasajeros actuales para comparar
    const { data: pasajerosActuales } = await supabase
      .from('vuelos_pasajeros')
      .select('*')
      .eq('vuelo_id', id);

    // Campos que NO se pueden editar
    const camposProtegidos = [
      'id', 'created_at', 'created_by', 'estado', 'cotizacion_id',
      'pago_confirmado_por', 'pago_confirmado_at', 'emitido_por', 'emitido_at',
      'moneda_precio', 'moneda_cotizacion', 'tasa_cambio', 'metodo_pago'
    ];

    // Preparar actualizaciones del vuelo (solo campos permitidos)
    const vueloUpdatesFiltrado = {};
    const camposModificados = {};
    const valoresAnteriores = {};
    const valoresNuevos = {};

    if (vueloUpdates) {
      for (const [key, value] of Object.entries(vueloUpdates)) {
        if (!camposProtegidos.includes(key) && vueloActual[key] !== value) {
          vueloUpdatesFiltrado[key] = value;
          camposModificados[`vuelo.${key}`] = true;
          valoresAnteriores[`vuelo.${key}`] = vueloActual[key];
          valoresNuevos[`vuelo.${key}`] = value;
        }
      }
    }

    // Actualizar vuelo si hay cambios
    let vueloActualizado = vueloActual;
    if (Object.keys(vueloUpdatesFiltrado).length > 0) {
      // Decrementar intentos solo si es necesario (asesores con límite)
      if (requiereDecrementar) {
        vueloUpdatesFiltrado.ediciones_disponibles = (vueloActual.ediciones_disponibles ?? 3) - 1;
      }

      const { data: updated, error: updateError } = await supabase
        .from('vuelos')
        .update(vueloUpdatesFiltrado)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error actualizando vuelo: ${updateError.message}`);
      }
      vueloActualizado = updated;
    }

    // Actualizar pasajeros si hay cambios
    if (pasajerosUpdates && pasajerosUpdates.length > 0) {
      for (const pasajeroUpdate of pasajerosUpdates) {
        const pasajeroActual = pasajerosActuales?.find(p => p.id === pasajeroUpdate.id);
        if (!pasajeroActual) continue;

        // Campos editables de pasajero
        const camposEditablesPasajero = [
          'nombres', 'apellidos', 'sexo', 'fecha_nacimiento', 'nacionalidad',
          'numero_pasaporte', 'numero_cedula', 'pais_emision_cedula', 'tipo_documento',
          'precio_pantalla', 'fee_agencia',
          'equipaje_completo', 'equipaje_mediano', 'equipaje_ligero'
        ];

        const pasajeroUpdatesFiltrado = {};
        for (const [key, value] of Object.entries(pasajeroUpdate)) {
          if (camposEditablesPasajero.includes(key) && pasajeroActual[key] !== value) {
            pasajeroUpdatesFiltrado[key] = value;
            camposModificados[`pasajero_${pasajeroActual.orden}.${key}`] = true;
            valoresAnteriores[`pasajero_${pasajeroActual.orden}.${key}`] = pasajeroActual[key];
            valoresNuevos[`pasajero_${pasajeroActual.orden}.${key}`] = value;
          }
        }

        if (Object.keys(pasajeroUpdatesFiltrado).length > 0) {
          await supabase
            .from('vuelos_pasajeros')
            .update(pasajeroUpdatesFiltrado)
            .eq('id', pasajeroUpdate.id);
        }
      }
    }

    // Contar ediciones previas para este vuelo
    const { count: edicionesPrevias } = await supabase
      .from('vuelos_ediciones')
      .select('*', { count: 'exact', head: true })
      .eq('vuelo_id', id);

    // Registrar en historial de ediciones
    const { error: historialError } = await supabase
      .from('vuelos_ediciones')
      .insert({
        vuelo_id: id,
        editado_por: user_id,
        campos_modificados: camposModificados,
        valores_anteriores: valoresAnteriores,
        valores_nuevos: valoresNuevos,
        intento_numero: (edicionesPrevias || 0) + 1,
        razon_edicion: razon_edicion.trim()
      });

    if (historialError) {
      console.error('Error guardando historial de edición:', historialError);
    }

    // Obtener vuelo actualizado con pasajeros
    const vueloCompleto = await vuelosService.obtenerVuelo(id);

    res.json({
      message: 'Vuelo editado exitosamente',
      vuelo: vueloCompleto,
      ediciones_disponibles: vueloActualizado.ediciones_disponibles,
      cambios_realizados: Object.keys(camposModificados).length
    });

  } catch (error) {
    console.error('Error en PUT /api/vuelos/:id/editar:', error);
    res.status(500).json({
      error: 'Error al editar vuelo',
      details: error.message
    });
  }
});

/**
 * GET /api/vuelos/:id/historial-ediciones - Obtener historial de ediciones
 */
router.get('/:id/historial-ediciones', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: historial, error } = await supabase
      .from('vuelos_ediciones')
      .select(`
        *,
        editor:profiles!vuelos_ediciones_editado_por_fkey(id, full_name, avatar_url)
      `)
      .eq('vuelo_id', id)
      .order('editado_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      data: historial || [],
      total: historial?.length || 0
    });

  } catch (error) {
    console.error('Error en GET /api/vuelos/:id/historial-ediciones:', error);
    res.status(500).json({
      error: 'Error al obtener historial de ediciones',
      details: error.message
    });
  }
});

/**
 * PUT /api/vuelos/:id - Actualizar vuelo con validación de permisos
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { vuelo, pasajeros, razon_edicion, user_id, user_role, sin_limite_ediciones } = req.body;
    
    if (!user_id || !user_role) {
      return res.status(400).json({ error: 'Se requieren datos de usuario' });
    }
    
    if (!razon_edicion || razon_edicion.trim() === '') {
      return res.status(400).json({ error: 'La razón de edición es obligatoria' });
    }
    
    const { permitido, sinLimite, vuelo: vueloActual } = await permisosService.validarPermisosEdicionVuelo(
      id, user_id, user_role
    );
    
    if (!permitido) {
      return res.status(403).json({ error: 'No tienes permisos para editar este vuelo' });
    }
    
    await permisosService.guardarHistorialEdicion(id, user_id, razon_edicion, vueloActual);
    
    const resultado = await vuelosService.editarVuelo(
      id, 
      vuelo, 
      pasajeros, 
      sin_limite_ediciones || sinLimite
    );
    
    res.json(resultado);
    
  } catch (error) {
    console.error('Error editando vuelo:', error);
    res.status(500).json({ 
      error: error.message || 'Error al editar el vuelo' 
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

/**
 * PATCH /api/vuelos/:id/autorizar-emision - Autorizar emisión (Solo administracion, admin, super_admin)
 */
router.patch('/:id/autorizar-emision', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, cuenta_emision_asignada, observaciones_emision } = req.body;

    // Validar userId
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Validar cuenta de emisión
    if (!cuenta_emision_asignada) {
      return res.status(400).json({ error: 'cuenta_emision_asignada es requerida' });
    }

    // Validar rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Usuario no encontrado' });
    }

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administración puede autorizar emisiones'
      });
    }

    // Autorizar emisión
    const resultado = await emisionesService.autorizarEmision(
      id,
      userId,
      cuenta_emision_asignada,
      observaciones_emision
    );

    res.json({
      message: 'Vuelo autorizado para emisión',
      vuelo: resultado.vuelo,
      deuda_creada: resultado.deuda
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos/:id/autorizar-emision:', error);
    res.status(500).json({
      error: 'Error al autorizar emisión',
      details: error.message
    });
  }
});

/**
 * POST /api/vuelos/autorizar-emision-batch - Autorizar múltiples emisiones
 */
router.post('/autorizar-emision-batch', async (req, res) => {
  try {
    const { userId, vuelo_ids, cuenta_emision_asignada, observaciones_emision } = req.body;

    // Validaciones
    if (!userId || !vuelo_ids || !Array.isArray(vuelo_ids)) {
      return res.status(400).json({ 
        error: 'userId y vuelo_ids (array) son requeridos' 
      });
    }

    if (!cuenta_emision_asignada) {
      return res.status(400).json({ error: 'cuenta_emision_asignada es requerida' });
    }

    // Validar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', userId)
      .single();

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Autorizar batch
    const resultados = await emisionesService.autorizarEmisionBatch(
      vuelo_ids,
      userId,
      cuenta_emision_asignada,
      observaciones_emision
    );

    const exitosos = resultados.filter(r => r.success).length;
    const fallidos = resultados.filter(r => !r.success).length;

    res.json({
      message: `${exitosos} vuelos autorizados`,
      vuelos_autorizados: exitosos,
      vuelos_fallidos: fallidos,
      resultados
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos/autorizar-emision-batch:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vuelos/:id/historial - Obtener historial de cambios de estado
 */
router.get('/:id/historial', async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await obtenerHistorialCambios('vuelo', id);

    res.json({
      historial,
      total: historial.length
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vuelos/:id/solicitar-autorizacion - Solicitar autorización de emisión
 */
router.post('/:id/solicitar-autorizacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Obtener vuelo
    const { data: vuelo, error: vueloError } = await supabase
      .from('vuelos')
      .select('*')
      .eq('id', id)
      .single();

    if (vueloError || !vuelo) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }

    // Obtener nombre del solicitante
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const solicitanteNombre = profile?.full_name || 'Usuario';

    // Enviar notificación a admins
    await notificarRecordatorioAutorizacion(vuelo, solicitanteNombre);

    res.json({
      message: 'Solicitud de autorización enviada a administración',
      vuelo_id: id
    });
  } catch (error) {
    console.error('Error solicitando autorización:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
