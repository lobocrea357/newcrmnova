'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const NotificacionesContext = createContext({})

export const useNotificaciones = () => {
  const ctx = useContext(NotificacionesContext)
  if (!ctx) throw new Error('useNotificaciones must be used within NotificacionesProvider')
  return ctx
}

export function NotificacionesProvider({ children }) {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [toasts, setToasts] = useState([])
  const [loading, setLoading] = useState(false)

  // Número de notificaciones sin leer
  const noLeidas = notificaciones.filter(n => !n.leida).length

  // Cargar notificaciones iniciales
  const cargarNotificaciones = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotificaciones(data)
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Marcar una notificación como leída
  const marcarLeida = useCallback(async (id) => {
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    )
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
      .eq('user_id', user?.id)
  }, [user?.id])

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('user_id', user?.id)
      .eq('leida', false)
  }, [user?.id])

  // Eliminar una notificación
  const eliminarNotificacion = useCallback(async (id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id))
    await supabase
      .from('notificaciones')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id)
  }, [user?.id])

  // Limpiar todas las notificaciones
  const limpiarTodas = useCallback(async () => {
    setNotificaciones([])
    await supabase
      .from('notificaciones')
      .delete()
      .eq('user_id', user?.id)
  }, [user?.id])

  // Agregar un toast temporal
  const agregarToast = useCallback((notificacion) => {
    const id = Date.now()
    const toast = { ...notificacion, toastId: id }
    setToasts(prev => [toast, ...prev].slice(0, 3))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== id))
    }, 5000)
  }, [])

  // Cerrar toast manualmente
  const cerrarToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId))
  }, [])

  // Suscripción Supabase Realtime — igual al patrón de ChatView
  useEffect(() => {
    if (!user?.id) return

    cargarNotificaciones()

    const channel = supabase
      .channel(`notificaciones-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const nueva = payload.new
          // Añadir al estado sin recargar todo
          setNotificaciones(prev => {
            const existe = prev.some(n => n.id === nueva.id)
            if (existe) return prev
            return [nueva, ...prev]
          })
          // Mostrar toast
          agregarToast(nueva)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, cargarNotificaciones, agregarToast])

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      toasts,
      loading,
      marcarLeida,
      marcarTodasLeidas,
      eliminarNotificacion,
      limpiarTodas,
      cerrarToast,
      recargar: cargarNotificaciones
    }}>
      {children}
    </NotificacionesContext.Provider>
  )
}

export default NotificacionesContext
