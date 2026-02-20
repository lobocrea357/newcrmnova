/**
 * Configuración de URLs para APIs
 * Ajusta según tu entorno de desarrollo/producción
 */

// Detectar si estamos en desarrollo o producción
// En desarrollo local con Docker, siempre usamos localhost:4000 para el backend
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'

// URLs base para diferentes servicios
const API_BASE_URLS = {
  // En desarrollo local, el backend corre en localhost:4000 (accesible desde el navegador)
  development: {
    backend: 'http://localhost:4000',
    dashboard: 'http://localhost:3001'
  },
  
  // En producción, usa nombres de servicios de Docker o proxy
  production: {
    backend: '/api',  // Proxy configurado en Next.js
    dashboard: ''
  }
}

// Seleccionar URLs según entorno
const currentEnv = isDevelopment ? 'development' : 'production'
const urls = API_BASE_URLS[currentEnv]

// Exportar URLs base
export const BACKEND_URL = urls.backend
export const DASHBOARD_URL = urls.dashboard

// Helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  const baseUrl = BACKEND_URL
  
  // En desarrollo, el backend está en localhost:4000, endpoint ya incluye /api
  if (isDevelopment) {
    return `${baseUrl}${endpoint}`
  }
  
  // En producción, usar proxy de Next.js (endpoint sin /api)
  if (endpoint.startsWith('/api')) {
    return endpoint  // El proxy se encarga
  }
  
  return `${baseUrl}${endpoint}`
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

console.log('🔧 API Config:', {
  env: currentEnv,
  backend: BACKEND_URL,
  dashboard: DASHBOARD_URL,
  tasasApi: TASAS_API
})
