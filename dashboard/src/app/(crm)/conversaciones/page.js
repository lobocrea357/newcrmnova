'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
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
import {
  CONVERSATIONS_PAGE_SIZE,
  SALES_LIMIT,
  SYNC_TIMEOUT_MS
} from '@/lib/constants/conversacionesConstants'
import { LEADERS, LEADS, SEDES } from '@/lib/constants/filtrosConstants'
import { DEFAULT_AUDIT_PROMPT } from '@/lib/config/reportPrompts'
import ContactAvatar from '@/components/ContactAvatar'
import HighlightText from '@/components/HighlightText'
import SalesModal from '@/components/conversaciones/SalesModal'
import SyncModal from '@/components/conversaciones/SyncModal'
import ReportModal from '@/components/conversaciones/ReportModal'
import StatsCards from '@/components/conversaciones/StatsCards'
import ConversationsFiltersPanel from '@/components/conversaciones/ConversationsFiltersPanel'
import AdvisorsList from '@/components/conversaciones/AdvisorsList'
import GlobalSearchBar from '@/components/conversaciones/GlobalSearchBar'
import ConversationsList from '@/components/conversaciones/ConversationsList'
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
  const [reportPrompt, setReportPrompt] = useState(DEFAULT_AUDIT_PROMPT);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportError, setReportError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lastChatId, setLastChatId] = useLocalStorage('conversaciones:lastChatId', null);
  const [prevBotIdFromUrl, setPrevBotIdFromUrl] = useState(null);
  
  // Estados para búsqueda global
  const [globalSearchQuery, setGlobalSearchQuery] = useLocalStorage('conversaciones:globalSearchQuery', '');
  const [globalSearchResults, setGlobalSearchResults] = useLocalStorage('conversaciones:globalSearchResults', []);
  const [lastSearchQuery, setLastSearchQuery] = useLocalStorage('conversaciones:lastSearchQuery', '');
  const [isGlobalSearchActive, setIsGlobalSearchActive] = useState(false);
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);
  const searchTimeoutRef = useRef(null);

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

    // Evitar race condition: solo ejecutar si el botId cambió
    if (botIdFromUrl === prevBotIdFromUrl) return;

    setSelectedBotId(botIdFromUrl);
    setPrevBotIdFromUrl(botIdFromUrl);

    // Intentar restaurar la página guardada para este bot desde conversationsPagination
    const savedPagination = conversationsPagination[botIdFromUrl];
    const page = savedPagination && savedPagination.currentPage ? savedPagination.currentPage : 1;
    fetchConversations(botIdFromUrl, page);
  }, [searchParams, bots, prevBotIdFromUrl]);

  // Cargar cotizaciones para todos los bots visibles automáticamente
  useEffect(() => {
    if (!bots || bots.length === 0) return;

    let isMounted = true;
    const abortController = new AbortController();

    const loadCotizaciones = async () => {
      const cotizacionesMap = {};
      
      // Cargar cotizaciones para cada bot en paralelo
      await Promise.all(
        bots.map(async (bot) => {
          try {
            const count = await getBotCotizacionesCount(bot.id);
            if (isMounted) {
              cotizacionesMap[bot.id] = count;
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error(`Error cargando cotizaciones para bot ${bot.id}:`, error);
              if (isMounted) {
                cotizacionesMap[bot.id] = 0;
              }
            }
          }
        })
      );
      
      if (isMounted) {
        setBotCotizaciones(cotizacionesMap);
      }
    };

    loadCotizaciones();

    return () => {
      isMounted = false;
      abortController.abort();
    };
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

      const conversations = await getCompletedSalesConversations(SALES_LIMIT);
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
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

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
      const result = await getConversationsByBot(botId, page, CONVERSATIONS_PAGE_SIZE);

      setConversations((prev) => ({ ...prev, [botId]: result.data }));
      setConversationsPagination((prev) => ({
        ...prev,
        [botId]: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
        },
      }));

      // Calcular cotizaciones totales para este bot - validar que result.data exista
      if (result.data && Array.isArray(result.data)) {
        const totalCotizaciones = result.data.reduce((sum, conv) => {
          return sum + (conv.conversation_metrics?.cotizacionMentions?.count || 0);
        }, 0);
        setBotCotizaciones((prev) => ({ ...prev, [botId]: totalCotizaciones }));
      }
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
    
    // Validar que selectedBot exista antes de continuar
    if (!selectedBot) {
      setReportError(
        "No se pudo encontrar el bot seleccionado. Por favor, selecciona un asesor e intenta nuevamente.",
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
      generatePdfReport(data, selectedBot.session_name);
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

  // Función para ejecutar búsqueda global con debouncing
  const handleGlobalSearch = (query) => {
    setGlobalSearchQuery(query);

    if (!query || query.trim() === "") {
      setIsGlobalSearchActive(false);
      setGlobalSearchResults([]);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      return;
    }

    setIsGlobalSearchActive(true);
    setLoadingGlobalSearch(true);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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
        <StatsCards
          salesCount={salesCount}
          loadingSales={loadingSales}
          botsCount={bots.length}
          filteredBotsCount={filteredBots.length}
          activeFiltersCount={activeFiltersCount}
          totalConversations={totalConversations}
          activeBotsCount={bots.filter(isBotActive).length}
          compactMode={compactMode}
          onSalesClick={handleSalesClick}
        />

        {/* Filtros */}
        <ConversationsFiltersPanel
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFiltersCount={activeFiltersCount}
          activeFilterPills={activeFilterPills}
          filteredBotsCount={filteredBots.length}
          botsCount={bots.length}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          leaderFilter={leaderFilter}
          setLeaderFilter={setLeaderFilter}
          leadFilter={leadFilter}
          setLeadFilter={setLeadFilter}
          sedeFilter={sedeFilter}
          setSedeFilter={setSedeFilter}
          clearFilters={clearFilters}
          handleRemoveFilter={handleRemoveFilter}
          getFilterPillClasses={getFilterPillClasses}
        />

        {/* Layout principal: lista de asesores a la izquierda y conversaciones a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: lista de asesores (bots) */}
          <AdvisorsList
            filteredBots={filteredBots}
            selectedBotId={selectedBotId}
            botSearchQuery={botSearchQuery}
            setBotSearchQuery={setBotSearchQuery}
            isBotActive={isBotActive}
            formatBotStatus={formatBotStatus}
            onBotSelect={handleBotSelect}
          />

          {/* Panel derecho: conversaciones del bot seleccionado */}
          <ConversationsList
            selectedBot={selectedBot}
            selectedBotConversations={selectedBotConversations}
            selectedBotPagination={conversationsPagination[selectedBotId] || { currentPage: 1, totalPages: 1, total: 0 }}
            loadingConversations={loadingConversations}
            selectedBotId={selectedBotId}
            lastChatId={lastChatId}
            onConversationClick={handleConversationClick}
            onPageChange={fetchConversations}
            onGenerateReport={() => {
              setReportData(null);
              setReportError(null);
              setReportModalOpen(true);
            }}
            globalSearchQuery={globalSearchQuery}
            onSearchChange={handleGlobalSearch}
            onClearSearch={handleClearGlobalSearch}
            loadingGlobalSearch={loadingGlobalSearch}
            isGlobalSearchActive={isGlobalSearchActive}
            globalSearchResults={globalSearchResults}
            onResultClick={handleGlobalSearchResultClick}
          />
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
