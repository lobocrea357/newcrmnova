/**
 * Configuración de usuarios del sistema
 * Mapeo de emails a nombres completos y roles
 */

// Definición de permisos por rol
const ROLE_PERMISSIONS = {
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
      '/cotizador',
      '/ventas/cotizaciones',
      '/ventas/vuelos',
      '/admin/confirmar-pagos',
      '/emisiones',
      '/inteligencia-artificial',
      '/configuracion'
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
 * @returns {boolean} true si la ruta debe ocultarse
 */
export function isRouteHidden(email, route) {
  const userInfo = getUserInfo(email)
  const permissions = userInfo.permissions

  // Admin puede ver todo
  if (permissions.canAccessAll) {
    return false
  }

  // Verificar si la ruta está en las rutas permitidas
  // Comparar tanto ruta exacta como rutas que empiezan con la permitida
  const isAllowed = permissions.allowedRoutes.some(allowedRoute => {
    if (route === allowedRoute) return true
    // Si la ruta permitida es '/ventas/vuelos', permitir también '/ventas/vuelos/nuevo'
    if (route.startsWith(allowedRoute + '/')) return true
    return false
  })

  return !isAllowed
}
