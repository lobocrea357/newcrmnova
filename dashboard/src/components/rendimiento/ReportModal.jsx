"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
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
  Loader2,
} from "lucide-react";

export default function ReportModal({ report, onClose, onReportRegenerated, autoExportPDF = false }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef(null);
  const hasAutoExported = useRef(false);
  const exportToPDFRef = useRef(null);

  // Auto-export PDF cuando se abre con autoExportPDF=true
  useEffect(() => {
    if (autoExportPDF && report && !hasAutoExported.current && exportToPDFRef.current) {
      hasAutoExported.current = true;
      // Esperar a que el DOM se renderice completamente
      const timer = setTimeout(async () => {
        await exportToPDFRef.current();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoExportPDF, report, onClose]);

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

  const exportToPDF = async () => {
    if (!contentRef.current) return;
    try {
      setExporting(true);

      const content = contentRef.current;

      // Guardar estilos originales
      const originalMaxHeight = content.style.maxHeight;
      const originalOverflow = content.style.overflow;

      // Expandir para capturar TODO el contenido
      content.style.maxHeight = "none";
      content.style.overflow = "visible";
      await new Promise((r) => setTimeout(r, 150));

      // Config PDF A4 con márgenes
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight();  // 297mm
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const headerHeight = 18;
      const footerHeight = 10;
      const usableHeight = pdfHeight - margin - headerHeight - footerHeight;
      let currentY = margin + headerHeight;
      let pageNum = 1;
      const totalSections = content.children.length;

      // Dibujar header elegante en cada página
      const drawPageHeader = () => {
        // Barra de color
        pdf.setFillColor(37, 99, 235); // blue-600
        pdf.rect(0, 0, pdfWidth, 14, "F");
        // Título
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`Reporte de Rendimiento - ${report.advisorName || "Asesor"}`, margin, 9);
        // Fecha a la derecha
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        const dateStr = new Date(report.analysisDate).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        pdf.text(dateStr, pdfWidth - margin, 9, { align: "right" });
        // Línea separadora debajo del header
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.5);
        pdf.line(margin, 15, pdfWidth - margin, 15);
        currentY = margin + headerHeight;
      };

      // Dibujar footer con número de página
      const drawPageFooter = (pageNumber) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${pageNumber} - Generado el ${new Date().toLocaleDateString("es-ES")}`,
          pdfWidth / 2,
          pdfHeight - 5,
          { align: "center" },
        );
        // Línea fina arriba del footer
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pdfHeight - footerHeight, pdfWidth - margin, pdfHeight - footerHeight);
      };

      // Header primera página
      drawPageHeader();

      // Capturar cada sección hijo por separado
      const sections = Array.from(content.children);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        const sectionCanvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: null,
          windowWidth: content.scrollWidth,
        });

        const sectionImgData = sectionCanvas.toDataURL("image/png");
        const sectionRatio = usableWidth / (sectionCanvas.width / 2);
        const sectionHeightMm = (sectionCanvas.height / 2) * sectionRatio;

        // Si la sección no cabe en el espacio restante, nueva página
        if (currentY + sectionHeightMm > pdfHeight - footerHeight) {
          drawPageFooter(pageNum);
          pdf.addPage();
          pageNum++;
          drawPageHeader();
        }

        pdf.addImage(
          sectionImgData,
          "PNG",
          margin,
          currentY,
          usableWidth,
          sectionHeightMm,
        );

        currentY += sectionHeightMm + 4; // 4mm gap entre secciones
      }

      // Footer última página
      drawPageFooter(pageNum);

      // Restaurar estilos
      content.style.maxHeight = originalMaxHeight;
      content.style.overflow = originalOverflow;

      pdf.save(
        `reporte_${report.advisorName || "asesor"}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error exportando PDF:", error);
      alert("Error al exportar el PDF. Intenta de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  // Asignar ref para que useEffect de autoExportPDF pueda llamarla
  exportToPDFRef.current = exportToPDF;

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
  
  // Identificar KPIs Críticos fallidos
  const criticalFails = report.detailedMetrics.filter(
    (m) => m.status === "fail" && m.parameter.includes("(5m)") || m.parameter.includes("(15m)")
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="print-content bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 print:max-h-none print:overflow-visible print:rounded-none">
        {/* Header Premium */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-8 flex items-center justify-between print:bg-slate-900">
          <div className="flex items-center gap-5">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <FileText className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-blue-500/30">
                  Auditoría Premium
                </span>
                {criticalFails.length > 0 && (
                  <span className="bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Riesgo Crítico
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Reporte de Auditoría Comercial</h2>
              <p className="text-blue-200/80 text-sm font-medium flex items-center gap-2 mt-1">
                <span className="text-white">{report.advisorName}</span>
                <span>•</span>
                <span>{new Date(report.analysisDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
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
              disabled={exporting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              title="Exportar a PDF"
            >
              {exporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                  <Download className="h-5 w-5" />
              )}
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
        <div ref={contentRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
          
          {/* Alertas Rojas (SI FALLA CRÍTICOS) */}
          {criticalFails.length > 0 && (
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 shadow-sm animate-pulse-subtle">
              <div className="flex items-center gap-3 mb-4 text-red-700">
                <div className="bg-red-100 p-2 rounded-xl">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Alerta Roja: Fallos en KPIs Críticos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {criticalFails.map((fail, idx) => (
                  <div key={idx} className="bg-white border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-red-500 uppercase">KPI Incumplido</div>
                      <div className="text-sm font-bold text-gray-900 leading-tight">{fail.parameter}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-red-800 font-medium">
                ⚠️ El incumplimiento de los tiempos de respuesta afecta severamente la conversión. Se requiere acción inmediata del gerente.
              </p>
            </div>
          )}

          {/* KPIs Premium Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 bg-blue-50 rounded-bl-xl text-blue-600">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Score Auditoría</div>
              <div className="text-4xl font-black text-gray-900">{report.score}</div>
              <div className="text-xs font-semibold text-blue-600 mt-1">Escala de 1 a 10.0</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-purple-50 rounded-bl-xl text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Cumplimiento</div>
              <div className="text-4xl font-black text-gray-900">{report.percentage}%</div>
              <div className="text-xs font-semibold text-purple-600 mt-1">Nivel de excelencia</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-green-50 rounded-bl-xl text-green-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">KPIs Aprobados</div>
              <div className="text-4xl font-black text-gray-900">{passCount}</div>
              <div className="text-xs font-semibold text-green-600 mt-1">De 12 parámetros evaluables</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-amber-50 rounded-bl-xl text-amber-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Muestra Chat</div>
              <div className="text-4xl font-black text-gray-900">{report.totalConversations}</div>
              <div className="text-xs font-semibold text-amber-600 mt-1">Mensajes analizados</div>
            </div>
          </div>

          {/* Summary Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Fortalezas Identificadas</h3>
              </div>
              <ul className="space-y-4">
                {report.summary.strengths.map((strength, index) => (
                  <li key={index} className="flex gap-3 text-sm text-gray-700 leading-relaxed group/item">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold text-[10px]">✓</span>
                    <span className="font-medium">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 p-2 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Oportunidades de Mejora</h3>
              </div>
              <ul className="space-y-4">
                {report.summary.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-bold text-[10px]">!</span>
                    <span className="font-medium">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Metrics Table Premium */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <Layout className="h-5 w-5 text-blue-400" />
                Desglose de Auditoría por Punto
              </h3>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                12 KPIs Evaluados
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-gray-100">
              {report.detailedMetrics.map((metric, index) => (
                <div key={index} className="p-6 hover:bg-gray-50/80 transition-colors flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-800 leading-tight pr-4">
                      {metric.parameter}
                    </h4>
                    {metric.status === "pass" ? (
                      <div className="bg-green-100 text-green-600 p-1 rounded-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="bg-red-100 text-red-600 p-1 rounded-lg">
                        <X className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mb-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${metric.status === 'pass' ? 'bg-green-500' : 'bg-red-400'}`}
                        style={{ width: metric.status === 'pass' ? '100%' : '30%' }}
                      ></div>
                    </div>
                    <p className="text-[11px] font-medium text-gray-500 italic">{metric.details}</p>
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
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                    <Download className="h-4 w-4" />
                    Exportar PDF
                </>
              )}
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
