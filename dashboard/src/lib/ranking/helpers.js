/**
 * Utilidades de visualización para el ranking gamificado (Frontend)
 * Complemento de src/lib/rankingHelpers.js del backend
 * 
 * NOTA: Este archivo es self-contained. No importa de sí mismo.
 * Las funciones del backend (metas, comisiones) se replican aquí
 * para evitar dependencias cross-layer.
 */

// ==========================================
// 1. FORMATEO DE DATOS
// ==========================================
export const formatearDinero = (monto, moneda = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monto || 0)
}

export const formatearFee = (monto, moneda = 'USD') => {
  return formatearDinero(monto, moneda)
}

export const formatearPorcentaje = (valor, decimales = 1) => {
  return `${(valor || 0).toFixed(decimales)}%`
}

export const formatearPorcentajeSimple = (valor, decimales = 1) => {
  return formatearPorcentaje(valor, decimales)
}

export const formatearNumero = (numero) => {
  return new Intl.NumberFormat('es-ES').format(numero || 0)
}

// ==========================================
// 2. METAS POR AGENCIA (replica del backend)
// ==========================================
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

// ==========================================
// 3. PROGRESO Y MÉTRICAS
// ==========================================
export const calcularProgresoMeta = (feeActual, meta) => {
  if (!meta || meta <= 0) return 0
  return Math.min((feeActual / meta) * 100, 100)
}

export const estaCercaDeMeta = (feeActual, meta, umbral = 85) => {
  const progreso = calcularProgresoMeta(feeActual, meta)
  return progreso >= umbral && progreso < 100
}

export const getDiasRestantesMes = () => {
  const ahora = new Date()
  const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate()
  return ultimoDiaMes - ahora.getDate()
}

