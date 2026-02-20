'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { obtenerMonedas, obtenerTasasConversion, crearConversion, actualizarTasa, eliminarConversion } from '@/lib/tasasHelpers'
import { Plus, Trash2, RefreshCw, History } from 'lucide-react'
import HistorialTasas from './HistorialTasas'
import { useUserProfile } from '@/hooks/useUserProfile'

export default function TasasManager() {
  const { user } = useAuth()
  const { profile, isAdmin } = useUserProfile()
  const [tasas, setTasas] = useState([])
  const [monedas, setMonedas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHistorial, setShowHistorial] = useState(false)
  
  const [newConversion, setNewConversion] = useState({
    monedaOrigenId: '',
    monedaDestinoId: '',
    tasa: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [monedasData, tasasData] = await Promise.all([
        obtenerMonedas(),
        obtenerTasasConversion()
      ])
      setMonedas(monedasData)
      setTasas(tasasData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTasa = async (id, nuevaTasa) => {
    try {
      await actualizarTasa(id, nuevaTasa, profile?.id)
      await fetchData()
    } catch (error) {
      console.error('Error updating rate:', error)
      alert('Error al actualizar: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta conversión?')) return

    try {
      await eliminarConversion(id, profile?.id)
      setTasas(tasas.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting rate:', error)
      alert('Error al eliminar: ' + error.message)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newConversion.monedaOrigenId || !newConversion.monedaDestinoId || !newConversion.tasa) {
      alert('Por favor completa todos los campos')
      return
    }

    if (newConversion.monedaOrigenId === newConversion.monedaDestinoId) {
      alert('No puedes crear una conversión de una moneda a sí misma')
      return
    }

    try {
      const origen = monedas.find(m => m.id === newConversion.monedaOrigenId)
      const destino = monedas.find(m => m.id === newConversion.monedaDestinoId)
      const descripcion = `1 ${origen.codigo} equivale a ${newConversion.tasa} ${destino.simbolo}`
      
      await crearConversion(
        newConversion.monedaOrigenId,
        newConversion.monedaDestinoId,
        newConversion.tasa,
        descripcion,
        profile?.id
      )
      
      await fetchData()
      setNewConversion({ monedaOrigenId: '', monedaDestinoId: '', tasa: '' })
    } catch (error) {
      console.error('Error adding conversion:', error)
      alert('Error al agregar conversión: ' + error.message)
    }
  }

  if (showHistorial && isAdmin) {
    return <HistorialTasas onBack={() => setShowHistorial(false)} />
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestionar Tasas de Cambio</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={() => setShowHistorial(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              Ver Historial
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Formulario para agregar nueva conversión */}
      <form onSubmit={handleAdd} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar Nueva Conversión</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={newConversion.monedaOrigenId}
            onChange={e => setNewConversion({ ...newConversion, monedaOrigenId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">De: Seleccionar moneda</option>
            {monedas.map(m => (
              <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
            ))}
          </select>
          <select
            value={newConversion.monedaDestinoId}
            onChange={e => setNewConversion({ ...newConversion, monedaDestinoId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">A: Seleccionar moneda</option>
            {monedas.map(m => (
              <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.0001"
            placeholder="Tasa"
            value={newConversion.tasa}
            onChange={e => setNewConversion({ ...newConversion, tasa: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </form>

      {/* Tabla de Conversiones */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Conversión</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tasa</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasas.map((tasa) => (
              <tr key={tasa.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                      {tasa.moneda_origen?.codigo}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                      {tasa.moneda_destino?.codigo}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {tasa.descripcion}
                </td>
                <td className="px-4 py-3 font-bold text-indigo-600">
                  <input
                    type="number"
                    step="0.0001"
                    defaultValue={tasa.tasa}
                    className="bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 rounded px-2 py-1 w-32"
                    onBlur={(e) => handleUpdateTasa(tasa.id, parseFloat(e.target.value))}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(tasa.id)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {tasas.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-400">
                  No hay conversiones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
