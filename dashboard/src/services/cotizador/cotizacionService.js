import { calcularConversionInteligente } from '@/lib/cotizador/conversorInteligente'

/**
 * Validar datos de cotización
 */
export function validarCotizacion({ precioBase, feeEmision, feeAgencia, monedaCotizacion, metodoPago }) {
  const errores = []
  
  if (!precioBase || precioBase <= 0) errores.push('Precio base es requerido')
  if (!feeEmision) errores.push('Fee de emisión es requerido')
  if (!feeAgencia || feeAgencia <= 0) errores.push('Fee de agencia es requerido')
  if (!monedaCotizacion) errores.push('Moneda de cotización es requerida')
  if (!metodoPago) errores.push('Método de pago es requerido')
  
  return errores
}

/**
 * Calcular base de cotización
 */
export function calcularBase({ precioBase, feeEmision, feeAgencia }) {
  const precio = parseFloat(precioBase) || 0
  const emision = parseFloat(feeEmision) || 0
  const agencia = parseFloat(feeAgencia) || 0
  
  return precio + emision + agencia
}

/**
 * Calcular cotización individual
 */
export async function calcularCotizacionIndividual({
  precioBase,
  feeEmision,
  feeAgencia,
  monedaBase,
  monedaCotizacion,
  metodoPago,
  tasasDb
}) {
  // Validar
  const errores = validarCotizacion({ precioBase, feeEmision, feeAgencia, monedaCotizacion, metodoPago })
  if (errores.length > 0) {
    throw new Error(errores.join(', '))
  }

  // Calcular base
  const base = calcularBase({ precioBase, feeEmision, feeAgencia })

  // Convertir
  const resultado = await calcularConversionInteligente({
    base,
    monedaBase,
    monedaCotizacion,
    metodoPago,
    tasasDb
  })

  return {
    ...resultado,
    totalFinal: resultado.total,
    precioBase: parseFloat(precioBase),
    feeEmision: parseFloat(feeEmision),
    feeAgencia: parseFloat(feeAgencia)
  }
}

/**
 * Formatear monto para display
 */
export function formatearMonto(valor) {
  if (!valor && valor !== 0) return '0.00'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor)
}

/**
 * Detectar moneda por método de pago
 */
export function detectarMonedaPorMetodo(metodo, metodosPorMoneda) {
  for (const [moneda, metodos] of Object.entries(metodosPorMoneda)) {
    if (metodos.includes(metodo)) {
      return moneda
    }
  }
  return null
}
