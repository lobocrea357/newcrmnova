/**
 * Helper para combinar clases de Tailwind CSS
 * Filtra valores falsy y une las clases con espacios
 * 
 * @param {...string} classes - Clases a combinar
 * @returns {string} String con las clases combinadas
 * 
 * @example
 * cn('px-4', 'py-2', isActive && 'bg-blue-500')
 * // Returns: "px-4 py-2 bg-blue-500" (if isActive is true)
 * 
 * @example
 * cn('px-4', null, 'py-2', undefined, 'bg-blue-500')
 * // Returns: "px-4 py-2 bg-blue-500"
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
