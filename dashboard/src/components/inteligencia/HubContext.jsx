'use client';

import { createContext, useContext } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEvaluaciones } from '@/hooks/useEvaluaciones';
import { PERIODS } from '@/lib/inteligencia';

const Ctx = createContext(null);

/** Comparte periodo y evaluaciones entre las pestañas del Centro IA. */
export function HubProvider({ children }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const period = PERIODS.some((p) => p.id === params.get('p')) ? params.get('p') : '7d';
  const data = useEvaluaciones(period);

  const setPeriod = (id) => {
    const q = new URLSearchParams(params.toString());
    q.set('p', id);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  /** href que conserva el periodo actual. */
  const withPeriod = (href, extra = {}) => {
    const q = new URLSearchParams({ p: period, ...extra });
    return `${href}?${q.toString()}`;
  };

  return <Ctx.Provider value={{ period, setPeriod, withPeriod, ...data }}>{children}</Ctx.Provider>;
}

export function useHub() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHub fuera de HubProvider');
  return v;
}
