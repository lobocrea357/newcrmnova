"use client";

import { Edit, X, Calendar, User, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Banner contextual que se muestra cuando se está editando una cotización
 * @param {Object} cotizacion - Datos de la cotización que se está editando
 * @param {Function} onCancel - Callback al cancelar la edición
 */
export default function BannerEdicion({ cotizacion, onCancel }) {
  const router = useRouter();

  if (!cotizacion) return null;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/ventas/cotizaciones');
    }
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-md animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex items-center justify-center w-10 h-10 bg-amber-500 rounded-lg flex-shrink-0">
            <Edit className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-amber-900">
                Modo Edición
              </h3>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">
                EN EDICIÓN
              </span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium">{cotizacion.nombre_cliente}</span>
                <span className="text-amber-600">•</span>
                <span className="text-amber-700">Cotización #{cotizacion.id}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <Calendar className="w-3 h-3" />
                <span>
                  Creada el {new Date(cotizacion.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-amber-600 mt-2">
                <span className="font-medium">💡 Tip:</span>
                <span>Los cambios se guardarán al presionar "Guardar Cambios"</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-amber-300 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-all duration-200 flex-shrink-0 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancelar Edición
        </button>
      </div>
    </div>
  );
}
