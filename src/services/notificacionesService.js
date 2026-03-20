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

export default {
  notificarNuevoVuelo,
  notificarVueloEmitido
};
