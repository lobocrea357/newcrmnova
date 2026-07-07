'use client'

import { useEffect } from 'react'
import { useNotificaciones } from '@/contexts/NotificacionesContext'
import toast from 'react-hot-toast'

/**
 * Componente que escucha el contexto de notificaciones y muestra toasts automáticamente
 */
export default function ToastNotifications() {
  const { toasts } = useNotificaciones()

  useEffect(() => {
    // Mostrar toast por cada nueva notificación
    toasts.forEach(notif => {
      // Evitar duplicados verificando si ya se mostró este toast
      const toastId = `notif-${notif.id || notif.toastId}`

      // Determinar tipo de toast según el tipo de notificación
      const tipoToast = notif.tipo || 'info'

      // Columnas reales de la tabla: titulo + descripcion
      const texto = notif.titulo || notif.title || 'Notificación'
      const subtexto = notif.descripcion || notif.description || ''
      const mensaje = subtexto ? `${texto}: ${subtexto}` : texto

      switch (tipoToast) {
        case 'success':
        case 'exito':
          toast.success(mensaje, {
            id: toastId,
            duration: 4000,
          })
          break

        case 'error':
          toast.error(mensaje, {
            id: toastId,
            duration: 5000,
          })
          break

        case 'warning':
        case 'advertencia':
          toast(mensaje, {
            id: toastId,
            duration: 4500,
            icon: '⚠️',
            style: {
              background: 'white',
              color: '#92400e',
              border: '1px solid #f59e0b',
            },
          })
          break

        case 'info':
        default:
          toast(mensaje, {
            id: toastId,
            duration: 4000,
            icon: 'ℹ️',
            style: {
              background: 'white',
              color: '#1e40af',
              border: '1px solid #3b82f6',
            },
          })
          break
      }
    })
  }, [toasts])

  // Este componente no renderiza nada visible
  return null
}
