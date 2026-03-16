'use client'
import { CheckCircle, Eye, RotateCcw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BannerCotizacionGuardada({ 
  isVisible, 
  onClose, 
  onNuevaCotizacion 
}) {
  const router = useRouter()

  if (!isVisible) return null

  return (
    <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-green-800 mb-1">
              ¡Cotización guardada exitosamente!
            </h3>
            <p className="text-xs text-green-700 mb-3">
              Esta cotización ya existe en la base de datos. ¿Qué deseas hacer?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/ventas/cotizaciones')}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver todas las cotizaciones
              </button>
              <button
                onClick={onNuevaCotizacion}
                className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-50 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Hacer otra cotización
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 transition-colors flex-shrink-0"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