// ==========================================
// 4. COLORES DINÁMICOS
// ==========================================
export const obtenerColorProgreso = (porcentaje) => {
  if (porcentaje >= 100) return 'bg-emerald-500'
  if (porcentaje >= 85) return 'bg-green-500'
  if (porcentaje >= 70) return 'bg-yellow-500'
  if (porcentaje >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

export const obtenerColorTextoProgreso = (porcentaje) => {
  if (porcentaje >= 70) return 'text-white'
  return 'text-gray-700'
}

// ==========================================
// 5. COLORES POR AGENCIA
// ==========================================
export const obtenerColoresAgencia = (codigoAgencia) => {
  const codigo = String(codigoAgencia || 'SIN_AGENCIA').toUpperCase()
  const colores = {
    'APOLO': {
      primario: 'amber',
      secundario: 'amber',
      texto: 'amber',
      gradiente: 'from-amber-400 to-orange-500'
    },
    'NOVA': {
      primario: 'indigo',
      secundario: 'indigo',
      texto: 'indigo',
      gradiente: 'from-indigo-400 to-purple-500'
    },
    'NOVA_FLASH': {
      primario: 'purple',
      secundario: 'purple',
      texto: 'purple',
      gradiente: 'from-purple-400 to-pink-500'
    },
    'NOVA_COLOMBIA': {
      primario: 'blue',
      secundario: 'blue',
      texto: 'blue',
      gradiente: 'from-blue-400 to-cyan-500'
    },
    'SIN_AGENCIA': {
      primario: 'gray',
      secundario: 'gray',
      texto: 'gray',
      gradiente: 'from-gray-400 to-slate-500'
    }
  }
  return colores[codigo] || colores['SIN_AGENCIA']
}

export const obtenerClasesAgencia = (codigoAgencia) => {
  const colores = obtenerColoresAgencia(codigoAgencia)
  
  return {
    primario: colores.primario,
    secundario: colores.secundario,
    texto: colores.texto,
    gradiente: `bg-gradient-to-r ${colores.gradiente}`
  }
}

// ==========================================
// 6. BADGES Y GAMIFICACIÓN
// ==========================================
export const obtenerBadgeMeta = (alcanzoMeta, progreso) => {
  if (alcanzoMeta) return '🏆'
  if (progreso >= 95) return '🔥'
  if (progreso >= 85) return '⚡'
  if (progreso >= 70) return '💪'
  return ''
}

export const obtenerBadgeMetaUI = (alcanzoMeta, progreso) => {
  return obtenerBadgeMeta(alcanzoMeta, progreso)
}

export const obtenerMensajeMotivacional = (progreso, diasRestantes) => {
  if (progreso >= 100) return '¡Meta alcanzada! Sigue así'
  if (progreso >= 85) return '¡Muy cerca! Un último esfuerzo'
  if (progreso >= 70) return 'Buen progreso, mantén el ritmo'
  if (progreso >= 50) return 'Vas bien, falta más'
  if (diasRestantes <= 10) return '¡El tiempo corre! Acelera'
  return 'Sigue adelante, tú puedes'
}

export const obtenerMensajeMotivacionalUI = (progreso, diasRestantes) => {
  return obtenerMensajeMotivacional(progreso, diasRestantes)
}

export const obtenerNivelProgreso = (progreso) => {
  if (progreso >= 100) return { nivel: 'maestro', emoji: '🏆', color: 'emerald' }
  if (progreso >= 85) return { nivel: 'experto', emoji: '🔥', color: 'green' }
  if (progreso >= 70) return { nivel: 'avanzado', emoji: '⚡', color: 'yellow' }
  if (progreso >= 50) return { nivel: 'intermedio', emoji: '💪', color: 'orange' }
  return { nivel: 'principiante', emoji: '🚀', color: 'red' }
}

// ==========================================
// 7. PROYECCIONES
// ==========================================
export const calcularProyeccionMeta = (feeActual, meta, diasTranscurridos) => {
  if (!diasTranscurridos || diasTranscurridos === 0) return null
  if (!feeActual || feeActual <= 0) return null
  
  const promedioDiario = feeActual / diasTranscurridos
  const faltante = Math.max(0, meta - feeActual)
  
  if (promedioDiario === 0) return null
  
  const diasNecesarios = Math.ceil(faltante / promedioDiario)
  const fechaEstimada = new Date()
  fechaEstimada.setDate(fechaEstimada.getDate() + diasNecesarios)
  
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

export const formatearProyeccion = (proyeccion) => {
  if (!proyeccion) return 'Sin datos suficientes'
  
  const { fechaEstimada, alcanzaraAntesDeFinMes } = proyeccion
  
  if (alcanzaraAntesDeFinMes) {
    return `Al ritmo actual, alcanzarás meta el ${fechaEstimada.toLocaleDateString('es', { 
      day: 'numeric', 
      month: 'short' 
    })}`
  } else {
    return `Necesitas aumentar el ritmo para alcanzar meta este mes`
  }
}

export const calcularProyeccionMetaUI = (feeActual, meta, diasTranscurridos) => {
  return calcularProyeccionMeta(feeActual, meta, diasTranscurridos)
}

// ==========================================
// 8. ESTADOS VISUALES
// ==========================================
export const obtenerEstadoVisual = (usuario) => {
  const { feeAgenciaTotal, metaIndividual, alcanzoMeta } = usuario
  const progreso = calcularProgresoMeta(feeAgenciaTotal, metaIndividual)
  const cerca = estaCercaDeMeta(feeAgenciaTotal, metaIndividual)
  
  return {
    progreso,
    alcanzoMeta,
    estaCerca: cerca,
    nivel: obtenerNivelProgreso(progreso),
    colorBarra: obtenerColorProgreso(progreso),
    colorTexto: obtenerColorTextoProgreso(progreso),
    badge: obtenerBadgeMetaUI(alcanzoMeta, progreso),
    mensaje: obtenerMensajeMotivacionalUI(progreso, getDiasRestantesMes())
  }
}

// ==========================================
// 9. ANIMACIONES CSS
// ==========================================
export const animacionesBarra = {
  entrada: 'animate-in fade-in slide-in-from-left-2 duration-500',
  pulso: 'animate-pulse',
  shimmer: 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]',
  celebracion: 'animate-bounce',
  glow: 'animate-pulse-glow'
}

export const animacionesBadge = {
  entrada: 'animate-in zoom-in fade-in duration-300',
  celebracion: 'animate-bounce',
  pulso: 'animate-pulse'
}

export const animacionesCard = {
  entrada: 'animate-in fade-in slide-in-from-bottom-2 duration-500',
  hover: 'hover:scale-[1.02] transition-transform duration-200',
  celebracion: 'ring-2 ring-emerald-500 ring-opacity-50'
}

// ==========================================
// 10. CLASES CSS DINÁMICAS
// ==========================================
export const obtenerClasesBarra = (progreso, alcanzóMeta) => {
  const colorBarra = obtenerColorProgreso(progreso)
  const colorTexto = obtenerColorTextoProgreso(progreso)
  
  return {
    contenedor: 'relative w-full bg-gray-200 rounded-full h-3 overflow-hidden',
    progreso: `h-full ${colorBarra} transition-all duration-1000 ease-out relative ${
      alcanzóMeta ? animacionesBarra.pulso : ''
    }`,
    texto: `absolute inset-0 flex items-center justify-center text-xs font-bold ${colorTexto}`,
    shimmer: 'absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer'
  }
}

export const obtenerClasesCard = (alcanzóMeta, agenciaCodigo) => {
  const clasesAgencia = obtenerClasesAgencia(agenciaCodigo)
  
  return {
    base: `bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
      alcanzóMeta ? animacionesCard.celebracion : animacionesCard.hover
    }`,
    header: `p-4 ${clasesAgencia.gradiente} text-white`,
    contenido: 'p-4 space-y-4',
    footer: 'border-t border-gray-100 p-4'
  }
}

// ==========================================
// 11. VALIDACIONES FRONTEND
// ==========================================
export const validarDatosUsuario = (usuario) => {
  const errores = []
  
  if (!usuario) {
    errores.push('Datos de usuario son nulos')
    return { valido: false, errores }
  }
  
  if (!usuario.id) errores.push('Falta ID del usuario')
  if (!usuario.nombre) errores.push('Falta nombre del usuario')
  if (typeof usuario.feeAgenciaTotal !== 'number') errores.push('Fee total inválido')
  if (typeof usuario.metaIndividual !== 'number') errores.push('Meta inválida')
  
  return {
    valido: errores.length === 0,
    errores
  }
}

export const validarDatosPersonales = (datos) => {
  const errores = []
  
  if (!datos) {
    errores.push('Datos personales son nulos')
    return { valido: false, errores }
  }
  
  if (!datos.usuario) errores.push('Faltan datos del usuario')
  if (!datos.mensual) errores.push('Faltan datos mensuales')
  if (!datos.quincenal) errores.push('Faltan datos quincenales')
  
  return {
    valido: errores.length === 0,
    errores
  }
}

// ==========================================
// 12. UTILIDADES DE LOCALIZACIÓN
// ==========================================
export const formatearFecha = (fecha, opciones = {}) => {
  const opcionesDefault = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  
  return new Date(fecha).toLocaleDateString('es', { ...opcionesDefault, ...opciones })
}

export const formatearFechaCorta = (fecha) => {
  return new Date(fecha).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short'
  })
}

