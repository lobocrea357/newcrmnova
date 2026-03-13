import { useState } from 'react'

/**
 * Hook para manejar selección de equipaje
 */
export const useEquipaje = () => {
  const [equipajeSeleccionado, setEquipajeSeleccionado] = useState([])

  const toggleEquipaje = (tipo) => {
    setEquipajeSeleccionado(prev =>
      prev.includes(tipo)
        ? prev.filter(e => e !== tipo)
        : [...prev, tipo]
    )
  }

  const tieneEquipaje = (tipo) => equipajeSeleccionado.includes(tipo)

  const resetEquipaje = () => {
    setEquipajeSeleccionado([])
  }

  return {
    equipajeSeleccionado,
    toggleEquipaje,
    tieneEquipaje,
    resetEquipaje
  }
}
