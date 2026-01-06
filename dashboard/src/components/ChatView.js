'use client'

import { useState, useEffect, useRef } from 'react'
import { getPaginatedMessages, supabase } from '@/lib/supabase'
import VirtualizedMessageList from './VirtualizedMessageList'
import ContactAvatar from './ContactAvatar'
import messageService from '@/services/messageService'

export default function ChatView({ chatId, onClose, onMessagesLoaded }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [oldestTimestamp, setOldestTimestamp] = useState(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0) // Total de mensajes en el chat (desde main)
  const inputRef = useRef(null)
  const scrollToBottomRef = useRef(null)

  // OPTIMIZADO: Cargar solo los últimos 50 mensajes inicialmente
  const loadConversation = async () => {
    setLoading(true)
    try {
      // Cargar info del chat
      const { data: chatData } = await supabase
        .from('chats')
        .select('*, bot:bots(*), contact:contacts(*)')
        .eq('id', chatId)
        .single()

      if (chatData) {
        setConversation(chatData)
      }

      // Cargar últimos 20 mensajes
      const result = await getPaginatedMessages(chatId, 20)
      if (result) {
        setMessages(result.messages)
        setHasMore(result.hasMore)
        setTotalMessages(result.totalMessages || 0)
        
        // Notificar al parent sobre los mensajes cargados
        if (onMessagesLoaded) {
          onMessagesLoaded(result.messages)
        }
        
        // Guardar timestamp del mensaje más antiguo cargado
        if (result.messages.length > 0) {
          setOldestTimestamp(result.messages[0].timestamp)
        }
      }
    } catch (error) {
      console.error('Error al cargar conversación:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar más mensajes antiguos (scroll hacia arriba)
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      // Cargar 20 mensajes anteriores al más antiguo actual (mismo tamaño que carga inicial)
      const result = await getPaginatedMessages(chatId, 20, oldestTimestamp)
      
      if (result && result.messages.length > 0) {
        // Agregar mensajes antiguos al inicio - React Virtuoso manejará el scroll
        setMessages(prevMessages => [...result.messages, ...prevMessages])
        setOldestTimestamp(result.messages[0].timestamp)
        setHasMore(result.hasMore)
        
        // Notificar al parent con los mensajes actualizados
        if (onMessagesLoaded) {
          onMessagesLoaded([...result.messages, ...messages])
        }
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error al cargar más mensajes:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Recargar mensaje completo con media_files desde la BD
  const refreshMessageWithMedia = async (messageId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          body,
          content,
          type,
          from_me,
          timestamp,
          has_media,
          media_url,
          media_mimetype,
          metadata,
          media_files(*)
        `)
        .eq('id', messageId)
        .single()
      
      if (data && !error) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? data : msg
        ))
      } else if (error) {
        console.error('❌ Error recargando mensaje:', error.message)
      }
    } catch (error) {
      console.error('❌ Error en refreshMessageWithMedia:', error)
    }
  }

  const handleMessageChange = async (payload) => {
    const { eventType, new: newMessage, old: oldMessage } = payload

    if (eventType === 'INSERT' && newMessage) {
      // Verificar que el mensaje no exista ya (evitar duplicados)
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === newMessage.id)
        if (exists) {
          return prev
        }
        return [...prev, newMessage]
      })
      
      // Scroll al final cuando llega un mensaje nuevo
      setTimeout(() => {
        scrollToBottomRef.current?.()
      }, 100)
    } else if (eventType === 'UPDATE' && newMessage) {
      // Si el mensaje tiene multimedia, recargarlo con media_files
      if (newMessage.has_media) {
        await refreshMessageWithMedia(newMessage.id)
      } else {
        // Si no tiene multimedia, actualizar directamente
        setMessages(prev => {
          const index = prev.findIndex(msg => msg.id === newMessage.id)
          if (index === -1) {
            return prev
          }
          const updated = [...prev]
          updated[index] = newMessage
          return updated
        })
      }
    } else if (eventType === 'DELETE' && oldMessage) {
      // Eliminar solo el mensaje específico sin recargar todo
      setMessages(prev => prev.filter(msg => msg.id !== oldMessage.id))
    }
  }


  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!messageText.trim() || !conversation) return

    const session = conversation.bot?.session_name
    const chatIdWhatsApp = conversation.chat_id

    if (!session || !chatIdWhatsApp) {
      console.error('❌ Falta información del bot o chat')
      return
    }

    setIsSending(true)
    const textToSend = messageText.trim()
    setMessageText('') // Limpiar input inmediatamente
    // Resetear altura del textarea al tamaño base (útil en mobile cuando el mensaje fue muy largo)
    if (inputRef.current) {
      inputRef.current.style.height = '44px'
    }

    try {
      await messageService.sendTextMessage(session, chatIdWhatsApp, textToSend)
      
      // El mensaje aparecerá automáticamente gracias a Supabase realtime
      // cuando el webhook procese la respuesta
      
      // Scroll al final después de enviar
      setTimeout(() => {
        scrollToBottomRef.current?.()
      }, 100)
      
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error)
      // Restaurar el texto si hubo error
      setMessageText(textToSend)
      
      // Mostrar notificación de error al usuario
      alert('Error al enviar el mensaje. Por favor intenta de nuevo.')
    } finally {
      setIsSending(false)
      // Enfocar el input nuevamente
      inputRef.current?.focus()
    }
  }

  useEffect(() => {
    loadConversation()

    // Suscribirse a cambios en mensajes de este chat
    const messagesChannel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          handleMessageChange(payload)
        }
      )
      .subscribe()

    // Suscripción ADICIONAL a media_files como respaldo
    // Esto captura cuando se inserta un archivo multimedia
    const mediaChannel = supabase
      .channel(`chat-media-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_files'
        },
        async (payload) => {
          // Verificar que el mensaje pertenece a este chat
          const messageId = payload.new?.message_id
          if (messageId) {
            // Recargar el mensaje con los media_files
            await refreshMessageWithMedia(messageId)
          }
        }
      )
      .subscribe()

    // Cleanup: desuscribirse al desmontar
    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(mediaChannel)
    }
  }, [chatId])

  // VirtualizedMessageList maneja el scroll automáticamente

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">No se pudo cargar la conversación</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const contactName = conversation.contact?.name || conversation.chat_id || 'Contacto'
  const contactPhone = conversation.contact?.phone_number || conversation.chat_id
  const profilePictureUrl = conversation.contact?.profile_picture_url || null

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-6 py-3 sm:py-4 shadow-md">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Botón volver + Avatar + Info */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors flex-shrink-0"
              title="Volver al dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="border-2 border-white/30 rounded-full flex-shrink-0">
                <ContactAvatar 
                  profilePictureUrl={profilePictureUrl}
                  contactName={contactName}
                  size="md"
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                  {contactName}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 truncate">
                  {contactPhone}
                </p>
              </div>
            </div>
          </div>
          
          {/* Badge de mensajes + estado de carga */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Badge de mensajes */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold text-white">
                {messages.length}
                {totalMessages ? ` / ${totalMessages}` : ''}
              </span>
              {/* Solo mostramos "+más" si seguimos usando hasMore */}
              {hasMore && !totalMessages && (
                <span className="text-[10px] sm:text-xs text-blue-200">+más</span>
              )}
            </div>

            {/* Estado de carga: parcial/completo usando totalMessages del branch main */}
            {totalMessages > 0 && totalMessages !== messages.length && (
              <div className="text-[10px] sm:text-xs text-yellow-100 bg-yellow-600/60 px-2 py-0.5 rounded">
                ⚠️ Parcial
              </div>
            )}
            {totalMessages > 0 && totalMessages === messages.length && (
              <div className="text-[10px] sm:text-xs text-emerald-100 bg-emerald-600/60 px-2 py-0.5 rounded">
                ✅ Completo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages - Scroll nativo optimizado */}
      <div className="flex-1 relative">
        <VirtualizedMessageList
          messages={messages}
          contactName={contactName}
          hasMore={hasMore}
          loadMore={loadMoreMessages}
          isLoadingMore={loadingMore}
          onScrollToBottom={(fn) => { scrollToBottomRef.current = fn }}
        />
      </div>


      {/* Footer con input */}
      <div className="bg-white border-t border-gray-200">
        {/* Info del bot (más compacta) */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span className="font-medium text-gray-900">{conversation?.bot?.session_name || 'N/A'}</span>
            </div>
            {conversation.last_message_time && (
              <span className="text-gray-500">
                {new Date(conversation.last_message_time).toLocaleString('es-ES', { 
                  day: '2-digit', 
                  month: 'short',
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
        </div>

        {/* Input de mensaje */}
        <form onSubmit={handleSendMessage} className="px-4 py-3">
          <div className="max-w-4xl mx-auto flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                placeholder="Escribe un mensaje..."
                className="w-full px-4 py-3 pr-12 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
              {isSending && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 max-w-4xl mx-auto">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </p>
        </form>
      </div>
    </div>
  )
}
