'use client';

import { useState, useEffect, useRef } from 'react';

// Global audio controller - only one audio plays at a time
let currentlyPlayingAudio = null;
let currentlyPlayingSetIsPlaying = null;

const PLAYBACK_SPEEDS = [1, 1.5, 2];

// Helper: format audio duration
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * AudioPlayer - Reproductor de audio estilo WhatsApp
 * @param {Object} props
 * @param {string} props.src - URL del archivo de audio
 * @param {boolean} props.isFromBot - Si el audio fue enviado por el bot
 */
export default function AudioPlayer({ src, isFromBot = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  // Audio player handlers
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      currentlyPlayingAudio = null;
      currentlyPlayingSetIsPlaying = null;
    } else {
      // Pause any currently playing audio first
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audioRef.current) {
        currentlyPlayingAudio.pause();
        if (currentlyPlayingSetIsPlaying) {
          currentlyPlayingSetIsPlaying(false);
        }
      }
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      currentlyPlayingAudio = audioRef.current;
      currentlyPlayingSetIsPlaying = setIsPlaying;
    }
    setIsPlaying(!isPlaying);
  };

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoadedMetadata = () => setAudioDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
      if (currentlyPlayingAudio === audio) {
        currentlyPlayingAudio = null;
        currentlyPlayingSetIsPlaying = null;
      }
    };
    const onPause = () => {
      if (currentlyPlayingAudio !== audio) {
        setIsPlaying(false);
      }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      if (currentlyPlayingAudio === audio) {
        audio.pause();
        currentlyPlayingAudio = null;
        currentlyPlayingSetIsPlaying = null;
      }
    };
  }, [src]);

  return (
    <div className="w-[280px]">
      {/* Reproductor de audio estilo WhatsApp */}
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-3">
        {/* Botón play/pause */}
        <button
          onClick={toggleAudio}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            isFromBot
              ? 'text-indigo-600 hover:brightness-95'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          style={isFromBot ? { backgroundColor: 'rgba(255,255,255,0.85)' } : {}}
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
            style={{ backgroundColor: isFromBot ? 'rgba(255,255,255,0.25)' : '#E5E7EB' }}
            onClick={handleProgressClick}
          >
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all"
              style={{
                width: `${audioProgress}%`,
                backgroundColor: isFromBot ? '#fff' : '#3B82F6'
              }}
            />
            {/* Indicador circular */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-md transition-all"
              style={{
                left: `calc(${audioProgress}% - 7px)`,
                backgroundColor: isFromBot ? '#fff' : '#3B82F6',
                display: audioDuration > 0 ? 'block' : 'none'
              }}
            />
          </div>
          {/* Duración */}
          <div className={`flex justify-between mt-1 text-xs ${isFromBot ? 'text-indigo-200' : 'text-gray-500'}`}>
            <span>{formatDuration(audioCurrentTime)}</span>
            <span>{formatDuration(audioDuration)}</span>
          </div>
        </div>

        {/* Botón de velocidad */}
        <button
          onClick={cyclePlaybackSpeed}
          className={`flex-shrink-0 min-w-[36px] h-6 rounded-full text-xs font-bold transition-colors flex items-center justify-center ${
            isFromBot
              ? ''
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          style={isFromBot ? { backgroundColor: 'rgba(255,255,255,0.85)', color: '#2563EB' } : {}}
          title="Cambiar velocidad"
        >
          {playbackSpeed}x
        </button>
      </div>
    </div>
  );
}
