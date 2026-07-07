import { supabase } from '../config/supabase.js';

/**
 * Obtener todas las sedes
 */
export async function getSedes() {
  try {
    const { data, error } = await supabase
      .from('sedes')
      .select('*')
      .order('nombre');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error al obtener sedes:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener sede por ID
 */
export async function getSedeById(id) {
  try {
    const { data, error } = await supabase
      .from('sedes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener sede:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Crear nueva sede
 */
export async function createSede({ nombre, codigo, direccion, ciudad, pais, telefono }) {
  try {
    const { data, error } = await supabase
      .from('sedes')
      .insert({
        nombre,
        codigo: codigo.toLowerCase().replace(/\s+/g, '_'),
        direccion,
        ciudad,
        pais: pais || 'Venezuela',
        telefono
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear sede:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Actualizar sede
 */
export async function updateSede(id, updates) {
  try {
    const { data, error } = await supabase
      .from('sedes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar sede:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Eliminar (desactivar) sede
 */
export async function deleteSede(id) {
  try {
    // Verificar que no tenga usuarios asignados
    const { data: usuarios, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('sede_id', id);

    if (checkError) throw checkError;

    if (usuarios && usuarios.length > 0) {
      return { data: null, error: `No se puede eliminar: la sede tiene ${usuarios.length} usuario(s) asignado(s)` };
    }

    const { data, error } = await supabase
      .from('sedes')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al eliminar sede:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener usuarios de una sede
 */
export async function getUsersBySede(sedeId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        role:roles(id, name)
      `)
      .eq('sede_id', sedeId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error al obtener usuarios de sede:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Asignar usuario a sede (reemplaza la sede anterior)
 */
export async function assignUserToSede(userId, sedeId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ sede_id: sedeId })
      .eq('id', userId)
      .select('id, full_name, sede_id')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al asignar usuario a sede:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Remover usuario de sede
 */
export async function removeUserFromSede(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ sede_id: null })
      .eq('id', userId)
      .select('id, full_name, sede_id')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al remover usuario de sede:', error);
    return { data: null, error: error.message };
  }
}
