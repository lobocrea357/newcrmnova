'use client'
import { useState, useEffect } from 'react'
import { Plane, Users, DollarSign, FileText, X, Copy, CheckCircle, AlertCircle, Sparkles, Loader2, MapPin, CreditCard } from 'lucide-react'
import { toastSuccess, toastError, toastInfo } from '@/helpers/toasts'
import { METHODS_BY_CURRENCY } from '@/lib/cotizador/paymentConfig'
import AerolineaAutocomplete from '@/components/cotizador/AerolineaAutocomplete'
import FileUpload from '@/components/vuelos/FileUpload' // NEW IMPORT
import { normalizarCedula } from '@/lib/documentos/normalizarCedula'

const TIPOS_VUELO = [
  { value: 'solo_ida', label: 'Solo Ida' },
  { value: 'ida_vuelta', label: 'Ida y Vuelta' },
  { value: 'migratorio', label: 'Fines Migratorios' }
]

const PROVEEDORES = [
  'Sabre',
  'Servivuelo',
  'Kiu',
  'Expedia',
  'Kiwi',
  'Amadeus'
]

const TIPOS_PASAJERO = [
  { value: 'ADULTO', label: 'Adulto' },
  { value: 'NINO', label: 'Niño' },
  { value: 'INFANTE', label: 'Infante' }
]

const SEXOS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' }
]

