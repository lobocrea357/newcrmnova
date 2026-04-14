export const formatCedulaByCountry = (value, country) => {
  const cleanValue = value.replace(/[^0-9VEve]/g, '')

  switch (country) {
    case 'Venezuela':
      const prefix = value.toUpperCase().startsWith('E') ? 'E-' : 'V-'
      const numbers = cleanValue.replace(/[VEve]/g, '')
      return numbers ? `${prefix}${numbers.slice(0, 8)}` : ''
    case 'Colombia':
      return cleanValue.slice(0, 10)
    default:
      return cleanValue
  }
}
