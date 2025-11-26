'use client'

import { useState, useEffect, useRef } from 'react'
import { getConversationWithMessages, supabase } from '@/lib/supabase'
import MessageBubble from './MessageBubble'
import ContactAvatar from './ContactAvatar'

export default function ChatView({ chatId, onClose }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [oldestTimestamp, setOldestTimestamp] = useState(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const previousScrollHeightRef = useRef(0)
  const isInitialLoadRef = useRef(true)
  const lastMessageCountRef = useRef(0)

  // Cargar conversación inicial (últimos 50 mensajes)
  const loadConversation = async () => {
    setLoading(true)
    try {
      const result = await getConversationWithMessages(chatId, 50)
      if (result) {
        console.log('📊 Mensajes cargados:', result.messages.length, 'hasMore:', result.hasMore)
        setConversation(result.conversation)
        setMessages(result.messages)
        setHasMore(result.hasMore)
        setOldestTimestamp(result.oldestTimestamp)
      }
    } catch (error) {
      console.error('Error al cargar conversación:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar más mensajes antiguos
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !oldestTimestamp) return

    setLoadingMore(true)
    try {
      // Guardar altura actual del scroll antes de cargar
      if (messagesContainerRef.current) {
        previousScrollHeightRef.current = messagesContainerRef.current.scrollHeight
      }

      const result = await getConversationWithMessages(chatId, 50, oldestTimestamp)
      if (result && result.messages.length > 0) {
        // Agregar mensajes antiguos al inicio
        setMessages(prev => [...result.messages, ...prev])
        setHasMore(result.hasMore)
        setOldestTimestamp(result.oldestTimestamp)
      }
    } catch (error) {
      console.error('Error al cargar más mensajes:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleMessageChange = async (payload) => {
    const { eventType, new: newMessage, old: oldMessage } = payload

    if (eventType === 'INSERT' && newMessage) {
      console.log('✨ Nuevo mensaje detectado, agregando al final')
      // Verificar que el mensaje no exista ya (evitar duplicados)
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === newMessage.id)
        if (exists) {
          console.log('⚠️ Mensaje ya existe, ignorando INSERT')
          return prev
        }
        console.log('📝 Mensajes antes:', prev.length, '→ después:', prev.length + 1)
        return [...prev, newMessage]
      })
    } else if (eventType === 'UPDATE' && newMessage) {
      console.log('🔄 Mensaje actualizado, actualizando en el estado sin recargar')
      // Actualizar solo el mensaje específico sin recargar todo
      setMessages(prev => {
        const index = prev.findIndex(msg => msg.id === newMessage.id)
        if (index === -1) {
          console.log('⚠️ Mensaje actualizado no encontrado en el estado, ignorando')
          return prev
        }
        const updated = [...prev]
        updated[index] = newMessage
        console.log('✅ Mensaje actualizado en posición:', index)
        return updated
      })
    } else if (eventType === 'DELETE' && oldMessage) {
      console.log('🗑️ Mensaje eliminado, removiendo del estado sin recargar')
      // Eliminar solo el mensaje específico sin recargar todo
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== oldMessage.id)
        console.log('📝 Mensajes antes:', prev.length, '→ después:', filtered.length)
        return filtered
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadConversation()
    
    // Suscribirse a cambios en mensajes de este chat
    console.log('🔔 Suscribiéndose a mensajes del chat:', chatId)
    
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('📨 Cambio detectado en mensajes:', payload)
          handleMessageChange(payload)
        }
      )
      .subscribe()

    // Cleanup: desuscribirse al desmontar
    return () => {
      console.log('🔕 Desuscribiéndose del chat:', chatId)
      supabase.removeChannel(channel)
    }
  }, [chatId])

  // Manejar scroll: detectar cuando llega arriba para cargar más y mostrar botón
  const handleScroll = () => {
    if (!messagesContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    
    // Si está cerca del top (50px), cargar más mensajes
    if (scrollTop < 50 && !loadingMore && hasMore) {
      loadMoreMessages()
    }

    // Mostrar botón de scroll si no está cerca del final
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
    setShowScrollButton(!isNearBottom)
    
    // Resetear contador de no leídos si está en el final
    if (isNearBottom) {
      setUnreadCount(0)
      lastMessageCountRef.current = messages.length
    }
  }

  // Mantener posición del scroll después de cargar mensajes antiguos
  useEffect(() => {
    if (!loadingMore && messagesContainerRef.current && previousScrollHeightRef.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight
      const scrollDiff = newScrollHeight - previousScrollHeightRef.current
      messagesContainerRef.current.scrollTop = scrollDiff
      previousScrollHeightRef.current = 0
    }
  }, [loadingMore, messages])

  // Scroll al final solo en la carga inicial o cuando llega un nuevo mensaje
  useEffect(() => {
    if (messages.length === 0) return

    // Scroll automático solo en carga inicial
    if (isInitialLoadRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          lastMessageCountRef.current = messages.length
        }
        isInitialLoadRef.current = false
      }, 100)
      return
    }

    // Para nuevos mensajes, hacer scroll solo si el usuario ya está cerca del final
    // Esto permite que el usuario pueda leer mensajes antiguos sin interrupciones
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
      
      if (isNearBottom) {
        // Usuario está cerca del final, hacer scroll automático
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        }, 50)
        setUnreadCount(0)
        lastMessageCountRef.current = messages.length
      } else {
        // Usuario está leyendo mensajes antiguos, incrementar contador
        const newMessages = messages.length - lastMessageCountRef.current
        if (newMessages > 0) {
          setUnreadCount(prev => prev + newMessages)
          lastMessageCountRef.current = messages.length
        }
      }
    }
  }, [messages.length])

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
    <div className="flex flex-col h-full">
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
          
          {/* Badge de mensajes */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30 flex-shrink-0">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {messages.length}
            </span>
            {hasMore && (
              <span className="text-[10px] sm:text-xs text-blue-200">+más</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4 relative"
      >
        {/* Indicador de carga superior */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Cargando mensajes anteriores...</span>
            </div>
          </div>
        )}
        
        {/* Indicador de que no hay más mensajes */}
        {!hasMore && messages.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="text-xs text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
              📜 Inicio de la conversación
            </div>
          </div>
        )}

        {messages && messages.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            {(() => {
              console.log('🎨 Renderizando', messages.length, 'mensajes')
              return messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  message={message}
                  contactName={contactName}
                />
              ))
            })()}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">No hay mensajes en esta conversación</p>
            </div>
          </div>
        )}

        {/* Botón flotante para scroll al final */}
        {showScrollButton && (
          <button
            onClick={() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
                setUnreadCount(0)
                lastMessageCountRef.current = messages.length
              }
            }}
            className="fixed bottom-24 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center gap-2 z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Footer info */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Bot info */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs text-gray-500 font-medium">Bot:</span>
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                  {conversation?.bot?.session_name || 'N/A'}
                </span>
              </div>
            </div>
            
            {/* Last message time */}
            {conversation.last_message_time && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">
                  {new Date(conversation.last_message_time).toLocaleString('es-ES', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
