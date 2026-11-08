'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Page, PageHeader, Tabs, cx } from '@/components/ui/kit';
import { HubProvider, useHub } from '@/components/inteligencia/HubContext';
import { PERIODS } from '@/lib/inteligencia';

const TABS = [
  { id: 'resumen', label: 'Resumen', href: '/inteligencia' },
  { id: 'asesores', label: 'Asesores', href: '/inteligencia/asesores' },
  { id: 'conversaciones', label: 'Conversaciones', href: '/inteligencia/conversaciones' },
  { id: 'manual', label: 'Manual de ventas', href: '/inteligencia/manual' },
  { id: 'reportes', label: 'Reportes', href: '/inteligencia/reportes' },
];

function PeriodPicker() {
  const { period, setPeriod } = useHub();
  return (
    <div className="inline-flex rounded-lg border border-linea bg-white p-0.5" role="group" aria-label="Periodo">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => setPeriod(p.id)}
          aria-pressed={period === p.id}
          className={cx(
            'h-8 rounded-md px-3 text-sm transition-colors',
            period === p.id ? 'bg-nova-600 font-medium text-white' : 'text-gray-600 hover:text-tinta'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function Header() {
  const pathname = usePathname();
  const { withPeriod, loading, updatedAt, reload } = useHub();
  const active = [...TABS].reverse().find((t) => pathname === t.href || pathname.startsWith(t.href + '/'))?.id || 'resumen';
  const usesPeriod = !['manual', 'reportes'].includes(active);
  return (
    <>
      <PageHeader
        title="Centro IA"
        description="La IA revisa cada conversación de venta cuando se queda quieta 45 minutos: qué hizo bien el asesor, qué falló y cuál es el siguiente paso."
        actions={
          usesPeriod && (
            <>
              <button
                onClick={reload}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-100"
                title={updatedAt ? `Actualizado ${updatedAt.toLocaleTimeString('es')}` : 'Actualizar'}
              >
                <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
              <PeriodPicker />
            </>
          )
        }
      />
      <Tabs tabs={TABS.map((t) => ({ ...t, href: withPeriod(t.href) }))} active={active} className="mb-6" />
    </>
  );
}

export default function InteligenciaLayout({ children }) {
  return (
    <Suspense>
      <HubProvider>
        <Page wide>
          <Header />
          {children}
        </Page>
      </HubProvider>
    </Suspense>
  );
}
