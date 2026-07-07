export default function CotizadorScales({
  escalas,
  agregarEscala,
  eliminarEscala,
  actualizarEscala
}) {
  return (
    <div className="mt-8 p-6 bg-orange-50/50 rounded-xl border-2 border-orange-100 space-y-6">
      <h4 className="text-xs font-bold text-orange-700 uppercase tracking-widest px-1">Escalas</h4>
      {escalas.map((escala, index) => (
        <div key={index} className="space-y-3 p-3 bg-white rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600">Escala {index + 1}</span>
            <button
              type="button"
              onClick={() => eliminarEscala(index)}
              className="text-red-500 hover:text-red-700 text-xs font-bold"
            >
              Eliminar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">CIUDAD</label>
              <input
                type="text"
                value={escala.ciudad}
                onChange={(e) => actualizarEscala(index, 'ciudad', e.target.value)}
                placeholder="Ej: Bogotá"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">DURACIÓN</label>
              <input
                type="text"
                value={escala.duracion}
                onChange={(e) => actualizarEscala(index, 'duracion', e.target.value)}
                placeholder="Ej: 5:30 o 5.5"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      {escalas.length < 2 && (
        <button
          type="button"
          onClick={agregarEscala}
          className="w-full py-2 px-4 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors text-sm font-bold"
        >
          + Agregar Escala
        </button>
      )}
    </div>
  )
}
