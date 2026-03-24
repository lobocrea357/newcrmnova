'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Eye, X, Loader2, CreditCard, FileText, Calendar, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import ImageModal from '@/components/shared/ImageModal'

export default function ConfirmarPagosPage() {
  const [vuelos, setVuelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVuelo, setSelectedVuelo] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmingPago, setConfirmingPago] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState({ url: '', name: '' })

  useEffect(() => {
    cargarVuelosPendientes()
  }, [])

  const cargarVuelosPendientes = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('vuelos')
        .select(`
          *,
          pasajeros:vuelos_pasajeros(*),
          adjuntos:vuelos_adjuntos(*)
        `)
        .eq('estado', 'PENDIENTE_CONFIRMACION_PAGO')
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

  const verDetalles = (vuelo) => {
    setSelectedVuelo(vuelo)
    setModalOpen(true)
  }

  const cerrarModal = () => {
    setModalOpen(false)
    setSelectedVuelo(null)
  }

  const confirmarPago = async (vueloId) => {
    try {
      setConfirmingPago(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('Usuario no autenticado')
        return
      }

      const response = await fetch(VUELOS_API.confirmarPago(vueloId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al confirmar pago')
      }

      toastSuccess('Pago confirmado exitosamente')
      cerrarModal()
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error confirmando pago:', error)
      toastError(error.message)
    } finally {
      setConfirmingPago(false)
    }
  }

  const comprobantes = selectedVuelo?.adjuntos?.filter(a => a.tipo_adjunto === 'COMPROBANTE_PAGO') || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Confirmación de Pagos</h1>
          <p className="text-gray-600 mt-2">
            Vuelos pendientes de confirmación de pago
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando vuelos...</p>
            </div>
          </div>
        ) : vuelos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay pagos pendientes
            </h3>
            <p className="text-gray-600">
              Todos los vuelos han sido confirmados
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID / Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ruta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Vuelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pasajeros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vuelos.map((vuelo) => (
                    <tr key={vuelo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vuelo.pax_nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {vuelo.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {vuelo.ruta}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(() => {
                          const [year, month, day] = vuelo.fecha_vuelo.split('-')
                          const date = new Date(year, month - 1, day)
                          return date.toLocaleDateString('es-ES')
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-green-600">
                          ${vuelo.monto_venta?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vuelo.metodo_pago || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {vuelo.pasajeros?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => verDetalles(vuelo)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Detalles */}
        {modalOpen && selectedVuelo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalles del Vuelo
                </h2>
                <button
                  onClick={cerrarModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Info Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedVuelo.pax_nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                    <p className="text-gray-900">{selectedVuelo.contacto_nombre}</p>
                    <p className="text-sm text-gray-600">{selectedVuelo.contacto_telefono}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
                    <p className="text-gray-900">{selectedVuelo.ruta}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vuelo</label>
                    <p className="text-gray-900">
                      {(() => {
                        const [year, month, day] = selectedVuelo.fecha_vuelo.split('-')
                        const date = new Date(year, month - 1, day)
                        return date.toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedVuelo.monto_venta?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {selectedVuelo.metodo_pago || 'No especificado'}
                    </span>
                  </div>
                </div>

                {/* Pasajeros */}
                {selectedVuelo.pasajeros && selectedVuelo.pasajeros.length > 0 && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">
                        Pasajeros ({selectedVuelo.pasajeros.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {selectedVuelo.pasajeros.map((pasajero, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 text-sm">
                          <div className="font-semibold text-gray-900">
                            {pasajero.nombre_completo || `${pasajero.nombres || ''} ${pasajero.apellidos || ''}`.trim() || `Pasajero #${idx + 1}`}
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            {pasajero.tipo} • {pasajero.numero_pasaporte ? `Pasaporte: ${pasajero.numero_pasaporte}` : 'Sin pasaporte'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comprobantes */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">
                      Comprobantes de Pago ({comprobantes.length})
                    </h3>
                  </div>
                  {comprobantes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comprobantes.map((comprobante, idx) => (
                        <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedImage({ url: comprobante.url_storage, name: comprobante.nombre_archivo })
                              setImageModalOpen(true)
                            }}
                          >
                            <img
                              src={comprobante.url_storage}
                              alt={comprobante.nombre_archivo}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                console.error('Error cargando imagen:', comprobante.url_storage)
                                e.target.src = '/placeholder-image.png'
                                e.target.alt = 'Imagen no disponible'
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {comprobante.nombre_archivo}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comprobante.uploaded_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <p className="text-amber-700 text-sm">
                        No se han subido comprobantes de pago
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-4 justify-end">
                <button
                  onClick={cerrarModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmarPago(selectedVuelo.id)}
                  disabled={confirmingPago}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {confirmingPago ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Pago
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Imagen */}
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
        />
      </div>
    </div>
  )
}
