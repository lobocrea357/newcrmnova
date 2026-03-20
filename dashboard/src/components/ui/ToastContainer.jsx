'use client'

import { useNotificaciones } from '@/contexts/NotificacionesContext'
import { X, Plane, CheckCheck, Info } from 'lucide-react'

function iconoTipo(tipo) {
  if (tipo === 'vuelo_creado') return <Plane className="w-4 h-4" />
  if (tipo === 'vuelo_emitido') return <CheckCheck className="w-4 h-4" />
  return <Info className="w-4 h-4" />
}

function colorTipo(tipo) {
  if (tipo === 'vuelo_creado') return 'from-blue-500 to-blue-600'
  if (tipo === 'vuelo_emitido') return 'from-green-500 to-green-600'
  if (tipo === 'warning') return 'from-yellow-500 to-yellow-600'
  return 'from-gray-500 to-gray-600'
}

export default function ToastContainer() {
  const { toasts, cerrarToast } = useNotificaciones()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.toastId}
          className="pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 animate-in slide-in-from-bottom-4 duration-300"
          role="alert"
        >
          {/* Icono con degradado */}
          <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br ${colorTipo(toast.tipo)} text-white shadow-sm`}>
            {iconoTipo(toast.tipo)}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {toast.titulo}
            </p>
            {toast.descripcion && (
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {toast.descripcion}
              </p>
            )}
          </div>

          {/* Cerrar */}
          <button
            onClick={() => cerrarToast(toast.toastId)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Barra de progreso */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-blue-400 rounded-b-xl animate-shrink" style={{ animationDuration: '5s' }} />
        </div>
      ))}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink linear forwards;
        }
      `}</style>
    </div>
  )
}
