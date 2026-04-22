import { supabase } from '../config/supabase.js';

/**
 * Obtener todos los usuarios activos excepto uno específico
 */
async function getActiveUsersExcept(excludeUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', excludeUserId);

  if (error) {
    console.error('Error obteniendo usuarios activos:', error);
    return [];
  }
  return data || [];
}

/**
 * Insertar notificaciones para múltiples usuarios
 */
async function insertarNotificaciones(notificaciones) {
  if (!notificaciones || notificaciones.length === 0) return;

  const { error } = await supabase
    .from('notificaciones')
    .insert(notificaciones);

  if (error) {
    console.error('Error insertando notificaciones:', error);
  }
}

/**
 * Notificar a todos los usuarios cuando se crea un vuelo nuevo
 */
export async function notificarNuevoVuelo(vuelo, creadorNombre) {
  try {
    const usuarios = await getActiveUsersExcept(vuelo.created_by);
    if (usuarios.length === 0) return;

    const ruta = vuelo.ruta || 'ruta sin especificar';
    const numPasajeros = vuelo.pax_nombre
      ? (Array.isArray(vuelo.pax_nombre) ? vuelo.pax_nombre.length : 1)
      : 1;

    const notificaciones = usuarios.map(u => ({
      user_id: u.id,
      tipo: 'vuelo_creado',
      titulo: '✈️ Nuevo vuelo registrado',
      descripcion: `${creadorNombre} registró un vuelo ${ruta} con ${numPasajeros} pasajero${numPasajeros !== 1 ? 's' : ''}`,
      datos: {
        vuelo_id: vuelo.id,
        creador_id: vuelo.created_by,
        creador_nombre: creadorNombre,
        ruta: ruta,
        estado: vuelo.estado
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificaciones de vuelo enviadas a ${usuarios.length} usuarios`);
  } catch (err) {
    // No bloquear el flujo principal si las notificaciones fallan
    console.error('Error enviando notificaciones de vuelo:', err.message);
  }
}

/**
 * Notificar cuando un vuelo es emitido (confirmación)
 */
export async function notificarVueloEmitido(vuelo, emisorNombre) {
  try {
    if (!vuelo.created_by) return;

    const ruta = vuelo.ruta || 'ruta sin especificar';

    const notificacion = {
      user_id: vuelo.created_by,
      tipo: 'vuelo_emitido',
      titulo: '✅ Vuelo emitido',
      descripcion: `Tu vuelo ${ruta} ha sido marcado como emitido por ${emisorNombre}`,
      datos: {
        vuelo_id: vuelo.id,
        emisor_nombre: emisorNombre,
        ruta: ruta
      }
    };

    await insertarNotificaciones([notificacion]);
    console.log(`✅ Notificación de emisión enviada al creador del vuelo`);
  } catch (err) {
    console.error('Error enviando notificación de emisión:', err.message);
  }
}

/**
 * Notificar al asesor sobre observación en pago de vuelo
 */
export async function notificarPagoObservado(vuelo, adminNombre, motivo, montoFaltante, observaciones) {
  try {
    if (!vuelo.created_by) {
      console.warn('Vuelo sin created_by, no se puede notificar');
      return;
    }

    const motivosTexto = {
      'pago_no_recibido': 'El pago aún no ha sido recibido',
      'monto_insuficiente': `Falta dinero por cubrir${montoFaltante ? `: $${montoFaltante.toFixed(2)}` : ''}`,
      'requiere_aclaracion': 'Se requiere aclaración sobre el pago'
    };

    const ruta = vuelo.ruta || 'sin ruta';
    const descripcionMotivo = motivosTexto[motivo] || motivo;

    const notificacion = {
      user_id: vuelo.created_by,
      tipo: 'pago_observado',
      titulo: '¡Observación en pago de vuelo!',
      descripcion: `${adminNombre} revisó el pago del vuelo ${ruta}. ${descripcionMotivo}. ${observaciones}`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        motivo,
        monto_esperado: vuelo.monto_venta,
        monto_faltante: montoFaltante || null,
        observaciones,
        ruta,
        pax_nombre: vuelo.pax_nombre,
        estado_vuelo: vuelo.estado,
        accion_requerida: 'Contactar al cliente para verificar el pago'
      }
    };

    await insertarNotificaciones([notificacion]);
    console.log(`Notificación de observación de pago enviada al asesor ${vuelo.created_by}`);
  } catch (err) {
    console.error('Error enviando notificación de observación:', err.message);
  }
}

/**
 * Notificar al asesor cuando el pago de su vuelo es confirmado
 */
export async function notificarPagoConfirmado(vuelo, adminNombre) {
  try {
    if (!vuelo.created_by) {
      console.warn('Vuelo sin created_by, no se puede notificar');
      return;
    }

    const ruta = vuelo.ruta || 'sin ruta';

    const notificacion = {
      user_id: vuelo.created_by,
      tipo: 'pago_confirmado',
      titulo: '✅ Pago confirmado',
      descripcion: `${adminNombre} aprobó el pago del vuelo ${ruta}. Ya puedes proceder con la emisión.`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        ruta,
        pax_nombre: vuelo.pax_nombre,
        monto: vuelo.monto_venta,
        estado_vuelo: 'PENDIENTE_EMISION',
        accion_requerida: 'Proceder con emisión del vuelo'
      }
    };

    await insertarNotificaciones([notificacion]);
    console.log(`✅ Notificación de pago confirmado enviada al asesor ${vuelo.created_by}`);
  } catch (err) {
    console.error('Error enviando notificación de confirmación:', err.message);
  }
}

/**
 * Notificar a emisor sobre autorización de emisión
 */
export async function notificarEmisionAutorizada(vuelo, adminNombre) {
  try {
    // Obtener usuarios con rol 'emisor'
    const { data: emisores, error: errorEmisores } = await supabase
      .from('profiles')
      .select('id, role:roles(name)')
      .eq('role.name', 'emisor');

    if (errorEmisores) {
      console.error('Error obteniendo emisores:', errorEmisores);
      return;
    }

    if (!emisores || emisores.length === 0) {
      console.warn('No hay usuarios con rol emisor');
      return;
    }

    // Calcular precio base total
    const { data: pasajeros, error: errorPasajeros } = await supabase
      .from('vuelos_pasajeros')
      .select('precio_pantalla')
      .eq('vuelo_id', vuelo.id);

    if (errorPasajeros) {
      console.error('Error obteniendo pasajeros:', errorPasajeros);
    }

    const precioBase = pasajeros?.reduce((sum, p) => sum + parseFloat(p.precio_pantalla || 0), 0) || 0;

    const notificaciones = emisores.map(emisor => ({
      user_id: emisor.id,
      tipo: 'emision_autorizada',
      titulo: '✅ Vuelo autorizado para emisión',
      descripcion: `${adminNombre} autorizó el vuelo ${vuelo.ruta}. Puedes proceder a emitir.`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        ruta: vuelo.ruta,
        cuenta_emision: vuelo.cuenta_emision_asignada,
        precio_base: precioBase,
        localizador: vuelo.localizador,
        pax_nombre: vuelo.pax_nombre,
        accion_requerida: 'Proceder con emisión del vuelo'
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificaciones de emisión enviadas a ${emisores.length} emisores`);
  } catch (err) {
    console.error('Error enviando notificación de emisión:', err.message);
  }
}

/**
 * Notificar a administración sobre deuda generada
 */
export async function notificarDeudaGenerada(deuda, vuelo) {
  try {
    // Obtener usuarios con rol 'administracion', 'admin', 'super_admin'
    const { data: admins, error: errorAdmins } = await supabase
      .from('profiles')
      .select('id, role:roles(name)')
      .or('role.name.eq.administracion,role.name.eq.admin,role.name.eq.super_admin');

    if (errorAdmins) {
      console.error('Error obteniendo administradores:', errorAdmins);
      return;
    }

    if (!admins || admins.length === 0) {
      console.warn('No hay usuarios administradores');
      return;
    }

    const notificaciones = admins.map(admin => ({
      user_id: admin.id,
      tipo: 'deuda_generada',
      titulo: '💳 Nueva deuda generada con proveedor',
      descripcion: `Se generó una deuda de $${deuda.monto_deuda.toFixed(2)} USD con ${deuda.proveedor} por el vuelo ${vuelo.ruta}.`,
      datos: {
        deuda_id: deuda.id,
        proveedor: deuda.proveedor,
        monto_deuda: deuda.monto_deuda,
        vuelo_id: vuelo.id,
        ruta: vuelo.ruta,
        fecha_vencimiento: deuda.fecha_vencimiento,
        accion_requerida: 'Planificar pago antes del vencimiento'
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificaciones de deuda enviadas a ${admins.length} administradores`);
  } catch (err) {
    console.error('Error enviando notificación de deuda:', err.message);
  }
}

/**
 * Notificar a administración cuando emisor solicita autorización
 */
export async function notificarRecordatorioAutorizacion(vuelo, solicitanteNombre) {
  try {
    // Obtener usuarios con rol administracion, admin o super_admin
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .in('rol', ['administracion', 'admin', 'super_admin']);

    if (error || !admins || admins.length === 0) {
      console.warn('No se encontraron administradores para notificar');
      return;
    }

    const ruta = vuelo.ruta || 'sin ruta';
    const cuentaEmision = vuelo.cuenta_emision_asignada || 'N/A';
    const precioBase = vuelo.precio_base || 0;
    const localizador = vuelo.localizador || 'N/A';

    const notificaciones = admins.map(admin => ({
      user_id: admin.id,
      tipo: 'recordatorio_autorizacion',
      titulo: '📌 Solicitud de autorización de emisión',
      descripcion: `${solicitanteNombre} solicita autorización para emitir el vuelo ${ruta}. Favor revisar saldo en ${cuentaEmision}.`,
      datos: {
        vuelo_id: vuelo.id,
        solicitante_nombre: solicitanteNombre,
        ruta,
        cuenta_emision: cuentaEmision,
        precio_base: precioBase,
        localizador,
        accion_requerida: 'Revisar saldo y autorizar emisión'
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificación de recordatorio enviada a ${admins.length} administradores`);
  } catch (err) {
    console.error('Error enviando notificación de recordatorio:', err.message);
  }
}

export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado,
  notificarPagoConfirmado,
  notificarEmisionAutorizada,
  notificarDeudaGenerada,
  notificarRecordatorioAutorizacion
};
