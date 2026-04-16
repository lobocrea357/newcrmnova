import { supabase } from '../config/supabase.js';

/**
 * Obtener todos los equipos con gerente y miembros
 */
export async function getEquipos() {
  try {
    const { data, error } = await supabase
      .from('equipos')
      .select(`
        id,
        nombre,
        descripcion,
        color,
        is_active,
        created_at,
        gerente:profiles!gerente_id(id, full_name, email),
        miembros:profiles!equipo_id(id, full_name, email, role:roles(id, name))
      `)
      .eq('is_active', true)
      .order('nombre');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener usuarios sin equipo asignado (asesores disponibles)
 */
export async function getUsuariosSinEquipo() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role:roles(id, name)
      `)
      .is('equipo_id', null)
      .order('full_name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error al obtener usuarios sin equipo:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Crear un nuevo equipo
 */
export async function createEquipo({ nombre, descripcion, color, gerenteId }) {
  try {
    const { data, error } = await supabase
      .from('equipos')
      .insert({
        nombre,
        descripcion,
        color: color || '#6366f1',
        gerente_id: gerenteId,
      })
      .select(`
        id,
        nombre,
        descripcion,
        color,
        gerente:profiles!gerente_id(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear equipo:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Actualizar un equipo
 */
export async function updateEquipo(equipoId, { nombre, descripcion, color, gerenteId }) {
  try {
    const updates = { updated_at: new Date().toISOString() };
    if (nombre !== undefined) updates.nombre = nombre;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (color !== undefined) updates.color = color;
    if (gerenteId !== undefined) updates.gerente_id = gerenteId;

    const { data, error } = await supabase
      .from('equipos')
      .update(updates)
      .eq('id', equipoId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Asignar usuario a un equipo (actualiza solo equipo_id)
 * NOTA: manager_id está deprecated, la relación es profiles.equipo_id → equipos.gerente_id
 */
export async function asignarUsuarioAEquipo(userId, equipoId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        equipo_id: equipoId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al asignar usuario a equipo:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Remover usuario de su equipo actual (limpia solo equipo_id)
 */
export async function removerUsuarioDeEquipo(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        equipo_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al remover usuario de equipo:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Eliminar un equipo (desvincula miembros limpiando solo equipo_id)
 */
export async function deleteEquipo(equipoId) {
  try {
    // Desvincular miembros del equipo
    await supabase
      .from('profiles')
      .update({ equipo_id: null, updated_at: new Date().toISOString() })
      .eq('equipo_id', equipoId);

    const { error } = await supabase
      .from('equipos')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', equipoId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    return { error: error.message };
  }
}

/**
 * Validar si un usuario puede gestionar un equipo específico
 * @param {string} currentUserId - ID del usuario actual
 * @param {string} teamId - ID del equipo
 * @returns {Promise<boolean>}
 */
export async function canManageTeam(currentUserId, teamId) {
  try {
    // Obtener rol del usuario actual
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', currentUserId)
      .single();

    if (!currentUser?.role) {
      return false;
    }

    // Super admin y admin pueden gestionar todos los equipos
    if (['super_admin', 'admin'].includes(currentUser.role.name)) {
      return true;
    }

    // Gerente solo puede gestionar su propio equipo
    if (currentUser.role.name === 'gerente') {
      const { data: team } = await supabase
        .from('equipos')
        .select('gerente_id')
        .eq('id', teamId)
        .eq('gerente_id', currentUserId)
        .single();

      return !!team;
    }

    return false;
  } catch (error) {
    console.error('Error validando permisos de equipo:', error);
    return false;
  }
}

/**
 * Obtener equipos filtrados según el rol del usuario actual
 * @param {string} currentUserId - ID del usuario actual
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getTeamsFilteredByUser(currentUserId) {
  try {
    // Obtener rol del usuario actual
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', currentUserId)
      .single();

    if (!currentUser?.role) {
      return { data: [], error: 'Usuario no encontrado' };
    }

    let query = supabase
      .from('equipos')
      .select(`
        id,
        nombre,
        descripcion,
        color,
        is_active,
        created_at,
        gerente:profiles!gerente_id(id, full_name, email),
        miembros:profiles!equipo_id(id, full_name, email, role:roles(id, name))
      `)
      .eq('is_active', true)
      .order('nombre');

    // Super admin y admin ven todos los equipos
    if (['super_admin', 'admin'].includes(currentUser.role.name)) {
      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    }

    // Gerente solo ve su propio equipo
    if (currentUser.role.name === 'gerente') {
      const { data, error } = await query.eq('gerente_id', currentUserId);
      if (error) throw error;
      return { data: data || [], error: null };
    }

    // Otros roles no deberían acceder a equipos
    return { data: [], error: null };
  } catch (error) {
    console.error('Error al obtener equipos filtrados:', error);
    return { data: [], error: error.message };
  }
}
