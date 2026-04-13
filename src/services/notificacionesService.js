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

export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado
};
