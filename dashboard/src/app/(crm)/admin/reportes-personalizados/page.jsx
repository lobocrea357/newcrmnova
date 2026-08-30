'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { getBotsForUser } from '@/lib/supabase'
import { isOtherBot, parseBotSessionName } from '@/lib/botNameParser'
import { generateCustomPdfReport } from '@/lib/conversaciones/generateCustomPdfReport'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  FileSpreadsheet,
  Brain,
  CheckSquare,
  Square,
  Search,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Layers,
  ChevronRight,
  HelpCircle,
  Phone,
  ShieldCheck,
  XCircle,
  CheckCircle2
} from 'lucide-react'

const PROMPT_TEMPLATES = [
  {
    title: 'Auditoría General de Cierre',
    icon: '🎯',
    text: 'Audita el proceso de ventas completo: evalúa si los asesores filtran las necesidades del cliente, envían opciones claras de vuelos o paquetes, manejan objeciones sobre precio y empujan por un cierre profesional.'
  },
  {
    title: 'Tiempos de Respuesta Críticos',
    icon: '⏱️',
    text: 'Analiza los tiempos de respuesta de los asesores. Identifica demoras superiores a 15-30 minutos en responder y evalúa si el contacto inicial con nuevos leads fue inmediato.'
  },
  {
    title: 'Manejo de Objeciones y No Venta',
    icon: '💬',
    text: 'Enfócate en las conversaciones donde NO se concretó la venta. Identifica cuáles fueron las objeciones principales del cliente (precio, aerolínea, fechas, financiamiento) y si el asesor supo rebatirlas.'
  },
  {
    title: 'Calidad de Cotizaciones y Asesoría',
    icon: '✈️',
    text: 'Evalúa la calidad de la cotización enviada por el asesor: claridad en itinerarios, mención de métodos de pago o financiamiento (Scalapay), y si ofreció más de 2 alternativas al cliente.'
  },
  {
    title: 'Seguimiento y Recuperación de Leads',
    icon: '🔄',
    text: 'Revisa si los asesores realizan seguimiento activo y estructurado a los clientes que dejaron de responder o quedaron en pensarlo, y si proponen nuevas opciones para reactivar la conversación.'
  }
]

