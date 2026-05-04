'use client'
import { forwardRef } from 'react'
import { Luggage, Users } from 'lucide-react'
import { getPaymentData } from '@/lib/cotizador/paymentConfig'

/**
 * Contenido del PDF de cotización (oculto visualmente, usado para generar imagen)
 */
const PdfContent = forwardRef(({
  agencia,
  origen,
  destino,
  idaVuelta,
  soloIda,
  finesMigratorios,
  fechaSalida,
  horaSalida,
  horaLlegada,
  aerolinea,
  fechaRegreso,
  horaSalidaRegreso,
  horaLlegadaRegreso,
  fechaSalidaMigratorio,
  horaSalidaMigratorio,
  horaLlegadaMigratorio,
  escalas = [],
  pasajeros,
  tienePasajerosConfigurados,
  calcularTotalPasajeros,
  monedaCotizacion,
  metodoPago,
  total,
  desglose,
  simboloMoneda
}, ref) => {
  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
      <div ref={ref} className="bg-white p-8">
        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 flex items-center justify-center overflow-hidden">
              <img
                src={agencia === 'apolo' ? '/apolo-viajes-letras-azules.png' : '/viajes-nova-morado.png'}
                alt="Logo agencia"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Cotización de Viaje
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                {agencia === 'nova' ? 'Viajes Nova' : agencia === 'colombia' ? 'Viajes Nova Colombia' : 'Apolo Viajes'}
              </h2>
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-medium">Fecha de Cotización</p>
            <p>
              {new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'America/Caracas'
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* 1. Información del Vuelo */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 pdf-section" style={{ pageBreakInside: 'avoid' }}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-700">
                Información del Vuelo
              </h3>
              <div className="flex gap-2">
                {idaVuelta && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100">
                    IDA Y VUELTA
                  </span>
                )}
                {soloIda && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                    SOLO IDA
                  </span>
                )}
                {finesMigratorios && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                    FINES MIGRATORIOS
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Trayecto General */}
              <div className="flex items-center gap-4 py-2 px-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Origen</p>
                  <p className="text-lg font-bold text-slate-800">{origen || '---'}</p>
                </div>
                <div className="h-px flex-1 bg-slate-300 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-sm" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Destino</p>
                  <p className="text-lg font-bold text-slate-800">{destino || '---'}</p>
                </div>
              </div>

              {(idaVuelta || soloIda) && (
                <div className="grid grid-cols-2 gap-8">
                  {/* Bloque Ida */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase border-b border-indigo-50 pb-1">Vuelo de Ida</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Fecha</p>
                        <p className="text-xs font-bold text-slate-700">
                          {fechaSalida ? (() => {
                            const [year, month, day] = fechaSalida.split('-')
                            return `${day}/${month}/${year}`
                          })() : '---'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase">Aerolínea</p>
                        <p className="text-xs font-bold text-slate-700">{aerolinea || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Salida</p>
                        <p className="text-xs font-bold text-slate-700">{horaSalida || '--:--'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase">Llegada</p>
                        <p className="text-xs font-bold text-slate-700">{horaLlegada || '--:--'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bloque Vuelta (Solo si aplica) */}
                  {idaVuelta ? (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-purple-600 uppercase border-b border-purple-50 pb-1">Vuelo de Vuelta</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Fecha</p>
                          <p className="text-xs font-bold text-slate-700">
                            {fechaRegreso ? (() => {
                              const [year, month, day] = fechaRegreso.split('-')
                              return `${day}/${month}/${year}`
                            })() : '---'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase">Aerolínea</p>
                          <p className="text-xs font-bold text-slate-700">{aerolinea || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Salida</p>
                          <p className="text-xs font-bold text-slate-700">{horaSalidaRegreso || '--:--'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase">Llegada</p>
                          <p className="text-xs font-bold text-slate-700">{horaLlegadaRegreso || '--:--'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      <p className="text-[10px] text-slate-400 uppercase italic">Solo Ida</p>
                    </div>
                  )}
                </div>
              )}

              {/* Fines Migratorios */}
              {finesMigratorios && (
                <div className="py-3 px-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">Fines Migratorios</p>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Aerolínea</p>
                      <p className="text-xs font-bold text-slate-700">{aerolinea || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Fecha Salida</p>
                      <p className="text-xs font-bold text-slate-700">
                        {fechaSalidaMigratorio ? (() => {
                          const [year, month, day] = fechaSalidaMigratorio.split('-')
                          return `${day}/${month}/${year}`
                        })() : '---'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Hora Salida</p>
                      <p className="text-xs font-bold text-slate-700">{horaSalidaMigratorio || '--:--'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase">Hora Llegada</p>
                      <p className="text-xs font-bold text-slate-700">{horaLlegadaMigratorio || '--:--'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Escalas */}
              {escalas && escalas.length > 0 && (
                <div className="py-3 px-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Escalas</p>
                  {escalas.map((escala, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">{index + 1}ª Escala</p>
                        <p className="text-xs font-bold text-slate-700">{escala.ciudad || '---'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase">Duración de la escala</p>
                        <p className="text-xs font-bold text-slate-700">{escala.duracion || '---'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Escalas LEGACY (compatibilidad) */}
              {!escalas && haceEscala && (
                <div className="py-3 px-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Escalas</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">1ª Escala</p>
                      <p className="text-xs font-bold text-slate-700">{ciudadEscala1 || '---'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase">Duración</p>
                      <p className="text-xs font-bold text-slate-700">{tiempoEscala1 ? `${tiempoEscala1} h` : '---'}</p>
                    </div>
                    {haceSegundaEscala && (
                      <>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">2ª Escala</p>
                          <p className="text-xs font-bold text-slate-700">{ciudadEscala2 || '---'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase">Duración</p>
                          <p className="text-xs font-bold text-slate-700">{tiempoEscala2 ? `${tiempoEscala2} h` : '---'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Desglose de Pasajeros */}
          {tienePasajerosConfigurados() ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 space-y-4 pdf-section" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-700">
                  Desglose de Pasajeros
                </h3>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                    {Object.values(pasajeros).reduce((sum, categoria) => sum + categoria.length, 0)} Total
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(pasajeros).map(([categoriaKey, categoriaPasajeros]) => {
                  if (categoriaPasajeros.length === 0) return null

                  const categoriaConfig = {
                    adultos: { nombre: 'Adultos', color: 'blue' },
                    niños: { nombre: 'Niños', color: 'green' },
                    infantes: { nombre: 'Infantes', color: 'purple' }
                  }[categoriaKey]

                  return (
                    <div key={categoriaKey} className={`bg-white rounded-lg border border-${categoriaConfig.color}-200 p-4`} style={{ pageBreakInside: 'avoid' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-bold text-${categoriaConfig.color}-700 uppercase`}>
                          {categoriaConfig.nombre} ({categoriaPasajeros.length})
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {categoriaPasajeros.map((pasajero, index) => {
                          const totalBoleto = parseFloat(pasajero.precioPantalla || 0) +
                            parseFloat(pasajero.feeEmision || 0) +
                            parseFloat(pasajero.feeAgencia || 0)

                          return (
                            <div key={pasajero.id} className="border-b border-gray-100 pb-2">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-gray-600 text-xs">#{index + 1}</span>
                                  <span className="font-bold text-gray-800 text-sm">
                                    Total Boleto: ${totalBoleto.toFixed(2)}
                                  </span>
                                </div>
                                <span className="font-bold text-gray-800 text-sm">
                                  ${totalBoleto.toFixed(2)}
                                </span>
                              </div>

                              {categoriaKey !== 'infantes' && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Luggage className="w-3 h-3 text-gray-400" />
                                  <div className="flex gap-3">
                                    {pasajero.equipajeCompleto && <span className="text-gray-500">Completo</span>}
                                    {pasajero.equipajeMediano && <span className="text-gray-500">Mediano</span>}
                                    {pasajero.equipajeLigero && <span className="text-gray-500">Ligero</span>}
                                    {!pasajero.equipajeCompleto && !pasajero.equipajeMediano && !pasajero.equipajeLigero && (
                                      <span className="text-gray-400 italic">Sin equipaje</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {categoriaKey === 'infantes' && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                                  <Luggage className="w-3 h-3" />
                                  <span>Infante no lleva equipaje</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-300 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-blue-800 uppercase">Total Pasajeros:</span>
                      <p className="text-xs text-blue-600 mt-0.5">
                        ({Object.values(pasajeros).reduce((sum, categoria) => sum + categoria.length, 0)} pasajeros)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-900">
                        {simboloMoneda}{(calcularTotalPasajeros() * (desglose?.tasaCambio || 1)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <p className="text-xs text-blue-600 mt-0.5">
                        {monedaCotizacion === 'USD' ? 'USD' :
                          monedaCotizacion === 'EUR' ? 'EUR' :
                            monedaCotizacion === 'VES' ? 'VES' :
                              monedaCotizacion === 'COP' ? 'COP' : 'USDT'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center" style={{ pageBreakInside: 'avoid' }}>
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No hay información de pasajeros disponible</p>
            </div>
          )}

          {/* 4. Servicios Incluidos (Solo para fines migratorios) */}
          {finesMigratorios && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 space-y-3 pdf-section" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-700 border-b border-amber-200 pb-2">
                Servicios Incluidos
              </h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <p className="text-xs font-bold text-slate-700">Boleto de retorno</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <p className="text-xs font-bold text-slate-700">Seguro de viaje</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <p className="text-xs font-bold text-slate-700">Reserva de hotel</p>
                </div>
              </div>
            </div>
          )}


          {/* Método de pago + datos de pago */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 pdf-section" style={{ pageBreakInside: 'avoid' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Método de pago seleccionado
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {metodoPago === 'Chase Bank Nova' || metodoPago === 'Chase Bank Apolo'
                    ? 'Chase Bank'
                    : metodoPago || 'Sin definir'}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-2 text-sm">
              {(() => {
                const datos = getPaymentData(metodoPago, agencia)
                if (!datos) {
                  return (
                    <p className="text-slate-500">
                      Los datos específicos de pago para este método aún no están configurados.
                      Por favor, consulta con tu asesor para que te los comparta.
                    </p>
                  )
                }

                if (metodoPago === 'Arcadia Service' || metodoPago === 'Scalapay' || metodoPago === 'Link de pago Revolut' || metodoPago === 'Klarna' || metodoPago === 'Revolut Grupo Travel' || metodoPago === 'TDC Viramundo') {
                  return (
                    <p className="text-slate-600 italic">
                      {datos.descripcion}
                    </p>
                  )
                }

                if (metodoPago === 'Efectivo (USD)') {
                  return (
                    <>
                      <p className="font-semibold text-slate-800">{datos.titulo}</p>
                      <p className="text-slate-600">{datos.descripcion}</p>
                      <p className="mt-2 text-xs font-medium text-slate-500">Oficinas disponibles:</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1">
                        {['San Cristóbal', 'Maracaibo', 'Caracas', 'Valencia (Parral)', 'Valencia (Torre de Seguro Los Andes)'].map((ciudad, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                            <p className="text-slate-600">{ciudad}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-slate-500 text-xs italic">Consulta con tu asesor la dirección exacta de la oficina más cercana.</p>
                    </>
                  )
                }

                return (
                  <>
                    <p className="font-semibold text-slate-800">{datos.titulo}</p>
                    <p className="text-slate-600">{datos.descripcion}</p>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
                      {datos.detalles.map((linea, idx) => (
                        <li key={idx}>{linea}</li>
                      ))}
                    </ul>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Nota al cliente */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed pdf-section" style={{ pageBreakInside: 'avoid' }}>
            Esta cotización es referencial y puede estar sujeta a cambios según
            disponibilidad, variación de tasas de cambio o condiciones del proveedor.
            Confirma siempre con tu asesor antes de realizar cualquier pago.
          </div>
        </div>
      </div>
    </div>
  )
})

PdfContent.displayName = 'PdfContent'

export default PdfContent
