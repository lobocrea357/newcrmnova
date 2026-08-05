'use client';

import React from 'react';
import { useAIAuditor } from '@/hooks/useAIAuditor';
import KPITarjetas from '@/components/AI/KPITarjetas';
import RankingAsesores from '@/components/AI/RankingAsesores';
import AuditorAlerts from '@/components/AI/AuditorAlerts';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Brain, RefreshCw } from 'lucide-react';

export default function AuditoriaIAPage() {
  const { evaluations, loading } = useAIAuditor();

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <Breadcrumb items={[
          { label: "Dashboard", href: "/" },
          { label: "Auditoría IA (Realtime)", href: "/auditoria-ia" }
        ]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Auditoría IA (Escáner Continuo)</h1>
              <p className="text-gray-500 text-sm mt-1">
                Monitoreo en vivo de calidad, errores críticos y cierre de ventas.
              </p>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Sincronizando...</span>
            </div>
          )}
        </div>

        {/* KPIs */}
        <KPITarjetas evaluations={evaluations} />

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Ranking */}
          <div className="lg:col-span-2">
            <RankingAsesores evaluations={evaluations} />
          </div>

          {/* Columna Derecha: Alertas y Feed */}
          <div className="lg:col-span-1 space-y-6">
            <AuditorAlerts evaluations={evaluations} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
