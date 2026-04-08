'use client'
// React
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Librerías externas
import { Calculator, DollarSign, Percent, CreditCard, TrendingUp, RefreshCw, Download, ArrowRightLeft, Plane, Calendar, MapPin, Luggage, Users, Save, CheckCircle, Eye, RotateCcw, X } from 'lucide-react'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

// Supabase
import { supabase } from '@/lib/supabase'

// Componentes
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import PasajerosManager from './pasajeros/PasajerosManager'
import PdfContent from './resultados/PdfContent'
import BannerCotizacionGuardada from './BannerCotizacionGuardada'
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
export default function CotizadorForm({ isAuthenticated = false, showBannerOutside = false, onBannerStateChange, onCotizacionGuardada }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Obtener perfil del usuario (si está autenticado)
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

  const [exportingPdf, setExportingPdf] = useState(false)
  const pdfContentRef = useRef(null)

  // localStorage para autoguardado diferenciado por usuario
  // Clave: cotizador_draft_{full_name} o cotizador_draft_public si no está autenticado
  // NOTA: Este cálculo debe esperar a que profile esté disponible
  const draftKey = useMemo(() => {
    if (!isAuthenticated || !profile) return 'cotizador_draft_public'
    const userName = profile?.full_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'
    return `cotizador_draft_${userName}`
  }, [isAuthenticated, profile])

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

        // Notificar al componente padre si está configurado
        if (onCotizacionGuardada) {
          onCotizacionGuardada()
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

  return (
    <>
      {/* Indicador de Cálculo Activo */}
      {isCalculating && (
        <div className={`fixed bottom-6 right-6 bg-gradient-to-r ${theme.gradient} text-white px-5 py-3 rounded-full shadow-2xl animate-pulse z-50 flex items-center gap-3`}>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-sm">Calculando...</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 max-w-7xl mx-auto relative">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 transition-all duration-300">
        {/* Selector de Agencia */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            AGENCIA
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
                { id: 'nova', label: 'NOVA', theme: getThemeByAgency('nova') },
                { id: 'colombia', label: 'NOVA COLOMBIA', theme: getThemeByAgency('colombia') },
                { id: 'apolo', label: 'APOLO', theme: getThemeByAgency('apolo') }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAgencia(opt.id)}
                className={`py-1.5 px-1 rounded-lg font-bold text-[9px] transition-all duration-200 border-2 ${agencia === opt.id
                  ? `bg-${opt.theme.primary} border-${opt.theme.primary} text-white shadow-sm scale-105`
                  : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:shadow-sm hover:scale-102'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre del Cliente */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            NOMBRE DEL CLIENTE
          </label>
          <input
            type="text"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            placeholder="Ej: Sabrina Burgos"
              className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${theme.accent} focus:border-transparent transition-all duration-200 hover:border-slate-400`}
          />
        </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-1">
                <div className={`p-2 bg-${theme.primaryLight} rounded-lg`}>
                  <Calculator className={`w-6 h-6 text-${theme.primary}`} />
                </div>
                Calculadora de Cotizaciones
              </h2>
              <p className="text-sm text-slate-500 ml-14">Configura los detalles del vuelo y pasajeros</p>
            </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLimpiar}
                className="px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm hover:scale-105 active:scale-95"
              title="Limpiar formulario"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Banner de cotización guardada - solo mostrar aquí si no está afuera */}
        {!showBannerOutside && (
          <BannerCotizacionGuardada
            isVisible={cotizacionGuardada}
            onClose={() => setCotizacionGuardada(false)}
            onNuevaCotizacion={limpiarFormularioCompleto}
          />
        )}

          {/* Sección de Tipo de Vuelo */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Plane className={`w-4 h-4 text-${theme.primary}`} />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tipo de Vuelo
              </label>
          </div>
            <div className="grid grid-cols-3 gap-3 p-1.5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => {
                const newValue = !vueloInfo.idaVuelta
                if (newValue) {
                  updateVueloInfo('finesMigratorios', false)
                  updateVueloInfo('soloIda', false)
                  limpiarDetallesVuelo()
                } else {
                  limpiarDetallesVuelo()
                }
                updateVueloInfo('idaVuelta', newValue)
              }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.idaVuelta
                  ? `bg-${theme.primary} text-white shadow-md scale-105`
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${vueloInfo.idaVuelta ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              IDA Y VUELTA
            </button>
            <button
              type="button"
              onClick={() => {
                const newValue = !vueloInfo.soloIda
                if (newValue) {
                  updateVueloInfo('idaVuelta', false)
                  updateVueloInfo('finesMigratorios', false)
                  limpiarDetallesVuelo()
                } else {
                  limpiarDetallesVuelo()
                }
                updateVueloInfo('soloIda', newValue)
              }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.soloIda
                  ? `bg-${theme.primary} text-white shadow-md scale-105`
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${vueloInfo.soloIda ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              SOLO IDA
            </button>
            <button
              type="button"
              onClick={() => {
                const newValue = !vueloInfo.finesMigratorios
                if (newValue) {
                  updateVueloInfo('idaVuelta', false)
                  updateVueloInfo('soloIda', false)
                  limpiarDetallesVuelo()
                } else {
                  limpiarDetallesVuelo()
                }
                updateVueloInfo('finesMigratorios', newValue)
              }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.finesMigratorios
                  ? `bg-${theme.secondary} text-white shadow-md scale-105`
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${vueloInfo.finesMigratorios ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              FINES MIGRATORIOS
            </button>
          </div>

            <div className="grid grid-cols-2 gap-4 mt-5">
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <MapPin className={`w-3.5 h-3.5 text-${theme.primary}`} />
                Origen
              </label>
              <input
                type="text"
                value={vueloInfo.origen}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase()
                    updateVueloInfo('origen', value)
                  }}
                placeholder="Ej: CCS"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 placeholder:text-slate-400 uppercase"
                  maxLength={50}
              />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <MapPin className={`w-3.5 h-3.5 text-${theme.primary}`} />
                Destino
              </label>
              <input
                type="text"
                value={vueloInfo.destino}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase()
                    updateVueloInfo('destino', value)
                  }}
                placeholder="Ej: MAD"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 placeholder:text-slate-400 uppercase"
                  maxLength={50}
                />
              </div>
            </div>
          </div>

          {/* Sección de Configuración de Monedas */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className={`w-4 h-4 text-${theme.primary}`} />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Configuración de Monedas
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Moneda Base
                </label>
                <div className="relative">
                  <select
                    value={monedaBaseSeleccionada}
                    onChange={(e) => setMonedaBaseSeleccionada(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer"
                    disabled={loadingMonedas}
                  >
                    {monedasBase.map((moneda) => (
                      <option key={moneda.value} value={moneda.value}>
                        {moneda.label}
                      </option>
                    ))}
                  </select>
                  <ArrowRightLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Moneda Cotización
                </label>
                <div className="relative">
                  <select
                    value={monedaCotizacionSeleccionada}
                    onChange={(e) => setMonedaCotizacionSeleccionada(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer"
                    disabled={loadingMonedas}
                  >
                    <option value="">Seleccionar moneda</option>
                    {getMonedasConTasas().map((moneda) => (
                      <option key={moneda.value} value={moneda.value}>
                        {moneda.label}
                      </option>
                    ))}
                  </select>
                  <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {monedaBaseSeleccionada && monedaCotizacionSeleccionada && monedaBaseSeleccionada !== monedaCotizacionSeleccionada && tasaCambio && (
              <div className={`mt-4 p-4 bg-gradient-to-r ${theme.gradientLight} rounded-xl border-2 border-${theme.primaryBorder} shadow-sm`}>
                <p className={`text-sm text-${theme.textLight} font-semibold flex items-center gap-2`}>
                  <TrendingUp className="w-4 h-4" />
                  Tasa de cambio: <span className={`text-${theme.text}`}>1 {monedaBaseSeleccionada} = {tasaCambio} {monedaCotizacionSeleccionada}</span>
                </p>
              </div>
            )}
          </div>

          {/* Sección de Pasajeros - Vista única */}
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
            <div className="max-h-[500px] overflow-y-auto pr-2">
              <PasajerosManager
                value={pasajeros}
                onChange={setPasajeros}
                monedaPrecio={monedaBaseSeleccionada}
                monedaCotizacion={monedaCotizacionSeleccionada}
                aerolinea={aerolinea}
              />
            </div>
          </div>

          {/* Sección de Método de Pago */}
          <div className="mt-12 mb-8 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className={`w-4 h-4 text-${theme.primary}`} />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Método de Pago
              </label>
            </div>
            <div>
              <div className="relative">
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
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
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {!monedaCotizacionSeleccionada && (
                <p className="text-xs text-amber-600 mt-1 ml-2 font-medium">
                  💡 Selecciona primero la moneda de cotización para ver los métodos de pago disponibles
                </p>
              )}
              {metodoPago === 'Depósitos en dólares (BNC USD)' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 font-semibold">💵 Cotización en USD (+4.5% comisión depósito)</p>
                </div>
              )}
              {metodoPago === 'Arcadia Service' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 font-semibold">💵 Cotización en USD (+5.6% + $10)</p>
                </div>
              )}
              {metodoPago === 'BNC - Transferencia en Bs' && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs text-purple-700 font-semibold">Bs Cotización en Bolívares (VES)</p>
                </div>
              )}
              {metodoPago === 'Depósito oficina Venezuela (efectivo)' && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs text-amber-700 font-semibold">💰 Pago en efectivo USD - Seleccione moneda de cotización</p>
                </div>
              )}
              {(metodoPago === 'Davivienda' || metodoPago === 'Bancacolombia' || metodoPago === 'Depósito oficina Colombia (efectivo)') && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-xs text-yellow-700 font-semibold">🇨🇴 Cotización en Pesos Colombianos (COP)</p>
                </div>
              )}
              {(metodoPago === 'Cuenta en Euros' || metodoPago === 'Depósito oficina Europa (efectivo)' || metodoPago === 'Bizum (España)') && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-xs text-indigo-700 font-semibold">€ Cotización en Euros (EUR)</p>
                </div>
              )}
              {(metodoPago === 'Zelle' || metodoPago === 'Banesco Panamá (ViajesNova)' || metodoPago === 'Chase Bank (Estados Unidos)') && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 font-semibold">💵 Cotización en Dólares (USD)</p>
                </div>
              )}
              {metodoPago === 'Binance (USDT)' && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-semibold">₮ Cotización en USDT</p>
                </div>
              )}
              {metodoPago === 'Scalapay' && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-xs text-orange-700 font-semibold">€ Cotización en Euros (EUR) +10.5% recargo</p>
                </div>
              )}
            </div>
          </div>

          {/* Sección de Detalles del Vuelo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className={`w-4 h-4 text-${theme.primary}`} />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detalles del Vuelo
              </label>
            </div>

          {/* Campos para Fines Migratorios */}
          {vueloInfo.finesMigratorios && (
            <div className="mt-8 p-6 bg-amber-50 rounded-xl border-2 border-amber-200 space-y-6">
              <h4 className="text-sm font-bold text-amber-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Información para Fines Migratorios
              </h4>

              <div>
                <AerolineaAutocomplete
                  value={aerolinea}
                  onChange={setAerolinea}
                  onCodigoChange={setAerolineaCodigo}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          {(vueloInfo.idaVuelta || vueloInfo.soloIda) && (
            <div className="mt-8 p-6 bg-indigo-50/50 rounded-xl border-2 border-indigo-100 space-y-6">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest px-1">Vuelo de Ida</h4>

              <div>
                <AerolineaAutocomplete
                  value={aerolinea}
                  onChange={setAerolinea}
                  onCodigoChange={setAerolineaCodigo}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">FECHA</label>
                  <input
                    type="date"
                    value={vueloInfo.fechaSalida}
                    onChange={(e) => updateVueloInfo('fechaSalida', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">SALIDA</label>
                  <input
                    type="time"
                    value={vueloInfo.horaSalida}
                    onChange={(e) => updateVueloInfo('horaSalida', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">LLEGADA</label>
                  <input
                    type="time"
                    value={vueloInfo.horaLlegada}
                    onChange={(e) => updateVueloInfo('horaLlegada', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}
          {vueloInfo.idaVuelta && (
            <div className="mt-8 p-6 bg-purple-50/50 rounded-xl border-2 border-purple-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest px-1">Vuelo de Vuelta</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="mt-8 p-6 bg-orange-50/50 rounded-xl border-2 border-orange-100 space-y-6">
            <h4 className="text-xs font-bold text-orange-700 uppercase tracking-widest px-1">Escalas</h4>
            {escalas.map((escala, index) => (
              <div key={index} className="space-y-3 p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-600">Escala {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => eliminarEscala(index)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    Eliminar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">CIUDAD</label>
                    <input
                      type="text"
                      value={escala.ciudad}
                      onChange={(e) => actualizarEscala(index, 'ciudad', e.target.value)}
                      placeholder="Ej: Bogotá"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">DURACIÓN</label>
                    <input
                      type="text"
                      value={escala.duracion}
                      onChange={(e) => actualizarEscala(index, 'duracion', e.target.value)}
                      placeholder="Ej: 5:30 o 5.5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            {escalas.length < 2 && (
              <button
                type="button"
                onClick={agregarEscala}
                className="w-full py-2 px-4 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors text-sm font-bold"
              >
                + Agregar Escala
              </button>
            )}
          </div>
          {/* Equipaje ahora es por pasajero en PasajerosManager */}
          </div>

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
            isAuthenticated={isAuthenticated}
            formatearMonto={formatearMonto}
            theme={theme}
          />
        </div>
      </div>
    </>
  )
}
