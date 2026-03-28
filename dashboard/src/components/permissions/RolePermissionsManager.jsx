'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, Plus, X } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'

export default function RolePermissionsManager() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [rolePermissions, setRolePermissions] = useState([])
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id)
    }
  }, [selectedRole])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [rolesRes, permissionsRes] = await Promise.all([
        supabase
          .from('roles')
          .select('*')
          .order('name'),
        supabase
          .from('permissions')
          .select('*')
          .order('category')
          .order('name')
      ])

      if (rolesRes.error) throw rolesRes.error
      if (permissionsRes.error) throw permissionsRes.error

      setRoles(rolesRes.data || [])
      setPermissions(permissionsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toastError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchRolePermissions = async (roleId) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          id,
          permission:permissions(id, name, description, category)
        `)
        .eq('role_id', roleId)

      if (error) throw error

      setRolePermissions(data || [])

      const assignedPermissionIds = (data || []).map(rp => rp.permission.id)
      const available = permissions.filter(p => !assignedPermissionIds.includes(p.id))
      setAvailablePermissions(available)
    } catch (error) {
      console.error('Error fetching role permissions:', error)
      toastError('Error al cargar permisos del rol')
    }
  }

  const handleAssignPermission = async (permissionId) => {
    if (!selectedRole) return

    try {
      const { error } = await supabase
        .from('role_permissions')
        .insert([{
          role_id: selectedRole.id,
          permission_id: permissionId
        }])

      if (error) throw error

      toastSuccess('Permiso asignado exitosamente')
      fetchRolePermissions(selectedRole.id)
    } catch (error) {
      console.error('Error assigning permission:', error)
      toastError('Error al asignar permiso')
    }
  }

  const handleRemovePermission = async (rolePermissionId) => {
    if (!confirm('¿Estás seguro de eliminar este permiso del rol?')) return

    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', rolePermissionId)

      if (error) throw error

      toastSuccess('Permiso eliminado exitosamente')
      fetchRolePermissions(selectedRole.id)
    } catch (error) {
      console.error('Error removing permission:', error)
      toastError('Error al eliminar permiso')
    }
  }

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

  const groupPermissionsByCategory = (perms) => {
    return perms.reduce((acc, perm) => {
      const category = perm.permission ? perm.permission.category : perm.category
      if (!acc[category]) acc[category] = []
      acc[category].push(perm)
      return acc
    }, {})
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Permisos por Rol
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lista de Roles */}
        <div className="space-y-4">
          <h5 className="font-bold text-slate-700">Roles</h5>
          <div className="bg-white rounded-lg border border-slate-200">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedRole?.id === role.id
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-slate-50'
                  }`}
              >
                <p className="font-medium text-slate-800">{role.name}</p>
                <p className="text-xs text-slate-500 mt-1">{role.description || 'Sin descripción'}</p>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No hay roles registrados
              </div>
            )}
          </div>
        </div>

        {/* Permisos Asignados */}
        <div className="space-y-4">
          {selectedRole ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-1">{selectedRole.name}</h4>
                <p className="text-sm text-blue-700">{selectedRole.description || 'Sin descripción'}</p>
              </div>

              <div>
                <h5 className="font-bold text-slate-700 mb-3">Permisos Asignados</h5>
                <div className="bg-white rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                  {rolePermissions.length > 0 ? (
                    Object.entries(groupPermissionsByCategory(rolePermissions)).map(([category, perms]) => (
                      <div key={category} className="border-b border-slate-100 last:border-b-0">
                        <div className="bg-slate-50 px-3 py-2 font-medium text-xs text-slate-600 uppercase">
                          {category}
                        </div>
                        {perms.map((rp) => (
                          <div key={rp.id} className="p-3 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex-1">
                              <span className="font-mono text-sm text-slate-800">{rp.permission.name}</span>
                              <p className="text-xs text-slate-500 mt-1">{rp.permission.description}</p>
                            </div>
                            <button
                              onClick={() => handleRemovePermission(rp.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar permiso"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Este rol no tiene permisos asignados
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">Selecciona un rol para ver sus permisos</p>
            </div>
          )}
        </div>

        {/* Permisos Disponibles */}
        <div className="space-y-4">
          {selectedRole && (
            <>
              <h5 className="font-bold text-slate-700">Permisos Disponibles</h5>
              <div className="bg-white rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                {availablePermissions.length > 0 ? (
                  Object.entries(groupPermissionsByCategory(availablePermissions)).map(([category, perms]) => (
                    <div key={category} className="border-b border-slate-100 last:border-b-0">
                      <div className="bg-slate-50 px-3 py-2 font-medium text-xs text-slate-600 uppercase sticky top-0">
                        {category}
                      </div>
                      {perms.map((permission) => (
                        <div key={permission.id} className="p-3 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex-1">
                            <span className="font-mono text-sm text-slate-800">{permission.name}</span>
                            <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                          </div>
                          <button
                            onClick={() => handleAssignPermission(permission.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Asignar permiso"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No hay más permisos disponibles para asignar
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
