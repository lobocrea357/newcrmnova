/**
 * Helper centralizado para toda la lógica de ranking gamificado
 * Evita duplicación entre cotizaciones y vuelos
 */

// 1. FECHAS
export const getRangoMesActual = () => {
  const ahora = new Date()
  const año = ahora.getFullYear()
  const mes = ahora.getMonth()
  
  const inicio = new Date(año, mes, 1)
  const fin = new Date(año, mes + 1, 0, 23, 59, 59)
  
  return { inicio, fin }
}

export const getRangoQuincenaActual = () => {
  const ahora = new Date()
  const dia = ahora.getDate()
  const mes = ahora.getMonth()
  const año = ahora.getFullYear()
  
  if (dia <= 15) {
    return {
      numero: 1,
      inicio: new Date(año, mes, 1),
      fin: new Date(año, mes, 15, 23, 59, 59)
    }
  } else {
    const ultimoDiaMes = new Date(año, mes + 1, 0).getDate()
    return {
      numero: 2,
      inicio: new Date(año, mes, 16),
      fin: new Date(año, mes, ultimoDiaMes, 23, 59, 59)
    }
  }
}

export const obtenerDiaDelMes = () => {
  return new Date().getDate()
}

export const getDiasRestantesMes = () => {
  const ahora = new Date()
  const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate()
  return ultimoDiaMes - ahora.getDate()
}

// 2. DIAS DE COBRO
export const calcularDiaCobro = (fecha) => {
  const diaSemana = fecha.getDay()
  
  // Si es viernes (5), sábado (6) o domingo (0)
  if (diaSemana >= 5) {
    const diasAlLunes = diaSemana === 0 ? 1 : 8 - diaSemana
    const fechaAjustada = new Date(fecha.getTime() + (diasAlLunes * 24 * 60 * 60 * 1000))
    return fechaAjustada
  }
  
  return fecha
}

export const getProximoDiaCobro = () => {
  const quincena = getRangoQuincenaActual()
  return calcularDiaCobro(quincena.fin)
}

export const yaCobroQuincena = () => {
  const ahora = new Date()
  const proximoCobro = getProximoDiaCobro()
  return ahora > proximoCobro
}

// 3. METAS POR AGENCIA
export const getMetaPorAgencia = (codigoAgencia) => {
  const codigo = String(codigoAgencia || 'SIN_AGENCIA').toUpperCase()
  const metas = {
    'APOLO': 3000,
    'NOVA': 3500,
    'NOVA_FLASH': 3500,
    'NOVA_COLOMBIA': 3500,
    'SIN_AGENCIA': 3500
  }
  return metas[codigo] || 3500
}

export const getNombreAgencia = (codigoAgencia) => {
  const codigo = String(codigoAgencia || 'SIN_AGENCIA').toUpperCase()
  const nombres = {
    'APOLO': 'Apolo',
    'NOVA': 'Nova',
    'NOVA_FLASH': 'Nova Flash',
    'NOVA_COLOMBIA': 'Nova Colombia',
    'SIN_AGENCIA': 'Sin Agencia'
  }
  return nombres[codigo] || 'Sin Agencia'
}

// 4. COMISIONES
export const calcularComision = (feeQuincenal, alcanzoMetaMensual) => {
  if (!feeQuincenal || feeQuincenal <= 0) return 0
  
  const porcentaje = alcanzoMetaMensual ? 0.15 : 0.12
  return feeQuincenal * porcentaje
}

export const getPorcentajeComision = (alcanzoMetaMensual) => {
  return alcanzoMetaMensual ? 15 : 12
}

// 5. PROGRESO Y MÉTRICAS
export const calcularProgresoMeta = (feeActual, meta) => {
  if (!meta || meta <= 0) return 0
  return Math.min((feeActual / meta) * 100, 100)
}

export const alcanzoMeta = (feeActual, meta) => {
  return feeActual >= meta
}

export const estaCercaDeMeta = (feeActual, meta, umbral = 85) => {
  const progreso = calcularProgresoMeta(feeActual, meta)
  return progreso >= umbral && progreso < 100
}

