'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Panel, EmptyState, ScoreBar, Skeleton, cx } from '@/components/ui/kit';
import { useHub } from '@/components/inteligencia/HubContext';
import { porAsesor, fmtPct } from '@/lib/inteligencia';

const COLS = [
  { id: 'asesor', label: 'Asesor', sort: (a) => a.asesor?.toLowerCase() },
  { id: 'total', label: 'Conversaciones', sort: (a) => a.total, num: true },
  { id: 'calidad', label: 'Calidad', sort: (a) => a.calidad ?? -1 },
  { id: 'vendidas', label: 'Ventas', sort: (a) => a.vendidas, num: true },
  { id: 'conversion', label: 'Conversión', sort: (a) => a.conversion ?? -1, num: true },
  { id: 'enJuego', label: 'En negociación', sort: (a) => a.enJuego, num: true },
  { id: 'debil', label: 'A mejorar', sort: (a) => a.debil?.pct ?? 101 },
];

export default function AsesoresIA() {
  const { evals, loading, withPeriod } = useHub();
  const router = useRouter();
  const [sort, setSort] = useState({ id: 'calidad', dir: 'desc' });

  const rows = useMemo(() => {
    const data = porAsesor(evals);
    const col = COLS.find((c) => c.id === sort.id);
    return [...data].sort((a, b) => {
      const va = col.sort(a), vb = col.sort(b);
      const cmp = va > vb ? 1 : va < vb ? -1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [evals, sort]);

  if (loading && !evals.length) return <Skeleton className="h-96 rounded-xl" />;
  if (!rows.length) {
    return (
      <Panel>
        <EmptyState icon={Users} title="Sin asesores evaluados en este periodo" description="Cuando la IA evalúe conversaciones de venta, cada asesor aparecerá aquí con su calidad y conversión." />
      </Panel>
    );
  }

  const toggle = (id) => setSort((s) => (s.id === id ? { id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: id === 'asesor' ? 'asc' : 'desc' }));

  return (
    <Panel padded={false} title="Rendimiento por asesor" description="Pulsa un asesor para ver sus conversaciones evaluadas.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-linea text-left">
              {COLS.map((c) => (
                <th key={c.id} scope="col" className={cx('px-5 py-2.5 font-medium text-gray-500', c.num && 'text-right')}>
                  <button onClick={() => toggle(c.id)} className="inline-flex items-center gap-1 hover:text-tinta" aria-label={`Ordenar por ${c.label}`}>
                    {c.label}
                    {sort.id === c.id && (sort.dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {rows.map((a) => (
              <tr
                key={a.bot_id}
                onClick={() => router.push(withPeriod('/inteligencia/conversaciones', { asesor: a.bot_id }))}
                onKeyDown={(e) => e.key === 'Enter' && router.push(withPeriod('/inteligencia/conversaciones', { asesor: a.bot_id }))}
                tabIndex={0}
                className="cursor-pointer hover:bg-gray-50 focus-visible:bg-gray-50"
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-tinta">{a.asesor}</p>
                  {a.sede && <p className="text-xs text-gray-500">{a.sede}</p>}
                </td>
                <td className="px-5 py-3 text-right tabular">{a.total}</td>
                <td className="w-48 px-5 py-3"><ScoreBar value={a.calidad} /></td>
                <td className="px-5 py-3 text-right tabular">{a.vendidas}</td>
                <td className="px-5 py-3 text-right tabular">{fmtPct(a.conversion)}</td>
                <td className="px-5 py-3 text-right tabular">
                  {a.enJuego}
                  {a.calientes > 0 && <span className="ml-1.5 text-xs text-amber-700">({a.calientes} alto)</span>}
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {a.debil ? (
                    <>
                      {a.debil.label} <span className="tabular text-gray-400">{fmtPct(a.debil.pct)}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
