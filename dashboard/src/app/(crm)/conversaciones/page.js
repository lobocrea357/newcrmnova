'use client'
import { useState, useEffect, Suspense } from 'react'
import { generatePdfReport } from '@/lib/conversaciones/generatePdfReport'
import { parseBotSessionName, capitalizeWord } from '@/lib/botNameParser'
import { formatResponseTime } from '@/lib/utils/formatDate'
import {
  getAllWorkers,
  getConversationsByBot,
  globalSearchChats,
  getCompletedSalesCount,
  getCompletedSalesConversations,
  getBotCotizacionesCount
} from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBots } from '@/hooks/useBots'
import { useConversacionesFiltros } from '@/hooks/useConversacionesFiltros'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import ContactAvatar from '@/components/ContactAvatar'
import HighlightText from '@/components/HighlightText'
import SalesModal from '@/components/conversaciones/SalesModal'
import SyncModal from '@/components/conversaciones/SyncModal'
import ReportModal from '@/components/conversaciones/ReportModal'
import {
  Bot,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Phone,
  Circle,
  ChevronDown,
  ChevronUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCheck,
  ArrowUp,
  ArrowDown,
  Clock3,
  CreditCard,
  FileText
} from "lucide-react";

function DashboardContent() {
  const { user, session } = useAuth();
  const { bots, loading: botsLoading, error: botsError } = useBots();
  const [workers, setWorkers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [conversationsPagination, setConversationsPagination] = useLocalStorage('conversaciones:botPages', {});
  const [botCotizaciones, setBotCotizaciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState({});
  const [compactMode, setCompactMode] = useState(false);
  
  const {
    searchFilter, setSearchFilter,
    statusFilter, setStatusFilter,
    leaderFilter, setLeaderFilter,
    leadFilter, setLeadFilter,
    sedeFilter, setSedeFilter,
    showFilters, setShowFilters,
    botSearchQuery, setBotSearchQuery,
    filteredBots,
    activeFiltersCount,
    activeFilterPills,
    clearFilters,
    handleRemoveFilter,
    formatBotStatus,
    isBotActive,
    getFilterPillClasses,
  } = useConversacionesFiltros(bots);
  const [syncingBot, setSyncingBot] = useState(null);
  const [salesCount, setSalesCount] = useState(0);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesConversations, setSalesConversations] = useState([]);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesModalLoading, setSalesModalLoading] = useState(false);
  const [salesModalError, setSalesModalError] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPrompt, setReportPrompt] = useState(`Eres un Auditor Comercial Senior especializado en ventas de alto impacto. 
Tu misión es auditar al asesor basándote ESTRICTAMENTE en los siguientes 13 KPIs:

CRÍTICOS (TIEMPOS):
1. Tiempo de contacto inicial: Máximo 5 minutos.
2. Tiempo de respuesta promedio: Máximo 5 minutos.
3. Tiempo de envío de cotización: Máximo 15 minutos.

AUDITORÍA COMERCIAL:
4. Lead respondió: ¿Hubo interacción real?
5. Número de teléfono: ¿Se obtuvo o validó?
6. Cierre con intención: ¿El asesor presionó por el cierre de forma profesional?
7. Ofreció Scalapay/Financiamiento: ¿Mencionó opciones de pago flexible?
8. Más de 2 opciones: ¿Presentó alternativas al cliente?
9. Seguimiento estructurado: ¿Hubo un plan de contacto posterior?
10. Preguntas de negociación: ¿Indagó sobre necesidades y presupuesto?
11. Calidad de cotización: ¿Es clara, atractiva y profesional?
12. Manejo de objeciones: ¿Supo rebatir dudas del cliente?
13. Venta confirmada: ¿Se cerró la transacción?

INSTRUCCIONES DE REPORTE:
- Identifica faltas en los tiempos críticos de forma prioritaria (¡Es vital!).
- Cita fragmentos del chat que demuestren el manejo de objeciones o cierres.
- Si el asesor tardó más de 5m en responder o 15m en cotizar, señalalo como ERROR CRÍTICO.
- No inventes datos. Si algo no está presente, márcalo como "No detectado".
- Usa un tono ejecutivo y directo.`);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportError, setReportError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lastChatId, setLastChatId] = useLocalStorage('conversaciones:lastChatId', null);
  
  // Estados para búsqueda global
  const [globalSearchQuery, setGlobalSearchQuery] = useLocalStorage('conversaciones:globalSearchQuery', '');
  const [globalSearchResults, setGlobalSearchResults] = useLocalStorage('conversaciones:globalSearchResults', []);
  const [lastSearchQuery, setLastSearchQuery] = useLocalStorage('conversaciones:lastSearchQuery', '');
  const [isGlobalSearchActive, setIsGlobalSearchActive] = useState(false);
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (reportModalOpen) {
      setReportError(null);
      setReportData(null);
    }
  }, [reportModalOpen]);

  useEffect(() => {
    const botIdFromUrl = searchParams.get("botId");
    if (!botIdFromUrl) return;

    if (!bots || bots.length === 0) return;

    setSelectedBotId(botIdFromUrl);

    // Intentar restaurar la página guardada para este bot desde conversationsPagination
    const savedPagination = conversationsPagination[botIdFromUrl];
    const page = savedPagination && savedPagination.currentPage ? savedPagination.currentPage : 1;
    fetchConversations(botIdFromUrl, page);
  }, [searchParams, bots]);

  // Cargar cotizaciones para todos los bots visibles automáticamente
  useEffect(() => {
    if (!bots || bots.length === 0) return;

    const loadCotizaciones = async () => {
      const cotizacionesMap = {};
      
      // Cargar cotizaciones para cada bot en paralelo
      await Promise.all(
        bots.map(async (bot) => {
          try {
            const count = await getBotCotizacionesCount(bot.id);
            cotizacionesMap[bot.id] = count;
          } catch (error) {
            console.error(`Error cargando cotizaciones para bot ${bot.id}:`, error);
            cotizacionesMap[bot.id] = 0;
          }
        })
      );
      
      setBotCotizaciones(cotizacionesMap);
    };

    loadCotizaciones();
  }, [bots]);

  const syncBotData = async (sessionName) => {
    try {
      setSyncingBot(sessionName);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/metadata-sync/${sessionName}/all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        const contactsUpdated = result.data.contacts.updated;
        const chatsUpdated = result.data.chats.updated;
        const botUpdated = result.data.bot?.updated;

        alert(
          `✅ SINCRONIZACIÓN COMPLETADA\n\n` +
            `📊 Resultados:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `• Contactos actualizados: ${contactsUpdated}\n` +
            `• Chats actualizados: ${chatsUpdated}\n` +
            `• Bot actualizado: ${botUpdated ? "Sí ✓" : "No (ya tenía datos)"}\n\n` +
            `Los datos se reflejarán al recargar la página.`,
        );

        // Recargar datos para reflejar los cambios
        await fetchData();

        // Si hay un bot seleccionado, recargar sus conversaciones
        if (selectedBotId) {
          fetchConversations(selectedBotId);
        }
      } else {
        // Mostrar error detallado
        const errorMsg = result.error || "Error desconocido";

        // Detectar si es error de sesión no encontrada
        if (
          errorMsg.includes("NO existe") ||
          errorMsg.includes("does not exist")
        ) {
          alert(
            `⚠️ BOT NO CONECTADO EN WAHA\n\n` +
              `El bot "${sessionName}" no está activo en WAHA.\n\n` +
              `Para sincronizar datos necesitas:\n` +
              `  1. Conectar el bot en WAHA (escanear QR)\n` +
              `  2. Esperar que el estado sea "WORKING"\n` +
              `  3. Intentar la sincronización nuevamente\n\n` +
              `❌ Detalles: ${errorMsg}`,
          );
        } else {
          alert(`❌ Error en la sincronización:\n\n${errorMsg}`);
        }
      }
    } catch (error) {
      console.error("Error sincronizando bot:", error);
      alert(
        `❌ ERROR DE CONEXIÓN\n\n` +
          `No se pudo conectar con el servidor.\n\n` +
          `Detalles: ${error.message || "Error desconocido"}`,
      );
    } finally {
      setSyncingBot(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingSales(true);

      const [workersData, completedSales] = await Promise.all([
        getAllWorkers(),
        getCompletedSalesCount(),
      ]);

      // console.log("👷 Workers obtenidos:", workersData.length);
      // console.log("🤖 Bots obtenidos:", bots.length);

      setWorkers(workersData);
      setSalesCount(completedSales || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setLoadingSales(false);
    }
  };

  const handleSalesClick = async () => {
    try {
      setSalesModalLoading(true);
      setSalesModalError(null);
      setSalesModalOpen(true);

      const conversations = await getCompletedSalesConversations(200);
      setSalesConversations(conversations);
    } catch (error) {
      console.error("Error obteniendo ventas:", error);
      setSalesModalError(
        "No se pudo cargar el detalle de ventas. Intenta nuevamente.",
      );
    } finally {
      setSalesModalLoading(false);
    }
  };

  const handleCloseSalesModal = () => {
    setSalesModalOpen(false);
    setSalesModalError(null);
  };

  const appendSyncLog = (message, type = "info") => {
    setSyncLogs((prev) => [
      ...prev,
      {
        message,
        type,
        time: new Date().toLocaleTimeString("es-ES"),
      },
    ]);
  };

  const handleFullSync = async () => {
    if (syncingAll) return;

    setSyncingAll(true);
    setSyncLogs([]);
    setSyncProgress({ percent: 5, status: "Conectando con WAHA remoto..." });
    appendSyncLog(
      "🚀 Iniciando sincronización COMPLETA de TODOS los bots desde WAHA",
    );

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutos

    try {
      const response = await fetch(`${apiUrl}/api/message-history/all-bots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 1000,
          includeMedia: true,
          transcribeAudio: true,
          fixFromMe: true,
        }),
        signal: controller.signal,
      });

      setSyncProgress({
        percent: 50,
        status: "Procesando respuesta del servidor...",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setSyncProgress({ percent: 100, status: "Sincronización completada" });
      appendSyncLog("✅ Sincronización completada correctamente");
      appendSyncLog(`📊 Bots procesados: ${result?.data?.bots || 0}`);
      appendSyncLog(
        `💬 Conversaciones sincronizadas: ${result?.data?.chats || 0}`,
      );
      appendSyncLog(`📩 Mensajes nuevos: ${result?.data?.messages || 0}`);

      await fetchData();
    } catch (error) {
      const errorMessage =
        error.name === "AbortError"
          ? "Timeout: La sincronización tardó más de 30 minutos"
          : error.message || "Error desconocido";
      appendSyncLog(`❌ Error: ${errorMessage}`, "error");
      setSyncProgress({ percent: 0, status: `Error: ${errorMessage}` });
    } finally {
      clearTimeout(timeoutId);
      setSyncingAll(false);
    }
  };

  const handleCloseSyncModal = () => {
    if (syncingAll) return;
    setSyncProgress(null);
    setSyncLogs([]);
  };

  const fetchConversations = async (botId, page = 1) => {
    try {
      setLoadingConversations((prev) => ({ ...prev, [botId]: true }));
      const result = await getConversationsByBot(botId, page, 10);

      setConversations((prev) => ({ ...prev, [botId]: result.data }));
      setConversationsPagination((prev) => ({
        ...prev,
        [botId]: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
        },
      }));

      // Calcular cotizaciones totales para este bot
      const totalCotizaciones = result.data.reduce((sum, conv) => {
        return sum + (conv.conversation_metrics?.cotizacionMentions?.count || 0);
      }, 0);
      setBotCotizaciones((prev) => ({ ...prev, [botId]: totalCotizaciones }));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConversations((prev) => ({ ...prev, [botId]: false }));
    }
  };

  const handleBotSelect = async (botId) => {
    setSelectedBotId(botId);
    await fetchConversations(botId);

    // Actualizar la URL para mantener el contexto del bot seleccionado
    const params = new URLSearchParams();
    params.set("botId", botId);
    router.push(`/conversaciones?${params.toString()}`);
  };

  const handleGenerateReport = async () => {
    if (!selectedBotId) return;
    if (!session?.access_token) {
      setReportError(
        "No se pudo validar la sesión actual. Vuelve a iniciar sesión e inténtalo de nuevo.",
      );
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          botId: selectedBotId,
          customPrompt: reportPrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo generar el reporte.");
      }
      setReportData(data);
      // console.log('[PDF-DEBUG] API response aiNarrative:', JSON.stringify(data.aiNarrative));
      // console.log('[PDF-DEBUG] _debug field:', JSON.stringify(data._debug));
      // console.log('[PDF-DEBUG] audits count:', data.aiNarrative?.audits?.length ?? 'UNDEFINED');
      generatePdfReport(data, selectedBot?.session_name);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError(error.message);
    } finally {
      setReportLoading(false);
    }
  };

  const closeReportModal = () => {
    if (reportLoading) return;
    setReportModalOpen(false);
    setReportError(null);
  };

  const handleConversationClick = (botId, chatId) => {
    const chatIdStr = String(chatId);
    setLastChatId(chatIdStr);

    // conversationsPagination ya está sincronizado con localStorage via useLocalStorage
    // No necesitamos guardar manualmente

    router.push(`/conversaciones/chat/${chatId}?botId=${botId}`);
  };

  // Función para ejecutar búsqueda global
  const handleGlobalSearch = async (query) => {
    setGlobalSearchQuery(query);

    if (!query || query.trim() === "") {
      setIsGlobalSearchActive(false);
      setGlobalSearchResults([]);
      return;
    }

    setLoadingGlobalSearch(true);
    setIsGlobalSearchActive(true);

    try {
      const results = await globalSearchChats(query);
      setGlobalSearchResults(results);
    } catch (error) {
      console.error("Error en búsqueda global:", error);
      setGlobalSearchResults([]);
    } finally {
      setLoadingGlobalSearch(false);
    }
  };

  // Función para limpiar búsqueda global
  const handleClearGlobalSearch = () => {
    setGlobalSearchQuery("");
    setGlobalSearchResults([]);
    setIsGlobalSearchActive(false);
  };

  // Función para manejar click en resultado de búsqueda global
  const handleGlobalSearchResultClick = (chat) => {
    const chatIdStr = String(chat.id);
    const botIdStr = String(chat.bot_id);

    // Guardar la query de búsqueda
    setLastSearchQuery(globalSearchQuery);

    // Navegar al chat con parámetro de búsqueda
    router.push(
      `/conversaciones/chat/${chatIdStr}?botId=${botIdStr}&fromSearch=true`,
    );
  };

  const handlePageChange = async (botId, newPage) => {
    await fetchConversations(botId, newPage);
  };

  const selectedBot = selectedBotId
    ? bots.find((bot) => String(bot.id) === String(selectedBotId))
    : null;

  const selectedBotConversations = selectedBotId
    ? conversations[selectedBotId] || []
    : [];

  const selectedBotPagination = selectedBotId
    ? conversationsPagination[selectedBotId] || {
        currentPage: 1,
        totalPages: 0,
        total: 0,
      }
    : { currentPage: 1, totalPages: 0, total: 0 };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const totalConversations = bots.reduce(
    (sum, bot) => sum + (bot.conversation_count || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Ventas */}
      <SalesModal
        isOpen={salesModalOpen}
        onClose={handleCloseSalesModal}
        conversations={salesConversations}
        loading={salesModalLoading}
        error={salesModalError}
      />

      {/* Modal de Sincronización */}
      <SyncModal
        syncProgress={syncProgress}
        syncLogs={syncLogs}
        syncing={syncingAll}
        onClose={handleCloseSyncModal}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => setCompactMode((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50"
          >
            Modo: {compactMode ? "Compacto" : "Detallado"}
          </button>
        </div>

        {/* Stats */}
        {!compactMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              type="button"
              onClick={handleSalesClick}
              className="bg-white rounded-lg shadow p-6 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <ArrowUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ventas Concretadas
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
                      {loadingSales ? (
                        <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
                      ) : (
                        <span translate="no">{salesCount}</span>
                      )}
                    </dd>
                    <dd className="text-xs text-green-600 mt-1">
                      Click para ver detalles
                    </dd>
                  </dl>
                </div>
              </div>
            </button>

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
                    <dd className="text-3xl font-semibold text-gray-900" translate="no">
                      {bots.length}
                    </dd>
                    {activeFiltersCount > 0 && (
                      <dd className="text-xs text-indigo-600 mt-1">
                        {filteredBots.length} mostrados
                      </dd>
                    )}
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
                      Total Conversaciones
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900" translate="no">
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
                    <dd className="text-3xl font-semibold text-gray-900" translate="no">
                      {
                        bots.filter(
                          (bot) =>
                            bot.status === "WORKING" ||
                            bot.status === "ACTIVE" ||
                            bot.status === "working" ||
                            bot.status === "active",
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
              {activeFiltersCount > 0 && (
                <span className="hidden md:inline text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {activeFiltersCount} filtro
                  {activeFiltersCount > 1 ? "s" : ""} activo
                  {activeFiltersCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && !showFilters && (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600">
                  <span className="truncate max-w-[140px] sm:max-w-xs">
                    {filteredBots.length} de {bots.length} asesores
                  </span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-[11px] sm:text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                    Limpiar
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
              >
                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {activeFilterPills.length > 0 && (
            <div className="px-6 py-2 border-b border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-600">
              {activeFilterPills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => handleRemoveFilter(pill.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${getFilterPillClasses(pill.key)}`}
                >
                  <span>{pill.label}</span>
                  <span className="text-xs">×</span>
                </button>
              ))}
            </div>
          )}
          <div className={`px-6 py-4 ${showFilters ? "block" : "hidden"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de búsqueda global */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Búsqueda Global
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Buscar por nombre, teléfono..."
                    className="w-full pl-10 pr-4 py-2 bg-white text-gray-700 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Filtro de estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              {/* Filtro de líder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Líder
                </label>
                <select
                  value={leaderFilter}
                  onChange={(e) => setLeaderFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="moises">Moisés</option>
                  <option value="jesus">Jesús</option>
                  <option value="endry">Endry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead
                </label>
                <select
                  value={leadFilter}
                  onChange={(e) => setLeadFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="colombia">Colombia</option>
                  <option value="venezuela">Venezuela</option>
                </select>
              </div>

              {/* Filtro de sede */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sede
                </label>
                <select
                  value={sedeFilter}
                  onChange={(e) => setSedeFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todas</option>
                  <option value="nova">Nova</option>
                  <option value="apolo">Apolo</option>
                  <option value="flash">Flash</option>
                </select>
              </div>
            </div>

            {/* Botón para limpiar filtros y contador */}
            <div className="mt-4 flex items-center justify-between">
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {filteredBots.length} de {bots.length} asesores
                    {activeFiltersCount > 0 &&
                      ` (${activeFiltersCount} filtro${
                        activeFiltersCount > 1 ? "s" : ""
                      } activo${activeFiltersCount > 1 ? "s" : ""})`}
                  </span>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layout principal: lista de asesores a la izquierda y conversaciones a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: lista de asesores (bots) */}
          <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-1">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    <span>Asesores</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un asesor para ver sus conversaciones.
                  </p>
                </div>
                {filteredBots.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {filteredBots.length} de {bots.length} visibles
                  </span>
                )}
              </div>
              
              {/* Buscador de asesores */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={botSearchQuery}
                  onChange={(e) => setBotSearchQuery(e.target.value)}
                  placeholder="Buscar asesor..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {botSearchQuery && (
                  <button
                    onClick={() => setBotSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {filteredBots.length === 0 ? (
              <div className="flex-1 px-6 py-12 text-center flex flex-col items-center justify-center">
                <Bot className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">
                  No se encontraron asesores
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ajusta los filtros para ver otros resultados.
                </p>
              </div>
            ) : (
              <div className="flex-1 max-h-[50vh] lg:max-h-[650px] overflow-y-auto divide-y divide-gray-100">
                {filteredBots.map((bot) => {
                  const botIsActive = isBotActive(bot);
                  const formattedStatus = formatBotStatus(bot);
                  const isSelected = String(bot.id) === String(selectedBotId);
                  const meta = parseBotSessionName(bot.session_name);

                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => handleBotSelect(bot.id)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-l-4 ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-500"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              botIsActive ? "bg-green-100" : "bg-gray-200"
                            }`}
                          >
                            <Bot
                              className={`h-5 w-5 ${
                                botIsActive ? "text-green-600" : "text-gray-600"
                              }`}
                            />
                          </div>
                          {botIsActive && (
                            <Circle
                              className="absolute -top-0.5 -right-0.5 h-3 w-3 text-green-500 fill-current"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate" translate="no">
                            {meta.fullName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                                botIsActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                            >
                              <span translate="no">{formattedStatus}</span>
                            </span>
                            {meta.sedeLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <span translate="no">{meta.sedeLabel}</span>
                              </span>
                            )}
                            {meta.leadLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <span translate="no">{meta.leadLabel}</span>
                              </span>
                            )}
                            {meta.leaderLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                <span translate="no">{meta.leaderLabel}</span>
                              </span>
                            )}
                            {bot.phone_number && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">
                                <span translate="no">{bot.phone_number}</span>
                              </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Comentado: Contadores extraídos a ConversacionesStats.jsx para uso futuro */}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Panel derecho: conversaciones del bot seleccionado */}
          <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              {selectedBot ? (
                (() => {
                  const meta = parseBotSessionName(selectedBot.session_name);
                  return (
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
                  );
                })()
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    <span>Conversaciones</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    <span>Selecciona un asesor en la lista para ver sus conversaciones.</span>
                  </p>
                </div>
              )}

              {selectedBot && (
                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-col items-end text-xs text-gray-500">
                    <span>Estado: </span>
                    <span translate="no">{formatBotStatus(selectedBot)}</span>
                    {selectedBot.phone_number && (
                      <span className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        <span translate="no">{selectedBot.phone_number}</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReportData(null);
                      setReportError(null);
                      setReportModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow"
                  >
                    <FileText className="h-4 w-4" />
                    Generar reporte
                  </button>
                </div>
              )}
            </div>

            {/* Buscador Global */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  placeholder="Buscar por nombre, teléfono o palabra clave..."
                  className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                {globalSearchQuery && (
                  <button
                    onClick={handleClearGlobalSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              {loadingGlobalSearch && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Buscando...</span>
                </div>
              )}
              {isGlobalSearchActive && !loadingGlobalSearch && (
                <div className="mt-2 text-sm text-gray-600">
                  {globalSearchResults.length} resultado
                  {globalSearchResults.length !== 1 ? "s" : ""} encontrado
                  {globalSearchResults.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            <div className="flex-1">
              {isGlobalSearchActive ? (
                /* Mostrar resultados de búsqueda global */
                loadingGlobalSearch ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500 gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Buscando conversaciones...
                  </div>
                ) : globalSearchResults.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center px-6 py-12">
                    <div>
                      <Search className="mx-auto h-10 w-10 text-gray-300" />
                      <h3 className="mt-3 text-sm font-medium text-gray-900">
                        No se encontraron resultados
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 max-w-md">
                        No hay conversaciones que coincidan con "
                        {globalSearchQuery}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[50vh] lg:max-h-[450px] overflow-y-auto divide-y divide-gray-200">
                    {globalSearchResults.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleGlobalSearchResultClick(chat)}
                        className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                          lastChatId === String(chat.id)
                            ? "bg-indigo-50 hover:bg-indigo-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1 gap-4">
                          <ContactAvatar
                            profilePictureUrl={chat.contact_profile_picture_url}
                            contactName={chat.contact_name || "Sin nombre"}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              <HighlightText
                                text={chat.contact_name || "Sin nombre"}
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
                              /* Si no hay mensaje, mostrar teléfono y bot */
                              <div className="flex items-center gap-2 mt-0.5 text-xs">
                                <Phone className="h-3 w-3 text-gray-500" />
                                <span className="truncate max-w-[120px]">
                                  <HighlightText
                                    text={chat.contact_phone}
                                    searchQuery={globalSearchQuery}
                                    className="text-gray-500"
                                  />
                                </span>
                                <span className="text-gray-400">•</span>
                                <Bot className="h-3 w-3 text-gray-500" />
                                <span className="truncate max-w-[120px] text-gray-500">
                                  {chat.bot_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500">
                          {chat.last_message_time && (
                            <span>
                              {new Date(
                                chat.last_message_time,
                              ).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : !selectedBot ? (
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
              ) : loadingConversations[selectedBotId] ? (
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
                        onClick={() =>
                          handleConversationClick(selectedBot.id, conv.id)
                        }
                        className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                          lastChatId === String(conv.id)
                            ? "bg-indigo-50 hover:bg-indigo-100"
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
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.contact_name || "Sin nombre"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <Phone className="h-3 w-3" />
                              <span className="truncate max-w-[160px]">
                                {conv.contact_phone || conv.remote_jid}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500 gap-1">
                          {/* Indicador IA - Solo mostrar si hay análisis real (sale_completed definido) */}
                          {conv.ai_analysis &&
                            conv.ai_analysis.sale_completed !== undefined && (
                              <div
                                className="mb-1"
                                title={
                                  conv.ai_analysis.sale_completed
                                    ? "Venta Probable"
                                    : "Venta Improbable"
                                }
                              >
                                {conv.ai_analysis.sale_completed ? (
                                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                    <ArrowUp className="h-3 w-3" />
                                    <span className="font-bold text-xs">
                                      Venta
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                    <ArrowDown className="h-3 w-3" />
                                    <span className="font-bold text-xs">
                                      No Venta
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Comentado: Métricas extraídas a ConversacionesMetrics.jsx para uso futuro */}
                          {conv.last_message_time && (
                            <span className="mt-0.5">
                              {new Date(
                                conv.last_message_time,
                              ).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
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
                            handlePageChange(
                              selectedBotId,
                              selectedBotPagination.currentPage - 1,
                            )
                          }
                          disabled={
                            selectedBotPagination.currentPage === 1 ||
                            loadingConversations[selectedBotId]
                          }
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedBotPagination.currentPage === 1 ||
                            loadingConversations[selectedBotId]
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </button>
                        <button
                          onClick={() =>
                            handlePageChange(
                              selectedBotId,
                              selectedBotPagination.currentPage + 1,
                            )
                          }
                          disabled={
                            selectedBotPagination.currentPage ===
                              selectedBotPagination.totalPages ||
                            loadingConversations[selectedBotId]
                          }
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedBotPagination.currentPage ===
                              selectedBotPagination.totalPages ||
                            loadingConversations[selectedBotId]
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
        </div>
      </main>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
        prompt={reportPrompt}
        onPromptChange={setReportPrompt}
        loading={reportLoading}
        reportData={reportData}
        error={reportError}
        onGenerate={handleGenerateReport}
        onDownload={() => generatePdfReport(reportData, selectedBot?.session_name)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
