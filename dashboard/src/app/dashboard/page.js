'use client'
import { useState, useEffect } from 'react'
import { supabase, getAllWorkers, getAllBots, getConversationsByBot } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bot,
  MessageSquare,
  LogOut,
  RefreshCw,
  Users,
  Search,
  Filter,
  Phone,
  Circle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

export default function DashboardPage() {
  const [workers, setWorkers] = useState([]);
  const [bots, setBots] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState({});
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive'
  const [leaderFilter, setLeaderFilter] = useState("all"); // 'all', 'moises', 'jesus', 'endry'
  const [leadFilter, setLeadFilter] = useState("all"); // 'all', 'colombia', 'venezuela'
  const [sedeFilter, setSedeFilter] = useState("all"); // 'all', 'nova', 'apolo', 'flash'
  const [showFilters, setShowFilters] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lastChatId, setLastChatId] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
    fetchData();
  };

  useEffect(() => {
    const botIdFromUrl = searchParams.get('botId');
    if (!botIdFromUrl) return;

    if (!bots || bots.length === 0) return;

    setSelectedBotId(botIdFromUrl);
    fetchConversations(botIdFromUrl);
  }, [searchParams, bots]);

  // Mantener y restaurar la última conversación visitada usando localStorage
  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');

    if (chatIdFromUrl) {
      setLastChatId(chatIdFromUrl);

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dashboard:lastChatId', String(chatIdFromUrl));
        } catch (error) {
          console.error('Error guardando lastChatId en localStorage:', error);
        }
      }

      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const storedChatId = window.localStorage.getItem('dashboard:lastChatId');
        if (storedChatId) {
          setLastChatId(storedChatId);
        }
      } catch (error) {
        console.error('Error leyendo lastChatId desde localStorage:', error);
      }
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("🔐 Sesión activa:", session?.user?.email);

      const [workersData, botsData] = await Promise.all([
        getAllWorkers(),
        getAllBots(),
      ]);

      console.log("👷 Workers obtenidos:", workersData.length);
      console.log("🤖 Bots obtenidos:", botsData.length);

      setWorkers(workersData);
      setBots(botsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (botId) => {
    if (conversations[botId]) return; // Ya cargadas

    try {
      setLoadingConversations((prev) => ({ ...prev, [botId]: true }));
      const convData = await getConversationsByBot(botId);
      setConversations((prev) => ({ ...prev, [botId]: convData }));
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
    params.set('botId', botId);
    router.push(`/dashboard?${params.toString()}`);
  };

  const KNOWN_SEDES = ["nova", "apolo", "flash"];
  const KNOWN_LEADS = ["colombia", "venezuela"];
  const KNOWN_LEADERS = ["moises", "jesus", "endry"];

  const capitalizeWord = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const parseBotSessionName = (sessionName) => {
    if (!sessionName) {
      return {
        displayName: "Sin nombre",
        sedeKey: null,
        sedeLabel: null,
        leadKey: null,
        leadLabel: null,
        leaderKey: null,
        leaderLabel: null,
      };
    }

    const tokens = String(sessionName)
      .split("_")
      .map((t) => t.trim())
      .filter(Boolean);

    const nameTokens = [];
    let sedeKey = null;
    let leadKey = null;
    let leaderKey = null;

    tokens.forEach((token) => {
      const lower = token.toLowerCase();
      if (!sedeKey && KNOWN_SEDES.includes(lower)) {
        sedeKey = lower;
        return;
      }
      if (!leadKey && KNOWN_LEADS.includes(lower)) {
        leadKey = lower;
        return;
      }
      if (!leaderKey && KNOWN_LEADERS.includes(lower)) {
        leaderKey = lower;
        return;
      }
      nameTokens.push(token);
    });

    const displayName =
      nameTokens.length > 0
        ? nameTokens
            .map((t) =>
              t
                .split("-")
                .map((part) => capitalizeWord(part))
                .join(" ")
            )
            .join(" ")
        : String(sessionName);

    return {
      displayName,
      sedeKey,
      sedeLabel: sedeKey ? capitalizeWord(sedeKey) : null,
      leadKey,
      leadLabel: leadKey ? capitalizeWord(leadKey) : null,
      leaderKey,
      leaderLabel: leaderKey ? capitalizeWord(leaderKey) : null,
    };
  };

  // Función para filtrar bots según todos los criterios
  const filterBots = (botsList) => {
    return botsList.filter((bot) => {
      const meta = parseBotSessionName(bot.session_name);

      // Filtro de búsqueda global
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        const matchesSearch =
          meta.displayName.toLowerCase().includes(searchLower) ||
          bot.session_name?.toLowerCase().includes(searchLower) ||
          bot.phone_number?.toLowerCase().includes(searchLower) ||
          bot.id?.toString().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Filtro de estado
      if (statusFilter === "active") {
        if (bot.status !== "working" && bot.status !== "active") return false;
      } else if (statusFilter === "inactive") {
        if (bot.status === "working" || bot.status === "active") return false;
      }

      // Filtro de líder
      if (leaderFilter !== "all" && meta.leaderKey !== leaderFilter) {
        return false;
      }

      // Filtro de lead
      if (leadFilter !== "all" && meta.leadKey !== leadFilter) {
        return false;
      }

      // Filtro de sede
      if (sedeFilter !== "all" && meta.sedeKey !== sedeFilter) {
        return false;
      }

      return true;
    });
  };

  // Obtener todos los bots filtrados (sin importar si tienen worker o no)
  const getAllFilteredBots = () => {
    return filterBots(bots);
  };

  // Función para normalizar y formatear el estado del bot
  const formatBotStatus = (status) => {
    if (!status) return "Desconocido";
    const statusLower = status.toLowerCase();

    // Mapear estados comunes a versiones más amigables
    if (
      statusLower === "working" ||
      statusLower === "active" ||
      statusLower === "online"
    ) {
      return "Activo";
    }
    if (
      statusLower === "disconnected" ||
      statusLower === "inactive" ||
      statusLower === "offline"
    ) {
      return "Inactivo";
    }

    // Si el estado viene en mayúsculas (como "WORKING"), mantenerlo
    if (status === status.toUpperCase() && status.length > 1) {
      return status;
    }

    // Capitalizar primera letra para otros estados
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Función para determinar si un bot está activo
  const isBotActive = (status) => {
    if (!status) return false;
    const statusLower = status.toLowerCase();
    return statusLower === "working" || statusLower === "active";
  };

  // Contador de filtros activos
  const activeFiltersCount = () => {
    let count = 0;
    if (searchFilter) count++;
    if (statusFilter !== "all") count++;
    if (leaderFilter !== "all") count++;
    if (leadFilter !== "all") count++;
    if (sedeFilter !== "all") count++;
    return count;
  };

  const clearFilters = () => {
    setSearchFilter("");
    setStatusFilter("all");
    setLeaderFilter("all");
    setLeadFilter("all");
    setSedeFilter("all");
  };

  const getActiveFilterPills = () => {
    const pills = [];

    if (searchFilter) {
      const trimmed =
        searchFilter.length > 20
          ? `${searchFilter.slice(0, 20)}…`
          : searchFilter;
      pills.push({ key: "search", label: `Búsqueda: "${trimmed}"` });
    }

    if (statusFilter !== "all") {
      let label = "Todos";
      if (statusFilter === "active") label = "Activos";
      if (statusFilter === "inactive") label = "Inactivos";
      pills.push({ key: "status", label: `Estado: ${label}` });
    }

    if (leaderFilter !== "all") {
      pills.push({
        key: "leader",
        label: `Líder: ${capitalizeWord(leaderFilter)}`,
      });
    }

    if (leadFilter !== "all") {
      pills.push({
        key: "lead",
        label: `Lead: ${capitalizeWord(leadFilter)}`,
      });
    }

    if (sedeFilter !== "all") {
      pills.push({
        key: "sede",
        label: `Sede: ${capitalizeWord(sedeFilter)}`,
      });
    }

    return pills;
  };

  const getFilterPillClasses = (key) => {
    switch (key) {
      case "status":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "leader":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "lead":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "sede":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "search":
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const handleRemoveFilter = (key) => {
    switch (key) {
      case "search":
        setSearchFilter("");
        break;
      case "status":
        setStatusFilter("all");
        break;
      case "leader":
        setLeaderFilter("all");
        break;
      case "lead":
        setLeadFilter("all");
        break;
      case "sede":
        setSedeFilter("all");
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleConversationClick = (botId, chatId) => {
    const chatIdStr = String(chatId);
    setLastChatId(chatIdStr);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('dashboard:lastChatId', chatIdStr);
      } catch (error) {
        console.error('Error guardando lastChatId en localStorage desde handleConversationClick:', error);
      }
    }

    router.push(`/dashboard/chat/${chatId}?botId=${botId}`);
  };

  const selectedBot = selectedBotId
    ? bots.find((bot) => String(bot.id) === String(selectedBotId))
    : null;

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
    0
  );

  const activeFilterPills = getActiveFilterPills();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard CRM WhatsApp
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, {user?.email}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-stretch sm:justify-end items-stretch sm:items-center">
              <button
                onClick={fetchData}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setCompactMode((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50"
          >
            Modo: {compactMode ? 'Compacto' : 'Detallado'}
          </button>
        </div>

        {/* Stats */}
        {!compactMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  {activeFiltersCount() > 0 && (
                    <dd className="text-xs text-indigo-600 mt-1">
                      {getAllFilteredBots().length} mostrados
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
                    {
                      bots.filter(
                        (bot) =>
                          bot.status === "working" || bot.status === "active"
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
              {activeFiltersCount() > 0 && (
                <span className="hidden md:inline text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {activeFiltersCount()} filtro{activeFiltersCount() > 1 ? 's' : ''} activo{activeFiltersCount() > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount() > 0 && !showFilters && (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600">
                  <span className="truncate max-w-[140px] sm:max-w-xs">
                    {getAllFilteredBots().length} de {bots.length} asesores
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
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
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
          <div className={`px-6 py-4 ${showFilters ? 'block' : 'hidden'}`}>
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
              {activeFiltersCount() > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {getAllFilteredBots().length} de {bots.length} asesores
                    {activeFiltersCount() > 0 &&
                      ` (${activeFiltersCount()} filtro${
                        activeFiltersCount() > 1 ? "s" : ""
                      } activo${activeFiltersCount() > 1 ? "s" : ""})`}
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
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Asesores
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona un asesor para ver sus conversaciones.
                </p>
              </div>
              {getAllFilteredBots().length > 0 && (
                <span className="text-xs text-gray-500">
                  {getAllFilteredBots().length} de {bots.length} visibles
                </span>
              )}
            </div>

            {getAllFilteredBots().length === 0 ? (
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
              <div className="flex-1 max-h-[60vh] lg:max-h-[600px] overflow-y-auto divide-y divide-gray-100">
                {getAllFilteredBots().map((bot) => {
                  const botIsActive = isBotActive(bot.status);
                  const formattedStatus = formatBotStatus(bot.status);
                  const isSelected = String(bot.id) === String(selectedBotId);
                  const meta = parseBotSessionName(bot.session_name);

                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => handleBotSelect(bot.id)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-l-4 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              botIsActive ? 'bg-green-100' : 'bg-gray-200'
                            }`}
                          >
                            <Bot
                              className={`h-5 w-5 ${
                                botIsActive ? 'text-green-600' : 'text-gray-600'
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
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {meta.displayName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                                botIsActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            >
                              {formattedStatus}
                            </span>
                            {meta.sedeLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {meta.sedeLabel}
                              </span>
                            )}
                            {meta.leadLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                {meta.leadLabel}
                              </span>
                            )}
                            {meta.leaderLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                {meta.leaderLabel}
                              </span>
                            )}
                            {bot.phone_number && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">
                                  {bot.phone_number}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-900">
                          {bot.conversation_count || 0}
                        </span>
                        <span className="text-xs text-gray-500">Conversaciones</span>
                      </div>
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
                        Conversaciones de {meta.displayName}
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedBot.conversation_count || 0} conversaciones totales.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-600">
                        {meta.sedeLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Sede: {meta.sedeLabel}
                          </span>
                        )}
                        {meta.leadLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Lead: {meta.leadLabel}
                          </span>
                        )}
                        {meta.leaderLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            Líder: {meta.leaderLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Conversaciones
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un asesor en la lista para ver sus conversaciones.
                  </p>
                </div>
              )}

              {selectedBot && (
                <div className="flex flex-col items-end text-xs text-gray-500">
                  <span>
                    Estado: {formatBotStatus(selectedBot.status)}
                  </span>
                  {selectedBot.phone_number && (
                    <span className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {selectedBot.phone_number}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1">
              {!selectedBot ? (
                <div className="h-full flex items-center justify-center text-center px-6 py-12">
                  <div>
                    <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900">
                      No hay asesor seleccionado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md">
                      Usa la lista de la izquierda para elegir un asesor y ver el detalle de sus conversaciones.
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
                      Las conversaciones aparecerán aquí cuando el bot reciba mensajes de clientes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-h-[60vh] lg:max-h-[600px] overflow-y-auto divide-y divide-gray-200">
                  {selectedBotConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleConversationClick(selectedBot.id, conv.id)}
                      className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                        lastChatId === String(conv.id)
                          ? 'bg-indigo-50 hover:bg-indigo-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center min-w-0 flex-1 gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conv.contact_name || 'Sin nombre'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span className="truncate max-w-[160px]">
                              {conv.contact_phone || conv.remote_jid}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500">
                        <span className="text-sm font-semibold text-gray-900">
                          {conv.message_count || 0} mensajes
                        </span>
                        {conv.last_message_time && (
                          <span className="mt-1">
                            {new Date(conv.last_message_time).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
