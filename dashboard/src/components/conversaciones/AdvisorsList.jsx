// dashboard/src/components/conversaciones/AdvisorsList.jsx
'use client'

import { Bot, Search, X, Circle, Phone } from 'lucide-react'
import { parseBotSessionName } from '@/lib/botNameParser'

export default function AdvisorsList({
  filteredBots,
  selectedBotId,
  botSearchQuery,
  setBotSearchQuery,
  isBotActive,
  formatBotStatus,
  onBotSelect
}) {
  return (
    <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-1">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              <span>Asesores</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona un asesor para ver sus conversaciones.
            </p>
          </div>
          {filteredBots.length > 0 && (
            <span className="text-xs text-gray-500">
              {filteredBots.length} visibles
            </span>
          )}
        </div>
        
        {/* Buscador de asesores */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={botSearchQuery}
            onChange={(e) => setBotSearchQuery(e.target.value)}
            placeholder="Buscar asesor..."
            className="w-full pl-10 pr-10 py-2 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {botSearchQuery && (
            <button
              onClick={() => setBotSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {filteredBots.length === 0 ? (
        <div className="flex-1 px-6 py-12 text-center flex flex-col items-center justify-center">
          <Bot className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            No se encontraron asesores
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajusta los filtros para ver otros resultados.
          </p>
        </div>
      ) : (
        <div className="flex-1 max-h-[50vh] lg:max-h-[650px] overflow-y-auto divide-y divide-gray-100">
          {filteredBots.map((bot) => {
            const botIsActive = isBotActive(bot);
            const formattedStatus = formatBotStatus(bot);
            const isSelected = bot.id && selectedBotId && String(bot.id) === String(selectedBotId);
            const meta = parseBotSessionName(bot.session_name);

            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => onBotSelect(bot.id)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-l-4 ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-500"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        botIsActive ? "bg-green-100" : "bg-gray-200"
                      }`}
                    >
                      <Bot
                        className={`h-5 w-5 ${
                          botIsActive ? "text-green-600" : "text-gray-600"
                        }`}
                      />
                    </div>
                    {botIsActive && (
                      <Circle
                        className="absolute -top-0.5 -right-0.5 h-3 w-3 text-green-500 fill-current"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate" translate="no">
                      {meta.fullName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                          botIsActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        <span translate="no">{formattedStatus}</span>
                      </span>
                      {meta.sedeLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span translate="no">{meta.sedeLabel}</span>
                        </span>
                      )}
                      {meta.leadLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <span translate="no">{meta.leadLabel}</span>
                        </span>
                      )}
                      {meta.leaderLabel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <span translate="no">{meta.leaderLabel}</span>
                        </span>
                      )}
                      {bot.phone_number && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">
                            <span translate="no">{bot.phone_number}</span>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  )
}
