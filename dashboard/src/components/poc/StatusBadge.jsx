import { getStatusMetadata } from '@/lib/poc/eventTypes';

/**
 * StatusBadge - Componente para mostrar el estado de un lead
 * 
 * @param {Object} props
 * @param {string} props.status - Estado del lead (NUEVO, EN_NEGOCIACION, etc.)
 * @param {boolean} props.showIcon - Si mostrar el icono (default: true)
 * @param {boolean} props.showLabel - Si mostrar el label (default: true)
 * @param {string} props.size - Tamaño: 'sm', 'md', 'lg' (default: 'md')
 */
export default function StatusBadge({ 
  status, 
  showIcon = true, 
  showLabel = true,
  size = 'md'
}) {
  const metadata = getStatusMetadata(status);
  
  if (!status) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const iconSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        font-medium
        ${metadata.bgColor}
        ${metadata.textColor}
        ${metadata.borderColor}
        border
        ${sizeClasses[size]}
        transition-all duration-200
        hover:scale-105
      `}
      title={metadata.description}
    >
      {showIcon && (
        <span className={iconSize[size]}>
          {metadata.icon}
        </span>
      )}
      {showLabel && (
        <span>{metadata.label}</span>
      )}
    </span>
  );
}
