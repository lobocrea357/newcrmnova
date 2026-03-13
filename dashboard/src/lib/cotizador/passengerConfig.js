/**
 * Configuración de tipos de pasajeros y equipaje
 */

export const PASSENGER_CATEGORIES = {
  adultos: {
    nombre: 'Adultos',
    color: 'blue',
    descripcion: 'Pasajeros mayores de 12 años',
    precioDefault: 500,
    feeEmisionDefault: 50
  },
  niños: {
    nombre: 'Niños',
    color: 'green',
    descripcion: 'Pasajeros de 2 a 12 años',
    precioDefault: 350,
    feeEmisionDefault: 50
  },
  infantes: {
    nombre: 'Infantes',
    color: 'purple',
    descripcion: 'Pasajeros menores de 2 años',
    precioDefault: 200,
    feeEmisionDefault: 50
  }
}

export const LUGGAGE_OPTIONS = {
  FULL: {
    key: 'equipajeCompleto',
    value: 'completo',
    label: 'Equipaje completo',
    description: '23 Kg + 8 Kg + artículo personal',
    precio: 0
  },
  MEDIUM: {
    key: 'equipajeMediano',
    value: 'mediano',
    label: 'Equipaje mediano',
    description: '23 Kg + artículo personal',
    precio: 0
  },
  LIGHT: {
    key: 'equipajeLigero',
    value: 'ligero',
    label: 'Equipaje ligero',
    description: '10 Kg + artículo personal',
    precio: 0
  }
}

export const LUGGAGE_OPTIONS_ARRAY = [
  { value: 'completo', label: 'Completo (23Kg + 8Kg + personal)', precio: 0 },
  { value: 'mediano', label: 'Mediano (23Kg + personal)', precio: 0 },
  { value: 'ligero', label: 'Ligero (10Kg + personal)', precio: 0 }
]

export const PASSENGER_TYPES = {
  ADULT: 'adulto',
  CHILD: 'niño',
  INFANT: 'infante'
}

export const FEE_EMISSION_OPTIONS = {
  NORMAL: { value: '15', label: 'Normal ($15)' },
  PROMO: { value: '10', label: 'Promo Stellar ($10)' }
}
