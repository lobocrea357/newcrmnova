'use client'
import { useState, useEffect } from 'react'
import { supabase, getAllWorkers, getAllBots, getConversationsByBot } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Bot, MessageSquare, LogOut, RefreshCw, Users, ChevronDown, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const [workers, setWorkers] = useState([])
  const [bots, setBots] = useState([])
  const [conversations, setConversations] = useState({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [expandedWorkers, setExpandedWorkers] = useState({})
  const [expandedBots, setExpandedBots] = useState({})
  const [loadingConversations, setLoadingConversations] = useState({})
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    fetchData()
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 Sesión activa:', session?.user?.email)
      
      const [workersData, botsData] = await Promise.all([
        getAllWorkers(),
        getAllBots()
      ])
      
      console.log('👷 Workers obtenidos:', workersData.length)
      console.log('🤖 Bots obtenidos:', botsData.length)
      
      setWorkers(workersData)
      setBots(botsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversations = async (botId) => {
    if (conversations[botId]) return // Ya cargadas
    
    try {
      setLoadingConversations(prev => ({ ...prev, [botId]: true }))
      const convData = await getConversationsByBot(botId)
      setConversations(prev => ({ ...prev, [botId]: convData }))
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoadingConversations(prev => ({ ...prev, [botId]: false }))
    }
  }

  const toggleWorker = (workerId) => {
    setExpandedWorkers(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }))
  }

  const toggleBot = async (botId) => {
    const isExpanding = !expandedBots[botId]
    setExpandedBots(prev => ({
      ...prev,
      [botId]: isExpanding
    }))
    
    if (isExpanding) {
      await fetchConversations(botId)
    }
  }

  const getBotsByWorker = (workerId) => {
    return bots.filter(bot => bot.worker_id === workerId)
  }

  const getBotsWithoutWorker = () => {
    return bots.filter(bot => !bot.worker_id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleConversationClick = (chatId) => {
    router.push(`/dashboard/chat/${chatId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const totalConversations = bots.reduce((sum, bot) => sum + (bot.conversation_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard CRM WhatsApp</h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Workers
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {workers.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Bots
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {bots.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Conversaciones
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {totalConversations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Bots Activos
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {bots.filter(bot => bot.status === 'working' || bot.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Workers, Bots & Conversations Hierarchy */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Estructura Organizacional</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {/* Workers con sus bots */}
            {workers.map((worker) => {
              const workerBots = getBotsByWorker(worker.worker_id)
              const isExpanded = expandedWorkers[worker.worker_id]
              
              return (
                <div key={worker.worker_id} className="border-b border-gray-100">
                  {/* Worker Header */}
                  <div
                    onClick={() => toggleWorker(worker.worker_id)}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{worker.worker_name}</h3>
                          <p className="text-sm text-gray-500">{worker.worker_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{workerBots.length}</div>
                          <div className="text-xs text-gray-500">Bots</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{worker.total_chats || 0}</div>
                          <div className="text-xs text-gray-500">Chats</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Worker's Bots */}
                  {isExpanded && (
                    <div className="bg-gray-50 pl-12">
                      {workerBots.length === 0 ? (
                        <div className="px-6 py-4 text-sm text-gray-500">
                          No hay bots asignados a este worker
                        </div>
                      ) : (
                        workerBots.map((bot) => {
                          const isBotExpanded = expandedBots[bot.id]
                          const botConversations = conversations[bot.id] || []
                          
                          return (
                            <div key={bot.id} className="border-t border-gray-200">
                              {/* Bot Header */}
                              <div
                                onClick={() => toggleBot(bot.id)}
                                className="px-6 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {isBotExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                                    )}
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                      bot.status === 'working' ? 'bg-green-100' : 'bg-gray-200'
                                    }`}>
                                      <Bot className={`h-4 w-4 ${
                                        bot.status === 'working' ? 'text-green-600' : 'text-gray-600'
                                      }`} />
                                    </div>
                                    <div className="ml-3">
                                      <h4 className="text-sm font-medium text-gray-900">{bot.session_name}</h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                          bot.status === 'working' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {bot.status}
                                        </span>
                                        {bot.phone_number && (
                                          <span className="text-xs text-gray-500">
                                            📱 {bot.phone_number}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900">
                                      {bot.conversation_count || 0}
                                    </div>
                                    <div className="text-xs text-gray-500">Conversaciones</div>
                                  </div>
                                </div>
                              </div>

                              {/* Bot's Conversations */}
                              {isBotExpanded && (
                                <div className="bg-white pl-12">
                                  {loadingConversations[bot.id] ? (
                                    <div className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                      Cargando conversaciones...
                                    </div>
                                  ) : botConversations.length === 0 ? (
                                    <div className="px-6 py-4 text-sm text-gray-500">
                                      No hay conversaciones
                                    </div>
                                  ) : (
                                    botConversations.map((conv) => (
                                      <div
                                        key={conv.id}
                                        onClick={() => handleConversationClick(conv.id)}
                                        className="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            <MessageSquare className="h-4 w-4 text-gray-400 mr-3" />
                                            <div>
                                              <p className="text-sm font-medium text-gray-900">
                                                {conv.contact_name}
                                              </p>
                                              <p className="text-xs text-gray-500">{conv.contact_phone}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <div className="text-right">
                                              <div className="text-sm font-medium text-gray-900">
                                                {conv.message_count || 0} mensajes
                                              </div>
                                              {conv.last_message_time && (
                                                <div className="text-xs text-gray-500">
                                                  {new Date(conv.last_message_time).toLocaleDateString()}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Bots sin worker asignado */}
            {getBotsWithoutWorker().length > 0 && (
              <div className="border-b border-gray-100">
                <div
                  onClick={() => toggleWorker('unassigned')}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedWorkers['unassigned'] ? (
                        <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Bots sin asignar</h3>
                        <p className="text-sm text-gray-500">Sin worker asignado</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{getBotsWithoutWorker().length}</div>
                      <div className="text-xs text-gray-500">Bots</div>
                    </div>
                  </div>
                </div>

                {expandedWorkers['unassigned'] && (
                  <div className="bg-gray-50 pl-12">
                    {getBotsWithoutWorker().map((bot) => {
                      const isBotExpanded = expandedBots[bot.id]
                      const botConversations = conversations[bot.id] || []
                      
                      return (
                        <div key={bot.id} className="border-t border-gray-200">
                          <div
                            onClick={() => toggleBot(bot.id)}
                            className="px-6 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {isBotExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                                )}
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  bot.status === 'working' ? 'bg-green-100' : 'bg-gray-200'
                                }`}>
                                  <Bot className={`h-4 w-4 ${
                                    bot.status === 'working' ? 'text-green-600' : 'text-gray-600'
                                  }`} />
                                </div>
                                <div className="ml-3">
                                  <h4 className="text-sm font-medium text-gray-900">{bot.session_name}</h4>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    bot.status === 'working' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {bot.status}
                                  </span>
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">
                                  {bot.conversation_count || 0}
                                </div>
                                <div className="text-xs text-gray-500">Conversaciones</div>
                              </div>
                            </div>
                          </div>

                          {isBotExpanded && (
                            <div className="bg-white pl-12">
                              {loadingConversations[bot.id] ? (
                                <div className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Cargando conversaciones...
                                </div>
                              ) : botConversations.length === 0 ? (
                                <div className="px-6 py-4 text-sm text-gray-500">
                                  No hay conversaciones
                                </div>
                              ) : (
                                botConversations.map((conv) => (
                                  <div
                                    key={conv.id}
                                    onClick={() => handleConversationClick(conv.id)}
                                    className="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <MessageSquare className="h-4 w-4 text-gray-400 mr-3" />
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {conv.contact_name}
                                          </p>
                                          <p className="text-xs text-gray-500">{conv.contact_phone}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                          {conv.message_count || 0} mensajes
                                        </div>
                                        {conv.last_message_time && (
                                          <div className="text-xs text-gray-500">
                                            {new Date(conv.last_message_time).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {workers.length === 0 && bots.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron workers ni bots en la base de datos.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
