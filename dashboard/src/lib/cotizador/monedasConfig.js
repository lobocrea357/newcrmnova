/**
 * Configuración centralizada de monedas
 * Fuente única de verdad para todas las monedas del sistema
 */

const MONEDAS_BASE = ['USD', 'EUR']

const MONEDAS_DISPONIBLES = [
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

/**
 * Obtener todas las monedas disponibles para cotización
 */
export function getMonedasCotizacion() {
  return MONEDAS_DISPONIBLES
}

/**
 * Obtener solo monedas base (USD, EUR)
 */
export function getMonedasBase() {
  return MONEDAS_DISPONIBLES.filter(m => m.base)
}

/**
 * Obtener información de una moneda por código
 * @param {string} codigo - Código de la moneda (ej: 'USD', 'EUR')
 * @returns {object|null} - Objeto con info de la moneda o null
 */
export function getMonedaInfo(codigo) {
  return MONEDAS_DISPONIBLES.find(m => m.value === codigo) || null
}

/**
 * Verificar si una moneda es base (USD o EUR)
 * @param {string} codigo - Código de la moneda
 * @returns {boolean}
 */
export function esMonedaBase(codigo) {
  return MONEDAS_BASE.includes(codigo)
}

/**
 * Obtener símbolo de una moneda
 * @param {string} codigo - Código de la moneda
 * @returns {string} - Símbolo de la moneda o '$' por defecto
 */
export function getSimboloMoneda(codigo) {
  const moneda = getMonedaInfo(codigo)
  return moneda?.symbol || '$'
}
