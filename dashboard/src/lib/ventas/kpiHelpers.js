/**
 * Helper functions para cálculo de KPIs de ventas con normalización de monedas
 * Estrategia: Usar total_cotizacion (monto limpio) normalizado a USD usando tasa_cambio
 */

import { obtenerTasa } from '../cotizador/tasasHelpers'

/**
 * Normalizar monto a USD usando tasa_cambio guardada o tasa actual
 */
export function normalizarMontoUSD(vuelo, tasasActuales = {}) {
  if (vuelo.moneda_precio === 'USD') {
    return vuelo.total_cotizacion
  }
  
  if (vuelo.moneda_precio === 'EUR') {
    const tasa = vuelo.tasa_cambio || tasasActuales.EUR_USD || 1.1
    return vuelo.total_cotizacion * tasa
  }
  
  return vuelo.total_cotizacion
}

/**
 * Calcular total vendido del mes (USD normalizado)
 */
export function calcularTotalVendidoMes(vuelos, fechaActual = new Date(), tasasActuales = {}) {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
  
  return vuelos
    .filter(v => {
      const fechaVuelo = new Date(v.created_at)
      return v.estado === 'EMITIDO' && 
             fechaVuelo >= inicioMes && 
             fechaVuelo <= finMes
    })
    .reduce((total, vuelo) => total + normalizarMontoUSD(vuelo, tasasActuales), 0)
}

/**
 * Contar vuelos emitidos
 */
export function contarVuelosEmitidos(vuelos, fechaActual = new Date()) {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
  
  return vuelos.filter(v => {
    const fechaVuelo = new Date(v.created_at)
    return v.estado === 'EMITIDO' && 
           fechaVuelo >= inicioMes && 
           fechaVuelo <= finMes
  }).length
}

/**
 * Calcular ticket promedio (USD normalizado)
 */
export function calcularTicketPromedio(vuelos, fechaActual = new Date(), tasasActuales = {}) {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
  
  const vuelosEmitidos = vuelos.filter(v => {
    const fechaVuelo = new Date(v.created_at)
    return v.estado === 'EMITIDO' && 
           fechaVuelo >= inicioMes && 
           fechaVuelo <= finMes
  })
  
  if (vuelosEmitidos.length === 0) return 0
  
  const total = vuelosEmitidos.reduce((sum, vuelo) => sum + normalizarMontoUSD(vuelo, tasasActuales), 0)
  return total / vuelosEmitidos.length
}

/**
 * Contar pendientes de emisión
 */
export function contarPendientesEmision(vuelos) {
  return vuelos.filter(v => v.estado === 'PENDIENTE_EMISION').length
}

/**
 * Contar vuelos con observaciones
 */
export function contarVuelosConObservaciones(vuelos) {
  return vuelos.filter(v => v.observaciones_pago && v.observaciones_pago.trim() !== '').length
}

/**
 * Obtener proveedores top 3
 */
export function obtenerProveedoresTop(vuelos, limit = 3) {
  const proveedores = {}
  
  vuelos
    .filter(v => v.estado === 'EMITIDO' && v.proveedor)
    .forEach(v => {
      proveedores[v.proveedor] = (proveedores[v.proveedor] || 0) + 1
    })
  
  return Object.entries(proveedores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([proveedor, count]) => ({ proveedor, count }))
}

/**
 * Obtener ventas por agencia
 */
export function obtenerVentasPorAgencia(vuelos, tasasActuales = {}) {
  const agencias = { nova: 0, 'nova-colombia': 0, apolo: 0 }
  
  vuelos
    .filter(v => v.estado === 'EMITIDO')
    .forEach(v => {
      const monto = normalizarMontoUSD(v, tasasActuales)
      if (v.agencia && agencias[v.agencia] !== undefined) {
        agencias[v.agencia] += monto
      }
    })
  
  return agencias
}

/**
 * Obtener métodos de pago populares
 */
export function obtenerMetodosPagoPopulares(vuelos, limit = 3) {
  const metodos = {}
  
  vuelos
    .filter(v => v.estado === 'EMITIDO' && v.metodo_pago)
    .forEach(v => {
      metodos[v.metodo_pago] = (metodos[v.metodo_pago] || 0) + 1
    })
  
  return Object.entries(metodos)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([metodo, count]) => ({ metodo, count }))
}

/**
 * Obtener rutas más vendidas
 */
export function obtenerRutasMasVendidas(vuelos, limit = 5) {
  const rutas = {}
  
  vuelos
    .filter(v => v.estado === 'EMITIDO' && v.origen && v.destino)
    .forEach(v => {
      const ruta = `${v.origen} - ${v.destino}`
      rutas[ruta] = (rutas[ruta] || 0) + 1
    })
  
  return Object.entries(rutas)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([ruta, count]) => ({ ruta, count }))
}

/**
 * Calcular comparativa mes anterior
 */
export function calcularComparativaMesAnterior(vuelosActuales, vuelosAnteriores, tasasActuales = {}) {
  const totalActual = calcularTotalVendidoMes(vuelosActuales, new Date(), tasasActuales)
  const totalAnterior = calcularTotalVendidoMes(vuelosAnteriores, new Date(Date.now() - 30*24*60*60*1000), tasasActuales)
  
  if (totalAnterior === 0) return { porcentaje: 0, tendencia: 'neutral' }
  
  const porcentaje = ((totalActual - totalAnterior) / totalAnterior) * 100
  const tendencia = porcentaje > 0 ? 'positiva' : porcentaje < 0 ? 'negativa' : 'neutral'
  
  return { porcentaje: Math.abs(porcentaje), tendencia }
}

/**
 * Calcular tiempo promedio de emisión
 */
export function calcularTiempoPromedioEmision(vuelos) {
  const vuelosEmitidos = vuelos.filter(v => 
    v.estado === 'EMITIDO' && 
    v.created_at && 
    v.updated_at
  )
  
  if (vuelosEmitidos.length === 0) return 0
  
  const totalDias = vuelosEmitidos.reduce((sum, vuelo) => {
    const creado = new Date(vuelo.created_at)
    const emitido = new Date(vuelo.updated_at)
    const dias = Math.ceil((emitido - creado) / (1000 * 60 * 60 * 24))
    return sum + dias
  }, 0)
  
  return Math.round(totalDias / vuelosEmitidos.length * 10) / 10
}
