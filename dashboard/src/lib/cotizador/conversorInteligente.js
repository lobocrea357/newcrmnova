import { obtenerTasa } from './tasasHelpers'

/**
 * Sistema Inteligente de Conversión de Monedas
 * Maneja la lógica de conversión según moneda de origen y destino
 */

// Nota: Solo COP tiene impuesto 4x1000 aplicado DESPUÉS de recargos

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
    
    // 3. Aplicar recargos específicos por método de pago
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
    
    // 4. Aplicar impuesto 4x1000 SOLO para COP (DESPUÉS de recargos)
    let impuestos = 0
    let descripcionImpuestos = ''
    
    if (monedaCotizacion === 'COP') {
      // Impuesto 4x1000 = 0.4% del monto total, redondeado al peso más cercano
      impuestos = Math.round(montoConvertido * 0.004)
      descripcionImpuestos = `Impuesto gobierno (4 COP por cada 1000)`
      montoConvertido += impuestos
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
        porcentaje: 0.4,
        descripcion: '4 COP por cada 1000'
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
