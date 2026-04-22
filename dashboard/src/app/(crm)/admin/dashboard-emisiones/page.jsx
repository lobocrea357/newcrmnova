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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Dashboard de Emisiones</h1>
              </div>
              <p className="text-gray-600">Métricas y estadísticas del módulo de emisiones</p>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="hoy">Hoy</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
            </select>
          </div>
        </div>

        {/* Cards de métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Vuelos Autorizados"
            value={metricas?.autorizados?.total || 0}
            icon={<CheckCircle className="w-8 h-8" />}
            color="from-green-500 to-green-600"
            description="Autorizados para emisión"
          />

          <MetricCard
            title="Vuelos Emitidos"
            value={metricas?.emitidos?.total || 0}
            icon={<Plane className="w-8 h-8" />}
            color="from-blue-500 to-blue-600"
            description="Boletos confirmados"
          />

          <MetricCard
            title="Pendientes de Autorización"
            value={metricas?.pendientes?.total || 0}
            icon={<Clock className="w-8 h-8" />}
            color="from-amber-500 to-amber-600"
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

function MetricCard({ title, value, icon, color, description }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-sm p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-lg">
          {icon}
        </div>
        <span className="text-sm font-medium opacity-80">{description}</span>
      </div>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-sm opacity-80 mt-1">{title}</p>
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
