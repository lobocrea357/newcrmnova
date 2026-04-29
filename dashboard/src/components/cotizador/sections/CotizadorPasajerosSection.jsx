import { Users } from 'lucide-react'
import PasajerosManager from '../pasajeros/PasajerosManager'

export default function CotizadorPasajerosSection({
  pasajeros,
  setPasajeros,
  monedaPrecio,
  monedaCotizacion,
  aerolinea
}) {
  return (
    <div className="space-y-4">
      {/* Información de la vista múltiple */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-blue-800">Modo Múltiples Pasajeros</h4>
        </div>
        <p className="text-sm text-blue-700">
          Configura cada pasajero individualmente con sus precios, fees y equipaje.
          El total se calculará automáticamente sumando todos los pasajeros.
        </p>
      </div>

      {/* Componente de Pasajeros */}
      <div className="max-h-[500px] overflow-y-auto pr-2">
        <PasajerosManager
          value={pasajeros}
          onChange={setPasajeros}
          monedaPrecio={monedaPrecio}
          monedaCotizacion={monedaCotizacion}
          aerolinea={aerolinea}
        />
      </div>
    </div>
  )
}
