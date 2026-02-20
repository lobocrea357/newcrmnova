'use client'
import { useState, useEffect, useRef } from 'react'
import { Calculator, DollarSign, Percent, CreditCard, TrendingUp, RefreshCw, Download, ArrowRightLeft, Plane, Calendar, MapPin, Luggage, Users } from 'lucide-react'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { supabase } from '@/lib/supabase'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import {
  calcularConversionInteligente,
  getMonedasCotizacion,
  getMonedasBase,
  getMonedaInfo,
  esMonedaBase
} from '@/lib/conversorInteligente'
import { obtenerMonedas, obtenerTasasConversion } from '@/lib/tasasHelpers'

const AGENCY_NAME = 'Viajes Nova'
const AGENCY_LOGO_URL = '/logo-morado.png' // Coloca aquí el logo en la carpeta /public

const DATOS_PAGO_POR_METODO = {
  'Scalapay': {
    titulo: 'Pago con Scalapay',
    descripcion: 'Financiamiento en cuotas a través de Scalapay.',
    detalles: [
      'El enlace de pago será enviado por tu asesor.',
      'La aprobación está sujeta a las políticas de Scalapay.'
    ]
  },
  'Depósitos en dólares (BNC USD)': {
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
  'Binance (USDT)': {
    titulo: 'Pago con Binance (USDT)',
    descripcion: 'Transferencia en USDT a través de Binance.',
    detalles: [
      'Correo: pagosvuelosnova@gmail.com',
      'ID de Usuario: 96985487',
      'Verifica siempre el monto final antes de enviar.'
    ]
  },
  'Arcadia Service': {
    titulo: 'Pago con Arcadia Service',
    descripcion: 'Servicio Arcadia con recargo adicional.',
    detalles: [
      'El enlace/usuario de Arcadia será compartido por tu asesor.',
      'Incluye comisión del 5.6% + $10 sobre el total.'
    ]
  },
  'Zelle': {
    titulo: 'Transferencia vía Zelle',
    descripcion: 'Transferencia en USD por Zelle.',
    detalles: [
      'Titular: Viajes Nova LLC',
      'Correo: Pagoagencianova@gmail.com',
      'Concepto: Indicar nombre del cliente y número de cotización.'
    ]
  },
  'Bancacolombia': {
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
  'Davivienda': {
    titulo: 'Transferencia Davivienda (COP)',
    descripcion: 'Transferencia en pesos colombianos a cuenta Davivienda.',
    detalles: [
      'Banco: Davivienda',
      'Titular: GRUPO TRAVEL BA S.A.S.',
      'Número de Cuenta: 451500268151',
      'NIT: 901.852.156-4']
  },
  'Cuenta en Euros': {
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
  'Banesco Panamá (ViajesNova)': {
    titulo: 'Transferencia Banesco Panamá (USD)',
    descripcion: 'Transferencia internacional a cuenta en Panamá.',
    detalles: [
      'Banco: Banesco Panamá',
      'Titular: Josni Bonito',
      'Tipo de Cuenta: Cuenta Corriente',
      'Número de Cuenta: 221022077418'
    ]
  },
  'BNC - Transferencia en Bs': {
    titulo: 'Transferencia BNC (VES)',
    descripcion: 'Transferencia en bolívares a Banco Nacional de Crédito.',
    detalles: [
      'Banco: BNC (Banco Nacional de Crédito)',
      'Tipo de Cuenta: Corriente',
      'Nro. de cuenta: 0191-0022-78-2122023900',
      'Titular: Bonito Alvarado Josni Gamaliet'
    ]
  },
  'Pago móvil': {
    titulo: 'Pago móvil (VES)',
    descripcion: 'Pago móvil en bolívares.',
    detalles: [
      'Banco: Banco Nacional de Crédito (BNC)',
      'Teléfono: 0414-436 14 40',
      'Cédula: 24.347.702',
      'Titular: Josni Bonito'
    ]
  },
  'Depósito oficina Venezuela (efectivo)': {
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
  'Depósito oficina Colombia (efectivo)': {
    titulo: 'Pago en efectivo - Oficina Colombia',
    descripcion: 'Pago en pesos colombianos (COP) en efectivo en nuestra oficina de Colombia.',
    detalles: [
      'Oficina disponible:',
      '• Medellín',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
  'Depósito oficina Europa (efectivo)': {
    titulo: 'Pago en efectivo - Oficina Europa',
    descripcion: 'Pago en euros (EUR) en efectivo en nuestra oficina de Europa.',
    detalles: [
      'Oficina disponible:',
      '• Madrid, España',
      'Consulta con tu asesor la dirección exacta de la oficina.'
    ]
  },
  'Chase Bank (Estados Unidos)': {
    titulo: 'Transferencia Chase Bank (USD)',
    descripcion: 'Transferencia internacional en dólares estadounidenses a cuenta Chase Bank.',
    detalles: [
      'Banco: Chase Bank',
      'Número de cuenta: 900700953',
      'Número de tránsito interbancario (Routing): 267084131'
    ]
  },
  'Bizum (España)': {
    titulo: 'Pago vía Bizum (EUR)',
    descripcion: 'Transferencia en euros a través de Bizum.',
    detalles: [
      'Teléfono: +34 672 75 08 25'
    ]
  }
}

const DATOS_PAGO_ZELLE_APOLO = {
  titulo: 'Transferencia vía Zelle',
  descripcion: 'Transferencia en USD por Zelle.',
  detalles: [
    'Titular: A&D Finance Group LLC',
    'Correo: grupoapoloviajes@gmail.com',
    'Concepto: Indicar nombre del cliente y número de cotización.'
  ]
}

export default function CotizadorForm({ isAuthenticated = false }) {
  const [precioBase, setPrecioBase] = useState('')
  const [feeEmision, setFeeEmision] = useState('')
  const [feeAgencia, setFeeAgencia] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  // Sistema de conversión inteligente
  const [monedaPrecio, setMonedaPrecio] = useState('USD') // Moneda del precio base
  const [monedaCotizacion, setMonedaCotizacion] = useState('USD') // Moneda de cotización
  const [tasaCambio, setTasaCambio] = useState('1.0')
  const [resultadoConversion, setResultadoConversion] = useState(null)

  // Estados para monedas dinámicas desde la base de datos
  const [monedasDB, setMonedasDB] = useState([]) // Todas las monedas registradas
  const [tasasDB, setTasasDB] = useState([]) // Todas las tasas de conversión
  const [loadingMonedas, setLoadingMonedas] = useState(true)

  // Variables legacy (mantener para compatibilidad)
  const [moneda, setMoneda] = useState('')
  const [monedaOrigen, setMonedaOrigen] = useState('USD')
  const [monedaBaseSeleccionada, setMonedaBaseSeleccionada] = useState('USD') // Nueva: USD o EUR
  const [monedaCotizacionSeleccionada, setMonedaCotizacionSeleccionada] = useState('') // Nueva: Moneda de cotización
  const [total, setTotal] = useState(0)
  const [desglose, setDesglose] = useState(null)
  const [fechaSalida, setFechaSalida] = useState('')
  const [horaSalida, setHoraSalida] = useState('')
  const [horaLlegada, setHoraLlegada] = useState('')
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [idaVuelta, setIdaVuelta] = useState(false)
  const [finesMigratorios, setFinesMigratorios] = useState(false)
  const [soloIda, setSoloIda] = useState(false)

  // Estados para fines migratorios
  const [fechaSalidaMigratorio, setFechaSalidaMigratorio] = useState('')
  const [horaSalidaMigratorio, setHoraSalidaMigratorio] = useState('')
  const [horaLlegadaMigratorio, setHoraLlegadaMigratorio] = useState('')

  const [fechaRegreso, setFechaRegreso] = useState('')
  const [horaSalidaRegreso, setHoraSalidaRegreso] = useState('')
  const [horaLlegadaRegreso, setHoraLlegadaRegreso] = useState('')
  const [aerolinea, setAerolinea] = useState('')
  const [agencia, setAgencia] = useState(null) // 'nova', 'colombia', 'apolo'

  // Escalas
  const [haceEscala, setHaceEscala] = useState(false)
  const [ciudadEscala1, setCiudadEscala1] = useState('')
  const [tiempoEscala1, setTiempoEscala1] = useState('')
  const [haceSegundaEscala, setHaceSegundaEscala] = useState(false)
  const [ciudadEscala2, setCiudadEscala2] = useState('')
  const [tiempoEscala2, setTiempoEscala2] = useState('')

  // Equipaje
  const [equipajeCompleto, setEquipajeCompleto] = useState(false)
  const [equipajeMediano, setEquipajeMediano] = useState(false)
  const [equipajeLigero, setEquipajeLigero] = useState(false)

  const [exportingPdf, setExportingPdf] = useState(false)
  const pdfContentRef = useRef(null)

  // Estado para tasas dinámicas
  const [tasasDb, setTasasDb] = useState({})
  const [loadingTasas, setLoadingTasas] = useState(true)

  // Cargar monedas y tasas desde la base de datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingMonedas(true)
        const [monedasData, tasasData] = await Promise.all([
          obtenerMonedas(),
          obtenerTasasConversion()
        ])

        setMonedasDB(monedasData.filter(m => m.activa)) // Solo monedas activas
        setTasasDB(tasasData)
        setLoadingMonedas(false)
      } catch (error) {
        console.error('Error cargando datos:', error)
        setLoadingMonedas(false)
      }
    }

    cargarDatos()
  }, [])

  const metodosPago = [
    'Scalapay',
    'Depósitos en dólares (BNC USD)',
    'Binance (USDT)',
    'Arcadia Service',
    'Zelle',
    'Bancacolombia',
    'Davivienda',
    'Cuenta en Euros',
    'Banesco Panamá (ViajesNova)',
    'BNC - Transferencia en Bs',
    'Pago móvil',
    'Depósito oficina Venezuela (efectivo)',
    'Depósito oficina Colombia (efectivo)',
    'Depósito oficina Europa (efectivo)',
    'Chase Bank (Estados Unidos)',
    'Bizum (España)'
  ]

  // Mapeo de métodos de pago por moneda
  const metodosPorMoneda = {
    'USD': [
      'Depósitos en dólares (BNC USD)',
      'Zelle',
      'Banesco Panamá (ViajesNova)',
      'Chase Bank (Estados Unidos)',
      'Arcadia Service'
    ],
    'EUR': [
      'Cuenta en Euros',
      'Depósito oficina Europa (efectivo)',
      'Bizum (España)',
      'Scalapay'
    ],
    'VES': [
      'BNC - Transferencia en Bs',
      'Pago móvil'
    ],
    'COP': [
      'Bancacolombia',
      'Davivienda',
      'Depósito oficina Colombia (efectivo)'
    ],
    'USDT': [
      'Binance (USDT)'
    ],
    'FLEXIBLE': [
      'Depósito oficina Venezuela (efectivo)'
    ]
  }

  // Funciones dinámicas para obtener monedas desde la base de datos
  const getMonedasDisponibles = () => {
    if (loadingMonedas || monedasDB.length === 0) {
      // Fallback a monedas hardcoded si está cargando
      return [
        { value: 'USD', label: 'Dólares (USD)', symbol: '$' },
        { value: 'VES', label: 'Bolívares (VES)', symbol: 'Bs.' },
        { value: 'USDT', label: 'USDT', symbol: '₮' },
        { value: 'EUR', label: 'Euros (EUR)', symbol: '€' },
        { value: 'COP', label: 'Pesos Colombianos (COP)', symbol: '$' }
      ]
    }

    return monedasDB.map(moneda => ({
      value: moneda.codigo,
      label: `${moneda.nombre} (${moneda.codigo})`,
      symbol: moneda.simbolo
    }))
  }

  // Opciones para moneda base (SIEMPRE FIJO: USD y EUR)
  const monedasBase = [
    { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
  ]

  // Opciones para moneda de cotización (todas las monedas registradas)
  const getMonedasCotizacion = () => {
    return getMonedasDisponibles()
  }

  // Opciones para moneda destino (solo monedas con tasas de conversión)
  const getMonedasConTasas = () => {
    if (loadingMonedas || tasasDB.length === 0) {
      return getMonedasDisponibles() // Fallback
    }

    // Obtener monedas que tienen tasas de conversión
    const monedasConTasas = new Set()
    tasasDB.forEach(tasa => {
      monedasConTasas.add(tasa.moneda_destino.codigo)
      monedasConTasas.add(tasa.moneda_origen.codigo)
    })

    return getMonedasDisponibles().filter(moneda =>
      monedasConTasas.has(moneda.value)
    )
  }

  // Filtrar métodos de pago según moneda de cotización
  const metodosPagoFiltrados = monedaCotizacionSeleccionada
    ? (metodosPorMoneda[monedaCotizacionSeleccionada] || [])
    : []

  // Limpiar método de pago si no está disponible para la moneda seleccionada
  useEffect(() => {
    if (monedaCotizacionSeleccionada && metodoPago) {
      const metodosDisponibles = metodosPorMoneda[monedaCotizacionSeleccionada] || []
      if (!metodosDisponibles.includes(metodoPago)) {
        setMetodoPago('')
      }
    }
  }, [monedaCotizacionSeleccionada])

  // Cargar tasas al iniciar
  useEffect(() => {
    fetchTasas()
  }, [])

  const fetchTasas = async () => {
    try {
      setLoadingTasas(true)
      const { data, error } = await supabase
        .from('tasas_conversion')
        .select(`
          *,
          moneda_origen:monedas!tasas_conversion_moneda_origen_id_fkey(codigo),
          moneda_destino:monedas!tasas_conversion_moneda_destino_id_fkey(codigo)
        `)
        .eq('activa', true)

      if (error) {
        console.error('Error fetching rates:', error)
        return
      }

      if (data) {
        // Crear un mapa de conversiones para acceso rápido
        const tasasMap = {}
        data.forEach(t => {
          const origen = t.moneda_origen?.codigo
          const destino = t.moneda_destino?.codigo
          if (origen && destino) {
            if (!tasasMap[origen]) tasasMap[origen] = {}
            tasasMap[origen][destino] = t.tasa
          }
        })
        setTasasDb(tasasMap)
        console.log('Tasas cargadas:', tasasMap)
      }
    } catch (err) {
      console.error('Error en fetchTasas:', err)
    } finally {
      setLoadingTasas(false)
    }
  }

  // Función para detectar moneda según método de pago
  const detectarMonedaPorMetodo = (metodo) => {
    for (const [moneda, metodos] of Object.entries(metodosPorMoneda)) {
      if (metodos.includes(metodo)) {
        return moneda
      }
    }
    return null
  }

  // Manejar cambio de método de pago con detección automática
  useEffect(() => {
    if (!metodoPago) {
      setMoneda('')
      return
    }

    const monedaDetectada = detectarMonedaPorMetodo(metodoPago)
    if (monedaDetectada) {
      // Si es FLEXIBLE, no establecer moneda automáticamente
      if (monedaDetectada === 'FLEXIBLE') {
        setMoneda('') // Dejar vacío para selección manual
        setTasaCambio('') // No establecer tasa hasta que se seleccione moneda
        return
      }

      setMoneda(monedaDetectada)

      // Para VES, mantener la moneda de origen por defecto
      if (monedaDetectada === 'VES') {
        // La tasa se establecerá según la moneda de origen
        actualizarTasaParaVES()
      } else {
        // Para otras monedas, la tasa es 1.0
        setTasaCambio('1.0')
      }
    }
  }, [metodoPago])

  // Función para actualizar tasa según moneda de origen y destino
  const actualizarTasaParaVES = () => {
    if (!monedaOrigen || !moneda) {
      setTasaCambio('1.0')
      return
    }

    // Buscar tasa directa: origen → destino
    let tasa = tasasDb[monedaOrigen]?.[moneda]

    // Si no existe, buscar tasa inversa: destino → origen
    if (!tasa && tasasDb[moneda]?.[monedaOrigen]) {
      tasa = 1.0 / tasasDb[moneda][monedaOrigen]
    }

    setTasaCambio(tasa ? String(tasa) : '1.0')
    console.log(`Tasa ${monedaOrigen} → ${moneda}:`, tasa || '1.0')
  }

  // Actualizar tasa cuando cambia la moneda de origen (solo para VES)
  useEffect(() => {
    if (moneda === 'VES' && monedaOrigen) {
      actualizarTasaParaVES()
    }
  }, [monedaOrigen, moneda, tasasDb])

  // Actualizar tasa cuando se cambia la moneda (solo para no VES)
  useEffect(() => {
    if (moneda && moneda !== 'VES') {
      // Para monedas que no son VES, la tasa es siempre 1.0
      setTasaCambio('1.0')
    }
  }, [moneda])

  // Sincronizar variables de moneda nuevas con las del sistema inteligente
  useEffect(() => {
    setMonedaPrecio(monedaBaseSeleccionada)
  }, [monedaBaseSeleccionada])

  useEffect(() => {
    setMonedaCotizacion(monedaCotizacionSeleccionada)
  }, [monedaCotizacionSeleccionada])

  // Recalcular cuando cambian los inputs (con debounce para evitar demasiadas llamadas)
  useEffect(() => {
    if ((precioBase || feeEmision || feeAgencia) && monedaPrecio && monedaCotizacion) {
      const timeoutId = setTimeout(() => {
        const calcular = async () => {
          try {
            await calcularCotizacion()
          } catch (error) {
            console.error('❌ Error en cálculo automático:', error)
          }
        }
        calcular()
      }, 300) // 300ms de debounce

      return () => clearTimeout(timeoutId)
    }
  }, [precioBase, feeEmision, feeAgencia, monedaPrecio, monedaCotizacion, metodoPago])

  const calcularCotizacion = async () => {
    const precio = parseFloat(precioBase) || 0
    const emision = parseFloat(feeEmision) || 0
    const agencia = parseFloat(feeAgencia) || 0

    // Calcular base (precio + fees)
    const base = precio + emision + agencia

    try {
      // Usar sistema inteligente de conversión
      const resultado = await calcularConversionInteligente({
        base,
        monedaBase: monedaPrecio,
        monedaCotizacion: monedaCotizacion,
        metodoPago
      })

      // Actualizar estado con resultado
      setResultadoConversion(resultado)
      setTotal(resultado.total)
      setTasaCambio(resultado.tasaConversion.toString())

      // Mantener compatibilidad con formato legacy
      setDesglose({
        precioBase: precio,
        feeEmision: emision,
        feeAgencia: agencia,
        subtotal: base,
        tasaCambio: resultado.tasaConversion,
        totalPrevio: resultado.baseConvertida,
        recargoDescripcion: resultado.descripcionRecargos,
        totalAntesImpuestoGobierno: resultado.baseConvertida + resultado.recargos,
        impuestoGobierno: resultado.impuestos,
        totalFinal: resultado.total
      })

      // Actualizar variables legacy para compatibilidad
      setMoneda(monedaCotizacion)

      console.log('✅ Cotización calculada con sistema inteligente:', resultado)

    } catch (error) {
      console.error('❌ Error en cálculo inteligente:', error)

      // Fallback a cálculo simple si hay error
      const tasa = parseFloat(tasaCambio) || 1
      const subtotal = base * tasa
      setTotal(subtotal)
      setDesglose({
        precioBase: precio,
        feeEmision: emision,
        feeAgencia: agencia,
        subtotal: base,
        tasaCambio: tasa,
        totalPrevio: subtotal,
        recargoDescripcion: 'Error en conversión',
        totalAntesImpuestoGobierno: subtotal,
        impuestoGobierno: 0,
        totalFinal: subtotal
      })
    }
  }

  const monedaSeleccionada = getMonedasDisponibles().find(m => m.value === moneda)
  const simboloMoneda = monedaSeleccionada?.symbol || '$'

  const formatearMonto = (valor) => {
    if (!valor && valor !== 0) return '0.00'
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor)
  }

  const handleLimpiar = () => {
    // Sistema inteligente
    setMonedaPrecio('USD')
    setMonedaCotizacion('USD')
    setTasaCambio('1.0')
    setResultadoConversion(null)

    // Variables nuevas
    setMonedaBaseSeleccionada('USD')
    setMonedaCotizacionSeleccionada('')

    // Variables legacy
    setPrecioBase('')
    setFeeEmision('')
    setFeeAgencia('')
    setMetodoPago('')
    setMoneda('')
    setMonedaOrigen('USD')
    setTotal(0)
    setDesglose(null)
    setFechaSalida('')
    setHoraSalida('')
    setHoraLlegada('')
    setOrigen('')
    setDestino('')
    setIdaVuelta(false)
    setFinesMigratorios(false)
    setSoloIda(false)
    setFechaRegreso('')
    setHoraSalidaRegreso('')
    setHoraLlegadaRegreso('')
    setAerolinea('')
    setAgencia(null)
    setHaceEscala(false)
    setCiudadEscala1('')
    setTiempoEscala1('')
    setHaceSegundaEscala(false)
    setCiudadEscala2('')
    setTiempoEscala2('')
    setEquipajeCompleto(false)
    setEquipajeMediano(false)
    setEquipajeLigero(false)
  }

  const limpiarDetallesVuelo = () => {
    setFechaSalida('')
    setHoraSalida('')
    setHoraLlegada('')
    setOrigen('')
    setDestino('')
    setFechaRegreso('')
    setHoraSalidaRegreso('')
    setHoraLlegadaRegreso('')
    setAerolinea('')
    setSoloIda(false)
    setHaceEscala(false)
    setCiudadEscala1('')
    setTiempoEscala1('')
    setHaceSegundaEscala(false)
    setCiudadEscala2('')
    setTiempoEscala2('')
  }

  const handleExportarPdf = async () => {
    if (!agencia) {
      alert('Por favor selecciona la agencia (Nova, Nova Colombia o Apolo) antes de exportar el PDF.')
      return
    }
    if (!pdfContentRef.current) return
    if (!desglose) {
      alert('Primero calcula una cotización antes de exportar el PDF.')
      return
    }

    try {
      setExportingPdf(true)
      const element = pdfContentRef.current

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f1f5f9'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const marginX = 12
      const marginTop = 6
      const usableWidth = pdfWidth - marginX * 2
      const imgHeight = (canvas.height * usableWidth) / canvas.width
      const startY = marginTop

      pdf.addImage(imgData, 'PNG', marginX, startY, usableWidth, imgHeight)

      const fecha = new Date().toISOString().split('T')[0]
      pdf.save(`cotizacion_${fecha}.pdf`)
    } catch (error) {
      console.error('Error exportando PDF de cotización:', error)
      alert('Ocurrió un error al generar el PDF. Intenta nuevamente.')
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        {/* Selector de Agencia */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            AGENCIA
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'nova', label: 'NOVA', color: 'indigo' },
              { id: 'colombia', label: 'NOVA COLOMBIA', color: 'indigo' },
              { id: 'apolo', label: 'APOLO', color: 'amber' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAgencia(opt.id)}
                className={`py-1.5 px-1 rounded-lg font-bold text-[9px] transition-all border-2 ${agencia === opt.id
                  ? opt.color === 'indigo'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            Calculadora de Cotizaciones
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLimpiar}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
              title="Limpiar formulario"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar
            </button>
            {isAuthenticated && (
              <button
                onClick={fetchTasas}
                disabled={loadingTasas}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50"
                title="Actualizar tasas"
              >
                <RefreshCw className={`w-5 h-5 ${loadingTasas ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Sección de Precios y Monedas */}
        <CollapsibleSection
          title="Precios y Monedas"
          icon={DollarSign}
          defaultExpanded={true}
        >
          <div className="space-y-4">
            {/* Precio de Pantalla */}
            <div>
              <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                Precio de Pantalla
              </label>
              <input
                type="number"
                step="0.01"
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Selección de Moneda Base */}
            <div>
              <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                ¿El precio introducido está en:
              </label>
              <select
                value={monedaBaseSeleccionada}
                onChange={(e) => setMonedaBaseSeleccionada(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                {monedasBase.map(moneda => (
                  <option key={moneda.value} value={moneda.value}>
                    {moneda.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Moneda de Cotización */}
            <div>
              <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                ¿En qué moneda deseas cotizar?
              </label>
              <select
                value={monedaCotizacionSeleccionada}
                onChange={(e) => setMonedaCotizacionSeleccionada(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Seleccione la moneda en la que desea cotizar</option>
                {getMonedasConTasas().map(moneda => (
                  <option key={moneda.value} value={moneda.value}>
                    {moneda.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fees */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                  Fee Emisión
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={feeEmision}
                  onChange={(e) => setFeeEmision(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                  Fee Agencia
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={feeAgencia}
                  onChange={(e) => setFeeAgencia(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Sección de Método de Pago */}
        <CollapsibleSection
          title="Método de Pago"
          icon={CreditCard}
          defaultExpanded={true}
        >
          <div>
            <label className="text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Método de Pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
              disabled={!monedaCotizacionSeleccionada}
            >
              <option value="">
                {monedaCotizacionSeleccionada
                  ? 'Seleccionar método'
                  : 'Primero selecciona una moneda de cotización'}
              </option>
              {metodosPagoFiltrados.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
            {!monedaCotizacionSeleccionada && (
              <p className="text-xs text-amber-600 mt-1 ml-2 font-medium">
                💡 Selecciona primero la moneda de cotización para ver los métodos de pago disponibles
              </p>
            )}
            {metodoPago === 'Depósitos en dólares (BNC USD)' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">
                Cotización en USD (+3.5% comisión depósito)
              </p>
            )}
            {metodoPago === 'Arcadia Service' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en USD (+5.6% + $10)</p>
            )}
            {metodoPago === 'BNC - Transferencia en Bs' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en Bolívares (VES)</p>
            )}
            {metodoPago === 'Pago móvil' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en Bolívares (VES)</p>
            )}
            {metodoPago === 'Depósito oficina Venezuela (efectivo)' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Pago en efectivo USD - Seleccione moneda de cotización</p>
            )}
            {(metodoPago === 'Davivienda' || metodoPago === 'Bancacolombia' || metodoPago === 'Depósito oficina Colombia (efectivo)') && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en Pesos Colombianos (COP)</p>
            )}
            {(metodoPago === 'Cuenta en Euros' || metodoPago === 'Depósito oficina Europa (efectivo)' || metodoPago === 'Bizum (España)') && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en Euros (EUR)</p>
            )}
            {(metodoPago === 'Zelle' || metodoPago === 'Banesco Panamá (ViajesNova)' || metodoPago === 'Chase Bank (Estados Unidos)') && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en Dólares (USD)</p>
            )}
            {metodoPago === 'Binance (USDT)' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en USDT</p>
            )}
            {metodoPago === 'Scalapay' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en Euros (EUR) +9.3% recargo</p>
            )}
          </div>
        </CollapsibleSection>

        {/* Sección de Tipo de Vuelo */}
        <CollapsibleSection
          title="Tipo de Vuelo"
          icon={Plane}
          defaultExpanded={true}
        >
          <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                const newValue = !idaVuelta
                if (newValue) {
                  setFinesMigratorios(false)
                  setSoloIda(false)
                  limpiarDetallesVuelo()
                } else {
                  limpiarDetallesVuelo()
                }
                setIdaVuelta(newValue)
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${idaVuelta
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${idaVuelta ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              IDA Y VUELTA
            </button>
            <button
              type="button"
              onClick={() => {
                const newValue = !soloIda
                if (newValue) {
                  setIdaVuelta(false)
                  setFinesMigratorios(false)
                  limpiarDetallesVuelo()
                } else {
                  limpiarDetallesVuelo()
                }
                setSoloIda(newValue)
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${soloIda
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${soloIda ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              SOLO IDA
            </button>
            <button
              type="button"
              onClick={() => {
                const newValue = !finesMigratorios
                if (newValue) {
                  setIdaVuelta(false)
                  setSoloIda(false)
                  limpiarDetallesVuelo()
                } else {
                  limpiarDetallesVuelo()
                }
                setFinesMigratorios(newValue)
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${finesMigratorios
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${finesMigratorios ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              FINES MIGRATORIOS
            </button>
          </div>

          {/* Campos para Fines Migratorios */}
          {finesMigratorios && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="text-sm font-bold text-amber-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Información para Fines Migratorios
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
                    Fecha Salida
                  </label>
                  <input
                    type="date"
                    value={fechaSalidaMigratorio}
                    onChange={(e) => setFechaSalidaMigratorio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
                    Hora Salida
                  </label>
                  <input
                    type="time"
                    value={horaSalidaMigratorio}
                    onChange={(e) => setHoraSalidaMigratorio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
                    Hora Llegada
                  </label>
                  <input
                    type="time"
                    value={horaLlegadaMigratorio}
                    onChange={(e) => setHoraLlegadaMigratorio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                Origen
              </label>
              <input
                type="text"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                placeholder="Ej: CCS"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                Destino
              </label>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ej: MAD"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
              Aerolínea
            </label>
            <input
              type="text"
              value={aerolinea}
              onChange={(e) => setAerolinea(e.target.value)}
              placeholder="Ej: Avianca"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {(idaVuelta || soloIda) && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest px-1">Vuelo de Ida</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">FECHA</label>
                  <input
                    type="date"
                    value={fechaSalida}
                    onChange={(e) => setFechaSalida(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">SALIDA</label>
                  <input
                    type="time"
                    value={horaSalida}
                    onChange={(e) => setHoraSalida(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">LLEGADA</label>
                  <input
                    type="time"
                    value={horaLlegada}
                    onChange={(e) => setHoraLlegada(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}
          {idaVuelta && (
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest px-1">Vuelo de Vuelta</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">FECHA</label>
                  <input
                    type="date"
                    value={fechaRegreso}
                    onChange={(e) => setFechaRegreso(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">SALIDA</label>
                  <input
                    type="time"
                    value={horaSalidaRegreso}
                    onChange={(e) => setHoraSalidaRegreso(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">LLEGADA</label>
                  <input
                    type="time"
                    value={horaLlegadaRegreso}
                    onChange={(e) => setHoraLlegadaRegreso(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}
          {/* Escalas */}
          <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="haceEscala"
                checked={haceEscala}
                onChange={(e) => {
                  setHaceEscala(e.target.checked)
                  if (!e.target.checked) {
                    setCiudadEscala1('')
                    setTiempoEscala1('')
                    setHaceSegundaEscala(false)
                    setCiudadEscala2('')
                    setTiempoEscala2('')
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="haceEscala" className="text-xs font-bold text-orange-700 uppercase tracking-widest cursor-pointer">
                ¿El vuelo hace escala?
              </label>
            </div>
            {haceEscala && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">CIUDAD DE ESCALA</label>
                    <input
                      type="text"
                      value={ciudadEscala1}
                      onChange={(e) => setCiudadEscala1(e.target.value)}
                      placeholder="Ej: Bogotá"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">DURACIÓN DE ESCALA</label>
                    <input
                      type="text"
                      value={tiempoEscala1}
                      onChange={(e) => {
                        const value = e.target.value
                        // Validar formato HH:MM, HH.MM o número decimal (permitir entrada progresiva)
                        if (value === '' || /^\d{0,2}([.:]\d{0,2})?$/.test(value)) {
                          setTiempoEscala1(value)
                        }
                      }}
                      placeholder="Ej: 5:30 o 5.5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm bg-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">Formato: 5:30 (5h 30min) o 5.5</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="haceSegundaEscala"
                    checked={haceSegundaEscala}
                    onChange={(e) => {
                      setHaceSegundaEscala(e.target.checked)
                      if (!e.target.checked) {
                        setCiudadEscala2('')
                        setTiempoEscala2('')
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="haceSegundaEscala" className="text-xs font-bold text-orange-600 cursor-pointer">
                    ¿Segunda escala?
                  </label>
                </div>
                {haceSegundaEscala && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">CIUDAD 2ª ESCALA</label>
                      <input
                        type="text"
                        value={ciudadEscala2}
                        onChange={(e) => setCiudadEscala2(e.target.value)}
                        placeholder="Ej: Panamá"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">DURACIÓN 2ª ESCALA</label>
                      <input
                        type="text"
                        value={tiempoEscala2}
                        onChange={(e) => {
                          const value = e.target.value
                          // Validar formato HH:MM, HH.MM o número decimal (permitir entrada progresiva)
                          if (value === '' || /^\d{0,2}([.:]\d{0,2})?$/.test(value)) {
                            setTiempoEscala2(value)
                          }
                        }}
                        placeholder="Ej: 2:15 o 2.25"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm bg-white"
                      />
                      <p className="text-xs text-slate-500 mt-1">Formato: 2:15 (2h 15min) o 2.25</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Equipaje */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest px-1">Equipaje</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  checked={equipajeCompleto}
                  onChange={(e) => setEquipajeCompleto(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-700">Equipaje completo</p>
                  <p className="text-[10px] text-slate-500">Maleta 23 Kg + Maleta 8 Kg + Artículo personal</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  checked={equipajeMediano}
                  onChange={(e) => setEquipajeMediano(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-700">Equipaje mediano</p>
                  <p className="text-[10px] text-slate-500">Maleta 23 Kg + Artículo personal</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  checked={equipajeLigero}
                  onChange={(e) => setEquipajeLigero(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-700">Equipaje ligero</p>
                  <p className="text-[10px] text-slate-500">Maleta 10 Kg + Artículo personal</p>
                </div>
              </label>
            </div>
          </div>
        </CollapsibleSection>

      </div>

      {/* Panel de Resultados */}
      <div className="space-y-6">
        <div className="sticky top-6 space-y-6">
          {/* Tarjeta elegante SOLO para el PDF (oculta visualmente, usada para generar la imagen) */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
            <div
              ref={pdfContentRef}
              className="bg-white p-8" // Removed shadow and borders since it's for PDF
            >
              <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 flex items-center justify-center overflow-hidden">
                    {/* Logo de la agencia dinámico */}
                    <img
                      src={agencia === 'apolo' ? '/apolo-viajes-letras-azules.png' : '/viajes-nova-morado.png'}
                      alt="Logo agencia"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Cotización de Viaje
                    </p>
                    <h2 className="text-xl font-bold text-slate-900">
                      {agencia === 'nova' ? 'Viajes Nova' : agencia === 'colombia' ? 'Viajes Nova Colombia' : 'Apolo Viajes'}
                    </h2>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p className="font-medium">Fecha de Cotización</p>
                  <p>
                    {new Date().toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      timeZone: 'America/Caracas'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* 1. Información del Vuelo ([NEW]) */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-700">
                      Información del Vuelo
                    </h3>
                    <div className="flex gap-2">
                      {idaVuelta && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100">
                          IDA Y VUELTA
                        </span>
                      )}
                      {soloIda && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                          SOLO IDA
                        </span>
                      )}
                      {finesMigratorios && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                          FINES MIGRATORIOS
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Trayecto General */}
                    <div className="flex items-center gap-4 py-2 px-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-500 uppercase font-medium">Origen</p>
                        <p className="text-lg font-bold text-slate-800">{origen || '---'}</p>
                      </div>
                      <div className="h-px flex-1 bg-slate-300 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-sm" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-medium">Destino</p>
                        <p className="text-lg font-bold text-slate-800">{destino || '---'}</p>
                      </div>
                    </div>

                    {(idaVuelta || soloIda) && (
                    <div className="grid grid-cols-2 gap-8">
                      {/* Bloque Ida */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase border-b border-indigo-50 pb-1">Vuelo de Ida</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase">Fecha</p>
                            <p className="text-xs font-bold text-slate-700">
                                {fechaSalida ? (() => {
                                  const [year, month, day] = fechaSalida.split('-')
                                  return `${day}/${month}/${year}`
                                })() : '---'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase">Aerolínea</p>
                            <p className="text-xs font-bold text-slate-700">{aerolinea || '---'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase">Salida</p>
                            <p className="text-xs font-bold text-slate-700">{horaSalida || '--:--'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase">Llegada</p>
                            <p className="text-xs font-bold text-slate-700">{horaLlegada || '--:--'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bloque Vuelta (Solo si aplica) */}
                      {idaVuelta ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-purple-600 uppercase border-b border-purple-50 pb-1">Vuelo de Vuelta</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase">Fecha</p>
                              <p className="text-xs font-bold text-slate-700">
                                  {fechaRegreso ? (() => {
                                    const [year, month, day] = fechaRegreso.split('-')
                                    return `${day}/${month}/${year}`
                                  })() : '---'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase">Aerolínea</p>
                              <p className="text-xs font-bold text-slate-700">{aerolinea || '---'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase">Salida</p>
                              <p className="text-xs font-bold text-slate-700">{horaSalidaRegreso || '--:--'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase">Llegada</p>
                              <p className="text-xs font-bold text-slate-700">{horaLlegadaRegreso || '--:--'}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                          <p className="text-[10px] text-slate-400 uppercase italic">Solo Ida</p>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Fines Migratorios */}
                    {finesMigratorios && (
                      <div className="py-3 px-4 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">Fines Migratorios</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase">Fecha Salida</p>
                            <p className="text-xs font-bold text-slate-700">
                              {fechaSalidaMigratorio ? (() => {
                                const [year, month, day] = fechaSalidaMigratorio.split('-')
                                return `${day}/${month}/${year}`
                              })() : '---'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase">Hora Salida</p>
                            <p className="text-xs font-bold text-slate-700">{horaSalidaMigratorio || '--:--'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase">Hora Llegada</p>
                            <p className="text-xs font-bold text-slate-700">{horaLlegadaMigratorio || '--:--'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Escalas */}
                    {haceEscala && (
                      <div className="py-3 px-4 bg-orange-50 rounded-lg border border-orange-100">
                        <p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Escalas</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase">1ª Escala</p>
                            <p className="text-xs font-bold text-slate-700">{ciudadEscala1 || '---'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase">Duración</p>
                            <p className="text-xs font-bold text-slate-700">{tiempoEscala1 ? `${tiempoEscala1} h` : '---'}</p>
                          </div>
                          {haceSegundaEscala && (
                            <>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase">2ª Escala</p>
                                <p className="text-xs font-bold text-slate-700">{ciudadEscala2 || '---'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase">Duración</p>
                                <p className="text-xs font-bold text-slate-700">{tiempoEscala2 ? `${tiempoEscala2} h` : '---'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Servicios Incluidos */}
                {(idaVuelta || finesMigratorios || equipajeCompleto || equipajeMediano || equipajeLigero) && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-amber-700 border-b border-amber-200 pb-2">
                      Servicios Incluidos
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {finesMigratorios && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p className="text-xs font-bold text-slate-700">Boleto de retorno</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p className="text-xs font-bold text-slate-700">Seguro de viaje</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p className="text-xs font-bold text-slate-700">Reserva de hotel</p>
                          </div>
                        </>
                      )}
                      {equipajeCompleto && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-xs font-bold text-slate-700">Equipaje completo (23 Kg + 8 Kg + artículo personal)</p>
                        </div>
                      )}
                      {equipajeMediano && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-xs font-bold text-slate-700">Equipaje mediano (23 Kg + artículo personal)</p>
                        </div>
                      )}
                      {equipajeLigero && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-xs font-bold text-slate-700">Equipaje ligero (10 Kg + artículo personal)</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Total principal */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Monto total de la cotización
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {simboloMoneda} {formatearMonto(total)}
                    </p>
                    {monedaSeleccionada && (
                      <p className="text-xs text-slate-500 mt-1">
                        Moneda: {monedaSeleccionada.label}
                      </p>
                    )}
                  </div>
                  {/* Desglose eliminado del PDF según requerimiento */}
                </div>

                {/* Método de pago + datos de pago */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Método de pago seleccionado
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {metodoPago || 'Sin definir'}
                      </p>
                    </div>
                    {/* Recargo descriptivo eliminado del PDF según requerimiento */}
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="space-y-2 text-sm">
                    {(() => {
                      const datos = (metodoPago === 'Zelle' && agencia === 'apolo') ? DATOS_PAGO_ZELLE_APOLO : DATOS_PAGO_POR_METODO[metodoPago]
                      if (!datos) {
                        return (
                          <p className="text-slate-500">
                            Los datos específicos de pago para este método aún no están configurados.
                            Por favor, consulta con tu asesor para que te los comparta.
                          </p>
                        )
                      }

                      // No mostrar detalles de cuenta para Arcadia o Scalapay en el PDF
                      if (metodoPago === 'Arcadia Service' || metodoPago === 'Scalapay') {
                        return (
                          <p className="text-slate-600 italic">
                            El enlace de pago correspondiente será compartido por tu asesor de viaje una vez confirmada la cotización.
                          </p>
                        )
                      }

                      // Depósito oficina Venezuela - 2 columnas para ciudades
                      if (metodoPago === 'Depósito oficina Venezuela (efectivo)') {
                        return (
                          <>
                            <p className="font-semibold text-slate-800">{datos.titulo}</p>
                            <p className="text-slate-600">{datos.descripcion}</p>
                            <p className="mt-2 text-xs font-medium text-slate-500">Oficinas disponibles:</p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1">
                              {['San Cristóbal', 'Maracaibo', 'Caracas', 'Valencia (Parral)', 'Valencia (Torre de Seguro Los Andes)'].map((ciudad, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <div className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                                  <p className="text-slate-600">{ciudad}</p>
                                </div>
                              ))}
                            </div>
                            <p className="mt-2 text-slate-500 text-xs italic">Consulta con tu asesor la dirección exacta de la oficina más cercana.</p>
                          </>
                        )
                      }

                      // Cuenta en Euros - 2 columnas (BBVA + Revolut)
                      if (metodoPago === 'Cuenta en Euros') {
                        return (
                          <>
                            <p className="font-semibold text-slate-800">{datos.titulo}</p>
                            <p className="text-slate-600">{datos.descripcion}</p>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700 uppercase">Opción Principal</p>
                                <p className="text-slate-600">Banco: BBVA</p>
                                <p className="text-slate-600">Titular: Grupo Travel BA</p>
                                <p className="text-slate-600 text-xs break-all">IBAN: ES2301821876830201934375</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700 uppercase">Opción Secundaria</p>
                                <p className="text-slate-600">Banco: Revolut</p>
                                <p className="text-slate-600">Titular: Gaddiel Montero Yepez</p>
                                <p className="text-slate-600 text-xs break-all">IBAN: ES5415830001169083916022</p>
                              </div>
                            </div>
                          </>
                        )
                      }

                      return (
                        <>
                          <p className="font-semibold text-slate-800">
                            {datos.titulo}
                          </p>
                          <p className="text-slate-600">
                            {datos.descripcion}
                          </p>
                          <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
                            {datos.detalles.map((linea, idx) => (
                              <li key={idx}>{linea}</li>
                            ))}
                          </ul>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Nota al cliente */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
                  Esta cotización es referencial y puede estar sujeta a cambios según
                  disponibilidad, variación de tasas de cambio o condiciones del proveedor.
                  Confirma siempre con tu asesor antes de realizar cualquier pago.
                </div>
              </div>
            </div>
          </div>

          {/* Bloque interno solo para el asesor (desglose) */}
          {desglose ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">
                Desglose de Cotización 
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Precio de Pantalla</span>
                  <span className="font-semibold text-slate-800">
                    ${formatearMonto(desglose.precioBase)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Fees (Emisión + Agencia)</span>
                  <span className="font-semibold text-slate-800">
                    ${formatearMonto(desglose.feeEmision + desglose.feeAgencia)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b-2 border-slate-300">
                  <span className="font-medium text-slate-700">Subtotal (USD)</span>
                  <span className="font-semibold text-slate-800">
                    ${formatearMonto(desglose.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Tasa de Cambio</span>
                  <span className="font-semibold text-indigo-600">
                    × {formatearMonto(desglose.tasaCambio)}
                  </span>
                </div>

                {/* Mostrar subtotal convertido si hay recargos */}
                {desglose.recargoDescripcion && (
                  <div className="flex justify-between items-center pt-2 text-sm">
                    <span className="text-slate-500">Subtotal ({moneda})</span>
                    <span className="font-medium text-slate-600">
                      {simboloMoneda} {formatearMonto(desglose.totalPrevio)}
                    </span>
                  </div>
                )}

                {/* Impuesto del gobierno de Colombia (solo si aplica) */}
                {moneda === 'COP' && desglose.impuestoGobierno > 0 && (
                  <div className="flex justify-between items-center pt-2 text-sm">
                    <span className="text-slate-500">Impuesto gobierno (4 COP por cada 1000)</span>
                    <span className="font-medium text-slate-600">
                      {simboloMoneda} {formatearMonto(desglose.impuestoGobierno)}
                    </span>
                  </div>
                )}

                {metodoPago && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-2">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Método de pago:</span>
                      <span className="ml-2 text-indigo-700 font-semibold">
                        {metodoPago}
                      </span>
                    </p>
                    {desglose.recargoDescripcion && (
                      <p className="text-sm text-orange-700 bg-orange-50 p-2 rounded border border-orange-100 font-medium">
                        {desglose.recargoDescripcion}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
              <Calculator className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">
                Completa los campos para ver el desglose
              </p>
            </div>
          )}

          {/* Total + botón de exportación */}
          <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2 opacity-90">Total a Pagar</h3>
              <div className="text-5xl font-bold mb-1">
                {simboloMoneda} {formatearMonto(total)}
              </div>
              {monedaSeleccionada && (
                <p className="text-sm opacity-80">
                  {monedaSeleccionada.label}
                </p>
              )}
              {moneda === 'VES' && (
                <div className="mt-2 p-2 bg-white/10 rounded-lg">
                  <p className="text-xs opacity-90">
                    <span className="font-semibold">Reconversión:</span> {monedaOrigen} → VES
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    Tasa: 1 {monedaOrigen} = {tasaCambio} Bs
                  </p>
                </div>
              )}
            </div>
            <div className="flex md:flex-col gap-3">
              <button
                type="button"
                onClick={handleExportarPdf}
                disabled={!desglose || exportingPdf}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white text-indigo-700 font-medium text-sm shadow-sm hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {exportingPdf ? (
                  <>
                    <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
