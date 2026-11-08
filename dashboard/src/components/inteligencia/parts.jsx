'use client';

import Link from 'next/link';
import { Check, X, MessageSquareText } from 'lucide-react';
import { Badge, ScoreBar, cx, scoreTone } from '@/components/ui/kit';
import { CRITERIA, ESTADOS, INTERES, fmtUsd, fmtFecha, fmtPct } from '@/lib/inteligencia';

export function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.desconocido;
  return <Badge tone={e.tone} dot>{e.label}</Badge>;
}

/** Ruta del chat según el tipo de bot (los *_other viven en /other). */
export function chatHref(ev) {
  const other = String(ev.bots?.session_name || '').toLowerCase().endsWith('_other');
  return `${other ? '/other' : ''}/conversaciones/chat/${ev.chat_id}?botId=${ev.bot_id}`;
}

export function PctBadge({ value }) {
  return <Badge tone={scoreTone(value)} className="tabular">{fmtPct(value)}</Badge>;
}

/** Lista de criterios cumplidos / no cumplidos de una evaluación v2. */
export function CriteriaChecklist({ ev, compact = false }) {
  if (ev.analysis_version !== 'v2') {
    return <p className="text-sm text-gray-500">Evaluación anterior al sistema actual: no tiene el detalle por criterio.</p>;
  }
  return (
    <ul className={cx('grid gap-x-6 gap-y-1.5', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
      {CRITERIA.map((c) => {
        const ok = !!ev[c.key];
        return (
          <li key={c.key} className="flex items-center gap-2 text-sm">
            {ok ? (
              <Check className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2.2} aria-label="Cumplido" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-gray-300" strokeWidth={2.2} aria-label="No cumplido" />
            )}
            <span className={ok ? 'text-gray-800' : 'text-gray-500'}>{c.label}</span>
            <span className="ml-auto text-xs tabular text-gray-400">{c.weight}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Ficha completa de una evaluación. `showChatLink` para abrir la conversación. */
export function EvaluationCard({ ev, showChatLink = true, compact = false }) {
  if (!ev) return null;
  const r = ev.resultado_comercial || {};
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <EstadoBadge estado={ev.estado} />
        {ev.interest_level && <Badge>Interés {INTERES[ev.interest_level]?.toLowerCase() || ev.interest_level}</Badge>}
        {ev.lead_caliente && <Badge tone="warning">Lead caliente</Badge>}
        {ev.valor && <Badge tone="info">{fmtUsd(ev.valor)}</Badge>}
        <span className="ml-auto text-xs text-gray-500">Evaluado {fmtFecha(ev.evaluation_date)}</span>
      </div>

      {ev.estado !== 'no_aplica' && (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <p className="text-sm font-medium text-tinta">Calidad de la atención</p>
            {r.tiempo_respuesta_promedio_min != null && (
              <p className="text-xs text-gray-500">Responde en {r.tiempo_respuesta_promedio_min} min de media</p>
            )}
          </div>
          <ScoreBar value={ev.percentage} />
        </div>
      )}

      {ev.resumen && <p className="text-sm leading-relaxed text-gray-700">{ev.resumen}</p>}

      {ev.siguiente_accion && (
        <div className="rounded-lg border border-nova-200 bg-nova-50 px-4 py-3">
          <p className="text-xs font-medium text-nova-700">Siguiente paso</p>
          <p className="mt-0.5 text-sm text-nova-900">{ev.siguiente_accion}</p>
        </div>
      )}

      {ev.motivo && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-red-700">Motivo de pérdida:</span> {ev.motivo}
        </p>
      )}

      {(ev.errores?.length > 0 || ev.exitos?.length > 0) && (
        <div className={cx('grid gap-4', !compact && 'sm:grid-cols-2')}>
          {ev.errores?.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-tinta">Qué falló</p>
              <ul className="space-y-1">
                {ev.errores.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ev.exitos?.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-tinta">Qué hizo bien</p>
              <ul className="space-y-1">
                {ev.exitos.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {ev.estado !== 'no_aplica' && (
        <div>
          <p className="mb-2 text-sm font-medium text-tinta">Criterios</p>
          <CriteriaChecklist ev={ev} compact={compact} />
        </div>
      )}

      {showChatLink && (
        <Link
          href={chatHref(ev)}
          className="inline-flex items-center gap-2 text-sm font-medium text-nova-700 hover:text-nova-800"
        >
          <MessageSquareText className="h-4 w-4" /> Abrir conversación
        </Link>
      )}
    </div>
  );
}
