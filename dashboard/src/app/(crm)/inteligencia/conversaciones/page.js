'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, MessagesSquare, X } from 'lucide-react';
import { Panel, EmptyState, Skeleton, cx } from '@/components/ui/kit';
import { useHub } from '@/components/inteligencia/HubContext';
import { EstadoBadge, PctBadge, EvaluationCard } from '@/components/inteligencia/parts';
import { ESTADOS, fmtFecha } from '@/lib/inteligencia';

const FILTROS = ['todas', 'en_negociacion', 'sin_respuesta', 'perdida', 'vendida', 'no_aplica'];

export default function ConversacionesIA() {
  const { evals, loading } = useHub();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const estado = params.get('estado') || 'todas';
  const asesor = params.get('asesor') || '';
  const q = params.get('q') || '';
  const selectedId = params.get('id');

  const setParam = (k, v) => {
    const p = new URLSearchParams(params.toString());
    if (v) p.set(k, v); else p.delete(k);
    if (k !== 'id') p.delete('id');
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };

  const asesores = useMemo(() => {
    const m = new Map();
    evals.forEach((e) => m.set(e.bot_id, e.asesor));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [evals]);

  const counts = useMemo(() => {
    const c = { todas: 0 };
    evals.filter((e) => !asesor || e.bot_id === asesor).forEach((e) => {
      c[e.estado] = (c[e.estado] || 0) + 1;
      if (e.estado !== 'no_aplica') c.todas++;
    });
    return c;
  }, [evals, asesor]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return evals.filter((e) =>
      (estado === 'todas' ? e.estado !== 'no_aplica' : e.estado === estado) &&
      (!asesor || e.bot_id === asesor) &&
      (!term || `${e.cliente} ${e.telefono || ''} ${e.asesor} ${e.resumen || ''}`.toLowerCase().includes(term))
    );
  }, [evals, estado, asesor, q]);

  const selected = list.find((e) => e.id === selectedId) || null;

  if (loading && !evals.length) return <Skeleton className="h-[520px] rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por resultado">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setParam('estado', f === 'todas' ? '' : f)}
              aria-pressed={estado === f}
              className={cx(
                'h-8 rounded-full border px-3 text-sm transition-colors',
                estado === f ? 'border-nova-600 bg-nova-600 text-white' : 'border-linea bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              {f === 'todas' ? 'Todas las ventas' : ESTADOS[f].label}
              <span className={cx('ml-1.5 tabular', estado === f ? 'text-white/75' : 'text-gray-400')}>{counts[f] || 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 gap-2 lg:justify-end">
          <select
            value={asesor}
            onChange={(e) => setParam('asesor', e.target.value)}
            className="h-9 min-w-0 rounded-lg border border-linea bg-white px-3 text-sm text-gray-700"
            aria-label="Asesor"
          >
            <option value="">Todos los asesores</option>
            {asesores.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <label className="relative min-w-0 flex-1 lg:max-w-xs">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              defaultValue={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Cliente, teléfono o asesor"
              className="h-9 w-full rounded-lg border border-linea bg-white pl-9 pr-3 text-sm placeholder:text-gray-400"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Panel padded={false} className={cx(selected && 'hidden lg:block')}>
          {list.length ? (
            <ul className="max-h-[calc(100vh-300px)] divide-y divide-linea overflow-y-auto">
              {list.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setParam('id', e.id)}
                    aria-current={selected?.id === e.id}
                    className={cx('w-full px-4 py-3 text-left transition-colors', selected?.id === e.id ? 'bg-nova-50' : 'hover:bg-gray-50')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-tinta">{e.cliente}</span>
                      {e.estado !== 'no_aplica' && <PctBadge value={e.percentage} />}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <EstadoBadge estado={e.estado} />
                      <span className="truncate text-xs text-gray-500">{e.asesor}</span>
                      <span className="ml-auto shrink-0 text-xs text-gray-400">{fmtFecha(e.evaluation_date)}</span>
                    </div>
                    {e.resumen && <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">{e.resumen}</p>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={MessagesSquare} title="Ninguna conversación con estos filtros" description="Cambia el resultado, el asesor o el texto de búsqueda." />
          )}
        </Panel>

        <Panel
          className={cx(!selected && 'hidden lg:block')}
          title={selected ? selected.cliente : undefined}
          description={selected ? `${selected.asesor}${selected.telefono ? ` · ${selected.telefono}` : ''}` : undefined}
          actions={selected && (
            <button onClick={() => setParam('id', '')} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Volver a la lista">
              <X className="h-4 w-4" />
            </button>
          )}
        >
          {selected ? (
            <EvaluationCard ev={selected} />
          ) : (
            <EmptyState title="Elige una conversación" description="Verás el resumen de la IA, el siguiente paso y qué criterios cumplió el asesor." />
          )}
        </Panel>
      </div>
    </div>
  );
}
