/**
 * Normaliza el número de cédula según el país de emisión
 * @param {string} numero - Número de cédula crudo (extraído por IA)
 * @param {string} pais - País de emisión (Venezuela, Colombia, etc.)
 * @returns {string} Número de cédula normalizado
 */
export const normalizarCedula = (numero, pais) => {
  if (!numero) return '';
  
  const limpio = numero.replace(/[^0-9]/g, ''); // Extraer solo números
  
  switch (pais) {
    case 'Venezuela':
      // Determinar prefijo (V por defecto, E si empieza con E)
      const prefijo = numero.toUpperCase().startsWith('E') ? 'E' : 'V';
      // Tomar hasta 8 dígitos
      const digitos = limpio.slice(0, 8);
      return `${prefijo}-${digitos}`;
    
    case 'Colombia':
      // Solo dígitos, hasta 10 caracteres
      return limpio.slice(0, 10);
    
    case 'Perú':
    case 'Ecuador':
      // Solo dígitos, hasta 10 caracteres
      return limpio.slice(0, 10);
    
    default:
      // Para otros países, mantener formato original pero limpiar espacios
      return numero.trim().toUpperCase();
  }
};

/**
 * Valida si un número de cédula tiene formato válido según el país
 * @param {string} numero - Número de cédula a validar
 * @param {string} pais - País de emisión
 * @returns {boolean} True si el formato es válido
 */
export const validarFormatoCedula = (numero, pais) => {
  if (!numero) return false;
  
  switch (pais) {
    case 'Venezuela':
      return /^[VE]-?\d{7,8}$/.test(numero.trim().toUpperCase());
    
    case 'Colombia':
      return /^\d{8,10}$/.test(numero.replace(/[^0-9]/g, ''));
    
    case 'Perú':
    case 'Ecuador':
      return /^\d{8,10}$/.test(numero.replace(/[^0-9]/g, ''));
    
    default:
      return /^[A-Z0-9-]{6,}$/.test(numero.trim().toUpperCase());
  }
};
