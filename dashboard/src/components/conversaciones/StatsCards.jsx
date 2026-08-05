// dashboard/src/components/conversaciones/StatsCards.jsx
'use client'

import { Bot, MessageSquare, ArrowUp, RefreshCw } from 'lucide-react'

export default function StatsCards({
  salesCount,
  loadingSales,
  botsCount,
  filteredBotsCount,
  activeFiltersCount,
  totalConversations,
  activeBotsCount,
  compactMode,
  onSalesClick,
  wahaStatus,
  loadingWahaStatus
}) {
  if (compactMode) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      {/* Ventas Concretadas */}
      <button
        type="button"
        onClick={onSalesClick}
        className="bg-white rounded-lg shadow p-6 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <ArrowUp className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Ventas Concretadas
              </dt>
              <dd className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
                {loadingSales ? (
                  <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
                ) : (
                  <span translate="no">{salesCount}</span>
                )}
              </dd>
              <dd className="text-xs text-green-600 mt-1">
                Click para ver detalles
              </dd>
            </dl>
          </div>
        </div>
      </button>

      {/* Total Bots */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Bots
              </dt>
              <dd className="text-3xl font-semibold text-gray-900" translate="no">
                {botsCount}
              </dd>
              {activeFiltersCount > 0 && (
                <dd className="text-xs text-indigo-600 mt-1">
                  {filteredBotsCount} mostrados
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Total Conversaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Conversaciones
              </dt>
              <dd className="text-3xl font-semibold text-gray-900" translate="no">
                {totalConversations}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Bots Activos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Bots Activos
              </dt>
              <dd className="text-3xl font-semibold text-gray-900" translate="no">
                {activeBotsCount}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* WAHA Server Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${wahaStatus?.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <RefreshCw className={`h-6 w-6 text-white ${loadingWahaStatus ? 'animate-spin' : ''}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Servidor WAHA
              </dt>
              <dd className="text-sm font-semibold text-gray-900 mt-1 truncate" title={wahaStatus?.version || 'Desconocida'}>
                {loadingWahaStatus ? 'Cargando...' : (wahaStatus?.version || 'Desconectado')}
              </dd>
              <dd className="text-xs text-gray-500 mt-1 truncate">
                {wahaStatus?.engine ? `Engine: ${wahaStatus.engine}` : 'Sin conexión'}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
