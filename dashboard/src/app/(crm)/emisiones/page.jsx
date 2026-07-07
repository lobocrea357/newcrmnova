'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Copy, Eye, X, Loader2, Plane, FileText, Users, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'

export default function EmisionesPage() {
  const [vuelos, setVuelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVuelo, setSelectedVuelo] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [emitiendoVuelo, setEmitiendoVuelo] = useState(false)

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
        .eq('estado', 'PENDIENTE_EMISION')
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

  const copiarPNR = () => {
    if (selectedVuelo?.pnr_desglose) {
      navigator.clipboard.writeText(selectedVuelo.pnr_desglose)
      toastSuccess('PNR copiado al portapapeles')
    } else {
      toastError('No hay desglose PNR disponible')
    }
  }

  const marcarEmitido = async (vueloId) => {
    try {
      setEmitiendoVuelo(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('Usuario no autenticado')
        return
      }

      const response = await fetch(VUELOS_API.marcarEmitido(vueloId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al marcar como emitido')
      }

      toastSuccess('Vuelo marcado como emitido exitosamente')
      cerrarModal()
      await cargarVuelosPendientes()
    } catch (error) {
      console.error('Error marcando como emitido:', error)
      toastError(error.message)
    } finally {
      setEmitiendoVuelo(false)
    }
  }

  const pasaportes = selectedVuelo?.adjuntos?.filter(a => a.tipo_adjunto === 'PASAPORTE') || []
  const pdfServivuelo = selectedVuelo?.adjuntos?.filter(a => a.tipo_adjunto === 'COMPROBANTE_RESERVA_SERVIVUELO') || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Emisiones de Boletos</h1>
          <p className="text-gray-600 mt-2">
            Vuelos pendientes de emisión
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
              No hay vuelos pendientes de emisión
            </h3>
            <p className="text-gray-600">
              Todos los vuelos han sido emitidos
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente / LOC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ruta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Vuelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aerolínea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pasajeros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PNR
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
                          LOC: {vuelo.localizador || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {vuelo.ruta}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(() => {
                          const [year, month, day] = vuelo.fecha_vuelo.split('-')
                          const date = new Date(year, month - 1, day)
                          return date.toLocaleDateString('es-ES')
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {vuelo.aerolinea_nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {vuelo.pasajeros?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {vuelo.pnr_desglose ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Sin PNR
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => verDetalles(vuelo)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver & Emitir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Emisión */}
        {modalOpen && selectedVuelo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Emisión de Boleto
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
                {/* Info del Vuelo */}
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Plane className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Información del Vuelo</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <p className="font-semibold text-gray-900">{selectedVuelo.pax_nombre}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
                      <p className="font-semibold text-gray-900">{selectedVuelo.ruta}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <p className="text-gray-900">
                        {(() => {
                          const [year, month, day] = selectedVuelo.fecha_vuelo.split('-')
                          const date = new Date(year, month - 1, day)
                          return date.toLocaleDateString('es-ES')
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aerolínea</label>
                      <p className="text-gray-900">{selectedVuelo.aerolinea_nombre || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Localizador</label>
                      <p className="font-mono font-semibold text-gray-900">{selectedVuelo.localizador || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                      <p className="text-gray-900">{selectedVuelo.proveedor}</p>
                    </div>
                  </div>
                </div>

                {/* Desglose PNR/GDS */}
                {selectedVuelo.pnr_desglose ? (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        <h3 className="text-lg font-bold text-gray-900">Desglose PNR/GDS</h3>
                      </div>
                      <button
                        onClick={copiarPNR}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar PNR
                      </button>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-300 p-4">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {selectedVuelo.pnr_desglose}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <p className="text-amber-700 font-medium">
                      ⚠️ No hay desglose PNR disponible para este vuelo
                    </p>
                    <p className="text-amber-600 text-sm mt-1">
                      Contacta al asesor para obtener el desglose de la reserva
                    </p>
                  </div>
                )}

                {/* Pasajeros */}
                {selectedVuelo.pasajeros && selectedVuelo.pasajeros.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">
                        Pasajeros ({selectedVuelo.pasajeros.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedVuelo.pasajeros.map((pasajero, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="font-semibold text-gray-900 mb-2">
                            {pasajero.nombre_completo || `${pasajero.nombres || ''} ${pasajero.apellidos || ''}`.trim() || `Pasajero #${idx + 1}`}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Tipo: <span className="font-medium text-gray-900">{pasajero.tipo}</span></div>
                            {pasajero.numero_pasaporte && (
                              <div>Pasaporte: <span className="font-mono font-medium text-gray-900">{pasajero.numero_pasaporte}</span></div>
                            )}
                            {pasajero.nacionalidad && (
                              <div>Nacionalidad: <span className="font-medium text-gray-900">{pasajero.nacionalidad}</span></div>
                            )}
                            {pasajero.fecha_nacimiento && (
                              <div>Nacimiento: <span className="font-medium text-gray-900">
                                {new Date(pasajero.fecha_nacimiento).toLocaleDateString('es-ES')}
                              </span></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pasaportes Adjuntos */}
                {pasaportes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">
                        Pasaportes Adjuntos ({pasaportes.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pasaportes.map((pasaporte, idx) => (
                        <a
                          key={idx}
                          href={pasaporte.url_storage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                        >
                          <FileText className="w-6 h-6 text-indigo-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {pasaporte.nombre_archivo}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF de Servivuelo */}
                {pdfServivuelo.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-gray-900">
                        Comprobante de Reserva Servivuelo ({pdfServivuelo.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pdfServivuelo.map((pdf, idx) => (
                        <a
                          key={idx}
                          href={pdf.url_storage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-100 transition-colors"
                        >
                          <FileText className="w-6 h-6 text-amber-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {pdf.nombre_archivo}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(pdf.tamano_bytes / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observaciones */}
                {selectedVuelo.observaciones && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Observaciones:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedVuelo.observaciones}
                    </p>
                  </div>
                )}
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
                  onClick={() => marcarEmitido(selectedVuelo.id)}
                  disabled={emitiendoVuelo}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {emitiendoVuelo ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Marcando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Marcar como Emitido
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
