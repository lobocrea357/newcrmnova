'use client'
import { useState, useEffect } from 'react'
import { supabase, getConversationsByBot } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, MessageSquare, Download, RefreshCw, Search } from 'lucide-react'

export default function BotConversationsPage() {
  const [conversations, setConversations] = useState([])
  const [bot, setBot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const params = useParams()
  const botId = params.botId

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    fetchData()
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener información del bot
      const { data: botData, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .single()

      if (botError) throw botError
      setBot(botData)

      // Obtener conversaciones
      const conversationsData = await getConversationsByBot(botId)
      setConversations(conversationsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConversationClick = (conversationId) => {
    router.push(`/dashboard/bot/${botId}/conversation/${conversationId}`)
  }

  const handleDownloadAll = async () => {
    // Implementar descarga de todas las conversaciones
    alert('Descargando todas las conversaciones...')
  }

  const filteredConversations = conversations.filter(conv => 
    conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.remote_jid?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Sin mensajes'
    const date = new Date(timestamp)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando conversaciones...</p>
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
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{bot?.name}</h1>
                <p className="text-sm text-gray-600">
                  {conversations.length} conversaciones
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Descargar Todo
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredConversations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Intenta con otro término de búsqueda' 
                  : 'Las conversaciones aparecerán aquí cuando lleguen mensajes'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv.id)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {conv.contact_name || 'Sin nombre'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {conv.remote_jid}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {conv.message_count} mensajes
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(conv.last_message_at)}
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
