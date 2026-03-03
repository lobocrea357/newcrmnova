const TIPOS_EQUIPAJE = [
  {
    id: 'completo',
    nombre: 'Equipaje completo',
    descripcion: 'Maleta 23 Kg + Carry-on 8 Kg + Artículo personal'
  },
  {
    id: 'mediano',
    nombre: 'Equipaje mediano',
    descripcion: 'Maleta 23 Kg + Artículo personal'
  },
  {
    id: 'ligero',
    nombre: 'Equipaje ligero',
    descripcion: 'Maleta 10 Kg + Artículo personal'
  }
]

const FormularioEquipaje = ({
  equipajeSeleccionado = [],
  onToggle,
  readonly = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TIPOS_EQUIPAJE.map((tipo) => (
        <label
          key={tipo.id}
          className={`
            relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
            ${equipajeSeleccionado.includes(tipo.id)
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300'
            }
            ${readonly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            type="checkbox"
            checked={equipajeSeleccionado.includes(tipo.id)}
            onChange={() => onToggle(tipo.id)}
            disabled={readonly}
            className="mt-1 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <div className="ml-3">
            <p className="text-sm font-bold text-slate-700">{tipo.nombre}</p>
            <p className="text-[10px] text-slate-500">{tipo.descripcion}</p>
          </div>
        </label>
      ))}
    </div>
  )
}

export default FormularioEquipaje
