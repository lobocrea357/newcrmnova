import { useState, useEffect } from 'react';
import { Clock, MessageSquare, Calendar, File, Image, Video, Download } from 'lucide-react';
import EventMarker from './EventMarker';
import AudioPlayer from './AudioPlayer';
import { POC_API } from '@/config/apiConfig';

/**
 * TimelineEnriched - Componente que muestra timeline enriquecido con mensajes y eventos intercalados
 * 
 * @param {Object} props
 * @param {string} props.threadId - ID del thread
 * @param {boolean} props.showMessages - Si mostrar mensajes (default: true)
 * @param {boolean} props.showEvents - Si mostrar eventos (default: true)
 * @param {boolean} props.milestonesOnly - Solo mostrar hitos destacados (default: false)
 */
export default function TimelineEnriched({
  threadId,
  showMessages = true,
  showEvents = true,
  milestonesOnly = false
}) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!threadId) return;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(POC_API.timelineEnriched(threadId));
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Error cargando timeline');
        }

        // Filtrar según opciones
        let filteredTimeline = data.data;

        if (!showMessages) {
          filteredTimeline = filteredTimeline.filter(item => item.type !== 'message');
        }

        if (!showEvents) {
          filteredTimeline = filteredTimeline.filter(item => item.type !== 'event');
        }

        if (milestonesOnly) {
          filteredTimeline = filteredTimeline.filter(
            item => item.type === 'event' && item.data.is_milestone
          );
        }

        setTimeline(filteredTimeline);
      } catch (err) {
        console.error('[TimelineEnriched] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [threadId, showMessages, showEvents, milestonesOnly]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (item) => {
    const msg = item.data;
    // from_me: true = enviado por el bot, false = enviado por el cliente
    const isFromBot = msg.from_me === true;
    const mediaFile = msg.media_file;

    // Determinar tipo de media
    const getMediaType = () => {
      if (!mediaFile) return null;
      const mime = mediaFile.mimetype || mediaFile.media_mimetype || '';
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      return 'file';
    };

    const mediaType = getMediaType();

    return (
      <div
        key={`msg-${msg.id}`}
        className={`
          flex gap-3 mb-4
          ${isFromBot ? 'flex-row-reverse' : 'flex-row'}
        `}
      >
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full
          ${isFromBot ? 'bg-indigo-100' : 'bg-green-100'}
          flex items-center justify-center
          ${isFromBot ? 'text-indigo-600' : 'text-green-600'}
          font-semibold text-sm
        `}>
          {isFromBot ? '🤖' : '👤'}
        </div>

        {/* Contenido del mensaje */}
        <div
          className={`
            max-w-[70%]
            rounded-2xl px-4 py-3
            ${isFromBot
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200'
            }
          `}
        >
          {/* Nombre del bot o cliente */}
          <div className={`text-xs font-medium mb-1 ${isFromBot ? 'text-indigo-200' : 'text-gray-500'}`}>
            {isFromBot ? (msg.bot?.session_name || 'Bot') : 'Cliente'}
          </div>

          {/* Multimedia */}
          {mediaFile && (
            <div className="mb-2">
              {mediaType === 'image' && (
                <div className="relative">
                  <img
                    src={mediaFile.file_url || mediaFile.media_url}
                    alt={mediaFile.file_name || 'Imagen'}
                    className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                  />
                  <a
                    href={mediaFile.file_url || mediaFile.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`absolute top-2 right-2 p-2 rounded-full ${isFromBot ? 'bg-white/20 hover:bg-white/30' : 'bg-black/20 hover:bg-black/30'
                      } transition-colors`}
                  >
                    <Download className="h-4 w-4 text-white" />
                  </a>
                </div>
              )}

              {mediaType === 'video' && (
                <div className="relative">
                  <video
                    src={mediaFile.file_url || mediaFile.media_url}
                    controls
                    className="rounded-lg max-w-full h-auto max-h-64"
                  />
                </div>
              )}

              {mediaType === 'audio' && (
                <AudioPlayer
                  src={mediaFile.file_url || mediaFile.media_url}
                  isFromBot={isFromBot}
                />
              )}

              {mediaType === 'file' && (
                <a
                  href={mediaFile.file_url || mediaFile.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center gap-2 p-3 rounded-lg
                    ${isFromBot
                      ? 'bg-indigo-500/30 hover:bg-indigo-500/50'
                      : 'bg-gray-100 hover:bg-gray-200'
                    }
                    transition-colors
                  `}
                >
                  <File className="h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {mediaFile.file_name || 'Archivo'}
                    </div>
                    {mediaFile.file_size && (
                      <div className={`text-xs ${isFromBot ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {(mediaFile.file_size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {/* Texto del mensaje */}
          {(msg.body || msg.content) && (
            <div className="text-sm">
              {msg.body || msg.content}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-[10px] mt-1 ${isFromBot ? 'text-indigo-200' : 'text-gray-400'}`}>
            {formatTimestamp(msg.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  const renderEvent = (item) => {
    const event = item.data;
    const isSaleEvent = event.event_type === 'VENTA_CONFIRMADA';
    const isReassignmentEvent = event.event_type === 'REASIGNACION';

    return (
      <div key={`evt-${event.id}`} className="my-4">
        {isSaleEvent ? (
          // Evento de venta destacado
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-900">✅ VENTA CONFIRMADA</div>
                {event.event_data?.amount && (
                  <div className="text-green-700 font-medium">
                    Monto: ${event.event_data.amount} {event.event_data.currency || 'USD'}
                  </div>
                )}
                {event.notes && (
                  <div className="text-sm text-green-600 mt-1">{event.notes}</div>
                )}
                <div className="text-xs text-green-500 mt-1">
                  {formatTimestamp(event.occurred_at)}
                </div>
              </div>
            </div>
          </div>
        ) : isReassignmentEvent ? (
          // Evento de reasignación
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-white p-2 rounded-full">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900">🔄 REASIGNACIÓN DE BOT</div>
                {event.event_data?.previous_bot && event.event_data?.new_bot && (
                  <div className="text-amber-700 font-medium">
                    {event.event_data.previous_bot} → {event.event_data.new_bot}
                  </div>
                )}
                {event.notes && (
                  <div className="text-sm text-amber-600 mt-1">{event.notes}</div>
                )}
                <div className="text-xs text-amber-500 mt-1">
                  {formatTimestamp(event.occurred_at)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Otros eventos
          <EventMarker event={event} compact={false} />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No hay actividad en este thread</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header del timeline */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Timeline Enriched
          </h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{timeline.filter(t => t.type === 'message').length} mensajes</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{timeline.filter(t => t.type === 'event').length} eventos</span>
          </div>
        </div>
      </div>

      {/* Timeline items */}
      {timeline.map((item, index) => {
        const prevItem = timeline[index - 1];
        const showDateDivider = !prevItem ||
          new Date(item.timestamp).toDateString() !== new Date(prevItem.timestamp).toDateString();

        // Detectar reasignación de bot (solo para mensajes)
        const isReassignment = item.type === 'message' &&
          index > 0 &&
          timeline[index - 1].type === 'message' &&
          timeline[index - 1].data?.thread_bot_name !== item.data?.thread_bot_name;

        return (
          <div key={index}>
            {/* Divisor de fecha */}
            {showDateDivider && (
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs font-medium text-gray-500 bg-white px-2">
                  {new Date(item.timestamp).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            )}

            {/* Marcador de reasignación de bot */}
            {isReassignment && (
              <div className="my-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="font-semibold">Reasignación de Bot</span>
                </div>
                <div className="text-sm text-amber-700 mt-1">
                  <span className="font-medium">{timeline[index - 1].data?.thread_bot_name || 'Bot anterior'}</span>
                  {' → '}
                  <span className="font-medium">{item.data?.thread_bot_name || 'Bot actual'}</span>
                </div>
              </div>
            )}

            {/* Renderizar item */}
            {item.type === 'message' ? renderMessage(item) : renderEvent(item)}
          </div>
        );
      })}
    </div>
  );
}
