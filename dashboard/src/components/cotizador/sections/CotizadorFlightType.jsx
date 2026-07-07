import { Plane, MapPin } from 'lucide-react'

/**
 * CotizadorFlightType - Selección de tipo de vuelo y inputs origen/destino
 * 
 * Componente que permite seleccionar el tipo de vuelo (solo ida, ida y vuelta, fines migratorios)
 * y capturar los datos de origen y destino con validación de exclusión mutua.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.vueloInfo - Objeto con información del vuelo actual
 * @param {Function} props.updateVueloInfo - Callback para actualizar información del vuelo
 * @param {Function} props.limpiarDetallesVuelo - Callback para limpiar detalles del vuelo
 * @param {Object} props.theme - Objeto con colores del tema de la agencia actual
 * @returns {JSX.Element} Componente de tipo de vuelo
 */
export default function CotizadorFlightType({
  vueloInfo,
  updateVueloInfo,
  limpiarDetallesVuelo,
  theme
}) {
  const handleTipoVueloChange = (tipo) => {
    const newValue = !vueloInfo[tipo]

    if (newValue) {
      if (tipo === 'idaVuelta') {
        updateVueloInfo('finesMigratorios', false)
        updateVueloInfo('soloIda', false)
      } else if (tipo === 'soloIda') {
        updateVueloInfo('idaVuelta', false)
        updateVueloInfo('finesMigratorios', false)
      } else if (tipo === 'finesMigratorios') {
        updateVueloInfo('idaVuelta', false)
        updateVueloInfo('soloIda', false)
      }
      limpiarDetallesVuelo()
    } else {
      limpiarDetallesVuelo()
    }

    updateVueloInfo(tipo, newValue)
  }

  const handleOrigenChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase()
    updateVueloInfo('origen', value)
  }

  const handleDestinoChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase()
    updateVueloInfo('destino', value)
  }

  return (
    <div className="mb-8 pb-8 border-b border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Plane className={`w-4 h-4 text-${theme.primary}`} />
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Tipo de Vuelo
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3 p-1.5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-inner">
        <button
          type="button"
          onClick={() => handleTipoVueloChange('idaVuelta')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.idaVuelta
              ? `bg-${theme.primary} text-white shadow-md scale-105`
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
            }`}
        >
          <div className={`w-2 h-2 rounded-full ${vueloInfo.idaVuelta ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
          IDA Y VUELTA
        </button>

        <button
          type="button"
          onClick={() => handleTipoVueloChange('soloIda')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.soloIda
              ? `bg-${theme.primary} text-white shadow-md scale-105`
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
            }`}
        >
          <div className={`w-2 h-2 rounded-full ${vueloInfo.soloIda ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
          SOLO IDA
        </button>

        <button
          type="button"
          onClick={() => handleTipoVueloChange('finesMigratorios')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.finesMigratorios
              ? `bg-${theme.secondary} text-white shadow-md scale-105`
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
            }`}
        >
          <div className={`w-2 h-2 rounded-full ${vueloInfo.finesMigratorios ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
          FINES MIGRATORIOS
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <MapPin className={`w-3.5 h-3.5 text-${theme.primary}`} />
            Origen
          </label>
          <input
            type="text"
            value={vueloInfo.origen}
            onChange={handleOrigenChange}
            placeholder="Ej: CCS"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 placeholder:text-slate-400 uppercase"
            maxLength={50}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <MapPin className={`w-3.5 h-3.5 text-${theme.primary}`} />
            Destino
          </label>
          <input
            type="text"
            value={vueloInfo.destino}
            onChange={handleDestinoChange}
            placeholder="Ej: MAD"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 placeholder:text-slate-400 uppercase"
            maxLength={50}
          />
        </div>
      </div>
    </div>
  )
}
