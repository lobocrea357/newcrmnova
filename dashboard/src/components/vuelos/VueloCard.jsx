'use client'
import { Plane, Calendar, Users, MapPin, AlertCircle, ExternalLink, ArrowRight, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const ESTADO_CONFIG = {
  'PENDIENTE_CONFIRMACION_PAGO': { label: 'Pend. Pago', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'PENDIENTE_EMISION': { label: 'Pend. Emisión', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'EMITIDO': { label: 'Emitido', color: 'bg-green-100 text-green-800 border-green-200' },
  'CANCELADO': { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
}

const MONEDA_SIMBOLO = {
  'USD': '$',
  'COP': 'COP$',
  'EUR': '€',
  'BS': 'Bs.',
}

export default function VueloCard({ vuelo }) {
  const router = useRouter()
  const { user } = useAuth()
  const totalPax = (vuelo.num_adultos || 0) + (vuelo.num_ninos || 0) + (vuelo.num_infantes || 0)
  
  // Verificar permisos de edición
  const esCreador = vuelo.created_by === user?.id
  const role = user?.role
  const esAdmin = role === 'admin' || role === 'super_admin'
  const esGerente = role === 'gerente'

  // Gerente puede editar si es creador O si el creador está en su equipo
  const puedeEditarGerente = esGerente && (esCreador || vuelo.creator?.equipo_id === user?.equipo_id)

  const edicionesDisponibles = vuelo.ediciones_disponibles ?? 3

  // Determinar si puede editar:
  // - Admin/Super Admin: siempre (sin límite de intentos)
  // - Gerente: sus vuelos + vuelos de su equipo (sin límite de intentos)
  // - Asesor creador: solo sus vuelos (con límite de 3 intentos)
  const puedeEditar = vuelo.estado !== 'EMITIDO' && (
    esAdmin ||
    puedeEditarGerente ||
    (esCreador && edicionesDisponibles > 0)
  )

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/ventas/vuelos/${vuelo.id}/editar`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00')
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getTipoVueloColor = (tipo) => {
    const colors = {
      'solo_ida': 'bg-blue-100 text-blue-800',
      'ida_vuelta': 'bg-green-100 text-green-800',
      'migratorio': 'bg-purple-100 text-purple-800'
    }
    return colors[tipo] || 'bg-gray-100 text-gray-800'
  }

  const getTipoVueloLabel = (tipo) => {
    const labels = {
      'solo_ida': 'Solo Ida',
      'ida_vuelta': 'Ida y Vuelta',
      'migratorio': 'Fines Migratorios'
    }
    return labels[tipo] || tipo
  }

  const getSimboloMoneda = (moneda) => MONEDA_SIMBOLO[moneda] || moneda || '$'

  const formatMonto = (monto, moneda) => {
    if (!monto && monto !== 0) return 'N/A'
    const simbolo = getSimboloMoneda(moneda)
    return `${simbolo}${Number(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const estadoConfig = ESTADO_CONFIG[vuelo.estado] || { label: vuelo.estado, color: 'bg-gray-100 text-gray-800 border-gray-200' }

  return (
    <Link href={`/ventas/vuelos/${vuelo.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {vuelo.pax_nombre}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoVueloColor(vuelo.tipo_vuelo)}`}>
                {getTipoVueloLabel(vuelo.tipo_vuelo)}
              </span>
              <span className={`px-2 py-0.5 rounded border text-xs font-medium ${estadoConfig.color}`}>
                {estadoConfig.label}
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
            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg ml-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Anulable</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar className="w-3 h-3" />
              <span>Fecha Vuelo</span>
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
              {vuelo.localizador || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Venta</p>
            <div className="flex items-center gap-1 flex-wrap">
              <p className="text-sm font-bold text-purple-600">
                {formatMonto(vuelo.monto_venta, vuelo.moneda_cotizacion)}
              </p>
              {vuelo.total_cotizacion && vuelo.total_cotizacion !== vuelo.monto_venta && (
                <>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500">
                    {formatMonto(vuelo.total_cotizacion, vuelo.moneda_precio)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{vuelo.proveedor}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400">Creado por: {vuelo.creator?.full_name || 'N/A'}</span>
            {/* Badge de ediciones disponibles (solo para asesores creadores) */}
            {esCreador && !esGerente && !esAdmin && vuelo.estado !== 'EMITIDO' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${edicionesDisponibles > 1
                  ? 'bg-green-100 text-green-700'
                  : edicionesDisponibles === 1
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                {edicionesDisponibles > 0 ? `${edicionesDisponibles} ediciones` : 'Sin ediciones'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Botón de editar */}
            {puedeEditar && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-1 px-3 py-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors"
                title="Editar vuelo"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
            )}
            <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
              Ver detalles
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
