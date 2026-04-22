'use client'

import { useNotificaciones } from '@/contexts/NotificacionesContext'
import { Bell, X, CheckCheck, Trash2, Plane, Info, AlertCircle, AlertTriangle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

function formatRelativo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `Hace ${days}d`
}

function iconoTipo(tipo) {
  if (tipo === 'vuelo_creado') return <Plane className="w-4 h-4 text-blue-500" />
  if (tipo === 'vuelo_emitido') return <CheckCheck className="w-4 h-4 text-green-500" />
  if (tipo === 'pago_observado') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  if (tipo === 'recordatorio_autorizacion') return <Bell className="w-4 h-4 text-purple-500" />
  return <Info className="w-4 h-4 text-gray-400" />
}

export default function NotificacionesCampana() {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, eliminarNotificacion, limpiarTodas } = useNotificaciones()
  const [abierto, setAbierto] = useState(false)
  const panelRef = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setAbierto(false)
      }
    }
    if (abierto) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierto])

  const handleAbrir = () => {
    setAbierto(prev => !prev)
  }

  const handleClick = (notif) => {
    if (!notif.leida) marcarLeida(notif.id)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón campana */}
      <button
        onClick={handleAbrir}
        className="relative p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Notificaciones"
        aria-label="Abrir notificaciones"
      >
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-800 text-sm">Notificaciones</span>
              {noLeidas > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {noLeidas}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  title="Marcar todas como leídas"
                >
                  Leer todas
                </button>
              )}
              {notificaciones.length > 0 && (
                <button
                  onClick={limpiarTodas}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar todas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notificaciones.map(n => (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      n.leida ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 p-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
                      {iconoTipo(n.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.leida ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {n.titulo}
                      </p>
                      {n.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.descripcion}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">{formatRelativo(n.created_at)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); eliminarNotificacion(n.id) }}
                      className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {!n.leida && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
