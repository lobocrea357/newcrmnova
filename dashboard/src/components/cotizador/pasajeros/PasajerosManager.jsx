'use client'
import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Minus, Trash2, Luggage, DollarSign, Percent, CreditCard } from 'lucide-react'
import { toastSuccess, toastError, toastWarning } from '@/helpers/toasts'
import { confirmAlert } from '@/helpers/sweetAlerts'
import CollapsibleSection from '@/components/ui/CollapsibleSection'

// Categorías de pasajeros con sus configuraciones
const CATEGORIAS_PASAJEROS = {
  adultos: {
    nombre: 'Adultos',
    color: 'blue',
    icono: Users,
    descripcion: 'Pasajeros mayores de 12 años',
    precioDefault: 500,
    feeEmisionDefault: 50
  },
  niños: {
    nombre: 'Niños',
    color: 'green',
    icono: Users,
    descripcion: 'Pasajeros de 2 a 12 años',
    precioDefault: 350,
    feeEmisionDefault: 50
  },
  infantes: {
    nombre: 'Infantes',
    color: 'purple',
    icono: Users,
    descripcion: 'Pasajeros menores de 2 años',
    precioDefault: 200,
    feeEmisionDefault: 50
  }
}

// Opciones de equipaje
const EQUIPAJE_OPTIONS = [
  { value: 'completo', label: 'Completo (23Kg + 8Kg + personal)', precio: 0 },
  { value: 'mediano', label: 'Mediano (23Kg + personal)', precio: 0 },
  { value: 'ligero', label: 'Ligero (10Kg + personal)', precio: 0 },
  { value: 'ninguno', label: 'Sin equipaje', precio: 0 }
]

