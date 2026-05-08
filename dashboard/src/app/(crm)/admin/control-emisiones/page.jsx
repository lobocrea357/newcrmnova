'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { Package, Filter } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import { EMISIONES_API } from '@/config/apiConfig'
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'
import EmisionVueloCard from '@/components/admin/EmisionVueloCard'
import VueloDetail from '@/components/vuelos/VueloDetail'

export default function ControlEmisionesPage() {
  const { user, profile, loading: authLoading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['administracion', 'admin', 'super_admin']
  })

  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vueloSeleccionado, setVueloSeleccionado] = useState(null)
  const [filtroFormaEmision, setFiltroFormaEmision] = useState('TODOS')

  // Cargar vuelos pendientes agrupados
  const cargarVuelos = async () => {
    setLoading(true)
    try {
      const response = await fetch(EMISIONES_API.pendientesAgrupados())
      if (!response.ok) throw new Error('Error cargando vuelos')

      const data = await response.json()
      setDatos(data)
    } catch (error) {
      console.error('Error:', error)
      toastError('Error cargando vuelos pendientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      cargarVuelos()
    }
  }, [user])

  // Filtrar grupos según forma_emision
  const gruposFiltrados = useMemo(() => {
    if (!datos?.grupos) return {}

    if (filtroFormaEmision === 'TODOS') {
      return datos.grupos
    }

    const filtrados = {}
    Object.entries(datos.grupos).forEach(([cuenta, grupo]) => {
      const vuelosFiltrados = grupo.vuelos.filter(
        v => v.forma_emision === filtroFormaEmision
      )
      if (vuelosFiltrados.length > 0) {
        filtrados[cuenta] = {
          ...grupo,
          vuelos: vuelosFiltrados,
          total_vuelos: vuelosFiltrados.length,
          total_monto: vuelosFiltrados.reduce((sum, v) => sum + parseFloat(v.monto_venta || 0), 0)
        }
      }
    })
    return filtrados
  }, [datos, filtroFormaEmision])

  const handleCuentaChanged = (vueloActualizado) => {
    // Optimistic UI: Actualizar en el estado local
    cargarVuelos() // Recargar para obtener agrupación actualizada
  }

  const handleAutorizar = async (vueloId) => {
    try {
      const response = await fetch(EMISIONES_API.autorizarEmision(vueloId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          cuenta_emision_asignada: datos.grupos[Object.keys(datos.grupos).find(k =>
            datos.grupos[k].vuelos.some(v => v.id === vueloId)
          )].vuelos.find(v => v.id === vueloId).cuenta_emision_asignada
        })
      })

      if (!response.ok) throw new Error('Error al autorizar')

      toastSuccess('Emisión autorizada exitosamente')
      cargarVuelos()
    } catch (error) {
      console.error('Error:', error)
      toastError(error.message)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando vuelos pendientes...</p>
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
                <Package className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Control de Emisiones</h1>
              </div>
              <p className="text-gray-600">
                {datos?.total_general || 0} vuelos pendientes de autorización
              </p>
            </div>

            {/* Filtro Forma Emisión */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filtroFormaEmision}
                onChange={(e) => setFiltroFormaEmision(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="TODOS">Todas las formas</option>
                <option value="CONTADO">Solo CONTADO</option>
                <option value="CREDITO">Solo CREDITO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <AdminFinanceNav />

        {/* Grupos de Vuelos */}
        {Object.keys(gruposFiltrados).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay vuelos pendientes
            </h3>
            <p className="text-gray-600">
              Todos los vuelos han sido autorizados
            </p>
          </div>
        ) : (
          <div className="space-y-6">
              {Object.entries(gruposFiltrados)
                .sort(([, a], [, b]) => b.total_vuelos - a.total_vuelos)
                .map(([cuenta, grupo]) => (
                  <div key={cuenta} className="bg-white rounded-xl border border-gray-200 p-6">
                    {/* Header del Grupo */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div>
                      <h2 className="text-xl font-bold text-gray-900">{cuenta.replace(/_/g, ' ')}</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {grupo.total_vuelos} vuelos • ${grupo.total_monto.toFixed(2)} total
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {grupo.forma_emision.CONTADO > 0 && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                          💵 {grupo.forma_emision.CONTADO} Contado
                        </span>
                      )}
                      {grupo.forma_emision.CREDITO > 0 && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                          📋 {grupo.forma_emision.CREDITO} Crédito
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cards de Vuelos */}
                  <div className="grid grid-cols-1 gap-4">
                    {grupo.vuelos.map(vuelo => (
                      <EmisionVueloCard
                        key={vuelo.id}
                        vuelo={vuelo}
                        userId={user.id}
                        onCuentaChanged={handleCuentaChanged}
                        onAutorizar={handleAutorizar}
                        onVerDetalles={setVueloSeleccionado}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {vueloSeleccionado && (
        <VueloDetail
          vuelo={vueloSeleccionado}
          onClose={() => setVueloSeleccionado(null)}
        />
      )}
    </div>
  )
}
