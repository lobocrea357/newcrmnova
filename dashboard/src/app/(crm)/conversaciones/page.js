'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { generatePdfReport } from '@/lib/conversaciones/generatePdfReport'
import {
  getConversationsByBot,
  globalSearchChats,
  getCompletedSalesCount,
  getCompletedSalesConversations,
  getAllBotsCotizacionesCount
} from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBots } from '@/hooks/useBots'
import { useConversacionesFiltros } from '@/hooks/useConversacionesFiltros'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { successAlert, errorAlert, warningAlert } from '@/helpers/sweetAlerts'
import {
  CONVERSATIONS_PAGE_SIZE,
  SALES_LIMIT,
  SYNC_TIMEOUT_MS
} from '@/lib/constants/conversacionesConstants'
import { DEFAULT_AUDIT_PROMPT } from '@/lib/config/reportPrompts'
import { CONVERSACIONES_API, NEXT_CONVERSACIONES_API, DIAGNOSTICS_API } from '@/config/apiConfig'
import SalesModal from '@/components/conversaciones/SalesModal'
import SyncModal from '@/components/conversaciones/SyncModal'
import ReportModal from '@/components/conversaciones/ReportModal'
import StatsCards from '@/components/conversaciones/StatsCards'
import ConversationsFiltersPanel from '@/components/conversaciones/ConversationsFiltersPanel'
import AdvisorsList from '@/components/conversaciones/AdvisorsList'
import ConversationsList from '@/components/conversaciones/ConversationsList'
import { RefreshCw } from "lucide-react";

function DashboardContent() {
  const { user, session } = useAuth();
  const { bots, loading: botsLoading } = useBots();
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
  const [wahaStatus, setWahaStatus] = useState(null);
  const [loadingWahaStatus, setLoadingWahaStatus] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lastChatId, setLastChatId] = useLocalStorage('conversaciones:lastChatId', null);
  const prevBotIdFromUrlRef = useRef(null);
  
  // Estados para búsqueda global (no persistir resultados para evitar estado inconsistente)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [lastSearchQuery, setLastSearchQuery] = useLocalStorage('conversaciones:lastSearchQuery', '');
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);
  const searchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // isGlobalSearchActive derivado del estado (no persistido)
  const isGlobalSearchActive = globalSearchQuery.trim().length > 0;

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
    if (botIdFromUrl === prevBotIdFromUrlRef.current) return;

    // Validar que el bot existe en la lista de bots
    const botExists = bots.find(b => String(b.id) === String(botIdFromUrl));
    if (!botExists) {
      console.warn(`Bot ${botIdFromUrl} no encontrado en la lista de bots`);
      return;
    }

    setSelectedBotId(botIdFromUrl);
    prevBotIdFromUrlRef.current = botIdFromUrl;

    // Intentar restaurar la página guardada para este bot desde conversationsPagination
    const savedPagination = conversationsPagination[botIdFromUrl];
    const page = savedPagination && savedPagination.currentPage ? savedPagination.currentPage : 1;
    fetchConversations(botIdFromUrl, page);
  }, [searchParams, bots]);

  // Cargar cotizaciones para todos los bots en una sola query (evita N+1)
  useEffect(() => {
    if (!bots || bots.length === 0) return;

    let isMounted = true;

    const loadCotizaciones = async () => {
      try {
        const cotizacionesPorBot = await getAllBotsCotizacionesCount();
        if (isMounted) {
          setBotCotizaciones(cotizacionesPorBot);
        }
      } catch (error) {
        console.error('Error cargando cotizaciones:', error);
      }
    };

    loadCotizaciones();

    return () => {
      isMounted = false;
    };
  }, [bots]);

  const syncBotData = async (sessionName) => {
    try {
      setSyncingBot(sessionName);

      const response = await fetch(CONVERSACIONES_API.syncBot(sessionName), {
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

        successAlert(
          `Sincronización completada:\n` +
            `• ${contactsUpdated} contactos actualizados\n` +
            `• ${chatsUpdated} chats actualizados\n` +
            `• Bot: ${botUpdated ? 'Actualizado' : 'Sin cambios'}`
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
          warningAlert(
            `El bot "${sessionName}" no está activo en WAHA.\n\n` +
              `Para sincronizar necesitas:\n` +
              `1. Conectar el bot en WAHA (escanear QR)\n` +
              `2. Esperar estado "WORKING"\n` +
              `3. Intentar nuevamente\n\n` +
              `Error: ${errorMsg}`
          );
        } else {
          errorAlert(`Error en la sincronización: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.error("Error sincronizando bot:", error);
      errorAlert(
        `No se pudo conectar con el servidor: ${error.message || 'Error desconocido'}`
      );
    } finally {
      setSyncingBot(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingSales(true);
      setLoadingWahaStatus(true);

      const [completedSales, wahaResponse] = await Promise.all([
        getCompletedSalesCount(),
        fetch(DIAGNOSTICS_API.status).then(res => res.json()).catch(() => null)
      ]);

      if (!isMountedRef.current) return;
      setSalesCount(completedSales || 0);
      if (wahaResponse && wahaResponse.services && wahaResponse.services.waha) {
        setWahaStatus(wahaResponse.services.waha);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error fetching data:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingSales(false);
        setLoadingWahaStatus(false);
      }
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
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

    try {
      const response = await fetch(CONVERSACIONES_API.syncAllBots, {
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

  // Valores derivados (calculados antes de usarlos en handlers)
  const selectedBot = selectedBotId
    ? bots.find((bot) => String(bot.id) === String(selectedBotId))
    : null;

  const handleGenerateReport = async () => {
    // Validación temprana de botId
    if (!selectedBotId) {
      setReportError("No hay asesor seleccionado. Por favor, selecciona un asesor e intenta nuevamente.");
      return;
    }

    // Recalcular selectedBot para asegurar datos frescos
    const currentSelectedBot = bots.find((bot) => String(bot.id) === String(selectedBotId));
    
    // Validar que el bot existe
    if (!currentSelectedBot) {
      setReportError(
        "No se pudo encontrar el asesor seleccionado. Por favor, selecciona un asesor e intenta nuevamente.",
      );
      return;
    }

    // Validar sesión
    if (!session?.access_token) {
      setReportError(
        "No se pudo validar la sesión actual. Vuelve a iniciar sesión e inténtalo de nuevo.",
      );
      return;
    }
    
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await fetch(NEXT_CONVERSACIONES_API.generateReport, {
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
      generatePdfReport(data, currentSelectedBot.session_name);
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

  // Función para limpiar búsqueda global
  const handleClearGlobalSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setGlobalSearchQuery("");
    setGlobalSearchResults([]);
    setLoadingGlobalSearch(false);
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

  const selectedBotConversations = selectedBotId
    ? conversations[selectedBotId] || []
    : [];


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
            Vista: {compactMode ? "Compacta" : "Detallada"}
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
          wahaStatus={wahaStatus}
          loadingWahaStatus={loadingWahaStatus}
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
            formatBotStatus={formatBotStatus}
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
