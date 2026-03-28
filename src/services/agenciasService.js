import { supabase } from '../config/supabase.js';

/**
 * Obtener todas las agencias
 */
export async function getAgencias() {
  try {
    const { data, error } = await supabase
      .from('agencias')
      .select('*')
      .order('nombre');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error al obtener agencias:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener agencia por ID
 */
export async function getAgenciaById(id) {
  try {
    const { data, error } = await supabase
      .from('agencias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener agencia:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Crear nueva agencia
 */
export async function createAgencia({ nombre, codigo, descripcion, logo_url, color_primario }) {
  try {
    const { data, error } = await supabase
      .from('agencias')
      .insert({
        nombre,
        codigo: codigo.toLowerCase().replace(/\s+/g, '_'),
        descripcion,
        logo_url,
        color_primario: color_primario || '#6366f1'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear agencia:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Actualizar agencia
 */
export async function updateAgencia(id, updates) {
  try {
    const { data, error } = await supabase
      .from('agencias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar agencia:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Eliminar (desactivar) agencia
 */
export async function deleteAgencia(id) {
  try {
    // Verificar que no tenga usuarios asignados
    const { data: usuarios, error: checkError } = await supabase
      .from('usuario_agencias')
      .select('id')
      .eq('agencia_id', id);

    if (checkError) throw checkError;

    if (usuarios && usuarios.length > 0) {
      return { data: null, error: `No se puede eliminar: la agencia tiene ${usuarios.length} usuario(s) asignado(s)` };
    }

    const { data, error } = await supabase
      .from('agencias')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al eliminar agencia:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener usuarios de una agencia
 */
export async function getUsersByAgencia(agenciaId) {
  try {
    const { data, error } = await supabase
      .from('usuario_agencias')
      .select(`
        id,
        is_primary,
        created_at,
        user_id,
        user:usuario_agencias_user_id_fkey(
          id, 
          full_name, 
          email, 
          avatar_url,
          role:roles(id, name)
        )
      `)
      .eq('agencia_id', agenciaId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error al obtener usuarios de agencia:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener agencias de un usuario
 */
export async function getAgenciasByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from('usuario_agencias')
      .select(`
        id,
        is_primary,
        agencia:agencias(
          id, 
          nombre, 
          codigo, 
          color_primario,
          is_active
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error al obtener agencias del usuario:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Asignar usuario a agencia
 */
export async function assignUserToAgencia(userId, agenciaId, isPrimary = false, createdBy = null) {
  try {
    // Si es primary, desmarcar las anteriores
    if (isPrimary) {
      await supabase
        .from('usuario_agencias')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('usuario_agencias')
      .insert({
        user_id: userId,
        agencia_id: agenciaId,
        is_primary: isPrimary,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al asignar usuario a agencia:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Remover usuario de agencia
 */
export async function removeUserFromAgencia(userId, agenciaId) {
  try {
    const { data, error } = await supabase
      .from('usuario_agencias')
      .delete()
      .eq('user_id', userId)
      .eq('agencia_id', agenciaId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error al remover usuario de agencia:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Establecer agencia primaria de un usuario
 */
export async function setPrimaryAgencia(userId, agenciaId) {
  try {
    // Desmarcar todas las agencias del usuario
    await supabase
      .from('usuario_agencias')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Marcar la nueva como primaria
    const { data, error } = await supabase
      .from('usuario_agencias')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('agencia_id', agenciaId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al establecer agencia primaria:', error);
    return { data: null, error: error.message };
  }
}
