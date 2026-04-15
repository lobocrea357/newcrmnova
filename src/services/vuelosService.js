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

      // 1. Sanitizar datos de vuelo de vuelta según tipo_vuelo
      const datosSanitizados = this._sanitizarDatosVuelo(vueloData);

      // 2. Insertar vuelo principal
      const { data: vuelo, error: errorVuelo } = await supabase
        .from('vuelos')
        .insert([datosSanitizados])
        .select()
        .single();

      if (errorVuelo) {
        console.error('[VuelosService] Error creando vuelo:', errorVuelo);
        throw errorVuelo;
      }

      console.log('[VuelosService] Vuelo creado:', vuelo.id);

      // 3. Insertar pasajeros si los hay
      let pasajerosCreados = [];
      if (pasajeros.length > 0) {
        console.log(`[VuelosService] Validando ${pasajeros.length} pasajeros para vuelo ${vuelo.id}`);
        
        // Validar cada pasajero con manejo de errores específico
        const validationErrors = [];
        
        pasajeros.forEach((pasajero, index) => {
          try {
            this._validarDatosDocumento(pasajero);
            console.log(`[VuelosService] Pasajero ${index + 1} validado: ${pasajero.tipo_documento}`);
          } catch (error) {
            validationErrors.push({
              pasajeroIndex: index,
              error: error.message,
              tipo_documento: pasajero.tipo_documento
            });
          }
        });
        
        // Si hay errores de validación, lanzar error detallado
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors
            .map(err => `Pasajero ${err.pasajeroIndex + 1}: ${err.error}`)
            .join('; ');
          throw new Error(`Validación de pasajeros fallida: ${errorMessage}`);
        }

        // Preparar pasajeros con ID de vuelo y normalización
        const pasajerosConVueloId = pasajeros.map(p => ({
          ...p,
          vuelo_id: vuelo.id,
          // Normalizar datos para consistencia
          numero_pasaporte: p.numero_pasaporte ? p.numero_pasaporte.trim().toUpperCase() : null,
          numero_cedula: p.numero_cedula ? p.numero_cedula.trim().toUpperCase() : null,
          pais_emision_cedula: p.pais_emision_cedula ? p.pais_emision_cedula.trim() : null
        }));

        console.log(`[VuelosService] ${pasajerosConVueloId.length} pasajeros listos para inserción`);

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

      // 4. Insertar adjuntos si los hay
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
      console.log('[VuelosService] obtenerVuelos - userId:', userId, 'role:', role);

      // ============================================
      // PASO 1: Determinar qué userIds puede ver según rol
      // ============================================
      let allowedUserIds = null; // null = sin restricción (admin ve todos)

      if (role === 'asesor') {
        // Asesor: Solo sus propios vuelos
        allowedUserIds = [userId];
        console.log('[VuelosService] Asesor - solo ve sus vuelos:', allowedUserIds);

      } else if (role === 'gerente') {
        // Gerente: Sus vuelos + vuelos de asesores en sus equipos
        
        // 1. Obtener equipos que gestiona
        const { data: equipos, error: errorEquipos } = await supabase
          .from('equipos')
          .select('id')
          .eq('gerente_id', userId)
          .eq('is_active', true);

        if (errorEquipos) {
          console.error('[VuelosService] Error obteniendo equipos:', errorEquipos);
          throw errorEquipos;
        }

        const equipoIds = (equipos || []).map(e => e.id);
        console.log('[VuelosService] Gerente gestiona equipos:', equipoIds);

        if (equipoIds.length > 0) {
          // 2. Obtener asesores que pertenecen a esos equipos
          const { data: asesores, error: errorAsesores } = await supabase
            .from('profiles')
            .select('id, full_name, email, equipo_id')
            .in('equipo_id', equipoIds)
            .eq('is_active', true);

          if (errorAsesores) {
            console.error('[VuelosService] Error obteniendo asesores:', errorAsesores);
            throw errorAsesores;
          }

          const asesorIds = (asesores || []).map(a => a.id);
          allowedUserIds = [userId, ...asesorIds]; // Gerente + sus asesores
          console.log('[VuelosService] Gerente ve vuelos de:', allowedUserIds.length, 'usuarios (él + asesores)');
        } else {
          // Sin equipos, solo ve sus propios vuelos
          allowedUserIds = [userId];
          console.log('[VuelosService] Gerente sin equipos - solo ve sus vuelos');
        }

      } else if (role === 'admin' || role === 'super_admin') {
        // Admin y Super Admin: Ve todos los vuelos (sin restricción)
        allowedUserIds = null;
        console.log('[VuelosService] Admin/Super Admin - ve todos los vuelos');
      } else {
        // Rol desconocido: restringir al usuario actual
        console.warn('[VuelosService] Rol desconocido:', role, '- restringiendo a usuario actual');
        allowedUserIds = [userId];
      }

      // ============================================
      // PASO 2: Construir query de vuelos con filtros
      // ============================================
      let query = supabase
        .from('vuelos')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtro de visibilidad por rol
      if (allowedUserIds !== null) {
        query = query.in('created_by', allowedUserIds);
      }

      // Filtros adicionales de query params
      if (filters.tipo_vuelo) query = query.eq('tipo_vuelo', filters.tipo_vuelo);
      if (filters.estado) query = query.eq('estado', filters.estado);
      if (filters.fecha_desde) query = query.gte('fecha_vuelo', filters.fecha_desde);
      if (filters.fecha_hasta) query = query.lte('fecha_vuelo', filters.fecha_hasta);
      if (filters.requiere_anulable !== undefined && filters.requiere_anulable !== '') {
        query = query.eq('requiere_anulable', filters.requiere_anulable === 'true');
      }
      if (filters.search) {
        query = query.or(`pax_nombre.ilike.%${filters.search}%,ruta.ilike.%${filters.search}%,localizador.ilike.%${filters.search}%`);
      }

      // Paginación opcional
      if (filters.limit) {
        query = query.limit(filters.limit);
        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + filters.limit - 1);
        }
      }

      const { data: vuelos, error: queryError } = await query;

      if (queryError) {
        console.error('[VuelosService] Error obteniendo vuelos:', queryError);
        throw queryError;
      }

      if (!vuelos || vuelos.length === 0) {
        console.log('[VuelosService] No se encontraron vuelos');
        return [];
      }

      console.log('[VuelosService] Vuelos encontrados:', vuelos.length);

      // ============================================
      // PASO 3: Enriquecer con datos del creador
      // ============================================
      const creatorIds = [...new Set(vuelos.map(v => v.created_by).filter(Boolean))];
      const { data: profiles, error: errorProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, equipo_id')
        .in('id', creatorIds);

      if (errorProfiles) {
        console.error('[VuelosService] Error obteniendo profiles:', errorProfiles);
        // No lanzar error, solo devolver sin enriquecer
      }

      const profilesMap = {};
      (profiles || []).forEach(p => { profilesMap[p.id] = p; });

      const vuelosEnriquecidos = vuelos.map(v => ({
        ...v,
        creator: profilesMap[v.created_by] || { full_name: 'Desconocido', email: 'N/A' }
      }));

      console.log('[VuelosService] Vuelos enriquecidos correctamente');
      return vuelosEnriquecidos;

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

      // Primero obtener el vuelo actual
      const { data: vueloActual, error: fetchError } = await supabase
        .from('vuelos')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !vueloActual) {
        throw new Error('Vuelo no encontrado');
      }

      // Validar estado - solo permitir confirmar pagos en PENDIENTE_CONFIRMACION_PAGO
      if (vueloActual.estado !== 'PENDIENTE_CONFIRMACION_PAGO') {
        throw new Error(
          `El vuelo no está en estado PENDIENTE_CONFIRMACION_PAGO. Estado actual: ${vueloActual.estado}`
        );
      }

      // Actualizar estado
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

      // Sanitizar datos de vuelo de vuelta si se está actualizando tipo_vuelo
      const updatesSanitizados = updates.tipo_vuelo 
        ? this._sanitizarDatosVuelo(updates)
        : updates;

      const { data: vuelo, error } = await supabase
        .from('vuelos')
        .update({
          ...updatesSanitizados,
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

      // Obtener datos actuales del pasajero para validación y tracking
      const { data: pasajeroActual, error: fetchError } = await supabase
        .from('vuelos_pasajeros')
        .select('*')
        .eq('id', pasajeroId)
        .single();

      if (fetchError || !pasajeroActual) {
        throw new Error(`No se pudo encontrar el pasajero ${pasajeroId}`);
      }

      // Validar datos de documento si se están actualizando campos relacionados
      const documentFields = ['tipo_documento', 'numero_pasaporte', 'numero_cedula', 'pais_emision_cedula'];
      const hasDocumentUpdates = documentFields.some(field => updates[field] !== undefined);
      
      if (hasDocumentUpdates) {
        const pasajeroCompleto = { ...pasajeroActual, ...updates };
        this._validarDatosDocumento(pasajeroCompleto);
        
        // Log de cambios de tipo de documento (importante para auditoría)
        if (updates.tipo_documento && updates.tipo_documento !== pasajeroActual.tipo_documento) {
          console.log(`[VuelosService] Cambio de tipo de documento: ${pasajeroActual.tipo_documento} → ${updates.tipo_documento}`);
        }
      }

      // Preparar datos para actualización con normalización
      const updatesNormalizados = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Normalizar campos de documento si se están actualizando
      if (updatesNormalizados.numero_pasaporte) {
        updatesNormalizados.numero_pasaporte = updatesNormalizados.numero_pasaporte.trim().toUpperCase();
      }
      if (updatesNormalizados.numero_cedula) {
        updatesNormalizados.numero_cedula = updatesNormalizados.numero_cedula.trim().toUpperCase();
      }
      if (updatesNormalizados.pais_emision_cedula) {
        updatesNormalizados.pais_emision_cedula = updatesNormalizados.pais_emision_cedula.trim();
      }

      const { data: pasajero, error } = await supabase
        .from('vuelos_pasajeros')
        .update(updatesNormalizados)
        .eq('id', pasajeroId)
        .select()
        .single();

      if (error) {
        console.error('[VuelosService] Error actualizando pasajero:', error);
        throw new Error(`Error al actualizar pasajero: ${error.message}`);
      }

      console.log(`[VuelosService] Pasajero ${pasajeroId} actualizado exitosamente`);
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

  /**
   * Editar vuelo con control de ediciones disponibles
   */
  async editarVuelo(id, datosVuelo, pasajeros, sinLimiteEdiciones = false) {
    try {
      console.log(`[VuelosService] Editando vuelo ${id}`);
      
      if (!sinLimiteEdiciones) {
        const { data: vueloActual } = await supabase
          .from('vuelos')
          .select('ediciones_disponibles')
          .eq('id', id)
          .single();
        
        if (!vueloActual) {
          throw new Error('Vuelo no encontrado');
        }
        
        const edicionesDisponibles = vueloActual.ediciones_disponibles ?? 3;
        if (edicionesDisponibles <= 0) {
          throw new Error('Has agotado tus ediciones para este vuelo');
        }
        
        await supabase
          .from('vuelos')
          .update({ 
            ediciones_disponibles: edicionesDisponibles - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      }
      
      const { data: vueloActualizado, error } = await supabase
        .from('vuelos')
        .update({
          ...datosVuelo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('[VuelosService] Error editando vuelo:', error);
        throw error;
      }
      
      if (pasajeros && pasajeros.length > 0) {
        await supabase
          .from('vuelos_pasajeros')
          .delete()
          .eq('vuelo_id', id);
        
        const pasajerosConVuelo = pasajeros.map(p => ({
          ...p,
          vuelo_id: id
        }));
        
        await supabase
          .from('vuelos_pasajeros')
          .insert(pasajerosConVuelo);
      }
      
      console.log('[VuelosService] Vuelo editado exitosamente');
      return vueloActualizado;
      
    } catch (error) {
      console.error('[VuelosService] Error en editarVuelo:', error);
      throw error;
    }
  }

  /**
   * Validar datos de documento de pasajero con validaciones específicas
   * @private
   * @param {Object} pasajero - Datos del pasajero a validar
   * @throws {Error} - Error específico con mensaje claro para el usuario
   */
  _validarDatosDocumento(pasajero) {
    const TIPOS_DOCUMENTO_VALIDOS = ['PASAPORTE', 'CEDULA'];
    
    // Validación de tipo de documento
    if (!pasajero.tipo_documento) {
      throw new Error('El tipo de documento es requerido');
    }
    
    if (!TIPOS_DOCUMENTO_VALIDOS.includes(pasajero.tipo_documento)) {
      throw new Error(`Tipo de documento inválido. Debe ser: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}`);
    }

    // Validaciones específicas por tipo
    if (pasajero.tipo_documento === 'PASAPORTE') {
      if (!pasajero.numero_pasaporte || pasajero.numero_pasaporte.trim() === '') {
        throw new Error('El número de pasaporte es requerido para tipo PASAPORTE');
      }
      
      // Validación de formato básico para pasaportes (generalmente alfanumérico)
      if (!/^[A-Z0-9]{6,9}$/.test(pasajero.numero_pasaporte.trim().toUpperCase())) {
        throw new Error('El formato del pasaporte parece inválido. Debe tener 6-9 caracteres alfanuméricos');
      }
    } 
    
    else if (pasajero.tipo_documento === 'CEDULA') {
      if (!pasajero.numero_cedula || pasajero.numero_cedula.trim() === '') {
        throw new Error('El número de cédula es requerido para tipo CEDULA');
      }
      
      if (!pasajero.pais_emision_cedula || pasajero.pais_emision_cedula.trim() === '') {
        throw new Error('El país de emisión es requerido para cédulas');
      }
      
      // Validación de formato para cédulas (formatos comunes de LATAM)
      const cedula = pasajero.numero_cedula.trim().toUpperCase();
      const pais = pasajero.pais_emision_cedula;
      
      if (pais === 'Venezuela' && !/^[VE]-\d{7,8}$/.test(cedula)) {
        throw new Error('Formato de cédula venezolana inválido. Use V-12345678 o E-12345678');
      }
      
      if (pais === 'Colombia' && !/^\d{8,10}$/.test(cedula.replace(/[^0-9]/g, ''))) {
        throw new Error('Formato de cédula colombiana inválido. Use 8-10 dígitos');
      }
    }
  }

  /**
   * Sanitizar datos de vuelo según tipo_vuelo
   * Si tipo_vuelo !== 'ida_vuelta', los campos de regreso deben ser null
   * @private
   */
  _sanitizarDatosVuelo(vueloData) {
    const { tipo_vuelo, fecha_regreso, hora_salida_regreso, hora_llegada_regreso, ...restoDatos } = vueloData;

    // Si es ida y vuelta, mantener los campos de regreso
    if (tipo_vuelo === 'ida_vuelta') {
      return {
        ...restoDatos,
        tipo_vuelo,
        fecha_regreso: fecha_regreso || null,
        hora_salida_regreso: hora_salida_regreso || null,
        hora_llegada_regreso: hora_llegada_regreso || null
      };
    }

    // Para solo_ida o migratorio, forzar campos de regreso a null
    return {
      ...restoDatos,
      tipo_vuelo,
      fecha_regreso: null,
      hora_salida_regreso: null,
      hora_llegada_regreso: null
    };
  }
}

export default new VuelosService();
