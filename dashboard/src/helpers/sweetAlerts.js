import Swal from "sweetalert2";

// 1. Función base genérica (1 sola función para todo)
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

// 2. Funciones auxiliares específicas (opcional, pero útiles para uso rápido)
export const successAlert = (message, options = {}) => 
  showAlert("success", message, options);

export const errorAlert = (message, options = {}) => 
  showAlert("error", message, options);

export const infoAlert = (message, options = {}) => 
  showAlert("info", message, options);

export const warningAlert = (message, options = {}) => 
  showAlert("warning", message, options);

export const confirmAlert = (message, options = {}) => 
  showAlert("confirm", message, options);