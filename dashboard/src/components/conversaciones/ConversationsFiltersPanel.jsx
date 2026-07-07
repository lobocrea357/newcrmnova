// dashboard/src/components/conversaciones/ConversationsFiltersPanel.jsx
'use client'

import { Filter, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { LEADERS, LEADS, SEDES } from '@/lib/constants/filtrosConstants'

export default function ConversationsFiltersPanel({
  showFilters,
  setShowFilters,
  activeFiltersCount,
  activeFilterPills,
  filteredBotsCount,
  botsCount,
  statusFilter,
  setStatusFilter,
  leaderFilter,
  setLeaderFilter,
  leadFilter,
  setLeadFilter,
  sedeFilter,
  setSedeFilter,
  clearFilters,
  handleRemoveFilter,
  getFilterPillClasses
}) {
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
          {activeFiltersCount > 0 && (
            <span className="hidden md:inline text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {activeFiltersCount} filtro
              {activeFiltersCount > 1 ? "s" : ""} activo
              {activeFiltersCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && !showFilters && (
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600">
              <span className="truncate max-w-[140px] sm:max-w-xs">
                {filteredBotsCount} de {botsCount} asesores
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-[11px] sm:text-xs"
              >
                <Trash2 className="h-3 w-3" />
                Limpiar
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {activeFilterPills.length > 0 && (
        <div className="px-6 py-2 border-b border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-600">
          {activeFilterPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => handleRemoveFilter(pill.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${getFilterPillClasses(pill.key)}`}
            >
              <span>{pill.label}</span>
              <span className="text-xs">×</span>
            </button>
          ))}
        </div>
      )}
      <div className={`px-6 py-4 ${showFilters ? "block" : "hidden"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro de estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Filtro de líder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Líder
            </label>
            <select
              value={leaderFilter}
              onChange={(e) => setLeaderFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {LEADERS.map((leader) => (
                <option key={leader.value} value={leader.value}>
                  {leader.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de lead */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead
            </label>
            <select
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {LEADS.map((lead) => (
                <option key={lead.value} value={lead.value}>
                  {lead.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de sede */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sede
            </label>
            <select
              value={sedeFilter}
              onChange={(e) => setSedeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {SEDES.map((sede) => (
                <option key={sede.value} value={sede.value}>
                  {sede.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón para limpiar filtros y contador */}
        <div className="mt-4 flex items-center justify-between">
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredBotsCount} de {botsCount} asesores
                {activeFiltersCount > 0 &&
                  ` (${activeFiltersCount} filtro${
                    activeFiltersCount > 1 ? "s" : ""
                  } activo${activeFiltersCount > 1 ? "s" : ""})`}
              </span>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
