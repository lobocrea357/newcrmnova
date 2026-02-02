'use client'

import { Bot, Search, Sparkles, FileText } from 'lucide-react'
import { parseBotSessionName } from '@/lib/botNameParser'

export default function HeroOnboarding({
  bots = [],
  selectedBotId,
  onBotSelect,
  onLoadConversations,
  loading = false
}) {

  const selectedBot = bots.find(b => b.id === selectedBotId)
  const meta = selectedBot ? parseBotSessionName(selectedBot.session_name) : null

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          🎯 Evalúa el Rendimiento de tus Asesores
        </h1>
        <p className="text-indigo-100 mt-2 text-lg">
          Analiza conversaciones con IA o manualmente y genera reportes ejecutivos
        </p>
      </div>

      {/* Steps Section */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Step 1 */}
          <div className={`relative p-6 rounded-xl border-2 transition-all ${selectedBotId
            ? 'border-green-300 bg-green-50'
            : 'border-indigo-300 bg-white shadow-md'
            }`}>
            <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg ${selectedBotId
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 text-white'
              }`}>
              {selectedBotId ? '✓' : '①'}
            </div>
            <Bot className={`h-8 w-8 mb-3 ${selectedBotId ? 'text-green-600' : 'text-indigo-600'}`} />
            <h3 className="font-semibold text-gray-900 mb-1">
              Selecciona un Asesor
            </h3>
            <p className="text-xs text-gray-600">
              Elige al asesor que deseas evaluar
            </p>
          </div>

          {/* Step 2 */}
          <div className={`relative p-6 rounded-xl border-2 transition-all ${selectedBotId
            ? 'border-indigo-300 bg-white shadow-md'
            : 'border-gray-200 bg-gray-50'
            }`}>
            <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg ${selectedBotId
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-300 text-gray-500'
              }`}>
              ②
            </div>
            <Search className={`h-8 w-8 mb-3 ${selectedBotId ? 'text-indigo-600' : 'text-gray-400'}`} />
            <h3 className={`font-semibold mb-1 ${selectedBotId ? 'text-gray-900' : 'text-gray-500'}`}>
              Carga Conversaciones
            </h3>
            <p className={`text-xs ${selectedBotId ? 'text-gray-600' : 'text-gray-400'}`}>
              Se cargarán las últimas 25 conversaciones
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-xl border-2 border-gray-200 bg-gray-50">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              ③
            </div>
            <Sparkles className="h-8 w-8 text-gray-400 mb-3" />
            <h3 className="font-semibold text-gray-500 mb-1">
              Analiza & Evalúa
            </h3>
            <p className="text-xs text-gray-400">
              Usa IA o evalúa manualmente
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 rounded-xl border-2 border-gray-200 bg-gray-50">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              ④
            </div>
            <FileText className="h-8 w-8 text-gray-400 mb-3" />
            <h3 className="font-semibold text-gray-500 mb-1">
              Genera Reporte
            </h3>
            <p className="text-xs text-gray-400">
              Exporta resultados en PDF
            </p>
          </div>
        </div>

        {/* Selector Section */}
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Paso 1: Selecciona un Asesor
              </h3>
              <p className="text-sm text-gray-500">
                Elige al asesor que deseas evaluar de la lista
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asesor
              </label>
              <div className="relative">
                <Bot className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedBotId || ''}
                  onChange={(e) => onBotSelect(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-base"
                >
                  <option value="">Seleccione un asesor...</option>
                  {bots.map(bot => {
                    const botMeta = parseBotSessionName(bot.session_name)
                    return (
                      <option key={bot.id} value={bot.id}>
                        {botMeta.fullName} ({bot.conversation_count || 0} conversaciones)
                      </option>
                    )
                  })}
                </select>
              </div>

              {selectedBot && meta && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {meta.sedeKey && (
                    <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 font-medium">
                      📍 {meta.sedeKey}
                    </span>
                  )}
                  {meta.leadKey && (
                    <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 font-medium">
                      🎯 {meta.leadKey}
                    </span>
                  )}
                  {meta.leaderKey && (
                    <span className="text-xs px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200 font-medium">
                      👤 {meta.leaderKey}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm">
                {selectedBotId ? (
                  <span className="text-green-600 font-medium flex items-center gap-2">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                    Asesor seleccionado • Listo para continuar
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium flex items-center gap-2">
                    <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
                    Selecciona un asesor para continuar
                  </span>
                )}
              </div>
              <button
                onClick={onLoadConversations}
                disabled={!selectedBotId || loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Cargando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Cargar Últimas 25 Conversaciones
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-900 flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>
              <strong>¿Cómo funciona?</strong> Selecciona un asesor, carga sus conversaciones más recientes,
              y luego podrás analizarlas con IA automática o evaluarlas manualmente.
              Finalmente genera un reporte ejecutivo en PDF con todos los resultados.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
