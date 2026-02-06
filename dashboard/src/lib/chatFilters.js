/**
 * Utilidades para filtrado inteligente de chats
 * Detecta chats internos, grupos, spam, etc. SIN usar IA
 */

/**
 * Patrones que indican chats internos o de prueba
 */
const INTERNAL_PATTERNS = {
  // Nombres numéricos puros (IDs de grupo)
  numericOnly: /^\d+$/,
  
  // Palabras clave de grupos internos
  keywords: [
    'grupo',
    'equipo',
    'staff',
    'gerencia',
    'reunion',
    'reunión',
    'meeting',
    'team',
    'internal',
    'interno',
    'prueba',
    'test',
    'demo'
  ],
  
  // Bots de prueba conocidos (case-insensitive)
  testBots: [
    'abraham',
    'abrahama',
    'paul',
    'hernandez'
  ]
};

/**
 * Detecta si un chat es interno basándose en el nombre del contacto
 * @param {string} contactName - Nombre del contacto
 * @returns {boolean} - true si parece ser un chat interno
 */
export function isInternalChat(contactName) {
  if (!contactName || typeof contactName !== 'string') {
    return false;
  }

  const nameLower = contactName.toLowerCase().trim();

  // 1. Nombres que son solo números (IDs de grupo)
  if (INTERNAL_PATTERNS.numericOnly.test(nameLower)) {
    return true;
  }

  // 2. Contiene palabras clave de grupos internos
  const hasKeyword = INTERNAL_PATTERNS.keywords.some(keyword => 
    nameLower.includes(keyword)
  );
  if (hasKeyword) {
    return true;
  }

  // 3. Nombres muy cortos (probablemente IDs)
  if (nameLower.length <= 2) {
    return true;
  }

  return false;
}

/**
 * Detecta si un bot es de prueba
 * @param {string} botName - Nombre del bot/sesión
 * @returns {boolean} - true si es un bot de prueba
 */
export function isTestBot(botName) {
  if (!botName || typeof botName !== 'string') {
    return false;
  }

  const nameLower = botName.toLowerCase().trim();

  return INTERNAL_PATTERNS.testBots.some(testBot => 
    nameLower.includes(testBot)
  );
}

/**
 * Filtra chats aplicando reglas estructurales (SIN IA)
 * @param {Array} chats - Array de chats a filtrar
 * @param {Object} options - Opciones de filtrado
 * @returns {Object} - {filtered: Array, stats: Object}
 */
export function applyStructuralFilters(chats, options = {}) {
  const {
    excludeGroups = true,
    excludeInternal = true,
    minMessages = 5,
    useCache = true,
  } = options;

  const stats = {
    total: chats.length,
    excluded_groups: 0,
    excluded_internal: 0,
    excluded_cache: 0,
    excluded_no_messages: 0,
    passed: 0,
  };

  const filtered = chats.filter(chat => {
    // FILTRO 1: Excluir grupos explícitos
    if (excludeGroups && chat.is_group === true) {
      stats.excluded_groups++;
      return false;
    }

    // FILTRO 2: Excluir chats internos por nombre
    if (excludeInternal && isInternalChat(chat.contact_name || chat.name)) {
      stats.excluded_internal++;
      return false;
    }

    // FILTRO 3: Usar cache de análisis previo si existe
    if (useCache && chat.ai_analysis?.is_customer_chat === false) {
      stats.excluded_cache++;
      return false;
    }

    // FILTRO 4: Verificar que tenga mensajes suficientes
    // (este filtro puede aplicarse después si es muy costoso)
    
    stats.passed++;
    return true;
  });

  return { filtered, stats };
}

/**
 * Genera un reporte legible de estadísticas de filtrado
 * @param {Object} stats - Estadísticas de filtrado
 * @returns {string} - Reporte formateado
 */
export function generateFilterReport(stats) {
  return `
🔍 Filtrado de conversaciones:
  • Total: ${stats.total}
  • ❌ Grupos excluidos: ${stats.excluded_groups}
  • ❌ Chats internos: ${stats.excluded_internal}
  • 💾 Excluidos por cache: ${stats.excluded_cache}
  • ✅ Conversaciones válidas: ${stats.passed}
  `.trim();
}

/**
 * Divide un array en chunks para procesamiento por lotes
 * @param {Array} array - Array a dividir
 * @param {number} size - Tamaño de cada chunk
 * @returns {Array} - Array de chunks
 */
export function chunkArray(array, size = 15) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Valida que un chat tenga el formato esperado
 * @param {Object} chat - Objeto de chat
 * @returns {boolean} - true si es válido
 */
export function isValidChat(chat) {
  return !!(
    chat &&
    chat.id &&
    (chat.contact_name || chat.name || chat.contact_phone)
  );
}
