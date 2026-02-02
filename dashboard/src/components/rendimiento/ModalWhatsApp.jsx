'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, User } from 'lucide-react'
import ChatView from '@/components/ChatView'
import PanelAjustesAnalisis from './PanelAjustesAnalisis'

const formatContactName = (conv) => {
  const name = conv.contact_name || conv.contact_phone || conv.contact_number || 'Sin nombre'
  if (/^\d{15,}$/.test(name)) {
    return 'Grupo'
  }
  return name
}

export default function ModalWhatsApp({
  isOpen,
  onClose,
  conversaciones = [],
  evaluaciones = {},
  onEvaluacionChange,
  initialChatId = null
}) {
  const [activeChatId, setActiveChatId] = useState(initialChatId)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (initialChatId) {
      setActiveChatId(initialChatId)
    }
  }, [initialChatId])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const activeConversacion = conversaciones.find(c => c.id === activeChatId)
  const activeEvaluacion = activeChatId ? evaluaciones[activeChatId] : null

  const handleMessagesLoaded = (loadedMessages) => {
    setMessages(loadedMessages)
  }

  const limitedConversaciones = conversaciones.slice(0, 20)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[96vw] max-h-[96vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Revisión de Conversaciones
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {limitedConversaciones.length} conversaciones disponibles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          <div className="grid grid-cols-12 h-full overflow-hidden">
            <div className="col-span-3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 bg-white">
                <h3 className="text-sm font-semibold text-gray-900">
                  Conversaciones Recientes
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {limitedConversaciones.map((conv) => {
                  const evaluacion = evaluaciones[conv.id]
                  const isActive = activeChatId === conv.id

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveChatId(conv.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${isActive ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {formatContactName(conv)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {conv.contact_phone || conv.contact_number}
                          </p>
                          {conv.last_message_preview && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {conv.last_message_preview}
                            </p>
                          )}
                        </div>
                        {evaluacion && (
                          <div className="flex-shrink-0">
                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${evaluacion.percentage >= 75
                              ? 'bg-green-100 text-green-700'
                              : evaluacion.percentage >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                              {evaluacion.score}/7
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="col-span-6 bg-white flex flex-col overflow-hidden">
              {activeChatId ? (
                <div className="h-full overflow-hidden">
                  <ChatView
                    chatId={activeChatId}
                    onClose={() => { }}
                    onMessagesLoaded={handleMessagesLoaded}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-16 w-16 text-gray-300" />
                    <p className="mt-4 text-sm text-gray-500">
                      Selecciona una conversación para verla
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-3 border-l border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
              <PanelAjustesAnalisis
                chatId={activeChatId}
                evaluacion={activeEvaluacion}
                contactName={activeConversacion?.contact_name || activeConversacion?.contact_phone}
                onEvaluacionChange={onEvaluacionChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
