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

// 1. Toast de éxito
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

// 2. Toast de error
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

// 3. Toast informativo
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

// 4. Toast de advertencia
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

// 5. Toast de carga (loading)
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

// 6. Promise toast (para operaciones asíncronas)
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

// 7. Dismiss (cerrar toast específico o todos)
export const toastDismiss = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss(); // Cierra todos
  }
};

// 8. Toast personalizado (para casos especiales)
export const toastCustom = (message, options = {}) => {
  return toast(message, {
    ...baseConfig,
    ...options,
  });
};

// Exportar el objeto toast original por si se necesita
export { toast };
