'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Eye, X, Loader2, CreditCard, FileText, Calendar, Users, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import ImageModal from '@/components/shared/ImageModal'
import ModalObservacionPago from '@/components/vuelos/ModalObservacionPago'
import { useUserProfile } from '@/contexts/UserProfileContext'

export default function ConfirmarPagosPage() {
  const router = useRouter()
  const [vuelos, setVuelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVuelo, setSelectedVuelo] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmingPago, setConfirmingPago] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState({ url: '', name: '' })
  const [observacionModalOpen, setObservacionModalOpen] = useState(false)

  // Validación de permisos
  const { isSuperAdmin, isAdmin, isAdministracion, hasPermission } = useUserProfile()

  // Solo permitir acceso a super_admin, admin y administracion
  const puedeConfirmarPagos = isSuperAdmin || isAdmin || isAdministracion

  // Verificar permiso específico de vuelos.confirm_payment
  const tienePermisoConfirmarPagos = hasPermission('vuelos.confirm_payment') || isSuperAdmin

  // Redirigir a /no-autorizado si no tiene permisos
  useEffect(() => {
    if (!puedeConfirmarPagos || !tienePermisoConfirmarPagos) {
      router.push('/no-autorizado')
    }
  }, [puedeConfirmarPagos, tienePermisoConfirmarPagos, router])

  // Si no tiene permisos, no renderizar nada (se está redirigiendo)
  if (!puedeConfirmarPagos || !tienePermisoConfirmarPagos) {
    return null
  }

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
        toastError('Usuario no autenticado. Inicia sesión nuevamente.')
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

        // Manejar errores específicos
        if (errorData.error?.includes('no está en estado PENDIENTE_CONFIRMACION_PAGO')) {
          toastError('Este vuelo ya fue procesado. Actualiza la página.')
          await cargarVuelosPendientes()
          return
        }

        if (errorData.error?.includes('Vuelo no encontrado')) {
          toastError('El vuelo no existe. Actualiza la página.')
          await cargarVuelosPendientes()
          return
        }

        throw new Error(errorData.error || 'Error al confirmar pago')
      }

      const data = await response.json()
      toastSuccess('Pago confirmado exitosamente')
      cerrarModal()
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error confirmando pago:', error)

      // Diferenciar tipos de error
      if (error.message?.includes('Failed to fetch')) {
        toastError('Error de conexión. Verifica tu internet e intenta nuevamente.')
      } else if (error.message?.includes('timeout')) {
        toastError('La operación tardó demasiado. Intenta nuevamente.')
      } else {
        toastError(error.message || 'Error al confirmar pago. Intenta nuevamente.')
      }
    } finally {
      setConfirmingPago(false)
    }
  }

  const abrirModalObservacion = (vuelo) => {
    setSelectedVuelo(vuelo)
    setObservacionModalOpen(true)
  }

  const cerrarModalObservacion = () => {
    setObservacionModalOpen(false)
  }

  const enviarObservacion = async (datos) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('Usuario no autenticado')
        return
      }

      const response = await fetch(VUELOS_API.observarPago(selectedVuelo.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: user.id,
          ...datos
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar observación')
      }

      toastSuccess('Observación enviada al asesor exitosamente')
      cerrarModalObservacion()
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error enviando observación:', error)
      toastError(error.message)
    }
  }

  const comprobantes = selectedVuelo?.adjuntos?.filter(a => a.tipo_adjunto === 'COMPROBANTE_PAGO') || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Confirmación de Pagos</h1>
          <p className="text-gray-600 mt-2">
            Revisa y aprueba los pagos de vuelos pendientes
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
              <>
                {/* Métricas */}
                <MetricasHeader vuelos={vuelos} />

                {/* Grid de cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {vuelos.map((vuelo) => (
                    <PagoCard
                      key={vuelo.id}
                      vuelo={vuelo}
                      onVerDetalles={verDetalles}
                      onConfirmarPago={confirmarPago}
                      onReportarObservacion={abrirModalObservacion}
                    />
                  ))}
            </div>
              </>
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
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={cerrarModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => abrirModalObservacion(selectedVuelo)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Reportar Observación
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

        {/* Modal de Observación */}
        <ModalObservacionPago
          vuelo={selectedVuelo}
          isOpen={observacionModalOpen}
          onClose={cerrarModalObservacion}
          onSubmit={enviarObservacion}
        />
      </div>
    </div>
  )
}
