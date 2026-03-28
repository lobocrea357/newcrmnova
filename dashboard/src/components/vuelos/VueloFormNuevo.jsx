'use client'
import { useState, useEffect } from 'react'
import { Plane, Users, Calendar, DollarSign, FileText, Upload, X, Copy, CheckCircle, AlertCircle, Sparkles, Loader2, MapPin, Clock } from 'lucide-react'
import { toastSuccess, toastError, toastInfo } from '@/helpers/toasts'
import { METHODS_BY_CURRENCY } from '@/lib/cotizador/paymentConfig'

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
    horario: '',
    hora_llegada: '',
    aerolinea_nombre: '',
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
    ...initialData
  })

  // Estados de pasajeros
  const [pasajeros, setPasajeros] = useState([])
  const [comprobantes, setComprobantes] = useState([])
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
        numero_pasaporte: '',
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

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toastError('Solo se permiten imágenes (JPG, PNG) o PDF')
      return
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toastError('El archivo no debe superar 10MB')
      return
    }

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
  const extractPassportData = async (index) => {
    const pasajero = pasajeros[index]
    if (!pasajero.pasaporte_file) {
      toastError('Primero debes cargar la foto del pasaporte')
      return
    }

    // Solo procesar imágenes
    if (!pasajero.pasaporte_file.type.startsWith('image/')) {
      toastError('La extracción automática solo funciona con imágenes (JPG, PNG)')
      return
    }

    try {
      setExtractingPassport(prev => ({ ...prev, [index]: true }))
      toastInfo('Analizando pasaporte con IA...')

      // Convertir imagen a base64
      const imageBase64 = await fileToBase64(pasajero.pasaporte_file)

      // Llamar al API
      const response = await fetch('/api/extract-passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

      // Actualizar campos del pasajero con los datos extraídos
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
      console.error('Error extrayendo datos del pasaporte:', error)
      toastError('Error al extraer datos: ' + error.message)
    } finally {
      setExtractingPassport(prev => ({ ...prev, [index]: false }))
    }
  }

  const agregarPasajero = () => {
    const nuevoOrden = pasajeros.length + 1
    setPasajeros(prev => [...prev, {
      id: `temp-${Date.now()}`,
      tipo: 'ADULTO',
      orden: nuevoOrden,
      nombres: '',
      apellidos: '',
      sexo: '',
      fecha_nacimiento: '',
      nacionalidad: '',
      numero_pasaporte: '',
      precio_pantalla: 0,
      fee_emision: 0,
      fee_agencia: 0,
      equipaje_completo: false,
      equipaje_mediano: false,
      equipaje_ligero: false,
      pasaporte_file: null
    }])
  }

  const eliminarPasajero = (index) => {
    setPasajeros(prev => prev.filter((_, i) => i !== index))
  }

  const handleComprobanteUpload = (e) => {
    const files = Array.from(e.target.files)

    // Verificar si el método de pago es depósito en oficina (efectivo) - sin límite de archivos
    const esDepositoEfectivo = formData.metodo_pago?.includes('Depósito oficina') || formData.metodo_pago?.includes('efectivo')

    // Validar cantidad solo si NO es depósito en efectivo
    if (!esDepositoEfectivo && comprobantes.length + files.length > 10) {
      toastError('Máximo 10 comprobantes permitidos')
      return
    }

    // Validar archivos
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) return false
      if (file.size > 10 * 1024 * 1024) return false
      return true
    })

    setComprobantes(prev => [...prev, ...validFiles])
    toastSuccess(`${validFiles.length} comprobante(s) agregado(s)`)
  }

  const removeComprobante = (index) => {
    setComprobantes(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}

    // Validaciones básicas
    if (!formData.pax_nombre.trim()) newErrors.pax_nombre = 'Nombre del PAX es requerido'
    if (!formData.contacto_nombre.trim()) newErrors.contacto_nombre = 'Contacto es requerido'
    if (!formData.contacto_telefono.trim()) newErrors.contacto_telefono = 'Teléfono es requerido'
    if (!formData.fecha_vuelo) newErrors.fecha_vuelo = 'Fecha del vuelo es requerida'
    if (!formData.ruta.trim()) newErrors.ruta = 'Ruta es requerida'
    if (!formData.proveedor.trim()) newErrors.proveedor = 'Proveedor es requerido'
    if (!formData.monto_venta || parseFloat(formData.monto_venta) <= 0) {
      newErrors.monto_venta = 'Monto de venta es requerido y debe ser mayor a 0'
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

    const submitData = {
      vuelo: {
        ...formData,
        monto_venta: parseFloat(formData.monto_venta),
        cotizacion_id: cotizacion?.id || null,
        // Validar horas para evitar strings vacíos
        horario: formData.horario && formData.horario.trim() !== '' ? formData.horario : null,
        hora_llegada: formData.hora_llegada && formData.hora_llegada.trim() !== '' ? formData.hora_llegada : null,
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
        total_cotizacion: formData.total_cotizacion ? parseFloat(formData.total_cotizacion) : null
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
        numero_pasaporte: p.numero_pasaporte || null,
        precio_pantalla: parseFloat(p.precio_pantalla) || 0,
        fee_emision: parseFloat(p.fee_emision) || 0,
        fee_agencia: parseFloat(p.fee_agencia) || 0,
        equipaje_completo: p.equipaje_completo,
        equipaje_mediano: p.equipaje_mediano,
        equipaje_ligero: p.equipaje_ligero
      })),
      pasaportes: pasajeros.map(p => p.pasaporte_file).filter(Boolean),
      comprobantes: comprobantes
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Salida del vuelo *
            </label>
            <input
              type="date"
              name="fecha_vuelo"
              value={formData.fecha_vuelo}
              onChange={handleChange}
              disabled={!!cotizacion}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${!!cotizacion ? 'bg-gray-100' : ''} ${errors.fecha_vuelo ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.fecha_vuelo && <p className="mt-1 text-sm text-red-600">{errors.fecha_vuelo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de Salida del vuelo
            </label>
            <input
              type="time"
              name="horario"
              value={formData.horario}
              onChange={handleChange}
              disabled={!!cotizacion}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!!cotizacion ? 'bg-gray-100' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de Llegada del vuelo
            </label>
            <input
              type="time"
              name="hora_llegada"
              value={formData.hora_llegada}
              onChange={handleChange}
              disabled={!!cotizacion}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!!cotizacion ? 'bg-gray-100' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ruta *
            </label>
            <input
              type="text"
              name="ruta"
              value={formData.ruta}
              onChange={handleChange}
              placeholder="Ej: BOG-MAD"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase ${errors.ruta ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.ruta && <p className="mt-1 text-sm text-red-600">{errors.ruta}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aerolínea
            </label>
            <input
              type="text"
              name="aerolinea_nombre"
              value={formData.aerolinea_nombre}
              onChange={handleChange}
              placeholder="Ej: Avianca"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

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
            <p className="mt-1 text-xs text-gray-500">Puede llenarse después si aún no se tiene</p>
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

          {/* Desglose PNR/GDS */}
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
              placeholder="Pega aquí el desglose completo de la reserva desde Sabre, Servivuelo, etc..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              style={{ fontFamily: 'monospace' }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Este desglose será usado por el equipo de emisión para emitir los boletos
            </p>
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
              placeholder="Notas adicionales..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Escalas del Vuelo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Escalas del Vuelo</h3>
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

      {/* Información Financiera */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Información Financiera</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda de Precios de Pantalla
            </label>
            <input
              type="text"
              value={formData.moneda_precio}
              disabled
              placeholder="EUR o USD"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">Solo EUR o USD (desde cotización)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda de Cotización
            </label>
            <input
              type="text"
              value={formData.moneda_cotizacion}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">Moneda en la que se cotizó</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Cambio
            </label>
            <input
              type="text"
              value={formData.tasa_cambio}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">Tasa aplicada en la cotización</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtotal
            </label>
            <input
              type="text"
              value={formData.total_cotizacion}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">Suma total de boletos en {formData.moneda_precio || 'moneda base'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Venta (Total a Pagar) *
            </label>
            <input
              type="number"
              name="monto_venta"
              value={formData.monto_venta}
              onChange={handleChange}
              disabled={!!cotizacion}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${!!cotizacion ? 'bg-gray-100' : ''} ${errors.monto_venta ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.monto_venta && <p className="mt-1 text-sm text-red-600">{errors.monto_venta}</p>}
            <p className="mt-1 text-xs text-gray-500">Subtotal con tasa aplicada = Precio final para el cliente</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
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
        </div>
      </div>

      {/* Gestión de Pasajeros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Pasajeros ({pasajeros.length})
            </h3>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° Pasaporte</label>
                  <input
                    type="text"
                    value={pasajero.numero_pasaporte}
                    onChange={(e) => handlePasajeroChange(index, 'numero_pasaporte', e.target.value)}
                    placeholder="Número de pasaporte"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                  />
                </div>

                {/* Upload Pasaporte */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pasaporte (Foto/PDF)
                  </label>
                  {!pasajero.pasaporte_file ? (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Subir pasaporte</span>
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

                      {/* Botón de Extracción Automática con IA */}
                      {pasajero.pasaporte_file.type.startsWith('image/') && (
                        <button
                          type="button"
                          onClick={() => extractPassportData(index)}
                          disabled={extractingPassport[index]}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          {extractingPassport[index] ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="font-medium">Extrayendo datos con IA...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              <span className="font-medium">✨ Extraer Datos Automáticamente (GPT-4o)</span>
                            </>
                          )}
                        </button>
                      )}

                      {pasajero.pasaporte_file.type === 'application/pdf' && (
                        <p className="text-xs text-amber-600 italic">
                          ⚠️ La extracción automática solo funciona con imágenes (JPG, PNG)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Precios (solo lectura si viene de cotización) */}
                {pasajero.cotizacion_pasajero_id && (
                  <div className="md:col-span-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-xs font-medium text-indigo-700 mb-2">Precios heredados de cotización:</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Precio Pantalla:</span>
                        <span className="font-semibold text-gray-900 ml-2">${pasajero.precio_pantalla}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fee Emisión:</span>
                        <span className="font-semibold text-gray-900 ml-2">${pasajero.fee_emision}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fee Agencia:</span>
                        <span className="font-semibold text-gray-900 ml-2">${pasajero.fee_agencia}</span>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Comprobantes de Pago */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Comprobantes de Pago</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <Upload className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-600">Subir comprobantes (máx. 10)</span>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleComprobanteUpload}
              className="hidden"
            />
          </label>

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
