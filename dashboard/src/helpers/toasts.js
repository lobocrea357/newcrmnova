import toast from 'react-hot-toast';

/**
 * Helper para react-hot-toast con estilos Tailwind CSS
 * 
 * Uso:
 * - toastSuccess('Guardado exitosamente')
 * - toastError('Error al guardar')
 * - toastInfo('Proceso iniciado')
 * - toastWarning('Cuidado con esta acción')
 * - toastLoading('Cargando...') // Retorna ID para dismiss posterior
 */

// Configuración base común para todos los toasts
const baseConfig = {
  duration: 3000,
  position: 'top-right',
  
  // Estilos con Tailwind
  style: {
    borderRadius: '0.5rem',
    padding: '1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
};

/**
 * Muestra un toast de éxito con borde verde
 * @param {string} message - Mensaje a mostrar
 * @param {Object} options - Opciones adicionales de react-hot-toast
 * @returns {string} ID del toast
 * @example
 * toastSuccess('Guardado exitosamente')
 * toastSuccess('Cotización creada', { duration: 5000 })
 */
export const toastSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...baseConfig,
    ...options,
    className: 'bg-white',
    style: {
      ...baseConfig.style,
      border: '2px solid #10B981', // green-500
      color: '#065F46', // green-800
      ...options.style,
    },
    iconTheme: {
      primary: '#10B981', // green-500
      secondary: '#FFFFFF',
    },
  });
};

/**
 * Muestra un toast de error con borde rojo (dura 4s por defecto)
 * @param {string} message - Mensaje de error
 * @param {Object} options - Opciones adicionales de react-hot-toast
 * @returns {string} ID del toast
 * @example
 * toastError('Error al guardar')
 * toastError('No se pudo conectar al servidor', { duration: 6000 })
 */
export const toastError = (message, options = {}) => {
  return toast.error(message, {
    ...baseConfig,
    duration: 4000, // Errores duran más
    ...options,
    className: 'bg-white',
    style: {
      ...baseConfig.style,
      border: '2px solid #EF4444', // red-500
      color: '#991B1B', // red-800
      ...options.style,
    },
    iconTheme: {
      primary: '#EF4444', // red-500
      secondary: '#FFFFFF',
    },
  });
};

/**
 * Muestra un toast informativo con borde azul
 * @param {string} message - Mensaje informativo
 * @param {Object} options - Opciones adicionales de react-hot-toast
 * @returns {string} ID del toast
 * @example
 * toastInfo('Proceso iniciado')
 * toastInfo('Sincronizando datos...', { duration: 5000 })
 */
export const toastInfo = (message, options = {}) => {
  return toast(message, {
    ...baseConfig,
    ...options,
    className: 'bg-white',
    icon: 'ℹ️',
    style: {
      ...baseConfig.style,
      border: '2px solid #3B82F6', // blue-500
      color: '#1E3A8A', // blue-900
      ...options.style,
    },
  });
};

/**
 * Muestra un toast de advertencia con borde ámbar
 * @param {string} message - Mensaje de advertencia
 * @param {Object} options - Opciones adicionales de react-hot-toast
 * @returns {string} ID del toast
 * @example
 * toastWarning('Cuidado con esta acción')
 * toastWarning('Cambios no guardados', { duration: 5000 })
 */
export const toastWarning = (message, options = {}) => {
  return toast(message, {
    ...baseConfig,
    ...options,
    className: 'bg-white',
    icon: '⚠️',
    style: {
      ...baseConfig.style,
      border: '2px solid #F59E0B', // amber-500
      color: '#92400E', // amber-800
      ...options.style,
    },
  });
};

/**
 * Muestra un toast de carga (no se auto-cierra, usar toastDismiss)
 * @param {string} message - Mensaje de carga
 * @param {Object} options - Opciones adicionales de react-hot-toast
 * @returns {string} ID del toast (necesario para toastDismiss)
 * @example
 * const loadingId = toastLoading('Guardando...')
 * // ... después de completar
 * toastDismiss(loadingId)
 * toastSuccess('Guardado')
 */
export const toastLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...baseConfig,
    duration: Infinity, // No se auto-cierra
    ...options,
    className: 'bg-white',
    style: {
      ...baseConfig.style,
      border: '2px solid #6B7280', // gray-500
      color: '#374151', // gray-700
      ...options.style,
    },
  });
};

/**
 * Muestra un toast que maneja automáticamente loading/success/error de una promesa
 * @param {Promise} promise - Promesa a ejecutar
 * @param {Object} messages - Mensajes para cada estado
 * @param {string} messages.loading - Mensaje durante carga
 * @param {string} messages.success - Mensaje al completar
 * @param {string} messages.error - Mensaje al fallar
 * @param {Object} options - Opciones adicionales de react-hot-toast
 * @returns {Promise} La misma promesa pasada
 * @example
 * await toastPromise(
 *   api.guardarCotizacion(data),
 *   {
 *     loading: 'Guardando cotización...',
 *     success: 'Cotización guardada',
 *     error: 'Error al guardar'
 *   }
 * )
 */
export const toastPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Cargando...',
      success: messages.success || 'Completado',
      error: messages.error || 'Error',
    },
    {
      ...baseConfig,
      ...options,
      success: {
        style: {
          ...baseConfig.style,
          border: '2px solid #10B981',
          color: '#065F46',
        },
        iconTheme: {
          primary: '#10B981',
          secondary: '#FFFFFF',
        },
      },
      error: {
        style: {
          ...baseConfig.style,
          border: '2px solid #EF4444',
          color: '#991B1B',
        },
        iconTheme: {
          primary: '#EF4444',
          secondary: '#FFFFFF',
        },
      },
    }
  );
};

/**
 * Cierra un toast específico o todos los toasts
 * @param {string} toastId - ID del toast a cerrar (opcional, si no se pasa cierra todos)
 * @returns {void}
 * @example
 * const id = toastLoading('Cargando...')
 * toastDismiss(id) // Cierra toast específico
 * toastDismiss() // Cierra todos los toasts
 */
export const toastDismiss = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss(); // Cierra todos
  }
};

/**
 * Muestra un toast personalizado con configuración base del proyecto
 * @param {string} message - Mensaje a mostrar
 * @param {Object} options - Opciones adicionales de react-hot-toast
 * @returns {string} ID del toast
 * @example
 * toastCustom('Mensaje custom', {
 *   duration: 10000,
 *   style: { border: '2px solid purple' }
 * })
 */
export const toastCustom = (message, options = {}) => {
  return toast(message, {
    ...baseConfig,
    ...options,
  });
};

// Exportar el objeto toast original por si se necesita
export { toast };
