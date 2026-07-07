/**
 * Configuración de usuarios del sistema
 * Mapeo de emails a nombres completos y roles
 */

// Definición de permisos por rol
// IMPORTANTE: super_admin y admin tienen canAccessAll: true
const ROLE_PERMISSIONS = {
  'super_admin': {
    canAccessAll: true,
    allowedRoutes: [] // Puede ver TODO
  },
  'admin': {
    canAccessAll: true,
    allowedRoutes: [] // Puede ver TODO
  },
  'asesor': {
    canAccessAll: false,
    allowedRoutes: [
      '/',
      '/cotizador',
      '/ventas/cotizaciones',
      '/ventas/vuelos',
      '/ventas/vuelos/nuevo'
    ]
  },
  'administracion': {
    canAccessAll: false,
    allowedRoutes: [
      '/',
      '/cotizador',
      '/ventas/cotizaciones',
      '/ventas/vuelos',
      '/ventas/vuelos/nuevo',
      '/admin/confirmar-pagos'
    ]
  },
  'emisor': {
    canAccessAll: false,
    allowedRoutes: [
      '/',
      '/emisiones'
    ]
  },
  'gerente': {
    canAccessAll: false,
    allowedRoutes: [
      '/',
      '/conversaciones',
      '/analisis/rendimiento',
      '/gestion-equipos',
      '/cotizador',
      '/ventas/cotizaciones',
      '/ventas/vuelos',
      '/admin/confirmar-pagos',
      '/emisiones',
      '/inteligencia-artificial',
      '/configuracion',
      '/configuracion/mi-equipo'
    ]
  }
}

export const USER_CONFIG = {
  'moisesnova923@gmail.com': {
    fullName: 'Moises Guevara',
    role: 'Gerente',
    roleKey: 'gerente'
  },
  'rafaelvuelos.nova@gmail.com': {
    fullName: 'Jesus Diaz',
    role: 'Gerente',
    roleKey: 'gerente'
  },
  'iajosni012@gmail.com': {
    fullName: 'Endry Guevara',
    role: 'Gerente',
    roleKey: 'gerente'
  },
  'admin@novapolointranet.xyz': {
    fullName: 'Administrador',
    role: 'Administrador',
    roleKey: 'admin'
  }
}

/**
 * Obtiene información del usuario por email
 * @param {string} email - Email del usuario
 * @returns {object} Información del usuario o default
 */
export function getUserInfo(email) {
  if (!email) {
    return {
      fullName: 'Usuario',
      role: 'Usuario',
      roleKey: 'admin',
      permissions: ROLE_PERMISSIONS['admin']
    }
  }

  const userConfig = USER_CONFIG[email]
  
  if (!userConfig) {
    // Usuario no configurado - asignar rol asesor por defecto (seguridad)
    return {
      fullName: email.split('@')[0],
      role: 'Asesor',
      roleKey: 'asesor',
      permissions: ROLE_PERMISSIONS['asesor']
    }
  }

  // Usuario configurado - usar sus permisos de rol
  const roleKey = userConfig.roleKey || 'admin'
  const permissions = ROLE_PERMISSIONS[roleKey] || ROLE_PERMISSIONS['admin']

  return {
    ...userConfig,
    permissions
  }
}

/**
 * Verifica si una ruta debe estar oculta para el usuario
 * @param {string} email - Email del usuario
 * @param {string} route - Ruta a verificar
 * @param {string} dbRole - Rol del usuario desde la base de datos (opcional, prioritario)
 * @returns {boolean} true si la ruta debe ocultarse
 */
export function isRouteHidden(email, route, dbRole = null) {
  // PRIORIDAD: Usar el rol de la BD si está disponible
  if (dbRole) {
    const roleKey = dbRole.toLowerCase()
    const rolePermissions = ROLE_PERMISSIONS[roleKey]
    
    // Si el rol tiene acceso total, no ocultar nada
    if (rolePermissions?.canAccessAll) {
      return false
    }
    
    // Si el rol existe en la configuración, usar sus rutas permitidas
    if (rolePermissions) {
      const isAllowed = rolePermissions.allowedRoutes.some(allowedRoute => {
        if (route === allowedRoute) return true
        if (route.startsWith(allowedRoute + '/')) return true
        return false
      })
      return !isAllowed
    }
  }

  // FALLBACK: Usar la configuración por email (sistema antiguo)
  const userInfo = getUserInfo(email)
  const permissions = userInfo.permissions

  // Admin puede ver todo
  if (permissions.canAccessAll) {
    return false
  }

  // Verificar si la ruta está en las rutas permitidas
  const isAllowed = permissions.allowedRoutes.some(allowedRoute => {
    if (route === allowedRoute) return true
    if (route.startsWith(allowedRoute + '/')) return true
    return false
  })

  return !isAllowed
}
