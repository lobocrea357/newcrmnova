'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook para proteger páginas que requieren autenticación
 * Redirige automáticamente al login si el usuario no está autenticado
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.redirectTo - Ruta a la que redirigir si no está autenticado (default: '/login')
 * @param {boolean} options.requireAuth - Si requiere autenticación (default: true)
 * @param {Array<string>} options.allowedRoles - Roles permitidos para acceder (opcional)
 * @returns {Object} - Estado de autenticación y información del usuario
 */
export const useRequireAuth = (options = {}) => {
  const {
    redirectTo = '/login',
    requireAuth = true,
    allowedRoles = null
  } = options

  const router = useRouter()
  const { user, loading, isAuthenticated, initialized } = useAuth()

  useEffect(() => {
    // Esperar a que se inicialice la autenticación
    if (!initialized || loading) return

    // Si se requiere autenticación y no está autenticado
    if (requireAuth && !isAuthenticated) {
      console.log('🚫 Acceso denegado: Usuario no autenticado')
      router.push(redirectTo)
      return
    }

    // Si hay roles específicos requeridos
    if (allowedRoles && isAuthenticated && user) {
      const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user'
      const hasPermission = allowedRoles.includes(userRole)

      if (!hasPermission) {
        console.log('🚫 Acceso denegado: Rol no autorizado', {
          userRole,
          allowedRoles
        })
        router.push('/no-autorizado')
        return
      }
    }
  }, [initialized, loading, isAuthenticated, user, requireAuth, allowedRoles, router, redirectTo])

  return {
    user,
    loading: loading || !initialized,
    isAuthenticated,
    isAuthorized: !allowedRoles || (user && allowedRoles.includes(
      user.user_metadata?.role || user.app_metadata?.role || 'user'
    ))
  }
}

/**
 * Hook simplificado para páginas que solo necesitan verificar autenticación
 */
export const useAuthRequired = () => {
  return useRequireAuth({ requireAuth: true })
}

/**
 * Hook para páginas de administrador
 */
export const useAdminRequired = () => {
  return useRequireAuth({
    requireAuth: true,
    allowedRoles: ['admin', 'superadmin']
  })
}

/**
 * Hook para páginas públicas que no requieren autenticación
 */
export const usePublicPage = () => {
  return useRequireAuth({ requireAuth: false })
}

export default useRequireAuth