export default function PasajerosManager({
  value = { adultos: [], niños: [], infantes: [] },
  onChange,
  readonly = false,
  monedaPrecio = 'USD',
  monedaCotizacion = 'USD',
  monedasBase = [],
  monedasCotizacion = [],
  loadingMonedas = false,
  onMonedaPrecioChange,
  onMonedaCotizacionChange,
  aerolinea = ''
}) {
  // Usar directamente el value del padre (componente controlado)
  const pasajeros = value

  const [expandedCategories, setExpandedCategories] = useState({
    adultos: false,
    niños: false,
    infantes: false
  })

  // Estados locales para los selects (sincronizados con props)
  const [monedaPrecioLocal, setMonedaPrecioLocal] = useState(monedaPrecio)
  const [monedaCotizacionLocal, setMonedaCotizacionLocal] = useState(monedaCotizacion)

  // Sincronizar estados locales cuando cambien los props del padre
  useEffect(() => {
    setMonedaPrecioLocal(monedaPrecio)
  }, [monedaPrecio])

  useEffect(() => {
    setMonedaCotizacionLocal(monedaCotizacion)
  }, [monedaCotizacion])

  // Generar ID único para pasajeros
  const generarId = () => Date.now() + Math.random()

  // Calcular fee de emisión según aerolínea
  const calcularFeeEmision = () => {
    // Si la aerolínea es Estelar, fee es 10, sino 15
    if (aerolinea && aerolinea.toLowerCase().includes('estelar')) {
      return '10'
    }
    return '15'
  }

  // Agregar pasajero a una categoría
  const agregarPasajero = (categoria) => {
    if (readonly || !onChange) return

    const config = CATEGORIAS_PASAJEROS[categoria]
    if (!config) {
      toastError('Categoría no válida')
      return
    }

    console.log('Agregando pasajero:', categoria, config)

    const nuevoPasajero = {
      id: generarId(),
      precioPantalla: config.precioDefault,
      feeEmision: calcularFeeEmision(), // Fee automático según aerolínea
      feeAgencia: 30, // Default que puede variar por pasajero
      equipajeCompleto: true,
      equipajeMediano: false,
      equipajeLigero: false,
      monedaPrecio: monedaPrecio,
      monedaCotizacion: monedaCotizacion
    }

    console.log('Nuevo pasajero:', nuevoPasajero)

    const nuevosPasajeros = {
      ...pasajeros,
      [categoria]: [...(pasajeros[categoria] || []), nuevoPasajero]
    }
    console.log('Enviando al padre:', nuevosPasajeros)
    onChange(nuevosPasajeros)

    // Expandir automáticamente la categoría para mostrar el pasajero agregado
    setExpandedCategories(prev => ({
      ...prev,
      [categoria]: true
    }))

    toastSuccess(`${config.nombre.slice(0, -1)} agregado correctamente`)
  }

  // Eliminar pasajero
  const eliminarPasajero = async (categoria, pasajeroId) => {
    if (readonly || !onChange) return

    const resultado = await confirmAlert(
      '¿Estás seguro de eliminar este pasajero?'
    )

    if (!resultado.isConfirmed) return

    const nuevosPasajeros = {
      ...pasajeros,
      [categoria]: (pasajeros[categoria] || []).filter(p => p.id !== pasajeroId)
    }
    onChange(nuevosPasajeros)

    toastSuccess('Pasajero eliminado')
  }

  // Actualizar datos de un pasajero
  const actualizarPasajero = (categoria, pasajeroId, campo, valor) => {
    if (readonly || !onChange) return

    const nuevosPasajeros = {
      ...pasajeros,
      [categoria]: (pasajeros[categoria] || []).map(pasajero =>
        pasajero.id === pasajeroId ? { ...pasajero, [campo]: valor } : pasajero
      )
    }
    onChange(nuevosPasajeros)
  }

  // Calcular totales por categoría
  const calcularTotalesCategoria = (categoriaPasajeros) => {
    return categoriaPasajeros.reduce((totales, pasajero) => {
      const subtotal = parseFloat(pasajero.precioPantalla || 0) +
        parseFloat(pasajero.feeEmision || 0) +
        parseFloat(pasajero.feeAgencia || 0)

      return {
        cantidad: totales.cantidad + 1,
        subtotal: totales.subtotal + subtotal,
        precioBase: totales.precioBase + parseFloat(pasajero.precioPantalla || 0),
        totalFees: totales.totalFees + parseFloat(pasajero.feeEmision || 0) + parseFloat(pasajero.feeAgencia || 0)
      }
    }, { cantidad: 0, subtotal: 0, precioBase: 0, totalFees: 0 })
  }

  // Calcular gran total
  const calcularGranTotal = () => {
    let granTotal = 0
    Object.values(pasajeros).forEach(categoriaPasajeros => {
      granTotal += categoriaPasajeros.reduce((sum, pasajero) => {
        return sum + parseFloat(pasajero.precioPantalla || 0) +
          parseFloat(pasajero.feeEmision || 0) +
          parseFloat(pasajero.feeAgencia || 0)
      }, 0)
    })
    return granTotal
  }

  // Toggle categoría expandida
  const toggleCategoria = (categoria) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }))
  }

  // Renderizar tarjeta de categoría
  const renderCategoriaCard = (categoriaKey, config) => {
    const categoriaPasajeros = pasajeros[categoriaKey] || []
    const totales = calcularTotalesCategoria(categoriaPasajeros)
    const isExpanded = expandedCategories[categoriaKey]
    const Icono = config.icono

    return (
      <div className={`border-2 border-${config.color}-200 rounded-xl overflow-hidden bg-white`} key={categoriaKey}>
        {/* Header de la categoría */}
        <div className={`bg-${config.color}-50 px-3 sm:px-4 py-3 border-b border-${config.color}-200`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Icono className={`w-5 h-5 text-${config.color}-600 flex-shrink-0`} />
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">{config.nombre}</h3>
                <p className="text-xs text-gray-600 hidden sm:block">{config.descripcion}</p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              {/* Contador */}
              <div className={`px-2 sm:px-3 py-1 bg-${config.color}-100 text-${config.color}-700 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap`}>
                {totales.cantidad} pasajero{totales.cantidad !== 1 ? 's' : ''}
              </div>

              {/* Botones de acción */}
              {!readonly && (
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => agregarPasajero(categoriaKey)}
                    className={`p-2 sm:p-1.5 bg-${config.color}-500 text-white rounded-lg hover:bg-${config.color}-600 transition-colors touch-manipulation`}
                    title={`Agregar ${config.nombre.slice(0, -1)}`}
                  >
                    <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>

                  {categoriaPasajeros.length > 0 && (
                    <button
                      onClick={() => toggleCategoria(categoriaKey)}
                      className={`p-2 sm:p-1.5 bg-${config.color}-500 text-white rounded-lg hover:bg-${config.color}-600 transition-colors touch-manipulation`}
                      title={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? <Minus className="w-5 h-5 sm:w-4 sm:h-4" /> : <Plus className="w-5 h-5 sm:w-4 sm:h-4" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resumen rápido */}
          {categoriaPasajeros.length > 0 && (
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-bold text-gray-800">
                ${totales.subtotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Lista de pasajeros expandida */}
        {isExpanded && categoriaPasajeros.length > 0 && (
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {categoriaPasajeros.map((pasajero, index) => (
              <PasajeroCard
                key={pasajero.id}
                pasajero={pasajero}
                index={index + 1}
                categoria={config.nombre}
                color={config.color}
                readonly={readonly}
                onUpdate={(campo, valor) => actualizarPasajero(categoriaKey, pasajero.id, campo, valor)}
                onEliminar={() => eliminarPasajero(categoriaKey, pasajero.id)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const totalPasajeros = Object.values(pasajeros).reduce((sum, categoria) => sum + categoria.length, 0)
  const granTotal = calcularGranTotal()

  return (
    <CollapsibleSection
      title="Información de Pasajeros"
      icon={Users}
      defaultExpanded={totalPasajeros > 0}
      badge={`${totalPasajeros} pasajeros`}
    >
      <div className="space-y-4">
        {/* Sección de Monedas */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
          <h3 className="text-sm font-bold text-indigo-700 mb-3">Configuración de Monedas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <DollarSign className="w-3 h-3 inline mr-1" />
                ¿El precio introducido está en:
              </label>
              <select
                value={monedaPrecioLocal}
                onChange={(e) => {
                  const nuevoValor = e.target.value
                  // Actualizar estado local inmediatamente para UI responsiva
                  setMonedaPrecioLocal(nuevoValor)
                  // Notificar al padre
                  if (onMonedaPrecioChange) {
                    onMonedaPrecioChange(nuevoValor)
                  }
                }}
                disabled={readonly || loadingMonedas}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {loadingMonedas ? (
                  <option value="">Cargando monedas...</option>
                ) : monedasBase.length === 0 ? (
                  <>
                    <option value="USD">USD - Dólares</option>
                    <option value="EUR">EUR - Euros</option>
                  </>
                ) : (
                  monedasBase.map(moneda => (
                    <option key={moneda.value} value={moneda.value}>
                      {moneda.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CreditCard className="w-3 h-3 inline mr-1" />
                ¿En qué moneda deseas cotizar?
              </label>
              <select
                value={monedaCotizacionLocal}
                onChange={(e) => {
                  const nuevoValor = e.target.value
                  // Actualizar estado local inmediatamente para UI responsiva
                  setMonedaCotizacionLocal(nuevoValor)
                  // Notificar al padre
                  if (onMonedaCotizacionChange) {
                    onMonedaCotizacionChange(nuevoValor)
                  }
                }}
                disabled={readonly || loadingMonedas}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {loadingMonedas ? (
                  <option value="">Cargando monedas...</option>
                ) : monedasCotizacion.length === 0 ? (
                    <option value="">No hay monedas con tasas disponibles</option>
                ) : (
                      <>
                        <option value="">Seleccionar moneda de cotización</option>
                        {monedasCotizacion.map(moneda => (
                          <option key={moneda.value} value={moneda.value}>
                            {moneda.label}
                          </option>
                        ))}
                      </>
                )}
              </select>
            </div>
          </div>
        </div>
        {/* Resumen general */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total Pasajeros</p>
              <p className="text-2xl font-bold text-gray-800">{totalPasajeros}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Adultos</p>
              <p className="text-xl font-bold text-blue-600">{pasajeros.adultos.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Niños</p>
              <p className="text-xl font-bold text-green-600">{pasajeros.niños.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Infantes</p>
              <p className="text-xl font-bold text-purple-600">{pasajeros.infantes.length}</p>
            </div>
          </div>

          {totalPasajeros > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total General:</span>
                <span className="text-2xl font-bold text-blue-600">${granTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Categorías de pasajeros */}
        <div className="grid gap-4">
          {Object.entries(CATEGORIAS_PASAJEROS).map(([key, config]) =>
            renderCategoriaCard(key, config)
          )}
        </div>

        {/* Mensaje si no hay pasajeros */}
        {totalPasajeros === 0 && !readonly && (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No hay pasajeros agregados</p>
            <p className="text-sm text-gray-500 mt-1">
              Usa los botones (+) para agregar pasajeros a cada categoría
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

// Componente para tarjeta individual de pasajero
function PasajeroCard({ pasajero, index, categoria, color, readonly, onUpdate, onEliminar }) {
  return (
    <div className={`border border-${color}-200 rounded-lg p-3 bg-${color}-50/50`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800">{categoria} #{index}</h4>
        {!readonly && (
          <button
            onClick={onEliminar}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Eliminar pasajero"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Precio de Pantalla */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <DollarSign className="w-3 h-3 inline mr-1" />
            Precio Pantalla
          </label>
          <input
            type="number"
            step="0.01"
            value={pasajero.precioPantalla || ''}
            onChange={(e) => onUpdate('precioPantalla', e.target.value)}
            disabled={readonly}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Fee Emisión - Automático */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <CreditCard className="w-3 h-3 inline mr-1" />
            Fee Emisión (Automático)
          </label>
          <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50">
            <span className="font-bold text-gray-900">${pasajero.feeEmision}</span>
            <span className="text-xs text-gray-500 ml-2">
              {pasajero.feeEmision === '10' ? '(Estelar)' : '(Normal)'}
            </span>
          </div>
        </div>

        {/* Fee Agencia */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <Percent className="w-3 h-3 inline mr-1" />
            Fee Agencia
          </label>
          <input
            type="number"
            step="0.01"
            value={pasajero.feeAgencia || ''}
            onChange={(e) => onUpdate('feeAgencia', e.target.value)}
            disabled={readonly}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Equipaje */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            <Luggage className="w-3 h-3 inline mr-1" />
            Equipaje
          </label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={pasajero.equipajeCompleto || false}
                onChange={(e) => onUpdate('equipajeCompleto', e.target.checked)}
                disabled={readonly}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>Equipaje completo (23 Kg + 8 Kg + artículo personal)</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={pasajero.equipajeMediano || false}
                onChange={(e) => onUpdate('equipajeMediano', e.target.checked)}
                disabled={readonly}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>Equipaje mediano (23 Kg + artículo personal)</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={pasajero.equipajeLigero || false}
                onChange={(e) => onUpdate('equipajeLigero', e.target.checked)}
                disabled={readonly}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>Equipaje ligero (10 Kg + artículo personal)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Subtotal del pasajero */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-600">Subtotal:</span>
          <span className="font-bold text-sm text-gray-800">
            ${(parseFloat(pasajero.precioPantalla || 0) +
              parseFloat(pasajero.feeEmision || 0) +
              parseFloat(pasajero.feeAgencia || 0)).toFixed(2)}
          </span>
        </div>
        {/* Información de monedas */}
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Precios: {pasajero.monedaPrecio || 'USD'}</span>
          <span>Cotización: {pasajero.monedaCotizacion || 'USD'}</span>
        </div>
      </div>
    </div>
  )
}
