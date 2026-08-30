'use client'

import { useState } from 'react'
import { MessageSquare, Phone, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RefreshCw, Sparkles, X, Download, FileText, Loader2 } from 'lucide-react'
import ContactAvatar from '@/components/ContactAvatar'
import { parseBotSessionName } from '@/lib/botNameParser'
import GlobalSearchBar from '@/components/conversaciones/GlobalSearchBar'
import { getAllMessagesForChat, getAllChatsAndMessagesForBot } from '@/lib/supabase'
import {
  exportSingleChatPdf,
  exportSingleChatTxt,
  exportAdvisorChatsPdf,
  exportAdvisorChatsTxt
} from '@/lib/conversaciones/exportChatPdf'

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
  const [downloadingAdvisor, setDownloadingAdvisor] = useState(false)
  const [downloadingChatId, setDownloadingChatId] = useState(null)

  const handleDownloadAdvisorChats = async (format = 'pdf') => {
    if (!selectedBot?.id || downloadingAdvisor) return
    try {
      setDownloadingAdvisor(true)
      const chatsWithMsgs = await getAllChatsAndMessagesForBot(selectedBot.id, 50)
      if (!chatsWithMsgs || chatsWithMsgs.length === 0) {
        alert('No se encontraron conversaciones con mensajes para este asesor.')
        return
      }
      if (format === 'txt') {
        exportAdvisorChatsTxt(selectedBot, chatsWithMsgs)
      } else {
        exportAdvisorChatsPdf(selectedBot, chatsWithMsgs)
      }
    } catch (err) {
      console.error('Error al descargar chats del asesor:', err)
      alert('Ocurrió un error al descargar las conversaciones.')
    } finally {
      setDownloadingAdvisor(false)
    }
  }

  const handleDownloadSingleChat = async (conv, format = 'pdf', e) => {
    if (e) e.stopPropagation()
    if (!conv?.id || downloadingChatId) return

    try {
      setDownloadingChatId(conv.id)
      const messages = await getAllMessagesForChat(conv.id)
      if (format === 'txt') {
        exportSingleChatTxt(conv, messages, selectedBot?.session_name)
      } else {
        exportSingleChatPdf(conv, messages, selectedBot?.session_name)
      }
    } catch (err) {
      console.error('Error descargando conversación:', err)
      alert('Ocurrió un error al descargar la conversación.')
    } finally {
      setDownloadingChatId(null)
    }
  }

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
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        <div className="flex flex-col sm:items-end gap-2.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Estado: </span>
            <span translate="no">{formatBotStatus(selectedBot)}</span>
            {selectedBot.phone_number && (
              <span className="flex items-center gap-1 ml-2">
                <Phone className="h-3 w-3" />
                <span translate="no">{selectedBot.phone_number}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadAdvisorChats('pdf')}
              disabled={downloadingAdvisor}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors disabled:opacity-50"
              title="Descargar compilado de todos los chats de este asesor en PDF"
            >
              {downloadingAdvisor ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Descargar chats</span>
            </button>
            <button
              onClick={onGenerateReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar reporte
            </button>
          </div>
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
                      : conv.unread_count > 0
                      ? "bg-emerald-50/40 hover:bg-emerald-50"
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
                      <p
                        className={`text-sm truncate ${
                          conv.unread_count > 0
                            ? "font-bold text-gray-900"
                            : "font-medium text-gray-900"
                        }`}
                      >
                        {conv.contact_name || "Sin nombre"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {conv.contact_phone || conv.remote_jid}
                        </span>
                        {conv.last_message_preview && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span
                              className={`truncate max-w-[180px] sm:max-w-[260px] ${
                                conv.unread_count > 0
                                  ? "text-gray-900 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              {conv.last_message_preview}
                            </span>
                          </>
                        )}
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
                              ? "Venta Concretada"
                              : "Venta No Concretada"
                          }
                        >
                          {conv.ai_analysis.sale_completed ? (
                            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shadow-sm border border-emerald-200/50 transition-transform hover:scale-105">
                              <Sparkles className="h-3 w-3 text-emerald-500" />
                              <span className="font-bold text-[10px] uppercase tracking-wider">
                                Venta Exitosa
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full shadow-sm border border-rose-200/50 transition-transform hover:scale-105">
                              <X className="h-3 w-3 text-rose-500" />
                              <span className="font-bold text-[10px] uppercase tracking-wider">
                                Sin Venta
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {conv.last_message_time && (
                      <span
                        className={`mt-0.5 ${
                          conv.unread_count > 0
                            ? "font-semibold text-emerald-600"
                            : ""
                        }`}
                      >
                        {new Date(
                          conv.last_message_time,
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadSingleChat(conv, 'pdf', e)}
                        disabled={downloadingChatId === conv.id}
                        className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-gray-200/80 transition-colors"
                        title="Descargar esta conversación en PDF"
                      >
                        {downloadingChatId === conv.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {conv.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-500 text-white font-bold text-[11px] shadow-sm">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
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