const TIMEFRAME_OPTIONS = [
  { value: '24h', label: 'Últimas 24 horas' },
  { value: '3d', label: 'Últimos 3 días' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '15d', label: 'Últimos 15 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'all', label: 'Todo el historial' },
]

const SAMPLE_OPTIONS = [
  { value: 5, label: '5 chats por asesor (Rápido)' },
  { value: 10, label: '10 chats por asesor (Recomendado)' },
  { value: 15, label: '15 chats por asesor (Profundo)' },
  { value: 25, label: '25 chats por asesor (Exhaustivo)' },
]

export default function CustomReportsPage() {
  const { session } = useAuth()
  const { isSuperAdmin, isAdmin, isManager } = useUserProfile()

  const [bots, setBots] = useState([])
  const [loadingBots, setLoadingBots] = useState(true)
  const [selectedBotIds, setSelectedBotIds] = useState([])
  const [botSearch, setBotSearch] = useState('')
  const [selectedSede, setSelectedSede] = useState('all')

  const [userPrompt, setUserPrompt] = useState('')
  const [timeframe, setTimeframe] = useState('7d')
  const [maxChats, setMaxChats] = useState(10)

  const [generating, setGenerating] = useState(false)
  const [reportResult, setReportResult] = useState(null)
  const [reportError, setReportError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeAdvisorTab, setActiveAdvisorTab] = useState(0)

  // Cargar bots elegibles (excluyendo automáticamente sesiones "_other")
  useEffect(() => {
    async function loadEligibleBots() {
      try {
        setLoadingBots(true)
        const allBots = await getBotsForUser(null)
        // Filtrar estrictamente excluyendo sesiones "other"
        const eligible = (allBots || []).filter(b => !isOtherBot(b.session_name))
        setBots(eligible)
      } catch (err) {
        console.error('Error cargando asesores:', err)
      } finally {
        setLoadingBots(false)
      }
    }
    loadEligibleBots()
  }, [])

  // Filtrado de asesores en el checklist
  const filteredBots = useMemo(() => {
    return bots.filter(bot => {
      const meta = parseBotSessionName(bot.session_name)
      const matchesSearch =
        meta.fullName.toLowerCase().includes(botSearch.toLowerCase()) ||
        (bot.session_name || '').toLowerCase().includes(botSearch.toLowerCase()) ||
        (bot.phone_number || '').includes(botSearch)

      const matchesSede = selectedSede === 'all' || meta.sedeKey === selectedSede
      return matchesSearch && matchesSede
    })
  }, [bots, botSearch, selectedSede])

  // Obtener sedes únicas para el filtro
  const sedesAvailable = useMemo(() => {
    const sSet = new Set()
    bots.forEach(b => {
      const meta = parseBotSessionName(b.session_name)
      if (meta.sedeKey) sSet.add(meta.sedeKey)
    })
    return Array.from(sSet)
  }, [bots])

  const handleSelectAll = () => {
    setSelectedBotIds(filteredBots.map(b => b.id))
  }

  const handleDeselectAll = () => {
    setSelectedBotIds([])
  }

  const handleToggleBot = (botId) => {
    setSelectedBotIds(prev =>
      prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
    )
  }

  const handleGenerateReport = async () => {
    if (selectedBotIds.length === 0) {
      setReportError('Debes seleccionar al menos un asesor para auditar.')
      return
    }

    if (!userPrompt.trim()) {
      setReportError('Por favor ingresa lo que necesitas evaluar o reportar en el campo de instrucciones.')
      return
    }

    setGenerating(true)
    setReportError(null)
    setReportResult(null)

    try {
      const response = await fetch('/api/custom-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          botIds: selectedBotIds,
          userPrompt: userPrompt.trim(),
          timeframe,
          maxChatsPerAdvisor: maxChats
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el reporte con IA.')
      }

      setReportResult(data)
      setActiveAdvisorTab(0)
    } catch (err) {
      console.error('Error generando reporte personalizado:', err)
      setReportError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!reportResult) return
    const tfLabel = TIMEFRAME_OPTIONS.find(t => t.value === timeframe)?.label || timeframe
    generateCustomPdfReport(reportResult, {
      userPrompt,
      timeframe: tfLabel
    })
  }

  const handleCopyWhatsApp = () => {
    if (!reportResult?.aiNarrative) return
    const nar = reportResult.aiNarrative
    const text = `📊 *${(nar.title || 'REPORTE DE AUDITORÍA IA').toUpperCase()}*
⭐ *Score General:* ${nar.generalScore || 'N/A'}/10
📅 *Período:* ${TIMEFRAME_OPTIONS.find(t => t.value === timeframe)?.label || timeframe}

📝 *Resumen Ejecutivo:*
${nar.executiveSummary || ''}

👥 *Resultados por Asesor:*
${(nar.advisors || []).map(a => `• *${a.advisorName}:* Score ${a.score}/10 (${a.salesCount || 0} ventas de ${a.chatsAnalyzed || 0} chats)`).join('\n')}

🎯 *Recomendaciones:*
${(nar.strategicRecommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}

_Generado automáticamente por el CRM Viajes Nova_`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="min-h-screen bg-gray-50/60 py-8 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Reportes Personalizados', href: '/admin/reportes-personalizados' }
        ]} />

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Auditoría IA Avanzada
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Reportes Personalizados
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Selecciona las sesiones de WAHA a auditar (sin incluir others), define tus requerimientos y genera tu reporte corporativo en PDF con análisis directo de las conversaciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {reportResult && (
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
            )}
          </div>
        </div>

        {/* Sección de Configuración y Filtros */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Checklist de Asesores (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Selecciona los Asesores
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sesiones de WhatsApp activas (excepto others)
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {selectedBotIds.length} / {bots.length}
              </span>
            </div>

            {/* Buscador y filtro de sede */}
            <div className="space-y-2.5 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={botSearch}
                  onChange={(e) => setBotSearch(e.target.value)}
                  placeholder="Buscar asesor o sesión..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {sedesAvailable.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSede('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                      selectedSede === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  {sedesAvailable.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSede(s)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors font-medium ${
                        selectedSede === s
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de selección rápida */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Seleccionar todos ({filteredBots.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-gray-500 hover:text-gray-700 font-semibold flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                Limpiar selección
              </button>
            </div>

            {/* Lista con checkboxes */}
            <div className="flex-1 max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {loadingBots ? (
                <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                  Cargando asesores...
                </div>
              ) : filteredBots.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No se encontraron asesores con los filtros actuales.
                </div>
              ) : (
                filteredBots.map((bot) => {
                  const isChecked = selectedBotIds.includes(bot.id)
                  const meta = parseBotSessionName(bot.session_name)
                  return (
                    <div
                      key={bot.id}
                      onClick={() => handleToggleBot(bot.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Manejado en onClick del contenedor
                        className="w-4 h-4 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {meta.fullName}
                          </p>
                          {bot.conversation_count !== undefined && (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {bot.conversation_count} chats
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                          <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                            {bot.session_name}
                          </span>
                          {meta.sedeLabel && (
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.2 rounded text-gray-600">
                              {meta.sedeLabel}
                            </span>
                          )}
                          {bot.phone_number && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {bot.phone_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Configuración del Reporte e Instrucciones (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tarjeta de Instrucciones del Administrador */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  ¿Qué necesitas reportar o auditar?
                </h2>
                <span className="text-xs text-gray-400 font-medium">System Prompt: PDF Report</span>
              </div>

              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={4}
                placeholder="Explica en detalle lo que necesitas evaluar. Ejemplo: 'Audita si los asesores están ofreciendo las opciones de financiamiento y si responden en menos de 5 minutos cuando el cliente pregunta por paquetes a Cancún'..."
                className="w-full p-3.5 bg-gray-50 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 placeholder:text-gray-400 resize-y"
              />

              {/* Chips de Plantillas Rápidas */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Plantillas sugeridas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setUserPrompt(tmpl.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-medium rounded-lg border border-gray-200/70 transition-colors text-left"
                      title={tmpl.text}
                    >
                      <span>{tmpl.icon}</span>
                      <span>{tmpl.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de tiempo y Muestra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Período / Rango de tiempo
                  </label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full py-2 px-3 bg-gray-50 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
                  >
                    {TIMEFRAME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Muestra de chats por asesor
                  </label>
                  <select
                    value={maxChats}
                    onChange={(e) => setMaxChats(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-gray-50 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
                  >
                    {SAMPLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error Message */}
              {reportError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {/* Botón de Generación */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating || selectedBotIds.length === 0 || !userPrompt.trim()}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analizando chats y generando reporte con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar Reporte Personalizado
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Visualizador del Reporte Generado */}
        {reportResult?.aiNarrative && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200 space-y-8 animate-fadeIn">
            
            {/* Header del Reporte */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Reporte Generado con Éxito
                  </span>
                  <span className="text-xs text-gray-500">
                    {TIMEFRAME_OPTIONS.find(t => t.value === timeframe)?.label}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">
                  {reportResult.aiNarrative.title || 'Informe Ejecutivo de Auditoría Comercial'}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyWhatsApp}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  title="Copiar texto formateado para WhatsApp"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '¡Copiado!' : 'Copiar para WhatsApp'}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
              </div>
            </div>

            {/* KPIs Generales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Score General</p>
                <p className="text-3xl font-black text-blue-900 mt-1">
                  {reportResult.aiNarrative.generalScore ? `${reportResult.aiNarrative.generalScore.toFixed(1)}/10` : 'N/A'}
                </p>
                <p className="text-xs text-blue-600 mt-1">Evaluación global</p>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Asesores Auditados</p>
                <p className="text-3xl font-black text-indigo-900 mt-1">
                  {reportResult.aiNarrative.advisors?.length || selectedBotIds.length}
                </p>
                <p className="text-xs text-indigo-600 mt-1">Sesiones procesadas</p>
              </div>

              <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Total Chats</p>
                <p className="text-3xl font-black text-purple-900 mt-1">
                  {reportResult.summary?.totalChats || 0}
                </p>
                <p className="text-xs text-purple-600 mt-1">Muestra analizada</p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Ventas Confirmadas</p>
                <p className="text-3xl font-black text-emerald-900 mt-1">
                  {(reportResult.aiNarrative.advisors || []).reduce((acc, a) => acc + (a.salesCount || 0), 0)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">En chats de muestra</p>
              </div>
            </div>

            {/* Resumen Ejecutivo */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Resumen Ejecutivo y Diagnóstico
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {reportResult.aiNarrative.executiveSummary}
              </p>
            </div>

            {/* Tabla Comparativa de Asesores */}
            {reportResult.aiNarrative.advisors?.length > 1 && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Tabla Comparativa entre Asesores
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Asesor / Sesión</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-center">Chats</th>
                        <th className="py-3 px-4 text-center">Ventas</th>
                        <th className="py-3 px-4">Puntos Fuertes</th>
                        <th className="py-3 px-4">Oportunidades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportResult.aiNarrative.advisors.map((adv, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {adv.advisorName}
                            <span className="block text-[10px] text-gray-400 font-mono">
                              {adv.botSessionName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${
                              adv.score >= 8 ? 'bg-emerald-100 text-emerald-800' :
                              adv.score >= 6 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {adv.score}/10
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-gray-600">
                            {adv.chatsAnalyzed || 0}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600">
                            {adv.salesCount || 0}
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                            {adv.keyStrengths?.[0] || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                            {adv.criticalIssues?.[0] || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Desglose Detallado por Asesor (Tabs) */}
            {reportResult.aiNarrative.advisors?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Auditoría Detallada por Asesor
                </h3>

                {/* Tabs de Asesores */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {reportResult.aiNarrative.advisors.map((adv, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveAdvisorTab(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeAdvisorTab === idx
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{adv.advisorName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        activeAdvisorTab === idx ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {adv.score}/10
                      </span>
                    </button>
                  ))}
                </div>

                {/* Contenido del Asesor Activo */}
                {reportResult.aiNarrative.advisors[activeAdvisorTab] && (() => {
                  const currentAdvisor = reportResult.aiNarrative.advisors[activeAdvisorTab]
                  return (
                    <div className="border border-gray-200 rounded-2xl p-6 space-y-6 bg-gray-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-black text-gray-900">
                            {currentAdvisor.advisorName}
                          </h4>
                          <p className="text-xs text-gray-500 font-mono">
                            Sesión WAHA: {currentAdvisor.botSessionName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">Puntuación:</span>
                          <span className={`text-xl font-black px-3 py-1 rounded-xl ${
                            currentAdvisor.score >= 8 ? 'bg-emerald-100 text-emerald-800' :
                            currentAdvisor.score >= 6 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {currentAdvisor.score} / 10
                          </span>
                        </div>
                      </div>

                      {/* Fortalezas y Debilidades */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
                          <p className="text-xs font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Fortalezas Clave
                          </p>
                          <ul className="space-y-1.5 text-xs text-emerald-900">
                            {(currentAdvisor.keyStrengths || []).map((st, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="font-bold">•</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4">
                          <p className="text-xs font-bold text-rose-800 uppercase mb-2 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            Oportunidades de Mejora / Fallas
                          </p>
                          <ul className="space-y-1.5 text-xs text-rose-900">
                            {(currentAdvisor.criticalIssues || []).map((is, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="font-bold">•</span>
                                <span>{is}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Casos Evaluados */}
                      {currentAdvisor.audits?.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                            Casos de Chat Analizados ({currentAdvisor.audits.length})
                          </h5>
                          <div className="space-y-3">
                            {currentAdvisor.audits.map((audit, cIdx) => (
                              <div key={cIdx} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-gray-900">
                                      {audit.client}
                                    </span>
                                    {audit.type && (
                                      <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                        {audit.type}
                                      </span>
                                    )}
                                    {audit.sale_closed && (
                                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                        Venta ✓
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold text-indigo-700">
                                    Score: {audit.score}/10
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  {audit.analysis}
                                </p>
                                {audit.chatQuote && (
                                  <div className="bg-indigo-50/50 border-l-2 border-indigo-400 p-2 text-[11px] text-indigo-900 italic rounded-r">
                                    "{audit.chatQuote}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Recomendaciones Estratégicas */}
            {reportResult.aiNarrative.strategicRecommendations?.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  Plan de Acción y Recomendaciones Estratégicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {reportResult.aiNarrative.strategicRecommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-gray-900 font-black text-xs inline-flex items-center justify-center mb-2">
                        {rIdx + 1}
                      </span>
                      <p className="text-xs text-blue-100 leading-relaxed">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón Descargar PDF al final */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                Descargar Reporte PDF Completo
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
