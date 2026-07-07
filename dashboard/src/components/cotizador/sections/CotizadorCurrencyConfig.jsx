import { DollarSign, ArrowRightLeft, TrendingUp } from 'lucide-react'

/**
 * CotizadorCurrencyConfig - Configuración de monedas y visualización de tasa de cambio
 * 
 * Componente que permite seleccionar la moneda base y la moneda de cotización,
 * y muestra la tasa de cambio cuando corresponde.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.monedaBaseSeleccionada - Moneda base seleccionada
 * @param {string} props.monedaCotizacionSeleccionada - Moneda de cotización seleccionada
 * @param {number} props.tasaCambio - Tasa de cambio actual
 * @param {Function} props.setMonedaBaseSeleccionada - Callback para establecer moneda base
 * @param {Function} props.setMonedaCotizacionSeleccionada - Callback para establecer moneda de cotización
 * @param {Array} props.monedasBase - Lista de monedas base disponibles
 * @param {Function} props.getMonedasConTasas - Función para obtener monedas con tasas
 * @param {boolean} props.loadingMonedas - Estado de carga de monedas
 * @param {Object} props.theme - Objeto con colores del tema de la agencia actual
 * @returns {JSX.Element} Componente de configuración de monedas
 */
export default function CotizadorCurrencyConfig({
  monedaBaseSeleccionada,
  monedaCotizacionSeleccionada,
  tasaCambio,
  setMonedaBaseSeleccionada,
  setMonedaCotizacionSeleccionada,
  monedasBase,
  getMonedasConTasas,
  loadingMonedas,
  theme
}) {
  return (
    <div className="mb-8 pb-8 border-b border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className={`w-4 h-4 text-${theme.primary}`} />
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Configuración de Monedas
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Moneda Base
          </label>
          <div className="relative">
            <select
              value={monedaBaseSeleccionada}
              onChange={(e) => setMonedaBaseSeleccionada(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer"
              disabled={loadingMonedas}
            >
              {monedasBase.map((moneda) => (
                <option key={moneda.value} value={moneda.value}>
                  {moneda.label}
                </option>
              ))}
            </select>
            <ArrowRightLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Moneda Cotización
          </label>
          <div className="relative">
            <select
              value={monedaCotizacionSeleccionada}
              onChange={(e) => setMonedaCotizacionSeleccionada(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer"
              disabled={loadingMonedas}
            >
              <option value="">Seleccionar moneda</option>
              {getMonedasConTasas().map((moneda) => (
                <option key={moneda.value} value={moneda.value}>
                  {moneda.label}
                </option>
              ))}
            </select>
            <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
      {monedaBaseSeleccionada &&
        monedaCotizacionSeleccionada &&
        monedaBaseSeleccionada !== monedaCotizacionSeleccionada &&
        tasaCambio && (
          <div className={`mt-4 p-4 bg-gradient-to-r ${theme.gradientLight} rounded-xl border-2 border-${theme.primaryBorder} shadow-sm`}>
            <p className={`text-sm text-${theme.textLight} font-semibold flex items-center gap-2`}>
              <TrendingUp className="w-4 h-4" />
              Tasa de cambio:{' '}
              <span className={`text-${theme.text}`}>
                1 {monedaBaseSeleccionada} = {tasaCambio} {monedaCotizacionSeleccionada}
              </span>
            </p>
          </div>
        )}
    </div>
  )
}
