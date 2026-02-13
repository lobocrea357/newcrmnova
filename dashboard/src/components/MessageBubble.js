'use client'

import { useState, useRef, useEffect, memo } from 'react'

// Global audio controller - only one audio plays at a time
let currentlyPlayingAudio = null
let currentlyPlayingSetIsPlaying = null

const PLAYBACK_SPEEDS = [1, 1.5, 2]

// Helper: get file extension from name or mimetype
function getFileExtension(fileName, mimetype) {
  if (fileName && fileName.includes('.')) {
    return fileName.split('.').pop().toUpperCase()
  }
  if (mimetype) {
    const sub = mimetype.split('/')[1]
    if (sub) return sub.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX')
      .replace('vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'XLSX')
      .replace('vnd.openxmlformats-officedocument.presentationml.presentation', 'PPTX')
      .replace('vnd.ms-excel', 'XLS')
      .replace('vnd.ms-powerpoint', 'PPT')
      .replace('msword', 'DOC')
      .toUpperCase()
  }
  return 'FILE'
}

// Helper: get color for file type icon
function getDocColor(ext) {
  const colors = {
    PDF: '#E53935', DOC: '#1565C0', DOCX: '#1565C0',
    XLS: '#2E7D32', XLSX: '#2E7D32', PPT: '#E65100', PPTX: '#E65100',
    TXT: '#546E7A', CSV: '#2E7D32', ZIP: '#6D4C41', RAR: '#6D4C41',
  }
  return colors[ext] || '#757575'
}

// Helper: format file size
function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// Helper: format audio duration
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MessageBubble({ message, contactName }) {
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const audioRef = useRef(null)
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
    else if (mediaFile.mimetype.includes('document') || mediaFile.mimetype.includes('pdf') || mediaFile.mimetype.includes('application/')) messageType = 'document'
  }

  // Si es tipo document y no hay mediaFile pero hay media_url, considerar
  if (messageType === 'document' && !mediaFile && message.media_url) {
    // fallback
  }
  
  // Audio player handlers
  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      currentlyPlayingAudio = null
      currentlyPlayingSetIsPlaying = null
    } else {
      // Pause any currently playing audio first
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audioRef.current) {
        currentlyPlayingAudio.pause()
        if (currentlyPlayingSetIsPlaying) {
          currentlyPlayingSetIsPlaying(false)
        }
      }
      audioRef.current.playbackRate = playbackSpeed
      audioRef.current.play()
      currentlyPlayingAudio = audioRef.current
      currentlyPlayingSetIsPlaying = setIsPlaying
    }
    setIsPlaying(!isPlaying)
  }

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length
    const newSpeed = PLAYBACK_SPEEDS[nextIndex]
    setPlaybackSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime)
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onLoadedMetadata = () => setAudioDuration(audio.duration)
    const onEnded = () => {
      setIsPlaying(false)
      setAudioProgress(0)
      setAudioCurrentTime(0)
      if (currentlyPlayingAudio === audio) {
        currentlyPlayingAudio = null
        currentlyPlayingSetIsPlaying = null
      }
    }
    // Sync state if paused externally (by another audio starting)
    const onPause = () => {
      if (currentlyPlayingAudio !== audio) {
        setIsPlaying(false)
      }
    }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      // Cleanup global ref if this component unmounts while playing
      if (currentlyPlayingAudio === audio) {
        audio.pause()
        currentlyPlayingAudio = null
        currentlyPlayingSetIsPlaying = null
      }
    }
  }, [mediaFile])

  const handleProgressClick = (e) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    audioRef.current.currentTime = pct * audioRef.current.duration
  }

  // Detectar error de transcripción
  const hasTranscriptionError = message.metadata?.transcription_error
  const hasTranscription = message.metadata?.transcription

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
            <div className="w-[280px]">
              {/* Reproductor de audio estilo WhatsApp */}
              <audio ref={audioRef} src={mediaFile.file_url || mediaFile.url} preload="metadata" />
              <div className="flex items-center gap-3">
                {/* Botón play/pause */}
                <button
                  onClick={toggleAudio}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isFromMe
                      ? 'text-blue-600 hover:brightness-95'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  style={isFromMe ? { backgroundColor: 'rgba(255,255,255,0.85)' } : {}}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Barra de progreso clickeable */}
                  <div
                    className="relative h-2 rounded-full cursor-pointer group"
                    style={{ backgroundColor: isFromMe ? 'rgba(255,255,255,0.25)' : '#E5E7EB' }}
                    onClick={handleProgressClick}
                  >
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all"
                      style={{
                        width: `${audioProgress}%`,
                        backgroundColor: isFromMe ? '#fff' : '#3B82F6'
                      }}
                    />
                    {/* Indicador circular */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-md transition-all"
                      style={{
                        left: `calc(${audioProgress}% - 7px)`,
                        backgroundColor: isFromMe ? '#fff' : '#3B82F6',
                        display: audioDuration > 0 ? 'block' : 'none'
                      }}
                    />
                  </div>
                  {/* Duración */}
                  <div className={`flex justify-between mt-1 text-xs ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span>{formatDuration(audioCurrentTime)}</span>
                    <span>{formatDuration(audioDuration)}</span>
                  </div>
                </div>

                {/* Botón de velocidad */}
                <button
                  onClick={cyclePlaybackSpeed}
                  className={`flex-shrink-0 min-w-[36px] h-6 rounded-full text-xs font-bold transition-colors flex items-center justify-center ${
                    isFromMe
                      ? ''
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={isFromMe ? { backgroundColor: 'rgba(255,255,255,0.85)', color: '#2563EB' } : {}}
                  title="Cambiar velocidad"
                >
                  {playbackSpeed}x
                </button>
              </div>

              {/* Transcripción o estado */}
              {(() => {
                const transcription = message.metadata?.transcription;
                const transcriptionText = typeof transcription === 'string' 
                  ? transcription 
                  : transcription?.text;

                if (transcriptionText) {
                  return (
                    <div className={`mt-2 pt-2 border-t ${isFromMe ? 'border-blue-400 border-opacity-30' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-xs font-medium uppercase tracking-wide ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>Transcripci&oacute;n</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcriptionText}</p>
                    </div>
                  );
                } else if (hasTranscriptionError) {
                  return (
                    <div className={`mt-2 pt-2 border-t ${isFromMe ? 'border-blue-400 border-opacity-30' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className={`text-xs italic ${isFromMe ? 'text-blue-200' : 'text-gray-400'}`}>No se pudo transcribir este audio</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (messageType === 'audio' || messageType === 'ptt' || messageType === 'voice') && !mediaFile ? (
            // Audio sin archivo multimedia disponible
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              {hasTranscriptionError ? (
                <span className="text-xs italic opacity-75">Audio no disponible - No se pudo transcribir</span>
              ) : hasTranscription ? (
                <div>
                  <span className="text-xs font-medium opacity-90">Transcripci&oacute;n:</span>
                  <p className="text-sm whitespace-pre-wrap">{typeof hasTranscription === 'string' ? hasTranscription : hasTranscription?.text}</p>
                </div>
              ) : (
                <span className="text-xs italic opacity-75">Audio (archivo no disponible)</span>
              )}
            </div>
          ) : messageType === 'document' && mediaFile ? (
            // Documento estilo WhatsApp
            (() => {
              const ext = getFileExtension(mediaFile.file_name, mediaFile.mimetype)
              const docColor = getDocColor(ext)
              const fileSize = formatFileSize(mediaFile.file_size)
              const fileName = mediaFile.file_name || 'Documento'
              return (
                <div>
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: isFromMe ? 'rgba(0,0,0,0.08)' : '#F3F4F6', minWidth: '250px' }}
                  >
                    {/* Cabecera del documento */}
                    <div className="flex items-center gap-3 p-3">
                      {/* Icono de tipo de archivo */}
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: docColor }}
                      >
                        <span className="text-white text-xs font-bold">{ext}</span>
                      </div>
                      {/* Info del archivo */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isFromMe ? 'text-white' : 'text-gray-900'}`}>
                          {fileName}
                        </div>
                        <div className={`text-xs mt-0.5 ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>
                          {[ext, fileSize].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                    {/* Botón de descarga */}
                    <a
                      href={mediaFile.file_url || mediaFile.url}
                      download={fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 py-2.5 border-t transition-colors ${
                        isFromMe
                          ? 'border-blue-400 border-opacity-30 text-white'
                          : 'border-gray-200 text-blue-600 hover:bg-gray-100'
                      }`}
                      onMouseEnter={(e) => { if (isFromMe) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
                      onMouseLeave={(e) => { if (isFromMe) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-sm font-medium">Descargar</span>
                    </a>
                  </div>
                  {message.body && (
                    <p className="mt-2 text-sm whitespace-pre-wrap">{message.body}</p>
                  )}
                </div>
              )
            })()
          ) : messageType === 'document' && !mediaFile ? (
            // Documento sin archivo disponible
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: isFromMe ? 'rgba(0,0,0,0.08)' : '#F3F4F6' }}>
              <svg className="w-6 h-6 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm italic opacity-75">Documento (archivo no disponible)</span>
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
    prevProps.contactName === nextProps.contactName &&
    prevProps.message.media_files?.length === nextProps.message.media_files?.length &&
    prevProps.message.metadata?.transcription === nextProps.message.metadata?.transcription &&
    prevProps.message.metadata?.transcription_error === nextProps.message.metadata?.transcription_error
  )
})
