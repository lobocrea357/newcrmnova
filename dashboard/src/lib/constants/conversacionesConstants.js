// dashboard/src/lib/constants/conversacionesConstants.js

/**
 * Constantes para el módulo de conversaciones
 */

// Límites y paginación
export const CONVERSATIONS_PAGE_SIZE = 10;
export const SALES_LIMIT = 200;
export const SYNC_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

// Estados de bots
export const BOT_STATUS = {
  WORKING: 'WORKING',
  ACTIVE: 'ACTIVE',
  STARTING: 'STARTING',
  STOPPED: 'STOPPED'
};

// Estados de filtro
export const FILTER_STATUS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};
