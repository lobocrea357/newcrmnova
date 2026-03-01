'use client'
// React
import { useState, useEffect, useRef } from 'react'

// Librerías externas
import { Calculator, DollarSign, Percent, CreditCard, TrendingUp, RefreshCw, Download, ArrowRightLeft, Plane, Calendar, MapPin, Luggage, Users } from 'lucide-react'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

// Supabase
import { supabase } from '@/lib/supabase'

// Componentes
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import PasajerosManager from './PasajerosManager'
import PdfContent from './PdfContent'

// Helpers
import { confirmAlert } from '@/helpers/sweetAlerts'

// Lógica de negocio
import {
  calcularConversionInteligente,
  getMonedasCotizacion,
  getMonedasBase,
  getMonedaInfo,
  esMonedaBase
} from '@/lib/conversorInteligente'
import { obtenerMonedas, obtenerTasasConversion } from '@/lib/tasasHelpers'

// Configuración
import {
  AGENCY_CONFIG,
  PAYMENT_DATA,
  PAYMENT_DATA_ZELLE_APOLO,
  METHODS_BY_CURRENCY,
  ALL_PAYMENT_METHODS,
  getPaymentData
} from '@/lib/cotizador/paymentConfig'

/**
 * Componente principal del cotizador de vuelos
 * Soporta cotización individual y múltiple con conversión inteligente de monedas
 */
