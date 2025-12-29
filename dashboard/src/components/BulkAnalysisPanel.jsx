'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { Sparkles, X, Download, Loader2, CheckCircle, XCircle, AlertCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react'

const DEFAULT_PROMPT = `Eres un experto analista de ventas y calidad de atención al cliente especializado en venta de boletos/tickets de viaje.

Analiza la siguiente conversación de WhatsApp entre un Asesor y un Cliente.

## CRITERIOS PARA DETERMINAR SI LA VENTA SE CONCRETÓ:

Una venta se considera CONCRETADA (sale_completed: true) ÚNICAMENTE cuando se cumplen AMBAS condiciones:
1. **Confirmación de pago**: El cliente realizó el pago (completo o financiado) Y el asesor confirma haberlo recibido/verificado.
2. **Emisión del boleto/ticket**: El asesor menciona que va a emitir, está emitiendo, o ya emitió el boleto/ticket. Frases clave: "voy a emitir", "estás en lista de emisión", "procedo con la emisión", "tu boleto está siendo emitido", etc.

Una venta NO está concretada (sale_completed: false) si:
- Solo hubo cotización o consulta de precios
- El cliente mostró interés pero no pagó
- Hubo negociación pero sin cierre
- El cliente pidió tiempo para pensar
- No hay mención de confirmación de pago NI emisión de boleto

## TU TAREA:
1. Determinar si la venta se concretó según los criterios anteriores
2. Evaluar la calidad de atención del asesor (amabilidad, rapidez, claridad, proactividad)
3. Identificar momentos clave de la conversación
4. Si no hubo venta, explicar brevemente por qué

## FORMATO DE RESPUESTA (JSON estricto):
{
  "sale_completed": boolean,
  "failure_reason": string,
  "advisor_performance": string,
  "key_moments": string[]
}`

