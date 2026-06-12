// dashboard/src/components/conversaciones/ConversationsList.jsx
'use client'

import { MessageSquare, Phone, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import ContactAvatar from '@/components/ContactAvatar'
import { parseBotSessionName } from '@/lib/botNameParser'
import GlobalSearchBar from '@/components/conversaciones/GlobalSearchBar'

export default function ConversationsList({
  selectedBot,
  selectedBotConversations,
  selectedBotPagination,
  loadingConversations,
  selectedBotId,
  lastChatId,
  onConversationClick,
  onPageChange,
  onGenerateReport,
  globalSearchQuery,
  onSearchChange,
  onClearSearch,
  loadingGlobalSearch,
  isGlobalSearchActive,
  globalSearchResults,
  onResultClick,
  formatBotStatus
}) {
  if (!selectedBot) {
    return (
      <div className="h-full flex items-center justify-center text-center px-6 py-12">
        <div>
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            No hay asesor seleccionado
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md">
            Usa la lista de la izquierda para elegir un asesor y ver
            el detalle de sus conversaciones.
          </p>
        </div>
      </div>
    )
  }

  const meta = parseBotSessionName(selectedBot.session_name)

  return (
    <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-2">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            <span>Conversaciones de </span>
            <span translate="no">{meta.fullName}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {selectedBotPagination.total > 0 ? (
              <span translate="no">{selectedBotPagination.total}</span>
            ) : (
              <span translate="no">{selectedBot.conversation_count || 0}</span>
            )}
            <span> conversaciones totales</span>
            {selectedBotPagination.totalPages > 1 && (
              <>
                <span> • Mostrando página </span>
                <span translate="no">{selectedBotPagination.currentPage}</span>
                <span> de </span>
                <span translate="no">{selectedBotPagination.totalPages}</span>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-600">
            {meta.sedeLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span>Sede: </span>
                <span translate="no">{meta.sedeLabel}</span>
              </span>
            )}
            {meta.leadLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span>Lead: </span>
                <span translate="no">{meta.leadLabel}</span>
              </span>
            )}
            {meta.leaderLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                <span>Líder: </span>
                <span translate="no">{meta.leaderLabel}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end text-xs text-gray-500">
            <span>Estado: </span>
            <span translate="no">{formatBotStatus(selectedBot)}</span>
            {selectedBot.phone_number && (
              <span className="flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                <span translate="no">{selectedBot.phone_number}</span>
              </span>
            )}
          </div>
          <button
            onClick={onGenerateReport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow"
          >
            Generar reporte
          </button>
        </div>
      </div>

      {/* Buscador Global */}
      <GlobalSearchBar
        globalSearchQuery={globalSearchQuery}
        onSearchChange={onSearchChange}
        onClearSearch={onClearSearch}
        loadingGlobalSearch={loadingGlobalSearch}
        isGlobalSearchActive={isGlobalSearchActive}
        globalSearchResults={globalSearchResults}
        lastChatId={lastChatId}
        onResultClick={onResultClick}
      />

      <div className="flex-1">
        {(loadingConversations[selectedBotId] ?? false) ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando conversaciones...
          </div>
        ) : selectedBotConversations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-6 py-12">
            <div>
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
              <h3 className="mt-3 text-sm font-medium text-gray-900">
                No hay conversaciones para este asesor
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md">
                Las conversaciones aparecerán aquí cuando el bot reciba
                mensajes de clientes.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[50vh] lg:max-h-[450px] overflow-y-auto divide-y divide-gray-200">
              {selectedBotConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onConversationClick(selectedBot.id, conv.id)}
                  className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                    lastChatId === String(conv.id)
                      ? "bg-indigo-50 hover:bg-indigo-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-4">
                    <ContactAvatar
                      profilePictureUrl={conv.contact_profile_picture_url}
                      contactName={conv.contact_name || "Sin nombre"}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.contact_name || "Sin nombre"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">
                          {conv.contact_phone || conv.remote_jid}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500 gap-1">
                    {conv.ai_analysis &&
                      conv.ai_analysis.sale_completed !== undefined && (
                        <div
                          className="mb-1"
                          title={
                            conv.ai_analysis.sale_completed
                              ? "Venta Probable"
                              : "Venta Improbable"
                          }
                        >
                          {conv.ai_analysis.sale_completed ? (
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              <ArrowUp className="h-3 w-3" />
                              <span className="font-bold text-xs">
                                Venta
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              <ArrowDown className="h-3 w-3" />
                              <span className="font-bold text-xs">
                                No Venta
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {conv.last_message_time && (
                      <span className="mt-0.5">
                        {new Date(
                          conv.last_message_time,
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Controles de paginación */}
            {selectedBotPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Página {selectedBotPagination.currentPage} de{" "}
                    {selectedBotPagination.totalPages}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({selectedBotPagination.total} conversaciones totales)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onPageChange(
                        selectedBotId,
                        selectedBotPagination.currentPage - 1,
                      )
                    }
                    disabled={
                      selectedBotPagination.currentPage === 1 ||
                      (loadingConversations[selectedBotId] ?? false)
                    }
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedBotPagination.currentPage === 1 ||
                      (loadingConversations[selectedBotId] ?? false)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      onPageChange(
                        selectedBotId,
                        selectedBotPagination.currentPage + 1,
                      )
                    }
                    disabled={
                      selectedBotPagination.currentPage ===
                        selectedBotPagination.totalPages ||
                      (loadingConversations[selectedBotId] ?? false)
                    }
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedBotPagination.currentPage ===
                        selectedBotPagination.totalPages ||
                      (loadingConversations[selectedBotId] ?? false)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
