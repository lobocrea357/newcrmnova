import { getEventMetadata, formatEventDate } from '@/lib/poc/eventTypes';

/**
 * EventMarker - Componente para mostrar un evento en el timeline
 * 
 * @param {Object} props
 * @param {Object} props.event - Datos del evento
 * @param {string} props.event.event_type - Tipo de evento
 * @param {string} props.event.occurred_at - Fecha/hora del evento
 * @param {Object} props.event.event_data - Datos específicos del evento
 * @param {string} props.event.notes - Notas adicionales
 * @param {boolean} props.event.is_system_generated - Si fue generado automáticamente
 * @param {boolean} props.compact - Versión compacta (default: false)
 */
export default function EventMarker({ event, compact = false }) {
  const metadata = getEventMetadata(event.event_type);
  const formattedDate = formatEventDate(event.occurred_at);

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-2 px-3 py-2
          rounded-lg
          ${metadata.bgColor}
          ${metadata.borderColor}
          border
          transition-all duration-200
          hover:scale-[1.02]
          hover:shadow-sm
        `}
      >
        <span className="text-lg">{metadata.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${metadata.textColor}`}>
            {metadata.label}
          </p>
          <p className="text-[10px] text-gray-500 truncate">
            {formattedDate}
          </p>
        </div>
        {event.is_system_generated && (
          <span className="text-[10px] text-gray-400">Auto</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        relative w-full
        ${metadata.bgColor}
        ${metadata.borderColor}
        border-l-4
        rounded-r-lg
        p-4
        mb-3
        transition-all duration-200
        hover:shadow-md
        hover:scale-[1.01]
      `}
    >
      {/* Header del evento */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{metadata.icon}</span>
          <div>
            <h3 className={`font-semibold ${metadata.textColor}`}>
              {metadata.label}
            </h3>
            <p className="text-xs text-gray-500">
              {formattedDate}
            </p>
          </div>
        </div>
        
        {/* Indicador de sistema */}
        {event.is_system_generated && (
          <span
            className="inline-flex items-center gap-1
            px-2 py-0.5
            bg-white/50
            text-gray-600
            text-[10px]
            rounded-full
            border border-gray-200"
          >
            <span>⚡</span>
            <span>Automático</span>
          </span>
        )}
      </div>

      {/* Datos del evento si existen */}
      {event.event_data && Object.keys(event.event_data).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200/50">
          <div className="text-xs text-gray-600 space-y-1">
            {Object.entries(event.event_data).map(([key, value]) => {
              if (value === null || value === undefined) return null;
              
              // Formatear valores especiales
              let displayValue = value;
              if (typeof value === 'number') {
                if (key === 'amount' || key.includes('monto')) {
                  displayValue = `$${value.toLocaleString('es-VE')}`;
                }
              }
              
              return (
                <div key={key} className="flex gap-2">
                  <span className="font-medium text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-gray-700">{String(displayValue)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notas si existen */}
      {event.notes && (
        <div className="mt-2 pt-2 border-t border-gray-200/50">
          <p className="text-sm text-gray-600 italic">
            "{event.notes}"
          </p>
        </div>
      )}
    </div>
  );
}
