'use client'

import { useMemo, useState, useRef } from 'react'
import { Edit3, MessageCircle, Clock3, Award, Sparkles, MoreVertical, Menu } from 'lucide-react'

const DEFAULT_PROMPT = `Eres un experto en atención al cliente.
Evalúa cómo responder mejor basándote en ejemplos de esta conversación.`

const formatResponseTime = (minutes) => {
  if (minutes === null || minutes === undefined) return 's/d'
  if (minutes < 1) return `${Math.round(minutes * 60)}s`
  if (minutes < 60) return `${minutes.toFixed(1)} min`
  const hours = minutes / 60
  if (hours < 24) return `${hours.toFixed(1)} h`
  return `${(hours / 24).toFixed(1)} d`
}

// Componente reutilizable para popover de información
function InfoPopover({ isOpen, onClose, children }) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white rounded-xl shadow-lg border border-slate-200 z-20">
        <p className="text-sm text-slate-600">
          {children}
        </p>
      </div>
    </>
  )
}

// Componente para header de sección con popover
function SectionHeader({ label, title, description, labelColor = 'text-purple-500' }) {
  const [showPopover, setShowPopover] = useState(false)

  return (
    <header className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${labelColor}`}>{label}</p>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {/* Descripción visible solo en pantallas grandes (xl+) */}
        <p className="text-sm text-slate-500 hidden xl:block">{description}</p>
      </div>

      {/* Botón de 3 puntos para pantallas hasta lg */}
      <div className="relative xl:hidden flex-shrink-0">
        <button
          onClick={() => setShowPopover(!showPopover)}
          className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Ver descripción"
        >
          <MoreVertical className="h-4 w-4 text-slate-400" />
        </button>
        <InfoPopover isOpen={showPopover} onClose={() => setShowPopover(false)}>
          {description}
        </InfoPopover>
      </div>
    </header>
  )
}

export default function MessageInsightsPanel({ messages = [] }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [showInfoPopover, setShowInfoPopover] = useState(false)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const scrollContainerRef = useRef(null)
  const promptSectionRef = useRef(null)
  const messagesSectionRef = useRef(null)
  const momentsSectionRef = useRef(null)

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }, [messages])

  const highlightedExchanges = useMemo(() => {
    if (!sortedMessages.length) return []

    const highlights = []
    for (let i = 0; i < sortedMessages.length; i++) {
      const clientMsg = sortedMessages[i]
      if (clientMsg.from_me) continue

      let advisorMsg = null
      for (let j = i + 1; j < sortedMessages.length; j++) {
        if (sortedMessages[j].from_me) {
          advisorMsg = sortedMessages[j]
          break
        }
      }

      if (advisorMsg) {
        const diffMinutes = Math.max(
          0,
          (new Date(advisorMsg.timestamp) - new Date(clientMsg.timestamp)) / (1000 * 60)
        )
        highlights.push({
          id: `${clientMsg.id || i}-${advisorMsg.id || i}`,
          client: clientMsg,
          advisor: advisorMsg,
          responseMinutes: diffMinutes
        })
      }
    }

    return highlights
  }, [sortedMessages])

  const featuredMessages = useMemo(() => highlightedExchanges.slice(0, 3), [highlightedExchanges])

  const bestMoments = useMemo(() => {
    return [...highlightedExchanges]
      .filter((h) => h.responseMinutes !== null && h.responseMinutes !== undefined)
      .sort((a, b) => a.responseMinutes - b.responseMinutes)
      .slice(0, 4)
  }, [highlightedExchanges])

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setShowNavMenu(false)
  }

  return (
    <aside className="w-[300px] md:w-[340px] lg:w-[400px] xl:w-[440px] min-w-[300px] md:min-w-[340px] lg:min-w-[400px] xl:min-w-[440px] flex-shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
      {/* Header compacto */}
      <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">IA Coach</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Mejoras en los mensajes</h2>
            {/* Descripción visible solo en pantallas xl+ */}
            <p className="text-sm text-slate-500 hidden xl:block">
              Ajusta el prompt y repasa las mejores respuestas para imitar el tono adecuado.
            </p>
          </div>

          {/* Botón de 3 puntos para móvil y tablet (hasta lg) */}
          <div className="relative xl:hidden flex-shrink-0">
            <button
              onClick={() => setShowInfoPopover(!showInfoPopover)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Más información"
            >
              <MoreVertical className="h-5 w-5 text-slate-500" />
            </button>
            <InfoPopover isOpen={showInfoPopover} onClose={() => setShowInfoPopover(false)}>
              Ajusta el prompt y repasa las mejores respuestas para imitar el tono adecuado.
            </InfoPopover>
          </div>
        </div>
      </div>

      {/* Contenido scrollable unificado */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-6"
      >
        {/* Sección: Prompt del asesor */}
        <section ref={promptSectionRef} className="space-y-3 scroll-mt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-[0.3em]">
            <Edit3 className="h-4 w-4 text-indigo-500" />
            Prompt del asesor
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-28 p-3 border border-indigo-100 rounded-2xl text-sm text-slate-700 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 resize-none"
          />
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-500" />
            Ajusta el texto para guiar futuras respuestas del asesor.
          </p>
        </section>

        {/* Sección: Mensajes destacados */}
        <section ref={messagesSectionRef} className="space-y-3 scroll-mt-4">
          <SectionHeader
            label="Mensajes destacados"
            title="Respuestas que funcionaron"
            description="Toma nota de cómo el asesor atiende las solicitudes del cliente."
            labelColor="text-purple-500"
          />

          {featuredMessages.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-2xl">
              Analizaremos nuevos mensajes cuando estén disponibles.
            </div>
          ) : (
            featuredMessages.map((highlight) => (
              <div
                key={highlight.id}
                className="rounded-2xl border border-purple-100 bg-purple-50/40 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Solicitud del cliente
                    </p>
                    <p className="text-sm text-slate-800">
                      {highlight.client.body || '[Mensaje sin texto]'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-purple-500">
                        Respuesta del asesor
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                        <Clock3 className="h-3 w-3" />
                        {formatResponseTime(highlight.responseMinutes)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {highlight.advisor.body || '[Mensaje sin texto]'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Sección: Momentos destacados */}
        <section ref={momentsSectionRef} className="space-y-3 scroll-mt-4">
          <SectionHeader
            label="Momentos destacados"
            title="Respuesta óptima en tiempo y calidad"
            description="Identificamos cuándo el asesor resolvió con rapidez y claridad lo que el cliente necesitaba."
            labelColor="text-amber-500"
          />

          {bestMoments.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-2xl">
              No hay momentos destacados todavía.
            </div>
          ) : (
            bestMoments.map((moment, idx) => (
              <div
                key={moment.id}
                className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Award className="h-4 w-4 text-amber-600" />
                  Momento #{idx + 1} · {formatResponseTime(moment.responseMinutes)}
                </div>
                <p className="text-xs text-slate-500">
                  Cliente: {moment.client.body?.substring(0, 120) || '[Mensaje sin texto]'}
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  Asesor: {moment.advisor.body?.substring(0, 160) || '[Mensaje sin texto]'}
                </p>
              </div>
            ))
          )}
        </section>

        {/* Espaciado extra para que el botón flotante no tape contenido */}
        <div className="h-16" />
      </div>

      {/* Botón flotante de navegación - posicionado más arriba para no chocar con el botón de Análisis IA */}
      <div className="absolute bottom-20 right-4 md:bottom-4">
        <div className="relative">
          <button
            onClick={() => setShowNavMenu(!showNavMenu)}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
            aria-label="Navegar a sección"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Menú de navegación */}
          {showNavMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNavMenu(false)}
              />
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20">
                <button
                  onClick={() => scrollToSection(promptSectionRef)}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Edit3 className="h-4 w-4 text-indigo-500" />
                  <span>Prompt</span>
                </button>
                <button
                  onClick={() => scrollToSection(messagesSectionRef)}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                >
                  <MessageCircle className="h-4 w-4 text-purple-500" />
                  <span>Mensajes</span>
                </button>
                <button
                  onClick={() => scrollToSection(momentsSectionRef)}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                >
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Momentos</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
