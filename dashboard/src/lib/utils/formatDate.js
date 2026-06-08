/**
 * Utilidades de formateo de fechas para el proyecto
 * Consolidación de funciones duplicadas en múltiples componentes
 */

export function formatDate(timestamp, options = {}) {
  if (!timestamp) return 'N/A'
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return 'N/A'
  
  const { 
    includeTime = false, 
    locale = 'es-ES',
    dateStyle = 'medium',
    timeStyle = 'short'
  } = options
  
  if (includeTime) {
    return date.toLocaleString(locale, { 
      dateStyle, 
      timeStyle 
    })
  }
  
  return date.toLocaleDateString(locale, { dateStyle })
}

export function formatTime(timestamp) {
  if (!timestamp) return 'N/A'
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return 'N/A'
  
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export function formatResponseTime(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes))
    return null;
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}
