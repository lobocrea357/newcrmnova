export const TIPOS_VUELO = [
  { value: 'solo_ida', label: 'Solo Ida' },
  { value: 'ida_vuelta', label: 'Ida y Vuelta' },
  { value: 'migratorio', label: 'Fines Migratorios' }
]

export const PROVEEDORES = [
  'Sabre',
  'Servivuelo',
  'Kiu',
  'Expedia',
  'Kiwi',
  'Amadeus'
]

export const SEXOS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' }
]

export const TIPOS_DOCUMENTO = [
  {
    value: 'PASAPORTE',
    label: 'Pasaporte',
    description: 'Documento internacional para viajes',
    icon: '🛂',
    color: 'blue'
  },
  {
    value: 'CEDULA',
    label: 'Cédula de Identidad (C.I.)',
    description: 'Documento nacional para reservación temporal',
    icon: '🪪',
    color: 'green'
  }
]

export const PAISES_CEDULA = [
  { value: 'Venezuela', label: 'Venezuela', code: 'VE' },
  { value: 'Colombia', label: 'Colombia', code: 'CO' },
  { value: 'Perú', label: 'Perú', code: 'PE' },
  { value: 'Ecuador', label: 'Ecuador', code: 'EC' },
  { value: 'Bolivia', label: 'Bolivia', code: 'BO' },
  { value: 'Argentina', label: 'Argentina', code: 'AR' },
  { value: 'Chile', label: 'Chile', code: 'CL' },
  { value: 'Uruguay', label: 'Uruguay', code: 'UY' },
  { value: 'Paraguay', label: 'Paraguay', code: 'PY' },
  { value: 'Brasil', label: 'Brasil', code: 'BR' }
]
