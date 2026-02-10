import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook para facilitar el uso de roles en los componentes.
 *
 * Obtiene el rol desde los metadatos del usuario de Supabase y expone
 * helpers comunes para control de permisos en el frontend.
 *
 * Convenciones actuales:
 * - Roles de negocio: 'gerente', 'asesor'
 * - Roles de sistema: 'admin', 'superadmin'
 */
export const useRole = () => {
  const { user } = useAuth()

  // Rol base obtenido desde los metadatos del usuario
  const role =
    user?.user_metadata?.role ||
    user?.app_metadata?.role ||
    'user'

  const normalizedRole = String(role).toLowerCase()

  const isManager =
    normalizedRole === 'gerente' ||
    normalizedRole === 'manager'

  const isAdmin =
    normalizedRole === 'admin' ||
    normalizedRole === 'superadmin'

  return {
    role: normalizedRole,
    isManager,
    isAdmin,
  }
}

export default useRole

