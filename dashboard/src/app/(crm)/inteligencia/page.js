'use client';

import Link from 'next/link';
import { Sparkles, MessagesSquare, BadgeCheck, Flame, Gauge } from 'lucide-react';
import { Panel, Stat, EmptyState, Skeleton, cx } from '@/components/ui/kit';
import { useHub } from '@/components/inteligencia/HubContext';
import { EstadoBadge, chatHref } from '@/components/inteligencia/parts';
import { resumen, cumplimiento, topFrases, ventasReales, fmtPct, fmtUsd } from '@/lib/inteligencia';

function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export default function ResumenIA() {
  const { evals, loading, error, withPeriod } = useHub();
  if (loading && !evals.length) return <Loading />;
  if (error) {
    return <Panel><EmptyState icon={Sparkles} title="No se pudieron cargar las evaluaciones" description={error} /></Panel>;
  }

  const r = resumen(evals);
  if (!r.total) {
    return (
      <Panel>
        <EmptyState
          icon={Sparkles}
          title="Todavía no hay conversaciones evaluadas en este periodo"
          description="La IA evalúa los chats de venta cuando llevan 45 minutos sin mensajes nuevos. Revisa de nuevo en unos minutos o elige un periodo más largo."
        />
      </Panel>
    );
  }

  const crit = cumplimiento(evals);
  const reales = ventasReales(evals);
  const atender = reales
    .filter((e) => (e.estado === 'en_negociacion' || e.estado === 'sin_respuesta') && e.siguiente_accion)
    .sort((a, b) =>
      (Number(b.lead_caliente) - Number(a.lead_caliente)) ||
      ((b.valor || 0) - (a.valor || 0)) ||
      (new Date(b.evaluation_date) - new Date(a.evaluation_date))
    )
    .slice(0, 8);
  const errores = topFrases(reales.map((e) => e.errores));
  const motivos = topFrases(reales.map((e) => (e.motivo ? [e.motivo] : [])));
  const critMedibles = crit.filter((c) => c.pct != null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat
          label="Conversaciones de venta"
          value={r.total}
          icon={MessagesSquare}
          hint={r.noAplica ? `${r.noAplica} internas o sin intención de compra no cuentan` : 'Evaluadas por la IA'}
        />
        <Stat label="Calidad media" value={fmtPct(r.calidad)} icon={Gauge} hint="Cumplimiento de los criterios de venta" />
        <Stat
          label="Ventas confirmadas"
          value={r.vendidas}
          icon={BadgeCheck}
          tone={r.vendidas ? 'success' : undefined}
          hint={`Conversión ${fmtPct(r.conversion)}${r.valorVendido ? ` · ${fmtUsd(r.valorVendido)}` : ''}`}
        />
        <Stat
          label="En negociación"
          value={r.enJuego}
          icon={Flame}
          tone={r.calientes ? 'warning' : undefined}
          hint={`${r.calientes} con interés alto${r.valorEnJuego ? ` · ${fmtUsd(r.valorEnJuego)} en juego` : ''}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Atender ahora"
          description="Clientes que siguen en juego, con el paso que recomienda la IA. Primero los de interés alto y mayor valor."
          padded={false}
          actions={<Link href={withPeriod('/inteligencia/conversaciones', { estado: 'en_negociacion' })} className="text-sm font-medium text-nova-700 hover:text-nova-800">Ver todas</Link>}
        >
          {atender.length ? (
            <ul className="divide-y divide-linea">
              {atender.map((e) => (
                <li key={e.id}>
                  <Link href={chatHref(e)} className="flex gap-4 px-5 py-3.5 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-sm font-medium text-tinta">{e.cliente}</span>
                        <EstadoBadge estado={e.estado} />
                        {e.lead_caliente && <span className="text-xs font-medium text-amber-700">Interés alto</span>}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{e.siguiente_accion}</p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm text-gray-700">{e.asesor}</p>
                      <p className="text-xs tabular text-gray-500">{e.valor ? fmtUsd(e.valor) : ''}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nada pendiente" description="No hay clientes en negociación con un siguiente paso recomendado en este periodo." />
          )}
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Cumplimiento por criterio"
          description={critMedibles.length ? `Sobre ${critMedibles[0].n} conversaciones con evaluación detallada` : undefined}
        >
          {critMedibles.length ? (
            <ul className="space-y-2.5">
              {[...critMedibles].sort((a, b) => a.pct - b.pct).map((c, i) => (
                <li key={c.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className={cx(i < 3 ? 'font-medium text-tinta' : 'text-gray-700')}>{c.label}</span>
                    <span className="tabular text-gray-600">{fmtPct(c.pct)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cx('h-full rounded-full', c.pct >= 70 ? 'bg-green-600' : c.pct >= 40 ? 'bg-amber-500' : 'bg-red-600')}
                      style={{ width: `${Math.max(2, c.pct)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Aparecerá cuando haya evaluaciones con el sistema actual.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Errores que más se repiten" description="Fallos del asesor detectados en las conversaciones">
          <FraseList items={errores} empty="Sin errores registrados en este periodo." tone="red" />
        </Panel>
        <Panel title="Por qué se pierden las ventas" description="Motivos en conversaciones perdidas o sin respuesta">
          <FraseList items={motivos} empty="No hay ventas perdidas con motivo en este periodo." tone="amber" />
        </Panel>
      </div>
    </div>
  );
}

function FraseList({ items, empty, tone }) {
  if (!items.length) return <p className="text-sm text-gray-500">{empty}</p>;
  const max = items[0].n;
  return (
    <ul className="space-y-3">
      {items.map((f) => (
        <li key={f.texto} className="flex items-start gap-3">
          <span className="w-8 shrink-0 text-right text-sm font-semibold tabular text-tinta">{f.n}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700">{f.texto}</p>
            <div className="mt-1 h-1 rounded-full bg-gray-100">
              <div className={cx('h-full rounded-full', tone === 'red' ? 'bg-red-400' : 'bg-amber-400')} style={{ width: `${(f.n / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
