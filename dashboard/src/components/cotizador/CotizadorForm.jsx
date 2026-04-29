'use client'

// React y hooks
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Iconos
import { Calculator, DollarSign, Percent, CreditCard, TrendingUp, RefreshCw, Download, ArrowRightLeft, Plane, Calendar, MapPin, Luggage, Users, Save, CheckCircle, Eye, RotateCcw, X } from 'lucide-react'

// Librerías externas
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

// Supabase
import { supabase } from '@/lib/supabase'

// Componentes de sections (específicos del cotizador)
import CotizadorAgencySelector from './sections/CotizadorAgencySelector'
import CotizadorClientInput from './sections/CotizadorClientInput'
import CotizadorFormHeader from './sections/CotizadorFormHeader'
import CotizadorFlightType from './sections/CotizadorFlightType'
import CotizadorCurrencyConfig from './sections/CotizadorCurrencyConfig'
import CotizadorPaymentSelector from './sections/CotizadorPaymentSelector'
import CotizadorPasajerosSection from './sections/CotizadorPasajerosSection'
import CotizadorFlightDetails from './sections/CotizadorFlightDetails'
import CotizadorScales from './sections/CotizadorScales'

// Componentes existentes
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import PasajerosManager from './pasajeros/PasajerosManager'
import PdfContent from './resultados/PdfContent'
import BannerCotizacionGuardada from './BannerCotizacionGuardada'
import BannerEdicion from './BannerEdicion'
import AerolineaAutocomplete from './AerolineaAutocomplete'
import ResumenCotizacionSticky from './ResumenCotizacionSticky'

// Helpers
import { confirmAlert } from '@/helpers/sweetAlerts'
import { toastSuccess, toastError } from '@/helpers/toasts'

// Hooks
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useVueloInfo } from '@/hooks/cotizador/useVueloInfo'
import { useEscalas } from '@/hooks/cotizador/useEscalas'
import { useEquipaje } from '@/hooks/cotizador/useEquipaje'
import { useMonedas } from '@/hooks/cotizador/useMonedas'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// Servicios
import { calcularCotizacionIndividual } from '@/services/cotizador/cotizacionService'
import { exportarCotizacionPDF } from '@/services/cotizador/pdfService'

// Lógica de negocio
import { calcularConversionInteligente } from '@/lib/cotizador/conversorInteligente'
import {
  getMonedasCotizacion,
  getMonedasBase,
  getMonedaInfo,
  getSimboloMoneda
} from '@/lib/cotizador/monedasConfig'
import { obtenerMonedas, obtenerTasasConversion } from '@/lib/cotizador/tasasHelpers'
import { getThemeByAgency } from '@/lib/cotizador/agencyThemes'

// Configuración
import {
  AGENCY_CONFIG,
  PAYMENT_DATA,
  PAYMENT_DATA_ZELLE_APOLO,
  METHODS_BY_CURRENCY,
  ALL_PAYMENT_METHODS,
  getPaymentData
} from '@/lib/cotizador/paymentConfig'
import { COTIZACIONES_API } from '@/config/apiConfig'

/**
 * Componente principal del cotizador de vuelos
 * Soporta cotización individual y múltiple con conversión inteligente de monedas
 */
