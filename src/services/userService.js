import { supabase } from '../config/supabase.js';

/**
 * Obtener todos los usuarios con sus roles
 */
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        updated_at,
        role:roles(
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Crear un nuevo usuario
 * @param {Object} userData - { email, password, fullName, roleId }
 */
export async function createUser({ email, password, fullName, roleId }) {
  try {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      throw new Error(`Error al crear usuario en Auth: ${authError.message}`);
    }

    // 2. Crear perfil en public.profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role_id: roleId,
        is_active: true
      })
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        updated_at,
        role:roles(
          id,
          name,
          description
        )
      `)
      .single();

    if (profileError) {
      // Si falla la creación del perfil, intentar eliminar el usuario de Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    return { data: profileData, error: null };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Actualizar un usuario existente
 * @param {string} id - ID del usuario
 * @param {Object} updates - { email, password, fullName, roleId }
 */
export async function updateUser(id, updates) {
  try {
    const { email, password, fullName, roleId } = updates;

    // 1. Actualizar en Auth si hay cambios de email o password
    if (email || password) {
      const authUpdates = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdates);

      if (authError) {
        throw new Error(`Error al actualizar usuario en Auth: ${authError.message}`);
      }
    }

    // 2. Actualizar perfil en public.profiles
    const profileUpdates = {};
    if (email) profileUpdates.email = email;
    if (fullName) profileUpdates.full_name = fullName;
    if (roleId) profileUpdates.role_id = roleId;
    profileUpdates.updated_at = new Date().toISOString();

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', id)
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        updated_at,
        role:roles(
          id,
          name,
          description
        )
      `)
      .single();

    if (profileError) {
      throw new Error(`Error al actualizar perfil: ${profileError.message}`);
    }

    return { data: profileData, error: null };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Activar/Desactivar un usuario
 * @param {string} id - ID del usuario
 * @param {boolean} isActive - true para activar, false para desactivar
 */
export async function toggleUserStatus(id, isActive) {
  try {
    // 1. Actualizar estado en public.profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        updated_at,
        role:roles(
          id,
          name,
          description
        )
      `)
      .single();

    if (profileError) {
      throw new Error(`Error al actualizar estado en perfil: ${profileError.message}`);
    }

    // 2. Banear/Desbanear en Supabase Auth
    if (!isActive) {
      // Desactivar = banear usuario
      const { error: banError } = await supabase.auth.admin.updateUserById(id, {
        ban_duration: 'none'
      });

      if (banError) {
        console.error('Error al banear usuario:', banError);
      }
    } else {
      // Activar = desbanear usuario
      const { error: unbanError } = await supabase.auth.admin.updateUserById(id, {
        ban_duration: '0s'
      });

      if (unbanError) {
        console.error('Error al desbanear usuario:', unbanError);
      }
    }

    return { data: profileData, error: null };
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener un usuario por ID
 * @param {string} id - ID del usuario
 */
export async function getUserById(id) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        updated_at,
        role:roles(
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener todos los roles disponibles
 */
export async function getRoles() {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener roles:', error);
    return { data: null, error: error.message };
  }
}
