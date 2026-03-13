'use client'
import { Plane, Calendar, Users, MapPin, AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function VueloCard({ vuelo }) {
  const totalPax = vuelo.num_adultos + vuelo.num_ninos + vuelo.num_infantes
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getTipoVueloColor = (tipo) => {
    const colors = {
      'MIGRACION': 'bg-blue-100 text-blue-800',
      'TURISMO': 'bg-green-100 text-green-800',
      'NEGOCIOS': 'bg-purple-100 text-purple-800',
      'OTRO': 'bg-gray-100 text-gray-800'
    }
    return colors[tipo] || colors.OTRO
  }

  const getTipoVueloLabel = (tipo) => {
    const labels = {
      'MIGRACION': 'Migración',
      'TURISMO': 'Turismo',
      'NEGOCIOS': 'Negocios',
      'OTRO': 'Otro'
    }
    return labels[tipo] || tipo
  }

  return (
    <Link href={`/ventas/vuelos/${vuelo.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {vuelo.pax_nombre}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoVueloColor(vuelo.tipo_vuelo)}`}>
                {getTipoVueloLabel(vuelo.tipo_vuelo)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{vuelo.ruta}</span>
              {vuelo.aerolinea_codigo && (
                <>
                  <span className="text-gray-400">•</span>
                  <Plane className="w-4 h-4" />
                  <span>{vuelo.aerolinea_codigo}</span>
                </>
              )}
            </div>
          </div>
          
          {vuelo.requiere_anulable && (
            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Anulable</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar className="w-3 h-3" />
              <span>Fecha</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(vuelo.fecha_vuelo)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Users className="w-3 h-3" />
              <span>Pasajeros</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {totalPax} PAX
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Localizador</p>
            <p className="text-sm font-medium text-gray-900 font-mono">
              {vuelo.localizador}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Venta</p>
            <p className="text-sm font-bold text-purple-600">
              ${vuelo.monto_venta?.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {vuelo.proveedor}
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
