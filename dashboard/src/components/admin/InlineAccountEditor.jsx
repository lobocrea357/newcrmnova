'use client'
import { useState } from 'react'
import { Save, X, AlertCircle } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import { EMISIONES_API } from '@/config/apiConfig'

const CUENTAS_EMISION = [
  { value: 'SERVIVUELO_1', label: 'Servivuelo 1 (Grupo Travel)', soloContado: true },
  { value: 'SERVIVUELO_2', label: 'Servivuelo 2 (Arcadia)', soloContado: true },
  { value: 'CHASE_NOVA', label: 'Chase Nova', soloContado: true },
  { value: 'CHASE_APOLO', label: 'Chase Apolo', soloContado: true },
  { value: 'KIU_ESTELAR_ARCADIA', label: 'KIU Estelar Arcadia', soloContado: false },
  { value: 'KIU_LASER_ARCADIA', label: 'KIU Laser Arcadia', soloContado: false },
  { value: 'SABRE', label: 'Sabre', soloContado: false },
  { value: 'AMADEUS', label: 'Amadeus', soloContado: false },
  { value: 'EXPEDIA', label: 'Expedia', soloContado: false },
  { value: 'KIWI', label: 'Kiwi', soloContado: false },
  { value: 'REVOLUT_GADDIEL', label: 'Revolut Gaddiel', soloContado: false },
  { value: 'REVOLUT_GRUPO_TRAVEL', label: 'Revolut Grupo Travel', soloContado: false }
]

export default function InlineAccountEditor({
  vueloId,
  cuentaActual,
  formaEmision,
  userId,
  onSave,
  onCancel
}) {
  const [nuevaCuenta, setNuevaCuenta] = useState(cuentaActual || '')
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Filtrar cuentas según forma_emision
  const cuentasDisponibles = CUENTAS_EMISION.filter(cuenta => {
    if (formaEmision === 'CREDITO') {
      return !cuenta.soloContado
    }
    return true // CONTADO puede usar todas
  })

  const handleGuardar = async () => {
    if (!nuevaCuenta) {
      setError('Debe seleccionar una cuenta')
      return
    }

    if (nuevaCuenta === cuentaActual) {
      toastError('La cuenta seleccionada es la misma que la actual')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(EMISIONES_API.cambiarCuenta(vueloId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          nueva_cuenta: nuevaCuenta,
          observaciones
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar cuenta')
      }

      toastSuccess(`Cuenta actualizada a ${cuentasDisponibles.find(c => c.value === nuevaCuenta)?.label}`)
      onSave(data.vuelo)

    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
      toastError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-3 animate-in slide-in-from-top duration-200">
      <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
        ✏️ Cambiar Cuenta de Emisión
      </h4>

      {/* Cuenta Actual */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">Cuenta Actual</label>
        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 font-medium">
          {CUENTAS_EMISION.find(c => c.value === cuentaActual)?.label || cuentaActual}
        </div>
      </div>

      {/* Nueva Cuenta */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">
          Nueva Cuenta {formaEmision === 'CREDITO' && <span className="text-amber-600">(Solo cuentas a crédito)</span>}
        </label>
        <select
          value={nuevaCuenta}
          onChange={(e) => setNuevaCuenta(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          disabled={saving}
        >
          <option value="">Seleccionar cuenta...</option>
          {cuentasDisponibles.map(cuenta => (
            <option key={cuenta.value} value={cuenta.value}>
              {cuenta.label} {cuenta.soloContado && '💵'}
            </option>
          ))}
        </select>
        {formaEmision === 'CONTADO' && (
          <p className="text-xs text-gray-500 mt-1">💵 = Solo disponible para pagos al contado</p>
        )}
      </div>

      {/* Observaciones */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">Observaciones (opcional)</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Motivo del cambio..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
          rows={2}
          disabled={saving}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={handleGuardar}
          disabled={saving || !nuevaCuenta}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambio
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm font-medium inline-flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>
  )
}
