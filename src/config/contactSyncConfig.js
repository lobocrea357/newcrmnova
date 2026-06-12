// src/config/contactSyncConfig.js
export const CONTACT_SYNC_CONFIG = {
  // Estrategia de actualización basada en tiempo (Opción B)
  HOURS_BETWEEN_WAHA_SYNC: 24, // Sincronizar con WAHA cada 24 horas
  
  // Flags para habilitar/deshabilitar funcionalidades
  ENABLE_NAME_SYNC: true, // Habilitar detección de cambios de nombre
  ENABLE_PROFILE_PICTURE_SYNC: true, // Habilitar detección de cambios de foto de perfil
  
  // Configuración de normalización de nombres
  NORMALIZE_NAMES: true, // Normalizar nombres antes de comparar (acentos, espacios, etc.)
  
  // Configuración de hash de imagen
  ENABLE_PROFILE_PICTURE_HASH: true, // Usar hash para detectar cambios reales en fotos
};
