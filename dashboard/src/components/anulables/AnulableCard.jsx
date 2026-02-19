'use client'
import { Calendar, MapPin, AlertCircle, CheckCircle, XCircle, ExternalLink, Plane } from 'lucide-react'
import Link from 'next/link'

export default function AnulableCard({ anulable }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getEstadoConfig = (estado) => {
    const configs = {
      'PENDIENTE': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: AlertCircle,
        label: 'Pendiente'
      },
      'ANULADO': {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        label: 'Anulado'
      },
      'NO_ANULADO': {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'No Anulado'
      }
    }
    return configs[estado] || configs.PENDIENTE
  }

  const estadoConfig = getEstadoConfig(anulable.estado_anulacion)
  const EstadoIcon = estadoConfig.icon

  const isUrgente = () => {
    if (!anulable.fecha_limite || anulable.estado_anulacion !== 'PENDIENTE') return false
    const hoy = new Date()
    const limite = new Date(anulable.fecha_limite)
    const diasRestantes = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24))
    return diasRestantes <= 3 && diasRestantes >= 0
  }

  return (
    <Link href={`/anulables/${anulable.id}`}>
      <div className={`bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer ${
        isUrgente() ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {anulable.pax_nombre}
              </h3>
              {isUrgente() && (
                <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse">
                  ¡URGENTE!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{anulable.ruta}</span>
              {anulable.localizador && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="font-mono">{anulable.localizador}</span>
                </>
              )}
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${estadoConfig.color}`}>
            <EstadoIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{estadoConfig.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar className="w-3 h-3" />
              <span>Fecha Vuelo</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(anulable.fecha_vuelo)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <AlertCircle className="w-3 h-3" />
              <span>Fecha Límite</span>
            </div>
            <p className={`text-sm font-medium ${isUrgente() ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
              {formatDate(anulable.fecha_limite)}
            </p>
          </div>

          {anulable.vuelo && (
            <>
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Plane className="w-3 h-3" />
                  <span>Aerolínea</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {anulable.vuelo.aerolinea_codigo || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Monto</p>
                <p className="text-sm font-bold text-purple-600">
                  ${anulable.vuelo.monto_venta?.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>

        {anulable.monto_recuperado && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monto Recuperado:</span>
              <span className="text-sm font-bold text-green-600">
                ${anulable.monto_recuperado.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <div className="text-xs text-gray-500">
            {anulable.contacto_nombre || 'Sin contacto'}
          </div>
          <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
            Ver detalles
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
