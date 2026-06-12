// dashboard/src/components/conversaciones/ReportModal.jsx
'use client'

import { useEffect, useCallback } from 'react'
import { X, Edit3, Download, Sparkles, Loader2 } from 'lucide-react'

/**
 * Modal para generar reportes de auditoría con IA
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.prompt — texto del prompt personalizable
 * @param {Function} props.onPromptChange — (newPrompt) => void
 * @param {boolean} props.loading — si está generando el reporte
 * @param {Object|null} props.reportData — datos del reporte generado
 * @param {string|null} props.error
 * @param {Function} props.onGenerate — handler para generar PDF
 * @param {Function} props.onDownload — handler para descargar PDF nuevamente
 */
export default function ReportModal({
  isOpen,
  onClose,
  prompt,
  onPromptChange,
  loading,
  reportData,
  error,
  onGenerate,
  onDownload,
}) {
  // Cerrar con Escape (solo si no está cargando)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !loading) {
      onClose()
    }
  }, [onClose, loading])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">
              Reporte IA
            </p>
            <h3 id="report-modal-title" className="text-2xl font-semibold text-slate-900">
              Generar reporte del asesor
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Analizaremos todas las conversaciones recientes para
              identificar aciertos, riesgos y oportunidades.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={loading}
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
              <Edit3 className="h-4 w-4 text-purple-600" />
              Prompt para IA
            </div>
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:ring-4 focus:ring-purple-100 focus:border-purple-300"
            />
            <p className="mt-2 text-xs text-slate-500">
              Puedes personalizar el enfoque del reporte agregando
              instrucciones específicas (productos, campañas, etc.).
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                    Conversaciones
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reportData.summary?.totalChats ?? '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                    Ventas logradas
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {reportData.summary?.salesCompleted ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                    Promedio respuesta
                  </p>
                  <p className="mt-2 text-2xl font-bold text-indigo-700">
                    {reportData.summary?.averageResponseMinutes
                      ? `${reportData.summary.averageResponseMinutes} min`
                      : 'N/D'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2 uppercase tracking-[0.2em]">
                    Momentos destacados
                  </h4>
                  <div className="space-y-3 text-sm text-slate-700">
                    {reportData.evidence?.highlightedWins?.length ? (
                      reportData.evidence.highlightedWins.map((item, idx) => (
                        <div
                          key={`win-${idx}`}
                          className="rounded-xl border border-white/70 bg-white px-3 py-2 shadow-sm"
                        >
                          <p className="font-semibold text-slate-900">
                            {item.contact} · {item.responseMinutes} min
                          </p>
                          <p className="text-xs text-slate-500">
                            Cliente: {item.clientSnippet}
                          </p>
                          <p className="text-xs text-slate-500">
                            Asesor: {item.advisorSnippet}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Aún no hay registros.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2 uppercase tracking-[0.2em]">
                    Respuestas tardías
                  </h4>
                  <div className="space-y-3 text-sm text-slate-700">
                    {reportData.evidence?.lateResponses?.length ? (
                      reportData.evidence.lateResponses.map((item, idx) => (
                        <div
                          key={`late-${idx}`}
                          className="rounded-xl border border-amber-100 bg-white px-3 py-2 shadow-sm"
                        >
                          <p className="font-semibold text-slate-900">
                            {item.contact} · {item.responseMinutes} min
                          </p>
                          <p className="text-xs text-slate-500">
                            Cliente: {item.clientSnippet}
                          </p>
                          <p className="text-xs text-slate-500">
                            Asesor: {item.advisorSnippet}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Sin demoras relevantes.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-[0.2em]">
                  Motivos de mejora detectados
                </h4>
                <div className="space-y-2 text-sm text-slate-700">
                  {reportData.evidence?.improvementReasons?.length ? (
                    reportData.evidence.improvementReasons.map((item, idx) => (
                      <p key={`improve-${idx}`}>
                        <span className="font-semibold text-slate-900">
                          {item.contact}:
                        </span>{' '}
                        {item.reason}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      Sin observaciones registradas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            El reporte se descargará en PDF automáticamente al generarse.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            {reportData && (
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            )}
            <button
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
