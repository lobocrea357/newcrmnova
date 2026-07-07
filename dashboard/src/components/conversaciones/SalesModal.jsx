// dashboard/src/components/conversaciones/SalesModal.jsx
'use client'

import { useEffect, useCallback } from 'react'
import { RefreshCw, X, ArrowUp, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Modal que muestra las ventas concretadas (sale_completed = true)
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Array} props.conversations — lista de ventas
 * @param {boolean} props.loading
 * @param {string|null} props.error
 */
export default function SalesModal({ isOpen, onClose, conversations, loading, error }) {
  const router = useRouter()

  // Cerrar con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sales-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 id="sales-modal-title" className="text-xl font-semibold text-gray-900">
              Ventas Concretadas
            </h3>
            <p className="text-sm text-gray-500">
              Conversaciones con venta confirmada por IA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total: <strong>{conversations.length}</strong> ventas registradas
          </span>
          <span className="text-gray-500 flex items-center gap-1">
            <ArrowUp className="h-4 w-4 text-green-500" />
            Actualizado en tiempo real con IA
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
              <RefreshCw className="h-6 w-6 animate-spin" />
              Cargando ventas...
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-red-600">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No se encontraron ventas concretadas todavía.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversations.map((sale) => (
                <li
                  key={sale.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {sale.displayName} · {sale.displayPhone}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-3">
                      <span>Asesor: {sale.advisorName}</span>
                      <span className="text-gray-300">•</span>
                      <span>{sale.formattedDate}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        router.push(
                          `/conversaciones/chat/${sale.id}?botId=${sale.bot?.id || sale.bot_id}`,
                        )
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100"
                    >
                      Ver conversación
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Mostrando las conversaciones donde la IA marcó{' '}
            <strong>sale_completed = true</strong>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
