'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Loader2, Package, AlertTriangle, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
// NavigationBreadcrumb eliminado - tabs son suficientes para navegación
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'

export default function ControlEmisionesPage() {
  const { user, profile, loading: authLoading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['administracion', 'admin', 'super_admin']
  })

  const [vuelos, setVuelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [autorizando, setAutorizando] = useState(false)
  const [seleccionados, setSeleccionados] = useState(new Set())

  useEffect(() => {
    if (user) {
      cargarVuelosPendientes()
    }
  }, [user])

  const cargarVuelosPendientes = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('vuelos')
        .select(`
          *,
          pasajeros:vuelos_pasajeros(*)
        `)
        .eq('estado', 'PENDIENTE_EMISION')
        .eq('autorizado_emision', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      setVuelos(data || [])
    } catch (error) {
      console.error('Error cargando vuelos:', error)
      toastError('Error al cargar vuelos pendientes')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar vuelos por cuenta de emisión
  const vuelosPorCuenta = useMemo(() => {
    const agrupados = {}
    
    vuelos.forEach(vuelo => {
      const cuenta = vuelo.cuenta_emision_asignada || 'SIN_CUENTA'
      if (!agrupados[cuenta]) {
        agrupados[cuenta] = []
      }
      agrupados[cuenta].push(vuelo)
    })

    return agrupados
  }, [vuelos])

  const toggleSeleccion = (vueloId) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(vueloId)) {
        nuevo.delete(vueloId)
      } else {
        nuevo.add(vueloId)
      }
      return nuevo
    })
  }

  const autorizarSeleccionados = async (cuenta) => {
    const vuelosDeEstaCuenta = vuelosPorCuenta[cuenta]
      .filter(v => seleccionados.has(v.id))
      .map(v => v.id)

    if (vuelosDeEstaCuenta.length === 0) {
      toastError('No hay vuelos seleccionados para esta cuenta')
      return
    }

    try {
      setAutorizando(true)

      const response = await fetch(VUELOS_API.autorizarEmisionBatch(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          vuelo_ids: vuelosDeEstaCuenta,
          cuenta_emision_asignada: cuenta,
          observaciones_emision: `Autorizado en batch desde control de emisiones`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al autorizar emisiones')
      }

      const data = await response.json()
      toastSuccess(`${data.vuelos_autorizados} vuelos autorizados exitosamente`)
      
      // Limpiar selección
      setSeleccionados(new Set())
      
      // Recargar lista
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error autorizando emisiones:', error)
      toastError(error.message)
    } finally {
      setAutorizando(false)
    }
  }

  const calcularTotal = (vuelosCuenta) => {
    return vuelosCuenta.reduce((sum, vuelo) => {
      const totalPasajeros = vuelo.pasajeros?.reduce((s, p) => 
        s + parseFloat(p.precio_pantalla || 0), 0
      ) || 0
      return sum + totalPasajeros
    }, 0)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando control de emisiones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Control de Emisiones</h1>
          <p className="text-gray-600 mt-2">
            Vuelos pendientes de autorización para emisión
          </p>
        </div>


        {/* Navegación Horizontal */}
        <AdminFinanceNav />

        {/* Lista agrupada por cuenta */}
        {Object.keys(vuelosPorCuenta).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay vuelos pendientes de autorización
            </h3>
            <p className="text-gray-600">
              Todos los vuelos han sido autorizados o no hay vuelos con pago confirmado
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(vuelosPorCuenta).map(([cuenta, vuelosCuenta]) => {
              const total = calcularTotal(vuelosCuenta)
              const seleccionadosCuenta = vuelosCuenta.filter(v => seleccionados.has(v.id)).length
              const esCredito = vuelosCuenta.some(v => v.forma_emision === 'CREDITO')

              return (
                <div key={cuenta} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header de cuenta */}
                  <div className={`p-4 ${esCredito ? 'bg-amber-50 border-b border-amber-200' : 'bg-indigo-50 border-b border-indigo-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {esCredito ? (
                          <CreditCard className="w-6 h-6 text-amber-600" />
                        ) : (
                          <Package className="w-6 h-6 text-indigo-600" />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {cuenta.replace(/_/g, ' ')}
                            {esCredito && <span className="ml-2 text-sm font-normal text-amber-600">- A Crédito</span>}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {vuelosCuenta.length} vuelos • Total: ${total.toFixed(2)} USD
                          </p>
                        </div>
                      </div>
                      {seleccionadosCuenta > 0 && (
                        <button
                          onClick={() => autorizarSeleccionados(cuenta)}
                          disabled={autorizando}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {autorizando ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Autorizando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Autorizar Seleccionados ({seleccionadosCuenta})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {esCredito && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Generará deuda con proveedor</span>
                      </div>
                    )}
                  </div>

                  {/* Lista de vuelos */}
                  <div className="divide-y divide-gray-200">
                    {vuelosCuenta.map(vuelo => {
                      const precioBase = vuelo.pasajeros?.reduce((s, p) => 
                        s + parseFloat(p.precio_pantalla || 0), 0
                      ) || 0

                      return (
                        <div key={vuelo.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={seleccionados.has(vuelo.id)}
                              onChange={() => toggleSeleccion(vuelo.id)}
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <div className="flex-1 grid grid-cols-5 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{vuelo.ruta}</p>
                                <p className="text-xs text-gray-500">Ruta</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">${precioBase.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Precio Base</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 font-mono">{vuelo.localizador || 'N/A'}</p>
                                <p className="text-xs text-gray-500">Localizador</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{vuelo.pax_nombre}</p>
                                <p className="text-xs text-gray-500">Pasajero</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{vuelo.proveedor}</p>
                                <p className="text-xs text-gray-500">Proveedor</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
