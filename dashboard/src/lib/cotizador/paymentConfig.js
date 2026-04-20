/**
 * Configuración de métodos de pago y datos bancarios del cotizador
 */

export const AGENCY_CONFIG = {
  name: 'Viajes Nova',
  logoUrl: '/logo-morado.png'
}

export const PAYMENT_METHODS = {
  SCALAPAY: 'Scalapay',
  BNC_USD: 'Depósitos en dólares (BNC USD)',
  BINANCE: 'Binance',
  ARCADIA: 'Arcadia Service',
  ZELLE: 'Zelle',
  BANCACOLOMBIA: 'Bancacolombia',
  DAVIVIENDA: 'Davivienda',
  BBVA: 'BBVA',
  REVOLUT: 'Revolut',
  BANESCO_PANAMA: 'Banesco Panamá (ViajesNova)',
  BNC_VES: 'Transferencia (BNC)',
  PAGO_MOVIL: 'Pago móvil',
  EFECTIVO_USD: 'Efectivo (USD)',
  EFECTIVO_COP: 'Efectivo (COP)',
  EFECTIVO_EUR: 'Efectivo (EUR)',
  CHASE_NOVA: 'Chase Bank Nova',
  CHASE_APOLO: 'Chase Bank Apolo',
  BIZUM: 'Bizum (España)',
  TARJETA_CREDITO_USD: 'Tarjeta de Crédito (USD)'
}

