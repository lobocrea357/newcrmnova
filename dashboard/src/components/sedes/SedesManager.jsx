'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Plus, Pencil, Trash2, RefreshCw, Users, X, UserPlus } from 'lucide-react'
import { SEDES_API, USERS_API } from '@/config/apiConfig'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

export default function SedesManager() {
  const [sedes, setSedes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSede, setEditingSede] = useState(null)
  const [selectedSede, setSelectedSede] = useState(null)
  const [sedeUsers, setSedeUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '', codigo: '', direccion: '', ciudad: '', pais: 'Venezuela', telefono: ''
  })

  // Estado para el modal de asignación
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState([])
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchSedes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(SEDES_API.listar)
      const { data } = await res.json()
      setSedes(data || [])
    } catch (error) {
      console.error('Error cargando sedes:', error)
      toast.error('Error al cargar sedes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSedes() }, [fetchSedes])

  const fetchSedeUsers = async (sedeId) => {
    setLoadingUsers(true)
    try {
      const res = await fetch(SEDES_API.usuarios(sedeId))
      const json = await res.json()
      setSedeUsers(json.data || [])
    } catch (error) {
      console.error('Error cargando usuarios de sede:', error)
      toast.error('Error al cargar los usuarios de la sede')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchAvailableUsers = async () => {
    setLoadingAvailableUsers(true)
    try {
      const res = await fetch(USERS_API.listar)
      const json = await res.json()
      const allUsers = json.data || json.users || []
      // Excluir los que ya están en esta sede
      const assignedIds = new Set(sedeUsers.map(u => u.id))
      setAvailableUsers(allUsers.filter(u => !assignedIds.has(u.id)))
    } catch (error) {
      console.error('Error cargando usuarios disponibles:', error)
      toast.error('Error al cargar usuarios disponibles')
    } finally {
      setLoadingAvailableUsers(false)
    }
  }

  const handleSelectSede = (sede) => {
    setSelectedSede(sede)
    fetchSedeUsers(sede.id)
  }

  const handleOpenAssignModal = () => {
    setSelectedUserId('')
    fetchAvailableUsers()
    setShowAssignModal(true)
  }

  const handleAssignUser = async (e) => {
    e.preventDefault()
    if (!selectedUserId) { toast.error('Selecciona un usuario'); return }
    setAssigning(true)
    try {
      const res = await fetch(SEDES_API.asignarUsuario(selectedSede.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Usuario asignado a la sede correctamente')
      setShowAssignModal(false)
      fetchSedeUsers(selectedSede.id)
    } catch (error) {
      toast.error(error.message || 'Error al asignar usuario')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveUser = async (user) => {
    const result = await Swal.fire({
      title: '¿Remover usuario de la sede?',
      html: `¿Deseas remover a <strong>${user.full_name || 'este usuario'}</strong> de la sede <strong>${selectedSede.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, remover',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
    try {
      const res = await fetch(SEDES_API.removerUsuario(selectedSede.id, user.id), { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Usuario removido de la sede')
      fetchSedeUsers(selectedSede.id)
    } catch (error) {
      toast.error(error.message || 'Error al remover usuario')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingSede ? SEDES_API.actualizar(editingSede.id) : SEDES_API.crear
      const method = editingSede ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast.success(editingSede ? 'Sede actualizada' : 'Sede creada')
      resetForm()
      fetchSedes()
    } catch (error) {
      toast.error(error.message || 'Error al guardar sede')
    }
  }

  const handleEdit = (sede) => {
    setEditingSede(sede)
    setFormData({
      nombre: sede.nombre, codigo: sede.codigo, direccion: sede.direccion || '',
      ciudad: sede.ciudad || '', pais: sede.pais || 'Venezuela', telefono: sede.telefono || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (sede) => {
    const result = await Swal.fire({
      title: '¿Eliminar sede?',
      html: `Estás por desactivar <strong>${sede.nombre}</strong>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      try {
        const res = await fetch(SEDES_API.eliminar(sede.id), { method: 'DELETE' })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        toast.success('Sede eliminada')
        fetchSedes()
        if (selectedSede?.id === sede.id) { setSelectedSede(null); setSedeUsers([]) }
      } catch (error) {
        toast.error(error.message || 'Error al eliminar sede')
      }
    }
  }

  const resetForm = () => {
    setShowForm(false); setEditingSede(null)
    setFormData({ nombre: '', codigo: '', direccion: '', ciudad: '', pais: 'Venezuela', telefono: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Gestión de Sedes
          </h3>
          <p className="text-sm text-gray-500 mt-1">Administra las sedes/oficinas del sistema y sus usuarios asignados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSedes} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva Sede
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-md font-semibold text-gray-900 mb-4">{editingSede ? 'Editar Sede' : 'Nueva Sede'}</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Ej: Oficina del Parral" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input type="text" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Ej: parral" required disabled={!!editingSede} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input type="text" value={formData.ciudad} onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Ej: Valencia" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <input type="text" value={formData.pais} onChange={e => setFormData({ ...formData, pais: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Venezuela" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Dirección de la sede" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="+58 xxx xxx xxxx" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                {editingSede ? 'Guardar Cambios' : 'Crear Sede'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de sedes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-200 rounded w-1/3" /></div>
              </div>
            </div>
          ))
        ) : sedes.filter(s => s.is_active).length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay sedes registradas</p>
          </div>
        ) : (
          sedes.filter(s => s.is_active).map(sede => (
            <div key={sede.id} onClick={() => handleSelectSede(sede)}
              className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${selectedSede?.id === sede.id ? 'border-emerald-500 shadow-md' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{sede.nombre}</h4>
                    <p className="text-xs text-gray-500">{sede.ciudad}{sede.pais ? `, ${sede.pais}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(sede) }}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(sede) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {sede.direccion && <p className="text-xs text-gray-500 line-clamp-2">{sede.direccion}</p>}
            </div>
          ))
        )}
      </div>

      {/* Panel de usuarios */}
      {selectedSede && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Usuarios en {selectedSede.nombre}
            </h4>
            <div className="flex items-center gap-2">
              <button onClick={handleOpenAssignModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium">
                <UserPlus className="w-3.5 h-3.5" /> Asignar Usuario
              </button>
              <button onClick={() => { setSelectedSede(null); setSedeUsers([]) }} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" /></div>
          ) : sedeUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay usuarios asignados a esta sede</p>
              <button onClick={handleOpenAssignModal} className="mt-3 text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1 mx-auto">
                <UserPlus className="w-3.5 h-3.5" /> Asignar el primero
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sedeUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                      {user.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{user.email} · {user.role?.name || 'Sin rol'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveUser(user)} title="Remover de la sede"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de asignación */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Asignar Usuario a {selectedSede?.nombre}
              </h4>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 bg-emerald-50 px-3 py-2 rounded-lg">
              📌 Cada usuario solo puede estar en <strong>una sede</strong>. Asignar este usuario a esta sede reemplazará su sede actual (si tenía una).
            </p>

            <form onSubmit={handleAssignUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                {loadingAvailableUsers ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Cargando usuarios...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No hay más usuarios disponibles para asignar.</p>
                ) : (
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" required>
                    <option value="">Selecciona un usuario...</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.role?.name || u.role || 'sin rol'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">Cancelar</button>
                <button type="submit" disabled={assigning || loadingAvailableUsers || availableUsers.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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
