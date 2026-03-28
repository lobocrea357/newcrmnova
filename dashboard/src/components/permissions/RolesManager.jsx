'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'

export default function RolesManager() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name')

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toastError('Error al cargar roles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toastError('El nombre del rol es requerido')
      return
    }

    try {
      const { error } = await supabase
        .from('roles')
        .insert([{
          name: formData.name,
          description: formData.description
        }])

      if (error) throw error

      toastSuccess('Rol creado exitosamente')
      setFormData({ name: '', description: '' })
      setIsCreating(false)
      fetchRoles()
    } catch (error) {
      console.error('Error creating role:', error)
      toastError('Error al crear rol')
    }
  }

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      toastError('El nombre del rol es requerido')
      return
    }

    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', editingRole.id)

      if (error) throw error

      toastSuccess('Rol actualizado exitosamente')
      setEditingRole(null)
      setFormData({ name: '', description: '' })
      fetchRoles()
    } catch (error) {
      console.error('Error updating role:', error)
      toastError('Error al actualizar rol')
    }
  }

  const handleDelete = async (roleId, roleName) => {
    if (!confirm(`¿Estás seguro de eliminar el rol "${roleName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId)

      if (error) throw error

      toastSuccess('Rol eliminado exitosamente')
      fetchRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      toastError('Error al eliminar rol. Verifica que no tenga usuarios asignados.')
    }
  }

  const startEdit = (role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || ''
    })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingRole(null)
    setIsCreating(false)
    setFormData({ name: '', description: '' })
  }

  if (loading) {
    return <div className="text-center py-8">Cargando roles...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Gestión de Roles
        </h3>
        {!isCreating && !editingRole && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo Rol
          </button>
        )}
      </div>

      {(isCreating || editingRole) && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 space-y-4">
          <h4 className="font-bold text-indigo-800">
            {isCreating ? 'Crear Nuevo Rol' : 'Editar Rol'}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Rol *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: gerente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: Gerente de equipo"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={isCreating ? handleCreate : handleUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {isCreating ? 'Crear' : 'Guardar'}
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-600 uppercase">
                Nombre
              </th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-600 uppercase">
                Descripción
              </th>
              <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-800">
                  {role.name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {role.description || '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(role)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {roles.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No hay roles registrados
          </div>
        )}
      </div>
    </div>
  )
}
