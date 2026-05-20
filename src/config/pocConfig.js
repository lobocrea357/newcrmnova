/**
 * Configuración centralizada para el sistema PoC (Proof of Concept)
 * de análisis de threads de clientes
 * 
 * IMPORTANTE: Esta es la ÚNICA fuente de verdad para la lista de bots PoC.
 * Cualquier cambio aquí se refleja automáticamente en:
 * - pocThreadService.js (sincronización de threads)
 * - webhookService.js (procesamiento de mensajes en tiempo real)
 */

export const POC_CONFIG = {
  /**
   * Lista de bots incluidos en el sistema PoC
   * Usar session_name exacto de la tabla 'bots'
   */
  BOTS: [
    'gabriel_riera_nova_moises',
    'dulce_baptista_nova_moises',
    'mariangel_arteaga_nova_moises',
    'mariangel_yepes_colombia_endry_2'
  ],

  /**
   * Configuración de sincronización
   */
  SYNC: {
    // Habilitar logs detallados para debugging
    VERBOSE_LOGGING: true,
    
    // Timeout para operaciones de sincronización (ms)
    TIMEOUT_MS: 30000,
    
    // Reintentos en caso de fallo
    MAX_RETRIES: 3
  },

  /**
   * Configuración de métricas
   */
  METRICS: {
    // Palabras clave para detectar menciones de pago
    PAYMENT_KEYWORDS: ['pago', 'transferencia', 'zelle', 'paypal', 'scalapay'],
    
    // Palabras clave para detectar cotizaciones
    QUOTATION_KEYWORDS: ['cotizacion', 'cotización', 'presupuesto']
  }
};

/**
 * Verifica si un bot está incluido en el sistema PoC
 * @param {string} sessionName - Nombre de sesión del bot
 * @returns {boolean}
 */
export function isBotInPoC(sessionName) {
  return POC_CONFIG.BOTS.includes(sessionName);
}

/**
 * Obtiene la lista de bots PoC
 * @returns {string[]}
 */
export function getPoCBots() {
  return [...POC_CONFIG.BOTS]; // Retornar copia para evitar mutaciones
}

/**
 * Agrega un bot al sistema PoC (uso administrativo)
 * @param {string} sessionName - Nombre de sesión del bot
 */
export function addBotToPoC(sessionName) {
  if (!POC_CONFIG.BOTS.includes(sessionName)) {
    POC_CONFIG.BOTS.push(sessionName);
    console.log(`[PoC Config] Bot agregado: ${sessionName}`);
  }
}

/**
 * Remueve un bot del sistema PoC (uso administrativo)
 * @param {string} sessionName - Nombre de sesión del bot
 */
export function removeBotFromPoC(sessionName) {
  const index = POC_CONFIG.BOTS.indexOf(sessionName);
  if (index > -1) {
    POC_CONFIG.BOTS.splice(index, 1);
    console.log(`[PoC Config] Bot removido: ${sessionName}`);
  }
}

export default POC_CONFIG;
