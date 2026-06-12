// dashboard/src/components/conversaciones/SyncModal.jsx
'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

/**
 * Modal que muestra el progreso de sincronización completa con WAHA
 * @param {Object} props
 * @param {Object|null} props.syncProgress — { percent, status }
 * @param {Array} props.syncLogs — [{ message, type, time }]
 * @param {boolean} props.syncing — si la sincronización está en progreso
 * @param {Function} props.onClose
 */
export default function SyncModal({ syncProgress, syncLogs, syncing, onClose }) {
  // Cerrar con Escape (solo si no está sincronizando)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !syncing) {
      onClose()
    }
  }, [onClose, syncing])

  useEffect(() => {
    if (syncProgress) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [syncProgress, handleKeyDown])

  if (!syncProgress) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 id="sync-modal-title" className="text-xl font-semibold text-gray-900">
              Sincronización Completa
            </h3>
            <p className="text-sm text-gray-500">
              Conectando con Express y WAHA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-600 ${syncing ? 'pointer-events-none opacity-50' : ''}`}
            disabled={syncing}
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {syncProgress.status}
          </p>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${Math.min(syncProgress.percent, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 text-sm max-h-64 overflow-y-auto">
            {syncLogs.length === 0 ? (
              <p className="text-gray-500 text-center">
                Esperando actualizaciones...
              </p>
            ) : (
              <ul className="space-y-2">
                {syncLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start gap-2"
                  >
                    <span className="text-[11px] text-gray-400">
                      {log.time}
                    </span>
                    <span
                      className={`text-sm ${log.type === 'error' ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      {log.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            La sincronización puede tardar varios minutos dependiendo de la
            cantidad de bots.
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={syncing}
            className={`px-4 py-2 rounded-lg border text-sm transition ${
              syncing
                ? 'border-gray-300 text-gray-400'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
