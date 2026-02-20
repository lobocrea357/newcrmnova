'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { obtenerMonedas, crearMoneda } from '@/lib/tasasHelpers'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'

export default function MonedasManager() {
  const { user } = useAuth()
  const { profile, isAdmin } = useUserProfile()
  const [monedas, setMonedas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newMoneda, setNewMoneda] = useState({
    codigo: '',
    nombre: '',
    simbolo: ''
  })
  
  useEffect(() => {
    fetchMonedas()
  }, [])

  const fetchMonedas = async () => {
    try {
      setLoading(true)
      const data = await obtenerMonedas()
      setMonedas(data)
    } catch (error) {
      console.error('Error fetching monedas:', error)
      alert('Error al cargar monedas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newMoneda.codigo || !newMoneda.nombre || !newMoneda.simbolo) {
      alert('Por favor complete todos los campos')
      return
    }

    try {
      await crearMoneda(newMoneda.codigo, newMoneda.nombre, newMoneda.simbolo)
      setNewMoneda({ codigo: '', nombre: '', simbolo: '' })
      setShowForm(false)
      fetchMonedas()
    } catch (error) {
      console.error('Error adding moneda:', error)
      alert('Error al agregar moneda: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="animate-spin text-indigo-600 mr-2" size={20} />
        <span>Cargando monedas...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monedas Disponibles</h2>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona las monedas disponibles para conversión
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Moneda
        </button>
      </div>

      {/* Formulario para agregar moneda */}
      {showForm && (
        <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Agregar Nueva Moneda</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Código (3 letras)
              </label>
              <input
                type="text"
                maxLength={3}
                value={newMoneda.codigo}
                onChange={(e) => setNewMoneda({...newMoneda, codigo: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="USD"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={newMoneda.nombre}
                onChange={(e) => setNewMoneda({...newMoneda, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Dólares Americanos"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Símbolo
              </label>
              <input
                type="text"
                maxLength={3}
                value={newMoneda.simbolo}
                onChange={(e) => setNewMoneda({...newMoneda, simbolo: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="$"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de monedas */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Código</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Nombre</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Símbolo</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Creada</th>
            </tr>
          </thead>
          <tbody>
            {monedas.map((moneda) => (
              <tr key={moneda.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <span className="font-mono font-semibold text-slate-900">
                    {moneda.codigo}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">{moneda.nombre}</td>
                <td className="py-3 px-4">
                  <span className="text-lg font-semibold text-slate-900">
                    {moneda.simbolo}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    moneda.activa 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {moneda.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {new Date(moneda.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {monedas.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No hay monedas registradas. Agrega una nueva moneda para comenzar.
          </div>
        )}
      </div>
    </div>
  )
}
