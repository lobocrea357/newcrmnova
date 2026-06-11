import Swal from "sweetalert2";
import { toastSuccess as toastSuccessHelper, toastError as toastErrorHelper } from './toasts';

/**
 * Función base genérica para mostrar alertas SweetAlert2
 * @param {string} type - Tipo de alerta: 'success', 'error', 'info', 'warning', 'confirm'
 * @param {string} message - Mensaje a mostrar
 * @param {Object} options - Opciones adicionales de SweetAlert2
 * @returns {Promise} Promesa que se resuelve con el resultado de la alerta
 * @example
 * showAlert('success', 'Guardado exitosamente')
 * showAlert('confirm', '¿Eliminar este registro?', { confirmButtonText: 'Sí' })
 */
const showAlert = (type, message, options = {}) => {
  // Configuraciones por defecto según tipo
  const defaultConfig = {
    success: {
      title: "Éxito",
      icon: "success",
      timer: 2000,
      showConfirmButton: false
    },
    error: {
      title: "Error",
      icon: "error",
      timer: 2000,
      showConfirmButton: false
    },
    info: {
      title: "Información",
      icon: "info",
      timer: 2000,
      showConfirmButton: false
    },
    warning: {
      title: "Advertencia",
      icon: "warning",
      timer: 2000,
      showConfirmButton: false
    },
    confirm: {
      title: "¿Estás seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, continuar!",
      cancelButtonText: "Cancelar"
    }
  }[type] || {};

  // Fusionar configuración base + opciones personalizadas
  return Swal.fire({
    ...defaultConfig,
    text: message,
    ...options
  });
};

/**
 * Muestra una alerta de éxito (se cierra automáticamente en 2s)
 * @param {string} message - Mensaje de éxito
 * @param {Object} options - Opciones adicionales de SweetAlert2
 * @returns {Promise} Promesa que se resuelve al cerrar la alerta
 * @example
 * successAlert('Guardado exitosamente')
 * successAlert('Cotización creada', { timer: 3000 })
 */
export const successAlert = (message, options = {}) => 
  showAlert("success", message, options);

/**
 * Muestra una alerta de error (se cierra automáticamente en 2s)
 * @param {string} message - Mensaje de error
 * @param {Object} options - Opciones adicionales de SweetAlert2
 * @returns {Promise} Promesa que se resuelve al cerrar la alerta
 * @example
 * errorAlert('Error al guardar')
 * errorAlert('No se pudo conectar', { timer: 3000 })
 */
export const errorAlert = (message, options = {}) => 
  showAlert("error", message, options);

/**
 * Muestra una alerta informativa (se cierra automáticamente en 2s)
 * @param {string} message - Mensaje informativo
 * @param {Object} options - Opciones adicionales de SweetAlert2
 * @returns {Promise} Promesa que se resuelve al cerrar la alerta
 * @example
 * infoAlert('Proceso iniciado')
 * infoAlert('Sincronizando datos...', { timer: 3000 })
 */
export const infoAlert = (message, options = {}) => 
  showAlert("info", message, options);

/**
 * Muestra una alerta de advertencia (se cierra automáticamente en 2s)
 * @param {string} message - Mensaje de advertencia
 * @param {Object} options - Opciones adicionales de SweetAlert2
 * @returns {Promise} Promesa que se resuelve al cerrar la alerta
 * @example
 * warningAlert('Cuidado con esta acción')
 * warningAlert('Cambios no guardados', { timer: 3000 })
 */
export const warningAlert = (message, options = {}) => 
  showAlert("warning", message, options);

/**
 * Muestra una alerta de confirmación con botones Sí/Cancelar
 * @param {string} message - Mensaje de confirmación
 * @param {Object} options - Opciones adicionales de SweetAlert2
 * @returns {Promise<boolean>} Promesa que resuelve true si confirma, false si cancela
 * @example
 * const confirmed = await confirmAlert('¿Eliminar este registro?')
 * if (confirmed) { // eliminar }
 * 
 * const result = await confirmAlert('¿Guardar cambios?', {
 *   confirmButtonText: 'Guardar',
 *   cancelButtonText: 'No guardar'
 * })
 */
export const confirmAlert = (message, options = {}) => 
  showAlert("confirm", message, options);