export const PAYMENT_DATA = {
  [PAYMENT_METHODS.SCALAPAY]: {
    titulo: 'Pago con Scalapay',
    descripcion: 'Financiamiento en cuotas a través de Scalapay.',
    detalles: [
      'El enlace de pago será enviado por tu asesor.',
      'La aprobación está sujeta a las políticas de Scalapay.'
    ]
  },
  [PAYMENT_METHODS.BNC_USD]: {
    titulo: 'Depósito bancario en USD',
    descripcion: 'Realiza un depósito/transferencia en dólares estadounidenses.',
    detalles: [
      'Banco: Banco Nacional de Crédito (BNC)',
      'Titular: Josni Bonito',
      'C.I.: 24.347.702',
      'Nro. de cuenta: 0191-0022-72-2322002849',
      'Transferencia nacional o depósito por taquilla.'
    ]
  },
  [PAYMENT_METHODS.BINANCE]: {
    titulo: 'Pago con Binance',
    descripcion: 'Transferencia en USDT a través de Binance.',
    detalles: [
      'Correo: pagosvuelosnova@gmail.com',
      'ID de Usuario: 96985487',
      'Verifica siempre el monto final antes de enviar.'
    ]
  },
  [PAYMENT_METHODS.ARCADIA]: {
    titulo: 'Pago con Arcadia Service',
    descripcion: 'Servicio Arcadia con recargo adicional.',
    detalles: [
      'El enlace/usuario de Arcadia será compartido por tu asesor.',
      'Incluye comisión del 5.6% + $10 sobre el total.'
    ]
  },
  [PAYMENT_METHODS.ZELLE]: {
    titulo: 'Transferencia vía Zelle',
    descripcion: 'Transferencia en USD por Zelle.',
    detalles: [
      'Titular: Viajes Nova LLC',
      'Correo: Pagoagencianova@gmail.com',
      'Concepto: Indicar nombre del cliente y número de cotización.'
    ]
  },
  [PAYMENT_METHODS.BANCACOLOMBIA]: {
    titulo: 'Transferencia Bancacolombia (COP)',
    descripcion: 'Transferencia en pesos colombianos a cuenta Bancacolombia.',
    detalles: [
      'Banco: Bancacolombia',
      'Titular: Grupo Travel BA',
      'Tipo de Cuenta: Cuenta de Ahorros',
      'NIT: 901852156',
      'Nro. de cuenta: 67300009010'
    ]
  },
  [PAYMENT_METHODS.DAVIVIENDA]: {
    titulo: 'Transferencia Davivienda (COP)',
    descripcion: 'Transferencia en pesos colombianos a cuenta Davivienda.',
    detalles: [
      'Banco: Davivienda',
      'Titular: GRUPO TRAVEL BA S.A.S.',
      'Número de Cuenta: 451500268151',
      'NIT: 901.852.156-4'
    ]
  },
  [PAYMENT_METHODS.BBVA]: {
    titulo: 'Transferencia BBVA (EUR)',
    descripcion: 'Transferencia SEPA en Euros a cuenta BBVA.',
    detalles: [
      'Banco: BBVA',
      'Titular: Grupo Travel BA',
      'IBAN: ES2301821876830201934375'
    ]
  },
  [PAYMENT_METHODS.REVOLUT]: {
    titulo: 'Transferencia Revolut (EUR)',
    descripcion: 'Transferencia SEPA en Euros a cuenta Revolut.',
    detalles: [
      'Banco: Revolut',
      'IBAN: ES5415830001169083916022',
      'Titular: Gaddiel Montero Yepez',
    ]
  },
  [PAYMENT_METHODS.BANESCO_PANAMA]: {
    titulo: 'Transferencia Banesco Panamá (USD)',
    descripcion: 'Transferencia internacional a cuenta en Panamá.',
    detalles: [
      'Banco: Banesco Panamá',
      'Titular: Josni Bonito',
      'Tipo de Cuenta: Cuenta Corriente',
      'Número de Cuenta: 221022077418'
    ]
  },
  [PAYMENT_METHODS.BNC_VES]: {
    titulo: 'Transferencia (BNC)',
    descripcion: 'Transferencia en bolívares a Banco Nacional de Crédito.',
    detalles: [
      'Banco: BNC (Banco Nacional de Crédito)',
      'Tipo de Cuenta: Corriente',
      'Nro. de cuenta: 0191-0022-78-2122023900',
      'Titular: Bonito Alvarado Josni Gamaliet'
    ]
  },
  [PAYMENT_METHODS.PAGO_MOVIL]: {
    titulo: 'Pago móvil (VES)',
    descripcion: 'Pago móvil en bolívares.',
    detalles: [
      'Banco: Banco Nacional de Crédito (BNC)',
      'Teléfono: 0414-436 14 40',
      'Cédula: 24.347.702',
      'Titular: Josni Bonito'
    ]
  },
  [PAYMENT_METHODS.EFECTIVO_USD]: {
    titulo: 'Pago en Efectivo (USD)',
    descripcion: 'Pago en dólares estadounidenses (USD) en efectivo en nuestras oficinas de Venezuela.',
    detalles: [
      'Oficinas disponibles:',
      '• San Cristóbal',
      '• Maracaibo',
      '• Caracas',
      '• Valencia (Parral)',
      '• Valencia (Torre de Seguro Los Andes)',
      'Consulta con tu asesor la dirección exacta de la oficina más cercana.'
    ]
  },
  [PAYMENT_METHODS.EFECTIVO_COP]: {
    titulo: 'Pago en Efectivo (COP)',
    descripcion: 'Pago en pesos colombianos (COP) en efectivo en nuestra oficina de Colombia.',
    detalles: [
      'Oficina disponible:',
      '• Medellín',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
  [PAYMENT_METHODS.EFECTIVO_EUR]: {
    titulo: 'Pago en Efectivo (EUR)',
    descripcion: 'Pago en euros (EUR) en efectivo en nuestra oficina de Europa.',
    detalles: [
      'Oficina disponible:',
      '• Madrid, España',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
  [PAYMENT_METHODS.CHASE_NOVA]: {
    titulo: 'Transferencia Chase Bank (USD)',
    descripcion: 'Transferencia internacional en dólares estadounidenses a cuenta Chase Bank.',
    detalles: [
      'Banco: Chase Bank',
      'Número de cuenta: 900700953',
      'Número de tránsito interbancario (Routing): 267084131'
    ]
  },
  [PAYMENT_METHODS.CHASE_APOLO]: {
    titulo: 'Transferencia Chase Bank (USD)',
    descripcion: 'Transferencia internacional en dólares estadounidenses a cuenta Chase Bank.',
    detalles: [
      'Banco: Chase Bank',
      'Número de cuenta: 900700953',
      'Número de tránsito interbancario (Routing): 267084131',
    ]
  },
  [PAYMENT_METHODS.BIZUM]: {
    titulo: 'Pago vía Bizum (EUR)',
    descripcion: 'Transferencia en euros a través de Bizum.',
    detalles: [
      'Teléfono: +34 672 75 08 25'
    ]
  },
  [PAYMENT_METHODS.TARJETA_CREDITO_USD]: {
    titulo: 'Pago con Tarjeta de Crédito (USD)',
    descripcion: 'Pago con tarjeta de crédito en dólares estadounidenses.',
    detalles: [
      'El enlace de pago será enviado por tu asesor.',
      'Incluye recargo del 5% sobre el total.'
    ]
  }
}

export const PAYMENT_DATA_ZELLE_APOLO = {
  titulo: 'Transferencia vía Zelle',
  descripcion: 'Transferencia en USD por Zelle.',
  detalles: [
    'Titular: A&D Finance Group LLC',
    'Correo: grupoapoloviajes@gmail.com',
    'Concepto: Indicar nombre del cliente y número de cotización.'
  ]
}

export const METHODS_BY_CURRENCY = {
  USD: [
    PAYMENT_METHODS.BNC_USD,
    PAYMENT_METHODS.ZELLE,
    PAYMENT_METHODS.BANESCO_PANAMA,
    PAYMENT_METHODS.CHASE_NOVA,
    PAYMENT_METHODS.CHASE_APOLO,
    PAYMENT_METHODS.EFECTIVO_USD,
    PAYMENT_METHODS.ARCADIA,
    PAYMENT_METHODS.TARJETA_CREDITO_USD
  ],
  EUR: [
    PAYMENT_METHODS.BBVA,
    PAYMENT_METHODS.REVOLUT,
    PAYMENT_METHODS.BIZUM,
    PAYMENT_METHODS.EFECTIVO_EUR,
    PAYMENT_METHODS.SCALAPAY
  ],
  VES: [
    PAYMENT_METHODS.BNC_VES,
    PAYMENT_METHODS.PAGO_MOVIL
  ],
  COP: [
    PAYMENT_METHODS.BANCACOLOMBIA,
    PAYMENT_METHODS.DAVIVIENDA,
    PAYMENT_METHODS.EFECTIVO_COP
  ],
  USDT: [
    PAYMENT_METHODS.BINANCE
  ]
}

export const ALL_PAYMENT_METHODS = [
  PAYMENT_METHODS.SCALAPAY,
  PAYMENT_METHODS.BNC_USD,
  PAYMENT_METHODS.BINANCE,
  PAYMENT_METHODS.ARCADIA,
  PAYMENT_METHODS.ZELLE,
  PAYMENT_METHODS.BANCACOLOMBIA,
  PAYMENT_METHODS.DAVIVIENDA,
  PAYMENT_METHODS.BBVA,
  PAYMENT_METHODS.REVOLUT,
  PAYMENT_METHODS.BANESCO_PANAMA,
  PAYMENT_METHODS.BNC_VES,
  PAYMENT_METHODS.PAGO_MOVIL,
  PAYMENT_METHODS.EFECTIVO_USD,
  PAYMENT_METHODS.EFECTIVO_COP,
  PAYMENT_METHODS.EFECTIVO_EUR,
  PAYMENT_METHODS.CHASE_NOVA,
  PAYMENT_METHODS.CHASE_APOLO,
  PAYMENT_METHODS.BIZUM,
  PAYMENT_METHODS.TARJETA_CREDITO_USD
]

/**
 * Obtener datos de pago según método y agencia
 * Zelle y Chase tienen lógica condicional por agencia
 */
export function getPaymentData(metodo, agencia) {
  // Zelle: variante por agencia
  if (metodo === PAYMENT_METHODS.ZELLE) {
    return agencia === 'apolo' 
      ? PAYMENT_DATA_ZELLE_APOLO 
      : PAYMENT_DATA[PAYMENT_METHODS.ZELLE]
  }
  
  // Chase Bank: variante por agencia
  if (metodo === PAYMENT_METHODS.CHASE_NOVA || metodo === PAYMENT_METHODS.CHASE_APOLO) {
    return agencia === 'apolo'
      ? PAYMENT_DATA[PAYMENT_METHODS.CHASE_APOLO]
      : PAYMENT_DATA[PAYMENT_METHODS.CHASE_NOVA]
  }
  
  return PAYMENT_DATA[metodo] || null
}
