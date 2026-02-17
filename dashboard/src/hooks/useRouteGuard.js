'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from './useUserProfile'

/**
 * Hook para proteger páginas que requieren autenticación y roles específicos
 * Centraliza la lógica de protección de rutas
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.redirectTo - Ruta a la que redirigir si no está autenticado (default: '/login')
 * @param {boolean} options.requireAuth - Si requiere autenticación (default: true)
 * @param {Array<string>} options.allowedRoles - Roles permitidos para acceder (opcional)
 * @returns {Object} - Estado de autenticación y autorización
 */
export const useRouteGuard = (options = {}) => {
  const {
    redirectTo = '/login',
    requireAuth = true,
    allowedRoles = null
  } = options

  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated, initialized } = useAuth()
  const { profile, role, loading: profileLoading, isAdmin, isManager } = useUserProfile()

  useEffect(() => {
    // Esperar a que se inicialice la autenticación y el perfil
    if (!initialized || authLoading || profileLoading) return

    // Si se requiere autenticación y no está autenticado
    if (requireAuth && !isAuthenticated) {
      console.log('🚫 Acceso denegado: Usuario no autenticado')
      router.push(redirectTo)
      return
    }

    // Si hay roles específicos requeridos
    if (allowedRoles && isAuthenticated && user) {
      const hasPermission = allowedRoles.includes(role)

      if (!hasPermission) {
        console.log('🚫 Acceso denegado: Rol no autorizado', {
          userRole: role,
          allowedRoles
        })
        router.push('/no-autorizado')
        return
      }
    }
  }, [initialized, authLoading, profileLoading, isAuthenticated, user, role, requireAuth, allowedRoles, router, redirectTo])

  return {
    user,
    profile,
    loading: authLoading || !initialized || profileLoading,
    isAuthenticated,
    role,
    isAdmin,
    isManager,
    isAuthorized: !allowedRoles || allowedRoles.includes(role)
  }
}

/**
 * Hook simplificado para páginas que solo necesitan verificar autenticación
 */
export const useAuthRequired = () => {
  return useRouteGuard({ requireAuth: true })
}

/**
 * Hook para páginas de administrador
 */
export const useAdminRequired = () => {
  return useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'superadmin']
  })
}

/**
 * Hook para páginas de gerente o administrador
 */
export const useManagerRequired = () => {
  return useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'superadmin', 'gerente', 'manager']
  })
}

/**
 * Hook para páginas públicas que no requieren autenticación
 */
export const usePublicPage = () => {
  return useRouteGuard({ requireAuth: false })
}

export default useRouteGuard
