import { Clock, MapPin, Plus, Trash2 } from 'lucide-react'

const FormularioEscalas = ({
  escalas = [],
  onAgregar,
  onActualizar,
  onEliminar,
  maxEscalas = 2,
  readonly = false
}) => {
  return (
    <div className="space-y-3">
      {escalas.map((escala, index) => (
        <div key={index} className="bg-white/50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Escala {index + 1}
            </h4>
            {!readonly && (
              <button
                type="button"
                onClick={() => onEliminar(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Ciudad de escala
              </label>
              <input
                type="text"
                value={escala.ciudad}
                onChange={(e) => onActualizar(index, 'ciudad', e.target.value)}
                placeholder="Ej: Panamá"
                disabled={readonly}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Clock className="w-3 h-3 inline mr-1" />
                Duración (horas)
              </label>
              <input
                type="text"
                value={escala.duracion}
                onChange={(e) => onActualizar(index, 'duracion', e.target.value)}
                placeholder="Ej: 2.5h"
                disabled={readonly}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      ))}
      
      {!readonly && escalas.length < maxEscalas && (
        <button
          type="button"
          onClick={onAgregar}
          className="w-full py-2 px-4 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar escala ({escalas.length}/{maxEscalas})
        </button>
      )}
    </div>
  )
}

export default FormularioEscalas
