'use client'
import { useState, useEffect } from 'react'
import { Calculator, DollarSign, Percent, CreditCard, TrendingUp, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function CotizadorForm({ isAuthenticated = false }) {
  const [precioBase, setPrecioBase] = useState('')
  const [feeEmision, setFeeEmision] = useState('')
  const [feeAgencia, setFeeAgencia] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [moneda, setMoneda] = useState('')
  const [tasaCambio, setTasaCambio] = useState('')
  const [total, setTotal] = useState(0)
  const [desglose, setDesglose] = useState(null)

  // Estado para tasas dinámicas
  const [tasasDb, setTasasDb] = useState({})
  const [loadingTasas, setLoadingTasas] = useState(true)

  const metodosPago = [
    'Scalapay',
    'Depósitos en dólares',
    'Binance (USDT)',
    'Arcadia Service',
    'Zelle',
    'Bancolombia',
    'Davivienda',
    'Cuenta en Euros',
    'Banesco Panamá',
    'BNC (Banco Nacional de Crédito)',
    'Pago móvil'
  ]

  const monedas = [
    { value: 'USD', label: 'Dólares (USD)', symbol: '$' },
    { value: 'VES', label: 'Bolívares (VES)', symbol: 'Bs.' },
    { value: 'USDT', label: 'USDT', symbol: '₮' },
    { value: 'EUR', label: 'Euros (EUR)', symbol: '€' },
    { value: 'COP', label: 'Pesos Colombianos (COP)', symbol: '$' }
  ]

  // Cargar tasas al iniciar
  useEffect(() => {
    fetchTasas()
  }, [])

  const fetchTasas = async () => {
    try {
      setLoadingTasas(true)
      const { data, error } = await supabase
        .from('tasas_monedas')
        .select('moneda_codigo, tasa_conversion')

      if (error) {
        console.error('Error fetching rates:', error)
        return
      }

      if (data) {
        const tasasMap = {}
        data.forEach(t => {
          tasasMap[t.moneda_codigo] = t.tasa_conversion
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

  // Manejar cambio de método de pago (Reglas de Moneda implícita)
  useEffect(() => {
    if (!metodoPago) {
      setMoneda('')
      return
    }

    // Pesos Colombianos
    if (metodoPago === 'Davivienda' || metodoPago === 'Bancolombia') {
      setMoneda('COP')
      return
    }

    // Dólares
    if (
      metodoPago === 'Depósitos en dólares' ||
      metodoPago === 'Binance (USDT)' ||
      metodoPago === 'Zelle' ||
      metodoPago === 'Arcadia Service' ||
      metodoPago === 'Banesco Panamá'
    ) {
      setMoneda('USD')
      return
    }

    // Euros
    if (metodoPago === 'Cuenta en Euros' || metodoPago === 'Scalapay') {
      setMoneda('EUR')
      return
    }

    // Bolívares
    if (
      metodoPago === 'Pago móvil' ||
      metodoPago === 'BNC (Banco Nacional de Crédito)'
    ) {
      setMoneda('VES')
      return
    }
  }, [metodoPago])

  // Actualizar tasa cuando se cambia la moneda
  useEffect(() => {
    if (moneda) {
      // Si existe en DB, usar esa. Si no, usar 1 o mantener la actual
      const tasaDb = tasasDb[moneda]
      if (tasaDb) {
        setTasaCambio(tasaDb.toString())
      } else {
        // Valores por defecto si no hay DB
        if (moneda === 'USD' || moneda === 'USDT') setTasaCambio('1')
        else setTasaCambio('')
      }
    }
  }, [moneda, tasasDb])

  // Recalcular cuando cambian los inputs
  useEffect(() => {
    if ((precioBase || feeEmision || feeAgencia) && tasaCambio) {
      calcularCotizacion()
    }
  }, [precioBase, feeEmision, feeAgencia, tasaCambio, metodoPago])

  const calcularCotizacion = () => {
    const precio = parseFloat(precioBase) || 0
    const emision = parseFloat(feeEmision) || 0
    const agencia = parseFloat(feeAgencia) || 0
    const tasa = parseFloat(tasaCambio) || 1

    const subtotal = precio + emision + agencia
    let totalCalculado = subtotal * tasa
    let recargoDescripcion = ''
    let totalConRecargo = totalCalculado

    // Reglas de Métodos de Pago
    if (metodoPago === 'Scalapay') {
      // +10.3%
      const recargo = totalCalculado * 0.103
      totalConRecargo = totalCalculado + recargo
      recargoDescripcion = `+10.3% Scalapay (${formatearMonto(recargo)} ${monedas.find(m => m.value === moneda)?.symbol})`
    } else if (metodoPago === 'Arcadia Service') {
      // +5.6% + 10 USD (Asumiendo moneda es USD)
      const porcentaje = totalCalculado * 0.056
      const fijo = 10
      totalConRecargo = totalCalculado + porcentaje + fijo
      recargoDescripcion = `+5.6% + $10 Arcadia (${formatearMonto(porcentaje + fijo)} USD)`
    } else if (metodoPago === 'Depósitos en dólares') {
      // +3.5% solo para Depósitos en dólares
      const recargo = totalCalculado * 0.035
      totalConRecargo = totalCalculado + recargo
      const simbolo = monedas.find(m => m.value === moneda)?.symbol || '$'
      recargoDescripcion = `+3.5% Depósito en dólares (${simbolo} ${formatearMonto(recargo)})`
    }

    // Impuesto gobierno Colombia: por cada 1000 COP se suman 4 COP
    let impuestoGobierno = 0
    const totalAntesImpuestoGobierno = totalConRecargo

    if (moneda === 'COP') {
      // Impuesto 4x1000 = 0.4% del monto total, redondeado al peso más cercano
      impuestoGobierno = Math.round(totalConRecargo * 0.004)
      totalConRecargo = totalConRecargo + impuestoGobierno
    }

    console.log('Impuesto gobierno (COP):', impuestoGobierno)
    console.log('Total antes impuesto gobierno (COP):', totalAntesImpuestoGobierno)
    console.log('Total final con impuesto gobierno (COP):', totalConRecargo)

    setDesglose({
      precioBase: precio,
      feeEmision: emision,
      feeAgencia: agencia,
      subtotal: subtotal,
      tasaCambio: tasa,
      totalPrevio: totalCalculado, // Total antes de recargos
      recargoDescripcion: recargoDescripcion,
      totalAntesImpuestoGobierno,
      impuestoGobierno,
      totalFinal: totalConRecargo
    })

    setTotal(totalConRecargo)
  }

  const monedaSeleccionada = monedas.find(m => m.value === moneda)
  const simboloMoneda = monedaSeleccionada?.symbol || '$'

  const monedaForzada =
    metodoPago === 'Arcadia Service' ||
    metodoPago === 'BNC (Banco Nacional de Crédito)' ||
    metodoPago === 'Depósitos en dólares' ||
    metodoPago === 'Binance (USDT)' ||
    metodoPago === 'Zelle' ||
    metodoPago === 'Banesco Panamá' ||
    metodoPago === 'Davivienda' ||
    metodoPago === 'Bancolombia' ||
    metodoPago === 'Cuenta en Euros' ||
    metodoPago === 'Scalapay' ||
    metodoPago === 'Pago móvil'

  const formatearMonto = (valor) => {
    if (!valor && valor !== 0) return '0.00'
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor)
  }

  const handleLimpiar = () => {
    setPrecioBase('')
    setFeeEmision('')
    setFeeAgencia('')
    setMetodoPago('')
    setMoneda('')
    setTasaCambio('')
    setTotal(0)
    setDesglose(null)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            Datos de Cotización
          </h2>
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

        <div className="space-y-5">
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

          <div>
            <label className="text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Método de Pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Seleccionar método</option>
              {metodosPago.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
            {metodoPago === 'Depósitos en dólares' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">
                Moneda forzada a USD (+3.5% comisión depósito)
              </p>
            )}
            {metodoPago === 'Arcadia Service' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Moneda forzada a USD (+5.6% + $10)</p>
            )}
            {metodoPago === 'BNC (Banco Nacional de Crédito)' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Moneda forzada a VES</p>
            )}
            {metodoPago === 'Scalapay' && (
              <p className="text-xs text-orange-600 mt-1 ml-2 font-medium">Recargo de +10.3% aplicado</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Configuración de Moneda
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Moneda a Convertir
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  disabled={monedaForzada}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Seleccionar moneda</option>
                  {monedas.map((mon) => (
                    <option key={mon.value} value={mon.value}>
                      {mon.label} - {tasasDb[mon.value] ? `(Tasa: ${tasasDb[mon.value]})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-black bg-white rounded px-2 py-1 mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Tasa de Cambio {moneda && `(${moneda})`}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={tasaCambio}
                    readOnly={true}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-0"
                    title="La tasa se gestiona desde la pestaña 'Gestionar Tasas'"
                  />
                </div>
                {isAuthenticated && (
                  <p className="mt-1 text-xs text-slate-500">
                    Para cambiar la tasa, ve a la pestaña "Gestionar Tasas"
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleLimpiar}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Limpiar calculadora
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="sticky top-6">
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

          <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white mt-6">
            <h3 className="text-lg font-medium mb-2 opacity-90">Total a Pagar</h3>
            <div className="text-5xl font-bold mb-4">
              {simboloMoneda} {formatearMonto(total)}
            </div>
            {monedaSeleccionada && (
              <p className="text-sm opacity-80">
                {monedaSeleccionada.label}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
