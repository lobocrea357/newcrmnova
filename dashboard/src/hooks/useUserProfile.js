import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook para obtener el perfil completo del usuario desde la tabla profiles
 * Centraliza la obtención de datos del usuario incluyendo su rol
 */
export const useUserProfile = () => {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    profile: null,
    role: 'user',
    isManager: false,
    isAdmin: false,
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileData({
          profile: null,
          role: 'user',
          isManager: false,
          isAdmin: false,
          loading: false,
          error: null
        })
        return
      }

      try {
        // Obtener el perfil completo con relación a roles
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
              permissions
            )
          `)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error obteniendo perfil del usuario:', error)
          setProfileData({
            profile: null,
            role: 'user',
            isManager: false,
            isAdmin: false,
            loading: false,
            error: error.message
          })
          return
        }

        const roleName = data?.role?.name || 'user'
        const normalizedRole = String(roleName).toLowerCase()

        const isManager =
          normalizedRole === 'gerente' ||
          normalizedRole === 'manager'

        const isAdmin =
          normalizedRole === 'admin' ||
          normalizedRole === 'superadmin'

        setProfileData({
          profile: data,
          role: normalizedRole,
          isManager,
          isAdmin,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error en fetchUserProfile:', error)
        setProfileData({
          profile: null,
          role: 'user',
          isManager: false,
          isAdmin: false,
          loading: false,
          error: error.message
        })
      }
    }

    fetchUserProfile()
  }, [user])

  return profileData
}

export default useUserProfile
