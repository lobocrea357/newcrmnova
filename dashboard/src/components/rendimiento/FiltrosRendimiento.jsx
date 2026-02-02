'use client'

import { useState } from 'react'
import { Bot, Search, Filter } from 'lucide-react'
import { parseBotSessionName } from '@/lib/botNameParser'

export default function FiltrosRendimiento({
  bots = [],
  selectedBotId,
  onBotSelect,
  onLoadConversations,
  loading = false
}) {
  const selectedBot = bots.find(b => b.id === selectedBotId)
  const meta = selectedBot ? parseBotSessionName(selectedBot.session_name) : null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Filtros de Evaluación</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Asesor
          </label>
          <div className="relative">
            <Bot className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedBotId || ''}
              onChange={(e) => onBotSelect(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">Seleccione un asesor...</option>
              {bots.map(bot => {
                const botMeta = parseBotSessionName(bot.session_name)
                return (
                  <option key={bot.id} value={bot.id}>
                    {botMeta.fullName} ({bot.conversation_count || 0} chats)
                  </option>
                )
              })}
            </select>
          </div>
          {selectedBot && meta && (
            <div className="flex flex-wrap gap-2 mt-2">
              {meta.sedeKey && (
                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {meta.sedeKey}
                </span>
              )}
              {meta.leadKey && (
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                  {meta.leadKey}
                </span>
              )}
              {meta.leaderKey && (
                <span className="text-xs px-2 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
                  {meta.leaderKey}
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Se cargarán las últimas 25 conversaciones del asesor seleccionado
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedBotId ? (
            <span>✅ Asesor seleccionado correctamente</span>
          ) : (
            <span className="text-amber-600">⚠️ Selecciona un asesor para continuar</span>
          )}
        </div>
        <button
          onClick={onLoadConversations}
          disabled={!selectedBotId || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  )
}