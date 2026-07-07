import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { getMetaPorAgencia } from '@/lib/ranking/helpers'

export const useMetaNotifications = () => {
  const { user } = useAuth()
  const [notificacionesActivas, setNotificacionesActivas] = useState(new Set())
  const [ultimaVerificacion, setUltimaVerificacion] = useState(null)

  // Verificar si un usuario alcanzó meta
  const verificarMetaAlcanzada = useCallback(async (userId, feeActual, meta) => {
    if (feeActual < meta) return
    
    const notifKey = `meta_alcanzada_${userId}_${new Date().getMonth()}`
    
    // Evitar notificar múltiples veces el mismo mes
    if (notificacionesActivas.has(notifKey)) return
    
    // Obtener datos del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()
    
    if (profile) {
      // Notificación global (visible para todos)
      toast.success(
        `🏆 ¡${profile.full_name} alcanzó su meta del mes!`,
        {
          duration: 5000,
          icon: '🏆',
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      )
      
      // Notificación personal si es el usuario actual
      if (userId === user?.id) {
        toast.success(
          `🎉 ¡Felicidades! Alcanzaste tu meta de $${meta.toLocaleString()}`,
          {
            duration: 6000,
            icon: '🎉',
            style: {
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              fontWeight: 'bold'
            }
          }
        )
      }
      
      setNotificacionesActivas(prev => new Set([...prev, notifKey]))
    }
  }, [user, notificacionesActivas])

  // Verificar si está cerca de la meta
  const verificarCercaDeMeta = useCallback(async (userId, feeActual, meta) => {
    const progreso = (feeActual / meta) * 100
    
    if (progreso < 85 || progreso >= 100) return
    
    const notifKey = `cerca_meta_${userId}_${new Date().getDate()}`
    
    // Evitar notificar múltiples veces el mismo día
    if (notificacionesActivas.has(notifKey)) return
    
    const faltante = meta - feeActual
    
    // Solo notificar al usuario afectado
    if (userId === user?.id) {
      toast(
        `🔥 ¡Estás muy cerca! Solo faltan $${faltante.toLocaleString()} para tu meta`,
        {
          duration: 4000,
          icon: '🔥',
          style: {
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      )
      
      setNotificacionesActivas(prev => new Set([...prev, notifKey]))
    }
  }, [user, notificacionesActivas])

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('meta-notificaciones')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vuelos'
        },
        async (payload) => {
          const { new: nuevoVuelo } = payload
          
          if (nuevoVuelo && nuevoVuelo.created_by) {
            // Recalcular fee del mes para el usuario afectado
            const { data: vuelosMes } = await supabase
              .from('vuelos')
              .select(`
                created_at,
                pasajeros:vuelos_pasajeros(fee_agencia),
                creator:profiles!created_by(
                  agencia_usuario:usuario_agencias!usuario_agencias_user_id_fkey(
                    is_primary, 
                    agencia:agencias!agencia_id(id, codigo)
                  )
                )
              `)
              .eq('created_by', nuevoVuelo.created_by)
              .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
              .neq('estado', 'CANCELADO')

            let feeTotal = 0
            let agenciaCodigo = 'SIN_AGENCIA'
            
            vuelosMes?.forEach(vuelo => {
              if (vuelo.pasajeros) {
                vuelo.pasajeros.forEach(p => {
                  feeTotal += parseFloat(p.fee_agencia) || 0
                })
              }
              
              if (vuelo.creator?.agencia_usuario) {
                const agenciaPrimaria = vuelo.creator.agencia_usuario.find(au => au.is_primary)
                if (agenciaPrimaria?.agencia) {
                  agenciaCodigo = agenciaPrimaria.agencia.codigo
                }
              }
            })
            
            // Determinar meta según agencia
            const meta = getMetaPorAgencia(agenciaCodigo)
            
            // Verificar notificaciones
            await verificarMetaAlcanzada(nuevoVuelo.created_by, feeTotal, meta)
            await verificarCercaDeMeta(nuevoVuelo.created_by, feeTotal, meta)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, verificarMetaAlcanzada, verificarCercaDeMeta])

  // Resetear notificaciones activas cada mes
  useEffect(() => {
    const resetMensual = () => {
      setNotificacionesActivas(new Set())
      setUltimaVerificacion(new Date())
    }

    // Resetear el día 1 de cada mes
    const ahora = new Date()
    const diaDelMes = ahora.getDate()
    const hora = ahora.getHours()
    
    if (diaDelMes === 1 && hora === 0) {
      resetMensual()
    }
  }, [])

  return {
    notificacionesActivas,
    ultimaVerificacion
  }
}
