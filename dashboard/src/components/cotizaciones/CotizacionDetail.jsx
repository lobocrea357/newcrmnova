'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Plane,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  CreditCard,
  Luggage,
  Users,
  CheckCircle,
  XCircle,
  Clock3,
  ArrowRight,
  PlaneTakeoff,
  Edit,
  Loader2
} from 'lucide-react'
import { COTIZACIONES_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import Swal from 'sweetalert2'

export default function CotizacionDetail({ cotizacion, onUpdate }) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  const getEstadoConfig = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return {
          color: 'text-gray-700 bg-gray-100 border-gray-300',
          icon: Clock3,
          label: 'Pendiente'
        }
      case 'EN_REVISION':
        return {
          color: 'text-yellow-700 bg-yellow-100 border-yellow-300',
          icon: Edit,
          label: 'En Revisión'
        }
      case 'APROBADA':
        return {
          color: 'text-green-700 bg-green-100 border-green-300',
          icon: CheckCircle,
          label: 'Aprobada'
        }
      case 'RECHAZADA':
        return {
          color: 'text-red-700 bg-red-100 border-red-300',
          icon: XCircle,
          label: 'Rechazada'
        }
      default:
        return {
          color: 'text-gray-700 bg-gray-100 border-gray-300',
          icon: Clock3,
          label: estado
        }
    }
  }

  const estadoConfig = getEstadoConfig(cotizacion.estado)
  const EstadoIcon = estadoConfig.icon

  const handleCambiarEstado = async (nuevoEstado) => {
    let razon = null

    // Si es rechazo, pedir motivo
    if (nuevoEstado === 'RECHAZADA') {
      const result = await Swal.fire({
        title: '¿Rechazar cotización?',
        text: 'Indica el motivo del rechazo',
        input: 'textarea',
        inputPlaceholder: 'Ej: Cliente desistió, precio muy alto, etc.',
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        confirmButtonColor: '#dc2626',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) {
            return 'Debes ingresar un motivo'
          }
        }
      })

      if (!result.isConfirmed) return
      razon = result.value
    } else {
      // Confirmación para aprobar o poner en revisión
      const confirmText = nuevoEstado === 'APROBADA'
        ? '¿Aprobar esta cotización?'
        : '¿Marcar como en revisión?'

      const result = await Swal.fire({
        title: confirmText,
        text: nuevoEstado === 'APROBADA'
          ? 'El cliente aceptó la cotización'
          : 'Marca esta cotización para revisión',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: nuevoEstado === 'APROBADA' ? 'Aprobar' : 'Marcar',
        confirmButtonColor: nuevoEstado === 'APROBADA' ? '#10b981' : '#f59e0b',
        cancelButtonText: 'Cancelar'
      })

      if (!result.isConfirmed) return
    }

    try {
      setUpdating(true)

      const response = await fetch(COTIZACIONES_API.cambiarEstado(cotizacion.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado,
          userId: cotizacion.created_by,
          razon
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cambiar estado')
      }

      toastSuccess(`Cotización marcada como ${nuevoEstado}`)
      onUpdate()

    } catch (error) {
      console.error('Error cambiando estado:', error)
      toastError(error.message || 'Error al cambiar estado')
    } finally {
      setUpdating(false)
    }
  }

  const handleCrearVenta = () => {
    // Redirigir a /ventas/vuelos/nuevo con el ID de la cotización
    router.push(`/ventas/vuelos/nuevo?cotizacion_id=${cotizacion.id}`)
  }

  const formatTipoVuelo = (tipo) => {
    switch (tipo) {
      case 'solo_ida': return 'Solo Ida'
      case 'ida_vuelta': return 'Ida y Vuelta'
      case 'migratorio': return 'Fines Migratorios'
      default: return tipo
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con Estado */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-6 h-6 text-indigo-600" />
            {cotizacion.nombre_cliente}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cotización #{cotizacion.id} • {new Date(cotizacion.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${estadoConfig.color} font-semibold`}>
          <EstadoIcon className="w-5 h-5" />
          {estadoConfig.label}
        </div>
      </div>

      {/* Información del Vuelo */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plane className="w-5 h-5 text-indigo-600" />
          Información del Vuelo
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Tipo de Vuelo</p>
            <p className="text-sm font-medium text-gray-900">{formatTipoVuelo(cotizacion.tipo_vuelo)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Aerolínea</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.aerolinea || 'No especificada'}</p>
          </div>

          <div className="col-span-2">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Ruta</p>
            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Origen</p>
                <p className="font-bold text-gray-900">{cotizacion.origen}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Destino</p>
                <p className="font-bold text-gray-900">{cotizacion.destino}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Fecha de Salida</p>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {new Date(cotizacion.fecha_salida).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </div>
          </div>

          {cotizacion.hora_salida && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Hora de Salida</p>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Clock className="w-4 h-4 text-indigo-600" />
                {cotizacion.hora_salida}
              </div>
            </div>
          )}

          {cotizacion.tiene_escala && (
            <div className="col-span-2 bg-orange-50 p-3 rounded-lg border border-orange-100">
              <p className="text-xs text-orange-700 font-semibold uppercase mb-2">Escalas</p>
              <div className="space-y-2">
                {cotizacion.escala_1_ciudad && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{cotizacion.escala_1_ciudad}</span>
                    {cotizacion.escala_1_duracion && (
                      <span className="text-gray-600 ml-2">({cotizacion.escala_1_duracion})</span>
                    )}
                  </div>
                )}
                {cotizacion.tiene_segunda_escala && cotizacion.escala_2_ciudad && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{cotizacion.escala_2_ciudad}</span>
                    {cotizacion.escala_2_duracion && (
                      <span className="text-gray-600 ml-2">({cotizacion.escala_2_duracion})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desglose de Precios */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Desglose de Precios
        </h3>

        <div className="space-y-3">
          {cotizacion.pasajeros && cotizacion.pasajeros.length > 0 ? (
            // Mostrar desglose por pasajero
            <>
              {cotizacion.pasajeros.map((pasajero, index) => (
                <div key={index} className="pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-indigo-700">
                      {pasajero.tipo} #{pasajero.orden}
                    </span>
                    <span className="font-bold text-indigo-600">
                      ${(pasajero.precio_pantalla + pasajero.fee_emision + pasajero.fee_agencia).toFixed(2)} {cotizacion.moneda_precio}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Precio Pantalla</p>
                      <p className="font-semibold text-gray-900">${pasajero.precio_pantalla?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fee Emisión</p>
                      <p className="font-semibold text-gray-900">${pasajero.fee_emision?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fee Agencia</p>
                      <p className="font-semibold text-gray-900">${pasajero.fee_agencia?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 pb-2 border-b-2 border-gray-300">
                <span className="text-sm font-medium text-gray-700">Subtotal ({cotizacion.moneda_precio})</span>
                <span className="font-semibold text-gray-900">
                  ${cotizacion.pasajeros.reduce((sum, p) => sum + p.precio_pantalla + p.fee_emision + p.fee_agencia, 0).toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            // Sin información de pasajeros - Fallback para cotizaciones antiguas
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-amber-700 font-medium text-sm">Sin información de pasajeros</p>
              <p className="text-amber-600 text-xs mt-1">
                Esta cotización fue creada antes de la actualización del sistema
              </p>
              <div className="mt-3 pt-3 border-t border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total Base:</span>
                  <span className="font-semibold text-gray-900">
                    ${cotizacion.precio_base?.toFixed(2) || '0.00'} {cotizacion.moneda_precio}
                  </span>
                </div>
              </div>
            </div>
          )}

          {cotizacion.tasa_cambio !== 1 && (
            <div className="flex justify-between items-center text-sm text-indigo-600">
              <span>Tasa de Cambio</span>
              <span className="font-semibold">× {cotizacion.tasa_cambio}</span>
            </div>
          )}

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium opacity-90">Total a Pagar</span>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  ${cotizacion.precio_final_cotizacion?.toFixed(2)}
                </p>
                <p className="text-sm opacity-80">{cotizacion.moneda_cotizacion}</p>
              </div>
            </div>
          </div>

          {cotizacion.metodo_pago && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Método de Pago</p>
                <p className="text-sm font-semibold text-gray-900">{cotizacion.metodo_pago}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pasajeros */}
     {/*  {cotizacion.pasajeros && cotizacion.pasajeros.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Pasajeros ({cotizacion.pasajeros.length})
          </h3>

          <div className="space-y-3">
            {cotizacion.pasajeros.map((pasajero, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {pasajero.tipo} #{pasajero.orden}
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    ${(pasajero.precio_pantalla + pasajero.fee_emision + pasajero.fee_agencia).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2">
                  <div>
                    <p className="text-gray-500">Precio Pantalla</p>
                    <p className="font-semibold">${pasajero.precio_pantalla?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fee Emisión</p>
                    <p className="font-semibold">${pasajero.fee_emision?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fee Agencia</p>
                    <p className="font-semibold">${pasajero.fee_agencia?.toFixed(2)}</p>
                  </div>
                </div>

                {pasajero.tipo !== 'INFANTE' && (
                  <div className="flex items-center gap-2 text-xs">
                    <Luggage className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {pasajero.equipaje_completo && 'Completo'}
                      {pasajero.equipaje_mediano && 'Mediano'}
                      {pasajero.equipaje_ligero && 'Ligero'}
                      {!pasajero.equipaje_completo && !pasajero.equipaje_mediano && !pasajero.equipaje_ligero && 'Sin equipaje'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Motivo de Rechazo (si aplica) */}
      {cotizacion.estado === 'RECHAZADA' && cotizacion.razon_rechazo && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 mb-1">Motivo de Rechazo</p>
              <p className="text-sm text-red-700">{cotizacion.razon_rechazo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 space-y-3">
        {/* Botón Editar - solo visible en EN_REVISION */}
        {cotizacion.estado === 'EN_REVISION' && (
          <button
            onClick={() => router.push(`/cotizador?edit=${cotizacion.id}`)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Editar Cotización
          </button>
        )}

        {/* Botón Aprobar - visible solo si NO está aprobada ni rechazada */}
        {cotizacion.estado !== 'APROBADA' && cotizacion.estado !== 'RECHAZADA' && (
          <button
            onClick={() => handleCambiarEstado('APROBADA')}
            disabled={updating}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                  Aprobar Cotización
              </>
            )}
          </button>
        )}

        {/* Botón Crear Venta - solo visible si está APROBADA */}
        {cotizacion.estado === 'APROBADA' && (
          <button
            onClick={handleCrearVenta}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <PlaneTakeoff className="w-5 h-5" />
            Crear Venta de Vuelo
          </button>
        )}

        {/* Botón Rechazar - visible solo si NO está rechazada ni aprobada */}
        {cotizacion.estado !== 'RECHAZADA' && cotizacion.estado !== 'APROBADA' && (
          <button
            onClick={() => handleCambiarEstado('RECHAZADA')}
            disabled={updating}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                  Rechazar Cotización
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
