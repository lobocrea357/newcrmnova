'use client'

import { useMemo, useState } from 'react'
import { Edit3, MessageCircle, Clock3, Award, Sparkles } from 'lucide-react'

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

export default function MessageInsightsPanel({ messages = [] }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)

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

  return (
    <aside className="hidden xl:flex w-full max-w-sm flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">IA Coach</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">Mejoras en los mensajes</h2>
        <p className="text-sm text-slate-500">
          Ajusta el prompt y repasa las mejores respuestas para imitar el tono adecuado.
        </p>
      </div>

      <div className="px-5 py-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-[0.3em]">
          <Edit3 className="h-4 w-4 text-indigo-500" />
          Prompt del asesor
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-28 p-3 border border-indigo-100 rounded-2xl text-sm text-slate-700 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300"
        />
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          Ajusta el texto para guiar futuras respuestas del asesor.
        </p>
      </div>

  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <section className="space-y-3">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">Mensajes destacados</p>
            <h3 className="text-base font-semibold text-slate-900">Respuestas que funcionaron</h3>
            <p className="text-sm text-slate-500">Toma nota de cómo el asesor atiende las solicitudes del cliente.</p>
          </header>

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

        <section className="space-y-3">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">Momentos destacados</p>
            <h3 className="text-base font-semibold text-slate-900">Respuesta óptima en tiempo y calidad</h3>
            <p className="text-sm text-slate-500">
              Identificamos cuándo el asesor resolvió con rapidez y claridad lo que el cliente necesitaba.
            </p>
          </header>

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
      </div>
    </aside>
  )
}
