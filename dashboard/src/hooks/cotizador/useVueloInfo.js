import { useState } from 'react'

/**
 * Hook para manejar información del vuelo
 * Agrupa 9 estados relacionados en uno solo
 */
export const useVueloInfo = (inicial = {}) => {
  const [vueloInfo, setVueloInfo] = useState({
    origen: inicial.origen || '',
    destino: inicial.destino || '',
    aerolinea: inicial.aerolinea || '',
    fechaSalida: inicial.fechaSalida || '',
    horaSalida: inicial.horaSalida || '',
    horaLlegada: inicial.horaLlegada || '',
    idaVuelta: inicial.idaVuelta || false,
    soloIda: inicial.soloIda || false,
    finesMigratorios: inicial.finesMigratorios || false
  })

  const updateVueloInfo = (campo, valor) => {
    setVueloInfo(prev => ({ ...prev, [campo]: valor }))
  }

  const resetVueloInfo = () => {
    setVueloInfo({
      origen: '',
      destino: '',
      aerolinea: '',
      fechaSalida: '',
      horaSalida: '',
      horaLlegada: '',
      idaVuelta: false,
      soloIda: false,
      finesMigratorios: false
    })
  }

  const validarVueloInfo = () => {
    const errores = []
    if (!vueloInfo.origen) errores.push('Origen es requerido')
    if (!vueloInfo.destino) errores.push('Destino es requerido')
    if (!vueloInfo.fechaSalida) errores.push('Fecha de salida es requerida')
    return errores
  }

  return {
    vueloInfo,
    updateVueloInfo,
    resetVueloInfo,
    validarVueloInfo,
    setVueloInfo
  }
}
