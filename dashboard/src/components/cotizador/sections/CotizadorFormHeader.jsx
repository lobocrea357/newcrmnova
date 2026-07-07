import { Calculator, RefreshCw } from 'lucide-react'

/**
 * CotizadorFormHeader - Header del formulario con botón limpiar
 * 
 * Componente que muestra el título del cotizador y el botón para limpiar el formulario.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onLimpiar - Callback cuando se presiona el botón limpiar
 * @param {Object} props.theme - Objeto con colores del tema de la agencia actual
 * @returns {JSX.Element} Componente de header del formulario
 */
export default function CotizadorFormHeader({ onLimpiar, theme }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-1">
          <div className={`p-2 bg-${theme.primaryLight} rounded-lg`}>
            <Calculator className={`w-6 h-6 text-${theme.primary}`} />
          </div>
          Calculadora de Cotizaciones
        </h2>
        <p className="text-sm text-slate-500 ml-14">
          Configura los detalles del vuelo y pasajeros
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLimpiar}
          className="px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm hover:scale-105 active:scale-95"
          title="Limpiar formulario"
        >
          <RefreshCw className="w-4 h-4" />
          Limpiar
        </button>
      </div>
    </div>
  )
}
