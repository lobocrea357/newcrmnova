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
  activas: buildApiUrl('/api/tasas/activas'),
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
  cambiarEstado: (id) => buildApiUrl(`/api/cotizaciones/${id}/estado`),
  softDelete: (id) => buildApiUrl(`/api/cotizaciones/${id}/soft-delete`)
}

// URLs específicas para APIs de vuelos
export const VUELOS_API = {
  listar: buildApiUrl('/api/vuelos'),
  crear: buildApiUrl('/api/vuelos'),
  obtener: (id) => buildApiUrl(`/api/vuelos/${id}`),
  porEstado: (estado) => buildApiUrl(`/api/vuelos/estado/${estado}`),
  actualizar: (id) => buildApiUrl(`/api/vuelos/${id}`),
  editar: (id) => buildApiUrl(`/api/vuelos/${id}/editar`),
  historialEdiciones: (id) => buildApiUrl(`/api/vuelos/${id}/historial-ediciones`),
  historialCambios: (id) => buildApiUrl(`/api/vuelos/${id}/historial`),
  eliminar: (id) => buildApiUrl(`/api/vuelos/${id}`),
  confirmarPago: (id) => buildApiUrl(`/api/vuelos/${id}/confirmar-pago`),
  observarPago: (id) => buildApiUrl(`/api/vuelos/${id}/observar-pago`),
  marcarEmitido: (id) => buildApiUrl(`/api/vuelos/${id}/marcar-emitido`),
  actualizarPasajero: (pasajeroId) => buildApiUrl(`/api/vuelos/pasajeros/${pasajeroId}`),
  copiarPasajeros: (vueloId) => buildApiUrl(`/api/vuelos/${vueloId}/copiar-pasajeros`),
  subirAdjunto: (vueloId) => buildApiUrl(`/api/vuelos/${vueloId}/adjuntos`),
  autorizarEmision: (id) => buildApiUrl(`/api/vuelos/${id}/autorizar-emision`),
  autorizarEmisionBatch: () => buildApiUrl('/api/vuelos/autorizar-emision-batch'),
  solicitarAutorizacion: (id) => buildApiUrl(`/api/vuelos/${id}/solicitar-autorizacion`)
}

// URLs específicas para APIs de deudas con proveedores
export const DEUDAS_API = {
  listar: buildApiUrl('/api/deudas-proveedores'),
  registrarPago: buildApiUrl('/api/deudas-proveedores/pagos')
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

// URLs específicas para APIs de rankings
export const RANKINGS_API = {
  global: buildApiUrl('/api/rankings/global'),
  personal: (userId) => buildApiUrl(`/api/rankings/personal/${userId}`)
}


// URLs específicas para APIs de anulables
export const ANULABLES_API = {
  listar: buildApiUrl('/api/anulables'),
  obtener: (id) => buildApiUrl(`/api/anulables/${id}`),
  crear: buildApiUrl('/api/anulables'),
  actualizar: (id) => buildApiUrl(`/api/anulables/${id}`),
  eliminar: (id) => buildApiUrl(`/api/anulables/${id}`)
}

// URLs específicas para APIs de agencias
export const AGENCIAS_API = {
  listar: buildApiUrl('/api/agencias'),
  obtener: (id) => buildApiUrl(`/api/agencias/${id}`),
  crear: buildApiUrl('/api/agencias'),
  actualizar: (id) => buildApiUrl(`/api/agencias/${id}`),
  eliminar: (id) => buildApiUrl(`/api/agencias/${id}`),
  usuarios: (id) => buildApiUrl(`/api/agencias/${id}/users`),
  agenciasUsuario: (userId) => buildApiUrl(`/api/agencias/user/${userId}`),
  asignarUsuario: (id) => buildApiUrl(`/api/agencias/${id}/users`),
  removerUsuario: (id, userId) => buildApiUrl(`/api/agencias/${id}/users/${userId}`),
  setPrimaria: (id, userId) => buildApiUrl(`/api/agencias/${id}/users/${userId}/primary`),
}

// URLs específicas para APIs de sedes
export const SEDES_API = {
  listar: buildApiUrl('/api/sedes'),
  obtener: (id) => buildApiUrl(`/api/sedes/${id}`),
  crear: buildApiUrl('/api/sedes'),
  actualizar: (id) => buildApiUrl(`/api/sedes/${id}`),
  eliminar: (id) => buildApiUrl(`/api/sedes/${id}`),
  usuarios: (id) => buildApiUrl(`/api/sedes/${id}/users`),
  asignarUsuario: (id) => buildApiUrl(`/api/sedes/${id}/users`),
  removerUsuario: (id, userId) => buildApiUrl(`/api/sedes/${id}/users/${userId}`),
}

// URLs específicas para APIs de usuarios
export const USERS_API = {
  listar: buildApiUrl('/api/users'),
}

// URLs específicas para APIs de métricas
export const METRICAS_API = {
  emisiones: (periodo) => buildApiUrl(`/api/metricas/emisiones?periodo=${periodo}`)
}

// Exportar URL base para otros servicios
export { BACKEND_URL }

// console.log('🔧 API Config:', {
//   backend: BACKEND_URL,
//   tasasApi: TASAS_API
// })
