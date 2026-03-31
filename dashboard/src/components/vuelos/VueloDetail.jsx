'use client'
import { useState } from 'react'
import { 
  Plane, Users, Calendar, Clock, MapPin, Building, DollarSign, 
  FileText, Copy, CheckCircle, Download, ExternalLink, AlertCircle 
} from 'lucide-react'
import { generarFormatoWhatsApp } from '@/lib/utils/vuelos-calculations'
import ImageModal from '@/components/shared/ImageModal'
import HistorialEdiciones from './HistorialEdiciones'

export default function VueloDetail({ vuelo }) {
  const [copied, setCopied] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState({ url: '', name: '' })

  const totalPax = vuelo.num_adultos + vuelo.num_ninos + vuelo.num_infantes

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-')
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const handleCopyWhatsApp = () => {
    const formato = generarFormatoWhatsApp(vuelo)
    navigator.clipboard.writeText(formato)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getTipoVueloLabel = (tipo) => {
    const labels = {
      'solo_ida': 'Solo Ida',
      'ida_vuelta': 'Ida y Vuelta',
      'migratorio': 'Fines Migratorios'
    }
    return labels[tipo] || tipo
  }

  const getEstadoAnulacionColor = (estado) => {
    const colors = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'ANULADO': 'bg-red-100 text-red-800',
      'NO_ANULADO': 'bg-green-100 text-green-800'
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{vuelo.pax_nombre}</h2>
            <div className="flex items-center gap-2 text-purple-100">
              <MapPin className="w-5 h-5" />
              <span className="text-xl font-semibold">{vuelo.ruta}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-200 mb-1">Localizador</div>
            <div className="text-2xl font-mono font-bold">{vuelo.localizador}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-purple-500">
          <div>
            <div className="text-sm text-purple-200 mb-1">Fecha</div>
            <div className="font-semibold">{formatDate(vuelo.fecha_vuelo)}</div>
          </div>
          {vuelo.horario && (
            <div>
              <div className="text-sm text-purple-200 mb-1">Horario</div>
              <div className="font-semibold">{vuelo.horario}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-purple-200 mb-1">Pasajeros</div>
            <div className="font-semibold">{totalPax} PAX</div>
          </div>
          <div>
            <div className="text-sm text-purple-200 mb-1">Tipo</div>
            <div className="font-semibold">{getTipoVueloLabel(vuelo.tipo_vuelo)}</div>
          </div>
        </div>
      </div>

      {/* Información del Vuelo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plane className="w-5 h-5 text-purple-600" />
          Información del Vuelo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">Aerolínea</label>
            <p className="text-gray-900 font-medium">
              {vuelo.aerolinea_nombre || 'N/A'}
              {vuelo.aerolinea_codigo && (
                <span className="ml-2 text-sm text-gray-500">({vuelo.aerolinea_codigo})</span>
              )}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Proveedor</label>
            <p className="text-gray-900 font-medium">{vuelo.proveedor}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Contacto</label>
            <p className="text-gray-900 font-medium">{vuelo.contacto_nombre}</p>
            <p className="text-sm text-gray-500">{vuelo.contacto_telefono}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Pasajeros</label>
            <div className="flex gap-3 mt-1">
              {vuelo.num_adultos > 0 && (
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {vuelo.num_adultos} ADT
                </span>
              )}
              {vuelo.num_ninos > 0 && (
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {vuelo.num_ninos} CHD
                </span>
              )}
              {vuelo.num_infantes > 0 && (
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {vuelo.num_infantes} INF
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información Financiera */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-600" />
          Información Financiera
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-500">Venta Total</label>
            <p className="text-2xl font-bold text-gray-900">
              ${vuelo.monto_venta?.toFixed(2)}
            </p>
          </div>

          {vuelo.monto_sabre && (
            <div>
              <label className="text-sm text-gray-500">Sabre</label>
              <p className="text-lg font-semibold text-gray-900">
                ${vuelo.monto_sabre.toFixed(2)}
              </p>
            </div>
          )}

          {vuelo.monto_expedia && (
            <div>
              <label className="text-sm text-gray-500">Expedia</label>
              <p className="text-lg font-semibold text-gray-900">
                ${vuelo.monto_expedia.toFixed(2)}
              </p>
            </div>
          )}

          {vuelo.monto_emision && (
            <div>
              <label className="text-sm text-gray-500">Emisión</label>
              <p className="text-lg font-semibold text-gray-900">
                ${vuelo.monto_emision.toFixed(2)}
              </p>
            </div>
          )}

          {vuelo.monto_fee && (
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm text-gray-500">Fee</label>
              <p className="text-2xl font-bold text-purple-600">
                ${vuelo.monto_fee.toFixed(2)}
              </p>
            </div>
          )}

          {vuelo.metodo_pago && (
            <div className="col-span-2 md:col-span-3">
              <label className="text-sm text-gray-500">Método de Pago</label>
              <p className="text-gray-900 font-medium">{vuelo.metodo_pago}</p>
            </div>
          )}
        </div>
      </div>

      {/* Formato WhatsApp */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Formato WhatsApp
          </h3>
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>

        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono overflow-x-auto">
          {generarFormatoWhatsApp(vuelo)}
        </pre>
      </div>

      {/* Adjuntos */}
      {vuelo.adjuntos && vuelo.adjuntos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Adjuntos
          </h3>

          <div className="space-y-4">
            {['COMPROBANTE_PAGO', 'PASAPORTE'].map(tipo => {
              const adjuntosTipo = vuelo.adjuntos.filter(a => a.tipo_adjunto === tipo)
              if (adjuntosTipo.length === 0) return null

              return (
                <div key={tipo}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {tipo === 'COMPROBANTE_PAGO' ? 'Comprobantes de Pago' : 'Pasaportes'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {adjuntosTipo.map(adjunto => (
                      <button
                        key={adjunto.id}
                        onClick={() => {
                          setSelectedImage({ url: adjunto.url_storage, name: adjunto.nombre_archivo })
                          setImageModalOpen(true)
                        }}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {adjunto.nombre_archivo}
                            </p>
                            {adjunto.tamano_bytes && (
                              <p className="text-xs text-gray-500">
                                {(adjunto.tamano_bytes / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Información de Anulable */}
      {vuelo.anulable && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Caso de Anulación Asociado
            </h3>
            <a
              href={`/ventas/anulables/${vuelo.anulable.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Ver Anulable
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-600">Estado</label>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getEstadoAnulacionColor(vuelo.anulable.estado_anulacion)}`}>
                {vuelo.anulable.estado_anulacion}
              </span>
            </div>

            {vuelo.anulable.fecha_limite && (
              <div>
                <label className="text-sm text-gray-600">Fecha Límite</label>
                <p className="text-gray-900 font-medium mt-1">
                  {formatDate(vuelo.anulable.fecha_limite)}
                </p>
              </div>
            )}

            {vuelo.anulable.monto_recuperado && (
              <div>
                <label className="text-sm text-gray-600">Monto Recuperado</label>
                <p className="text-lg font-bold text-green-600 mt-1">
                  ${vuelo.anulable.monto_recuperado.toFixed(2)}
                </p>
              </div>
            )}

            {vuelo.anulable.observaciones && (
              <div className="md:col-span-3">
                <label className="text-sm text-gray-600">Observaciones</label>
                <p className="text-gray-900 mt-1">{vuelo.anulable.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial de Ediciones */}
      <HistorialEdiciones vueloId={vuelo.id} />

      {/* Observaciones */}
      {vuelo.observaciones && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Observaciones</h3>
          <p className="text-gray-700">{vuelo.observaciones}</p>
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
  )
}
