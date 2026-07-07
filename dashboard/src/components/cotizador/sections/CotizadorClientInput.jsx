/**
 * CotizadorClientInput - Input de nombre del cliente
 * 
 * Componente que permite ingresar el nombre del cliente para la cotización.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.value - Valor actual del input (nombre del cliente)
 * @param {Function} props.onChange - Callback cuando cambia el valor del input
 * @param {Object} props.theme - Objeto con colores del tema de la agencia actual
 * @returns {JSX.Element} Componente de input de cliente
 */
export default function CotizadorClientInput({ value, onChange, theme }) {
  return (
    <div className="mb-6 pb-6 border-b border-slate-100">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
        NOMBRE DEL CLIENTE
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Sabrina Burgos"
        className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${theme.accent} focus:border-transparent transition-all duration-200 hover:border-slate-400`}
      />
    </div>
  )
}
