/**
 * Configuración de usuarios del sistema
 * Mapeo de emails a nombres completos y roles
 */

export const USER_CONFIG = {
  'moisesnova923@gmail.com': {
    fullName: 'Moises Guevara',
    role: 'Gerente',
    permissions: {
      canAccessAll: false,
      hiddenRoutes: ['/rutas-riesgo', '/ventas/vuelos', '/manual-ventas', '/ventas/anulables', '/analisis/reportes']
    }
  },
  'rafaelvuelos.nova@gmail.com': {
    fullName: 'Jesus Diaz',
    role: 'Gerente',
    permissions: {
      canAccessAll: false,
      hiddenRoutes: ['/rutas-riesgo', '/ventas/vuelos', '/manual-ventas', '/ventas/anulables', '/analisis/reportes']
    }
  },
  'iajosni012@gmail.com': {
    fullName: 'Endry Guevara',
    role: 'Gerente',
    permissions: {
      canAccessAll: false,
      hiddenRoutes: ['/rutas-riesgo', '/ventas/vuelos', '/manual-ventas', '/ventas/anulables', '/analisis/reportes']
    }
  },
  'admin@novapolointranet.xyz': {
    fullName: 'Administrador',
    role: 'Administrador',
    permissions: {
      canAccessAll: true,
      hiddenRoutes: []
    }
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
      permissions: {
        canAccessAll: true,
        hiddenRoutes: []
      }
    }
  }

  return USER_CONFIG[email] || {
    fullName: email.split('@')[0],
    role: 'Usuario',
    permissions: {
      canAccessAll: true,
      hiddenRoutes: []
    }
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
  return userInfo.permissions.hiddenRoutes.includes(route)
}
