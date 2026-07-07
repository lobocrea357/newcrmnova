'use client'
import { useState } from 'react'
import { AlertTriangle, DollarSign, FileText, Send, X, Loader2 } from 'lucide-react'

export default function ModalObservacionPago({ 
  vuelo, 
  isOpen, 
  onClose, 
  onSubmit 
}) {
  const [motivo, setMotivo] = useState('')
  const [montoFaltante, setMontoFaltante] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!motivo) {
      alert('Selecciona un motivo')
      return
    }

    if (observaciones.length < 20) {
      alert('Las observaciones deben tener al menos 20 caracteres para dar contexto al asesor')
      return
    }

    if (motivo === 'monto_insuficiente' && !montoFaltante) {
      alert('Ingresa el monto faltante')
      return
    }

    setEnviando(true)
    try {
      await onSubmit({
        motivo,
        montoFaltante: montoFaltante ? parseFloat(montoFaltante) : null,
        observaciones
      })
      
      setMotivo('')
      setMontoFaltante('')
      setObservaciones('')
      onClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setEnviando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Reportar Observación de Pago
              </h2>
              <p className="text-amber-100 text-sm">
                Vuelo {vuelo.ruta} - {vuelo.pax_nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={enviando}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Información del vuelo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-amber-700">Monto esperado:</span>
                <span className="ml-2 font-semibold text-amber-900">
                  ${vuelo.monto_venta?.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-amber-700">Estado:</span>
                <span className="ml-2 font-medium text-amber-900">
                  {vuelo.estado}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Motivo de la observación *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                <input
                  type="radio"
                  name="motivo"
                  value="pago_no_recibido"
                  checked={motivo === 'pago_no_recibido'}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    Pago no recibido
                  </div>
                  <div className="text-xs text-gray-500">
                    El pago aún no ha caído en la cuenta
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                <input
                  type="radio"
                  name="motivo"
                  value="monto_insuficiente"
                  checked={motivo === 'monto_insuficiente'}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    Monto insuficiente
                  </div>
                  <div className="text-xs text-gray-500">
                    Falta dinero para completar el pago
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                <input
                  type="radio"
                  name="motivo"
                  value="requiere_aclaracion"
                  checked={motivo === 'requiere_aclaracion'}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    Requiere aclaración
                  </div>
                  <div className="text-xs text-gray-500">
                    Hay inconsistencias que necesitan verificación
                  </div>
                </div>
              </label>
            </div>
          </div>

          {motivo === 'monto_insuficiente' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto faltante *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montoFaltante}
                  onChange={(e) => setMontoFaltante(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="0.00"
                  required
                />
              </div>
              {montoFaltante && (
                <p className="mt-2 text-sm text-amber-600">
                  Se notificará al asesor que faltan <strong>${parseFloat(montoFaltante).toFixed(2)}</strong>
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones para el asesor *
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              placeholder="Describe qué debe hacer el asesor: verificar con el cliente, solicitar nuevo comprobante, etc. (mínimo 20 caracteres)"
              required
              minLength={20}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Mínimo 20 caracteres para dar contexto claro
              </p>
              <p className={`text-xs ${observaciones.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {observaciones.length}/20
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !motivo || observaciones.length < 20}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Notificar Asesor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
