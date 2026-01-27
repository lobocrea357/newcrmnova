"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getAnalysisById,
  getEvaluationsByAnalysis,
  getReportsByAnalysis,
  createReport,
} from "@/lib/supabaseRendimiento";
import { parseBotSessionName } from "@/lib/botNameParser";
import { PARAMETROS_EVALUACION } from "@/lib/mockRendimiento";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  User,
  BarChart3,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  Edit3,
  FileText,
  Download,
  Eye,
  Loader2,
} from "lucide-react";

export default function AnalisisDetalle() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id;

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [expandedConversations, setExpandedConversations] = useState(new Set());
  const [existingReport, setExistingReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (analysisId) {
      loadAnalysisData();
    }
  }, [analysisId]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);

      const analysisData = await getAnalysisById(analysisId);
      setAnalysis(analysisData);

      // Usar FK performance_analysis_id en lugar de períodos
      const evaluacionesData = await getEvaluationsByAnalysis(analysisId);
      setEvaluaciones(evaluacionesData);

      // Verificar si existe un reporte
      const reportsData = await getReportsByAnalysis(analysisId);
      if (reportsData && reportsData.length > 0) {
        setExistingReport(reportsData[0]);
      }
    } catch (error) {
      console.error("Error cargando análisis:", error);
      alert("Error al cargar el análisis");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (convId) => {
    setExpandedConversations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(convId)) {
        newSet.delete(convId);
      } else {
        newSet.add(convId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);

      // Crear reporte en BD
      const reportData = {
        performance_analysis_id: analysisId,
        report_type: "analysis_summary",
        report_name: `Reporte - ${analysis.analysis_name}`,
        report_data: {
          analysis: analysis,
          evaluaciones: evaluaciones,
          generated_at: new Date().toISOString(),
        },
        generated_by_user_id: analysis.created_by_user_id,
      };

      const newReport = await createReport(reportData);
      setExistingReport(newReport);
      alert("✅ Reporte generado exitosamente");
    } catch (error) {
      console.error("Error generando reporte:", error);
      alert("❌ Error al generar el reporte");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleViewReport = () => {
    // Abrir modal o nueva ventana con el reporte
    alert(
      "Funcionalidad de vista de reporte en desarrollo. Por ahora puedes exportarlo como PDF.",
    );
  };

  const handleExportPDF = () => {
    // Generar PDF del reporte
    alert("Funcionalidad de exportar PDF en desarrollo.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Análisis no encontrado
          </h3>
          <button
            onClick={() => router.push("/rendimiento")}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const botMeta = parseBotSessionName(analysis.bot?.session_name || "");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con Acciones */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/rendimiento")}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {analysis.analysis_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Análisis guardado •{" "}
              {formatDate(analysis.finalized_at || analysis.created_at)}
            </p>
          </div>

          {/* Botones de Reporte */}
          <div className="flex gap-2">
            {!existingReport ? (
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Generar Reporte
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleViewReport}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <Eye className="h-5 w-5" />
                  Ver Reporte
                </button>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Download className="h-5 w-5" />
                  Exportar PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Información del Asesor y Periodo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Asesor</p>
                <p className="text-lg font-semibold text-gray-900">
                  {botMeta.fullName}
                </p>
                {analysis.worker && (
                  <p className="text-xs text-gray-500 mt-1">
                    {analysis.worker.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Análisis</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(analysis.analysis_date || analysis.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Análisis</p>
                <p className="text-lg font-semibold text-gray-900">
                  {analysis.generated_by}
                </p>
                {analysis.created_by && (
                  <p className="text-xs text-gray-500 mt-1">
                    Por: {analysis.created_by.full_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Conversaciones</p>
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analysis.total_conversations_analyzed}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Score Promedio</p>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {parseFloat(analysis.average_score).toFixed(1)}/7
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Porcentaje</p>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {parseFloat(analysis.average_percentage).toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Estado</p>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
              Finalizado
            </span>
          </div>
        </div>

        {/* Desglose por Parámetros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Desglose por Parámetro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PARAMETROS_EVALUACION.map((param) => {
              const count = analysis[`${param.key}_count`] || 0;
              const percentage =
                analysis.total_conversations_analyzed > 0
                  ? (count / analysis.total_conversations_analyzed) * 100
                  : 0;

              return (
                <div
                  key={param.key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {param.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {count} de {analysis.total_conversations_analyzed}{" "}
                      conversaciones
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabla de Evaluaciones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Conversaciones Evaluadas ({evaluaciones.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Porcentaje
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluaciones.map((evaluation) => {
                  const isExpanded = expandedConversations.has(evaluation.id);
                  const contactName =
                    evaluation.chat?.contact_name ||
                    evaluation.chat?.contact_number ||
                    "Sin nombre";

                  return (
                    <>
                      <tr key={evaluation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {contactName}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-gray-900">
                            {evaluation.score}/7
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                              evaluation.percentage >= 75
                                ? "bg-green-100 text-green-700"
                                : evaluation.percentage >= 50
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {parseFloat(evaluation.percentage).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {evaluation.manually_edited ? (
                              <>
                                <Edit3 className="h-4 w-4 text-amber-600" />
                                <span className="text-xs text-gray-600">
                                  Manual
                                </span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                <span className="text-xs text-gray-600">
                                  IA
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs text-gray-500">
                            {new Date(
                              evaluation.evaluation_date,
                            ).toLocaleDateString("es-ES")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleExpanded(evaluation.id)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                          >
                            {isExpanded ? "Ocultar" : "Ver"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                  Parámetros Evaluados
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {PARAMETROS_EVALUACION.map((param) => (
                                    <div
                                      key={param.key}
                                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                                        evaluation[param.key]
                                          ? "bg-green-50 border-green-200"
                                          : "bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      {evaluation[param.key] ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                      )}
                                      <span className="text-xs text-gray-700">
                                        {param.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {evaluation.ai_feedback && (
                                <div className="p-4 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-start gap-2">
                                    {evaluation.manually_edited ? (
                                      <Edit3 className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                      <p className="text-xs font-medium text-gray-700 mb-1">
                                        {evaluation.manually_edited
                                          ? "Observación del Gerente:"
                                          : "Observación por IA:"}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {evaluation.ai_feedback}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notas Generales */}
        {analysis.general_notes && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Notas Generales
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {analysis.general_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
