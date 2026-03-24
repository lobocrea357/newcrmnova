'use client'
import { useState, useEffect } from 'react'
import { Plane, Users, Calendar, Clock, DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import FileUpload from './FileUpload'
import { calcularFee } from '@/lib/utils/vuelos-calculations'

const TIPOS_VUELO = [
  { value: 'solo_ida', label: 'Solo Ida' },
  { value: 'ida_vuelta', label: 'Ida y Vuelta' },
  { value: 'migratorio', label: 'Fines Migratorios' }
]

const METODOS_PAGO = [
  'ZELLE',
  'TRANSFERENCIA',
  'BINANCE',
  'SCALAPAY',
  'BANCACOLOMBIA',
  'DAVIVIENDA',
  'OTRO'
]

const PROVEEDORES = [
  'SABRE VIRAMUNDO',
  'EXPEDIA',
  'BOOKING',
  'DESPEGAR',
  'OTRO'
]

export default function VueloForm({ initialData, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    pax_nombre: '',
    num_adultos: 0,
    num_ninos: 0,
    num_infantes: 0,
    contacto_nombre: '',
    contacto_telefono: '',
    fecha_vuelo: '',
    ruta: '',
    horario: '',
    aerolinea_codigo: '',
    aerolinea_nombre: '',
    localizador: '',
    proveedor: '',
    monto_venta: '',
    monto_sabre: '',
    monto_expedia: '',
    monto_emision: '',
    metodo_pago: '',
    tipo_vuelo: 'solo_ida',
    requiere_anulable: false,
    observaciones: '',
    ...initialData
  })

  const [comprobantes, setComprobantes] = useState([])
  const [pasaportes, setPasaportes] = useState([])
  const [errors, setErrors] = useState({})
  const [calculatedFee, setCalculatedFee] = useState(0)

  useEffect(() => {
    const fee = calcularFee(
      parseFloat(formData.monto_venta) || 0,
      parseFloat(formData.monto_sabre) || 0,
      parseFloat(formData.monto_expedia) || 0,
      parseFloat(formData.monto_emision) || 0
    )
    setCalculatedFee(fee)
  }, [formData.monto_venta, formData.monto_sabre, formData.monto_expedia, formData.monto_emision])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.pax_nombre.trim()) newErrors.pax_nombre = 'Nombre del PAX es requerido'
    if (formData.num_adultos + formData.num_ninos + formData.num_infantes === 0) {
      newErrors.num_adultos = 'Debe haber al menos un pasajero'
    }
    if (!formData.contacto_nombre.trim()) newErrors.contacto_nombre = 'Contacto es requerido'
    if (!formData.contacto_telefono.trim()) newErrors.contacto_telefono = 'Teléfono es requerido'
    if (!formData.fecha_vuelo) newErrors.fecha_vuelo = 'Fecha del vuelo es requerida'
    if (!formData.ruta.trim()) newErrors.ruta = 'Ruta es requerida'
    if (!formData.localizador.trim()) newErrors.localizador = 'Localizador es requerido'
    if (!formData.proveedor.trim()) newErrors.proveedor = 'Proveedor es requerido'
    if (!formData.monto_venta || parseFloat(formData.monto_venta) <= 0) {
      newErrors.monto_venta = 'Monto de venta es requerido y debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData = {
      ...formData,
      num_adultos: parseInt(formData.num_adultos) || 0,
      num_ninos: parseInt(formData.num_ninos) || 0,
      num_infantes: parseInt(formData.num_infantes) || 0,
      monto_venta: parseFloat(formData.monto_venta),
      monto_sabre: formData.monto_sabre ? parseFloat(formData.monto_sabre) : undefined,
      monto_expedia: formData.monto_expedia ? parseFloat(formData.monto_expedia) : undefined,
      monto_emision: formData.monto_emision ? parseFloat(formData.monto_emision) : undefined,
      comprobantes,
      pasaportes
    }

    await onSubmit(submitData)
  }

  const totalPax = parseInt(formData.num_adultos || 0) + parseInt(formData.num_ninos || 0) + parseInt(formData.num_infantes || 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información del PAX */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Información del PAX</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del PAX *
            </label>
            <input
              type="text"
              name="pax_nombre"
              value={formData.pax_nombre}
              onChange={handleChange}
              placeholder="Ej: FAMILIA GIMENEZ ALVAREZ"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.pax_nombre ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.pax_nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.pax_nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adultos (ADT)
            </label>
            <input
              type="number"
              name="num_adultos"
              value={formData.num_adultos}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niños (CHD)
            </label>
            <input
              type="number"
              name="num_ninos"
              value={formData.num_ninos}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Infantes (INF)
            </label>
            <input
              type="number"
              name="num_infantes"
              value={formData.num_infantes}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Total: {totalPax} pasajero{totalPax !== 1 ? 's' : ''}</span>
          </div>

          {errors.num_adultos && (
            <p className="md:col-span-2 text-sm text-red-600">{errors.num_adultos}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de Contacto *
            </label>
            <input
              type="text"
              name="contacto_nombre"
              value={formData.contacto_nombre}
              onChange={handleChange}
              placeholder="Ej: DAVID GIMENEZ"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.contacto_nombre ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.contacto_nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.contacto_nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono de Contacto *
            </label>
            <input
              type="tel"
              name="contacto_telefono"
              value={formData.contacto_telefono}
              onChange={handleChange}
              placeholder="+1234567890"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.contacto_telefono ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.contacto_telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.contacto_telefono}</p>
            )}
          </div>
        </div>
      </div>

      {/* Detalles del Vuelo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Plane className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Detalles del Vuelo</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del Vuelo *
            </label>
            <input
              type="date"
              name="fecha_vuelo"
              value={formData.fecha_vuelo}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.fecha_vuelo ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fecha_vuelo && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha_vuelo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horario
            </label>
            <input
              type="time"
              name="horario"
              value={formData.horario}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.ruta ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.ruta && (
              <p className="mt-1 text-sm text-red-600">{errors.ruta}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código IATA Aerolínea
            </label>
            <input
              type="text"
              name="aerolinea_codigo"
              value={formData.aerolinea_codigo}
              onChange={handleChange}
              placeholder="Ej: AV"
              maxLength="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Aerolínea
            </label>
            <input
              type="text"
              name="aerolinea_nombre"
              value={formData.aerolinea_nombre}
              onChange={handleChange}
              placeholder="Ej: Avianca"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localizador (LOC/PNR) *
            </label>
            <input
              type="text"
              name="localizador"
              value={formData.localizador}
              onChange={handleChange}
              placeholder="Ej: EFDYYO"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase ${
                errors.localizador ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.localizador && (
              <p className="mt-1 text-sm text-red-600">{errors.localizador}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor *
            </label>
            <select
              name="proveedor"
              value={formData.proveedor}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.proveedor ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar proveedor</option>
              {PROVEEDORES.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            {errors.proveedor && (
              <p className="mt-1 text-sm text-red-600">{errors.proveedor}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información Financiera */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Información Financiera</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Venta *
            </label>
            <input
              type="number"
              name="monto_venta"
              value={formData.monto_venta}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.monto_venta ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.monto_venta && (
              <p className="mt-1 text-sm text-red-600">{errors.monto_venta}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              name="metodo_pago"
              value={formData.metodo_pago}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar método</option>
              {METODOS_PAGO.map(metodo => (
                <option key={metodo} value={metodo}>{metodo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Sabre
            </label>
            <input
              type="number"
              name="monto_sabre"
              value={formData.monto_sabre}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Expedia
            </label>
            <input
              type="number"
              name="monto_expedia"
              value={formData.monto_expedia}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Emisión
            </label>
            <input
              type="number"
              name="monto_emision"
              value={formData.monto_emision}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Fee Calculado:</span>
              <span className="text-lg font-bold text-purple-600">
                ${calculatedFee.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control de Anulables */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Control de Anulables</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Vuelo *
            </label>
            <select
              name="tipo_vuelo"
              value={formData.tipo_vuelo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {TIPOS_VUELO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="requiere_anulable"
                checked={formData.requiere_anulable}
                onChange={handleChange}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Requiere seguimiento de anulación
              </span>
            </label>
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
              placeholder="Notas adicionales sobre el vuelo..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Adjuntos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Adjuntos</h3>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Comprobantes de Pago
              {(formData.metodo_pago?.includes('Depósito oficina') || formData.metodo_pago?.includes('efectivo')) && (
                <span className="ml-2 text-xs text-green-600 font-medium">(Sin límite para pago en efectivo)</span>
              )}
            </h4>
            <FileUpload
              tipo="COMPROBANTE_PAGO"
              onFilesChange={setComprobantes}
              maxFiles={5}
              unlimited={formData.metodo_pago?.includes('Depósito oficina') || formData.metodo_pago?.includes('efectivo')}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pasaportes</h4>
            <FileUpload
              tipo="PASAPORTE"
              onFilesChange={setPasaportes}
              maxFiles={10}
            />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
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
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
