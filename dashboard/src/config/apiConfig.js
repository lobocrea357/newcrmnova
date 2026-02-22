/**
 * Configuración de URLs para APIs
 * Centralizada usando variables de entorno como los otros servicios
 */

// URL base del backend - misma lógica que messageService.js
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  // Si el endpoint ya es una URL completa, retornarla
  if (endpoint.startsWith('http')) {
    return endpoint
  }
  
  // Construir URL base + endpoint
  return `${BACKEND_URL}${endpoint}`
}

// URLs específicas para APIs de tasas
export const TASAS_API = {
  crear: buildApiUrl('/api/tasas/crear'),
  actualizar: buildApiUrl('/api/tasas/actualizar'),
  eliminar: (id) => buildApiUrl(`/api/tasas/eliminar/${id}`),
  crearMoneda: buildApiUrl('/api/tasas/crear-moneda'),
  actualizarMoneda: buildApiUrl('/api/tasas/actualizar-moneda'),
  eliminarMoneda: (id) => buildApiUrl(`/api/tasas/eliminar-moneda/${id}`)
}

// Exportar URL base para otros servicios
export { BACKEND_URL }

console.log('🔧 API Config:', {
  backend: BACKEND_URL,
  tasasApi: TASAS_API
})
