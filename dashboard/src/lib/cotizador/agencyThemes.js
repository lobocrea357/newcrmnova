/**
 * Temas de colores por agencia
 * Define paletas de colores dinámicas según la agencia seleccionada
 */

export const AGENCY_THEMES = {
  nova: {
    name: 'Viajes Nova',
    primary: 'indigo-600',
    primaryHover: 'indigo-700',
    primaryLight: 'indigo-50',
    primaryBorder: 'indigo-200',
    secondary: 'purple-600',
    gradient: 'from-indigo-600 to-purple-700',
    gradientLight: 'from-indigo-50 to-purple-50',
    text: 'indigo-900',
    textLight: 'indigo-700',
    accent: 'indigo-500'
  },
  colombia: {
    name: 'Viajes Colombia',
    primary: 'blue-600',
    primaryHover: 'blue-700',
    primaryLight: 'blue-50',
    primaryBorder: 'blue-200',
    secondary: 'cyan-600',
    gradient: 'from-blue-600 to-cyan-700',
    gradientLight: 'from-blue-50 to-cyan-50',
    text: 'blue-900',
    textLight: 'blue-700',
    accent: 'blue-500'
  },
  apolo: {
    name: 'Apolo Viajes',
    primary: 'amber-500',
    primaryHover: 'amber-600',
    primaryLight: 'amber-50',
    primaryBorder: 'amber-200',
    secondary: 'orange-600',
    gradient: 'from-amber-500 to-orange-600',
    gradientLight: 'from-amber-50 to-orange-50',
    text: 'amber-900',
    textLight: 'amber-700',
    accent: 'amber-400'
  }
}

/**
 * Obtener tema según el nombre de la agencia
 * @param {string} agenciaName - Nombre de la agencia
 * @returns {object} - Configuración de tema
 */
export function getThemeByAgency(agenciaName) {
  if (!agenciaName) return AGENCY_THEMES.nova
  
  const agenciaLower = agenciaName.toLowerCase()
  
  if (agenciaLower.includes('colombia')) {
    return AGENCY_THEMES.colombia
  }
  
  if (agenciaLower.includes('apolo')) {
    return AGENCY_THEMES.apolo
  }
  
  // Default: Nova
  return AGENCY_THEMES.nova
}

/**
 * Generar clases CSS dinámicas para botones
 * @param {object} theme - Tema de la agencia
 * @returns {string} - Clases CSS
 */
export function getButtonClasses(theme) {
  return `bg-${theme.primary} hover:bg-${theme.primaryHover} text-white transition-colors`
}

/**
 * Generar clases CSS dinámicas para gradientes
 * @param {object} theme - Tema de la agencia
 * @returns {string} - Clases CSS
 */
export function getGradientClasses(theme) {
  return `bg-gradient-to-br ${theme.gradient}`
}
