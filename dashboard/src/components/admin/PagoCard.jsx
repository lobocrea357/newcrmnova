'use client'
import { useState } from 'react'
import { Eye, CheckCircle, AlertTriangle, Clock, DollarSign, Users, FileText } from 'lucide-react'
import { formatearFechaCorta, tiempoRelativo } from '@/helpers/dateHelpers'
import ComprobantesCarouselModal from './ComprobantesCarouselModal'

export default function PagoCard({ vuelo, onVerDetalles, onConfirmarPago, onReportarObservacion }) {
  const [modalComprobantesOpen, setModalComprobantesOpen] = useState(false)
  const comprobantes = vuelo.adjuntos?.filter(a => a.tipo_adjunto === 'COMPROBANTE_PAGO') || []
  const tieneComprobante = comprobantes.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      {/* Header con info principal */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {vuelo.pax_nombre}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-gray-400">ID:</span>
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {vuelo.id.substring(0, 8)}
              </code>
              <span className="text-gray-300">•</span>
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{tiempoRelativo(vuelo.created_at)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${vuelo.monto_venta?.toFixed(2)}
            </p>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
              {vuelo.metodo_pago || 'N/A'}
            </span>
          </div>
        </div>

        {/* Ruta y fecha */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block text-xs mb-1">Ruta</span>
            <p className="font-medium text-gray-900">{vuelo.ruta}</p>
          </div>
          <div>
            <span className="text-gray-500 block text-xs mb-1">Fecha vuelo</span>
            <p className="font-medium text-gray-900">{formatearFechaCorta(vuelo.fecha_vuelo)}</p>
          </div>
        </div>
      </div>

      {/* Info de pasajeros y comprobantes */}
      <div className="p-5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{vuelo.pasajeros?.length || 0}</span> pasajeros
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className={`text-sm ${tieneComprobante ? 'text-green-600' : 'text-amber-600'}`}>
                {tieneComprobante ? 'Comprobante adjunto' : 'Sin comprobante'}
              </span>
            </div>
          </div>
          {tieneComprobante && (
            <div className="flex -space-x-2">
              {comprobantes.slice(0, 3).map((comp, idx) => (
                <img
                  key={idx}
                  src={comp.url_storage}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              ))}
              {comprobantes.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  +{comprobantes.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => onVerDetalles(vuelo)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Eye className="w-4 h-4" />
          Ver Detalles
        </button>
        {tieneComprobante && (
          <button
            onClick={() => setModalComprobantesOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
            title="Ver comprobantes"
          >
            <FileText className="w-4 h-4" />
            Comprobante
          </button>
        )}
        <button
          onClick={() => onConfirmarPago(vuelo.id)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Aprobar
        </button>
        <button
          onClick={() => onReportarObservacion(vuelo)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
          title="Reportar observación"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>

      {/* Modal de Comprobantes con Carrusel */}
      <ComprobantesCarouselModal
        isOpen={modalComprobantesOpen}
        onClose={() => setModalComprobantesOpen(false)}
        comprobantes={comprobantes}
        vueloId={vuelo.id}
      />
    </div>
  )
}
