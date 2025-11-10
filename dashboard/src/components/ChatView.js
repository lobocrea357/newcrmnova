'use client'

import { useState, useEffect, useRef } from 'react'
import { getConversationWithMessages, supabase } from '@/lib/supabase'
import MessageBubble from './MessageBubble'

export default function ChatView({ chatId, onClose }) {
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  // Definir loadConversation primero
  const loadConversation = async () => {
    setLoading(true)
    try {
      const data = await getConversationWithMessages(chatId)
      setConversation(data)
    } catch (error) {
      console.error('Error al cargar conversación:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageChange = async (payload) => {
    const { eventType } = payload

    if (eventType === 'INSERT') {
      console.log('✨ Nuevo mensaje detectado, recargando...')
      await loadConversation()
    } else if (eventType === 'UPDATE') {
      console.log('🔄 Mensaje actualizado, recargando...')
      await loadConversation()
    } else if (eventType === 'DELETE') {
      console.log('🗑️ Mensaje eliminado')
      await loadConversation()
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

  useEffect(() => {
    // Scroll al final cuando se cargan los mensajes
    if (conversation?.messages) {
      scrollToBottom()
    }
  }, [conversation])

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Volver al dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{contactName}</h2>
              <p className="text-sm text-blue-100">{contactPhone}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-white bg-white/20 px-3 py-1 rounded-full">
            {conversation.messages?.length || 0} mensajes
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {conversation.messages && conversation.messages.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            {conversation.messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                contactName={contactName}
              />
            ))}
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
      </div>

      {/* Footer info */}
      <div className="bg-white border-t px-6 py-3 shadow-inner">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>Bot: <span className="font-medium text-gray-900">{conversation.bot?.session_name || 'N/A'}</span></span>
          </div>
          {conversation.last_message_time && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Último mensaje: {new Date(conversation.last_message_time).toLocaleString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
