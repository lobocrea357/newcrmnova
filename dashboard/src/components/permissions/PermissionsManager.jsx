'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Key, Plus, Edit2, Trash2, Save, X, Filter } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import Swal from 'sweetalert2'

export default function PermissionsManager() {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPermission, setEditingPermission] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  })

  const categories = ['tasas', 'monedas', 'usuarios', 'equipos', 'cotizaciones', 'vuelos', 'analisis']

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error
      setPermissions(data || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toastError('Error al cargar permisos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.category.trim()) {
      toastError('Nombre y categoría son requeridos')
      return
    }

    try {
      const { error } = await supabase
        .from('permissions')
        .insert([{
          name: formData.name,
          description: formData.description,
          category: formData.category
        }])

      if (error) throw error

      toastSuccess('Permiso creado exitosamente')
      setFormData({ name: '', description: '', category: '' })
      setIsCreating(false)
      fetchPermissions()
    } catch (error) {
      console.error('Error creating permission:', error)
      toastError('Error al crear permiso')
    }
  }

  const handleUpdate = async () => {
    if (!formData.name.trim() || !formData.category.trim()) {
      toastError('Nombre y categoría son requeridos')
      return
    }

    try {
      const { error } = await supabase
        .from('permissions')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category
        })
        .eq('id', editingPermission.id)

      if (error) throw error

      toastSuccess('Permiso actualizado exitosamente')
      setEditingPermission(null)
      setFormData({ name: '', description: '', category: '' })
      fetchPermissions()
    } catch (error) {
      console.error('Error updating permission:', error)
      toastError('Error al actualizar permiso')
    }
  }

  const handleDelete = async (permissionId, permissionName) => {
    const result = await Swal.fire({
      title: '¿Estás seguro de eliminar el permiso?',
      text: `Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', permissionId)

      if (error) throw error

      toastSuccess('Permiso eliminado exitosamente')
      fetchPermissions()
    } catch (error) {
      console.error('Error deleting permission:', error)
      toastError('Error al eliminar permiso')
    }
  }

  const startEdit = (permission) => {
    setEditingPermission(permission)
    setFormData({
      name: permission.name,
      description: permission.description || '',
      category: permission.category || ''
    })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingPermission(null)
    setIsCreating(false)
    setFormData({ name: '', description: '', category: '' })
  }

  const filteredPermissions = categoryFilter === 'all'
    ? permissions
    : permissions.filter(p => p.category === categoryFilter)

  const getCategoryBadgeColor = (category) => {
    const colors = {
      tasas: 'bg-blue-100 text-blue-700',
      monedas: 'bg-green-100 text-green-700',
      usuarios: 'bg-purple-100 text-purple-700',
      equipos: 'bg-orange-100 text-orange-700',
      cotizaciones: 'bg-pink-100 text-pink-700',
      vuelos: 'bg-indigo-100 text-indigo-700',
      analisis: 'bg-yellow-100 text-yellow-700'
    }
    return colors[category] || 'bg-slate-100 text-slate-700'
  }

  const getSystemBadge = (permission) => {
    if (permission.is_system) {
      return (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
          Sistema
        </span>
      );
    }
    return null;
  }

  if (loading) {
    return <div className="text-center py-8">Cargando permisos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Key className="w-5 h-5 text-green-600" />
          Gestión de Permisos
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {!isCreating && !editingPermission && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nuevo Permiso
            </button>
          )}
        </div>
      </div>

      {(isCreating || editingPermission) && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
          <h4 className="font-bold text-green-800">
            {isCreating ? 'Crear Nuevo Permiso' : 'Editar Permiso'}
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Permiso *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: tasas.edit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: Editar tasas existentes"
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
                Categoría
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
            {filteredPermissions.map((permission) => (
              <tr key={permission.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-slate-800">
                  {permission.name}
                  {getSystemBadge(permission)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(permission.category)}`}>
                    {permission.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {permission.description || '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(permission)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!permission.is_system && (
                      <button
                        onClick={() => handleDelete(permission.id, permission.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPermissions.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {categoryFilter === 'all' ? 'No hay permisos registrados' : `No hay permisos en la categoría "${categoryFilter}"`}
          </div>
        )}
      </div>
    </div>
  )
}