export const formatearDiaSemana = (fecha) => {
  return new Date(fecha).toLocaleDateString('es', {
    weekday: 'long'
  })
}

// ==========================================
// 13. MÉTRICAS Y ANALÍTICA
// ==========================================
export const calcularMetricasEngagement = (datosRanking) => {
  if (!datosRanking?.general) return null
  
  const totalUsuarios = datosRanking.general.length
  const usuariosConMeta = datosRanking.general.filter(u => u.alcanzoMeta).length
  const usuariosCercaMeta = datosRanking.general.filter(u => u.estaCercaDeMeta).length
  
  return {
    totalUsuarios,
    usuariosConMeta,
    usuariosCercaMeta,
    porcentajeConMeta: totalUsuarios > 0 ? (usuariosConMeta / totalUsuarios) * 100 : 0,
    porcentajeCercaMeta: totalUsuarios > 0 ? (usuariosCercaMeta / totalUsuarios) * 100 : 0
  }
}

// ==========================================
// 14. CONFIGURACIÓN DE COMPONENTES
// ==========================================
export const configBarraProgreso = {
  altura: {
    compacta: 'h-2',
    normal: 'h-3',
    grande: 'h-4'
  },
  radio: {
    ninguno: 'rounded-none',
    normal: 'rounded-full',
    mediano: 'rounded-lg'
  },
  animacion: {
    rapida: 'duration-500',
    normal: 'duration-1000',
    lenta: 'duration-2000'
  }
}

export const configColores = {
  progreso: {
    excelente: 'bg-emerald-500',
    bueno: 'bg-green-500',
    medio: 'bg-yellow-500',
    bajo: 'bg-orange-500',
    critico: 'bg-red-500'
  },
  texto: {
    claro: 'text-white',
    oscuro: 'text-gray-700'
  }
}

// ==========================================
// 15. DEBUGGING FRONTEND
// ==========================================
export const debugUI = (componente, datos, accion = 'render') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎨 [UI-${componente}] ${accion}:`, {
      timestamp: new Date().toISOString(),
      datos: JSON.stringify(datos, null, 2)
    })
  }
}

export const logErrorUI = (componente, error, contexto = {}) => {
  console.error(`❌ [ERROR-${componente}]:`, {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    contexto
  })
}
