'use client'

import { useState, useEffect } from 'react'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import {
  Plane,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import { METRICAS_API } from '@/config/apiConfig'
// NavigationBreadcrumb eliminado - tabs son suficientes para navegación
import { PageHeader } from '@/components/ui/kit'
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'

export default function DashboardEmisiones() {
  const { user, profile, loading: authLoading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['administracion', 'admin', 'super_admin']
  })

  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('semana')

  // Cargar métricas
  const cargarMetricas = async () => {
    setLoading(true)
    try {
      const response = await fetch(METRICAS_API.emisiones(periodo))
      if (!response.ok) throw new Error('Error cargando métricas')

      const data = await response.json()
      setMetricas(data)
    } catch (error) {
      console.error('Error:', error)
      toastError('Error cargando métricas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      cargarMetricas()
    }
  }, [user, periodo])

  if (authLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8" role="status" aria-label="Cargando métricas..."><div className="mb-6 h-9 w-64 animate-pulse rounded-md bg-gray-100" /><div className="h-96 animate-pulse rounded-xl bg-gray-100" /></div>
    )
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Métricas de emisiones"
          description="Autorizaciones, emisiones y deudas del periodo."
          actions={
            <label className="flex items-center gap-2 text-sm text-gray-500">
              Periodo
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="h-9 rounded-lg border border-linea bg-white px-3 text-sm focus:border-nova-500 focus:outline-none focus:ring-2 focus:ring-nova-500/20">
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
              </select>
            </label>
          }
        />


        {/* Navegación Horizontal */}
        <AdminFinanceNav />

        {/* Cards de métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Vuelos Autorizados"
            value={metricas?.autorizados?.total || 0}
            icon={<CheckCircle className="h-5 w-5" strokeWidth={1.8} />}
            tone="success"
            description="Autorizados para emisión"
          />

          <MetricCard
            title="Vuelos Emitidos"
            value={metricas?.emitidos?.total || 0}
            icon={<Plane className="h-5 w-5" strokeWidth={1.8} />}
            tone="info"
            description="Boletos confirmados"
          />

          <MetricCard
            title="Pendientes de Autorización"
            value={metricas?.pendientes?.total || 0}
            icon={<Clock className="h-5 w-5" strokeWidth={1.8} />}
            tone="warning"
            description="Esperando aprobación"
          />
        </div>

        {/* Deudas por proveedor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Deudas por Proveedor
          </h2>

          {Object.keys(metricas?.deudas?.por_proveedor || {}).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay deudas activas</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(metricas.deudas.por_proveedor).map(([proveedor, datos]) => (
                <DeudaCard
                  key={proveedor}
                  proveedor={proveedor}
                  total={datos.total}
                  pendiente={datos.pendiente}
                />
              ))}
            </div>
          )}
        </div>

        {/* Distribución por cuenta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Distribución por Cuenta de Emisión
          </h2>

          {Object.keys(metricas?.autorizados?.por_cuenta || {}).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metricas.autorizados.por_cuenta)
                .sort(([, a], [, b]) => b - a)
                .map(([cuenta, cantidad]) => (
                  <CuentaRow
                    key={cuenta}
                    cuenta={cuenta}
                    cantidad={cantidad}
                    total={metricas.autorizados.total}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, tone, description }) {
  const ring = { success: 'bg-green-50 text-green-700', info: 'bg-teal-50 text-teal-700', warning: 'bg-amber-50 text-amber-700' }[tone] || 'bg-nova-50 text-nova-700'
  return (
    <div className="rounded-xl border border-linea bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{title}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${ring}`}>{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold leading-none tabular text-tinta">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  )
}

function DeudaCard({ proveedor, total, pendiente }) {
  const porcentajePendiente = total > 0 ? (pendiente / total) * 100 : 0

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">{proveedor}</h3>
        <DollarSign className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total adeudado:</span>
          <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Pendiente:</span>
          <span className="font-bold text-amber-600">${pendiente.toFixed(2)}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${porcentajePendiente}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function CuentaRow({ cuenta, cantidad, total }) {
  const porcentaje = total > 0 ? (cantidad / total) * 100 : 0

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="font-medium text-gray-900">{cuenta}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{cantidad} vuelos</span>
        <span className="text-sm font-bold text-indigo-600">{porcentaje.toFixed(1)}%</span>
      </div>
    </div>
  )
}
