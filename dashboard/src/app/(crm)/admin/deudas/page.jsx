'use client'

import { useState, useEffect } from 'react'
import { CreditCard, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, FileText, Plus, Search, Filter } from 'lucide-react'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { DEUDAS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import UploadComprobante from '@/components/deudas/UploadComprobante'

export default function DeudasPage() {
  const { user, profile, loading: authLoading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['administracion', 'admin', 'super_admin']
  })

  const [deudas, setDeudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [comprobanteFile, setComprobanteFile] = useState(null)
  const [registrandoPago, setRegistrandoPago] = useState(false)

  const [formDataPago, setFormDataPago] = useState({
    monto_pagado: '',
    metodo_pago: '',
    referencia_pago: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  useEffect(() => {
    if (user) {
      cargarDeudas()
    }
  }, [user, currentPage, filtroProveedor, filtroEstado])

  const cargarDeudas = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append('page', currentPage)
      params.append('limit', itemsPerPage)
      if (filtroProveedor) params.append('proveedor', filtroProveedor)
      if (filtroEstado) params.append('estado', filtroEstado)

      const response = await fetch(`${DEUDAS_API.listar}?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al cargar deudas')
      }

      const data = await response.json()
      setDeudas(data.deudas || [])
      setTotalItems(data.pagination?.total || 0)
      setTotalPages(data.pagination?.total_pages || 1)
    } catch (error) {
      console.error('Error cargando deudas:', error)
      toastError('Error al cargar deudas')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrarPago = async (e) => {
    e.preventDefault()

    if (!deudaSeleccionada) return

    setRegistrandoPago(true)

    try {
      const formData = new FormData()
      formData.append('deuda_id', deudaSeleccionada.id)
      formData.append('monto_pagado', formDataPago.monto_pagado)
      formData.append('metodo_pago', formDataPago.metodo_pago)
      formData.append('referencia_pago', formDataPago.referencia_pago)
      formData.append('fecha_pago', formDataPago.fecha_pago)
      formData.append('registrado_por', user.id)
      formData.append('observaciones', formDataPago.observaciones)

      if (comprobanteFile) {
        formData.append('comprobante', comprobanteFile)
      }

      const response = await fetch(DEUDAS_API.registrarPago, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al registrar pago')
      }

      toastSuccess('Pago registrado exitosamente')
      setMostrarModalPago(false)
      setFormDataPago({
        monto_pagado: '',
        metodo_pago: '',
        referencia_pago: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        observaciones: ''
      })
      setComprobanteFile(null)
      await cargarDeudas()
    } catch (error) {
      console.error('Error registrando pago:', error)
      toastError(error.message)
    } finally {
      setRegistrandoPago(false)
    }
  }

  const deudasFiltradas = deudas.filter(deuda => {
    if (busqueda) {
      const query = busqueda.toLowerCase()
      const vuelo = deuda.vuelo || {}
      return (
        deuda.proveedor?.toLowerCase().includes(query) ||
        vuelo.ruta?.toLowerCase().includes(query) ||
        vuelo.pax_nombre?.toLowerCase().includes(query) ||
        vuelo.localizador?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const resumen = deudas.reduce((acc, deuda) => ({
    totalAdeudado: acc.totalAdeudado + parseFloat(deuda.monto_deuda),
    totalPagado: acc.totalPagado + (parseFloat(deuda.monto_deuda) - parseFloat(deuda.saldo_pendiente)),
    totalPendiente: acc.totalPendiente + parseFloat(deuda.saldo_pendiente)
  }), { totalAdeudado: 0, totalPagado: 0, totalPendiente: 0 })

  const proveedoresUnicos = [...new Set(deudas.map(d => d.proveedor))].sort()
  const estadosUnicos = [...new Set(deudas.map(d => d.estado))].sort()

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'PAGADO_PARCIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PAGADO_TOTAL':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Clock className="w-4 h-4" />
      case 'PAGADO_PARCIAL':
        return <TrendingUp className="w-4 h-4" />
      case 'PAGADO_TOTAL':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando deudas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Deudas</h1>
          </div>
          <p className="text-gray-600">Control de deudas con proveedores y registro de pagos</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Adeudado</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${resumen.totalAdeudado.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pagado</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${resumen.totalPagado.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Pendiente</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${resumen.totalPendiente.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por proveedor, ruta, PAX o localizador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                mostrarFiltros || filtroProveedor || filtroEstado
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>

          {mostrarFiltros && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor
                </label>
                <select
                  value={filtroProveedor}
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todos los proveedores</option>
                  {proveedoresUnicos.map(proveedor => (
                    <option key={proveedor} value={proveedor}>{proveedor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  {estadosUnicos.map(estado => (
                    <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lista de deudas */}
        {deudasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay deudas registradas
            </h3>
            <p className="text-gray-600">
              No se encontraron deudas con los filtros actuales
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vuelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Deuda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Pendiente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deudasFiltradas.map(deuda => {
                    const vuelo = deuda.vuelo || {}
                    const vencido = deuda.fecha_vencimiento && new Date(deuda.fecha_vencimiento) < new Date()
                    
                    return (
                      <tr key={deuda.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{deuda.proveedor}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vuelo.ruta || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{vuelo.pax_nombre || 'N/A'}</div>
                          <div className="text-xs text-gray-400 font-mono">{vuelo.localizador || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${parseFloat(deuda.monto_deuda).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{deuda.moneda}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${vencido ? 'text-red-600' : 'text-gray-900'}`}>
                            ${parseFloat(deuda.saldo_pendiente).toFixed(2)}
                          </div>
                          {vencido && (
                            <div className="text-xs text-red-600">Vencido</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getEstadoBadge(deuda.estado)}`}>
                            {getEstadoIcon(deuda.estado)}
                            {deuda.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {deuda.fecha_vencimiento ? new Date(deuda.fecha_vencimiento).toLocaleDateString('es-ES') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {deuda.estado !== 'PAGADO_TOTAL' && (
                            <button
                              onClick={() => {
                                setDeudaSeleccionada(deuda)
                                setMostrarModalPago(true)
                              }}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              Registrar Pago
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Controles de paginación */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} deudas
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>

              <span className="px-4 py-2">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Registro de Pago */}
      {mostrarModalPago && deudaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Registrar Pago</h2>
                <button
                  onClick={() => {
                    setMostrarModalPago(false)
                    setComprobanteFile(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-2">Deuda seleccionada</div>
                <div className="font-medium text-gray-900">{deudaSeleccionada.proveedor}</div>
                <div className="text-sm text-gray-600">{deudaSeleccionada.vuelo?.ruta || 'N/A'}</div>
                <div className="text-sm text-gray-600">Saldo pendiente: ${parseFloat(deudaSeleccionada.saldo_pendiente).toFixed(2)}</div>
              </div>

              <form onSubmit={handleRegistrarPago} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a Pagar *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={deudaSeleccionada.saldo_pendiente}
                    value={formDataPago.monto_pagado}
                    onChange={(e) => setFormDataPago(prev => ({ ...prev, monto_pagado: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <input
                    type="text"
                    value={formDataPago.metodo_pago}
                    onChange={(e) => setFormDataPago(prev => ({ ...prev, metodo_pago: e.target.value }))}
                    placeholder="Ej: Transferencia, Zelle, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia de Pago
                  </label>
                  <input
                    type="text"
                    value={formDataPago.referencia_pago}
                    onChange={(e) => setFormDataPago(prev => ({ ...prev, referencia_pago: e.target.value }))}
                    placeholder="Número de referencia, transacción, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Pago *
                  </label>
                  <input
                    type="date"
                    value={formDataPago.fecha_pago}
                    onChange={(e) => setFormDataPago(prev => ({ ...prev, fecha_pago: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de Pago
                  </label>
                  <UploadComprobante
                    onFileSelect={setComprobanteFile}
                    disabled={registrandoPago}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={formDataPago.observaciones}
                    onChange={(e) => setFormDataPago(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows="3"
                    placeholder="Notas adicionales sobre el pago..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModalPago(false)
                      setComprobanteFile(null)
                    }}
                    disabled={registrandoPago}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={registrandoPago}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
