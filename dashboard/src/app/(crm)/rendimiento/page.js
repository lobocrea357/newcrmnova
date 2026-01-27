"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getDashboardStats,
  getRecentAnalyses,
} from "@/lib/supabaseRendimiento";
import { parseBotSessionName } from "@/lib/botNameParser";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  BarChart3,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  Filter,
} from "lucide-react";

export default function RendimientoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all', 'high', 'medium', 'low'

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error obteniendo sesión:", error);
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    setUser(session.user);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, recent] = await Promise.all([
        getDashboardStats(),
        getRecentAnalyses(5),
      ]);

      setDashboardStats(stats);
      setRecentAnalyses(recent);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-400";
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 75) return "high";
    if (percentage >= 50) return "medium";
    return "low";
  };

  const getPerformanceBadge = (percentage) => {
    const level = getPerformanceLevel(percentage);
    const colors = {
      high: "bg-green-100 text-green-700 border-green-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      low: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      high: "Excelente",
      medium: "Bueno",
      low: "Necesita Mejorar",
    };

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full border font-medium ${colors[level]}`}
      >
        {labels[level]}
      </span>
    );
  };

  const filteredStats = dashboardStats.filter((stat) => {
    if (selectedFilter === "all") return true;
    const level = getPerformanceLevel(stat.averagePercentage);
    return level === selectedFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con Acciones */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Dashboard de Rendimiento
              </h1>
              <p className="text-indigo-100 mt-2">
                Crea, monitorea y analiza el desempeño de tus asesores
              </p>
            </div>
          </div>
          {/* Botones de Acción Rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/rendimiento/new")}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-indigo-50 transition-all font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Sparkles className="h-6 w-6" />
              <div className="text-left">
                <div className="text-lg">Nuevo Análisis</div>
                <div className="text-xs text-indigo-400">
                  Analiza un asesor específico
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push("/rendimiento/new?masivo=true")}
              className="bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-lg hover:bg-white/20 transition-all font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:scale-105"
            >
              <Users className="h-6 w-6" />
              <div className="text-left">
                <div className="text-lg">Análisis Masivo</div>
                <div className="text-xs opacity-80">
                  Analiza todos los asesores
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Asesores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Análisis Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.reduce(
                    (sum, s) => sum + s.analyses.length,
                    0,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Conversaciones Analizadas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.reduce(
                    (sum, s) => sum + s.totalConversations,
                    0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todos ({dashboardStats.length})
              </button>
              <button
                onClick={() => setSelectedFilter("high")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "high"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Excelente (
                {
                  dashboardStats.filter(
                    (s) => getPerformanceLevel(s.averagePercentage) === "high",
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setSelectedFilter("medium")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "medium"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Bueno (
                {
                  dashboardStats.filter(
                    (s) =>
                      getPerformanceLevel(s.averagePercentage) === "medium",
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setSelectedFilter("low")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "low"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Necesita Mejorar (
                {
                  dashboardStats.filter(
                    (s) => getPerformanceLevel(s.averagePercentage) === "low",
                  ).length
                }
                )
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Asesores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Rendimiento por Asesor
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Vista general del desempeño de cada asesor basado en sus análisis
              finalizados
            </p>
          </div>

          {filteredStats.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay datos disponibles
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                No se encontraron análisis finalizados para mostrar.
                <br />
                Crea tu primer análisis para comenzar a ver estadísticas.
              </p>
              <button
                onClick={() => router.push("/rendimiento/new")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Crear Primer Análisis
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asesor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Análisis
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversaciones
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score Promedio
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Promedio
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tendencia
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStats.map((stat) => (
                    <tr
                      key={stat.worker?.id || Math.random()}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {stat.worker?.name?.charAt(0).toUpperCase() ||
                                "?"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {stat.worker?.name || "Sin nombre"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {stat.worker?.email || "Sin email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {stat.analyses.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">
                          {stat.totalConversations}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {stat.averageScore.toFixed(1)}/7
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {stat.averagePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(stat.trend)}
                          <span
                            className={`text-sm font-medium ${getTrendColor(stat.trend)}`}
                          >
                            {stat.trend > 0 ? "+" : ""}
                            {stat.trend.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getPerformanceBadge(stat.averagePercentage)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            if (stat.latestAnalysis) {
                              router.push(
                                `/rendimiento/analisis/${stat.latestAnalysis.id}`,
                              );
                            }
                          }}
                          disabled={!stat.latestAnalysis}
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          Ver Último
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Análisis Recientes */}
        {recentAnalyses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Análisis Recientes
            </h2>
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => {
                const botMeta = parseBotSessionName(
                  analysis.bot?.session_name || "",
                );
                return (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                    onClick={() =>
                      router.push(`/rendimiento/analisis/${analysis.id}`)
                    }
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {analysis.analysis_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {botMeta.fullName} • {formatDate(analysis.period_start)}{" "}
                        - {formatDate(analysis.period_end)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {analysis.average_percentage}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {analysis.total_conversations_analyzed} chats
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
