/**
 * Formatear fecha de string YYYY-MM-DD a formato local español
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @param {Object} options - Opciones de formateo
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fechaString, options = {}) {
  if (!fechaString) return 'No especificada';

  const [year, month, day] = fechaString.split('-');
  const date = new Date(year, month - 1, day);

  const defaultOptions = {
    weekday: options.weekday || undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return date.toLocaleDateString('es-ES', defaultOptions);
}

/**
 * Formatear fecha corta (solo día/mes/año)
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada corta
 */
export function formatearFechaCorta(fechaString) {
  if (!fechaString) return 'N/A';
  return formatearFecha(fechaString);
}

/**
 * Formatear fecha larga con día de la semana
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada larga
 */
export function formatearFechaLarga(fechaString) {
  if (!fechaString) return 'No especificada';
  return formatearFecha(fechaString, { weekday: 'long' });
}

/**
 * Calcular tiempo relativo (hace X minutos, horas, días)
 * @param {string} dateString - Fecha ISO string
 * @returns {string} Tiempo relativo
 */
export function tiempoRelativo(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  return formatearFechaCorta(dateString);
}
