'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  AlertCircle, Calendar, MapPin, DollarSign, CheckCircle, 
  XCircle, Plane, ExternalLink, Edit, Save, X 
} from 'lucide-react'

export default function AnulableDetail({ anulable }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    estado_anulacion: anulable.estado_anulacion,
    fecha_anulacion: anulable.fecha_anulacion || '',
    monto_recuperado: anulable.monto_recuperado || '',
    motivo_anulacion: anulable.motivo_anulacion || '',
    observaciones: anulable.observaciones || ''
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getEstadoConfig = (estado) => {
    const configs = {
      'PENDIENTE': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Pendiente' },
      'ANULADO': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Anulado' },
      'NO_ANULADO': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'No Anulado' }
    }
    return configs[estado] || configs.PENDIENTE
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/anulables/${anulable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Error al actualizar')

      router.refresh()
      setIsEditing(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el anulable')
    } finally {
      setIsSaving(false)
    }
  }

  const estadoConfig = getEstadoConfig(anulable.estado_anulacion)
  const EstadoIcon = estadoConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{anulable.pax_nombre}</h2>
            <div className="flex items-center gap-2 text-orange-100">
              <MapPin className="w-5 h-5" />
              <span className="text-xl font-semibold">{anulable.ruta}</span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${estadoConfig.color} flex items-center gap-2`}>
            <EstadoIcon className="w-5 h-5" />
            <span className="font-semibold">{estadoConfig.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-orange-500">
          <div>
            <div className="text-sm text-orange-200 mb-1">Localizador</div>
            <div className="font-mono font-bold">{anulable.localizador || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-orange-200 mb-1">Fecha Vuelo</div>
            <div className="font-semibold">{formatDate(anulable.fecha_vuelo)}</div>
          </div>
          <div>
            <div className="text-sm text-orange-200 mb-1">Fecha Límite</div>
            <div className="font-semibold">{formatDate(anulable.fecha_limite)}</div>
          </div>
          <div>
            <div className="text-sm text-orange-200 mb-1">Contacto</div>
            <div className="font-semibold">{anulable.contacto_nombre || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Enlace al Vuelo */}
      {anulable.vuelo && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Vuelo Asociado</p>
                <p className="text-lg font-bold text-blue-900">
                  {anulable.vuelo.ruta} - {anulable.vuelo.localizador}
                </p>
              </div>
            </div>
            <Link 
              href={`/ventas/vuelos/${anulable.vuelo.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Vuelo
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Información de Gestión */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Gestión de Anulación
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            {isEditing ? (
              <select
                value={formData.estado_anulacion}
                onChange={(e) => setFormData({ ...formData, estado_anulacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="ANULADO">Anulado</option>
                <option value="NO_ANULADO">No Anulado</option>
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{estadoConfig.label}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Anulación</label>
            {isEditing ? (
              <input
                type="date"
                value={formData.fecha_anulacion}
                onChange={(e) => setFormData({ ...formData, fecha_anulacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatDate(anulable.fecha_anulacion)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto Recuperado</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={formData.monto_recuperado}
                onChange={(e) => setFormData({ ...formData, monto_recuperado: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <p className="text-lg font-bold text-green-600">
                {anulable.monto_recuperado ? `$${anulable.monto_recuperado.toFixed(2)}` : 'N/A'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Anulación</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.motivo_anulacion}
                onChange={(e) => setFormData({ ...formData, motivo_anulacion: e.target.value })}
                placeholder="Ej: Cambio de planes del cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <p className="text-gray-900">{anulable.motivo_anulacion || 'N/A'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
            {isEditing ? (
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows="4"
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <p className="text-gray-900">{anulable.observaciones || 'Sin observaciones'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información del Vuelo Completa */}
      {anulable.vuelo && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-600" />
            Detalles del Vuelo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Aerolínea</label>
              <p className="text-gray-900 font-medium">
                {anulable.vuelo.aerolinea_nombre || 'N/A'}
                {anulable.vuelo.aerolinea_codigo && ` (${anulable.vuelo.aerolinea_codigo})`}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Proveedor</label>
              <p className="text-gray-900 font-medium">{anulable.vuelo.proveedor}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Pasajeros</label>
              <div className="flex gap-2 mt-1">
                {anulable.vuelo.num_adultos > 0 && (
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">{anulable.vuelo.num_adultos} ADT</span>
                )}
                {anulable.vuelo.num_ninos > 0 && (
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">{anulable.vuelo.num_ninos} CHD</span>
                )}
                {anulable.vuelo.num_infantes > 0 && (
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">{anulable.vuelo.num_infantes} INF</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Monto Venta</label>
              <p className="text-2xl font-bold text-purple-600">
                ${anulable.vuelo.monto_venta?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
