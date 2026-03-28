/**
 * DEPRECADO: Este hook ahora es solo un alias del UserProfileContext
 * Se mantiene por compatibilidad con componentes existentes
 * 
 * USO RECOMENDADO:
 * import { useUserProfile } from '@/contexts/UserProfileContext'
 */

import { useUserProfile as useUserProfileFromContext } from '@/contexts/UserProfileContext'

// Re-exportar desde el contexto
export const useUserProfile = useUserProfileFromContext

export default useUserProfileFromContext
