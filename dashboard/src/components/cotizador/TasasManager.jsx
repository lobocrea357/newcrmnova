'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { obtenerMonedas, obtenerTasasConversion, crearConversion, actualizarTasa, eliminarConversion } from '@/lib/cotizador/tasasHelpers'
import { Plus, Trash2, RefreshCw, History } from 'lucide-react'
import HistorialTasas from './HistorialTasas'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useLoadingAlert } from '@/hooks/useDebounce'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import EditableCell from '@/components/ui/EditableCell'
import TutorialSection from '@/components/ui/TutorialSection'

export default function TasasManager() {
  const { user } = useAuth()
  const { profile, isAdmin } = useUserProfile()
  const { showLoadingAlert, closeLoadingAlert } = useLoadingAlert()
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
      toast.error('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTasa = async (id, nuevaTasa) => {
    // Actualizar estado local inmediatamente
    setTasas(prev => prev.map(tasa =>
      tasa.id === id ? { ...tasa, tasa: parseFloat(nuevaTasa) } : tasa
    ))

    // Mostrar SweetAlert con spinner INMEDIATAMENTE (sin debounce)
    showLoadingAlert('Actualizando tasa...', 'Guardando cambios en la base de datos...')

    try {
      await actualizarTasa(id, nuevaTasa, profile?.id)
      closeLoadingAlert()
      toast.success('Tasa actualizada correctamente')
      await fetchData()
    } catch (error) {
      closeLoadingAlert()
      console.error('Error updating rate:', error)
      toast.error('Error al actualizar: ' + error.message)

      // Revertir valor original
      setTasas(prev => prev.map(tasa => {
        if (tasa.id === id) {
          const originalTasa = tasas.find(t => t.id === id)
          return originalTasa || tasa
        }
        return tasa
      }))
    }
  }

  const handleDelete = async (id) => {
    const tasa = tasas.find(t => t.id === id)
    if (!tasa) return

    const result = await Swal.fire({
      title: '¿Eliminar tasa de conversión?',
      html: `Estás por eliminar <strong>${tasa.moneda_origen?.codigo} → ${tasa.moneda_destino?.codigo}</strong><br><span class="text-red-600">Esta acción no se puede deshacer.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      // Mostrar SweetAlert con loading durante la eliminación
      showLoadingAlert('Eliminando tasa...', 'Eliminando tasa de conversión...')

      try {
        await eliminarConversion(id, profile?.id)
        closeLoadingAlert()
        toast.success('Tasa eliminada correctamente')
        setTasas(tasas.filter(t => t.id !== id))
      } catch (error) {
        closeLoadingAlert()
        console.error('Error deleting rate:', error)
        toast.error('Error al eliminar: ' + error.message)
      }
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newConversion.monedaOrigenId || !newConversion.monedaDestinoId || !newConversion.tasa) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (newConversion.monedaOrigenId === newConversion.monedaDestinoId) {
      toast.error('No puedes crear una conversión de una moneda a sí misma')
      return
    }

    // Mostrar SweetAlert con spinner inmediatamente
    showLoadingAlert('Creando conversión...', 'Guardando nueva tasa de conversión...')

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
      
      closeLoadingAlert()
      toast.success('Conversión creada correctamente')
      await fetchData()
      setNewConversion({ monedaOrigenId: '', monedaDestinoId: '', tasa: '' })
    } catch (error) {
      closeLoadingAlert()
      console.error('Error adding conversion:', error)
      toast.error('Error al agregar conversión: ' + error.message)
    }
  }

  if (showHistorial && isAdmin) {
    return <HistorialTasas onBack={() => setShowHistorial(false)} />
  }

  return (
    <>
      {/* Tutorial de Gestión de Tasas */}
      <TutorialSection
        title="💱 Gestión de Tasas de Cambio"
        subtitle="Aprende a administrar las tasas de conversión del sistema"
        mode="description"
        description={`
          <div class="space-y-4">
            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-2">🔍 ¿Qué puedes hacer aquí?</h3>
              <p class="text-indigo-100 mb-3">En esta sección puedes administrar todas las tasas de conversión entre monedas:</p>
              <ul class="text-indigo-100 space-y-2 ml-4">
                <li>• <strong>Ver tasas existentes</strong>: Lista completa con conversiones y valores actuales</li>
                <li>• <strong>Editar tasas</strong>: Click en cualquier tasa para modificar su valor</li>
                <li>• <strong>Crear nuevas tasas</strong>: Formulario para agregar nuevas conversiones</li>
                <li>• <strong>Eliminar tasas</strong>: Botón rojo para eliminar con confirmación</li>
                <li>• <strong>Ver historial</strong>: Acceso al registro de cambios (solo administradores)</li>
              </ul>
            </div>
            
            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-2">⚙️ ¿Cómo funciona?</h3>
              <div class="text-indigo-100 space-y-2">
                <p><strong>Para editar:</strong> Click en una tasa → Modifica el valor → Click en ✓ para guardar</p>
                <p><strong>Para crear:</strong> Selecciona monedas → Ingresa tasa → Click en "Agregar"</p>
                <p><strong>Para eliminar:</strong> Click en 🗑️ → Confirma en el diálogo → Espera confirmación</p>
                <p><strong>Para historial:</strong> Click en "Ver Historial" → Explora cambios pasados</p>
              </div>
            </div>
            
            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-2">💡 Tips importantes</h3>
              <ul class="text-indigo-100 space-y-2 ml-4">
                <li>• Las tasas se usan para <strong>calcular conversiones</strong> en el cotizador</li>
                <li>• Los cambios se guardan <strong>automáticamente</strong> con SweetAlert de confirmación</li>
                <li>• Usa <strong>4 decimales</strong> para mayor precisión (ej: 0.1234)</li>
                <li>• El historial registra <strong>todos los cambios</strong> con fecha y usuario</li>
                <li>• No puedes crear conversiones <strong>de una moneda a sí misma</strong></li>
              </ul>
            </div>
          </div>
        `}
        gradient="from-blue-600 via-indigo-600 to-blue-700"
        defaultExpanded={false}
      />

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
                  <EditableCell
                    value={tasa.tasa.toString()}
                    onSave={(value) => handleUpdateTasa(tasa.id, value)}
                    placeholder="0.0000"
                    type="number"
                    step="0.0001"
                    className="w-32 text-right"
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
    </>
  )
}
