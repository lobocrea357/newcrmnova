'use client'
import { useState, useMemo } from 'react'
import { Search, Filter, X, User } from 'lucide-react'
import VueloCard from './VueloCard'

const TIPOS_VUELO = [
  { value: '', label: 'Todos' },
  { value: 'solo_ida', label: 'Solo Ida' },
  { value: 'ida_vuelta', label: 'Ida y Vuelta' },
  { value: 'migratorio', label: 'Fines Migratorios' }
]

export default function VuelosList({ vuelos, pagination, onFilterChange, isLoading, role, currentUserId }) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    tipo_vuelo: '',
    fecha_desde: '',
    fecha_hasta: '',
    requiere_anulable: '',
    asesor_id: ''
  })

  const asesoresUnicos = useMemo(() => {
    if (!vuelos || vuelos.length === 0) return []
    const asesoresMap = new Map()
    vuelos.forEach(v => {
      if (v.creator && !asesoresMap.has(v.created_by)) {
        asesoresMap.set(v.created_by, {
          id: v.created_by,
          nombre: v.creator.full_name || 'Desconocido',
          email: v.creator.email || 'N/A'
        })
      }
    })
    return Array.from(asesoresMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [vuelos])

  const vuelosFiltrados = useMemo(() => {
    if (!filters.asesor_id) return vuelos
    return vuelos.filter(v => v.created_by === filters.asesor_id)
  }, [vuelos, filters.asesor_id])

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      tipo_vuelo: '',
      fecha_desde: '',
      fecha_hasta: '',
      requiere_anulable: '',
      asesor_id: ''
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por PAX, localizador o ruta..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
              Limpiar
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(role === 'gerente' || role === 'admin') && asesoresUnicos.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Asesor
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filters.asesor_id}
                    onChange={(e) => handleFilterChange('asesor_id', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Todos los asesores</option>
                    {asesoresUnicos.map(asesor => (
                      <option key={asesor.id} value={asesor.id}>
                        {asesor.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Vuelo
              </label>
              <select
                value={filters.tipo_vuelo}
                onChange={(e) => handleFilterChange('tipo_vuelo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {TIPOS_VUELO.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anulables
              </label>
              <select
                value={filters.requiere_anulable}
                onChange={(e) => handleFilterChange('requiere_anulable', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Solo anulables</option>
                <option value="false">Sin anulables</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de vuelos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vuelosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No se encontraron vuelos</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
                {vuelosFiltrados.map(vuelo => (
              <VueloCard key={vuelo.id} vuelo={vuelo} />
            ))}
          </div>

          {/* Paginación */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} vuelos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onFilterChange({ ...filters, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => onFilterChange({ ...filters, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
