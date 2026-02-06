"use client";

import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  BarChart3,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

export default function ReportModal({ report, onClose, onReportRegenerated }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!report) return null;

  const copyToClipboard = () => {
    // Crear texto formateado para WhatsApp
    const whatsappText = `
📊 *REPORTE DE RENDIMIENTO*
👤 Asesor: ${report.advisorName}
📅 Fecha: ${new Date(report.analysisDate).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}
📈 Score: ${report.score}/10 (${report.percentage}%)
💬 Conversaciones: ${report.totalConversations}

✅ *FORTALEZAS:*
${report.summary.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

⚠️ *ÁREAS DE MEJORA:*
${report.summary.weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}

🎯 *RECOMENDACIONES INMEDIATAS:*
${report.recommendations.immediate.map((r, i) => `${i + 1}. ${r}`).join("\n")}

📌 *RECOMENDACIONES A LARGO PLAZO:*
${report.recommendations.longTerm.map((r, i) => `${i + 1}. ${r}`).join("\n")}

---
Este reporte fue generado automáticamente por IA analizando tus conversaciones. ¡Sigue mejorando! 💪
    `.trim();

    navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToPDF = () => {
    // Por ahora, abrimos el diálogo de impresión que permite guardar como PDF
    window.print();
  };

  const regenerateReport = async () => {
    if (!report.analysisId) {
      alert('No se puede regenerar: ID de análisis no disponible');
      return;
    }

    const confirmacion = window.confirm(
      '¿Regenerar reporte?\n\nSe generará un nuevo reporte basado en las evaluaciones actuales.\nEsto sobrescribirá el reporte existente.\n\n¿Continuar?'
    );

    if (!confirmacion) return;

    try {
      setRegenerating(true);

      // Llamar a API para regenerar reporte
      const response = await fetch(`/api/regenerate-report/${report.analysisId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al regenerar reporte');
      }

      const result = await response.json();
      alert('¡Reporte regenerado exitosamente!');

      // Notificar al padre para que recargue
      if (onReportRegenerated) {
        onReportRegenerated(result.report);
      }
    } catch (error) {
      console.error('Error regenerando reporte:', error);
      alert('Error al regenerar el reporte');
    } finally {
      setRegenerating(false);
    }
  };

  const passCount = report.detailedMetrics.filter((m) => m.status === "pass").length;
  const failCount = report.detailedMetrics.filter((m) => m.status === "fail").length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between print:bg-blue-600">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Reporte de Rendimiento</h2>
              <p className="text-blue-100 text-sm">
                {report.advisorName} •{" "}
                {new Date(report.analysisDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={regenerateReport}
              disabled={regenerating}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Regenerar Reporte"
            >
              <RefreshCw className={`h-5 w-5 ${regenerating ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Copiar para WhatsApp"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-300" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={exportToPDF}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Exportar a PDF"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium text-blue-100 mb-1">Score</div>
              <div className="text-3xl font-bold">{report.score}</div>
              <div className="text-xs text-blue-100">De 10.0</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium text-purple-100 mb-1">
                Porcentaje
              </div>
              <div className="text-3xl font-bold">{report.percentage}%</div>
              <div className="text-xs text-purple-100">Cumplimiento</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium text-green-100 mb-1">Aprobados</div>
              <div className="text-3xl font-bold">{passCount}</div>
              <div className="text-xs text-green-100">De 7 parámetros</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium text-amber-100 mb-1">
                Conversaciones
              </div>
              <div className="text-3xl font-bold">{report.totalConversations}</div>
              <div className="text-xs text-amber-100">Analizadas</div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold text-green-900">Fortalezas</h3>
              </div>
              <ul className="space-y-2">
                {report.summary.strengths.map((strength, index) => (
                  <li key={index} className="flex gap-2 text-sm text-green-800">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-900">Áreas de Mejora</h3>
              </div>
              <ul className="space-y-2">
                {report.summary.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex gap-2 text-sm text-red-800">
                    <span className="text-red-600 font-bold">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Métricas Detalladas
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {report.detailedMetrics.map((metric, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {metric.status === "pass" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {metric.parameter}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${metric.status === "pass"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {metric.status === "pass" ? "Aprobado" : "Necesita Mejorar"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{metric.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Examples */}
          {report.conversationExamples && report.conversationExamples.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Ejemplos de Conversaciones
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Casos específicos que ilustran puntos importantes
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {report.conversationExamples.map((example, index) => (
                  <div key={index} className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${example.type === 'good' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        {example.type === 'good' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${example.type === 'good' ? 'text-green-900' : 'text-red-900'
                          }`}>
                          {example.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Lead ID: {example.leadId}</div>
                          <div className="text-sm text-gray-800 italic">"{example.excerpt}"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-4">
            {/* Immediate */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-bold text-orange-900">
                  Recomendaciones Inmediatas
                </h3>
              </div>
              <ul className="space-y-3">
                {report.recommendations.immediate.map((rec, index) => (
                  <li key={index} className="flex gap-3 text-sm text-orange-900">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 font-bold text-xs">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Long term */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-bold text-blue-900">
                  Recomendaciones a Largo Plazo
                </h3>
              </div>
              <ul className="space-y-3">
                {report.recommendations.longTerm.map((rec, index) => (
                  <li key={index} className="flex gap-3 text-sm text-blue-900">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Examples */}
          {report.conversationExamples && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                Ejemplos de Conversaciones
              </h3>
              {report.conversationExamples.map((example, index) => (
                <div
                  key={index}
                  className={`border rounded-xl p-4 ${example.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                    }`}
                >
                  <h4
                    className={`font-semibold mb-2 ${example.type === "success" ? "text-green-900" : "text-amber-900"
                      }`}
                  >
                    {example.type === "success" ? "✅" : "⚠️"} {example.title}
                  </h4>
                  <p
                    className={`text-sm ${example.type === "success" ? "text-green-800" : "text-amber-800"
                      }`}
                  >
                    {example.summary}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Footer info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">
              Este reporte fue generado automáticamente por IA analizando{" "}
              <span className="font-semibold">{report.totalConversations}</span>{" "}
              conversaciones.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Generado el{" "}
              {new Date().toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Footer Actions (print hidden) */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between print:hidden">
          <div className="text-sm text-gray-600">
            {copied && (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Check className="h-4 w-4" />
                ¡Copiado al portapapeles!
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={regenerateReport}
              disabled={regenerating}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerando...' : 'Regenerar Reporte'}
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar para WhatsApp
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