export default function CotizadorForm({ isAuthenticated = false }) {
  // ============================================
  // ESTADO - Vista y Configuración
  // ============================================
  const [vistaCotizacion, setVistaCotizacion] = useState('individual')
  const [primerVez, setPrimerVez] = useState(true)

  // Estado para tipo de pasajero individual
  const [tipoPasajeroIndividual, setTipoPasajeroIndividual] = useState('adulto')

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

  // Estado para pasajeros (nueva funcionalidad)
  const [pasajeros, setPasajeros] = useState({
    adultos: [],
    niños: [],
    infantes: []
  })

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
        setMonedasDB(monedasData)
        setTasasDB(tasasData)
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoadingMonedas(false)
      }
    }
    cargarDatos()
  }, [])

  // SweetAlert inicial para primera vez
  useEffect(() => {
    if (primerVez) {
      confirmAlert(
        'Por favor selecciona el tipo de cotización que deseas realizar',
        {
          title: '¿Para cuántos pasajeros es esta cotización?',
          confirmButtonText: 'Un solo pasajero',
          cancelButtonText: 'Múltiples pasajeros',
          reverseButtons: true,
          icon: 'question'
        }
      ).then((result) => {
        if (result.isConfirmed) {
          setVistaCotizacion('individual')
        } else {
          setVistaCotizacion('multiple')
        }
        setPrimerVez(false)
      })
    }
  }, [primerVez])

  // Función para cambiar de vista con reset completo
  const cambiarVista = (nuevaVista) => {
    if (nuevaVista === vistaCotizacion) return // No hacer nada si es la misma vista

    // Reset completo del formulario
    limpiarFormularioCompleto()

    // Cambiar vista
    setVistaCotizacion(nuevaVista)
  }

  // Función para reset completo del formulario
  const limpiarFormularioCompleto = () => {
    // Resetear todos los estados
    setPrecioBase('')
    setFeeEmision('')
    setFeeAgencia('')
    setMetodoPago('')
    setMonedaPrecio('USD')
    setMonedaCotizacion('USD')
    setTasaCambio('1.0')
    setResultadoConversion(null)
    setMoneda('')
    setMonedaOrigen('USD')
    setMonedaBaseSeleccionada('USD')
    setMonedaCotizacionSeleccionada('')
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
    setFechaSalidaMigratorio('')
    setHoraSalidaMigratorio('')
    setHoraLlegadaMigratorio('')
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
    setPasajeros({
      adultos: [],
      niños: [],
      infantes: []
    })
    setTipoPasajeroIndividual('adulto')
  }

  const metodosPago = ALL_PAYMENT_METHODS
  const metodosPorMoneda = METHODS_BY_CURRENCY

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

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  /**
   * Detecta la moneda asociada a un método de pago
   */
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
  }, [precioBase, feeEmision, feeAgencia, pasajeros, monedaPrecio, monedaCotizacion, metodoPago])

  // Calcular total de pasajeros
  const calcularTotalPasajeros = () => {
    let total = 0
    Object.values(pasajeros).forEach(categoriaPasajeros => {
      total += categoriaPasajeros.reduce((sum, pasajero) => {
        return sum + parseFloat(pasajero.precioPantalla || 0) +
          parseFloat(pasajero.feeEmision || 0) +
          parseFloat(pasajero.feeAgencia || 0)
      }, 0)
    })
    return total
  }

  // Verificar si hay pasajeros configurados
  const tienePasajerosConfigurados = () => {
    return Object.values(pasajeros).some(categoria => categoria.length > 0)
  }

  const calcularCotizacion = async () => {
    // Determinar base según vista de cotización
    let base, precio, emision, agencia

    if (vistaCotizacion === 'individual') {
      // Vista individual: usar sistema legacy
      precio = parseFloat(precioBase) || 0
      emision = parseFloat(feeEmision) || 0
      agencia = parseFloat(feeAgencia) || 0
      base = precio + emision + agencia
    } else {
      // Vista múltiple: usar sistema de pasajeros
      base = calcularTotalPasajeros()
      precio = base // Para compatibilidad con el sistema existente
      emision = 0
      agencia = 0
    }

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

    // Resetear pasajeros
    setPasajeros({
      adultos: [],
      niños: [],
      infantes: []
    })
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

        {/* Tabs de Vista de Cotización */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            TIPO DE COTIZACIÓN
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cambiarVista('individual')}
              className={`py-2 px-4 rounded-lg font-bold text-sm transition-all border-2 ${vistaCotizacion === 'individual'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'
                }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              1 Pasajero
            </button>
            <button
              type="button"
              onClick={() => cambiarVista('multiple')}
              className={`py-2 px-4 rounded-lg font-bold text-sm transition-all border-2 ${vistaCotizacion === 'multiple'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'
                }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Múltiples Pasajeros
            </button>
          </div>
        </div>

        {/* Sección de Precios y Monedas (CONDICIONAL) */}
        <CollapsibleSection
          title="Precios y Monedas"
          icon={DollarSign}
          defaultExpanded={true}
        >
          {vistaCotizacion === 'individual' ? (
          // VISTA INDIVIDUAL - Sistema Legacy con selector de tipo de pasajero
            <div className="space-y-4">
              {/* Selector de Tipo de Pasajero Individual */}
              <div>
                <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                  Tipo de Pasajero
                </label>
                <select
                  value={tipoPasajeroIndividual}
                  onChange={(e) => setTipoPasajeroIndividual(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="adulto">Adulto</option>
                  <option value="niño">Niño</option>
                  <option value="infante">Infante</option>
                </select>
              </div>

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
                  {getMonedasCotizacion().map(moneda => (
                    <option key={moneda.value} value={moneda.value}>
                      {moneda.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Emisión */}
              <div>
                <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                  Fee de Emisión
                </label>
                <select
                  value={feeEmision === '15' ? 'normal' : feeEmision === '10' ? 'promo' : ''}
                  onChange={(e) => setFeeEmision(e.target.value === 'normal' ? '15' : '10')}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="normal">Fee Normal ($15)</option>
                  <option value="promo">Promo Stellar ($10)</option>
                </select>
              </div>

              {/* Fee Agencia */}
              <div>
                <label className="block text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2">
                  Fee de Agencia
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
          ) : (
            // VISTA MÚLTIPLE - Sistema de Pasajeros
            <div className="space-y-4">
              {/* Información de la vista múltiple */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-800">Modo Múltiples Pasajeros</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Configura cada pasajero individualmente con sus precios, fees y equipaje.
                  El total se calculará automáticamente sumando todos los pasajeros.
                </p>
              </div>

              {/* Componente de Pasajeros */}
              <PasajerosManager
                value={pasajeros}
                onChange={setPasajeros}
              />
              </div>
          )}
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
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Cotización en Euros (EUR) +10.5% recargo</p>
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

        {/* Sección de Pasajeros (SOLO para vista múltiple) */}
        {vistaCotizacion === 'multiple' && (() => {
          const monedasCotizacionData = getMonedasCotizacion()
          console.log('CotizadorForm - Pasando a PasajerosManager:', {
            monedaBaseSeleccionada,
            monedaCotizacionSeleccionada,
            monedasBase,
            monedasCotizacionData,
            loadingMonedas
          })
          return (
            <PasajerosManager
              value={pasajeros}
              onChange={setPasajeros}
              monedaPrecio={monedaBaseSeleccionada}
              monedaCotizacion={monedaCotizacionSeleccionada}
              monedasBase={monedasBase}
              monedasCotizacion={monedasCotizacionData}
              loadingMonedas={loadingMonedas}
            />
          )
        })()}

      </div>

      {/* Panel de Resultados */}
      <div className="space-y-6">
        <div className="sticky top-6 space-y-6">
          {/* Componente PDF (oculto visualmente, usado para generar la imagen) */}
          <PdfContent
            ref={pdfContentRef}
            agencia={agencia}
            vistaCotizacion={vistaCotizacion}
            tipoPasajeroIndividual={tipoPasajeroIndividual}
            origen={origen}
            destino={destino}
            idaVuelta={idaVuelta}
            soloIda={soloIda}
            finesMigratorios={finesMigratorios}
            fechaSalida={fechaSalida}
            horaSalida={horaSalida}
            horaLlegada={horaLlegada}
            aerolinea={aerolinea}
            fechaRegreso={fechaRegreso}
            horaSalidaRegreso={horaSalidaRegreso}
            horaLlegadaRegreso={horaLlegadaRegreso}
            fechaSalidaMigratorio={fechaSalidaMigratorio}
            horaSalidaMigratorio={horaSalidaMigratorio}
            horaLlegadaMigratorio={horaLlegadaMigratorio}
            haceEscala={haceEscala}
            ciudadEscala1={ciudadEscala1}
            tiempoEscala1={tiempoEscala1}
            haceSegundaEscala={haceSegundaEscala}
            ciudadEscala2={ciudadEscala2}
            tiempoEscala2={tiempoEscala2}
            pasajeros={pasajeros}
            tienePasajerosConfigurados={tienePasajerosConfigurados}
            calcularTotalPasajeros={calcularTotalPasajeros}
            precioBase={precioBase}
            feeEmision={feeEmision}
            feeAgencia={feeAgencia}
            equipajeCompleto={equipajeCompleto}
            equipajeMediano={equipajeMediano}
            equipajeLigero={equipajeLigero}
            monedaCotizacion={monedaCotizacionSeleccionada}
            metodoPago={metodoPago}
          />

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
