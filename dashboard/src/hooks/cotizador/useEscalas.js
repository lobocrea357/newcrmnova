import { useState } from 'react'
import { toastWarning } from '@/helpers/toasts'

/**
 * Hook para manejar escalas dinámicas
 */
export const useEscalas = (maxEscalas = 2) => {
  const [escalas, setEscalas] = useState([])

  const agregarEscala = () => {
    if (escalas.length < maxEscalas) {
      setEscalas([...escalas, { ciudad: '', duracion: '' }])
    } else {
      toastWarning(`Máximo ${maxEscalas} escalas permitidas`)
    }
  }

  const eliminarEscala = (index) => {
    setEscalas(escalas.filter((_, i) => i !== index))
  }

  const actualizarEscala = (index, campo, valor) => {
    const nuevasEscalas = [...escalas]
    nuevasEscalas[index][campo] = valor
    setEscalas(nuevasEscalas)
  }

  const resetEscalas = () => {
    setEscalas([])
  }

  const tieneEscalas = escalas.length > 0

  return {
    escalas,
    agregarEscala,
    eliminarEscala,
    actualizarEscala,
    resetEscalas,
    tieneEscalas
  }
}
