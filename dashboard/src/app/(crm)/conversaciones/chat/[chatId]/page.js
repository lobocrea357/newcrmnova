'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import ChatView from '@/components/ChatView'
import ContactAvatar from '@/components/ContactAvatar'
import HighlightText from '@/components/HighlightText'
import { globalSearchChats } from '@/lib/supabase'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Search, X, RefreshCw, Phone, Bot, CheckCheck, Sparkles } from 'lucide-react'
import ChatAnalysis from '@/components/ChatAnalysis'
import MessageInsightsPanel from '@/components/MessageInsightsPanel'

function ChatPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = params.chatId
  const fromSearch = searchParams.get('fromSearch') === 'true'
  const searchTimeoutRef = useRef(null)

  const [globalSearchQuery, setGlobalSearchQuery] = useLocalStorage('conversaciones:chatSearchQuery', '')
  const [globalSearchResults, setGlobalSearchResults] = useState([]) // No persistir resultados para evitar estado inconsistente
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false)
  const [showSearchSidebar, setShowSearchSidebar] = useState(false)
  const [messages, setMessages] = useState([])
  const [showInsights, setShowInsights] = useState(false)

  // Cleanup timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleClose = () => {
    const botId = searchParams.get("botId");

    if (botId) {
      router.push(`/conversaciones?botId=${botId}&chatId=${chatId}`);
    } else {
      router.push("/conversaciones");
    }
  };

  // Búsqueda global con debounce (500ms)
  const handleGlobalSearch = (query) => {
    setGlobalSearchQuery(query);

    // Limpiar timeout anterior siempre
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.trim() === "") {
      setGlobalSearchResults([]);
      setLoadingGlobalSearch(false);
      return;
    }

    setLoadingGlobalSearch(true);

    // Debouncing: esperar 500ms antes de ejecutar búsqueda
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await globalSearchChats(query);
        setGlobalSearchResults(results);
      } catch (error) {
        console.error("Error en búsqueda global:", error);
        setGlobalSearchResults([]);
      } finally {
        setLoadingGlobalSearch(false);
      }
    }, 500);
  };

  const handleClearGlobalSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setGlobalSearchQuery("");
    setGlobalSearchResults([]);
    setLoadingGlobalSearch(false);
  };

  const handleSearchResultClick = (chat) => {
    const newChatId = String(chat.id);
    const botId = String(chat.bot_id);

    router.push(
      `/conversaciones/chat/${newChatId}?botId=${botId}&fromSearch=true`,
    );
  };

  return (
    <div className="h-dvh sm:h-auto sm:min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 sm:p-4 p-0 overflow-hidden text-slate-900">
      <div className="max-w-[1800px] mx-auto h-[calc(100dvh-64px)] sm:h-[calc(100dvh-120px)]">
        {/* Contenedor con overflow-x para mobile */}
        <div className="flex sm:gap-4 gap-0 h-full overflow-x-auto">
          {/* Sidebar de búsqueda global (solo si viene desde búsqueda) */}
          {showSearchSidebar && (
            <div className="w-[280px] md:w-80 min-w-[280px] md:min-w-[320px] bg-white rounded-lg shadow-xl flex-shrink-0 flex flex-col overflow-hidden">
              {/* Header del sidebar */}
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Resultados de Búsqueda</h3>
                  <button
                    onClick={() => setShowSearchSidebar(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors"
                    title="Cerrar panel de búsqueda"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => handleGlobalSearch(e.target.value)}
                    placeholder="Buscar conversación..."
                    className="w-full pl-9 pr-9 py-2 bg-white text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {globalSearchQuery && (
                    <button
                      onClick={handleClearGlobalSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {loadingGlobalSearch && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Buscando...</span>
                  </div>
                )}
                
                {!loadingGlobalSearch && globalSearchResults.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {globalSearchResults.length} resultado{globalSearchResults.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Lista de resultados */}
              <div className="flex-1 overflow-y-auto">
                {loadingGlobalSearch ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Buscando...
                  </div>
                ) : globalSearchResults.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-center px-4">
                    <p className="text-sm text-gray-500">
                      {globalSearchQuery ? 'No se encontraron resultados' : 'Usa el buscador para encontrar conversaciones'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {globalSearchResults.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleSearchResultClick(chat)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          String(chat.id) === String(chatId)
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ContactAvatar
                            profilePictureUrl={chat.contact_profile_picture_url}
                            contactName={chat.contact_name || 'Sin nombre'}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              <HighlightText 
                                text={chat.contact_name || 'Sin nombre'} 
                                searchQuery={globalSearchQuery}
                                className="text-gray-900"
                              />
                            </p>
                            
                            {/* Preview del mensaje si hay coincidencia en mensajes */}
                            {chat.match_message ? (
                              <div className="flex items-start gap-1 mt-0.5 text-xs text-gray-600">
                                <CheckCheck className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  <HighlightText 
                                    text={chat.match_message} 
                                    searchQuery={globalSearchQuery}
                                    className="text-gray-600"
                                  />
                                </span>
                              </div>
                            ) : (
                              /* Si no hay mensaje, mostrar teléfono */
                              <div className="flex items-center gap-1 mt-0.5 text-xs">
                                <Phone className="h-3 w-3 text-gray-500" />
                                <span className="truncate">
                                  <HighlightText 
                                    text={chat.contact_phone} 
                                    searchQuery={globalSearchQuery}
                                    className="text-gray-500"
                                  />
                                </span>
                              </div>
                            )}
                            
                            {/* Mostrar bot siempre en la tercera línea */}
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                              <Bot className="h-3 w-3" />
                              <span className="truncate">{chat.bot_name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights Panel - Oculto en móviles a menos que se active */}
          <div className={`${showInsights ? 'flex' : 'hidden'} lg:flex`}>
            <MessageInsightsPanel messages={messages} />
          </div>
          
          {/* Botón para alternar Insights en móvil */}
          <button 
            onClick={() => setShowInsights(!showInsights)}
            className="lg:hidden fixed bottom-6 left-4 z-50 bg-white p-3 rounded-full shadow-lg border border-gray-200 text-indigo-600 active:scale-95 transition-transform"
            title="Ver Insights"
          >
            {showInsights ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </button>

          {/* Chat Area */}
          <div className="flex-1 min-w-full lg:min-w-0 bg-white sm:rounded-lg shadow-xl overflow-hidden relative">
            <ChatView 
              chatId={chatId} 
              onClose={handleClose}
              onMessagesLoaded={setMessages}
            />
            {/* El botón de Análisis IA ahora es absoluto dentro de este contenedor */}
            <ChatAnalysis messages={messages} chatId={chatId} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Cargando conversación...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
