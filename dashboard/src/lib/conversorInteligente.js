import { obtenerTasa } from './tasasHelpers'

/**
 * Sistema Inteligente de Conversión de Monedas
 * Maneja la lógica de conversión según moneda de origen y destino
 */

// Monedas base para precios
const MONEDAS_BASE = ['USD', 'EUR']

// Impuestos especiales por país
const IMPUESTOS_PAIS = {
  'COP': 0.19, // 19% IVA Colombia
  'VES': 0.16, // 16% IVA Venezuela (si aplica)
  'EUR': 0.21, // 21% IVA España
  'GBP': 0.20, // 20% VAT UK
  'CAD': 0.05, // 5% GST Canada
  'AUD': 0.10, // 10% GST Australia
}

/**
 * Obtener tasa de conversión entre monedas
 * @param {string} monedaOrigen - Moneda del precio base (USD/EUR)
 * @param {string} monedaDestino - Moneda de cotización
 * @returns {Promise<number>} Tasa de conversión
 */
export async function obtenerTasaConversion(monedaOrigen, monedaDestino) {
  try {
    // Si son la misma moneda, tasa es 1
    if (monedaOrigen === monedaDestino) {
      return 1.0
    }

    // Obtener tasa directa
    const tasa = await obtenerTasa(monedaOrigen, monedaDestino)
    console.log(`🔄 Conversión ${monedaOrigen} → ${monedaDestino}: ${tasa}`)
    return tasa

  } catch (error) {
    console.error('❌ Error obteniendo tasa de conversión:', error)
    throw new Error(`No se encontró tasa de conversión de ${monedaOrigen} a ${monedaDestino}`)
  }
}

/**
 * Calcular conversión con impuestos y recargos
 * @param {Object} params - Parámetros de conversión
 * @param {number} params.base - Monto base (precio + fee emisión + fee agencia)
 * @param {string} params.monedaBase - Moneda del precio (USD/EUR)
 * @param {string} params.monedaCotizacion - Moneda de cotización
 * @param {string} params.metodoPago - Método de pago
 * @returns {Promise<Object>} Resultado con desglose
 */
export async function calcularConversionInteligente({
  base,
  monedaBase,
  monedaCotizacion,
  metodoPago
}) {
  try {
    console.log(`💱 Iniciando conversión inteligente:`, {
      base,
      monedaBase,
      monedaCotizacion,
      metodoPago
    })

    // 1. Obtener tasa de conversión
    const tasaConversion = await obtenerTasaConversion(monedaBase, monedaCotizacion)
    
    // 2. Calcular monto en moneda de cotización
    let montoConvertido = base * tasaConversion
    
    // 3. Aplicar impuestos según país si aplica
    let impuestos = 0
    let descripcionImpuestos = ''
    
    if (IMPUESTOS_PAIS[monedaCotizacion]) {
      impuestos = montoConvertido * IMPUESTOS_PAIS[monedaCotizacion]
      descripcionImpuestos = `+${(IMPUESTOS_PAIS[monedaCotizacion] * 100).toFixed(1)}% Impuestos ${monedaCotizacion}`
      montoConvertido += impuestos
    }
    
    // 4. Aplicar recargos específicos por método de pago
    let recargos = 0
    let descripcionRecargos = ''
    
    if (metodoPago === 'Scalapay') {
      recargos = montoConvertido * 0.093 // 9.3%
      descripcionRecargos = `+9.3% Scalapay`
      montoConvertido += recargos
    } else if (metodoPago === 'Arcadia Service') {
      const porcentaje = montoConvertido * 0.056 // 5.6%
      const fijo = 10 // USD fijo
      recargos = porcentaje + (fijo * tasaConversion) // Convertir fijo a moneda de cotización
      descripcionRecargos = `+5.6% + $10${monedaBase} Arcadia Service`
      montoConvertido += recargos
    } else if (metodoPago === 'Depósitos en dólares (BNC USD)') {
      recargos = montoConvertido * 0.035 // 3.5%
      descripcionRecargos = `+3.5% Depósito en dólares`
      montoConvertido += recargos
    }
    
    // 5. Retornar resultado completo
    const resultado = {
      // Montos
      baseOriginal: base,
      baseConvertida: base * tasaConversion,
      tasaConversion,
      impuestos,
      recargos,
      total: montoConvertido,
      
      // Monedas
      monedaBase,
      monedaCotizacion,
      
      // Descripciones para UI
      descripcionConversion: `1 ${monedaBase} = ${tasaConversion.toFixed(4)} ${monedaCotizacion}`,
      descripcionImpuestos,
      descripcionRecargos,
      
      // Método de pago
      metodoPago,
      
      // Desglose completo
      desglose: [
        {
          concepto: 'Base (precio + fees)',
          monto: base * tasaConversion,
          moneda: monedaCotizacion
        }
      ]
    }
    
    // Agregar impuestos al desglose si existen
    if (impuestos > 0) {
      resultado.desglose.push({
        concepto: 'Impuestos',
        monto: impuestos,
        moneda: monedaCotizacion,
        porcentaje: IMPUESTOS_PAIS[monedaCotizacion] * 100
      })
    }
    
    // Agregar recargos al desglose si existen
    if (recargos > 0) {
      resultado.desglose.push({
        concepto: 'Recargos',
        monto: recargos,
        moneda: monedaCotizacion,
        descripcion: descripcionRecargos
      })
    }
    
    console.log(`✅ Conversión completada:`, resultado)
    return resultado
    
  } catch (error) {
    console.error('❌ Error en conversión inteligente:', error)
    throw error
  }
}

/**
 * Obtener lista de monedas disponibles para cotización
 * @returns {Array} Lista de monedas con información
 */
export function getMonedasCotizacion() {
  return [
    { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$', base: true },
    { value: 'EUR', label: 'Euros (EUR)', symbol: '€', base: true },
    { value: 'VES', label: 'Bolívares (VES)', symbol: 'Bs.', base: false },
    { value: 'COP', label: 'Pesos Colombianos (COP)', symbol: '$', base: false },
    { value: 'USDT', label: 'USDT (Tether)', symbol: '₮', base: false },
    { value: 'GBP', label: 'Libras Esterlinas (GBP)', symbol: '£', base: false },
    { value: 'CAD', label: 'Dólares Canadienses (CAD)', symbol: 'C$', base: false },
    { value: 'AUD', label: 'Dólares Australianos (AUD)', symbol: 'A$', base: false },
    { value: 'JPY', label: 'Yenes Japoneses (JPY)', symbol: '¥', base: false },
    { value: 'CHF', label: 'Francos Suizos (CHF)', symbol: 'Fr', base: false }
  ]
}

/**
 * Obtener monedas base para precios
 * @returns {Array} Lista de monedas base
 */
export function getMonedasBase() {
  return MONEDAS_BASE.map(codigo => {
    const moneda = getMonedasCotizacion().find(m => m.value === codigo)
    return moneda
  })
}

/**
 * Validar si una moneda es base para precios
 * @param {string} codigo - Código de moneda
 * @returns {boolean}
 */
export function esMonedaBase(codigo) {
  return MONEDAS_BASE.includes(codigo)
}

/**
 * Obtener información de una moneda
 * @param {string} codigo - Código de moneda
 * @returns {Object|null} Información de la moneda
 */
export function getMonedaInfo(codigo) {
  return getMonedasCotizacion().find(m => m.value === codigo) || null
}
