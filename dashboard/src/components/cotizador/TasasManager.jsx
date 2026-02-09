'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Save, X, RefreshCw } from 'lucide-react'

export default function TasasManager() {
  const [tasas, setTasas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  
  // Estado para nueva moneda
  const [newMoneda, setNewMoneda] = useState({
    codigo: '',
    nombre: '',
    simbolo: '$',
    tasa: ''
  })

  useEffect(() => {
    fetchTasas()
  }, [])

  const fetchTasas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasas_monedas')
        .select('*')
        .order('moneda_codigo')
      
      if (error) throw error
      setTasas(data || [])
    } catch (error) {
      console.error('Error fetching rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (id, field, value) => {
    try {
      const { error } = await supabase
        .from('tasas_monedas')
        .update({ [field]: value })
        .eq('id', id)
      
      if (error) throw error
      
      // Update local state
      setTasas(tasas.map(t => t.id === id ? { ...t, [field]: value } : t))
    } catch (error) {
      console.error('Error updating rate:', error)
      alert('Error al actualizar: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta moneda?')) return

    try {
      const { error } = await supabase
        .from('tasas_monedas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setTasas(tasas.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting rate:', error)
      alert('Error al eliminar: ' + error.message)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newMoneda.codigo || !newMoneda.tasa) return

    try {
      const { data, error } = await supabase
        .from('tasas_monedas')
        .insert([{
          moneda_codigo: newMoneda.codigo.toUpperCase(),
          moneda_nombre: newMoneda.nombre,
          simbolo: newMoneda.simbolo,
          tasa_conversion: parseFloat(newMoneda.tasa)
        }])
        .select()
      
      if (error) throw error
      
      setTasas([...tasas, data[0]])
      setNewMoneda({ codigo: '', nombre: '', simbolo: '$', tasa: '' })
    } catch (error) {
      console.error('Error adding rate:', error)
      alert('Error al agregar moneda: ' + error.message)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestionar Tasas de Cambio</h2>
        <button 
          onClick={fetchTasas}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Formulario para agregar nueva moneda */}
      <form onSubmit={handleAdd} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar Nueva Moneda</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Código (ej. EUR)"
            value={newMoneda.codigo}
            onChange={e => setNewMoneda({...newMoneda, codigo: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Nombre (ej. Euro)"
            value={newMoneda.nombre}
            onChange={e => setNewMoneda({...newMoneda, nombre: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Símbolo (ej. €)"
            value={newMoneda.simbolo}
            onChange={e => setNewMoneda({...newMoneda, simbolo: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            step="0.0001"
            placeholder="Tasa (vs USD)"
            value={newMoneda.tasa}
            onChange={e => setNewMoneda({...newMoneda, tasa: e.target.value})}
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

      {/* Tabla de Tasas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Símbolo</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tasa</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasas.map((tasa) => (
              <tr key={tasa.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{tasa.moneda_codigo}</td>
                <td className="px-4 py-3 text-gray-600">
                  <input
                    type="text"
                    defaultValue={tasa.moneda_nombre}
                    className="bg-transparent border-none focus:ring-0 w-full"
                    onBlur={(e) => handleSave(tasa.id, 'moneda_nombre', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <input
                    type="text"
                    defaultValue={tasa.simbolo}
                    className="bg-transparent border-none focus:ring-0 w-12"
                    onBlur={(e) => handleSave(tasa.id, 'simbolo', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 font-bold text-indigo-600">
                  <input
                    type="number"
                    step="0.0001"
                    defaultValue={tasa.tasa_conversion}
                    className="bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 rounded px-2 py-1 w-24"
                    onBlur={(e) => handleSave(tasa.id, 'tasa_conversion', parseFloat(e.target.value))}
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
                <td colSpan="5" className="text-center py-8 text-gray-400">
                  No hay tasas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
