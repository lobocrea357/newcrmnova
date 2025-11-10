'use client'
import { useState, useEffect } from 'react'
import { supabase, getConversationWithMessages, downloadConversationAsTxt, downloadConversationAsMarkdown } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, FileText, FileCode, RefreshCw } from 'lucide-react'

export default function ConversationPage() {
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const { botId, conversationId } = params

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    fetchConversation()
  }

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const data = await getConversationWithMessages(conversationId)
      setConversation(data)
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTxt = () => {
    if (conversation) {
      downloadConversationAsTxt(conversation)
    }
  }

  const handleDownloadMarkdown = () => {
    if (conversation) {
      downloadConversationAsMarkdown(conversation)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No se encontró la conversación</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/dashboard/bot/${botId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {conversation.contact_name || 'Sin nombre'}
                </h1>
                <p className="text-sm text-gray-600">{conversation.remote_jid}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchConversation}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                TXT
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FileCode className="h-4 w-4" />
                Markdown
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Conversation Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bot</p>
              <p className="text-lg font-semibold text-gray-900">{conversation.bot?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de mensajes</p>
              <p className="text-lg font-semibold text-gray-900">{conversation.messages.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Última actividad</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(conversation.last_message_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
          </div>
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {conversation.messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay mensajes en esta conversación</p>
              </div>
            ) : (
              conversation.messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-lg rounded-lg px-4 py-3 shadow-sm ${
                      message.from_me
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {message.from_me ? '🤖 Bot' : `👤 ${conversation.contact_name || 'Usuario'}`}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={`text-xs mt-2 ${
                      message.from_me ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
