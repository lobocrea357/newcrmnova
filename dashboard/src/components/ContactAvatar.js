'use client'

import { useState, memo } from 'react'

/**
 * ContactAvatar - Componente reutilizable para mostrar la foto de perfil de un contacto
 * 
 * @param {string} profilePictureUrl - URL de la foto de perfil del contacto
 * @param {string} contactName - Nombre del contacto (usado para el alt text)
 * @param {string} size - Tamaño del avatar: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} className - Clases CSS adicionales
 */
function ContactAvatar({ 
  profilePictureUrl, 
  contactName = 'Contacto', 
  size = 'md',
  className = '' 
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Configuración de tamaños
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md
  const iconSize = iconSizes[size] || iconSizes.md
  const textSize = textSizes[size] || textSizes.md

  /**
   * Obtener iniciales del nombre del contacto
   * Ejemplo: "Luis Guerra" -> "LG", "Franco" -> "F"
   */
  const getInitials = (name) => {
    if (!name || name === 'Sin nombre' || name === 'Contacto') {
      return '?'
    }
    
    const words = name.trim().split(/\s+/)
    
    if (words.length >= 2) {
      // Si hay dos o más palabras, tomar primera letra de las dos primeras
      return (words[0][0] + words[1][0]).toUpperCase()
    } else if (words.length === 1 && words[0].length > 0) {
      // Si solo hay una palabra, tomar las dos primeras letras o solo una
      return words[0].length >= 2 
        ? words[0].substring(0, 2).toUpperCase()
        : words[0][0].toUpperCase()
    }
    
    return '?'
  }

  const initials = getInitials(contactName)

  /**
   * Generar un color de fondo basado en el nombre
   * Similar a WhatsApp, genera colores consistentes para el mismo nombre
   */
  const getBackgroundColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ]
    
    // Generar un índice basado en el hash del nombre
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const bgColor = getBackgroundColor(contactName)

  // Si hay URL de imagen y no ha fallado, intentar cargarla
  const showImage = profilePictureUrl && !imageError

  return (
    <div className={`relative flex-shrink-0 ${sizeClass} ${className}`}>
      {showImage ? (
        <>
          {/* Imagen de perfil */}
          <img
            src={profilePictureUrl}
            alt={`Foto de perfil de ${contactName}`}
            className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            } transition-opacity duration-200`}
            onLoad={() => {
              setImageLoading(false)
            }}
            onError={(e) => {
              console.warn('⚠️ Error al cargar foto de perfil:', {
                url: profilePictureUrl,
                contactName
              })
              setImageError(true)
              setImageLoading(false)
            }}
            loading="lazy"
          />
          
          {/* Placeholder mientras carga */}
          {imageLoading && (
            <div className={`absolute inset-0 ${sizeClass} rounded-full ${bgColor} flex items-center justify-center`}>
              <span className={`${textSize} font-semibold text-white opacity-50`}>
                {initials}
              </span>
            </div>
          )}
        </>
      ) : (
        /* Avatar con iniciales cuando no hay imagen o falló */
        <div className={`${sizeClass} rounded-full ${bgColor} flex items-center justify-center`}>
          <span className={`${textSize} font-semibold text-white`}>
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(ContactAvatar)
