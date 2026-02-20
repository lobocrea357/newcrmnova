'use client'
import { useState, useEffect } from 'react'
import { obtenerHistorialTasas } from '@/lib/tasasHelpers'
import { ArrowLeft, Clock, User } from 'lucide-react'

export default function HistorialTasas({ onBack }) {
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistorial()
  }, [])

  const fetchHistorial = async () => {
    try {
      setLoading(true)
      const data = await obtenerHistorialTasas()
      setHistorial(data)
    } catch (error) {
      console.error('Error fetching historial:', error)
      alert('Error al cargar historial: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatFecha = (fecha) => {
    const date = new Date(fecha)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Historial de Cambios en Tasas</h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando historial...</p>
        </div>
      ) : historial.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No hay cambios registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Conversión</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tasa Anterior</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tasa Nueva</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cambio</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Modificado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historial.map((cambio) => {
                const porcentajeCambio = cambio.tasa_anterior 
                  ? (((cambio.tasa_nueva - cambio.tasa_anterior) / cambio.tasa_anterior) * 100).toFixed(2)
                  : 0
                const esAumento = porcentajeCambio > 0

                return (
                  <tr key={cambio.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatFecha(cambio.fecha_cambio)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                          {cambio.moneda_origen?.codigo}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                          {cambio.moneda_destino?.codigo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cambio.tasa_anterior?.toFixed(4) || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-600">
                      {cambio.tasa_nueva?.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        esAumento 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {esAumento ? '↑' : '↓'} {Math.abs(porcentajeCambio)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {cambio.modificado_por_usuario?.full_name || cambio.modificado_por_usuario?.email || 'Sistema'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
