"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  RefreshCw,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
} from "lucide-react";
import AdvisorPerformanceCard from "@/components/rendimiento/AdvisorPerformanceCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { supabase, getAllBots, isBotExcluded } from "@/lib/supabase";
import { getDashboardStats } from "@/lib/supabaseRendimiento";
import { parseBotSessionName } from "@/lib/botNameParser";

export default function RendimientoPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("today");
  const [activeTab, setActiveTab] = useState("general");
  const [recentlyViewedId, setRecentlyViewedId] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);

  // Obtener y loggear usuario loggeado
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔐 Usuario loggeado (Rendimiento):', {
        id: user?.id,
        email: user?.email,
        fullName: user?.user_metadata?.full_name,
        metadata: user?.user_metadata,
        role: user?.role,
        appMetadata: user?.app_metadata,
        fullPayload: user
      });
    };
    loadUserData();
  }, []);

  // Detectar asesor visto recientemente (badge permanente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastViewed = localStorage.getItem('lastViewedAdvisor');
      if (lastViewed) {
        setRecentlyViewedId(lastViewed);
      }
    }
  }, []);

  // Cargar datos reales de asesores
  useEffect(() => {
    loadAdvisorsData();
  }, []);

  const loadAdvisorsData = async () => {
    try {
      setLoading(true);
      const stats = await getDashboardStats();

      // Transformar datos a formato compatible con AdvisorPerformanceCard
      const advisorsData = stats.map((stat) => {
        const botName = stat.worker?.name || "Asesor sin asignar";
        const workerId = stat.worker?.id;
        const averageScore = parseFloat(stat.averageScore || 0);
        const averagePercentage = parseFloat(stat.averagePercentage || 0);
        const trend = stat.trend > 0 ? "up" : stat.trend < 0 ? "down" : "stable";

        // Extraer métricas del último análisis
        const latestAnalysis = stat.latestAnalysis || {};
        const metrics = {
          tiempo_contacto: (latestAnalysis.tiempo_contacto_count || 0) > (latestAnalysis.total_conversations_analyzed || 1) * 0.7,
          tiempo_respuesta: (latestAnalysis.tiempo_respuesta_count || 0) > (latestAnalysis.total_conversations_analyzed || 1) * 0.7,
          tiempo_cotizacion: (latestAnalysis.tiempo_cotizacion_count || 0) > (latestAnalysis.total_conversations_analyzed || 1) * 0.7,
          cierre_intencion: (latestAnalysis.cierre_intencion_count || 0) > (latestAnalysis.total_conversations_analyzed || 1) * 0.7,
          ofrecio_scalapay: (latestAnalysis.ofrecio_scalapay_count || 0) > (latestAnalysis.total_conversations_analyzed || 1) * 0.7,
          mas_dos_opciones: (latestAnalysis.mas_dos_opciones_count || 0) > (latestAnalysis.total_conversations_analyzed || 1) * 0.7,
          seguimiento_intencion: (latestAnalysis.seguimiento_intencion_count || 0) > (latestAnalysis.total_conversations_analyzed || 1) * 0.7,
        };

        return {
          id: stat.botId, // Usar bot_id real
          workerId: workerId, // Mantener worker_id si existe
          name: botName,
          dailyScore: averageScore,
          trend: trend,
          metrics: metrics,
          totalConversations: stat.totalConversations || 0,
          team: "general",
        };
      });

      setAdvisors(advisorsData);

      // Extraer equipos únicos (por ahora solo general)
      setTeams([]);
    } catch (error) {
      console.error("Error cargando datos de asesores:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs globales
  const allAdvisors = advisors;
  const totalConversations = allAdvisors.reduce((acc, adv) => acc + (adv.totalConversations || 0), 0);
  const avgScore = allAdvisors.length > 0
    ? allAdvisors.reduce((acc, adv) => acc + adv.dailyScore, 0) / allAdvisors.length
    : 0;
  const criticalAlerts = allAdvisors.filter((adv) => adv.dailyScore < 5).length;

  // Filtrar asesores según tab activo
  const displayedAdvisors = activeTab === "general"
    ? allAdvisors
    : allAdvisors.filter((adv) => adv.team === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: "Dashboard", href: "/" },
            { label: "Rendimiento", href: "/rendimiento" }
          ]} />

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-gray-700 font-medium">Cargando datos...</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  Control de Rendimiento
                </h1>
                <p className="text-gray-600 mt-1">
                  Seguimiento diario del desempeño de tu equipo
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-colors"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="today" className="text-gray-900 bg-white font-medium">Hoy</option>
                  <option value="yesterday" className="text-gray-900 bg-white font-medium">Ayer</option>
                  <option value="week" className="text-gray-900 bg-white font-medium">Esta Semana</option>
                  <option value="month" className="text-gray-900 bg-white font-medium">Este Mes</option>
                </select>

                <button
                  onClick={() => router.push("/rendimiento/muestra-analisis")}
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Muestra de Análisis
                </button>

                <button
                  onClick={() => router.push("/rendimiento/reportes")}
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Reportes
                </button>
              </div>
            </div>
          </div>

          {/* KPIs Globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-blue-100">
                  Promedio General
                </div>
                <TrendingUp className="h-5 w-5 text-blue-200" />
              </div>
              <div className="text-4xl font-bold">{avgScore.toFixed(1)}</div>
              <div className="text-sm text-blue-100 mt-1">De 7.0 puntos</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-purple-100">
                  Total Conversaciones
                </div>
                <Calendar className="h-5 w-5 text-purple-200" />
              </div>
              <div className="text-4xl font-bold">{totalConversations}</div>
              <div className="text-sm text-purple-100 mt-1">Analizadas hoy</div>
            </div>

            <div
              className={`bg-gradient-to-br ${criticalAlerts > 0
                  ? "from-red-500 to-red-600"
                  : "from-green-500 to-green-600"
                } rounded-xl shadow-lg p-6 text-white`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`text-sm font-medium ${criticalAlerts > 0 ? "text-red-100" : "text-green-100"
                    }`}
                >
                  Alertas Críticas
                </div>
                <AlertTriangle
                  className={`h-5 w-5 ${criticalAlerts > 0 ? "text-red-200" : "text-green-200"
                    }`}
                />
              </div>
              <div className="text-4xl font-bold">{criticalAlerts}</div>
              <div
                className={`text-sm mt-1 ${criticalAlerts > 0 ? "text-red-100" : "text-green-100"
                  }`}
              >
                {criticalAlerts > 0
                  ? "Asesores con score < 5"
                  : "Todo el equipo bien"}
              </div>
            </div>
          </div>

          {/* Tabs de Navegación */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("general")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === "general"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                Vista General ({allAdvisors.length})
              </button>
              {teams.map((team) => (
                <button
                  key={team}
                  onClick={() => setActiveTab(team)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === team
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  Equipo {team} ({allAdvisors.filter((adv) => adv.team === team).length})
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Asesores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedAdvisors.map((advisor) => (
              <AdvisorPerformanceCard
                key={advisor.id}
                advisor={advisor}
                isRecentlyViewed={recentlyViewedId === advisor.id}
                onClick={() => {
                  localStorage.setItem('lastViewedAdvisor', advisor.id);
                  router.push(`/rendimiento/asesor/${advisor.id}`);
                }}
              />
            ))}
          </div>

          {displayedAdvisors.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay asesores en este equipo
              </h3>
              <p className="text-gray-600">
                Selecciona otro equipo para ver sus asesores
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
