"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Play,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generatePerformanceReport } from "@/lib/aiPerformance";
import { createReport, getReportsByAnalysis } from "@/lib/supabaseRendimiento";
import ReportModal from "@/components/rendimiento/ReportModal";
import Breadcrumb from "@/components/ui/Breadcrumb";
import AnalysisStatusBadge from "@/components/rendimiento/AnalysisStatusBadge";

export default function ReportesPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [reportStatuses, setReportStatuses] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [evaluationCounts, setEvaluationCounts] = useState({});
  const [autoExportPDF, setAutoExportPDF] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, [selectedDate]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: analysesData, error } = await supabase
        .from("performance_analyses")
        .select(
          `
          *,
          bot:bots(id, session_name),
          worker:workers(id, name)
        `,
        )
        .gte("analysis_date", startOfDay.toISOString())
        .lte("analysis_date", endOfDay.toISOString())
        .order("analysis_date", { ascending: false });

      if (error) throw error;

      setAnalyses(analysesData || []);

      // Cargar estado de reportes Y conteo de evaluaciones en BATCH (no N+1)
      const analysisIds = (analysesData || []).map((a) => a.id);

      if (analysisIds.length === 0) {
        setReportStatuses({});
        setEvaluationCounts({});
        return;
      }

      // Hacer ambas consultas en paralelo con una sola query cada una
      const [reportsResult, evalsResult] = await Promise.all([
        // 1. Obtener TODOS los reportes de todos los análisis en UNA sola query
        supabase
          .from("performance_reports")
          .select("*")
          .in("performance_analysis_id", analysisIds)
          .order("created_at", { ascending: false }),
        // 2. Obtener TODAS las evaluaciones (solo id y analysis_id) en UNA sola query
        supabase
          .from("conversation_evaluations")
          .select("id, performance_analysis_id")
          .in("performance_analysis_id", analysisIds),
      ]);

      // Procesar reportes en un mapa
      const statuses = {};
      const allReports = reportsResult.data || [];
      for (const id of analysisIds) {
        const reportsForAnalysis = allReports.filter(
          (r) => r.performance_analysis_id === id,
        );
        statuses[id] = {
          hasReport: reportsForAnalysis.length > 0,
          report: reportsForAnalysis[0] || null,
        };
      }

      // Procesar conteos de evaluaciones en un mapa
      const evalCounts = {};
      const allEvals = evalsResult.data || [];
      for (const id of analysisIds) {
        evalCounts[id] = allEvals.filter(
          (e) => e.performance_analysis_id === id,
        ).length;
      }

      setReportStatuses(statuses);
      setEvaluationCounts(evalCounts);
    } catch (error) {
      console.error("Error cargando análisis:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get evaluations via API
  const getEvaluationsForAnalysis = async (analysisId) => {
    try {
      const response = await fetch(
        `/api/rendimiento/save-evaluations?analysisId=${analysisId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error obteniendo evaluaciones");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error obteniendo evaluaciones:", error);
      // Fallback to direct Supabase query
      try {
        const { data: evaluations, error: evalError } = await supabase
          .from("conversation_evaluations")
          .select("*")
          .eq("performance_analysis_id", analysisId);

        if (evalError) throw evalError;
        return evaluations || [];
      } catch (fallbackError) {
        console.error("Fallback también falló:", fallbackError);
        throw new Error("No se pudieron obtener las evaluaciones");
      }
    }
  };

  const generateSingleReport = async (analysis) => {
    try {
      setGeneratingIds((prev) => new Set([...prev, analysis.id]));

      // Obtener evaluaciones del análisis usando API
      const evaluations = await getEvaluationsForAnalysis(analysis.id);

      if (!evaluations || evaluations.length === 0) {
        throw new Error(
          "No se encontraron evaluaciones para este análisis. Asegúrate de que el análisis tenga conversaciones evaluadas.",
        );
      }

      console.log(
        `📊 Generando reporte para ${evaluations.length} evaluaciones`,
      );

      // Generar reporte con IA
      const reportResult = await generatePerformanceReport(
        evaluations,
        analysis.bot?.session_name || analysis.worker?.name || "Asesor",
      );

      if (!reportResult.success) {
        throw new Error(reportResult.error || "Error generando reporte con IA");
      }

      // Guardar reporte
      await createReport({
        performance_analysis_id: analysis.id,
        report_data: reportResult.report,
        report_type: "manual",
        report_name: `Reporte de ${analysis.bot?.session_name || analysis.worker?.name || "Asesor"}`,
      });

      console.log("✅ Reporte generado y guardado exitosamente");

      // Recargar estado de reportes
      await loadAnalyses();
    } catch (error) {
      console.error("Error generando reporte:", error);
      alert(`Error generando reporte: ${error.message}`);
    } finally {
      setGeneratingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(analysis.id);
        return newSet;
      });
    }
  };

  const generateBatchReports = async () => {
    try {
      setGeneratingBatch(true);

      // Filtrar análisis sin reporte
      const analysesToGenerate = analyses.filter(
        (analysis) => !reportStatuses[analysis.id]?.hasReport,
      );

      if (analysesToGenerate.length === 0) {
        alert("Todos los análisis ya tienen reportes generados");
        return;
      }

      // Generar reportes secuencialmente
      for (const analysis of analysesToGenerate) {
        await generateSingleReport(analysis);
      }

      alert(
        `✅ Se generaron ${analysesToGenerate.length} reportes correctamente`,
      );
    } catch (error) {
      console.error("Error generando reportes en lote:", error);
      alert("Error al generar reportes en lote");
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Transformar datos de API a formato de ReportModal
  const transformReportData = (apiReport, analysis) => {
    const METRIC_LABELS = {
      tiempo_contacto: "Tiempo de contacto adecuado",
      tiempo_respuesta: "Tiempo de respuesta rápido",
      tiempo_cotizacion: "Tiempo de cotización eficiente",
      cierre_intencion: "Cierre con intención de compra",
      ofrecio_scalapay: "Ofrecimiento de Scalapay",
      mas_dos_opciones: "Más de dos opciones presentadas",
      seguimiento_intencion: "Seguimiento de intención",
    };

    // Construir métricas detalladas
    const detailedMetrics = Object.entries(
      apiReport.metricas_detalladas || {},
    ).map(([key, percentage]) => ({
      parameter: METRIC_LABELS[key] || key,
      status: parseFloat(percentage) >= 60 ? "pass" : "fail",
      details: `Cumplimiento: ${percentage}% de las conversaciones`,
    }));

    // Calcular score de 0-10 basado en promedio de porcentajes
    const avgPercentage = analysis.average_percentage || 0;
    const score = (avgPercentage / 10).toFixed(1);

    return {
      analysisId: analysis.id, // IMPORTANTE: para regenerar
      advisorName:
        analysis.bot?.session_name || analysis.worker?.name || "Sin nombre",
      analysisDate: analysis.analysis_date || new Date().toISOString(),
      score: score,
      percentage: avgPercentage,
      totalConversations:
        apiReport.total_conversaciones ||
        analysis.total_conversations_analyzed ||
        0,
      summary: {
        strengths: apiReport.fortalezas || [],
        weaknesses: apiReport.areas_mejora || [],
      },
      detailedMetrics: detailedMetrics,
      recommendations: {
        immediate: apiReport.plan_accion || [],
        longTerm: apiReport.conclusiones ? [apiReport.conclusiones] : [],
      },
      conversationExamples: [], // No disponibles en este formato
    };
  };

  const viewReport = (analysis) => {
    try {
      const status = reportStatuses[analysis.id];
      if (!status?.report?.report_data) {
        alert("No hay reporte disponible para este análisis");
        return;
      }

      const apiReportData =
        typeof status.report.report_data === "string"
          ? JSON.parse(status.report.report_data)
          : status.report.report_data;

      // Transformar datos al formato del modal
      const transformedReport = transformReportData(apiReportData, analysis);
      setSelectedReport(transformedReport);
    } catch (error) {
      console.error("Error al ver reporte:", error);
      alert("Error al cargar el reporte");
    }
  };

  const downloadReport = (analysis) => {
    try {
      const status = reportStatuses[analysis.id];
      if (!status?.report?.report_data) {
        alert("No hay datos de reporte para descargar");
        return;
      }

      const apiReportData =
        typeof status.report.report_data === "string"
          ? JSON.parse(status.report.report_data)
          : status.report.report_data;

      const transformedReport = transformReportData(apiReportData, analysis);
      setSelectedReport(transformedReport);
      setAutoExportPDF(true);
    } catch (error) {
      console.error("Error descargando reporte:", error);
      alert("Error al descargar reporte");
    }
  };

  const pendingReportsCount = analyses.filter(
    (a) => !reportStatuses[a.id]?.hasReport,
  ).length;

  const generatedReportsCount = analyses.filter(
    (a) => reportStatuses[a.id]?.hasReport,
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Rendimiento", href: "/rendimiento" },
            { label: "Reportes", href: "/rendimiento/reportes" },
          ]}
        />

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/rendimiento")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  Gestión de Reportes
                </h1>
                <p className="text-gray-600 mt-1">
                  Genera y gestiona reportes de análisis de rendimiento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* KPIs de Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-blue-100">
                Total Análisis
              </div>
              <Calendar className="h-5 w-5 text-blue-200" />
            </div>
            <div className="text-4xl font-bold">{analyses.length}</div>
            <div className="text-sm text-blue-100 mt-1">
              {new Date(selectedDate).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-green-100">
                Reportes Generados
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-200" />
            </div>
            <div className="text-4xl font-bold">{generatedReportsCount}</div>
            <div className="text-sm text-green-100 mt-1">Completados</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-amber-100">
                Reportes Pendientes
              </div>
              <AlertCircle className="h-5 w-5 text-amber-200" />
            </div>
            <div className="text-4xl font-bold">{pendingReportsCount}</div>
            <div className="text-sm text-amber-100 mt-1">Por generar</div>
          </div>
        </div>

        {/* Acciones Masivas */}
        {pendingReportsCount > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">
                  Generar Reportes en Lote
                </h3>
                <p className="text-purple-100 text-sm">
                  Hay {pendingReportsCount} análisis sin reporte. Genéralos
                  todos con un solo clic.
                </p>
              </div>
              <button
                onClick={generateBatchReports}
                disabled={generatingBatch}
                className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingBatch ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generar Todos ({pendingReportsCount})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Análisis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Análisis del {new Date(selectedDate).toLocaleDateString("es-ES")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {analyses.length} análisis encontrados
            </p>
          </div>

          {analyses.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No hay análisis en esta fecha
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Para generar reportes, primero necesitas crear análisis de
                conversaciones.
                <br />
                Los reportes se generan a partir de análisis previos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => router.push("/rendimiento/new")}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Crear Análisis Nuevos
                </button>
                <span className="text-sm text-gray-500">o</span>
                <button
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDate(yesterday.toISOString().split("T")[0]);
                  }}
                  className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Calendar className="h-5 w-5" />
                  Ver Análisis de Ayer
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {analyses.map((analysis) => {
                const status = reportStatuses[analysis.id];
                const isGenerating = generatingIds.has(analysis.id);

                return (
                  <div
                    key={analysis.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {analysis.analysis_name}
                          </h3>
                          <AnalysisStatusBadge
                            analysis={analysis}
                            evaluationsCount={evaluationCounts[analysis.id] || 0}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {analysis.bot?.session_name ||
                              analysis.worker?.name ||
                              "Sin nombre"}
                          </span>
                          <span>•</span>
                          <span>
                            {analysis.total_conversations_analyzed}{" "}
                            conversaciones
                          </span>
                          <span>•</span>
                          <span>Score: {analysis.average_score}/7</span>
                          <span>•</span>
                          <span>{analysis.average_percentage}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {status?.hasReport ? (
                          <>
                            <button
                              onClick={() => viewReport(analysis)}
                              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Reporte
                            </button>
                            <button
                              onClick={() => downloadReport(analysis)}
                              className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Descargar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => generateSingleReport(analysis)}
                            disabled={isGenerating || generatingBatch}
                            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Generar Reporte
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Reporte */}
        {selectedReport && (
          <ReportModal
            report={selectedReport}
            autoExportPDF={autoExportPDF}
            onClose={() => {
              setSelectedReport(null);
              setAutoExportPDF(false);
            }}
            onReportRegenerated={(newReport) => {
              loadAnalyses();
              alert(
                "Reporte actualizado. Cierra y vuelve a abrir para ver cambios.",
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