// 6. PROYECCIONES
export const calcularProyeccionMeta = (feeActual, meta, diasTranscurridos) => {
  if (!diasTranscurridos || diasTranscurridos === 0) return null
  if (!feeActual || feeActual <= 0) return null
  
  const promedioDiario = feeActual / diasTranscurridos
  const faltante = Math.max(0, meta - feeActual)
  
  if (promedioDiario === 0) return null
  
  const diasNecesarios = Math.ceil(faltante / promedioDiario)
  const fechaEstimada = new Date()
  fechaEstimada.setDate(fechaEstimada.getDate() + diasNecesarios)
  
  // Verificar si alcanzará antes de fin de mes
  const finDeMes = new Date()
  finDeMes.setDate(finDeMes.getDate() + getDiasRestantesMes())
  
  return {
    diasNecesarios,
    fechaEstimada,
    alcanzaraAntesDeFinMes: fechaEstimada <= finDeMes,
    promedioDiario: Math.round(promedioDiario * 100) / 100,
    faltante: Math.round(faltante * 100) / 100
  }
}

// 7. VALIDACIONES
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export const sanitizeFee = (fee) => {
  const num = parseFloat(fee)
  return isNaN(num) ? 0 : Math.max(0, num)
}

// 8. FORMATEO
export const formatearDinero = (monto, moneda = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monto || 0)
}

export const formatearPorcentaje = (valor, decimales = 1) => {
  return `${valor.toFixed(decimales)}%`
}

// 9. GAMIFICACIÓN
export const obtenerBadgeMeta = (alcanzoMeta, progreso) => {
  if (alcanzoMeta) return '??'
  if (progreso >= 95) return '??'
  if (progreso >= 85) return '??'
  if (progreso >= 70) return '??'
  return ''
}

export const obtenerMensajeMotivacional = (progreso, diasRestantes) => {
  if (progreso >= 100) return '¡Meta alcanzada! Sigue así'
  if (progreso >= 85) return '¡Muy cerca! Un último esfuerzo'
  if (progreso >= 70) return 'Buen progreso, mantén el ritmo'
  if (progreso >= 50) return 'Vas bien, falta más'
  if (diasRestantes <= 10) return '¡El tiempo corre! Acelera'
  return 'Sigue adelante, tú puedes'
}

// 10. COLORES POR AGENCIA
export const obtenerColoresAgencia = (codigoAgencia) => {
  const codigo = String(codigoAgencia || 'SIN_AGENCIA').toUpperCase()
  const colores = {
    'APOLO': {
      primario: '#f59e0b',
      secundario: '#fef3c7',
      texto: '#92400e',
      gradiente: 'from-amber-400 to-orange-500'
    },
    'NOVA': {
      primario: '#6366f1',
      secundario: '#eef2ff',
      texto: '#4338ca',
      gradiente: 'from-indigo-400 to-purple-500'
    },
    'NOVA_FLASH': {
      primario: '#a855f7',
      secundario: '#faf5ff',
      texto: '#7c3aed',
      gradiente: 'from-purple-400 to-pink-500'
    },
    'NOVA_COLOMBIA': {
      primario: '#3b82f6',
      secundario: '#eff6ff',
      texto: '#1d4ed8',
      gradiente: 'from-blue-400 to-cyan-500'
    },
    'SIN_AGENCIA': {
      primario: '#6b7280',
      secundario: '#f9fafb',
      texto: '#374151',
      gradiente: 'from-gray-400 to-slate-500'
    }
  }
  return colores[codigo] || colores['SIN_AGENCIA']
}

// 11. ESTADOS Y CONSTANTES
export const ESTADOS_QUINCENA = {
  ESTIMADO: 'estimado',
  COBRADO: 'cobrado'
}

export const UMBRALES_NOTIFICACION = {
  CERCA_META: 85,
  META_ALCANZADA: 100
}

export const TIEMPO_ANIMACION = {
  BARRA_PROGRESO: 1000,
  ENTRADA_COMPONENTE: 300,
  CELEBRACION: 3000
}

// 12. DEBUGGING
export const debugRanking = (datos, contexto = 'Ranking') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`?? [${contexto}] Datos:`, {
      timestamp: new Date().toISOString(),
      datos: JSON.stringify(datos, null, 2)
    })
  }
}

export const validarDatosRanking = (datos) => {
  const errores = []
  
  if (!datos) {
    errores.push('Datos de ranking son nulos o indefinidos')
    return errores
  }
  
  // Validar estructura básica
  if (!datos.general || !Array.isArray(datos.general)) {
    errores.push('Faltan datos generales del ranking')
  }
  
  if (!datos.mesActual) {
    errores.push('Faltan datos del mes actual')
  }
  
  return errores
}
