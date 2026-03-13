'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { obtenerMonedas, crearMoneda, actualizarMoneda, eliminarMoneda } from '@/lib/cotizador/tasasHelpers'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import EditableCell from '@/components/ui/EditableCell'
import TutorialSection from '@/components/ui/TutorialSection'
import { useDebouncedCallback, useLoadingAlert } from '@/hooks/useDebounce'

export default function MonedasManager() {
  const { user } = useAuth()
  const { profile, isAdmin } = useUserProfile()
  const { showLoadingAlert, closeLoadingAlert } = useLoadingAlert()
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
      toast.error('Error al cargar monedas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, field, value) => {
    // Actualizar estado local inmediatamente
    setMonedas(prev => prev.map(moneda =>
      moneda.id === id ? { ...moneda, [field]: value } : moneda
    ))

    // Mostrar SweetAlert con spinner INMEDIATAMENTE (sin debounce)
    showLoadingAlert('Actualizando moneda...', 'Guardando cambios en la base de datos...')

    try {
      const moneda = monedas.find(m => m.id === id)
      if (!moneda) return

      await actualizarMoneda(id, moneda.codigo, moneda.nombre, moneda.simbolo)
      await fetchMonedas() // Refrescar datos

      closeLoadingAlert()
      toast.success('Moneda actualizada correctamente')
    } catch (error) {
      closeLoadingAlert()
      console.error('Error updating moneda:', error)
      toast.error('Error al actualizar moneda: ' + error.message)

      // Revertir valor original
      setMonedas(prev => prev.map(moneda => {
        if (moneda.id === id) {
          const originalMoneda = monedas.find(m => m.id === id)
          return originalMoneda || moneda
        }
        return moneda
      }))
    }
  }

  const handleDelete = async (id) => {
    const moneda = monedas.find(m => m.id === id)
    if (!moneda) return

    const result = await Swal.fire({
      title: '¿Eliminar moneda?',
      html: `Estás por eliminar <strong>${moneda.codigo} - ${moneda.nombre}</strong><br><br>Esto también eliminará todas las tasas de conversión asociadas.<br><span class="text-red-600">Esta acción no se puede deshacer.</span>`,
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
      showLoadingAlert('Eliminando moneda...', 'Eliminando moneda y todas sus tasas asociadas...')

      try {
        await eliminarMoneda(id)
        closeLoadingAlert()
        toast.success('Moneda eliminada correctamente')
        await fetchMonedas()
      } catch (error) {
        closeLoadingAlert()
        console.error('Error deleting moneda:', error)
        toast.error('Error al eliminar moneda: ' + error.message)
      }
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newMoneda.codigo || !newMoneda.nombre || !newMoneda.simbolo) {
      toast.error('Por favor complete todos los campos')
      return
    }

    // Mostrar SweetAlert con spinner inmediatamente
    showLoadingAlert('Creando moneda...', 'Guardando nueva moneda en la base de datos...')

    try {
      await crearMoneda(newMoneda.codigo, newMoneda.nombre, newMoneda.simbolo)
      closeLoadingAlert()
      toast.success('Moneda creada correctamente')
      setNewMoneda({ codigo: '', nombre: '', simbolo: '' })
      setShowForm(false)
      fetchMonedas()
    } catch (error) {
      closeLoadingAlert()
      console.error('Error adding moneda:', error)
      toast.error('Error al agregar moneda: ' + error.message)
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
    <>
      {/* Tutorial de Gestión de Monedas */}
      <TutorialSection
        title="📊 Gestión de Monedas"
        subtitle="Aprende a administrar las monedas del sistema"
        mode="description"
        description={`
          <div class="space-y-4">
            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-2">🔍 ¿Qué puedes hacer aquí?</h3>
              <p class="text-indigo-100 mb-3">En esta sección puedes administrar todas las monedas disponibles para el sistema de cotizaciones:</p>
              <ul class="text-indigo-100 space-y-2 ml-4">
                <li>• <strong>Ver monedas existentes</strong>: Lista completa con código, nombre y símbolo</li>
                <li>• <strong>Editar monedas</strong>: Click en cualquier celda para modificar información</li>
                <li>• <strong>Crear nuevas monedas</strong>: Botón "Nueva Moneda" para agregar al sistema</li>
                <li>• <strong>Eliminar monedas</strong>: Botón rojo para eliminar con confirmación</li>
              </ul>
            </div>
            
            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-2">⚙️ ¿Cómo funciona?</h3>
              <div class="text-indigo-100 space-y-2">
                <p><strong>Para editar:</strong> Click en cualquier celda → Modifica el valor → Click en ✓ para guardar</p>
                <p><strong>Para crear:</strong> Click en "Nueva Moneda" → Completa formulario → Click en "Agregar"</p>
                <p><strong>Para eliminar:</strong> Click en 🗑️ → Confirma en el diálogo → Espera confirmación</p>
              </div>
            </div>
            
            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-2">💡 Tips importantes</h3>
              <ul class="text-indigo-100 space-y-2 ml-4">
                <li>• Las monedas eliminadas <strong>borrarán todas sus tasas asociadas</strong></li>
                <li>• Los cambios se guardan <strong>automáticamente</strong> con SweetAlert de confirmación</li>
                <li>• Usa <strong>ESC</strong> para cancelar edición o click en ✗</li>
                <li>• Los códigos deben ser <strong>3 letras</strong> (ej: USD, EUR, COP)</li>
              </ul>
            </div>
          </div>
        `}
        gradient="from-emerald-600 via-teal-600 to-emerald-700"
        defaultExpanded={false}
      />

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
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {monedas.map((moneda) => (
              <tr key={moneda.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <EditableCell
                    value={moneda.codigo}
                    onSave={(value) => handleUpdate(moneda.id, 'codigo', value.toUpperCase())}
                    placeholder="USD"
                    className="font-mono font-semibold"
                    maxLength={3}
                  />
                </td>
                <td className="py-3 px-4">
                  <EditableCell
                    value={moneda.nombre}
                    onSave={(value) => handleUpdate(moneda.id, 'nombre', value)}
                    placeholder="Nombre completo"
                  />
                </td>
                <td className="py-3 px-4">
                  <EditableCell
                    value={moneda.simbolo}
                    onSave={(value) => handleUpdate(moneda.id, 'simbolo', value)}
                    placeholder="$"
                    className="text-lg font-semibold"
                    maxLength={3}
                  />
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
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleDelete(moneda.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar moneda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
    </>
  )
}
