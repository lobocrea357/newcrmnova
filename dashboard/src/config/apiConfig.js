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

// URLs específicas para APIs de cotizaciones
export const COTIZACIONES_API = {
  crear: buildApiUrl('/api/cotizaciones'),
  obtener: (id) => buildApiUrl(`/api/cotizaciones/${id}`),
  actualizar: (id) => buildApiUrl(`/api/cotizaciones/${id}`),
  eliminar: (id) => buildApiUrl(`/api/cotizaciones/${id}`),
  cambiarEstado: (id) => buildApiUrl(`/api/cotizaciones/${id}/estado`)
}

// URLs específicas para APIs de vuelos
export const VUELOS_API = {
  listar: buildApiUrl('/api/vuelos'),
  crear: buildApiUrl('/api/vuelos'),
  obtener: (id) => buildApiUrl(`/api/vuelos/${id}`),
  porEstado: (estado) => buildApiUrl(`/api/vuelos/estado/${estado}`),
  actualizar: (id) => buildApiUrl(`/api/vuelos/${id}`),
  eliminar: (id) => buildApiUrl(`/api/vuelos/${id}`),
  confirmarPago: (id) => buildApiUrl(`/api/vuelos/${id}/confirmar-pago`),
  marcarEmitido: (id) => buildApiUrl(`/api/vuelos/${id}/marcar-emitido`),
  actualizarPasajero: (pasajeroId) => buildApiUrl(`/api/vuelos/pasajeros/${pasajeroId}`),
  copiarPasajeros: (vueloId) => buildApiUrl(`/api/vuelos/${vueloId}/copiar-pasajeros`),
  subirAdjunto: (vueloId) => buildApiUrl(`/api/vuelos/${vueloId}/adjuntos`)
}

// URLs específicas para APIs de equipos
export const EQUIPOS_API = {
  listar: buildApiUrl('/api/equipos'),
  sinEquipo: buildApiUrl('/api/equipos/sin-equipo'),
  crear: buildApiUrl('/api/equipos'),
  actualizar: (id) => buildApiUrl(`/api/equipos/${id}`),
  eliminar: (id) => buildApiUrl(`/api/equipos/${id}`),
  asignar: buildApiUrl('/api/equipos/asignar'),
  remover: (userId) => buildApiUrl(`/api/equipos/remover/${userId}`),
}

// URLs específicas para APIs de anulables
export const ANULABLES_API = {
  listar: buildApiUrl('/api/anulables'),
  obtener: (id) => buildApiUrl(`/api/anulables/${id}`),
  crear: buildApiUrl('/api/anulables'),
  actualizar: (id) => buildApiUrl(`/api/anulables/${id}`),
  eliminar: (id) => buildApiUrl(`/api/anulables/${id}`)
}

// Exportar URL base para otros servicios
export { BACKEND_URL }

// console.log('🔧 API Config:', {
//   backend: BACKEND_URL,
//   tasasApi: TASAS_API
// })
