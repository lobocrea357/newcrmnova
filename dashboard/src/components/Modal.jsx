import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Componente Modal Genérico - Totalmente Configurable
 * 
 * Props:
 * - onShow (boolean): Controla si el modal es visible
 * - onClose (function): Función para cerrar el modal
 * - titulo (string): Título del modal
 * - children (ReactNode): Contenido del modal
 * - variant (string): Variante predefinida ('default', 'danger', 'success', 'warning', 'dark')
 * - size (string): Tamaño del modal ('sm', 'md', 'lg', 'xl', 'full')
 * - showCloseButton (boolean): Muestra/oculta botón de cerrar (default: true)
 * - closeOnOverlayClick (boolean): Cierra al hacer click en el overlay (default: true)
 * - closeOnEscape (boolean): Cierra al presionar Escape (default: true)
 * - loading (boolean): Muestra estado de carga
 * - footer (ReactNode): Contenido del footer opcional
 * - headerClassName (string): Clases adicionales para el header
 * - bodyClassName (string): Clases adicionales para el body
 * - footerClassName (string): Clases adicionales para el footer
 * - overlayClassName (string): Clases adicionales para el overlay
 * - modalClassName (string): Clases adicionales para el modal
 * - titleClassName (string): Clases adicionales para el título
 */

// Variantes predefinidos
const variants = {
  default: {
    overlay: 'bg-black/50',
    modal: 'bg-white',
    header: 'bg-white border-gray-200',
    title: 'text-gray-900',
    closeButton: 'text-gray-400 hover:text-gray-600',
  },
  danger: {
    overlay: 'bg-red-900/50',
    modal: 'bg-white border-2 border-red-500',
    header: 'bg-red-50 border-red-200',
    title: 'text-red-900',
    closeButton: 'text-red-400 hover:text-red-600',
  },
  success: {
    overlay: 'bg-green-900/50',
    modal: 'bg-white border-2 border-green-500',
    header: 'bg-green-50 border-green-200',
    title: 'text-green-900',
    closeButton: 'text-green-400 hover:text-green-600',
  },
  warning: {
    overlay: 'bg-yellow-900/50',
    modal: 'bg-white border-2 border-yellow-500',
    header: 'bg-yellow-50 border-yellow-200',
    title: 'text-yellow-900',
    closeButton: 'text-yellow-400 hover:text-yellow-600',
  },
  dark: {
    overlay: 'bg-black/70',
    modal: 'bg-gray-900',
    header: 'bg-gray-800 border-gray-700',
    title: 'text-white',
    closeButton: 'text-gray-400 hover:text-white',
  },
};

// Tamaños predefinidos
const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-full mx-4',
};

const Modal = ({
  onShow,
  onClose,
  titulo,
  children,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  loading = false,
  footer,
  headerClassName,
  bodyClassName,
  footerClassName,
  overlayClassName,
  modalClassName,
  titleClassName,
}) => {
  // Manejar tecla Escape
  useEffect(() => {
    if (!closeOnEscape || !onShow) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, onShow, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (onShow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [onShow]);

  if (!onShow) return null;

  const variantStyles = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.md;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity',
          variantStyles.overlay,
          overlayClassName
        )}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Content */}
        <div
          className={cn(
            'rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto transition-all',
            variantStyles.modal,
            sizeClass,
            modalClassName
          )}
          onClick={(e) => e.stopPropagation()}
          role="document"
        >
          {/* Header */}
          {titulo && (
            <div
              className={cn(
                'sticky top-0 border-b px-6 py-4 flex items-center justify-between',
                variantStyles.header,
                headerClassName
              )}
            >
              <h2
                id="modal-title"
                className={cn(
                  'text-xl font-bold',
                  variantStyles.title,
                  titleClassName
                )}
              >
                {titulo}
              </h2>
              {showCloseButton && !loading && (
                <button
                  onClick={onClose}
                  className={cn(
                    'transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800',
                    variantStyles.closeButton
                  )}
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}

          {/* Body */}
          <div className={cn('p-6', bodyClassName)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className={cn(
                'sticky bottom-0 border-t px-6 py-4 bg-gray-50 dark:bg-gray-800',
                variantStyles.header,
                footerClassName
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal;
