'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  ClipboardList,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  X,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Plane,
  Plus
} from 'lucide-react'
import { COTIZACIONES_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import CotizacionDetail from '@/components/cotizaciones/CotizacionDetail'
import TutorialCotizaciones from '@/components/cotizaciones/TutorialCotizaciones'

export default function CotizacionesPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCotizacion, setSelectedCotizacion] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('all') // all, PENDIENTE, EN_REVISION, APROBADA, RECHAZADA
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchCotizaciones()
  }, [user, estadoFilter])

  const fetchCotizaciones = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('cotizaciones')
        .select(`
          *,
          pasajeros:cotizaciones_pasajeros(*)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      // Filtro por estado
      if (estadoFilter !== 'all') {
        query = query.eq('estado', estadoFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setCotizaciones(data || [])

      // Si hay cotizaciones y no hay una seleccionada, seleccionar la primera
      if (data && data.length > 0 && !selectedCotizacion) {
        setSelectedCotizacion(data[0])
      }

    } catch (error) {
      console.error('Error cargando cotizaciones:', error)
      toastError('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCotizacion = (cotizacion) => {
    setSelectedCotizacion(cotizacion)
  }

  const handleCotizacionUpdated = async () => {
    // Recargar lista de cotizaciones
    await fetchCotizaciones()

    // Si hay una cotización seleccionada, actualizarla con los nuevos datos
    if (selectedCotizacion) {
      try {
        const { data, error } = await supabase
          .from('cotizaciones')
          .select(`
            *,
            pasajeros:cotizaciones_pasajeros(*)
          `)
          .eq('id', selectedCotizacion.id)
          .single()

        if (!error && data) {
          setSelectedCotizacion(data)
        }
      } catch (error) {
        console.error('Error recargando cotización seleccionada:', error)
      }
    }
  }

  // Filtrar cotizaciones por búsqueda
  const filteredCotizaciones = cotizaciones.filter(c => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.nombre_cliente?.toLowerCase().includes(query) ||
      c.origen?.toLowerCase().includes(query) ||
      c.destino?.toLowerCase().includes(query) ||
      c.id?.toString().includes(query)
    )
  })

  const getEstadoBadgeColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'EN_REVISION':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'APROBADA':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'RECHAZADA':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const estadosCount = {
    all: cotizaciones.length,
    PENDIENTE: cotizaciones.filter(c => c.estado === 'PENDIENTE').length,
    EN_REVISION: cotizaciones.filter(c => c.estado === 'EN_REVISION').length,
    APROBADA: cotizaciones.filter(c => c.estado === 'APROBADA').length,
    RECHAZADA: cotizaciones.filter(c => c.estado === 'RECHAZADA').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header con botón crear */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-600 mt-1">Gestiona y revisa tus cotizaciones</p>
        </div>
        <button
          onClick={() => router.push('/cotizador')}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Crear Nueva Cotización
        </button>
      </div>

      {/* Tutorial */}
      <div className="mb-6">
        <TutorialCotizaciones />
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Columna Izquierda - Lista de Cotizaciones */}
        <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
              Cotizaciones
            </h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Filter className={`w-5 h-5 ${showFilters ? 'text-indigo-600' : 'text-gray-600'}`} />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, ruta..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filtros de Estado */}
          {showFilters && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Estado</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA'].map(estado => (
                  <button
                    key={estado}
                    onClick={() => setEstadoFilter(estado)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${estadoFilter === estado
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {estado === 'all' ? 'Todas' : estado.replace('_', ' ')} ({estadosCount[estado]})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lista de Cotizaciones */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : filteredCotizaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ClipboardList className="w-16 h-16 mb-4" />
              <p className="text-sm font-medium">No hay cotizaciones</p>
              {searchQuery && (
                <p className="text-xs mt-1">Intenta con otra búsqueda</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCotizaciones.map(cotizacion => (
                <button
                  key={cotizacion.id}
                  onClick={() => handleSelectCotizacion(cotizacion)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedCotizacion?.id === cotizacion.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {cotizacion.nombre_cliente}
                      </h3>
                    </div>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadgeColor(cotizacion.estado)}`}>
                      {cotizacion.estado}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Plane className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{cotizacion.origen} → {cotizacion.destino}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {(() => {
                        const [year, month, day] = cotizacion.fecha_salida.split('-')
                        const date = new Date(year, month - 1, day)
                        return date.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short'
                        })
                      })()}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-indigo-600">
                      <DollarSign className="w-3 h-3" />
                      {cotizacion.precio_final_cotizacion?.toFixed(2)} {cotizacion.moneda_cotizacion}
                    </div>
                  </div>

                  {cotizacion.pasajeros?.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {cotizacion.pasajeros.length} pasajero{cotizacion.pasajeros.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Columna Derecha - Detalle de Cotización */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
          {selectedCotizacion ? (
            <CotizacionDetail
              cotizacion={selectedCotizacion}
              onUpdate={handleCotizacionUpdated}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ClipboardList className="w-20 h-20 mb-4" />
              <p className="text-lg font-medium">Selecciona una cotización</p>
              <p className="text-sm mt-1">para ver los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
