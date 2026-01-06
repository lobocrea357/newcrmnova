'use client'

import { useState, memo } from 'react'

function MessageBubble({ message, contactName }) {
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const isFromMe = message.from_me
  const timestamp = new Date(message.timestamp).toLocaleString()
  
  // Determinar el tipo de mensaje y archivos multimedia
  const hasMedia = message.media_files && message.media_files.length > 0
  const mediaFile = hasMedia ? message.media_files[0] : null
  
  // Determinar tipo de mensaje basado en múltiples fuentes
  let messageType = message.type || message.message_type || 'text'
  
  // Si no hay tipo pero hay media, inferir del mimetype
  if (messageType === 'text' && mediaFile?.mimetype) {
    if (mediaFile.mimetype.startsWith('image/')) messageType = 'image'
    else if (mediaFile.mimetype.startsWith('video/')) messageType = 'video'
    else if (mediaFile.mimetype.startsWith('audio/')) messageType = 'audio'
    else if (mediaFile.mimetype.includes('document') || mediaFile.mimetype.includes('pdf')) messageType = 'document'
  }
  
  // Removed debug logging for performance

  return (
    <div 
      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}
      style={{ contain: 'layout', willChange: 'auto' }}
    >
      <div className={`max-w-[70%] ${isFromMe ? 'order-2' : 'order-1'}`}>
        {/* Nombre del remitente */}
        {!isFromMe && (
          <div className="text-xs font-medium text-gray-600 mb-1 px-2">
            {contactName || 'Contacto'}
          </div>
        )}
        
        {/* Burbuja del mensaje */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isFromMe
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          {/* Contenido según el tipo de mensaje */}
          {messageType === 'image' && mediaFile && !imageError ? (
            <div className="mb-2">
              {/* Contenedor con aspect ratio fijo para evitar saltos de layout */}
              <div className="relative w-[300px] bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
                <img
                  src={mediaFile.file_url || mediaFile.url}
                  alt="Imagen"
                  className="w-full h-full object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    console.error('❌ Error cargando imagen:', {
                      url: mediaFile.file_url,
                      error: e
                    });
                    setImageError(true);
                  }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {message.body && (
                <p className="mt-2 text-sm">{message.body}</p>
              )}
            </div>
          ) : messageType === 'video' && mediaFile && !videoError ? (
            <div className="mb-2">
              {/* Contenedor con dimensiones fijas para videos */}
              <div className="relative w-[300px] bg-gray-900 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                <video
                  controls
                  className="w-full h-full object-contain rounded-lg shadow-sm"
                  src={mediaFile.file_url || mediaFile.url}
                  preload="metadata"
                  onError={(e) => {
                    console.error('❌ Error cargando video:', {
                      url: mediaFile.file_url,
                      error: e
                    });
                    setVideoError(true);
                  }}
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
              {message.body && (
                <p className="mt-2 text-sm">{message.body}</p>
              )}
            </div>
          ) : (messageType === 'audio' || messageType === 'ptt' || messageType === 'voice') && mediaFile ? (
            <div>
              {/* Solo mostrar transcripción si existe */}
              {(() => {
                // Manejar tanto string como objeto para retrocompatibilidad
                const transcription = message.metadata?.transcription;
                const transcriptionText = typeof transcription === 'string' 
                  ? transcription 
                  : transcription?.text;

                return transcriptionText ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-wide opacity-90">🎤 Audio Transcrito</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcriptionText}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                    <span className="text-xs italic opacity-75">Transcribiendo audio...</span>
                  </div>
                );
              })()}
            </div>
          ) : messageType === 'document' && mediaFile ? (
            <div className="flex items-center gap-3 p-2 bg-black bg-opacity-5 rounded-lg">
              <svg className="w-8 h-8 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {mediaFile.file_name || 'Documento'}
                </div>
                {mediaFile.mimetype && (
                  <div className="text-xs opacity-75">
                    {mediaFile.mimetype}
                  </div>
                )}
              </div>
              <a
                href={mediaFile.file_url || mediaFile.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                Descargar
              </a>
            </div>
          ) : (
            // Mensaje de texto normal - SIEMPRE MOSTRAR ALGO
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.body || message.content || (hasMedia ? '(Multimedia sin descripción)' : '(Mensaje sin contenido)')}
            </p>
          )}
          
          {/* Timestamp */}
          <div
            className={`text-xs mt-1 flex items-center gap-1 ${
              isFromMe ? 'text-blue-100 justify-end' : 'text-gray-500'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{new Date(message.timestamp).toLocaleString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: 'short'
            })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if message.id or message.timestamp changes
export default memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.contactName === nextProps.contactName
  )
})
