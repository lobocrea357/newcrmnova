'use client'
import { CheckCircle, Eye, RotateCcw, X, ExternalLink, FileText, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BannerCotizacionGuardada({ 
  isVisible, 
  onClose, 
  onNuevaCotizacion,
  cotizacionId = null,
  nombreCliente = null,
  fechaCreacion = null
}) {
  const router = useRouter()

  if (!isVisible) return null

  const handleVerCotizacion = () => {
    if (cotizacionId) {
      router.push(`/ventas/cotizaciones?id=${cotizacionId}`)
    } else {
      router.push('/ventas/cotizaciones')
    }
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-lg animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl flex-shrink-0 shadow-md">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-green-900 mb-2 flex items-center gap-2">
              ¡Cotización guardada exitosamente!
              <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-semibold rounded-full">
                NUEVA
              </span>
            </h3>

            {nombreCliente && (
              <div className="mb-3 space-y-1">
                <p className="text-sm text-green-800 font-medium">
                  Cliente: {nombreCliente}
                </p>
                {cotizacionId && (
                  <p className="text-xs text-green-700">
                    ID de Cotización: #{cotizacionId}
                  </p>
                )}
                {fechaCreacion && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <Calendar className="w-3 h-3" />
                    {new Date(fechaCreacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-green-700 mb-4">
              La cotización está lista para ser revisada y aprobada.
            </p>

            <div className="flex flex-wrap gap-2">
              {cotizacionId ? (
                <button
                  onClick={handleVerCotizacion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver esta cotización
                </button>
              ) : (
                  <button
                    onClick={() => router.push('/ventas/cotizaciones')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Eye className="w-4 h-4" />
                    Ver todas las cotizaciones
                  </button>
              )}

              <button
                onClick={onNuevaCotizacion}
                className="px-4 py-2 bg-white border-2 border-green-300 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Nueva cotización
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-200 flex-shrink-0"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
