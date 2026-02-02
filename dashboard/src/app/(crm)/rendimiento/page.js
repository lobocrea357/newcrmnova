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
import { MOCK_PERFORMANCE_DATA, TEAMS } from "@/lib/mockPerformanceData";
import AdvisorPerformanceCard from "@/components/rendimiento/AdvisorPerformanceCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { supabase } from "@/lib/supabase";

export default function RendimientoPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("today");
  const [activeTab, setActiveTab] = useState("general");
  const [recentlyViewedId, setRecentlyViewedId] = useState(null);

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

  // Detectar asesor visto recientemente
  useState(() => {
    if (typeof window !== 'undefined') {
      const lastViewed = localStorage.getItem('lastViewedAdvisor');
      if (lastViewed) {
        setRecentlyViewedId(lastViewed);
        // Limpiar después de 5 segundos
        setTimeout(() => {
          setRecentlyViewedId(null);
          localStorage.removeItem('lastViewedAdvisor');
        }, 5000);
      }
    }
  }, []);

  // Calcular KPIs globales
  const allAdvisors = Object.values(MOCK_PERFORMANCE_DATA.teams).flat();
  const totalConversations = allAdvisors.length * 15;
  const avgScore =
    allAdvisors.reduce((acc, adv) => acc + adv.dailyScore, 0) /
    allAdvisors.length;
  const criticalAlerts = allAdvisors.filter((adv) => adv.dailyScore < 5).length;

  // Filtrar asesores según tab activo
  const displayedAdvisors =
    activeTab === "general"
      ? allAdvisors
      : MOCK_PERFORMANCE_DATA.teams[activeTab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Rendimiento", href: "/rendimiento" }
          ]} />

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Hoy</option>
                  <option value="yesterday">Ayer</option>
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mes</option>
                </select>

                <button
                  onClick={() => router.push("/rendimiento/reportes")}
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Reportes
                </button>

                <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Actualizar Análisis
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
              <div className="text-sm text-blue-100 mt-1">De 10.0 puntos</div>
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
              className={`bg-gradient-to-br ${
                criticalAlerts > 0
                  ? "from-red-500 to-red-600"
                  : "from-green-500 to-green-600"
              } rounded-xl shadow-lg p-6 text-white`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`text-sm font-medium ${
                    criticalAlerts > 0 ? "text-red-100" : "text-green-100"
                  }`}
                >
                  Alertas Críticas
                </div>
                <AlertTriangle
                  className={`h-5 w-5 ${
                    criticalAlerts > 0 ? "text-red-200" : "text-green-200"
                  }`}
                />
              </div>
              <div className="text-4xl font-bold">{criticalAlerts}</div>
              <div
                className={`text-sm mt-1 ${
                  criticalAlerts > 0 ? "text-red-100" : "text-green-100"
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
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === "general"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Vista General ({allAdvisors.length})
              </button>
              {TEAMS.map((team) => (
                <button
                  key={team}
                  onClick={() => setActiveTab(team)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    activeTab === team
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Equipo {team} ({MOCK_PERFORMANCE_DATA.teams[team].length})
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
