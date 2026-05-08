'use client'
import { useState } from 'react'
import {
  Eye,
  CheckCircle,
  CreditCard,
  Package,
  Edit2,
  Calendar,
  Users
} from 'lucide-react'
import { formatearFechaCorta } from '@/helpers/dateHelpers'
import InlineAccountEditor from './InlineAccountEditor'

export default function EmisionVueloCard({
  vuelo,
  userId,
  onCuentaChanged,
  onAutorizar,
  onVerDetalles
}) {
  const [isEditingCuenta, setIsEditingCuenta] = useState(false)

  const handleCuentaGuardada = (vueloActualizado) => {
    setIsEditingCuenta(false)
    onCuentaChanged(vueloActualizado)
  }

  // Determinar color según forma_emision
  const formaEmisionColor = vuelo.forma_emision === 'CONTADO'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-amber-100 text-amber-800 border-amber-200'

  const formaEmisionIcon = vuelo.forma_emision === 'CONTADO' ? '💵' : '📋'

  const bordeSuperiorColor = vuelo.forma_emision === 'CONTADO'
    ? 'border-t-4 border-t-emerald-500'
    : 'border-t-4 border-t-amber-500'

  return (
    <div className={`bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${bordeSuperiorColor}`}>
      {/* Header: Info Principal */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {vuelo.pax_nombre}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                {vuelo.localizador || 'Sin LOC'}
              </code>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">{vuelo.ruta}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${parseFloat(vuelo.monto_venta || 0).toFixed(2)}
            </p>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-1 ${formaEmisionColor}`}>
              <span>{formaEmisionIcon}</span>
              {vuelo.forma_emision || 'N/A'}
            </span>
          </div>
        </div>

        {/* Ruta y Fecha */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500 text-xs block">Fecha vuelo</span>
              <p className="font-medium text-gray-900">{formatearFechaCorta(vuelo.fecha_vuelo)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500 text-xs block">Pasajeros</span>
              <p className="font-medium text-gray-900">{vuelo.pasajeros?.length || 0} PAX</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body: Detalles Clave */}
      <div className="p-5 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-4">
          {/* Método de Pago */}
          <div className="flex items-start gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Método Pago Cliente</span>
              <p className="text-sm font-semibold text-gray-900">{vuelo.metodo_pago || 'N/A'}</p>
            </div>
          </div>

          {/* Proveedor */}
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Proveedor Reserva</span>
              <p className="text-sm font-semibold text-gray-900">{vuelo.proveedor || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cuenta Section: Editable */}
      <div className="p-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Cuenta de Emisión Asignada</span>
            <p className="text-sm font-bold text-indigo-900">{vuelo.cuenta_emision_asignada || 'Sin asignar'}</p>
          </div>
          {!isEditingCuenta && (
            <button
              onClick={() => setIsEditingCuenta(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>

        {vuelo.cuenta_emision_original && vuelo.cuenta_emision_original !== vuelo.cuenta_emision_asignada && (
          <p className="text-xs text-gray-500">
            Original: <span className="font-medium">{vuelo.cuenta_emision_original}</span>
          </p>
        )}

        {/* Editor Inline */}
        {isEditingCuenta && (
          <InlineAccountEditor
            vueloId={vuelo.id}
            cuentaActual={vuelo.cuenta_emision_asignada}
            formaEmision={vuelo.forma_emision}
            userId={userId}
            onSave={handleCuentaGuardada}
            onCancel={() => setIsEditingCuenta(false)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 flex gap-2 border-t border-gray-100">
        <button
          onClick={() => onAutorizar(vuelo.id)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Aprobar Emisión
        </button>
        <button
          onClick={() => onVerDetalles(vuelo)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Eye className="w-4 h-4" />
          Ver Detalles
        </button>
      </div>
    </div>
  )
}
