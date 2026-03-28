import { supabase } from '../config/supabase.js';

/**
 * Obtener todos los usuarios con sus roles
 * @param {string} currentUserId - ID del usuario actual (para filtrado jerárquico)
 */
export async function getUsers(currentUserId = null) {
  try {
    // Obtener todos los usuarios con roles
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
          description,
          ranking
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Si hay usuario actual, filtrar por jerarquía
    if (currentUserId) {
      // Obtener rol del usuario actual
      const { data: currentUser, error: currentUserError } = await supabase
        .from('profiles')
        .select('role:roles(ranking, name)')
        .eq('id', currentUserId)
        .single();

      if (!currentUserError && currentUser?.role) {
        const currentRanking = currentUser.role.ranking || 0;
        const isSuperAdmin = currentUser.role.name === 'super_admin';

        // Super admin ve todo
        if (!isSuperAdmin) {
          // Otros roles solo ven usuarios con ranking MENOR (no iguales ni superiores)
          return {
            data: data.filter(user => {
              const userRanking = user.role?.ranking || 0;
              return userRanking < currentRanking;
            }),
            error: null
          };
        }
      }
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
 * @param {string} createdBy - ID del usuario que crea (para validación jerárquica)
 */
export async function createUser({ email, password, fullName, roleId }, createdBy = null) {
  try {
    // Validación jerárquica: verificar que el creador puede asignar este rol
    if (createdBy && roleId) {
      const canAssign = await validateRoleAssignment(createdBy, roleId);
      if (!canAssign) {
        throw new Error('No tienes permisos para asignar este rol (jerarquía superior)');
      }
    }

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
 * @param {string} updatedBy - ID del usuario que actualiza (para validación jerárquica)
 */
export async function updateUser(id, updates, updatedBy = null) {
  try {
    const { email, password, fullName, roleId } = updates;

    // Validación jerárquica: verificar que el usuario actual puede editar al usuario objetivo
    if (updatedBy) {
      const canEdit = await validateUserEdit(updatedBy, id);
      if (!canEdit) {
        throw new Error('No tienes permisos para editar este usuario (jerarquía superior o igual)');
      }

      // Si se cambia el rol, validar que puede asignar el nuevo rol
      if (roleId) {
        const canAssign = await validateRoleAssignment(updatedBy, roleId);
        if (!canAssign) {
          throw new Error('No tienes permisos para asignar este rol (jerarquía superior)');
        }
      }
    }

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
 * @param {string} changedBy - ID del usuario que cambia el estado (para validación jerárquica)
 */
export async function toggleUserStatus(id, isActive, changedBy = null) {
  try {
    // Validación jerárquica: verificar que el usuario actual puede cambiar el estado del usuario objetivo
    if (changedBy) {
      const canEdit = await validateUserEdit(changedBy, id);
      if (!canEdit) {
        throw new Error('No tienes permisos para cambiar el estado de este usuario (jerarquía superior o igual)');
      }
    }

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
 * @param {string} currentUserId - ID del usuario actual (para filtrado jerárquico)
 */
export async function getRoles(currentUserId = null) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('ranking', { ascending: false }); // Ordenar por ranking descendente

    if (error) {
      throw error;
    }

    // Si hay usuario actual, filtrar roles según jerarquía
    if (currentUserId) {
      // Obtener rol del usuario actual
      const { data: currentUser, error: currentUserError } = await supabase
        .from('profiles')
        .select('role:roles(ranking, name)')
        .eq('id', currentUserId)
        .single();

      if (!currentUserError && currentUser?.role) {
        const currentRanking = currentUser.role.ranking || 0;
        const isSuperAdmin = currentUser.role.name === 'super_admin';

        // Super admin ve todos los roles
        if (!isSuperAdmin) {
          // Otros roles solo ven roles con ranking MENOR (no pueden asignar roles iguales o superiores)
          return {
            data: data.filter(role => {
              const roleRanking = role.ranking || 0;
              return roleRanking < currentRanking;
            }),
            error: null
          };
        }
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener roles:', error);
    return { data: null, error: error.message };
  }
}

// =====================================================
// FUNCIONES DE VALIDACIÓN JERÁRQUICA
// =====================================================

/**
 * Validar si un usuario puede asignar un rol específico
 * @param {string} userId - ID del usuario que intenta asignar el rol
 * @param {string} roleId - ID del rol que se intenta asignar
 * @returns {Promise<boolean>}
 */
async function validateRoleAssignment(userId, roleId) {
  try {
    // Obtener rol del usuario actual
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role:roles(ranking, name)')
      .eq('id', userId)
      .single();

    // Obtener rol que se intenta asignar
    const { data: targetRole } = await supabase
      .from('roles')
      .select('ranking, name')
      .eq('id', roleId)
      .single();

    if (!currentUser?.role || !targetRole) {
      return false;
    }

    // Super admin puede asignar cualquier rol
    if (currentUser.role.name === 'super_admin') {
      return true;
    }

    const currentRanking = currentUser.role.ranking || 0;
    const targetRanking = targetRole.ranking || 0;

    // Solo puede asignar roles con ranking MENOR (no iguales ni superiores)
    return targetRanking < currentRanking;
  } catch (error) {
    console.error('Error validando asignación de rol:', error);
    return false;
  }
}

/**
 * Validar si un usuario puede editar a otro usuario
 * @param {string} editorId - ID del usuario que intenta editar
 * @param {string} targetId - ID del usuario objetivo
 * @returns {Promise<boolean>}
 */
async function validateUserEdit(editorId, targetId) {
  try {
    // No puede editarse a sí mismo desde este flujo (usar endpoint de perfil)
    if (editorId === targetId) {
      return false;
    }

    // Obtener rol del usuario editor
    const { data: editor } = await supabase
      .from('profiles')
      .select('role:roles(ranking, name)')
      .eq('id', editorId)
      .single();

    // Obtener rol del usuario objetivo
    const { data: target } = await supabase
      .from('profiles')
      .select('role:roles(ranking, name)')
      .eq('id', targetId)
      .single();

    if (!editor?.role || !target?.role) {
      return false;
    }

    // Super admin puede editar a cualquiera
    if (editor.role.name === 'super_admin') {
      return true;
    }

    const editorRanking = editor.role.ranking || 0;
    const targetRanking = target.role.ranking || 0;

    // Solo puede editar usuarios con ranking MENOR (no iguales ni superiores)
    return targetRanking < editorRanking;
  } catch (error) {
    console.error('Error validando edición de usuario:', error);
    return false;
  }
}
