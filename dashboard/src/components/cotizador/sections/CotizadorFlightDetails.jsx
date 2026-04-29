import { Calendar } from 'lucide-react'
import AerolineaAutocomplete from '../AerolineaAutocomplete'

export default function CotizadorFlightDetails({
  vueloInfo,
  updateVueloInfo,
  aerolinea,
  setAerolinea,
  setAerolineaCodigo,
  fechaSalidaMigratorio,
  setFechaSalidaMigratorio,
  horaSalidaMigratorio,
  setHoraSalidaMigratorio,
  horaLlegadaMigratorio,
  setHoraLlegadaMigratorio,
  fechaRegreso,
  setFechaRegreso,
  horaSalidaRegreso,
  setHoraSalidaRegreso,
  horaLlegadaRegreso,
  setHoraLlegadaRegreso,
  theme
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className={`w-4 h-4 text-${theme.primary}`} />
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Detalles del Vuelo
        </label>
      </div>

      {/* Campos para Fines Migratorios */}
      {vueloInfo.finesMigratorios && (
        <div className="mt-8 p-6 bg-amber-50 rounded-xl border-2 border-amber-200 space-y-6">
          <h4 className="text-sm font-bold text-amber-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Información para Fines Migratorios
          </h4>

          <div>
            <AerolineaAutocomplete
              value={aerolinea}
              onChange={setAerolinea}
              onCodigoChange={setAerolineaCodigo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
                Fecha Salida
              </label>
              <input
                type="date"
                value={fechaSalidaMigratorio}
                onChange={(e) => setFechaSalidaMigratorio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
                Hora Salida
              </label>
              <input
                type="time"
                value={horaSalidaMigratorio}
                onChange={(e) => setHoraSalidaMigratorio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
                Hora Llegada
              </label>
              <input
                type="time"
                value={horaLlegadaMigratorio}
                onChange={(e) => setHoraLlegadaMigratorio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Campos para Vuelo de Ida */}
      {(vueloInfo.idaVuelta || vueloInfo.soloIda) && (
        <div className="mt-8 p-6 bg-indigo-50/50 rounded-xl border-2 border-indigo-100 space-y-6">
          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest px-1">Vuelo de Ida</h4>

          <div>
            <AerolineaAutocomplete
              value={aerolinea}
              onChange={setAerolinea}
              onCodigoChange={setAerolineaCodigo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">FECHA</label>
              <input
                type="date"
                value={vueloInfo.fechaSalida}
                onChange={(e) => updateVueloInfo('fechaSalida', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">SALIDA</label>
              <input
                type="time"
                value={vueloInfo.horaSalida}
                onChange={(e) => updateVueloInfo('horaSalida', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">LLEGADA</label>
              <input
                type="time"
                value={vueloInfo.horaLlegada}
                onChange={(e) => updateVueloInfo('horaLlegada', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Campos para Vuelo de Vuelta */}
      {vueloInfo.idaVuelta && (
        <div className="mt-8 p-6 bg-purple-50/50 rounded-xl border-2 border-purple-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest px-1">Vuelo de Vuelta</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">FECHA</label>
              <input
                type="date"
                value={fechaRegreso}
                onChange={(e) => setFechaRegreso(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">SALIDA</label>
              <input
                type="time"
                value={horaSalidaRegreso}
                onChange={(e) => setHoraSalidaRegreso(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">LLEGADA</label>
              <input
                type="time"
                value={horaLlegadaRegreso}
                onChange={(e) => setHoraLlegadaRegreso(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