export default function BulkAnalysisPanel({ sessionToken }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [reportData, setReportData] = useState(null)
    const [error, setError] = useState(null)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT)
    const [showPrompt, setShowPrompt] = useState(false)
    const [progress, setProgress] = useState('')
    const [expandedBots, setExpandedBots] = useState({})

    const toggleBot = (botName) => {
        setExpandedBots(prev => ({
            ...prev,
            [botName]: !prev[botName]
        }))
    }

    const handleAnalyze = async () => {
        setIsAnalyzing(true)
        setError(null)
        setReportData(null)
        setProgress('Obteniendo los 15 chats más recientes de cada bot...')

        try {
            const response = await fetch('/api/analyze-bulk-chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
                },
                body: JSON.stringify({
                    customPrompt,
                    chatsPerBot: 15
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al analizar los chats')
            }

            setReportData(data)
            setProgress('')
        } catch (err) {
            setError(err.message)
            setProgress('')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const generatePdfReport = () => {
        if (!reportData) return

        const doc = new jsPDF({ unit: 'mm', format: 'a4' })
        const pageWidth = doc.internal.pageSize.getWidth()
        const marginX = 15
        const contentWidth = pageWidth - marginX * 2
        let cursorY = 20

        const ensureSpace = (space = 12) => {
            if (cursorY + space > 280) {
                doc.addPage()
                cursorY = 20
            }
        }

        const addTitle = (text, size = 16) => {
            ensureSpace(15)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(size)
            doc.setTextColor(36, 33, 93)
            doc.text(text, marginX, cursorY)
            cursorY += size * 0.5 + 4
        }

        const addSubtitle = (text) => {
            ensureSpace(10)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(12)
            doc.setTextColor(60, 60, 80)
            doc.text(text, marginX, cursorY)
            cursorY += 8
        }

        const addParagraph = (text, indent = 0) => {
            if (!text) return
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(50, 50, 60)
            const lines = doc.splitTextToSize(text, contentWidth - indent)
            lines.forEach(line => {
                ensureSpace(6)
                doc.text(line, marginX + indent, cursorY)
                cursorY += 5
            })
            cursorY += 2
        }

        const addStatBox = (label, value, color) => {
            ensureSpace(25)
            doc.setDrawColor(200, 200, 220)
            doc.setFillColor(...color)
            doc.roundedRect(marginX, cursorY, contentWidth / 3 - 4, 20, 3, 3, 'FD')
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 120)
            doc.text(label, marginX + 4, cursorY + 7)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(14)
            doc.setTextColor(30, 30, 50)
            doc.text(String(value), marginX + 4, cursorY + 16)
        }

        // Header
        doc.setFillColor(36, 33, 93)
        doc.roundedRect(marginX, cursorY, contentWidth, 25, 4, 4, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(255, 255, 255)
        doc.text('Reporte de Análisis IA - 15 Chats por Asesor', marginX + 6, cursorY + 15)
        doc.setFontSize(10)
        doc.text(new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }), marginX + contentWidth - 6, cursorY + 15, { align: 'right' })
        cursorY += 35

        // Resumen ejecutivo
        addTitle('Resumen Ejecutivo', 14)

        const { summary } = reportData
        addParagraph(`Se analizaron ${summary.totalChatsAnalyzed} conversaciones recientes de todos los asesores, con un total de ${summary.totalMessages} mensajes procesados.`)
        addParagraph(`De las conversaciones analizadas, ${summary.salesCompleted} resultaron en ventas concretadas y ${summary.salesNotCompleted} no lograron el cierre.`)
        if (summary.averageResponseTime) {
            addParagraph(`El tiempo promedio de respuesta fue de ${summary.averageResponseTime} minutos, con picos de hasta ${summary.worstResponseTime} minutos en los casos más lentos.`)
        }
        if (summary.chatsWithDelays > 0) {
            addParagraph(`⚠️ Se detectaron ${summary.chatsWithDelays} conversaciones con demoras significativas (>30 min).`)
        }
        cursorY += 5

        // Estadísticas en grid
        addTitle('Estadísticas Generales', 14)

        const statsStartY = cursorY
        const statWidth = (contentWidth - 8) / 3

        // Fila 1
        doc.setDrawColor(200, 220, 200)
        doc.setFillColor(240, 255, 240)
        doc.roundedRect(marginX, cursorY, statWidth, 22, 3, 3, 'FD')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80, 120, 80)
        doc.text('Ventas Concretadas', marginX + 4, cursorY + 8)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(34, 139, 34)
        doc.text(String(summary.salesCompleted), marginX + 4, cursorY + 18)

        doc.setDrawColor(255, 200, 200)
        doc.setFillColor(255, 245, 245)
        doc.roundedRect(marginX + statWidth + 4, cursorY, statWidth, 22, 3, 3, 'FD')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(180, 80, 80)
        doc.text('Sin Cierre', marginX + statWidth + 8, cursorY + 8)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(180, 50, 50)
        doc.text(String(summary.salesNotCompleted), marginX + statWidth + 8, cursorY + 18)

        doc.setDrawColor(200, 200, 240)
        doc.setFillColor(245, 245, 255)
        doc.roundedRect(marginX + (statWidth + 4) * 2, cursorY, statWidth, 22, 3, 3, 'FD')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 140)
        doc.text('Tiempo Prom. Respuesta', marginX + (statWidth + 4) * 2 + 4, cursorY + 8)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(60, 60, 140)
        doc.text(summary.averageResponseTime ? `${summary.averageResponseTime} min` : 'N/D', marginX + (statWidth + 4) * 2 + 4, cursorY + 18)

        cursorY += 30

        // Análisis por Asesor
        addTitle('Resultados por Asesor', 14)

        Object.entries(reportData.analysisByBot || {}).forEach(([botName, botData]) => {
            ensureSpace(20)
            addSubtitle(`📱 ${botName}`)
            addParagraph(`Ventas: ${botData.salesCompleted} | Sin cierre: ${botData.salesNotCompleted} | Total chats: ${botData.chats.length}`, 4)
            cursorY += 3
        })

        // Detalle de cada análisis
        doc.addPage()
        cursorY = 20
        addTitle('Detalle de Análisis Individual', 14)

        reportData.analyses?.forEach((result, index) => {
            ensureSpace(50)

            // Header del chat
            const saleColor = result.analysis?.sale_completed ? [220, 255, 220] : [255, 230, 230]
            doc.setDrawColor(180, 180, 200)
            doc.setFillColor(...saleColor)
            doc.roundedRect(marginX, cursorY, contentWidth, 12, 2, 2, 'FD')

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(40, 40, 60)
            doc.text(`${index + 1}. ${result.contactName} (${result.botName})`, marginX + 4, cursorY + 8)

            const statusText = result.analysis?.sale_completed ? '✓ VENTA' : '✗ SIN VENTA'
            doc.text(statusText, marginX + contentWidth - 4, cursorY + 8, { align: 'right' })
            cursorY += 16

            if (result.analysis) {
                if (!result.analysis.sale_completed && result.analysis.failure_reason) {
                    addParagraph(`Razón: ${result.analysis.failure_reason}`, 4)
                }

                if (result.analysis.advisor_performance) {
                    addParagraph(`Desempeño: ${result.analysis.advisor_performance.substring(0, 200)}...`, 4)
                }

                if (result.analysis.key_moments?.length > 0) {
                    addParagraph(`Momentos clave: ${result.analysis.key_moments.slice(0, 2).join(' | ')}`, 4)
                }
            }

            cursorY += 5
        })

        // Guardar PDF
        const dateStr = new Date().toISOString().split('T')[0]
        doc.save(`reporte_analisis_ia_${dateStr}.pdf`)
    }

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setIsPanelOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-white font-semibold shadow-2xl hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
                <Sparkles className="h-5 w-5" />
                Análisis IA Global
            </button>

            {/* Overlay */}
            {isPanelOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30"
                    onClick={() => setIsPanelOpen(false)}
                />
            )}

            {/* Panel lateral */}
            <aside
                className={`fixed top-0 right-0 z-40 h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <header className="px-5 py-4 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-purple-500 font-semibold">
                                Análisis Masivo
                            </p>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                Reporte IA Global
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Analiza los 15 chats más recientes de <strong>cada bot</strong> y genera un reporte consolidado.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPanelOpen(false)}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label="Cerrar panel"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    {/* Controles */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <button
                            onClick={() => setShowPrompt(!showPrompt)}
                            className="text-sm font-medium text-purple-600 hover:text-purple-800 underline-offset-4 hover:underline"
                        >
                            {showPrompt ? 'Ocultar instrucciones' : 'Configurar prompt'}
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors ${isAnalyzing
                                ? 'bg-purple-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                }`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Analizando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Iniciar Análisis
                                </>
                            )}
                        </button>
                    </div>

                    {/* Editor de prompt */}
                    {showPrompt && (
                        <div className="px-5 py-4 border-b border-gray-100 bg-purple-50/40">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prompt del Sistema (Instrucciones para la IA)
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="w-full h-28 p-3 border border-purple-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-100 focus:border-purple-400 bg-white/80"
                                placeholder="Escribe aquí las instrucciones para la IA..."
                            />
                        </div>
                    )}

                    {/* Contenido principal */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {/* Estado inicial */}
                        {!reportData && !isAnalyzing && !error && (
                            <div className="text-center text-gray-500 py-10 border-2 border-dashed border-purple-100 rounded-2xl">
                                <FileText className="h-12 w-12 mx-auto text-purple-300 mb-3" />
                                <p className="font-medium text-gray-600">Pulsa "Iniciar Análisis" para comenzar.</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Se analizarán los 15 chats más recientes de <strong>cada asesor</strong>.
                                </p>
                            </div>
                        )}

                        {/* Loading */}
                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-200 border-t-purple-600 mb-4"></div>
                                <p className="text-gray-600 animate-pulse">{progress || 'Analizando conversaciones con IA...'}</p>
                                <p className="text-sm text-gray-400 mt-2">Esto puede tomar unos minutos...</p>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Error en el análisis</p>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Resultados */}
                        {reportData && (
                            <div className="space-y-4 animate-fadeIn">
                                {/* Resumen */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-100">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Análisis Completado
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-white p-3 rounded-xl">
                                            <p className="text-gray-500 text-xs">Chats analizados</p>
                                            <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalChatsAnalyzed}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl">
                                            <p className="text-gray-500 text-xs">Mensajes procesados</p>
                                            <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalMessages}</p>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                                            <p className="text-green-700 text-xs">Ventas concretadas</p>
                                            <p className="text-2xl font-bold text-green-700">{reportData.summary.salesCompleted}</p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                                            <p className="text-red-700 text-xs">Sin cierre</p>
                                            <p className="text-2xl font-bold text-red-700">{reportData.summary.salesNotCompleted}</p>
                                        </div>
                                    </div>
                                    {reportData.summary.averageResponseTime && (
                                        <div className="mt-3 text-sm text-gray-600">
                                            <span className="font-medium">Tiempo promedio de respuesta:</span> {reportData.summary.averageResponseTime} min
                                        </div>
                                    )}
                                </div>

                                {/* Resultados por Bot con Acordeones */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-600" />
                                        Análisis por Asesor
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(reportData.analysisByBot || {}).map(([botName, botData]) => {
                                            const isExpanded = expandedBots[botName]
                                            const botChats = botData.chats || []

                                            return (
                                                <div key={botName} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    {/* Header del Bot - Siempre visible */}
                                                    <button
                                                        onClick={() => toggleBot(botName)}
                                                        className="w-full p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4 text-gray-600" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-gray-600" />
                                                            )}
                                                            <span className="text-sm font-semibold text-gray-900">📱 {botName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                {botChats.length} chats
                                                            </span>
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                                ✔ {botData.salesCompleted}
                                                            </span>
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                                ✖ {botData.salesNotCompleted}
                                                            </span>
                                                        </div>
                                                    </button>

                                                    {/* Detalle expandible - Solo si está expandido */}
                                                    {isExpanded && (
                                                        <div className="p-3 bg-white space-y-2 max-h-96 overflow-y-auto">
                                                            {botChats.map((result, idx) => (
                                                                <div
                                                                    key={result.chatId}
                                                                    className={`p-3 rounded-lg border transition-all hover:shadow-md ${result.analysis?.sale_completed
                                                                            ? 'bg-green-50 border-green-200 hover:border-green-300'
                                                                            : 'bg-red-50 border-red-200 hover:border-red-300'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-medium text-gray-500">
                                                                                    #{idx + 1}
                                                                                </span>
                                                                                <span className="text-sm font-semibold text-gray-900 truncate">
                                                                                    {result.contactName}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                {result.messageCount} mensajes
                                                                            </p>
                                                                        </div>
                                                                        {result.analysis?.sale_completed ? (
                                                                            <span className="flex items-center gap-1 px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded whitespace-nowrap">
                                                                                <CheckCircle className="h-3 w-3" /> VENTA
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center gap-1 px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded whitespace-nowrap">
                                                                                <XCircle className="h-3 w-3" /> SIN VENTA
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Razón de fallo */}
                                                                    {!result.analysis?.sale_completed && result.analysis?.failure_reason && (
                                                                        <div className="mt-2 pt-2 border-t border-red-200">
                                                                            <p className="text-xs text-red-700 font-medium">
                                                                                📉 Razón: {result.analysis.failure_reason}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Desempeño del asesor */}
                                                                    {result.analysis?.advisor_performance && (
                                                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                                                            <p className="text-xs text-gray-600 line-clamp-2">
                                                                                📊 {result.analysis.advisor_performance}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Botón de descarga */}
                                <button
                                    onClick={generatePdfReport}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    <Download className="h-5 w-5" />
                                    Descargar Reporte PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}
