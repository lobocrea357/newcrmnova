'use client'
import { useState, useEffect } from 'react'
import { Plane, Users, DollarSign, FileText, Upload, X, CheckCircle, AlertCircle, Sparkles, Loader2, MapPin, Clock, Edit3, History } from 'lucide-react'
import { toastSuccess, toastError, toastInfo } from '@/helpers/toasts'
import Swal from 'sweetalert2'

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

export default function VueloFormEditar({
  vuelo,
  pasajeros: pasajerosIniciales,
  onSubmit,
  isLoading,
  edicionesDisponibles,
  esGerente = false
}) {
  // Estados del formulario principal
  const [formData, setFormData] = useState({
    pax_nombre: vuelo?.pax_nombre || '',
    contacto_nombre: vuelo?.contacto_nombre || '',
    contacto_telefono: vuelo?.contacto_telefono || '',
    fecha_vuelo: vuelo?.fecha_vuelo || '',
    ruta: vuelo?.ruta || '',
    horario: vuelo?.horario || '',
    hora_llegada: vuelo?.hora_llegada || '',
    aerolinea_nombre: vuelo?.aerolinea_nombre || '',
    aerolinea_codigo: vuelo?.aerolinea_codigo || '',
    localizador: vuelo?.localizador || '',
    proveedor: vuelo?.proveedor || '',
    tipo_vuelo: vuelo?.tipo_vuelo || 'ida_vuelta',
    pnr_desglose: vuelo?.pnr_desglose || '',
    observaciones: vuelo?.observaciones || '',
    // Escalas
    tiene_escala: vuelo?.tiene_escala || false,
    escala_1_ciudad: vuelo?.escala_1_ciudad || '',
    escala_1_duracion: vuelo?.escala_1_duracion || '',
    tiene_segunda_escala: vuelo?.tiene_segunda_escala || false,
    escala_2_ciudad: vuelo?.escala_2_ciudad || '',
    escala_2_duracion: vuelo?.escala_2_duracion || '',
    // Info Financiera (readonly)
    moneda_precio: vuelo?.moneda_precio || '',
    moneda_cotizacion: vuelo?.moneda_cotizacion || '',
    tasa_cambio: vuelo?.tasa_cambio || '',
    total_cotizacion: vuelo?.total_cotizacion || '',
    monto_venta: vuelo?.monto_venta || '',
    metodo_pago: vuelo?.metodo_pago || ''
  })

  // Estados de pasajeros
  const [pasajeros, setPasajeros] = useState([])
  const [comprobantesNuevos, setComprobantesNuevos] = useState([])
  const [pasaportesNuevos, setPasaportesNuevos] = useState({})
  const [errors, setErrors] = useState({})
  const [extractingPassport, setExtractingPassport] = useState({})

  // Cargar pasajeros iniciales
  useEffect(() => {
    if (pasajerosIniciales && pasajerosIniciales.length > 0) {
      setPasajeros(pasajerosIniciales.map(p => ({
        ...p,
        // Preservar tipo de documento existente o inferir de datos disponibles
        tipo_documento: p.tipo_documento || (p.numero_pasaporte ? 'PASAPORTE' : 'PASAPORTE'),
        numero_cedula: p.numero_cedula || '',
        pais_emision_cedula: p.pais_emision_cedula || 'Venezuela',
        pasaporte_file_nuevo: null
      })))
    }
  }, [pasajerosIniciales])

  // Calcular subtotal dinámico
  const calcularSubtotal = () => {
    return pasajeros.reduce((total, p) => {
      const precio = parseFloat(p.precio_pantalla) || 0
      const feeEmision = parseFloat(p.fee_emision) || 0
      const feeAgencia = parseFloat(p.fee_agencia) || 0
      return total + precio + feeEmision + feeAgencia
    }, 0)
  }

  // Calcular monto de venta dinámico
  const calcularMontoVenta = () => {
    const subtotal = calcularSubtotal()
    const tasa = parseFloat(formData.tasa_cambio) || 1
    if (formData.moneda_precio !== formData.moneda_cotizacion && tasa > 0) {
      return subtotal * tasa
    }
    return subtotal
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toastError('Solo se permiten imágenes (JPG, PNG) o PDF')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError('El archivo no debe superar 10MB')
      return
    }

    handlePasajeroChange(index, 'pasaporte_file_nuevo', file)
    setPasaportesNuevos(prev => ({ ...prev, [index]: file }))
    toastSuccess(`Nuevo pasaporte cargado: ${file.name}`)
  }

  const removePasaporteNuevo = (index) => {
    handlePasajeroChange(index, 'pasaporte_file_nuevo', null)
    setPasaportesNuevos(prev => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const extractPassportData = async (index) => {
    const pasajero = pasajeros[index]
    const file = pasajero.pasaporte_file_nuevo
    
    if (!file) {
      toastError('Primero debes cargar la foto del pasaporte')
      return
    }

    if (!file.type.startsWith('image/')) {
      toastError('La extracción automática solo funciona con imágenes')
      return
    }

    try {
      setExtractingPassport(prev => ({ ...prev, [index]: true }))
      toastInfo('Analizando pasaporte con IA...')

      const imageBase64 = await fileToBase64(file)
      const response = await fetch('/api/extract-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
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
      setPasajeros(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          nombres: extracted.nombres || updated[index].nombres,
          apellidos: extracted.apellidos || updated[index].apellidos,
          numero_pasaporte: extracted.numero_pasaporte || updated[index].numero_pasaporte,
          nacionalidad: extracted.nacionalidad || updated[index].nacionalidad,
          sexo: extracted.sexo || updated[index].sexo,
          fecha_nacimiento: extracted.fecha_nacimiento || updated[index].fecha_nacimiento
        }
        return updated
      })

      if (extracted.confidence === 'high') {
        toastSuccess('✅ Datos extraídos correctamente. Por favor verifica.')
      } else {
        toastInfo('⚠️ Verifica los datos extraídos manualmente.')
      }
    } catch (error) {
      console.error('Error extrayendo datos:', error)
      toastError('Error al extraer datos: ' + error.message)
    } finally {
      setExtractingPassport(prev => ({ ...prev, [index]: false }))
    }
  }

  const handleComprobanteUpload = (e) => {
    const files = Array.from(e.target.files)
    
    if (comprobantesNuevos.length + files.length > 10) {
      toastError('Máximo 10 comprobantes nuevos permitidos')
      return
    }

    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) return false
      if (file.size > 10 * 1024 * 1024) return false
      return true
    })

    setComprobantesNuevos(prev => [...prev, ...validFiles])
    toastSuccess(`${validFiles.length} comprobante(s) agregado(s)`)
  }

  const removeComprobanteNuevo = (index) => {
    setComprobantesNuevos(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.pax_nombre.trim()) newErrors.pax_nombre = 'Nombre del PAX es requerido'
    if (!formData.contacto_nombre.trim()) newErrors.contacto_nombre = 'Contacto es requerido'
    if (!formData.contacto_telefono.trim()) newErrors.contacto_telefono = 'Teléfono es requerido'
    if (!formData.fecha_vuelo) newErrors.fecha_vuelo = 'Fecha del vuelo es requerida'
    if (!formData.ruta.trim()) newErrors.ruta = 'Ruta es requerida'
    if (!formData.proveedor.trim()) newErrors.proveedor = 'Proveedor es requerido'

    if (pasajeros.length === 0) {
      newErrors.pasajeros = 'Debe haber al menos un pasajero'
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

    // Mostrar SweetAlert para razón de edición
    const { value: razonEdicion, isConfirmed } = await Swal.fire({
      title: '✏️ Razón de la Edición',
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600 mb-3">
            Por favor, indica la razón por la cual estás editando este vuelo.
            <strong>Debe ser una explicación clara y coherente.</strong>
          </p>
          ${!esGerente ? `
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p class="text-sm text-amber-700">
                ⚠️ Te quedan <strong>${edicionesDisponibles}</strong> intento(s) de edición.
              </p>
            </div>
          ` : ''}
        </div>
      `,
      input: 'textarea',
      inputPlaceholder: 'Ej: Corrección de nombre del pasajero por error de digitación...',
      inputAttributes: {
        'aria-label': 'Razón de edición',
        minlength: 10
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'La razón debe tener al menos 10 caracteres'
        }
      }
    })

    if (!isConfirmed) {
      return
    }

    // Calcular nuevos totales
    const nuevoSubtotal = calcularSubtotal()
    const nuevoMontoVenta = calcularMontoVenta()

    const submitData = {
      vuelo: {
        ...formData,
        total_cotizacion: nuevoSubtotal,
        monto_venta: nuevoMontoVenta,
        horario: formData.horario?.trim() || null,
        hora_llegada: formData.hora_llegada?.trim() || null
      },
      pasajeros: pasajeros.map(p => ({
        id: p.id,
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
        fee_agencia: parseFloat(p.fee_agencia) || 0,
        equipaje_completo: p.equipaje_completo,
        equipaje_mediano: p.equipaje_mediano,
        equipaje_ligero: p.equipaje_ligero
      })),
      pasaportesNuevos: Object.entries(pasaportesNuevos).map(([index, file]) => ({
        pasajero_id: pasajeros[index]?.id,
        file
      })),
      comprobantesNuevos,
      razon_edicion: razonEdicion.trim()
    }

    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner de edición */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Edit3 className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="font-bold text-amber-800">Modo Edición</h3>
            <p className="text-sm text-amber-700">
              {esGerente 
                ? 'Como gerente/admin, puedes editar sin límite de intentos.'
                : `Te quedan ${edicionesDisponibles} intento(s) de edición para este vuelo.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Información del Vuelo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Plane className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Información del Vuelo</h3>
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.pax_nombre ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.pax_nombre && <p className="mt-1 text-sm text-red-600">{errors.pax_nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contacto *</label>
            <input
              type="text"
              name="contacto_nombre"
              value={formData.contacto_nombre}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.contacto_nombre ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
            <input
              type="tel"
              name="contacto_telefono"
              value={formData.contacto_telefono}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.contacto_telefono ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Salida *</label>
            <input
              type="date"
              name="fecha_vuelo"
              value={formData.fecha_vuelo}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.fecha_vuelo ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Salida</label>
            <input
              type="time"
              name="horario"
              value={formData.horario || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Llegada</label>
            <input
              type="time"
              name="hora_llegada"
              value={formData.hora_llegada || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ruta *</label>
            <input
              type="text"
              name="ruta"
              value={formData.ruta}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase ${errors.ruta ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aerolínea</label>
            <input
              type="text"
              name="aerolinea_nombre"
              value={formData.aerolinea_nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localizador (LOC/PNR)</label>
            <input
              type="text"
              name="localizador"
              value={formData.localizador}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor *</label>
            <select
              name="proveedor"
              value={formData.proveedor}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.proveedor ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar</option>
              {PROVEEDORES.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vuelo</label>
            <select
              name="tipo_vuelo"
              value={formData.tipo_vuelo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {TIPOS_VUELO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desglose Completo de Reserva (PNR/GDS)
            </label>
            <textarea
              name="pnr_desglose"
              value={formData.pnr_desglose}
              onChange={handleChange}
              rows="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Información Financiera (READONLY) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Información Financiera</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Campos no editables</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Moneda Precio</label>
            <input
              type="text"
              value={formData.moneda_precio || '-'}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Moneda Cotización</label>
            <input
              type="text"
              value={formData.moneda_cotizacion || '-'}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Tasa de Cambio</label>
            <input
              type="text"
              value={formData.tasa_cambio || '-'}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Método de Pago</label>
            <input
              type="text"
              value={formData.metodo_pago || '-'}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Subtotal ({formData.moneda_precio || 'USD'})
            </label>
            <input
              type="text"
              value={calcularSubtotal().toFixed(2)}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 font-semibold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Total a Pagar ({formData.moneda_cotizacion || 'USD'})
            </label>
            <input
              type="text"
              value={calcularMontoVenta().toFixed(2)}
              disabled
              className="w-full px-4 py-2 border border-emerald-200 rounded-lg bg-emerald-50 text-emerald-700 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Gestión de Pasajeros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">
            Pasajeros ({pasajeros.length})
          </h3>
        </div>

        <div className="space-y-4">
          {pasajeros.map((pasajero, index) => (
            <div key={pasajero.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  Pasajero #{index + 1} - {pasajero.tipo}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <input
                    type="text"
                    value={pasajero.nombres || ''}
                    onChange={(e) => handlePasajeroChange(index, 'nombres', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={pasajero.apellidos || ''}
                    onChange={(e) => handlePasajeroChange(index, 'apellidos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    value={pasajero.sexo || ''}
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
                    value={pasajero.fecha_nacimiento || ''}
                    onChange={(e) => handlePasajeroChange(index, 'fecha_nacimiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={pasajero.nacionalidad || ''}
                    onChange={(e) => handlePasajeroChange(index, 'nacionalidad', e.target.value)}
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
                        <p className="font-medium mb-1">¿Cambiaste de C.I. a Pasaporte?</p>
                        <p>Actualiza el tipo de documento y el número cuando obtengas el pasaporte.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Precios editables */}
                <div className="md:col-span-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs font-medium text-indigo-700 mb-3">💰 Precios del boleto (editables):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Precio Pantalla</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pasajero.precio_pantalla || 0}
                        onChange={(e) => handlePasajeroChange(index, 'precio_pantalla', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fee Emisión</label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm font-semibold">
                        ${pasajero.fee_emision || 0}
                        <span className="text-xs text-gray-400 ml-1">(fijo)</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fee Agencia</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pasajero.fee_agencia || 0}
                        onChange={(e) => handlePasajeroChange(index, 'fee_agencia', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subtotal</label>
                      <div className="px-3 py-2 bg-emerald-100 border border-emerald-300 rounded text-sm font-bold text-emerald-700">
                        ${(parseFloat(pasajero.precio_pantalla || 0) + parseFloat(pasajero.fee_emision || 0) + parseFloat(pasajero.fee_agencia || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nuevo documento */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cambiar {pasajero.tipo_documento === 'PASAPORTE' ? 'Pasaporte' : 'Cédula'} (opcional)
                  </label>
                  {!pasajero.pasaporte_file_nuevo ? (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Subir nuevo {pasajero.tipo_documento === 'PASAPORTE' ? 'pasaporte' : 'documento de cédula'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handlePasaporteUpload(index, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700">{pasajero.pasaporte_file_nuevo.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePasaporteNuevo(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                        {/* Extracción IA solo para pasaportes */}
                        {pasajero.tipo_documento === 'PASAPORTE' && pasajero.pasaporte_file_nuevo.type.startsWith('image/') && (
                        <button
                          type="button"
                          onClick={() => extractPassportData(index)}
                          disabled={extractingPassport[index]}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                        >
                          {extractingPassport[index] ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Extrayendo datos...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                                  <span>✨ Extraer Datos del Pasaporte (GPT-4o)</span>
                            </>
                          )}
                        </button>
                      )}

                        {pasajero.tipo_documento === 'CEDULA' && (
                          <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              La extracción automática está disponible solo para pasaportes.
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nuevos Comprobantes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Agregar Nuevos Comprobantes</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <Upload className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-600">Subir nuevos comprobantes</span>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleComprobanteUpload}
              className="hidden"
            />
          </label>

          {comprobantesNuevos.length > 0 && (
            <div className="space-y-2">
              {comprobantesNuevos.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeComprobanteNuevo(index)}
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
          className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Edit3 className="w-5 h-5" />
              Guardar Edición
            </>
          )}
        </button>
      </div>
    </form>
  )
}
