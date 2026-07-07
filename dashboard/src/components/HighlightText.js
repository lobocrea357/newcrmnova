'use client'

import { memo } from 'react'

/**
 * HighlightText - Componente para resaltar coincidencias de búsqueda
 * Similar al comportamiento de WhatsApp
 * 
 * @param {string} text - Texto completo a mostrar
 * @param {string} searchQuery - Término de búsqueda
 * @param {string} className - Clases CSS adicionales para el texto
 */
function HighlightText({ text, searchQuery, className = '' }) {
  if (!text) return null
  if (!searchQuery || searchQuery.trim() === '') {
    return <span className={className}>{text}</span>
  }

  const query = searchQuery.trim()
  const textStr = String(text)
  
  // Buscar la primera coincidencia (case insensitive)
  const lowerText = textStr.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  
  // Si no hay coincidencia, devolver el texto normal
  if (index === -1) {
    return <span className={className}>{textStr}</span>
  }
  
  // Dividir el texto en partes: antes, coincidencia, después
  const before = textStr.slice(0, index)
  const match = textStr.slice(index, index + query.length)
  const after = textStr.slice(index + query.length)
  
  return (
    <span className={className} translate="no">
      {before}
      <span className="text-blue-600 font-semibold">{match}</span>
      {after}
    </span>
  )
}

// Memoize component to prevent re-renders during search operations
export default memo(HighlightText)
