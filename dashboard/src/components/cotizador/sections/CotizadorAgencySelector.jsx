import { getThemeByAgency } from '@/lib/cotizador/agencyThemes'

/**
 * CotizadorAgencySelector - Selector de agencia con colores dinámicos
 * 
 * Componente que permite seleccionar la agencia (NOVA, NOVA COLOMBIA, APOLO)
 * con colores dinámicos según el tema de cada agencia.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.agencia - ID de la agencia seleccionada ('nova', 'colombia', 'apolo')
 * @param {Function} props.onChange - Callback cuando se selecciona una agencia
 * @param {Object} props.theme - Objeto con colores del tema de la agencia actual
 * @returns {JSX.Element} Componente de selector de agencia
 */
export default function CotizadorAgencySelector({ agencia, onChange, theme }) {
  const agencias = [
    { id: 'nova', label: 'NOVA', theme: getThemeByAgency('nova') },
    { id: 'colombia', label: 'NOVA COLOMBIA', theme: getThemeByAgency('colombia') },
    { id: 'apolo', label: 'APOLO', theme: getThemeByAgency('apolo') }
  ]

  return (
    <div className="mb-6 pb-6 border-b border-slate-100">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
        AGENCIA
      </label>
      <div className="grid grid-cols-3 gap-2">
        {agencias.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`py-1.5 px-1 rounded-lg font-bold text-[9px] transition-all duration-200 border-2 ${agencia === opt.id
                ? `bg-${opt.theme.primary} border-${opt.theme.primary} text-white shadow-sm scale-105`
                : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:shadow-sm hover:scale-102'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
