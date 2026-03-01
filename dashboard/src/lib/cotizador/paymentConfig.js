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
  BINANCE: 'Binance (USDT)',
  ARCADIA: 'Arcadia Service',
  ZELLE: 'Zelle',
  BANCACOLOMBIA: 'Bancacolombia',
  DAVIVIENDA: 'Davivienda',
  CUENTA_EUROS: 'Cuenta en Euros',
  BANESCO_PANAMA: 'Banesco Panamá (ViajesNova)',
  BNC_VES: 'BNC - Transferencia en Bs',
  PAGO_MOVIL: 'Pago móvil',
  DEPOSITO_VENEZUELA: 'Depósito oficina Venezuela (efectivo)',
  DEPOSITO_COLOMBIA: 'Depósito oficina Colombia (efectivo)',
  DEPOSITO_EUROPA: 'Depósito oficina Europa (efectivo)',
  CHASE: 'Chase Bank (Estados Unidos)',
  BIZUM: 'Bizum (España)'
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
    titulo: 'Pago con Binance (USDT)',
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
  [PAYMENT_METHODS.CUENTA_EUROS]: {
    titulo: 'Transferencia a cuenta en Euros',
    descripcion: 'Transferencia SEPA en Euros.',
    detalles: [
      '--- OPCIÓN PRINCIPAL ---',
      'Banco: BBVA',
      'Titular: Grupo Travel BA',
      'IBAN: ES2301821876830201934375',
      '',
      '--- OPCIÓN SECUNDARIA ---',
      'Banco: Revolut',
      'IBAN: ES5415830001169083916022',
      'Titular: Gaddiel Montero Yepez'
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
    titulo: 'Transferencia BNC (VES)',
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
  [PAYMENT_METHODS.DEPOSITO_VENEZUELA]: {
    titulo: 'Pago en efectivo - Oficinas Venezuela',
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
  [PAYMENT_METHODS.DEPOSITO_COLOMBIA]: {
    titulo: 'Pago en efectivo - Oficina Colombia',
    descripcion: 'Pago en pesos colombianos (COP) en efectivo en nuestra oficina de Colombia.',
    detalles: [
      'Oficina disponible:',
      '• Medellín',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
  [PAYMENT_METHODS.DEPOSITO_EUROPA]: {
    titulo: 'Pago en efectivo - Oficina Europa',
    descripcion: 'Pago en euros (EUR) en efectivo en nuestra oficina de Europa.',
    detalles: [
      'Oficina disponible:',
      '• Madrid, España',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
  [PAYMENT_METHODS.CHASE]: {
    titulo: 'Transferencia Chase Bank (USD)',
    descripcion: 'Transferencia internacional en dólares estadounidenses a cuenta Chase Bank.',
    detalles: [
      'Banco: Chase Bank',
      'Número de cuenta: 900700953',
      'Número de tránsito interbancario (Routing): 267084131'
    ]
  },
  [PAYMENT_METHODS.BIZUM]: {
    titulo: 'Pago vía Bizum (EUR)',
    descripcion: 'Transferencia en euros a través de Bizum.',
    detalles: [
      'Teléfono: +34 672 75 08 25'
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
    PAYMENT_METHODS.CHASE,
    PAYMENT_METHODS.ARCADIA
  ],
  EUR: [
    PAYMENT_METHODS.CUENTA_EUROS,
    PAYMENT_METHODS.DEPOSITO_EUROPA,
    PAYMENT_METHODS.BIZUM,
    PAYMENT_METHODS.SCALAPAY
  ],
  VES: [
    PAYMENT_METHODS.BNC_VES,
    PAYMENT_METHODS.PAGO_MOVIL
  ],
  COP: [
    PAYMENT_METHODS.BANCACOLOMBIA,
    PAYMENT_METHODS.DAVIVIENDA,
    PAYMENT_METHODS.DEPOSITO_COLOMBIA
  ],
  USDT: [
    PAYMENT_METHODS.BINANCE
  ],
  FLEXIBLE: [
    PAYMENT_METHODS.DEPOSITO_VENEZUELA
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
  PAYMENT_METHODS.CUENTA_EUROS,
  PAYMENT_METHODS.BANESCO_PANAMA,
  PAYMENT_METHODS.BNC_VES,
  PAYMENT_METHODS.PAGO_MOVIL,
  PAYMENT_METHODS.DEPOSITO_VENEZUELA,
  PAYMENT_METHODS.DEPOSITO_COLOMBIA,
  PAYMENT_METHODS.DEPOSITO_EUROPA,
  PAYMENT_METHODS.CHASE,
  PAYMENT_METHODS.BIZUM
]

/**
 * Obtener datos de pago según método y agencia
 * Zelle tiene lógica condicional por agencia
 */
export function getPaymentData(metodo, agencia) {
  if (metodo === PAYMENT_METHODS.ZELLE) {
    return agencia === 'apolo' 
      ? PAYMENT_DATA_ZELLE_APOLO 
      : PAYMENT_DATA[PAYMENT_METHODS.ZELLE]
  }
  return PAYMENT_DATA[metodo] || null
}
