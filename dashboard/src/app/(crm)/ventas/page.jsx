'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Plane,
  FileText,
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  CreditCard,
  MapPin,
  Calendar
} from 'lucide-react'
import KPICard from '@/components/ventas/KPICard'
import ChartMini from '@/components/ventas/ChartMini'
import NavigationCard from '@/components/ventas/NavigationCard'
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'
import { buildApiUrl } from '@/config/apiConfig'
import {
  calcularTotalVendidoMes,
  contarVuelosEmitidos,
  calcularTicketPromedio,
  contarPendientesEmision,
  contarVuelosConObservaciones,
  obtenerProveedoresTop,
  obtenerVentasPorAgencia,
  obtenerMetodosPagoPopulares,
  obtenerRutasMasVendidas,
  calcularComparativaMesAnterior,
  calcularTiempoPromedioEmision
} from '@/lib/ventas/kpiHelpers'

const VentasDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [vuelos, setVuelos] = useState([])
  const [vuelosMesAnterior, setVuelosMesAnterior] = useState([])
  const [tasas, setTasas] = useState({})
  const [kpis, setKpis] = useState({
    totalVendido: 0,
    vuelosEmitidos: 0,
    ticketPromedio: 0,
    pendientesEmision: 0,
    vuelosConObservaciones: 0,
    comparativa: { porcentaje: 0, tendencia: 'neutral' },
    tiempoPromedioEmision: 0
  })

  const breadcrumbItems = [
    { label: 'CRM', href: '/' },
    { label: 'Ventas', href: '/ventas' }
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      const tasasResponse = await fetch(buildApiUrl('/api/tasas/activas'))
      const tasasData = await tasasResponse.json()
      setTasas(tasasData)

      const vuelosResponse = await fetch('/api/vuelos')
      const vuelosResult = await vuelosResponse.json()
      const vuelosData = vuelosResult.data || []
      setVuelos(vuelosData)

      const fechaAnterior = new Date()
      fechaAnterior.setMonth(fechaAnterior.getMonth() - 1)
      const vuelosAnteriorResponse = await fetch(`/api/vuelos?mes=${fechaAnterior.getMonth()}&año=${fechaAnterior.getFullYear()}`)
      const vuelosAnteriorResult = await vuelosAnteriorResponse.json()
      const vuelosAnteriorData = vuelosAnteriorResult.data || []
      setVuelosMesAnterior(vuelosAnteriorData)

      const nuevosKpis = {
        totalVendido: calcularTotalVendidoMes(vuelosData, new Date(), tasasData),
        vuelosEmitidos: contarVuelosEmitidos(vuelosData),
        ticketPromedio: calcularTicketPromedio(vuelosData, new Date(), tasasData),
        pendientesEmision: contarPendientesEmision(vuelosData),
        vuelosConObservaciones: contarVuelosConObservaciones(vuelosData),
        comparativa: calcularComparativaMesAnterior(vuelosData, vuelosAnteriorData, tasasData),
        tiempoPromedioEmision: calcularTiempoPromedioEmision(vuelosData)
      }

      setKpis(nuevosKpis)

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const proveedoresTop = obtenerProveedoresTop(vuelos, 3)
  const ventasPorAgencia = obtenerVentasPorAgencia(vuelos, tasas)
  const metodosPagoPopulares = obtenerMetodosPagoPopulares(vuelos, 3)
  const rutasMasVendidas = obtenerRutasMasVendidas(vuelos, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
              <p className="text-sm text-gray-500">Dashboard de rendimiento y operaciones</p>
            </div>
            <NavigationBreadcrumb items={breadcrumbItems} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Vendido del Mes"
            value={formatCurrency(kpis.totalVendido)}
            subtitle="Ventas brutas normalizadas"
            icon={DollarSign}
            color="indigo"
            size="large"
            trend={kpis.comparativa.tendencia}
            trendValue={`${kpis.comparativa.porcentaje.toFixed(1)}% vs mes anterior`}
            loading={loading}
          />

          <KPICard
            title="Vuelos Emitidos"
            value={formatNumber(kpis.vuelosEmitidos)}
            subtitle="Este mes"
            icon={Plane}
            color="green"
            size="large"
            loading={loading}
          />

          <KPICard
            title="Ticket Promedio"
            value={formatCurrency(kpis.ticketPromedio)}
            subtitle="Por vuelo emitido"
            icon={TrendingUp}
            color="indigo"
            size="large"
            loading={loading}
          />

          <KPICard
            title="Pendientes de Emisión"
            value={formatNumber(kpis.pendientesEmision)}
            subtitle="Requieren atención"
            icon={Clock}
            color={kpis.pendientesEmision > 10 ? "red" : "amber"}
            size="large"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Vuelos con Observaciones"
            value={formatNumber(kpis.vuelosConObservaciones)}
            subtitle="Requieren seguimiento"
            icon={AlertTriangle}
            color="red"
            size="medium"
            loading={loading}
          />

          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Proveedores Top 3</h3>
            {proveedoresTop.length > 0 ? (
              <ChartMini
                data={proveedoresTop.map(p => ({ label: p.proveedor, value: p.count }))}
                type="bar"
                height={80}
                color="indigo"
                labels={true}
              />
            ) : (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Ventas por Agencia</h3>
            {(ventasPorAgencia.nova + ventasPorAgencia['nova-colombia'] + ventasPorAgencia.apolo) > 0 ? (
              <ChartMini
                data={[
                  { label: 'NOVA', value: ventasPorAgencia.nova },
                  { label: 'NOVA CO', value: ventasPorAgencia['nova-colombia'] },
                  { label: 'APOLO', value: ventasPorAgencia.apolo }
                ].filter(a => a.value > 0)}
                type="pie"
                height={80}
                color="green"
                labels={true}
              />
            ) : (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Métodos de Pago Populares</h3>
            {metodosPagoPopulares.length > 0 ? (
              <ChartMini
                data={metodosPagoPopulares.map(m => ({
                  label: m.metodo.split(' ')[0],
                  value: m.count
                }))}
                type="bar"
                height={80}
                color="amber"
                labels={false}
              />
            ) : (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rutas Más Vendidas</h3>
            {rutasMasVendidas.length > 0 ? (
              <div className="space-y-2">
                {rutasMasVendidas.map((ruta, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate pr-2">{ruta.ruta}</span>
                    <span className="text-sm font-medium text-indigo-600">{ruta.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
          </div>

          <KPICard
            title="Comparativa Mes Anterior"
            value={`${kpis.comparativa.porcentaje.toFixed(1)}%`}
            subtitle={kpis.comparativa.tendencia === 'positiva' ? 'Crecimiento' : kpis.comparativa.tendencia === 'negativa' ? 'Declinación' : 'Estable'}
            icon={kpis.comparativa.tendencia === 'positiva' ? TrendingUp : Calendar}
            color={kpis.comparativa.tendencia === 'positiva' ? 'green' : kpis.comparativa.tendencia === 'negativa' ? 'red' : 'amber'}
            size="medium"
            loading={loading}
          />

          <KPICard
            title="Tiempo Promedio de Emisión"
            value={`${kpis.tiempoPromedioEmision} días`}
            subtitle="Desde creación hasta emisión"
            icon={Clock}
            color="indigo"
            size="medium"
            loading={loading}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos de Ventas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NavigationCard
              title="Cotizaciones"
              description="Gestionar cotizaciones y seguimiento de clientes"
              icon={FileText}
              href="/ventas/cotizaciones"
              color="indigo"
              metric={vuelos.filter(v => v.cotizacion_id).length}
              metricLabel="activas"
            />

            <NavigationCard
              title="Vuelos"
              description="Administración de vuelos y emisiones"
              icon={Plane}
              href="/ventas/vuelos"
              color="green"
              metric={kpis.vuelosEmitidos}
              metricLabel="emitidos"
            />

            {/* Comentado temporalmente - Vista de Paquetes aún no existe */}
            {/* <NavigationCard
              title="Paquetes"
              description="Creación y gestión de paquetes turísticos"
              icon={Package}
              href="/ventas/paquetes"
              color="amber"
              metric={0}
              metricLabel="disponibles"
            /> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VentasDashboard
