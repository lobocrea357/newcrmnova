'use client'
import { useState, useEffect } from 'react'
import { supabase, getAllWorkers, getAllBots, getConversationsByBot } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Bot,
  MessageSquare,
  LogOut,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Phone,
  Circle,
} from "lucide-react";

export default function DashboardPage() {
  const [workers, setWorkers] = useState([]);
  const [bots, setBots] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expandedBots, setExpandedBots] = useState({});
  const [loadingConversations, setLoadingConversations] = useState({});
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive'
  const [leaderFilter, setLeaderFilter] = useState("all"); // 'all', 'moises', 'jesus', 'endry'
  const [sedeFilter, setSedeFilter] = useState("all"); // 'all', 'nova', 'apolo'
  const router = useRouter();

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

  const toggleBot = async (botId) => {
    const isExpanding = !expandedBots[botId];
    setExpandedBots((prev) => ({
      ...prev,
      [botId]: isExpanding,
    }));

    if (isExpanding) {
      await fetchConversations(botId);
    }
  };

  // Función para filtrar bots según todos los criterios
  const filterBots = (botsList) => {
    return botsList.filter((bot) => {
      // Filtro de búsqueda global
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        const matchesSearch =
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

      // Filtro de líder (buscar en session_name)
      if (leaderFilter !== "all") {
        const sessionNameLower = bot.session_name?.toLowerCase() || "";
        if (!sessionNameLower.includes(leaderFilter.toLowerCase()))
          return false;
      }

      // Filtro de sede (buscar en session_name)
      if (sedeFilter !== "all") {
        const sessionNameLower = bot.session_name?.toLowerCase() || "";
        if (!sessionNameLower.includes(sedeFilter.toLowerCase())) return false;
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
    if (sedeFilter !== "all") count++;
    return count;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleConversationClick = (chatId) => {
    router.push(`/dashboard/chat/${chatId}`);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard CRM WhatsApp
              </h1>
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

        {/* Filtros */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
            </div>
          </div>
          <div className="px-6 py-4">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="moises">Moisés</option>
                  <option value="jesus">Jesús</option>
                  <option value="endry">Endry</option>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todas</option>
                  <option value="nova">Nova</option>
                  <option value="apolo">Apolo</option>
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
                    onClick={() => {
                      setSearchFilter("");
                      setStatusFilter("all");
                      setLeaderFilter("all");
                      setSedeFilter("all");
                    }}
                    className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Asesores (Bots) */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Lista de Asesores
              </h2>
              {getAllFilteredBots().length > 0 && (
                <span className="text-sm text-gray-500">
                  {getAllFilteredBots().length} asesore
                  {getAllFilteredBots().length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {getAllFilteredBots().length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bot className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No se encontraron asesores
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay bots que coincidan con los filtros aplicados.
                </p>
                {activeFiltersCount() > 0 && (
                  <button
                    onClick={() => {
                      setSearchFilter("");
                      setStatusFilter("all");
                      setLeaderFilter("all");
                      setSedeFilter("all");
                    }}
                    className="mt-4 px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              getAllFilteredBots().map((bot) => {
                const isBotExpanded = expandedBots[bot.id];
                const botConversations = conversations[bot.id] || [];
                const botIsActive = isBotActive(bot.status);
                const formattedStatus = formatBotStatus(bot.status);

                return (
                  <div
                    key={bot.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    {/* Bot Header */}
                    <div
                      onClick={() => toggleBot(bot.id)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0 mr-3">
                            {isBotExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                          </div>

                          {/* Estado indicator dot */}
                          <div className="flex-shrink-0 mr-3">
                            <div className="relative">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  botIsActive ? "bg-green-100" : "bg-gray-200"
                                }`}
                              >
                                <Bot
                                  className={`h-5 w-5 ${
                                    botIsActive
                                      ? "text-green-600"
                                      : "text-gray-600"
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
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {bot.session_name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  botIsActive
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                }`}
                              >
                                {formattedStatus}
                              </span>
                              {bot.phone_number && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  {bot.phone_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              {bot.conversation_count || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              Conversaciones
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bot's Conversations */}
                    {isBotExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200">
                        <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Conversaciones ({botConversations.length})
                          </h4>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {loadingConversations[bot.id] ? (
                            <div className="px-6 py-8 text-sm text-gray-500 flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Cargando conversaciones...
                            </div>
                          ) : botConversations.length === 0 ? (
                            <div className="px-6 py-8 text-sm text-gray-500 text-center">
                              No hay conversaciones para este asesor
                            </div>
                          ) : (
                            botConversations.map((conv) => (
                              <div
                                key={conv.id}
                                onClick={() => handleConversationClick(conv.id)}
                                className="px-6 py-3 hover:bg-white cursor-pointer transition-colors border-b border-gray-200 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-1 min-w-0">
                                    <div className="flex-shrink-0 mr-3">
                                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <MessageSquare className="h-4 w-4 text-indigo-600" />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {conv.contact_name || "Sin nombre"}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Phone className="h-3 w-3 text-gray-400" />
                                        <p className="text-xs text-gray-500">
                                          {conv.contact_phone}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 ml-4 text-right">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {conv.message_count || 0}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      mensaje
                                      {conv.message_count !== 1 ? "s" : ""}
                                    </div>
                                    {conv.last_message_time && (
                                      <div className="text-xs text-gray-400 mt-1">
                                        {new Date(
                                          conv.last_message_time
                                        ).toLocaleDateString("es-ES", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
