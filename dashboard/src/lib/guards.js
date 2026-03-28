/**
 * Sistema de Guards para Control de Acceso
 * Usar en conjunto con useUserProfile
 */

/**
 * Guard para verificar permisos antes de ejecutar una acción
 * @param {Function} useUserProfile - Hook de contexto
 * @param {string|string[]} requiredPermissions - Permiso(s) requerido(s)
 * @param {Object} options - { requireAll: boolean, onUnauthorized: Function }
 */
export const usePermissionGuard = (requiredPermissions, options = {}) => {
  const { requireAll = false, onUnauthorized = null } = options

  return (useUserProfileHook) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = useUserProfileHook()

    // Super admin bypasea todos los guards
    if (isSuperAdmin) return true

    // Si es un solo permiso (string)
    if (typeof requiredPermissions === 'string') {
      const allowed = hasPermission(requiredPermissions)
      if (!allowed && onUnauthorized) onUnauthorized()
      return allowed
    }

    // Si es array de permisos
    if (Array.isArray(requiredPermissions)) {
      const allowed = requireAll 
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions)
      
      if (!allowed && onUnauthorized) onUnauthorized()
      return allowed
    }

    return false
  }
}

/**
 * Guard para verificar jerarquía antes de gestionar usuarios/roles
 * @param {number} targetRanking - Ranking del usuario/rol objetivo
 */
export const useHierarchyGuard = (targetRanking) => {
  return (useUserProfileHook) => {
    const { canManageRole, getRoleRanking, isSuperAdmin } = useUserProfileHook()

    // Super admin gestiona todo
    if (isSuperAdmin) return true

    // Verificar que mi ranking sea MAYOR (no igual)
    return canManageRole(targetRanking)
  }
}

/**
 * Guard para verificar rol específico
 * @param {string|string[]} allowedRoles - Rol(es) permitido(s)
 */
export const useRoleGuard = (allowedRoles) => {
  return (useUserProfileHook) => {
    const { role, isRole, isSuperAdmin } = useUserProfileHook()

    // Super admin siempre permitido
    if (isSuperAdmin) return true

    // Si es un solo rol
    if (typeof allowedRoles === 'string') {
      return isRole(allowedRoles)
    }

    // Si es array de roles
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.some(r => isRole(r))
    }

    return false
  }
}

/**
 * Guard combinado: rol + permisos + jerarquía
 */
export const useAccessGuard = (config = {}) => {
  return (useUserProfileHook) => {
    const {
      isSuperAdmin,
      isRole,
      hasPermission,
      hasAnyPermission,
      canManageRole
    } = useUserProfileHook()

    // Super admin bypasea todo
    if (isSuperAdmin) return true

    const {
      roles = null,              // string | string[]
      permissions = null,        // string | string[]
      requireAllPerms = false,   // AND vs OR para permisos
      targetRanking = null,      // Para validar jerarquía
      customCheck = null         // Función custom adicional
    } = config

    // Verificar roles si aplica
    if (roles) {
      const rolesArray = Array.isArray(roles) ? roles : [roles]
      const hasRole = rolesArray.some(r => isRole(r))
      if (!hasRole) return false
    }

    // Verificar permisos si aplica
    if (permissions) {
      const permsArray = Array.isArray(permissions) ? permissions : [permissions]
      const hasPerms = requireAllPerms
        ? permsArray.every(p => hasPermission(p))
        : hasAnyPermission(permsArray)
      if (!hasPerms) return false
    }

    // Verificar jerarquía si aplica
    if (targetRanking !== null) {
      if (!canManageRole(targetRanking)) return false
    }

    // Custom check adicional
    if (customCheck && typeof customCheck === 'function') {
      return customCheck(useUserProfileHook())
    }

    return true
  }
}

/**
 * Helper: Verificar si puede editar un usuario específico
 */
export const canEditUser = (targetUser, currentUserProfile) => {
  const { isSuperAdmin, canManageRole, profile } = currentUserProfile

  // Super admin edita a cualquiera
  if (isSuperAdmin) return true

  // No puede editarse a sí mismo desde gestión de usuarios
  if (targetUser.id === profile?.id) return false

  // Verificar jerarquía
  const targetRanking = targetUser.role?.ranking || 0
  return canManageRole(targetRanking)
}

/**
 * Helper: Verificar si puede asignar un rol específico
 */
export const canAssignRole = (targetRole, currentUserProfile) => {
  const { isSuperAdmin, canManageRole } = currentUserProfile

  // Super admin asigna cualquier rol
  if (isSuperAdmin) return true

  // Verificar que el rol objetivo tenga ranking menor
  const targetRanking = targetRole.ranking || 0
  return canManageRole(targetRanking)
}

/**
 * Helper: Verificar si puede desactivar un usuario
 */
export const canDeactivateUser = (targetUser, currentUserProfile) => {
  const { isSuperAdmin } = currentUserProfile

  // Super admin puede desactivar a cualquiera (incluso otros super_admin)
  if (isSuperAdmin) return true

  // Admin NO puede desactivar a super_admin (ni verlo)
  if (targetUser.role?.name === 'super_admin') return false

  // Usar misma lógica que editar
  return canEditUser(targetUser, currentUserProfile)
}

/**
 * Helper: Filtrar usuarios visibles según jerarquía
 */
export const filterVisibleUsers = (allUsers, currentUserProfile) => {
  const { isSuperAdmin, getRoleRanking } = currentUserProfile

  // Super admin ve a todos
  if (isSuperAdmin) return allUsers

  const myRanking = getRoleRanking()

  // Otros roles solo ven usuarios con ranking MENOR (no iguales ni superiores)
  return allUsers.filter(user => {
    const userRanking = user.role?.ranking || 0
    return userRanking < myRanking
  })
}

/**
 * Helper: Filtrar roles asignables según jerarquía
 */
export const filterAssignableRoles = (allRoles, currentUserProfile) => {
  const { isSuperAdmin, getRoleRanking } = currentUserProfile

  // Super admin puede asignar cualquier rol
  if (isSuperAdmin) return allRoles

  const myRanking = getRoleRanking()

  // Otros roles solo pueden asignar roles con ranking MENOR
  return allRoles.filter(role => {
    const roleRanking = role.ranking || 0
    return roleRanking < myRanking
  })
}

/**
 * Guard para componentes React (HOC)
 */
export const withPermissionGuard = (Component, requiredPermissions, options = {}) => {
  return function GuardedComponent(props) {
    const { useUserProfile } = require('@/contexts/UserProfileContext')
    const userProfile = useUserProfile()
    const { hasPermission, hasAnyPermission, isSuperAdmin } = userProfile
    const { requireAll = false, fallback = null } = options

    // Super admin bypasea
    if (isSuperAdmin) return <Component {...props} />

    // Verificar permisos
    const permsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    const allowed = requireAll
      ? permsArray.every(p => hasPermission(p))
      : hasAnyPermission(permsArray)

    if (!allowed) {
      return fallback || null
    }

    return <Component {...props} />
  }
}

/**
 * Guard condicional para renderizado
 */
export const CanAccess = ({ 
  children, 
  permissions = null,
  roles = null,
  targetRanking = null,
  requireAll = false,
  fallback = null,
  customCheck = null
}) => {
  const { useUserProfile } = require('@/contexts/UserProfileContext')
  const userProfile = useUserProfile()
  const guard = useAccessGuard({
    roles,
    permissions,
    requireAllPerms: requireAll,
    targetRanking,
    customCheck
  })

  const allowed = guard(userProfile)

  if (!allowed) {
    return fallback || null
  }

  return children
}
