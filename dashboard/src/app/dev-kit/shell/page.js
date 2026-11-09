'use client';

/** Muestrario del armazón (menú + cabecera) con perfil simulado. SOLO desarrollo. */
import { notFound, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import UserProfileContext from '@/contexts/UserProfileContext';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { Page, PageHeader, Panel } from '@/components/ui/kit';

function Shell() {
  const role = useSearchParams().get('rol') || 'super_admin';
  const perms = { administracion: ['vuelos.confirm_payment'], emisor: ['vuelos.emit'] }[role] || [];
  const value = {
    profile: { id: 'demo', full_name: 'Omni Apex', email: 'admin@novapolointranet.xyz' },
    role,
    loading: false,
    hasPermission: (p) => role === 'super_admin' || perms.includes(p),
  };
  return (
    <UserProfileContext.Provider value={value}>
      <Sidebar />
      <div className="lg:ml-[248px]">
        <Navbar />
        <Page>
          <PageHeader title="Buenas tardes, Omni" description={`Vista del menú para el rol: ${role}`} />
          <Panel title="Contenido">Prueba ?rol=gerente, lider, asesor, administracion, emisor, supervisor.</Panel>
        </Page>
      </div>
    </UserProfileContext.Provider>
  );
}

export default function DevShell() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Suspense><Shell /></Suspense>;
}
