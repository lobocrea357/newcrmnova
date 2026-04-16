'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UserCheck, Plus, X, Search } from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import Swal from 'sweetalert2'

export default function UserPermissionsManager() {
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userPermissions, setUserPermissions] = useState([])
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id)
    }
  }, [selectedUser])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [usersRes, permissionsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, role:roles(name)')
          .eq('is_active', true)
          .order('full_name'),
        supabase
          .from('permissions')
          .select('*')
          .order('category')
          .order('name')
      ])

      if (usersRes.error) throw usersRes.error
      if (permissionsRes.error) throw permissionsRes.error

      setUsers(usersRes.data || [])
      setPermissions(permissionsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toastError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPermissions = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select(`
          id,
          granted,
          reason,
          created_at,
          permission:permissions(id, name, description, category)
        `)
        .eq('user_id', userId)

      if (error) throw error

      setUserPermissions(data || [])

      const assignedPermissionIds = (data || []).map(up => up.permission.id)
      const available = permissions.filter(p => !assignedPermissionIds.includes(p.id))
      setAvailablePermissions(available)
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      toastError('Error al cargar permisos del usuario')
    }
  }

  const handleGrantPermission = async (permissionId, granted = true) => {
    if (!selectedUser) return

    const { value: reason } = await Swal.fire({
      title: granted ? 'Otorgar Permiso Especial' : 'Revocar Permiso',
      input: 'text',
      inputLabel: granted ? '¿Por qué se otorga este permiso especial?' : '¿Por qué se revoca este permiso?',
      inputPlaceholder: 'Escribe el motivo...',
      inputAttributes: {
        'aria-label': 'Escribe el motivo'
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (!reason) return;

    try {
      const { error } = await supabase
        .from('user_permissions')
        .insert([{
          user_id: selectedUser.id,
          permission_id: permissionId,
          granted: granted,
          reason: reason,
          granted_by: (await supabase.auth.getUser()).data.user.id
        }])

      if (error) throw error

      toastSuccess(granted ? 'Permiso otorgado exitosamente' : 'Permiso revocado exitosamente')
      fetchUserPermissions(selectedUser.id)
    } catch (error) {
      console.error('Error granting permission:', error)
      toastError('Error al asignar permiso')
    }
  }

  const handleRevokePermission = async (userPermissionId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro de eliminar este permiso?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', userPermissionId)

      if (error) throw error

      toastSuccess('Permiso eliminado exitosamente')
      fetchUserPermissions(selectedUser.id)
    } catch (error) {
      console.error('Error revoking permission:', error)
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

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-purple-600" />
          Permisos Específicos de Usuarios
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lista de Usuarios */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="bg-white rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedUser?.id === user.id
                    ? 'bg-purple-50 border-l-4 border-l-purple-500'
                    : 'hover:bg-slate-50'
                  }`}
              >
                <p className="font-medium text-slate-800">{user.full_name || user.email}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
                <p className="text-xs text-purple-600 mt-1">Rol: {user.role?.name || 'N/A'}</p>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No se encontraron usuarios
              </div>
            )}
          </div>
        </div>

        {/* Permisos del Usuario Seleccionado */}
        <div className="space-y-4">
          {selectedUser ? (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-bold text-purple-800 mb-2">
                  {selectedUser.full_name || selectedUser.email}
                </h4>
                <p className="text-sm text-purple-700">
                  Rol: <span className="font-medium">{selectedUser.role?.name || 'Sin rol'}</span>
                </p>
              </div>

              {/* Permisos asignados */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-700">Permisos Especiales Asignados</h5>
                <div className="bg-white rounded-lg border border-slate-200 max-h-[200px] overflow-y-auto">
                  {userPermissions.length > 0 ? (
                    userPermissions.map((up) => (
                      <div key={up.id} className="p-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-slate-800">{up.permission.name}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryBadgeColor(up.permission.category)}`}>
                              {up.permission.category}
                            </span>
                            {up.granted ? (
                              <span className="text-xs text-green-600 font-medium">✓ Otorgado</span>
                            ) : (
                              <span className="text-xs text-red-600 font-medium">✗ Revocado</span>
                            )}
                          </div>
                          {up.reason && (
                            <p className="text-xs text-slate-500 mt-1 italic">{up.reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRevokePermission(up.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No tiene permisos especiales asignados
                    </div>
                  )}
                </div>
              </div>

              {/* Permisos disponibles para asignar */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-700">Asignar Nuevo Permiso</h5>
                <div className="bg-white rounded-lg border border-slate-200 max-h-[200px] overflow-y-auto">
                  {availablePermissions.length > 0 ? (
                    availablePermissions.map((permission) => (
                      <div key={permission.id} className="p-3 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-slate-800">{permission.name}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryBadgeColor(permission.category)}`}>
                              {permission.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                        </div>
                        <button
                          onClick={() => handleGrantPermission(permission.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Otorgar permiso"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No hay más permisos disponibles
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">Selecciona un usuario para gestionar sus permisos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
