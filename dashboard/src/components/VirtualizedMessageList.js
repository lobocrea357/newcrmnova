'use client'

import { useRef, useEffect, useState } from 'react'
import MessageBubble from './MessageBubble'

/**
 * MessageList - Lista de mensajes con scroll nativo
 * 
 * - Scroll suave como WhatsApp
 * - Carga paginada hacia arriba
 * - Mantiene posición de scroll al cargar más
 */
export default function VirtualizedMessageList({
  messages = [],
  contactName,
  hasMore = false,
  loadMore = () => {},
  isLoadingMore = false,
  onScrollToBottom
}) {
  const containerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const previousMessageCountRef = useRef(0)
  const firstVisibleMessageRef = useRef(null)

  // Función para scroll al final (expuesta para cuando se envía un mensaje)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }

  // Exponer función al padre si se necesita
  useEffect(() => {
    if (onScrollToBottom) {
      onScrollToBottom(scrollToBottom)
    }
  }, [onScrollToBottom])

  // Scroll al final en carga inicial
  useEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      // Múltiples intentos para asegurar scroll al final
      const scrollToBottom = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' })
        }
        // Fallback: usar scrollTop directamente
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }
      
      const timer1 = setTimeout(scrollToBottom, 100)
      const timer2 = setTimeout(scrollToBottom, 300)
      const timer3 = setTimeout(() => {
        scrollToBottom()
        setIsInitialLoad(false)
        previousMessageCountRef.current = messages.length
      }, 500)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isInitialLoad, messages.length])

  // Mantener posición al cargar mensajes anteriores
  useEffect(() => {
    if (!isInitialLoad && messages.length > previousMessageCountRef.current) {
      const newMessagesAdded = messages.length - previousMessageCountRef.current
      
      if (newMessagesAdded > 0 && firstVisibleMessageRef.current) {
        // Guardar el mensaje que estaba visible antes de cargar más
        const savedMessage = firstVisibleMessageRef.current
        
        // Esperar a que el DOM se actualice
        requestAnimationFrame(() => {
          // Buscar el elemento del mensaje guardado
          const messageElement = document.querySelector(`[data-message-id="${savedMessage}"]`)
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'auto', block: 'start' })
          }
        })
      }
      
      previousMessageCountRef.current = messages.length
    }
  }, [messages.length, isInitialLoad])

  // Detectar scroll hacia arriba para cargar más
  const handleScroll = (e) => {
    if (isInitialLoad) return
    
    const container = e.target
    const scrollTop = container.scrollTop
    
    // Guardar el primer mensaje visible
    if (messages.length > 0) {
      firstVisibleMessageRef.current = messages[0].id
    }
    
    // Si está cerca del top (100px), cargar más mensajes
    if (scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMore()
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500">No hay mensajes en esta conversación</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Indicador de carga arriba */}
      {hasMore && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center py-2">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm text-xs">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Cargando...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Contenedor con scroll nativo */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gray-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="px-4 py-2">
          {messages.map((message) => (
            <div 
              key={message.id} 
              data-message-id={message.id}
              className="py-1"
            >
              <MessageBubble
                message={message}
                contactName={contactName}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
