import { CreditCard } from 'lucide-react'

/**
 * CotizadorPaymentSelector - Selector de método de pago con mensajes informativos
 * 
 * Componente que permite seleccionar el método de pago y muestra mensajes informativos
 * condicionales según el método seleccionado.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.metodoPago - Método de pago seleccionado
 * @param {string} props.monedaCotizacionSeleccionada - Moneda de cotización seleccionada
 * @param {Array} props.metodosPagoFiltrados - Lista de métodos de pago disponibles según moneda
 * @param {Function} props.setMetodoPago - Callback para establecer método de pago
 * @param {Object} props.theme - Objeto con colores del tema de la agencia actual
 * @returns {JSX.Element} Componente de selector de método de pago
 */
export default function CotizadorPaymentSelector({
  metodoPago,
  monedaCotizacionSeleccionada,
  metodosPagoFiltrados,
  setMetodoPago,
  theme
}) {
  return (
    <div className="mt-12 mb-8 pb-8 border-b border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className={`w-4 h-4 text-${theme.primary}`} />
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Método de Pago
        </label>
      </div>
      <div>
        <div className="relative">
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
            disabled={!monedaCotizacionSeleccionada}
          >
            <option value="">
              {monedaCotizacionSeleccionada
                ? 'Seleccionar método'
                : 'Primero selecciona una moneda de cotización'}
            </option>
            {metodosPagoFiltrados.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo}
              </option>
            ))}
          </select>
          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {!monedaCotizacionSeleccionada && (
          <p className="text-xs text-amber-600 mt-1 ml-2 font-medium">
            💡 Selecciona primero la moneda de cotización para ver los métodos de pago disponibles
          </p>
        )}
        {metodoPago === 'Depósitos en dólares (BNC USD)' && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold">
              💵 Cotización en USD (+4.5% comisión depósito)
            </p>
          </div>
        )}
        {metodoPago === 'Arcadia Service' && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold">
              💵 Cotización en USD (+5.6% + $10)
            </p>
          </div>
        )}
        {metodoPago === 'Transferencia (BNC)' && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs text-purple-700 font-semibold">
              Bs Cotización en Bolívares (VES)
            </p>
          </div>
        )}
        {metodoPago === 'Efectivo (USD)' && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-700 font-semibold">
              💰 Pago en efectivo USD - Seleccione moneda de cotización
            </p>
          </div>
        )}
        {(metodoPago === 'Davivienda' || metodoPago === 'Bancacolombia' || metodoPago === 'Efectivo (COP)') && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xs text-yellow-700 font-semibold">
              🇨🇴 Cotización en Pesos Colombianos (COP)
            </p>
          </div>
        )}
        {(metodoPago === 'BBVA' || metodoPago === 'Revolut' || metodoPago === 'Efectivo (EUR)' || metodoPago === 'Bizum (España)') && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-700 font-semibold">
              € Cotización en Euros (EUR)
            </p>
          </div>
        )}
        {(metodoPago === 'Zelle' || metodoPago === 'Banesco Panamá (ViajesNova)' || metodoPago === 'Chase Bank Nova' || metodoPago === 'Chase Bank Apolo') && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold">
              💵 Cotización en Dólares (USD)
            </p>
          </div>
        )}
        {metodoPago === 'Binance' && (
          <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-700 font-semibold">
              ₮ Cotización en USDT
            </p>
          </div>
        )}
        {metodoPago === 'Scalapay' && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs text-orange-700 font-semibold">
              € Cotización en Euros (EUR) +10.5% recargo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
