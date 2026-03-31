'use client'
import { useState, useEffect } from 'react'
import { History, ChevronDown, ChevronUp, User, Clock, FileText } from 'lucide-react'
import { VUELOS_API } from '@/config/apiConfig'

export default function HistorialEdiciones({ vueloId }) {
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})

  useEffect(() => {
    if (vueloId) {
      cargarHistorial()
    }
  }, [vueloId])

  const cargarHistorial = async () => {
    try {
      setLoading(true)
      const response = await fetch(VUELOS_API.historialEdiciones(vueloId))
      
      if (!response.ok) {
        throw new Error('Error al cargar historial')
      }

      const { data } = await response.json()
      setHistorial(data || [])
    } catch (error) {
      console.error('Error cargando historial de ediciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleItemExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const formatCampoNombre = (campo) => {
    const traducciones = {
      'vuelo.pax_nombre': 'Nombre PAX',
      'vuelo.contacto_nombre': 'Contacto',
      'vuelo.contacto_telefono': 'Teléfono',
      'vuelo.fecha_vuelo': 'Fecha vuelo',
      'vuelo.ruta': 'Ruta',
      'vuelo.horario': 'Hora salida',
      'vuelo.hora_llegada': 'Hora llegada',
      'vuelo.aerolinea_nombre': 'Aerolínea',
      'vuelo.localizador': 'Localizador',
      'vuelo.proveedor': 'Proveedor',
      'vuelo.pnr_desglose': 'PNR/Desglose',
      'vuelo.observaciones': 'Observaciones',
      'vuelo.monto_venta': 'Monto venta',
      'vuelo.total_cotizacion': 'Subtotal'
    }

    // Para campos de pasajeros
    if (campo.startsWith('pasajero_')) {
      const match = campo.match(/pasajero_(\d+)\.(.+)/)
      if (match) {
        const [, orden, field] = match
        const fieldNames = {
          'nombres': 'Nombres',
          'apellidos': 'Apellidos',
          'precio_pantalla': 'Precio pantalla',
          'fee_agencia': 'Fee agencia',
          'numero_pasaporte': 'N° Pasaporte',
          'nacionalidad': 'Nacionalidad',
          'sexo': 'Sexo',
          'fecha_nacimiento': 'Fecha nac.'
        }
        return `Pasajero #${orden} - ${fieldNames[field] || field}`
      }
    }

    return traducciones[campo] || campo
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          <span>Cargando historial...</span>
        </div>
      </div>
    )
  }

  if (historial.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-gray-900">Historial de Ediciones</h3>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {historial.length} {historial.length === 1 ? 'edición' : 'ediciones'}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t border-gray-200">
          <div className="divide-y divide-gray-100">
            {historial.map((edicion) => (
              <div key={edicion.id} className="p-4">
                {/* Info principal de la edición */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-700">
                        #{edicion.intento_numero}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {edicion.editor?.full_name || 'Usuario'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(edicion.editado_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleItemExpanded(edicion.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {expandedItems[edicion.id] ? 'Ocultar cambios' : 'Ver cambios'}
                  </button>
                </div>

                {/* Razón de edición */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Razón de la edición:</p>
                      <p className="text-sm text-gray-700">{edicion.razon_edicion}</p>
                    </div>
                  </div>
                </div>

                {/* Detalle de cambios */}
                {expandedItems[edicion.id] && (
                  <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-amber-700 mb-2">Campos modificados:</p>
                    {Object.keys(edicion.campos_modificados || {}).map((campo) => (
                      <div key={campo} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-gray-700 min-w-[140px]">
                          {formatCampoNombre(campo)}:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs line-through">
                            {String(edicion.valores_anteriores?.[campo] ?? '-')}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            {String(edicion.valores_nuevos?.[campo] ?? '-')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
