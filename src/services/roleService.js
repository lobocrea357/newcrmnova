import { supabase } from '../config/supabase.js';

/**
 * Obtener todos los roles con sus permisos
 */
export async function getRoles() {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        description,
        permissions,
        created_at,
        updated_at,
        profiles_count:profiles(count)
      `)
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

/**
 * Obtener un rol por ID con sus permisos
 */
export async function getRoleById(id) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        description,
        permissions,
        created_at,
        updated_at,
        profiles:profiles(
          id,
          email,
          full_name,
          is_active
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener rol:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Crear un nuevo rol
 */
export async function createRole({ name, description, permissions = [] }) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: name.toLowerCase().trim(),
        description: description?.trim(),
        permissions: Array.isArray(permissions) ? permissions : []
      })
      .select(`
        id,
        name,
        description,
        permissions,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al crear rol:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Actualizar un rol existente
 */
export async function updateRole(id, { name, description, permissions }) {
  try {
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name.toLowerCase().trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim();
    }
    if (permissions !== undefined) {
      updateData.permissions = Array.isArray(permissions) ? permissions : [];
    }
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        permissions,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Eliminar un rol (solo si no tiene usuarios asignados)
 */
export async function deleteRole(id) {
  try {
    // Primero verificar si hay usuarios asignados
    const { data: profiles, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role_id', id)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (profiles && profiles.length > 0) {
      throw new Error('No se puede eliminar el rol porque tiene usuarios asignados');
    }

    // Eliminar el rol
    const { data, error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener todos los permisos disponibles (definidos en el sistema)
 */
export async function getAvailablePermissions() {
  try {
    // Permisos definidos en el sistema
    const systemPermissions = [
      {
        id: 'users.view',
        name: 'Ver Usuarios',
        description: 'Puede ver la lista de usuarios',
        category: 'usuarios'
      },
      {
        id: 'users.create',
        name: 'Crear Usuarios',
        description: 'Puede crear nuevos usuarios',
        category: 'usuarios'
      },
      {
        id: 'users.edit',
        name: 'Editar Usuarios',
        description: 'Puede editar usuarios existentes',
        category: 'usuarios'
      },
      {
        id: 'users.delete',
        name: 'Eliminar Usuarios',
        description: 'Puede eliminar usuarios',
        category: 'usuarios'
      },
      {
        id: 'users.activate',
        name: 'Activar/Desactivar Usuarios',
        description: 'Puede cambiar el estado de los usuarios',
        category: 'usuarios'
      },
      {
        id: 'roles.view',
        name: 'Ver Roles',
        description: 'Puede ver la lista de roles',
        category: 'roles'
      },
      {
        id: 'roles.create',
        name: 'Crear Roles',
        description: 'Puede crear nuevos roles',
        category: 'roles'
      },
      {
        id: 'roles.edit',
        name: 'Editar Roles',
        description: 'Puede editar roles existentes',
        category: 'roles'
      },
      {
        id: 'roles.delete',
        name: 'Eliminar Roles',
        description: 'Puede eliminar roles',
        category: 'roles'
      },
      {
        id: 'dashboard.view',
        name: 'Ver Dashboard',
        description: 'Puede acceder al dashboard principal',
        category: 'dashboard'
      },
      {
        id: 'reports.view',
        name: 'Ver Reportes',
        description: 'Puede ver reportes y estadísticas',
        category: 'reportes'
      },
      {
        id: 'contacts.view',
        name: 'Ver Contactos',
        description: 'Puede ver la lista de contactos',
        category: 'contactos'
      },
      {
        id: 'contacts.create',
        name: 'Crear Contactos',
        description: 'Puede crear nuevos contactos',
        category: 'contactos'
      },
      {
        id: 'contacts.edit',
        name: 'Editar Contactos',
        description: 'Puede editar contactos existentes',
        category: 'contactos'
      },
      {
        id: 'messages.view',
        name: 'Ver Mensajes',
        description: 'Puede ver el historial de mensajes',
        category: 'mensajes'
      },
      {
        id: 'messages.send',
        name: 'Enviar Mensajes',
        description: 'Puede enviar mensajes',
        category: 'mensajes'
      },
      {
        id: 'bots.view',
        name: 'Ver Bots',
        description: 'Puede ver la configuración de bots',
        category: 'bots'
      },
      {
        id: 'bots.manage',
        name: 'Gestionar Bots',
        description: 'Puede gestionar la configuración de bots',
        category: 'bots'
      },
      {
        id: 'settings.view',
        name: 'Ver Configuración',
        description: 'Puede ver la configuración del sistema',
        category: 'configuracion'
      },
      {
        id: 'settings.edit',
        name: 'Editar Configuración',
        description: 'Puede editar la configuración del sistema',
        category: 'configuracion'
      }
    ];

    // Agrupar por categoría
    const groupedPermissions = systemPermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});

    return { data: groupedPermissions, error: null };
  } catch (error) {
    console.error('Error al obtener permisos disponibles:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Asignar permisos a un rol
 */
export async function assignPermissionsToRole(roleId, permissions) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .update({
        permissions: Array.isArray(permissions) ? permissions : [],
        updated_at: new Date().toISOString()
      })
      .eq('id', roleId)
      .select('id, name, permissions')
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al asignar permisos:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obtener usuarios por rol
 */
export async function getUsersByRole(roleId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        updated_at
      `)
      .eq('role_id', roleId)
      .order('full_name', { ascending: true });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener usuarios por rol:', error);
    return { data: null, error: error.message };
  }
}
