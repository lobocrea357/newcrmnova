"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Clock,
  Activity,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import CronManager from "@/components/admin/CronManager";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [systemStats, setSystemStats] = useState({});

  // Verificar autenticación y autorización
  useEffect(() => {
    checkAuthAndPermissions();
  }, []);

  // Cargar estadísticas del sistema
  useEffect(() => {
    if (authorized) {
      loadSystemStats();
    }
  }, [authorized]);

  const checkAuthAndPermissions = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Verificar si el usuario tiene permisos de administrador
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          id,
          email,
          full_name,
          role_id,
          roles (
            name,
            permissions
          )
        `,
        )
        .eq("id", user.id)
        .single();

      // Por ahora, permitir acceso a cualquier usuario autenticado
      // TODO: Implementar verificación de roles específicos para admin
      if (profile) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    } catch (error) {
      console.error("Error verificando permisos:", error);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Estadísticas de análisis recientes
      const { data: recentAnalyses } = await supabase
        .from("performance_analyses")
        .select("id, created_at, generated_by, total_conversations_analyzed")
        .order("created_at", { ascending: false })
        .limit(10);

      // Estadísticas de reportes diarios
      const { data: dailyReports } = await supabase
        .from("daily_sales_reports")
        .select(
          "id, report_date, ventas_confirmadas, leads_calientes, valor_total_ventas",
        )
        .order("report_date", { ascending: false })
        .limit(7);

      // Estadísticas de logs del sistema
      const { data: systemLogs } = await supabase
        .from("sales_analysis_logs")
        .select("id, event_type, success, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Configuración actual
      const { data: config } = await supabase
        .from("sales_analysis_config")
        .select("config_key, config_value, updated_at");

      setSystemStats({
        recent_analyses: recentAnalyses || [],
        daily_reports: dailyReports || [],
        system_logs: systemLogs || [],
        configuration: config || [],
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h1>
            <p className="text-gray-600 mb-6">
              No tienes permisos suficientes para acceder al panel de
              administración.
            </p>
            <button
              onClick={() => router.push("/rendimiento")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Rendimiento", href: "/rendimiento" },
              { label: "Administración", href: "/admin" },
            ]}
          />

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="h-8 w-8 text-blue-600" />
                  Panel de Administración
                </h1>
                <p className="text-gray-600 mt-2">
                  Gestión y configuración del sistema de análisis automático
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Sesión iniciada como:</p>
                <p className="font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Alertas del sistema */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Sistema Operativo
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    El sistema de análisis automático está configurado y
                    funcionando correctamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Base de Datos
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Conexión estable. {systemStats.recent_analyses?.length || 0}{" "}
                    análisis recientes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Monitoreo Activo
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Supervise regularmente el rendimiento del sistema
                    automático.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gestión del sistema de cron */}
          <CronManager />

          {/* Estadísticas del sistema */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Análisis recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Análisis Recientes
                </h3>
              </div>
              <div className="p-6">
                {systemStats.recent_analyses &&
                systemStats.recent_analyses.length > 0 ? (
                  <div className="space-y-3">
                    {systemStats.recent_analyses.slice(0, 5).map((analysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {analysis.total_conversations_analyzed}{" "}
                            conversaciones
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(analysis.created_at).toLocaleDateString(
                              "es-ES",
                            )}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            analysis.generated_by === "DAILY_CRON"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {analysis.generated_by === "DAILY_CRON"
                            ? "Automático"
                            : "Manual"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No hay análisis recientes
                  </p>
                )}
              </div>
            </div>

            {/* Reportes diarios */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-gray-600" />
                  Reportes Diarios
                </h3>
              </div>
              <div className="p-6">
                {systemStats.daily_reports &&
                systemStats.daily_reports.length > 0 ? (
                  <div className="space-y-3">
                    {systemStats.daily_reports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(report.report_date).toLocaleDateString(
                              "es-ES",
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.ventas_confirmadas} ventas,{" "}
                            {report.leads_calientes} leads
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            ${(report.valor_total_ventas || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No hay reportes diarios
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Logs del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Logs del Sistema
              </h3>
            </div>
            <div className="p-6">
              {systemStats.system_logs && systemStats.system_logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Evento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {systemStats.system_logs.slice(0, 10).map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.event_type.replace(/_/g, " ").toLowerCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                log.success
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.success ? "Éxito" : "Error"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.created_at).toLocaleString("es-ES")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No hay logs disponibles
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