export default function CotizadorForm({ showBannerOutside = false, onBannerStateChange, onCotizacionGuardada }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { profile } = useUserProfile()

  // Modo edición
  const editId = searchParams?.get('edit')
  const isEditMode = !!editId
  const [loadingCotizacion, setLoadingCotizacion] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // ============================================
  // ESTADO - Configuración
  // ============================================
  const [metodoPago, setMetodoPago] = useState('')
  const [resultadoConversion, setResultadoConversion] = useState(null)

  // Hook: Monedas (8+ estados → 1)
  const {
    monedaBase: monedaBaseSeleccionada,
    monedaCotizacion: monedaCotizacionSeleccionada,
    tasaCambio,
    monedasDB,
    tasasDB: tasasDb,
    loading: loadingMonedas,
    setMonedaBase: setMonedaBaseSeleccionada,
    setMonedaCotizacion: setMonedaCotizacionSeleccionada,
    setTasaCambio
  } = useMonedas()

  const [total, setTotal] = useState(0)
  const [desglose, setDesglose] = useState(null)

  // Hook: Información del vuelo (9 estados → 1)
  const { vueloInfo, updateVueloInfo, resetVueloInfo } = useVueloInfo()

  // Estados para fines migratorios
  const [fechaSalidaMigratorio, setFechaSalidaMigratorio] = useState('')
  const [horaSalidaMigratorio, setHoraSalidaMigratorio] = useState('')
  const [horaLlegadaMigratorio, setHoraLlegadaMigratorio] = useState('')

  const [fechaRegreso, setFechaRegreso] = useState('')
  const [horaSalidaRegreso, setHoraSalidaRegreso] = useState('')
  const [horaLlegadaRegreso, setHoraLlegadaRegreso] = useState('')
  const [aerolinea, setAerolinea] = useState('')
  const [aerolineaCodigo, setAerolineaCodigo] = useState('')
  const [agencia, setAgencia] = useState(null) // 'nova', 'colombia', 'apolo'

  // Hook: Escalas (6 estados → 1)
  const { escalas, agregarEscala, actualizarEscala, eliminarEscala, resetEscalas, tieneEscalas } = useEscalas(2)

  // Hook: Equipaje (3 estados → 1)
  const { equipajeSeleccionado, toggleEquipaje, tieneEquipaje, resetEquipaje } = useEquipaje()

  // Estado para pasajeros (nueva funcionalidad)
  const [pasajeros, setPasajeros] = useState({
    adultos: [],
    niños: [],
    infantes: []
  })

  const [nombreCliente, setNombreCliente] = useState('')
  const [savingCotizacion, setSavingCotizacion] = useState(false)
  const [cotizacionGuardada, setCotizacionGuardada] = useState(false)
  const [ultimaCotizacionId, setUltimaCotizacionId] = useState(null)
  const [cotizacionEnEdicion, setCotizacionEnEdicion] = useState(null)

  const [exportingPdf, setExportingPdf] = useState(false)
  const pdfContentRef = useRef(null)

  // localStorage para autoguardado diferenciado por usuario
  const draftKey = useMemo(() => {
    const userName = profile?.full_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'
    return `cotizador_draft_${userName}`
  }, [profile])

  const [cotizadorDraft, setCotizadorDraft, removeCotizadorDraft] = useLocalStorage(draftKey, null)
  const [draftLoaded, setDraftLoaded] = useState(false)

  // Detectar draft al cargar componente — SOLO si NO está en modo edición
  useEffect(() => {
    if (isEditMode) {
      // En modo edición, NO usar draft (se cargan datos de la cotización existente)
      setDraftLoaded(true)
      return
    }

    if (cotizadorDraft && !draftLoaded) {
      confirmAlert(
        '¿Recuperar cotización guardada?',
        'Tienes una cotización sin terminar. ¿Deseas recuperarla?',
        'question',
        {
          confirmButtonText: 'Sí, recuperar',
          cancelButtonText: 'No, empezar nueva',
          showCancelButton: true
        }
      ).then((result) => {
        if (result.isConfirmed) {
          recuperarDraft()
          toastSuccess('Cotización recuperada exitosamente')
        } else {
          removeCotizadorDraft()
        }
        setDraftLoaded(true)
      })
    } else {
      setDraftLoaded(true)
    }
  }, [])

  // Autoguardar en localStorage cada vez que cambien los datos
  useEffect(() => {
    if (!draftLoaded) return // No guardar hasta que se resuelva el draft inicial
    if (isEditMode) return // NO guardar draft si está editando una cotización existente

    const draft = {
      vueloInfo,
      fechaSalidaMigratorio,
      horaSalidaMigratorio,
      horaLlegadaMigratorio,
      fechaRegreso,
      horaSalidaRegreso,
      horaLlegadaRegreso,
      aerolinea,
      aerolineaCodigo,
      agencia,
      escalas,
      equipajeSeleccionado,
      pasajeros,
      nombreCliente,
      monedaBaseSeleccionada,
      monedaCotizacionSeleccionada,
      metodoPago: metodoPago,
      timestamp: new Date().toISOString()
    }

    // Solo guardar si hay algún dato relevante
    const tieneAlgunDato =
      vueloInfo.origen ||
      vueloInfo.destino ||
      nombreCliente ||
      pasajeros.adultos.length > 0 ||
      pasajeros.niños.length > 0

    if (tieneAlgunDato) {
      setCotizadorDraft(draft)
    }
  }, [
    vueloInfo,
    fechaSalidaMigratorio,
    horaSalidaMigratorio,
    horaLlegadaMigratorio,
    fechaRegreso,
    horaSalidaRegreso,
    horaLlegadaRegreso,
    aerolinea,
    agencia,
    escalas,
    equipajeSeleccionado,
    pasajeros,
    nombreCliente,
    monedaBaseSeleccionada,
    monedaCotizacionSeleccionada,
    metodoPago,
    draftLoaded
  ])

  const recuperarDraft = () => {
    if (!cotizadorDraft) return

    // Recuperar información del vuelo
    Object.keys(cotizadorDraft.vueloInfo || {}).forEach(key => {
      updateVueloInfo(key, cotizadorDraft.vueloInfo[key])
    })

    // Recuperar campos adicionales
    setFechaSalidaMigratorio(cotizadorDraft.fechaSalidaMigratorio || '')
    setHoraSalidaMigratorio(cotizadorDraft.horaSalidaMigratorio || '')
    setHoraLlegadaMigratorio(cotizadorDraft.horaLlegadaMigratorio || '')
    setFechaRegreso(cotizadorDraft.fechaRegreso || '')
    setHoraSalidaRegreso(cotizadorDraft.horaSalidaRegreso || '')
    setHoraLlegadaRegreso(cotizadorDraft.horaLlegadaRegreso || '')
    setAerolinea(cotizadorDraft.aerolinea || '')
    setAerolineaCodigo(cotizadorDraft.aerolineaCodigo || '')
    setAgencia(cotizadorDraft.agencia || null)
    setNombreCliente(cotizadorDraft.nombreCliente || '')
    setPasajeros(cotizadorDraft.pasajeros || { adultos: [], niños: [], infantes: [] })
    setMonedaBaseSeleccionada(cotizadorDraft.monedaBaseSeleccionada || 'USD')
    setMonedaCotizacionSeleccionada(cotizadorDraft.monedaCotizacionSeleccionada || '')
    setMetodoPago(cotizadorDraft.metodoPago || '')
  }

  // Función para reset completo del formulario
  const limpiarFormularioCompleto = () => {
    // Resetear todos los estados
    setMetodoPago('')
    setResultadoConversion(null)
    setMonedaBaseSeleccionada('USD')
    setMonedaCotizacionSeleccionada('')
    setTotal(0)
    setDesglose(null)
    updateVueloInfo('fechaSalida', '')
    updateVueloInfo('horaSalida', '')
    updateVueloInfo('horaLlegada', '')
    updateVueloInfo('origen', '')
    updateVueloInfo('destino', '')
    updateVueloInfo('idaVuelta', false)
    updateVueloInfo('finesMigratorios', false)
    updateVueloInfo('soloIda', false)
    setFechaSalidaMigratorio('')
    setHoraSalidaMigratorio('')
    setHoraLlegadaMigratorio('')
    setFechaRegreso('')
    setHoraSalidaRegreso('')
    setHoraLlegadaRegreso('')
    setAerolinea('')
    setAerolineaCodigo('')
    setAgencia(null)
    resetEscalas()
    resetEquipaje()
    setPasajeros({
      adultos: [],
      niños: [],
      infantes: []
    })
    setCotizacionGuardada(false)
    setUltimaCotizacionId(null)
    setNombreCliente('')

    // Limpiar draft de localStorage
    removeCotizadorDraft()
  }

  // Función de limpiar con confirmación
  const handleLimpiar = async () => {
    const result = await confirmAlert(
      '¿Limpiar formulario?',
      'Se perderán todos los datos ingresados. Esta acción no se puede deshacer.',
      'warning',
      {
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar',
        showCancelButton: true
      }
    )

    if (result.isConfirmed) {
      limpiarFormularioCompleto()
      toastSuccess('Formulario limpiado exitosamente')
    }
  }

  const metodosPago = ALL_PAYMENT_METHODS
  const metodosPorMoneda = METHODS_BY_CURRENCY

  // Usar funciones centralizadas de monedasConfig
  const monedasBase = getMonedasBase()

  // Opciones para moneda de cotización (solo monedas que tengan tasas creadas en DB)
  const getMonedasConTasas = () => {
    if (!tasasDb || Object.keys(tasasDb).length === 0) {
      return getMonedasCotizacion()
    }

    // Extraer TODAS las monedas que aparecen en tasasDB (como origen o destino)
    const monedasConTasas = new Set()

    // tasasDb tiene estructura: { monedaOrigen: { monedaDestino: tasa } }
    Object.keys(tasasDb).forEach(monedaOrigen => {
      monedasConTasas.add(monedaOrigen)

      const destinosObj = tasasDb[monedaOrigen]
      if (destinosObj && typeof destinosObj === 'object') {
        Object.keys(destinosObj).forEach(monedaDestino => {
          monedasConTasas.add(monedaDestino)
        })
      }
    })

    // Filtrar solo las monedas que existen en tasasDB
    return getMonedasCotizacion().filter(moneda =>
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

  // NOTA: useMonedas ya carga las tasas automáticamente al iniciar

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
      setMonedaCotizacionSeleccionada('')
      return
    }

    const monedaDetectada = detectarMonedaPorMetodo(metodoPago)
    if (monedaDetectada) {
      // Si es FLEXIBLE, no establecer moneda automáticamente
      if (monedaDetectada === 'FLEXIBLE') {
        setMonedaCotizacionSeleccionada('') // Dejar vacío para selección manual
        setTasaCambio('') // No establecer tasa hasta que se seleccione moneda
        return
      }

      setMonedaCotizacionSeleccionada(monedaDetectada)

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

  /**
   * Actualizar tasa de cambio para VES
   * Busca la tasa de conversión desde la moneda base (USD/EUR) hacia VES
   */
  const actualizarTasaParaVES = () => {
    if (!monedaBaseSeleccionada || !monedaCotizacionSeleccionada) {
      setTasaCambio('1.0')
      return
    }

    // Buscar tasa directa: base → cotización
    let tasa = tasasDb[monedaBaseSeleccionada]?.[monedaCotizacionSeleccionada]

    // Si no existe, buscar tasa inversa: cotización → base
    if (!tasa && tasasDb[monedaCotizacionSeleccionada]?.[monedaBaseSeleccionada]) {
      tasa = 1.0 / tasasDb[monedaCotizacionSeleccionada][monedaBaseSeleccionada]
    }

    setTasaCambio(tasa ? String(tasa) : '1.0')
    console.log(`Tasa ${monedaBaseSeleccionada} → ${monedaCotizacionSeleccionada}:`, tasa || '1.0')
  }

  // Actualizar tasa cuando cambia la moneda base o cotización (solo para VES)
  useEffect(() => {
    if (monedaCotizacionSeleccionada === 'VES' && monedaBaseSeleccionada) {
      actualizarTasaParaVES()
    }
  }, [monedaBaseSeleccionada, monedaCotizacionSeleccionada, tasasDb])

  // Actualizar tasa cuando se cambia la moneda de cotización (solo para no VES)
  useEffect(() => {
    if (monedaCotizacionSeleccionada && monedaCotizacionSeleccionada !== 'VES') {
      // Para monedas que no son VES, la tasa es siempre 1.0
      setTasaCambio('1.0')
    }
  }, [monedaCotizacionSeleccionada])

  // Cargar cotización en modo edición
  useEffect(() => {
    if (isEditMode && editId && !loadingCotizacion) {
      cargarCotizacionParaEditar(editId)
    }
  }, [isEditMode, editId])

  const cargarCotizacionParaEditar = async (cotizacionId) => {
    try {
      setLoadingCotizacion(true)

      const { data, error } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          pasajeros:cotizaciones_pasajeros(*)
        `)
        .eq('id', cotizacionId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Cotización no encontrada')

      // Guardar cotización para mostrar en banner
      setCotizacionEnEdicion(data)

      // Cargar datos en el formulario
      setNombreCliente(data.nombre_cliente || '')
      setMetodoPago(data.metodo_pago || '')
      updateVueloInfo('origen', data.origen || '')
      updateVueloInfo('destino', data.destino || '')
      updateVueloInfo('aerolinea', data.aerolinea || '')
      updateVueloInfo('fechaSalida', data.fecha_salida || '')

      // Mapear tipo_vuelo a los botones correspondientes
      const tipoVuelo = data.tipo_vuelo || 'solo_ida'
      updateVueloInfo('idaVuelta', tipoVuelo === 'ida_vuelta')
      updateVueloInfo('soloIda', tipoVuelo === 'solo_ida')
      updateVueloInfo('finesMigratorios', tipoVuelo === 'migratorio')

      // Cargar campos de vuelo de vuelta si es ida_vuelta
      if (tipoVuelo === 'ida_vuelta') {
        setFechaRegreso(data.fecha_regreso || '')
        setHoraSalidaRegreso(data.hora_salida_regreso || '')
        setHoraLlegadaRegreso(data.hora_llegada_regreso || '')
      }

      // Cargar horas de salida/llegada (ida o migratorio)
      updateVueloInfo('horaSalida', data.hora_salida || '')
      updateVueloInfo('horaLlegada', data.hora_llegada || '')

      setMonedaBaseSeleccionada(data.moneda_precio || 'USD')
      setMonedaCotizacionSeleccionada(data.moneda_cotizacion || 'USD')

      // Cargar pasajeros con TODOS sus datos
      if (data.pasajeros && data.pasajeros.length > 0) {
        const mapearPasajero = (p) => ({
          precioPantalla: p.precio_pantalla?.toString() || '',
          feeEmision: p.fee_emision?.toString() || '',
          feeAgencia: p.fee_agencia?.toString() || '',
          equipajeCompleto: p.equipaje_completo || false,
          equipajeMediano: p.equipaje_mediano || false,
          equipajeLigero: p.equipaje_ligero || false
        })

        const pasajerosPorTipo = {
          adultos: data.pasajeros
            .filter(p => p.tipo === 'ADULTO')
            .sort((a, b) => a.orden - b.orden)
            .map(mapearPasajero),
          niños: data.pasajeros
            .filter(p => p.tipo === 'NIÑO')
            .sort((a, b) => a.orden - b.orden)
            .map(mapearPasajero),
          infantes: data.pasajeros
            .filter(p => p.tipo === 'INFANTE')
            .sort((a, b) => a.orden - b.orden)
            .map(mapearPasajero)
        }
        setPasajeros(pasajerosPorTipo)
      }

      // Cargar equipaje general si existe
      if (data.equipaje_completo || data.equipaje_mediano || data.equipaje_ligero) {
        if (data.equipaje_completo) toggleEquipaje('completo')
        if (data.equipaje_mediano) toggleEquipaje('mediano')
        if (data.equipaje_ligero) toggleEquipaje('ligero')
      }

      // Cargar escalas si existen
      if (data.escala_1_ciudad) {
        updateEscala(0, {
          ciudad: data.escala_1_ciudad,
          duracion: data.escala_1_duracion || ''
        })
      }
      if (data.escala_2_ciudad) {
        updateEscala(1, {
          ciudad: data.escala_2_ciudad,
          duracion: data.escala_2_duracion || ''
        })
      }

      toastSuccess('Cotización cargada para editar')
    } catch (error) {
      console.error('Error cargando cotización:', error)
      toastError('Error al cargar la cotización')
      router.push('/cotizador')
    } finally {
      setLoadingCotizacion(false)
    }
  }

  // ============================================
  // FUNCIONES DE CÁLCULO (deben estar ANTES de los useEffect que las usan)
  // ============================================

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
    // Usar sistema de pasajeros (vista única)
    const base = calcularTotalPasajeros()
    const precio = base
    const emision = 0
    const agencia = 0

    try {
      // Usar sistema inteligente de conversión
      const resultado = await calcularConversionInteligente({
        base,
        monedaBase: monedaBaseSeleccionada,
        monedaCotizacion: monedaCotizacionSeleccionada,
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

    } catch (error) {
      console.error('Error en cálculo inteligente:', error)

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

  // ============================================
  // EFFECTS
  // ============================================

  // Recalcular cuando cambian los inputs (con debounce para evitar demasiadas llamadas)
  useEffect(() => {
    // Requiere al menos 1 pasajero configurado
    const debeCalcular = tienePasajerosConfigurados() && monedaBaseSeleccionada && monedaCotizacionSeleccionada

    if (debeCalcular) {
      setIsCalculating(true)
      const timeoutId = setTimeout(() => {
        const calcular = async () => {
          try {
            await calcularCotizacion()
          } catch (error) {
            console.error('Error en cálculo automático:', error)
          } finally {
            setIsCalculating(false)
          }
        }
        calcular()
      }, 300) // 300ms de debounce

      return () => {
        clearTimeout(timeoutId)
        setIsCalculating(false)
      }
    } else {
      setIsCalculating(false)
    }
  }, [pasajeros, monedaBaseSeleccionada, monedaCotizacionSeleccionada, metodoPago])

  // ============================================
  // VARIABLES DERIVADAS
  // ============================================

  const simboloMoneda = getSimboloMoneda(monedaCotizacionSeleccionada)
  const monedaSeleccionada = getMonedasCotizacion().find(m => m.value === monedaCotizacionSeleccionada)

  // Tema dinámico según agencia
  const theme = getThemeByAgency(agencia)

  const formatearMonto = (valor) => {
    if (!valor && valor !== 0) return '0.00'
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor)
  }

  const limpiarDetallesVuelo = () => {
    resetVueloInfo()
    resetEscalas()
    setFechaRegreso('')
    setHoraSalidaRegreso('')
    setHoraLlegadaRegreso('')
    setFechaSalidaMigratorio('')
    setHoraSalidaMigratorio('')
    setHoraLlegadaMigratorio('')
    setAerolinea('')
  }

  const handleGuardarCotizacion = async () => {
    // Validaciones
    if (!nombreCliente.trim()) {
      toastError('Ingresa el nombre del cliente')
      return
    }
    if (!vueloInfo.origen || !vueloInfo.destino) {
      toastError('Ingresa origen y destino del vuelo')
      return
    }
    if (!desglose) {
      toastError('Primero calcula la cotización antes de guardarla')
      return
    }

    // Determinar tipo de vuelo
    let tipoVuelo = 'solo_ida'
    if (vueloInfo.idaVuelta) tipoVuelo = 'ida_vuelta'
    else if (vueloInfo.finesMigratorios) tipoVuelo = 'migratorio'

    // Determinar fecha de salida según tipo de vuelo
    const fechaSalidaFinal = vueloInfo.finesMigratorios
      ? fechaSalidaMigratorio
      : vueloInfo.fechaSalida

    const horaSalidaFinal = vueloInfo.finesMigratorios
      ? horaSalidaMigratorio
      : vueloInfo.horaSalida

    const horaLlegadaFinal = vueloInfo.finesMigratorios
      ? horaLlegadaMigratorio
      : vueloInfo.horaLlegada

    if (!fechaSalidaFinal) {
      toastError('Ingresa la fecha de salida del vuelo')
      return
    }

    // Validación: si es ida y vuelta, fecha_regreso es requerida
    if (vueloInfo.idaVuelta && !fechaRegreso) {
      toastError('Para vuelos de ida y vuelta, la fecha de regreso es requerida')
      return
    }

    try {
      setSavingCotizacion(true)

      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toastError('Error de autenticación. Inicia sesión nuevamente.')
        return
      }

      // Construir objeto de cotización
      const cotizacionData = {
        created_by: user.id,
        nombre_cliente: nombreCliente.trim(),
        tipo_vuelo: tipoVuelo,
        origen: vueloInfo.origen,
        destino: vueloInfo.destino,
        aerolinea: aerolinea || null,
        aereolinea_codigo: aerolineaCodigo || null,
        fecha_salida: fechaSalidaFinal,
        hora_salida: horaSalidaFinal || null,
        hora_llegada: horaLlegadaFinal || null,
        fecha_regreso: vueloInfo.idaVuelta ? fechaRegreso : null,
        hora_salida_regreso: vueloInfo.idaVuelta ? horaSalidaRegreso : null,
        hora_llegada_regreso: vueloInfo.idaVuelta ? horaLlegadaRegreso : null,
        tiene_escala: escalas.length > 0,
        escala_1_ciudad: escalas[0]?.ciudad || null,
        escala_1_duracion: escalas[0]?.duracion || null,
        tiene_segunda_escala: escalas.length > 1,
        escala_2_ciudad: escalas[1]?.ciudad || null,
        escala_2_duracion: escalas[1]?.duracion || null,
        precio_base: calcularTotalPasajeros(),
        fee_emision: 0,
        fee_agencia: 0,
        total_cotizacion: calcularTotalPasajeros(),
        moneda_precio: monedaBaseSeleccionada,
        moneda_cotizacion: monedaCotizacionSeleccionada,
        precio_final_cotizacion: total,
        tasa_cambio: parseFloat(tasaCambio) || 1,
        metodo_pago: metodoPago || null
      }

      // Validar que haya al menos 1 pasajero
      if (!tienePasajerosConfigurados()) {
        toastError('Debes agregar al menos un pasajero antes de guardar la cotización')
        setSavingCotizacion(false)
        return
      }

      // Construir pasajeros
      const pasajerosData = []
      Object.entries(pasajeros).forEach(([categoriaKey, categoriaPasajeros]) => {
        const tipoMap = { adultos: 'ADULTO', niños: 'NINO', infantes: 'INFANTE' }
        categoriaPasajeros.forEach((p, index) => {
          pasajerosData.push({
            tipo: tipoMap[categoriaKey],
            orden: index + 1,
            precio_pantalla: parseFloat(p.precioPantalla) || 0,
            fee_emision: parseFloat(p.feeEmision) || 0,
            fee_agencia: parseFloat(p.feeAgencia) || 0,
            equipaje_completo: p.equipajeCompleto || false,
            equipaje_mediano: p.equipajeMediano || false,
            equipaje_ligero: p.equipajeLigero || false
          })
        })
      })

      // Enviar a backend (PUT si es edición, POST si es creación)
      const url = isEditMode ? COTIZACIONES_API.actualizar(editId) : COTIZACIONES_API.crear
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cotizacion: cotizacionData,
          pasajeros: pasajerosData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error al ${isEditMode ? 'actualizar' : 'guardar'} la cotización`)
      }

      toastSuccess(isEditMode ? 'Cotización actualizada exitosamente' : 'Cotización guardada exitosamente')
      console.log(`✅ Cotización ${isEditMode ? 'actualizada' : 'guardada'}:`, result.data)

      if (isEditMode) {
        // En modo edición, redirigir a vista de cotizaciones
        router.push('/ventas/cotizaciones')
      } else {
        // En modo creación, activar banner
        setCotizacionGuardada(true)
        setUltimaCotizacionId(result.data.id)

        // Limpiar draft del localStorage ya que se guardó exitosamente
        localStorage.removeItem(draftKey)

        // Notificar al componente padre con datos completos
        if (onCotizacionGuardada) {
          onCotizacionGuardada({
            id: result.data.id,
            nombreCliente: nombreCliente.trim(),
            createdAt: new Date().toISOString()
          })
        }
      }

    } catch (error) {
      console.error('Error guardando cotización:', error)
      toastError(error.message || 'Error al guardar la cotización')
    } finally {
      setSavingCotizacion(false)
    }
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
      await exportarCotizacionPDF(pdfContentRef.current, {
        origen: vueloInfo.origen,
        destino: vueloInfo.destino
      })
    } catch (error) {
      console.error('Error exportando PDF de cotización:', error)
      alert('Ocurrió un error al generar el PDF. Intenta nuevamente.')
    } finally {
      setExportingPdf(false)
    }
  }

  const handleCancelarEdicion = () => {
    router.push('/ventas/cotizaciones')
  }

  return (
    <>
      {/* Banner de Edición */}
      {isEditMode && cotizacionEnEdicion && (
        <BannerEdicion
          cotizacion={cotizacionEnEdicion}
          onCancel={handleCancelarEdicion}
        />
      )}

      {/* Indicador de Cálculo Activo */}
      {isCalculating && (
        <div className={`fixed bottom-6 right-6 bg-gradient-to-r ${theme.gradient} text-white px-5 py-3 rounded-full shadow-2xl animate-pulse z-50 flex items-center gap-3`}>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-sm">Calculando...</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 max-w-7xl mx-auto relative">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 transition-all duration-300">

          {/* ========== HEADER DEL FORMULARIO ========== */}
          <CotizadorFormHeader
            onLimpiar={handleLimpiar}
            theme={theme}
          />

          {/* ========== CONFIGURACIÓN INICIAL ========== */}
        {/* Selector de Agencia */}
          <CotizadorAgencySelector
            agencia={agencia}
            onChange={setAgencia}
            theme={theme}
          />

        {/* Nombre del Cliente */}
          <CotizadorClientInput
            value={nombreCliente}
            onChange={setNombreCliente}
            theme={theme}
          />

        {/* Banner de cotización guardada - solo mostrar aquí si no está afuera */}
        {!showBannerOutside && (
          <BannerCotizacionGuardada
            isVisible={cotizacionGuardada}
            onClose={() => setCotizacionGuardada(false)}
            onNuevaCotizacion={limpiarFormularioCompleto}
          />
        )}

          {/* ========== DETALLES DEL VUELO ========== */}
          {/* Sección de Tipo de Vuelo */}
          <CotizadorFlightType
            vueloInfo={vueloInfo}
            updateVueloInfo={updateVueloInfo}
            limpiarDetallesVuelo={limpiarDetallesVuelo}
            theme={theme}
          />

          {/* ========== CONFIGURACIÓN FINANCIERA ========== */}
          {/* Sección de Configuración de Monedas */}
          <CotizadorCurrencyConfig
            monedaBaseSeleccionada={monedaBaseSeleccionada}
            monedaCotizacionSeleccionada={monedaCotizacionSeleccionada}
            tasaCambio={tasaCambio}
            setMonedaBaseSeleccionada={setMonedaBaseSeleccionada}
            setMonedaCotizacionSeleccionada={setMonedaCotizacionSeleccionada}
            monedasBase={monedasBase}
            getMonedasConTasas={getMonedasConTasas}
            loadingMonedas={loadingMonedas}
            theme={theme}
          />

          {/* ========== PASAJEROS ========== */}
          <CotizadorPasajerosSection
            pasajeros={pasajeros}
            setPasajeros={setPasajeros}
            monedaPrecio={monedaBaseSeleccionada}
            monedaCotizacion={monedaCotizacionSeleccionada}
            aerolinea={aerolinea}
          />

          {/* Sección de Método de Pago */}
          <CotizadorPaymentSelector
            metodoPago={metodoPago}
            monedaCotizacionSeleccionada={monedaCotizacionSeleccionada}
            metodosPagoFiltrados={metodosPagoFiltrados}
            setMetodoPago={setMetodoPago}
            theme={theme}
          />

          {/* ========== DETALLES DEL VUELO (FECHAS Y HORAS) ========== */}
          <CotizadorFlightDetails
            vueloInfo={vueloInfo}
            updateVueloInfo={updateVueloInfo}
            aerolinea={aerolinea}
            setAerolinea={setAerolinea}
            setAerolineaCodigo={setAerolineaCodigo}
            fechaSalidaMigratorio={fechaSalidaMigratorio}
            setFechaSalidaMigratorio={setFechaSalidaMigratorio}
            horaSalidaMigratorio={horaSalidaMigratorio}
            setHoraSalidaMigratorio={setHoraSalidaMigratorio}
            horaLlegadaMigratorio={horaLlegadaMigratorio}
            setHoraLlegadaMigratorio={setHoraLlegadaMigratorio}
            fechaRegreso={fechaRegreso}
            setFechaRegreso={setFechaRegreso}
            horaSalidaRegreso={horaSalidaRegreso}
            setHoraSalidaRegreso={setHoraSalidaRegreso}
            horaLlegadaRegreso={horaLlegadaRegreso}
            setHoraLlegadaRegreso={setHoraLlegadaRegreso}
            theme={theme}
          />
          {/* ========== ESCALAS ========== */}
          <CotizadorScales
            escalas={escalas}
            agregarEscala={agregarEscala}
            eliminarEscala={eliminarEscala}
            actualizarEscala={actualizarEscala}
          />
          {/* Equipaje ahora es por pasajero en PasajerosManager */}
      </div>

      {/* Panel de Resultados */}
        <div>
          {/* Componente PDF (oculto visualmente, usado para generar la imagen) */}
          <div className="absolute -left-[9999px] top-0">
          <PdfContent
            ref={pdfContentRef}
            agencia={agencia}
            origen={vueloInfo.origen}
            destino={vueloInfo.destino}
            idaVuelta={vueloInfo.idaVuelta}
            soloIda={vueloInfo.soloIda}
            finesMigratorios={vueloInfo.finesMigratorios}
            fechaSalida={vueloInfo.fechaSalida}
            horaSalida={vueloInfo.horaSalida}
            horaLlegada={vueloInfo.horaLlegada}
            aerolinea={aerolinea}
            fechaRegreso={fechaRegreso}
            horaSalidaRegreso={horaSalidaRegreso}
            horaLlegadaRegreso={horaLlegadaRegreso}
            fechaSalidaMigratorio={fechaSalidaMigratorio}
            horaSalidaMigratorio={horaSalidaMigratorio}
            horaLlegadaMigratorio={horaLlegadaMigratorio}
            escalas={escalas}
            pasajeros={pasajeros}
            tienePasajerosConfigurados={tienePasajerosConfigurados}
            calcularTotalPasajeros={calcularTotalPasajeros}
            monedaCotizacion={monedaCotizacionSeleccionada}
            metodoPago={metodoPago}
            total={total}
            desglose={desglose}
            simboloMoneda={simboloMoneda}
            />
          </div>

          {/* Nuevo Componente de Resumen Sticky */}
          <ResumenCotizacionSticky
            total={total}
            simboloMoneda={simboloMoneda}
            monedaCotizacion={monedaCotizacionSeleccionada}
            monedaBase={monedaBaseSeleccionada}
            tasaCambio={tasaCambio}
            pasajeros={pasajeros}
            desglose={desglose}
            tienePasajerosConfigurados={tienePasajerosConfigurados}
            calcularTotalPasajeros={calcularTotalPasajeros}
            onExportar={handleExportarPdf}
            onGuardar={handleGuardarCotizacion}
            exportingPdf={exportingPdf}
            savingCotizacion={savingCotizacion}
            formatearMonto={formatearMonto}
            theme={theme}
          />
        </div>
      </div>
    </>
  )
}
