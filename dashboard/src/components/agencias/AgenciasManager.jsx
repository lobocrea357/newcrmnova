'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Plus, Pencil, Trash2, RefreshCw, Users, Star, X, UserPlus, StarOff } from 'lucide-react'
import { AGENCIAS_API, USERS_API } from '@/config/apiConfig'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

export default function AgenciasManager() {
  const [agencias, setAgencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAgencia, setEditingAgencia] = useState(null)
  const [selectedAgencia, setSelectedAgencia] = useState(null)
  const [agenciaUsers, setAgenciaUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    color_primario: '#6366f1'
  })

  // Estado para el modal de asignación de usuarios
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState([])
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false)
  const [assignForm, setAssignForm] = useState({ userId: '', isPrimary: false })
  const [assigning, setAssigning] = useState(false)

  const fetchAgencias = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(AGENCIAS_API.listar)
      const { data } = await res.json()
      setAgencias(data || [])
    } catch (error) {
      console.error('Error cargando agencias:', error)
      toast.error('Error al cargar agencias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgencias()
  }, [fetchAgencias])

  const fetchAgenciaUsers = async (agenciaId) => {
    setLoadingUsers(true)
    try {
      const res = await fetch(AGENCIAS_API.usuarios(agenciaId))
      const json = await res.json()
      setAgenciaUsers(json.data || [])
    } catch (error) {
      console.error('Error cargando usuarios de agencia:', error)
      toast.error('Error al cargar los usuarios de la agencia')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchAvailableUsers = async (agenciaId) => {
    setLoadingAvailableUsers(true)
    try {
      // Obtener todos los usuarios del sistema
      const res = await fetch(USERS_API.listar)
      const json = await res.json()
      const allUsers = json.data || json.users || []

      // Filtrar los que ya están asignados a esta agencia
      const assignedIds = new Set(agenciaUsers.map(ua => ua.user_id || ua.user?.id))
      setAvailableUsers(allUsers.filter(u => !assignedIds.has(u.id)))
    } catch (error) {
      console.error('Error cargando usuarios disponibles:', error)
      toast.error('Error al cargar usuarios disponibles')
    } finally {
      setLoadingAvailableUsers(false)
    }
  }

  const handleSelectAgencia = (agencia) => {
    setSelectedAgencia(agencia)
    fetchAgenciaUsers(agencia.id)
  }

  const handleOpenAssignModal = () => {
    setAssignForm({ userId: '', isPrimary: false })
    fetchAvailableUsers(selectedAgencia.id)
    setShowAssignModal(true)
  }

  const handleAssignUser = async (e) => {
    e.preventDefault()
    if (!assignForm.userId) {
      toast.error('Selecciona un usuario')
      return
    }
    setAssigning(true)
    try {
      const res = await fetch(AGENCIAS_API.asignarUsuario(selectedAgencia.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assignForm.userId, isPrimary: assignForm.isPrimary })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Usuario asignado correctamente')
      setShowAssignModal(false)
      fetchAgenciaUsers(selectedAgencia.id)
    } catch (error) {
      toast.error(error.message || 'Error al asignar usuario')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveUser = async (ua) => {
    const userId = ua.user_id || ua.user?.id
    const userName = ua.user?.full_name || 'este usuario'
    const result = await Swal.fire({
      title: '¿Remover usuario?',
      html: `¿Deseas remover a <strong>${userName}</strong> de la agencia <strong>${selectedAgencia.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, remover',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
    try {
      const res = await fetch(AGENCIAS_API.removerUsuario(selectedAgencia.id, userId), { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Usuario removido de la agencia')
      fetchAgenciaUsers(selectedAgencia.id)
    } catch (error) {
      toast.error(error.message || 'Error al remover usuario')
    }
  }

  const handleSetPrimary = async (ua) => {
    const userId = ua.user_id || ua.user?.id
    try {
      const res = await fetch(AGENCIAS_API.setPrimaria(selectedAgencia.id, userId), { method: 'PATCH' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Agencia primaria actualizada')
      fetchAgenciaUsers(selectedAgencia.id)
    } catch (error) {
      toast.error(error.message || 'Error al establecer agencia primaria')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingAgencia ? AGENCIAS_API.actualizar(editingAgencia.id) : AGENCIAS_API.crear
      const method = editingAgencia ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast.success(editingAgencia ? 'Agencia actualizada' : 'Agencia creada')
      resetForm()
      fetchAgencias()
    } catch (error) {
      toast.error(error.message || 'Error al guardar agencia')
    }
  }

  const handleEdit = (agencia) => {
    setEditingAgencia(agencia)
    setFormData({
      nombre: agencia.nombre,
      codigo: agencia.codigo,
      descripcion: agencia.descripcion || '',
      color_primario: agencia.color_primario || '#6366f1'
    })
    setShowForm(true)
  }

  const handleDelete = async (agencia) => {
    const result = await Swal.fire({
      title: '¿Eliminar agencia?',
      html: `Estás por desactivar <strong>${agencia.nombre}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      try {
        const res = await fetch(AGENCIAS_API.eliminar(agencia.id), { method: 'DELETE' })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        toast.success('Agencia eliminada')
        fetchAgencias()
        if (selectedAgencia?.id === agencia.id) {
          setSelectedAgencia(null)
          setAgenciaUsers([])
        }
      } catch (error) {
        toast.error(error.message || 'Error al eliminar agencia')
      }
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAgencia(null)
    setFormData({ nombre: '', codigo: '', descripcion: '', color_primario: '#6366f1' })
  }

  const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#14b8a6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Gestión de Agencias
          </h3>
          <p className="text-sm text-gray-500 mt-1">Administra las agencias del sistema y sus usuarios asignados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAgencias} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva Agencia
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {editingAgencia ? 'Editar Agencia' : 'Nueva Agencia'}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Ej: Nova Flash" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input type="text" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Ej: nova_flash" required disabled={!!editingAgencia} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input type="text" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Descripción opcional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setFormData({ ...formData, color_primario: color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color_primario === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                {editingAgencia ? 'Guardar Cambios' : 'Crear Agencia'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de agencias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-200 rounded w-1/3" /></div>
              </div>
            </div>
          ))
        ) : agencias.filter(a => a.is_active).length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay agencias registradas</p>
          </div>
        ) : (
          agencias.filter(a => a.is_active).map(agencia => (
            <div
              key={agencia.id}
              onClick={() => handleSelectAgencia(agencia)}
              className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${selectedAgencia?.id === agencia.id ? 'border-indigo-500 shadow-md' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: agencia.color_primario || '#6366f1' }}>
                    {agencia.nombre.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{agencia.nombre}</h4>
                    <p className="text-xs text-gray-500">{agencia.codigo}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(agencia) }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(agencia) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {agencia.descripcion && <p className="text-xs text-gray-500 line-clamp-2">{agencia.descripcion}</p>}
            </div>
          ))
        )}
      </div>

      {/* Panel de usuarios de la agencia seleccionada */}
      {selectedAgencia && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Usuarios de {selectedAgencia.nombre}
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAssignModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Asignar Usuario
              </button>
              <button onClick={() => { setSelectedAgencia(null); setAgenciaUsers([]) }} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></div>
          ) : agenciaUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay usuarios asignados a esta agencia</p>
              <button onClick={handleOpenAssignModal} className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 mx-auto">
                <UserPlus className="w-3.5 h-3.5" /> Asignar el primero
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {agenciaUsers.map(ua => (
                <div key={ua.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {ua.user?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ua.user?.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{ua.user?.email} · {ua.user?.role?.name || 'Sin rol'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ua.is_primary && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3" /> Principal
                      </span>
                    )}
                    {!ua.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(ua)}
                        title="Marcar como agencia primaria"
                        className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <StarOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveUser(ua)}
                      title="Remover de la agencia"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de asignación de usuario */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Asignar Usuario a {selectedAgencia?.nombre}
              </h4>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                {loadingAvailableUsers ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Cargando usuarios...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">Todos los usuarios ya están asignados a esta agencia.</p>
                ) : (
                  <select
                    value={assignForm.userId}
                    onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                  >
                    <option value="">Selecciona un usuario...</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.role?.name || u.role || 'sin rol'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={assignForm.isPrimary}
                  onChange={(e) => setAssignForm({ ...assignForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-700 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  Marcar como agencia primaria del usuario
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={assigning || loadingAvailableUsers || availableUsers.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {assigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