const TIPOS_DOCUMENTO = [
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

const PAISES_CEDULA = [
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

// Helper para formato automático según país
const formatCedulaByCountry = (value, country) => {
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

export default function VueloFormNuevo({
  initialData,
  cotizacion,
  onSubmit,
  isLoading
}) {
  // Estados del formulario principal
  const [formData, setFormData] = useState({
    pax_nombre: '',
    contacto_nombre: '',
    contacto_telefono: '',
    fecha_vuelo: '',
    ruta: '',
    ruta_origen: '',
    ruta_destino: '',
    horario: '',
    hora_llegada: '',
    fecha_regreso: '',
    hora_salida_regreso: '',
    hora_llegada_regreso: '',
    aerolinea_nombre: '',
    aerolinea_codigo: '',
    localizador: '',
    proveedor: '',
    monto_venta: '',
    metodo_pago: '',
    tipo_vuelo: 'ida_vuelta',
    pnr_desglose: '',
    observaciones: '',
    // Escalas
    tiene_escala: false,
    escala_1_ciudad: '',
    escala_1_duracion: '',
    tiene_segunda_escala: false,
    escala_2_ciudad: '',
    escala_2_duracion: '',
    // Info Financiera
    moneda_precio: '',
    moneda_cotizacion: '',
    tasa_cambio: '',
    total_cotizacion: '',
    // Información de Emisión
    forma_emision: 'CONTADO',
    cuenta_emision_asignada: '',
    // NUEVOS CAMPOS PARA CRÉDITO
    monto_total_venta: '',
    pago_inicial_cliente: '0',
    costo_base_proveedor: '',
    ...initialData
  })

  // Estados de pasajeros
  const [pasajeros, setPasajeros] = useState([])
  const [comprobantes, setComprobantes] = useState([])
  const [pdfServivuelo, setPdfServivuelo] = useState(null)
  const [errors, setErrors] = useState({})
  const [extractingPassport, setExtractingPassport] = useState({})

  // Cargar pasajeros desde cotización si existe
  useEffect(() => {
    if (cotizacion?.pasajeros && cotizacion.pasajeros.length > 0) {
      const pasajerosIniciales = cotizacion.pasajeros.map((p, idx) => ({
        id: `temp-${idx}`,
        cotizacion_pasajero_id: p.id,
        tipo: p.tipo,
        orden: p.orden,
        nombres: '',
        apellidos: '',
        sexo: '',
        fecha_nacimiento: '',
        nacionalidad: '',
        // Smart default: PASAPORTE como opción segura para vuelos
        tipo_documento: 'PASAPORTE',
        numero_pasaporte: '',
        numero_cedula: '',
        pais_emision_cedula: 'Venezuela', // País más común
        precio_pantalla: p.precio_pantalla,
        fee_emision: p.fee_emision,
        fee_agencia: p.fee_agencia,
        equipaje_completo: p.equipaje_completo,
        equipaje_mediano: p.equipaje_mediano,
        equipaje_ligero: p.equipaje_ligero,
        pasaporte_file: null
      }))
      setPasajeros(pasajerosIniciales)
    }
  }, [cotizacion])

  // Separar ruta en origen y destino cuando se carga desde initialData
  useEffect(() => {
    if (initialData?.ruta && initialData.ruta.includes('-')) {
      const [origen, destino] = initialData.ruta.split('-')
      setFormData(prev => ({
        ...prev,
        ruta_origen: origen || '',
        ruta_destino: destino || ''
      }))
    }
  }, [initialData?.ruta])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleRutaChange = (field, value) => {
    // Solo letras, máximo 3 caracteres, uppercase automático
    const formatted = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    setFormData(prev => ({ ...prev, [field]: formatted }))
    if (errors.ruta) {
      setErrors(prev => ({ ...prev, ruta: null }))
    }
  }

  const handleCuentaChange = (e) => {
    const cuenta = e.target.value

    // Auto-marcar como contado si es Servivuelo o Chase
    if (cuenta.includes('SERVIVUELO') || cuenta.includes('CHASE')) {
      setFormData(prev => ({
        ...prev,
        cuenta_emision_asignada: cuenta,
        forma_emision: 'CONTADO'
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        cuenta_emision_asignada: cuenta
      }))
    }
  }

  const handlePasajeroChange = (index, field, value) => {
    setPasajeros(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handlePasaporteUpload = (index, file) => {
    if (!file) return

    // FileUpload already validates, just handle the file
    handlePasajeroChange(index, 'pasaporte_file', file)
    toastSuccess(`Pasaporte cargado: ${file.name}`)
  }

  const removePasaporte = (index) => {
    handlePasajeroChange(index, 'pasaporte_file', null)
  }

  // Convertir archivo a base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Extraer datos del pasaporte con GPT-4o-mini
  const extractDocumentData = async (index) => {
    const pasajero = pasajeros[index]
    const tipoDocumento = pasajero.tipo_documento || 'PASAPORTE'
    const esCedula = tipoDocumento === 'CEDULA'

    if (!pasajero.pasaporte_file) {
      toastError(`Primero debes cargar la foto ${esCedula ? 'de la cédula' : 'del pasaporte'}`)
      return
    }

    // Solo procesar imágenes
    if (!pasajero.pasaporte_file?.type?.startsWith('image/')) {
      toastError('La extracción automática solo funciona con imágenes (JPG, PNG)')
      return
    }

    try {
      setExtractingPassport(prev => ({ ...prev, [index]: true }))
      toastInfo(`Analizando ${esCedula ? 'cédula' : 'pasaporte'} con IA...`)

      // Convertir imagen a base64
      const imageBase64 = await fileToBase64(pasajero.pasaporte_file)

      // Seleccionar endpoint según tipo de documento
      const endpoint = esCedula ? '/api/extract-cedula' : '/api/extract-passport'
      const requestBody = esCedula
        ? { imageBase64, pais: pasajero.pais_emision_cedula }
        : { imageBase64 }

      // Llamar al API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al extraer datos')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al extraer datos')
      }

      const extracted = result.data

      // Actualizar campos del pasajero con los datos extraídos
      setPasajeros(prev => {
        const updated = [...prev]

        if (esCedula) {
          // Para cédulas
          const cedulaNormalizada = normalizarCedula(
            extracted.numero_cedula || updated[index].numero_cedula,
            extracted.pais_emision_cedula || updated[index].pais_emision_cedula
          );

          updated[index] = {
            ...updated[index],
            nombres: extracted.nombres || updated[index].nombres,
            apellidos: extracted.apellidos || updated[index].apellidos,
            numero_cedula: cedulaNormalizada,
            nacionalidad: extracted.nacionalidad || updated[index].nacionalidad,
            sexo: extracted.sexo || updated[index].sexo,
            fecha_nacimiento: extracted.fecha_nacimiento || updated[index].fecha_nacimiento,
            pais_emision_cedula: extracted.pais_emision_cedula || updated[index].pais_emision_cedula
          }
        } else {
        // Para pasaportes
          updated[index] = {
            ...updated[index],
            nombres: extracted.nombres || updated[index].nombres,
            apellidos: extracted.apellidos || updated[index].apellidos,
            numero_pasaporte: extracted.numero_pasaporte || updated[index].numero_pasaporte,
            nacionalidad: extracted.nacionalidad || updated[index].nacionalidad,
            sexo: extracted.sexo || updated[index].sexo,
            fecha_nacimiento: extracted.fecha_nacimiento || updated[index].fecha_nacimiento,
            pais_emision_cedula: extracted.pais_emision || updated[index].pais_emision_cedula
          }
        }

        return updated
      })

      // Mostrar mensaje según la confianza
      if (extracted.confidence === 'high') {
        toastSuccess('✅ Datos extraídos correctamente. Por favor verifica la información.')
      } else if (extracted.confidence === 'medium') {
        toastInfo('⚠️ Datos extraídos con confianza media. Verifica cuidadosamente.')
      } else {
        toastInfo('⚠️ ' + (extracted.notes || 'Imagen borrosa. Verifica manualmente.'))
      }

      if (extracted.notes) {
        console.log('Notas de extracción:', extracted.notes)
      }

    } catch (error) {
      console.error(`Error extrayendo datos ${esCedula ? 'de la cédula' : 'del pasaporte'}:`, error)
      toastError('Error al extraer datos: ' + error.message)
    } finally {
      setExtractingPassport(prev => ({ ...prev, [index]: false }))
    }
  }

  // Calcular fee de emisión según aerolínea
  const calcularFeeEmision = () => {
    if (formData.aerolinea_nombre && formData.aerolinea_nombre.toLowerCase().includes('estelar')) {
      return 10
    }
    return 15
  }

  // Calcular subtotal (suma de todos los pasajeros en moneda base)
  const calcularSubtotal = () => {
    return pasajeros.reduce((total, p) => {
      const precio = parseFloat(p.precio_pantalla) || 0
      const feeEmision = parseFloat(p.fee_emision) || 0
      const feeAgencia = parseFloat(p.fee_agencia) || 0
      return total + precio + feeEmision + feeAgencia
    }, 0)
  }

  // Calcular monto de venta (subtotal con tasa aplicada)
  const calcularMontoVenta = () => {
    const subtotal = calcularSubtotal()
    const tasa = parseFloat(formData.tasa_cambio) || 1
    // Si las monedas son diferentes, aplicar tasa
    if (formData.moneda_precio !== formData.moneda_cotizacion && tasa > 0) {
      return subtotal * tasa
    }
    return subtotal
  }

  const agregarPasajero = () => {
    const nuevoOrden = pasajeros.length + 1
    const feeEmisionDefault = calcularFeeEmision()
    setPasajeros(prev => [...prev, {
      id: `temp-${Date.now()}`,
      tipo: 'ADULTO',
      orden: nuevoOrden,
      nombres: '',
      apellidos: '',
      sexo: '',
      fecha_nacimiento: '',
      nacionalidad: '',
      tipo_documento: 'PASAPORTE', // Default seguro para vuelos
      numero_pasaporte: '',
      numero_cedula: '',
      pais_emision_cedula: 'Venezuela', // País más común en el sistema
      precio_pantalla: 0,
      fee_emision: feeEmisionDefault,
      fee_agencia: 30,
      equipaje_completo: true,
      equipaje_mediano: false,
      equipaje_ligero: false,
      pasaporte_file: null
    }])
  }

  const eliminarPasajero = (index) => {
    setPasajeros(prev => prev.filter((_, i) => i !== index))
  }

  const handleComprobanteUpload = (files) => {
    // FileUpload already validates files and returns array
    const validFiles = Array.isArray(files) ? files : [files]

    setComprobantes(prev => [...prev, ...validFiles])
    toastSuccess(`${validFiles.length} comprobante(s) agregado(s)`)
  }

  const removeComprobante = (index) => {
    setComprobantes(prev => prev.filter((_, i) => i !== index))
  }

  const handlePdfServivueloUpload = (file) => {
    if (!file) return
    setPdfServivuelo(file)
    toastSuccess('PDF de Servivuelo cargado')
  }

  const removePdfServivuelo = () => {
    setPdfServivuelo(null)
  }

  const validateForm = () => {
    const newErrors = {}

    // Validaciones básicas
    if (!formData.pax_nombre.trim()) newErrors.pax_nombre = 'Nombre del PAX es requerido'
    if (!formData.contacto_nombre.trim()) newErrors.contacto_nombre = 'Contacto es requerido'
    if (!formData.contacto_telefono.trim()) newErrors.contacto_telefono = 'Teléfono es requerido'
    if (!formData.fecha_vuelo) newErrors.fecha_vuelo = 'Fecha del vuelo es requerida'
    if (!formData.ruta_origen.trim() || !formData.ruta_destino.trim()) newErrors.ruta = 'Origen y destino son requeridos'
    if (!formData.proveedor.trim()) newErrors.proveedor = 'Proveedor es requerido'

    // Validación condicional: si es ida_vuelta, fecha_regreso es requerida
    if (formData.tipo_vuelo === 'ida_vuelta' && !formData.fecha_regreso) {
      newErrors.fecha_regreso = 'Fecha de regreso es requerida para vuelos de ida y vuelta'
    }

    // Validaciones específicas cuando NO hay cotización
    if (!cotizacion) {
      if (!formData.moneda_precio) newErrors.moneda_precio = 'Moneda de precios es requerida'
      if (!formData.moneda_cotizacion) newErrors.moneda_cotizacion = 'Moneda de cotización es requerida'
      if (!formData.metodo_pago) newErrors.metodo_pago = 'Método de pago es requerido'
      // Si las monedas son diferentes, validar tasa
      if (formData.moneda_precio && formData.moneda_cotizacion &&
        formData.moneda_precio !== formData.moneda_cotizacion &&
        (!formData.tasa_cambio || parseFloat(formData.tasa_cambio) <= 0)) {
        newErrors.tasa_cambio = 'Tasa de cambio es requerida cuando las monedas son diferentes'
      }
      // Validar que el monto calculado sea mayor a 0
      if (calcularMontoVenta() <= 0) {
        newErrors.monto_venta = 'El monto de venta debe ser mayor a 0'
      }
    } else {
    // Validación cuando hay cotización
      if (!formData.monto_venta || parseFloat(formData.monto_venta) <= 0) {
        newErrors.monto_venta = 'Monto de venta es requerido y debe ser mayor a 0'
      }
    }

    // Validación condicional: si es Servivuelo, PDF es requerido
    if (formData.proveedor === 'Servivuelo' && !pdfServivuelo) {
      newErrors.pdfServivuelo = 'Para Servivuelo, el PDF de comprobante de reserva es requerido'
    }

    // Validaciones específicas para ventas a CREDITO
    if (formData.forma_emision === 'CREDITO') {
      if (!formData.costo_base_proveedor || parseFloat(formData.costo_base_proveedor) <= 0) {
        newErrors.costo_base_proveedor = 'Para ventas a crédito, el costo base del proveedor es requerido'
      }

      if (!formData.monto_total_venta || parseFloat(formData.monto_total_venta) <= 0) {
        newErrors.monto_total_venta = 'Para ventas a crédito, el monto total de venta es requerido'
      }

      if (formData.pago_inicial_cliente === '' || formData.pago_inicial_cliente === null || parseFloat(formData.pago_inicial_cliente) < 0) {
        newErrors.pago_inicial_cliente = 'El pago inicial es requerido (puede ser 0)'
      }

      // Validar coherencia de montos
      const montoTotal = parseFloat(formData.monto_total_venta || 0);
      const pagoInicial = parseFloat(formData.pago_inicial_cliente || 0);
      const costoBase = parseFloat(formData.costo_base_proveedor || 0);

      if (pagoInicial > montoTotal) {
        newErrors.pago_inicial_cliente = 'El pago inicial no puede ser mayor al monto total de venta'
      }

      if (costoBase > montoTotal) {
        newErrors.costo_base_proveedor = 'El costo base no puede ser mayor al precio de venta'
      }

      // Validar que haya ganancia positiva
      if (montoTotal < costoBase) {
        newErrors.monto_total_venta = 'El precio de venta debe ser mayor o igual al costo base'
      }
    }

    // Validar pasajeros
    if (pasajeros.length === 0) {
      newErrors.pasajeros = 'Debe agregar al menos un pasajero'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toastError('Por favor completa todos los campos requeridos')
      return
    }

    // Validar documentos de pasajeros
    const validationErrors = {}

    pasajeros.forEach((pasajero, index) => {
      if (pasajero.tipo_documento === 'PASAPORTE') {
        if (!pasajero.numero_pasaporte || pasajero.numero_pasaporte.trim() === '') {
          validationErrors[`pasajero_${index}_pasaporte`] = 'El número de pasaporte es requerido'
        }
      } else if (pasajero.tipo_documento === 'CEDULA') {
        if (!pasajero.numero_cedula || pasajero.numero_cedula.trim() === '') {
          validationErrors[`pasajero_${index}_cedula`] = 'El número de cédula es requerido'
        }
        if (!pasajero.pais_emision_cedula) {
          validationErrors[`pasajero_${index}_pais`] = 'El país de emisión es requerido'
        }
      }
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toastError('Por favor completa los datos de documento de todos los pasajeros')
      return
    }

    // Calcular valores dinámicos si no hay cotización
    const subtotalCalculado = cotizacion ? parseFloat(formData.total_cotizacion) : calcularSubtotal()
    const montoVentaCalculado = cotizacion ? parseFloat(formData.monto_venta) : calcularMontoVenta()

    // Combinar origen y destino en ruta
    const rutaCombinada = `${formData.ruta_origen.toUpperCase()}-${formData.ruta_destino.toUpperCase()}`

    const submitData = {
      vuelo: {
        ...formData,
        ruta: rutaCombinada,
        monto_venta: montoVentaCalculado,
        cotizacion_id: cotizacion?.id || null,
        // Remover campos temporales del frontend
        ruta_origen: undefined,
        ruta_destino: undefined,
        // Validar horas para evitar strings vacíos
        horario: formData.horario && formData.horario.trim() !== '' ? formData.horario : null,
        hora_llegada: formData.hora_llegada && formData.hora_llegada.trim() !== '' ? formData.hora_llegada : null,
        // Campos de vuelo de regreso (solo si es ida_vuelta)
        fecha_regreso: formData.tipo_vuelo === 'ida_vuelta' ? formData.fecha_regreso : null,
        hora_salida_regreso: formData.tipo_vuelo === 'ida_vuelta' && formData.hora_salida_regreso?.trim() ? formData.hora_salida_regreso : null,
        hora_llegada_regreso: formData.tipo_vuelo === 'ida_vuelta' && formData.hora_llegada_regreso?.trim() ? formData.hora_llegada_regreso : null,
        // Escalas
        tiene_escala: formData.tiene_escala,
        escala_1_ciudad: formData.escala_1_ciudad || null,
        escala_1_duracion: formData.escala_1_duracion || null,
        tiene_segunda_escala: formData.tiene_segunda_escala,
        escala_2_ciudad: formData.escala_2_ciudad || null,
        escala_2_duracion: formData.escala_2_duracion || null,
        // Info Financiera
        moneda_precio: formData.moneda_precio || null,
        moneda_cotizacion: formData.moneda_cotizacion || null,
        tasa_cambio: formData.tasa_cambio ? parseFloat(formData.tasa_cambio) : null,
        total_cotizacion: subtotalCalculado,
        // Información de Emisión
        forma_emision: formData.forma_emision || 'CONTADO',
        cuenta_emision_asignada: formData.cuenta_emision_asignada || null,
        // CAMPOS DE CRÉDITO (solo si es CREDITO)
        monto_total_venta: formData.forma_emision === 'CREDITO' ? parseFloat(formData.monto_total_venta) : null,
        pago_inicial_cliente: formData.forma_emision === 'CREDITO' ? parseFloat(formData.pago_inicial_cliente) : null,
        costo_base_proveedor: formData.forma_emision === 'CREDITO' ? parseFloat(formData.costo_base_proveedor) : null
      },
      pasajeros: pasajeros.map(p => ({
        cotizacion_pasajero_id: p.cotizacion_pasajero_id || null,
        tipo: p.tipo,
        orden: p.orden,
        nombres: p.nombres || null,
        apellidos: p.apellidos || null,
        sexo: p.sexo || null,
        fecha_nacimiento: p.fecha_nacimiento || null,
        nacionalidad: p.nacionalidad || null,
        tipo_documento: p.tipo_documento || 'PASAPORTE',
        numero_pasaporte: p.numero_pasaporte || null,
        numero_cedula: p.numero_cedula || null,
        pais_emision_cedula: p.pais_emision_cedula || null,
        precio_pantalla: parseFloat(p.precio_pantalla) || 0,
        fee_emision: parseFloat(p.fee_emision) || 0,
        fee_agencia: parseFloat(p.fee_agencia) || 0,
        equipaje_completo: p.equipaje_completo,
        equipaje_mediano: p.equipaje_mediano,
        equipaje_ligero: p.equipaje_ligero
      })),
      pasaportes: pasajeros.map(p => p.pasaporte_file).filter(Boolean),
      comprobantes: comprobantes,
      pdfServivuelo: pdfServivuelo
    }

    await onSubmit(submitData)
  }

  const copiarPNR = () => {
    if (formData.pnr_desglose) {
      navigator.clipboard.writeText(formData.pnr_desglose)
      toastSuccess('PNR copiado al portapapeles')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECCIÓN 1: Información del Cliente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-indigo-600" />
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">1</span>
            <h3 className="text-lg font-bold text-gray-900">Información del Cliente</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del cliente *
            </label>
            <input
              type="text"
              name="pax_nombre"
              value={formData.pax_nombre}
              onChange={handleChange}
              placeholder="Ej: FAMILIA GIMENEZ"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.pax_nombre ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.pax_nombre && <p className="mt-1 text-sm text-red-600">{errors.pax_nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contacto *
            </label>
            <input
              type="text"
              name="contacto_nombre"
              value={formData.contacto_nombre}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.contacto_nombre ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.contacto_nombre && <p className="mt-1 text-sm text-red-600">{errors.contacto_nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              name="contacto_telefono"
              value={formData.contacto_telefono}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.contacto_telefono ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.contacto_telefono && <p className="mt-1 text-sm text-red-600">{errors.contacto_telefono}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
              placeholder="Notas adicionales sobre el cliente o la transacción..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Detalles del Vuelo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center gap-2 mb-6">
          <Plane className="w-5 h-5 text-indigo-600" />
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">2</span>
            <h3 className="text-lg font-bold text-gray-900">Detalles del Vuelo</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Vuelo - Primero para definir qué campos mostrar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Vuelo *
            </label>
            <select
              name="tipo_vuelo"
              value={formData.tipo_vuelo}
              onChange={handleChange}
              disabled={!!cotizacion}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!!cotizacion ? 'bg-gray-100' : ''}`}
            >
              {TIPOS_VUELO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          {/* Vuelo de IDA */}
          <div className="col-span-full">
            <div className="bg-indigo-50/50 rounded-xl border-2 border-indigo-100 p-6 space-y-4">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest px-1 mb-4">
                {formData.tipo_vuelo === 'ida_vuelta' ? 'Vuelo de Ida' : formData.tipo_vuelo === 'migratorio' ? 'Información del Vuelo (Fines Migratorios)' : 'Información del Vuelo'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">
                    FECHA SALIDA *
                  </label>
                  <input
                    type="date"
                    name="fecha_vuelo"
                    value={formData.fecha_vuelo}
                    onChange={handleChange}
                    disabled={!!cotizacion}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white ${!!cotizacion ? 'bg-gray-100' : ''} ${errors.fecha_vuelo ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {errors.fecha_vuelo && <p className="mt-1 text-sm text-red-600">{errors.fecha_vuelo}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">
                    HORA SALIDA
                  </label>
                  <input
                    type="time"
                    name="horario"
                    value={formData.horario}
                    onChange={handleChange}
                    disabled={!!cotizacion}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white ${!!cotizacion ? 'bg-gray-100' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">
                    HORA LLEGADA
                  </label>
                  <input
                    type="time"
                    name="hora_llegada"
                    value={formData.hora_llegada}
                    onChange={handleChange}
                    disabled={!!cotizacion}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white ${!!cotizacion ? 'bg-gray-100' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vuelo de VUELTA - Solo si es ida_vuelta */}
          {formData.tipo_vuelo === 'ida_vuelta' && (
            <div className="col-span-full">
              <div className="bg-purple-50/50 rounded-xl border-2 border-purple-100 p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest px-1 mb-4">Vuelo de Vuelta</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">
                      FECHA REGRESO *
                    </label>
                    <input
                      type="date"
                      name="fecha_regreso"
                      value={formData.fecha_regreso}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white ${errors.fecha_regreso ? 'border-red-500' : 'border-slate-300'}`}
                    />
                    {errors.fecha_regreso && <p className="mt-1 text-sm text-red-600">{errors.fecha_regreso}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">
                      HORA SALIDA
                    </label>
                    <input
                      type="time"
                      name="hora_salida_regreso"
                      value={formData.hora_salida_regreso}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">
                      HORA LLEGADA
                    </label>
                    <input
                      type="time"
                      name="hora_llegada_regreso"
                      value={formData.hora_llegada_regreso}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruta *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.ruta_origen}
                      onChange={(e) => handleRutaChange('ruta_origen', e.target.value)}
                      placeholder="ORI"
                      maxLength={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-center font-mono text-sm font-bold tracking-wider ${errors.ruta ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                  </div>
                  <span className="text-xl font-bold text-gray-400">-</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.ruta_destino}
                      onChange={(e) => handleRutaChange('ruta_destino', e.target.value)}
                      placeholder="DES"
                      maxLength={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-center font-mono text-sm font-bold tracking-wider ${errors.ruta ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                  </div>
                </div>
                {errors.ruta && <p className="mt-1 text-sm text-red-600">{errors.ruta}</p>}
              </div>

              <div>
                <AerolineaAutocomplete
                  value={formData.aerolinea_nombre}
                  onChange={(nombre) => setFormData(prev => ({ ...prev, aerolinea_nombre: nombre }))}
                  onCodigoChange={(codigo) => setFormData(prev => ({ ...prev, aerolinea_codigo: codigo }))}
                />
              </div>
            </div>
          </div>

          {/* ESCALAS - Integradas en esta sección */}
          <div className="col-span-full">
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-semibold text-gray-900">Escalas del Vuelo</h4>
              </div>

              <div className="space-y-4">
                {/* Primera Escala */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tiene_escala"
                    checked={formData.tiene_escala}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        tiene_escala: e.target.checked,
                        escala_1_ciudad: e.target.checked ? prev.escala_1_ciudad : '',
                        escala_1_duracion: e.target.checked ? prev.escala_1_duracion : ''
                      }))
                    }}
                    disabled={!!cotizacion}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tiene_escala" className="text-sm font-medium text-gray-700">
                    ¿El vuelo tiene escala?
                  </label>
                </div>

                {formData.tiene_escala && (
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad de la escala
                      </label>
                      <input
                        type="text"
                        name="escala_1_ciudad"
                        value={formData.escala_1_ciudad}
                        onChange={handleChange}
                        disabled={!!cotizacion}
                        placeholder="Ej: Bogotá"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${!!cotizacion ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración de la escala
                      </label>
                      <input
                        type="text"
                        name="escala_1_duracion"
                        value={formData.escala_1_duracion}
                        onChange={handleChange}
                        disabled={!!cotizacion}
                        placeholder="Ej: 2h 30min"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${!!cotizacion ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                  </div>
                )}

                {/* Segunda Escala */}
                {formData.tiene_escala && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="tiene_segunda_escala"
                        checked={formData.tiene_segunda_escala}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tiene_segunda_escala: e.target.checked,
                            escala_2_ciudad: e.target.checked ? prev.escala_2_ciudad : '',
                            escala_2_duracion: e.target.checked ? prev.escala_2_duracion : ''
                          }))
                        }}
                        disabled={!!cotizacion}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="tiene_segunda_escala" className="text-sm font-medium text-gray-700">
                        ¿Tiene segunda escala?
                      </label>
                    </div>

                    {formData.tiene_segunda_escala && (
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ciudad de la segunda escala
                          </label>
                          <input
                            type="text"
                            name="escala_2_ciudad"
                            value={formData.escala_2_ciudad}
                            onChange={handleChange}
                            disabled={!!cotizacion}
                            placeholder="Ej: Panamá"
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${!!cotizacion ? 'bg-gray-100' : ''}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración de la segunda escala
                          </label>
                          <input
                            type="text"
                            name="escala_2_duracion"
                            value={formData.escala_2_duracion}
                            onChange={handleChange}
                            disabled={!!cotizacion}
                            placeholder="Ej: 1h 45min"
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${!!cotizacion ? 'bg-gray-100' : ''}`}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Información Operativa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-indigo-600" />
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">3</span>
            <h3 className="text-lg font-bold text-gray-900">Información Operativa</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localizador (LOC/PNR)
            </label>
            <input
              type="text"
              name="localizador"
              value={formData.localizador}
              onChange={handleChange}
              placeholder="Ej: EFDYYO"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
            />
            <p className="mt-1 text-xs text-gray-500">Opcional - Se generará automáticamente si se deja vacío</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor *
            </label>
            <select
              name="proveedor"
              value={formData.proveedor}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.proveedor ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Seleccionar</option>
              {PROVEEDORES.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            {errors.proveedor && <p className="mt-1 text-sm text-red-600">{errors.proveedor}</p>}
          </div>

          {/* Desglose PNR/GDS - Solo para proveedores que no son Servivuelo */}
          {formData.proveedor !== 'Servivuelo' && (
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Desglose Completo de Reserva (PNR/GDS)
                </label>
                {formData.pnr_desglose && (
                  <button
                    type="button"
                    onClick={copiarPNR}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                )}
              </div>
              <textarea
                name="pnr_desglose"
                value={formData.pnr_desglose}
                onChange={handleChange}
                rows="8"
                placeholder="Pega aquí el desglose completo de la reserva desde Sabre, Kiu, Expedia, Kiwi, etc..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                style={{ fontFamily: 'monospace' }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Este desglose será usado por el equipo de emisión para emitir los boletos
              </p>
            </div>
          )}

          {/* Upload PDF para Servivuelo */}
          {formData.proveedor === 'Servivuelo' && (
            <div className="md:col-span-2 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <label className="text-sm font-medium text-amber-900">
                  Comprobante de Reserva (PDF) - Requerido para Servivuelo
                </label>
              </div>
              <FileUpload
                tipo="COMPROBANTE_RESERVA_SERVIVUELO"
                onFilesChange={handlePdfServivueloUpload}
                singleFile={true}
                maxFiles={1}
                maxSizeMB={15}
              />
              {pdfServivuelo && (
                <div className="mt-2 flex items-center justify-between bg-white p-2 rounded border">
                  <span className="text-sm text-gray-700">{pdfServivuelo.name}</span>
                  <button
                    type="button"
                    onClick={removePdfServivuelo}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {errors.pdfServivuelo && (
                <p className="mt-2 text-sm text-red-600">{errors.pdfServivuelo}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 4: Gestión de Pasajeros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">4</span>
              <h3 className="text-lg font-bold text-gray-900">
                Pasajeros ({pasajeros.length})
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={agregarPasajero}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Agregar Pasajero
          </button>
        </div>

        {errors.pasajeros && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.pasajeros}</p>
          </div>
        )}

        {cotizacion && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ℹ️ Pasajeros heredados de cotización. Completa los datos personales y sube el pasaporte de cada uno.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {pasajeros.map((pasajero, index) => (
            <div key={pasajero.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  Pasajero #{index + 1} - {pasajero.tipo}
                </h4>
                {!pasajero.cotizacion_pasajero_id && (
                  <button
                    type="button"
                    onClick={() => eliminarPasajero(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!pasajero.cotizacion_pasajero_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={pasajero.tipo}
                      onChange={(e) => handlePasajeroChange(index, 'tipo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {TIPOS_PASAJERO.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <input
                    type="text"
                    value={pasajero.nombres}
                    onChange={(e) => handlePasajeroChange(index, 'nombres', e.target.value)}
                    placeholder="Primer y segundo nombre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={pasajero.apellidos}
                    onChange={(e) => handlePasajeroChange(index, 'apellidos', e.target.value)}
                    placeholder="Primer y segundo apellido"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    value={pasajero.sexo}
                    onChange={(e) => handlePasajeroChange(index, 'sexo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {SEXOS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={pasajero.fecha_nacimiento}
                    onChange={(e) => handlePasajeroChange(index, 'fecha_nacimiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={pasajero.nacionalidad}
                    onChange={(e) => handlePasajeroChange(index, 'nacionalidad', e.target.value)}
                    placeholder="Ej: VEN, COL, ESP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                    maxLength="3"
                  />
                </div>

                {/* Selector de Tipo de Documento */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Tipo de Documento del Pasajero {index + 1}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {TIPOS_DOCUMENTO.map(tipo => (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => handlePasajeroChange(index, 'tipo_documento', tipo.value)}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all duration-200
                          ${pasajero.tipo_documento === tipo.value
                            ? `border-${tipo.color}-500 bg-${tipo.color}-50 shadow-lg scale-[1.02]`
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-2xl">{tipo.icon}</span>
                          <div className="text-center">
                            <div className={`font-medium text-sm ${pasajero.tipo_documento === tipo.value
                              ? `text-${tipo.color}-700`
                              : 'text-gray-900'
                              }`}>
                              {tipo.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {tipo.description}
                            </div>
                          </div>
                        </div>
                        {pasajero.tipo_documento === tipo.value && (
                          <div className={`absolute top-2 right-2 w-6 h-6 bg-${tipo.color}-500 rounded-full flex items-center justify-center`}>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campos dinámicos según tipo de documento */}
                {pasajero.tipo_documento === 'PASAPORTE' && (
                  <div className="md:col-span-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        N° Pasaporte
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pasajero.numero_pasaporte || ''}
                          onChange={(e) => handlePasajeroChange(index, 'numero_pasaporte', e.target.value.toUpperCase())}
                          placeholder="Ej: ABC123456"
                          className={`w-full px-4 py-3 border rounded-lg text-sm uppercase font-mono transition-colors ${errors[`pasajero_${index}_pasaporte`]
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                        />
                        {pasajero.numero_pasaporte && pasajero.numero_pasaporte.length >= 6 && (
                          <div className="absolute right-3 top-3">
                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      {errors[`pasajero_${index}_pasaporte`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`pasajero_${index}_pasaporte`]}</p>
                      )}
                    </div>
                  </div>
                )}

                {pasajero.tipo_documento === 'CEDULA' && (
                  <div className="md:col-span-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        N° Cédula de Identidad
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pasajero.numero_cedula || ''}
                          onChange={(e) => {
                            const formatted = formatCedulaByCountry(e.target.value, pasajero.pais_emision_cedula)
                            handlePasajeroChange(index, 'numero_cedula', formatted)
                          }}
                          placeholder={pasajero.pais_emision_cedula === 'Venezuela' ? 'V-12345678' : '12345678'}
                          className={`w-full px-4 py-3 border rounded-lg text-sm uppercase font-mono transition-colors ${errors[`pasajero_${index}_cedula`]
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                            }`}
                        />
                        {pasajero.numero_cedula && pasajero.numero_cedula.length >= 7 && (
                          <div className="absolute right-3 top-3">
                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      {errors[`pasajero_${index}_cedula`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`pasajero_${index}_cedula`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        País de Emisión
                      </label>
                      <select
                        value={pasajero.pais_emision_cedula || 'Venezuela'}
                        onChange={(e) => handlePasajeroChange(index, 'pais_emision_cedula', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      >
                        {PAISES_CEDULA.map(pais => (
                          <option key={pais.value} value={pais.value}>
                            {pais.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tooltip informativo */}
                    <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-700">
                        <p className="font-medium mb-1">¿Por qué Cédula de Identidad?</p>
                        <p>Puedes reservar con la C.I. si no tienes el pasaporte a mano. Luego podrás actualizarlo cuando lo obtengas.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Pasaporte/Cédula */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {pasajero.tipo_documento === 'PASAPORTE' ? 'Pasaporte (Foto/PDF)' : 'Cédula (Foto/PDF)'}
                  </label>
                  <FileUpload
                    tipo="PASAPORTE"
                    onFilesChange={(file) => handlePasaporteUpload(index, file)}
                    maxFiles={1}
                    singleFile={true}
                    maxSizeMB={10}
                  />

                  {/* Existing file display and AI extraction button */}
                  {pasajero.pasaporte_file && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700">{pasajero.pasaporte_file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePasaporte(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Botón de Extracción Automática con IA - Para pasaportes y cédulas */}
                      {pasajero.pasaporte_file?.type?.startsWith('image/') && (
                        <button
                          type="button"
                          onClick={() => extractDocumentData(index)}
                          disabled={extractingPassport[index]}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${pasajero.tipo_documento === 'CEDULA'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                            }`}
                        >
                          {extractingPassport[index] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Extrayendo datos...
                            </>
                          ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Extraer datos con IA
                            </>
                          )}
                        </button>
                      )}

                      {pasajero.pasaporte_file?.type === 'application/pdf' && (
                        <p className="text-xs text-amber-600 italic">
                          &#9888; La extracción automática solo funciona con imágenes (JPG, PNG)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Precios del pasajero */}
                <div className="md:col-span-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs font-medium text-indigo-700 mb-3">
                    {pasajero.cotizacion_pasajero_id ? '💰 Precios heredados de cotización:' : '💰 Precios del boleto:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Precio Pantalla</label>
                      {pasajero.cotizacion_pasajero_id ? (
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm font-semibold">
                          ${pasajero.precio_pantalla}
                        </div>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pasajero.precio_pantalla}
                          onChange={(e) => handlePasajeroChange(index, 'precio_pantalla', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fee Emisión</label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm font-semibold">
                        ${pasajero.fee_emision}
                        <span className="text-xs text-gray-400 ml-1">
                          {parseFloat(pasajero.fee_emision) === 10 ? '(Estelar)' : '(Normal)'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fee Agencia</label>
                      {pasajero.cotizacion_pasajero_id ? (
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm font-semibold">
                          ${pasajero.fee_agencia}
                        </div>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pasajero.fee_agencia}
                          onChange={(e) => handlePasajeroChange(index, 'fee_agencia', e.target.value)}
                          placeholder="30"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subtotal</label>
                      <div className="px-3 py-2 bg-emerald-100 border border-emerald-300 rounded text-sm font-bold text-emerald-700">
                        ${(parseFloat(pasajero.precio_pantalla || 0) + parseFloat(pasajero.fee_emision || 0) + parseFloat(pasajero.fee_agencia || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Equipaje */}
                  {!pasajero.cotizacion_pasajero_id && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">🧳 Equipaje incluido:</p>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={pasajero.equipaje_completo || false}
                            onChange={(e) => handlePasajeroChange(index, 'equipaje_completo', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                          />
                          <span>Completo (23Kg + 8Kg)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={pasajero.equipaje_mediano || false}
                            onChange={(e) => handlePasajeroChange(index, 'equipaje_mediano', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                          />
                          <span>Mediano (23Kg)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={pasajero.equipaje_ligero || false}
                            onChange={(e) => handlePasajeroChange(index, 'equipaje_ligero', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                          />
                          <span>Ligero (10Kg)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {pasajeros.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay pasajeros agregados</p>
              <p className="text-sm">Haz clic en "Agregar Pasajero" para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 5: Información Financiera y Emisión */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">5</span>
            <h3 className="text-lg font-bold text-gray-900">Información Financiera y Emisión</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Información Financiera */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda de Precios de Pantalla *
            </label>
            {cotizacion ? (
              <input
                type="text"
                value={formData.moneda_precio}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            ) : (
              <select
                name="moneda_precio"
                value={formData.moneda_precio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar</option>
                <option value="USD">USD - Dólares</option>
                <option value="EUR">EUR - Euros</option>
              </select>
            )}
            <p className="mt-1 text-xs text-gray-500">Moneda en la que están los precios de pantalla</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda de Cotización *
            </label>
            {cotizacion ? (
              <input
                type="text"
                value={formData.moneda_cotizacion}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            ) : (
              <select
                name="moneda_cotizacion"
                value={formData.moneda_cotizacion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar</option>
                <option value="USD">USD - Dólares</option>
                <option value="EUR">EUR - Euros</option>
                <option value="VES">VES - Bolívares</option>
                <option value="COP">COP - Pesos Colombianos</option>
              </select>
            )}
            <p className="mt-1 text-xs text-gray-500">Moneda en la que paga el cliente</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Cambio {!cotizacion && formData.moneda_precio !== formData.moneda_cotizacion && '*'}
            </label>
            {cotizacion ? (
              <input
                type="text"
                value={formData.tasa_cambio}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            ) : (
              <input
                type="number"
                name="tasa_cambio"
                value={formData.tasa_cambio}
                onChange={handleChange}
                step="0.0001"
                min="0"
                placeholder={formData.moneda_precio === formData.moneda_cotizacion ? 'No aplica' : 'Ej: 1.08'}
                disabled={formData.moneda_precio === formData.moneda_cotizacion}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${formData.moneda_precio === formData.moneda_cotizacion ? 'bg-gray-100' : ''}`}
              />
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.moneda_precio === formData.moneda_cotizacion
                ? 'Misma moneda, no requiere tasa'
                : `Tasa de ${formData.moneda_precio || '?'} a ${formData.moneda_cotizacion || '?'}`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtotal ({formData.moneda_precio || 'USD'})
            </label>
            <input
              type="text"
              value={cotizacion ? formData.total_cotizacion : calcularSubtotal().toFixed(2)}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
            />
            <p className="mt-1 text-xs text-gray-500">Suma de todos los boletos (calculado automáticamente)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Venta - Total a Pagar ({formData.moneda_cotizacion || 'USD'})
            </label>
            <input
              type="text"
              value={cotizacion ? formData.monto_venta : calcularMontoVenta().toFixed(2)}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-lg"
            />
            <p className="mt-1 text-xs text-gray-500">Precio final para el cliente (calculado automáticamente)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <select
              name="metodo_pago"
              value={formData.metodo_pago}
              onChange={handleChange}
              disabled={!!cotizacion}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!!cotizacion ? 'bg-gray-100' : ''}`}
            >
              <option value="">Seleccionar</option>
              {formData.moneda_cotizacion && METHODS_BY_CURRENCY[formData.moneda_cotizacion] ? (
                METHODS_BY_CURRENCY[formData.moneda_cotizacion].map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))
              ) : (
                Object.values(METHODS_BY_CURRENCY).flat().filter((v, i, a) => a.indexOf(v) === i).map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))
              )}
            </select>
            {formData.moneda_cotizacion && (
              <p className="mt-1 text-xs text-gray-500">Métodos disponibles para {formData.moneda_cotizacion}</p>
            )}
          </div>

          {/* Información de Emisión */}
          <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-semibold text-gray-900">Información de Emisión</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cuenta de Emisión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta de Emisión *
                </label>
                <select
                  name="cuenta_emision_asignada"
                  value={formData.cuenta_emision_asignada}
                  onChange={handleCuentaChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Seleccionar cuenta...</option>
                  <option value="SERVIVUELO_1">Servivuelo 1 (Contado)</option>
                  <option value="SERVIVUELO_2">Servivuelo 2 (Contado)</option>
                  <option value="CHASE_NOVA">Chase Bank Nova (Contado)</option>
                  <option value="CHASE_APOLO">Chase Bank Apolo (Contado)</option>
                  <option value="SABRE">Sabre (Crédito/Contado)</option>
                  <option value="AMADEUS">Amadeus (Crédito/Contado)</option>
                  <option value="EXPEDIA">Expedia (Crédito/Contado)</option>
                </select>

                {/* Nota automática para Servivuelo */}
                {formData.cuenta_emision_asignada?.includes('SERVIVUELO') && (
                  <p className="mt-2 text-sm text-indigo-600">
                    ℹ️ Servivuelo siempre es al contado
                  </p>
                )}
              </div>

              {/* Forma de Emisión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Emisión *
                </label>
                <div className="flex gap-4 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="forma_emision"
                      value="CONTADO"
                      checked={formData.forma_emision === 'CONTADO'}
                      onChange={handleChange}
                      disabled={formData.cuenta_emision_asignada?.includes('SERVIVUELO') ||
                        formData.cuenta_emision_asignada?.includes('CHASE')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-900">Contado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="forma_emision"
                      value="CREDITO"
                      checked={formData.forma_emision === 'CREDITO'}
                      onChange={handleChange}
                      disabled={formData.cuenta_emision_asignada?.includes('SERVIVUELO') ||
                        formData.cuenta_emision_asignada?.includes('CHASE')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-900">Crédito</span>
                  </label>
                </div>

                {formData.forma_emision === 'CREDITO' && (
                  <p className="mt-2 text-sm text-amber-600">
                    ⚠️ Se generará una deuda con el proveedor
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Gestión de Crédito - Solo cuando forma_emision es CREDITO */}
          {formData.forma_emision === 'CREDITO' && (
            <div className="md:col-span-2 mt-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-amber-600" />
                <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                  Gestión de Crédito
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Costo Base al Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Base (Proveedor) *
                    <span className="block text-xs font-normal text-gray-500 mt-1">
                      Lo que debes al proveedor
                    </span>
                  </label>
                  <input
                    type="number"
                    name="costo_base_proveedor"
                    value={formData.costo_base_proveedor}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="500.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-orange-700 ${errors.costo_base_proveedor ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                  />
                  {errors.costo_base_proveedor && (
                    <p className="mt-1 text-sm text-red-600">{errors.costo_base_proveedor}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    💰 Precio del boleto en Sabre, Kiu, etc.
                  </p>
                </div>

                {/* Monto Total de Venta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Total de Venta *
                    <span className="block text-xs font-normal text-gray-500 mt-1">
                      Precio al cliente (con markup)
                    </span>
                  </label>
                  <input
                    type="number"
                    name="monto_total_venta"
                    value={formData.monto_total_venta}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="600.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-emerald-700 ${errors.monto_total_venta ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                  />
                  {errors.monto_total_venta && (
                    <p className="mt-1 text-sm text-red-600">{errors.monto_total_venta}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    💵 Precio total que pagará el cliente
                  </p>
                </div>

                {/* Pago Inicial del Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pago Inicial del Cliente *
                    <span className="block text-xs font-normal text-gray-500 mt-1">
                      Inicial que dio el cliente
                    </span>
                  </label>
                  <input
                    type="number"
                    name="pago_inicial_cliente"
                    value={formData.pago_inicial_cliente}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="200.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-blue-700 ${errors.pago_inicial_cliente ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                  />
                  {errors.pago_inicial_cliente && (
                    <p className="mt-1 text-sm text-red-600">{errors.pago_inicial_cliente}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    💳 Inicial pagada al momento de reservar
                  </p>
                </div>
              </div>

              {/* Resumen Visual de Cálculos */}
              {formData.monto_total_venta && formData.pago_inicial_cliente >= 0 && formData.costo_base_proveedor && (
                <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-amber-300 shadow-sm">
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200 max-w-xs w-full">
                    <p className="text-xs text-red-600 font-medium mb-1">Saldo Pendiente Cliente</p>
                    <p className="text-2xl font-bold text-red-700">
                      ${(parseFloat(formData.monto_total_venta || 0) -
                        parseFloat(formData.pago_inicial_cliente || 0)).toFixed(2)}
                    </p>
                    <p className="text-xs text-red-500 mt-1">Cliente te debe</p>
                  </div>
                </div>
              )}

              {/* Advertencia Informativa */}
              <div className="flex items-start gap-3 p-4 bg-amber-100 border border-amber-300 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-2">ℹ️ Importante sobre ventas a crédito:</p>
                  <p className="text-xs">
                    <strong>Cliente te debe:</strong> ${(parseFloat(formData.monto_total_venta || 0) -
                      parseFloat(formData.pago_inicial_cliente || 0)).toFixed(2)} (saldo pendiente)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 6: Comprobantes de Pago */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-indigo-600" />
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">6</span>
            <h3 className="text-lg font-bold text-gray-900">Comprobantes de Pago</h3>
          </div>
        </div>

        <div className="space-y-4">
          <FileUpload
            tipo="COMPROBANTE_PAGO"
            onFilesChange={handleComprobanteUpload}
            maxFiles={10}
            unlimited={formData.metodo_pago?.includes('Efectivo')}
            maxSizeMB={10}
          />

          {comprobantes.length > 0 && (
            <div className="space-y-2">
              {comprobantes.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeComprobante(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Guardar Vuelo
            </>
          )}
        </button>
      </div>
    </form>
  )
}
