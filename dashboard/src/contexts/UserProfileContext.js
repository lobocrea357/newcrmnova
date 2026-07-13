'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const UserProfileContext = createContext({})

export const useUserProfile = () => {
  const context = useContext(UserProfileContext)
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}

export const UserProfileProvider = ({ children }) => {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    profile: null,
    role: null,
    roleObject: null,
    rolePermissions: [],
    userPermissions: [],
    revokedPermissions: [],
    agencias: [],
    primaryAgencia: null,
    sede: null,
    loading: true,
    error: null
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Listener para actualización de avatar en tiempo real
  useEffect(() => {
    const handleAvatarUpdate = () => {
      // Forzar recarga del perfil
      setRefreshTrigger(prev => prev + 1)
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate)
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileData({
          profile: null,
          role: null,
          roleObject: null,
          rolePermissions: [],
          userPermissions: [],
          revokedPermissions: [],
          agencias: [],
          primaryAgencia: null,
          sede: null,
          loading: false,
          error: null
        })
        return
      }

      try {
        // 1. Obtener perfil con rol y sede
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            avatar_url,
            is_active,
            created_at,
            updated_at,
            equipo_id,
            sede_id,
            role:roles(
              id,
              name,
              description,
              ranking
            ),
            sede:sedes(
              id,
              nombre,
              codigo,
              ciudad,
              pais,
              direccion,
              telefono,
              is_active
            )
          `)
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        // 2. Obtener permisos del ROL
        let rolePermissions = []
        if (profileData?.role?.id) {
          const { data: rolePerms, error: rolePermsError } = await supabase
            .from('role_permissions')
            .select(`
              permission:permissions(
                name,
                description,
                category
              )
            `)
            .eq('role_id', profileData.role.id)

          if (!rolePermsError && rolePerms) {
            rolePermissions = rolePerms.map(rp => rp.permission.name)
          }
        }

        // 3. Obtener permisos específicos del USUARIO (overrides)
        const { data: userPerms, error: userPermsError } = await supabase
          .from('user_permissions')
          .select(`
            granted,
            permission:permissions(
              name,
              description,
              category
            )
          `)
          .eq('user_id', user.id)

        const userPermissions = !userPermsError && userPerms 
          ? userPerms.filter(up => up.granted).map(up => up.permission.name)
          : []

        const revokedPermissions = !userPermsError && userPerms
          ? userPerms.filter(up => !up.granted).map(up => up.permission.name)
          : []

        // 4. Obtener equipo liderado (si es gerente)
        let equipoLiderado = null
        if (profileData?.role?.name === 'gerente') {
          const { data: equipoData, error: equipoError } = await supabase
            .from('equipos')
            .select('id, nombre, descripcion, color')
            .eq('gerente_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (!equipoError && equipoData) {
            equipoLiderado = equipoData
          }
        }

        // 5. Obtener agencias del usuario
        let agencias = []
        let primaryAgencia = null
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
          const agenciasResponse = await fetch(`${apiUrl}/api/agencias/user/${user.id}`)
          const agenciasJson = await agenciasResponse.json()
          
          if (agenciasJson.success && agenciasJson.data) {
            const usuarioAgencias = agenciasJson.data
            agencias = usuarioAgencias
              .map(ua => ua.agencia)
              .filter(Boolean)
              .filter(a => a.is_active)
            
            const primaryUA = usuarioAgencias.find(ua => ua.is_primary)
            primaryAgencia = primaryUA?.agencia || null
          }
        } catch (agenciasError) {
          console.warn('⚠️ Error cargando agencias del usuario:', agenciasError)
        }

        // DEBUG: Log para diagnosticar permisos cargados
        console.log('🔐 [UserProfileContext] Perfil cargado:', {
          email: profileData.email,
          fullName: profileData.full_name,
          role: profileData.role?.name,
          roleId: profileData.role?.id,
          rolePermissionsCount: rolePermissions.length,
          rolePermissions: rolePermissions,
          userPermissionsCount: userPermissions.length,
          userPermissions: userPermissions,
          revokedPermissions: revokedPermissions,
          agenciasCount: agencias.length,
          agencias: agencias.map(a => a.nombre),
          primaryAgencia: primaryAgencia?.nombre || 'ninguna',
          sede: profileData.sede?.nombre || 'ninguna',
          equipoId: profileData.equipo_id || 'ninguno',
          equipoLiderado: equipoLiderado ? { id: equipoLiderado.id, nombre: equipoLiderado.nombre } : 'ninguno'
        })

        setProfileData({
          profile: profileData,
          role: profileData.role?.name || null,
          roleObject: profileData.role,
          rolePermissions,
          userPermissions,
          revokedPermissions,
          agencias,
          primaryAgencia,
          sede: profileData.sede || null,
          equipoId: profileData.equipo_id || null,
          equipoLiderado: equipoLiderado || null,
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error en fetchUserProfile:', error)
        setProfileData({
          profile: null,
          role: null,
          roleObject: null,
          rolePermissions: [],
          userPermissions: [],
          revokedPermissions: [],
          agencias: [],
          primaryAgencia: null,
          sede: null,
          loading: false,
          error: error.message
        })
      }
    }

    fetchUserProfile()
  }, [user, refreshTrigger])

  // Helpers computados (memoized para performance)
  const helpers = useMemo(() => {
    const { 
      role, 
      roleObject, 
      rolePermissions = [], 
      userPermissions = [], 
      revokedPermissions = [],
      agencias = [],
      primaryAgencia,
      sede
    } = profileData

    // Combinar permisos: rol + usuario - revocados
    const allPermissions = [
      ...new Set([
        ...rolePermissions,
        ...userPermissions
      ])
    ].filter(permission => !revokedPermissions.includes(permission))

    // Helper: verificar si tiene un permiso específico
    const hasPermission = (permissionName) => {
      // Super admin tiene TODOS los permisos sin excepción
      if (role === 'super_admin') return true
      // IMPORTANTE: Si no hay permisos cargados, retornar false
      if (!allPermissions || allPermissions.length === 0) return false
      return allPermissions.includes(permissionName)
    }

    // Helper: verificar si tiene al menos uno de los permisos
    const hasAnyPermission = (permissionsArray) => {
      if (role === 'super_admin') return true
      // Si no hay permisos en el array solicitado, retornar false
      if (!permissionsArray || permissionsArray.length === 0) return false
      // IMPORTANTE: Si el usuario no tiene NINGÚN permiso, retornar false directamente
      if (!allPermissions || allPermissions.length === 0) return false
      // Verificar si tiene al menos uno de los permisos solicitados
      return permissionsArray.some(p => allPermissions.includes(p))
    }

    // Helper: verificar si tiene todos los permisos
    const hasAllPermissions = (permissionsArray) => {
      if (role === 'super_admin') return true
      return permissionsArray.every(p => hasPermission(p))
    }

    // Helper: verificar rol específico
    const isRole = (roleName) => {
      if (!role) return false
      return role.toLowerCase() === roleName.toLowerCase()
    }

    // Helpers de conveniencia para roles comunes
    const isSuperAdmin = isRole('super_admin')
    const isAdmin = isRole('admin')
    const isManager = isRole('gerente')
    const isAsesor = isRole('asesor')
    const isEmisor = isRole('emisor')
    const isAdministracion = isRole('administracion')
    const isSupervisor = isRole('supervisor')
    const isLider = isRole('lider')

    // Helper: obtener ranking del rol (para comparación jerárquica)
    const getRoleRanking = () => roleObject?.ranking || 0

    // Helper: verificar si puede gestionar un usuario con otro rol
    const canManageRole = (targetRoleRanking) => {
      if (isSuperAdmin) return true // Super admin gestiona todo
      const myRanking = getRoleRanking()
      return myRanking > targetRoleRanking // Mayor ranking = mayor jerarquía
    }

    // ========================================
    // HELPERS DE AGENCIAS
    // ========================================

    // Helper: verificar si el usuario pertenece a una agencia específica (por código)
    const hasAgencia = (agenciaCodigo) => {
      if (!agenciaCodigo) return false
      return agencias.some(a => a.codigo === agenciaCodigo)
    }

    // Helper: verificar si una agencia es la primaria del usuario
    const isAgenciaPrimary = (agenciaCodigo) => {
      if (!agenciaCodigo || !primaryAgencia) return false
      return primaryAgencia.codigo === agenciaCodigo
    }

    // Helper: obtener agencia por código
    const getAgenciaByCode = (codigo) => {
      if (!codigo) return null
      return agencias.find(a => a.codigo === codigo) || null
    }

    // Helper: verificar si el usuario tiene al menos una agencia asignada
    const hasAnyAgencia = () => {
      return agencias.length > 0
    }

    // Helper: obtener todas las agencias del usuario
    const getAllAgencias = () => {
      return agencias
    }

    // Helper: obtener IDs de todas las agencias (útil para filtros)
    const getAgenciaIds = () => {
      return agencias.map(a => a.id)
    }

    // ========================================
    // HELPERS DE SEDES
    // ========================================

    // Helper: verificar si el usuario tiene una sede asignada
    const hasSede = () => {
      return !!sede
    }

    // Helper: verificar si la sede del usuario coincide con un código específico
    const isSedeCode = (sedeCodigo) => {
      if (!sedeCodigo || !sede) return false
      return sede.codigo === sedeCodigo
    }

    // Helper: obtener la sede del usuario
    const getSede = () => {
      return sede
    }

    // Helper: obtener el ID de la sede (útil para filtros)
    const getSedeId = () => {
      return sede?.id || null
    }

    return {
      allPermissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isRole,
      isSuperAdmin,
      isAdmin,
      isManager,
      isAsesor,
      isEmisor,
      isAdministracion,
      isSupervisor,
      isLider,
      getRoleRanking,
      canManageRole,
      hasAgencia,
      isAgenciaPrimary,
      getAgenciaByCode,
      hasAnyAgencia,
      getAllAgencias,
      getAgenciaIds,
      hasSede,
      isSedeCode,
      getSede,
      getSedeId
    }
  }, [profileData])

  const value = {
    ...profileData,
    ...helpers
  }

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  )
}

export default UserProfileContext
