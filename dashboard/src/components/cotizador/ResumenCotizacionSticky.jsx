'use client'
import { Download, Save, Users, ArrowRightLeft, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente de Resumen Sticky para el Cotizador
 * Muestra un card compacto siempre visible con el total y acciones principales
 */
export default function ResumenCotizacionSticky({
  total,
  simboloMoneda,
  monedaCotizacion,
  monedaBase,
  tasaCambio,
  pasajeros,
  desglose,
  tienePasajerosConfigurados,
  calcularTotalPasajeros,
  onExportar,
  onGuardar,
  exportingPdf,
  savingCotizacion,
  isAuthenticated,
  formatearMonto,
  theme
}) {
  const [desgloseExpandido, setDesgloseExpandido] = useState(true)

  // Calcular total de pasajeros
  const totalPasajeros = Object.values(pasajeros || {})
    .reduce((sum, cat) => sum + cat.length, 0)

  return (
    <div className="sticky top-6 space-y-4">
      {/* Card de Total Compacto - Siempre Visible */}
      <div className={`bg-gradient-to-br ${theme?.gradient || 'from-indigo-600 to-purple-700'} rounded-2xl shadow-2xl p-6 text-white transition-all duration-300 hover:shadow-3xl hover:scale-[1.01]`}>
        <div className="mb-4">
          <p className="text-sm font-medium opacity-80 mb-1">
            Total a Pagar
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight transition-all duration-300">
              {simboloMoneda}
            </span>
            <span
              key={total}
              className="text-5xl font-bold tracking-tight transition-all duration-300 animate-in fade-in-0 zoom-in-95"
            >
              {formatearMonto(total)}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm opacity-90 mb-4 pb-4 border-b border-white/20">
          {totalPasajeros > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {totalPasajeros} {totalPasajeros === 1 ? 'pasajero' : 'pasajeros'}
            </span>
          )}
          {monedaCotizacion && (
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4" />
              {monedaCotizacion}
            </span>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportar}
            disabled={!tienePasajerosConfigurados() || exportingPdf}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm
                       px-4 py-2.5 rounded-lg font-medium text-sm
                       transition-all duration-200 flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:scale-105 active:scale-95"
          >
            {exportingPdf ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Generando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </>
            )}
          </button>

          {isAuthenticated && (
            <button
              onClick={onGuardar}
              disabled={!desglose || savingCotizacion}
              className={`bg-white text-${theme?.primary || 'indigo-700'} hover:bg-slate-50
                         px-4 py-2.5 rounded-lg font-medium text-sm
                         transition-all duration-200 flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:scale-105 active:scale-95`}
            >
              {savingCotizacion ? (
                <>
                  <span className="h-4 w-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Guardar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Desglose Detallado - Colapsable */}
      {tienePasajerosConfigurados() && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header Colapsable */}
          <button
            onClick={() => setDesgloseExpandido(!desgloseExpandido)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-slate-800">
              Desglose de Pasajeros
            </h3>
            {desgloseExpandido ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Contenido del Desglose */}
          {desgloseExpandido && (
            <div className="px-6 pb-6 space-y-6">
              {Object.entries(pasajeros).map(([categoriaKey, categoriaPasajeros]) => {
                if (categoriaPasajeros.length === 0) return null

                const categoriaConfig = {
                  adultos: { nombre: 'Adultos', color: 'blue' },
                  niños: { nombre: 'Niños', color: 'green' },
                  infantes: { nombre: 'Infantes', color: 'purple' }
                }[categoriaKey]

                return (
                  <div key={categoriaKey} className="border border-slate-200 rounded-lg p-4">
                    <h4 className={`text-sm font-bold text-${categoriaConfig.color}-600 mb-3 uppercase`}>
                      {categoriaConfig.nombre} ({categoriaPasajeros.length})
                    </h4>

                    <div className="space-y-3">
                      {categoriaPasajeros.map((pasajero, index) => {
                        const precioPantalla = parseFloat(pasajero.precioPantalla || 0)
                        const feeEmision = parseFloat(pasajero.feeEmision || 0)
                        const feeAgencia = parseFloat(pasajero.feeAgencia || 0)
                        const totalBoleto = precioPantalla + feeEmision + feeAgencia

                        return (
                          <div key={pasajero.id || index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-slate-700">Pasajero #{index + 1}</span>
                              <span className="text-lg font-bold text-slate-900">
                                ${totalBoleto.toFixed(2)}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-slate-500">Precio Pantalla</p>
                                <p className="font-semibold text-slate-700">${precioPantalla.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Fee Emisión</p>
                                <p className="font-semibold text-slate-700">${feeEmision.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Fee Agencia</p>
                                <p className="font-semibold text-slate-700">${feeAgencia.toFixed(2)}</p>
                              </div>
                            </div>

                            {categoriaKey !== 'infantes' && (
                              <div className="mt-2 text-xs text-slate-600">
                                <span className="font-medium">Equipaje: </span>
                                {pasajero.equipajeCompleto && <span className="text-green-600">Completo • </span>}
                                {pasajero.equipajeMediano && <span className="text-blue-600">Mediano • </span>}
                                {pasajero.equipajeLigero && <span className="text-orange-600">Ligero</span>}
                                {!pasajero.equipajeCompleto && !pasajero.equipajeMediano && !pasajero.equipajeLigero && (
                                  <span className="text-slate-400 italic">Sin equipaje</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-300 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700">Subtotal {categoriaConfig.nombre}</span>
                      <span className="text-lg font-bold text-slate-900">
                        ${categoriaPasajeros.reduce((sum, p) =>
                          sum + parseFloat(p.precioPantalla || 0) + parseFloat(p.feeEmision || 0) + parseFloat(p.feeAgencia || 0), 0
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Total Base */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-indigo-700 font-medium">Total Base ({monedaBase})</p>
                    <p className="text-xs text-indigo-600 mt-1">
                      {totalPasajeros} {totalPasajeros === 1 ? 'pasajero' : 'pasajeros'}
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-indigo-900">
                    ${calcularTotalPasajeros().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Información de Conversión */}
              {desglose && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Tasa de Cambio
                    </span>
                    <span className="font-semibold text-indigo-600">
                      × {formatearMonto(desglose.tasaCambio)}
                    </span>
                  </div>

                  {desglose.recargoDescripcion && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-sm text-orange-700 font-medium">
                        {desglose.recargoDescripcion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estado Vacío */}
      {!tienePasajerosConfigurados() && (
        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            Agrega pasajeros para ver el desglose
          </p>
          <p className="text-sm text-slate-500 mt-1">
            El cálculo se actualizará automáticamente
          </p>
        </div>
      )}
    </div>
  )
}
