"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  Key,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import RoleFormModal from "@/components/roles/RoleFormModal";
import PermissionsModal from "@/components/roles/PermissionsModal";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function RolesPage() {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'superadmin']
  });
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadData();
    }
  }, [loading, user, isAdmin]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/roles`),
        fetch(`${apiUrl}/api/roles/permissions`),
      ]);

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.data || []);
      }

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setAvailablePermissions(permissionsData.data || {});
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleManagePermissions = (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setSelectedRole(null);
  };

  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedRole(null);
  };

  const handleRoleSaved = () => {
    loadData();
    handleCloseRoleModal();
  };

  const handlePermissionsSaved = () => {
    loadData();
    handleClosePermissionsModal();
  };

  const handleDeleteRole = async (role) => {
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/roles/${role.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      alert("Error al eliminar el rol");
    }
  };

  const getPermissionCount = (permissions) => {
    return Array.isArray(permissions) ? permissions.length : 0;
  };

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      gerente: "bg-blue-100 text-blue-800 border-blue-200",
      asesor: "bg-green-100 text-green-800 border-green-200",
      manager: "bg-blue-100 text-blue-800 border-blue-200",
      advisor: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[roleName?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h1>
            <p className="text-gray-600 mb-6">
              Solo los administradores pueden acceder a la gestión de roles del sistema.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-amber-800">
                    <strong>Rol actual:</strong> {profile?.role?.name || 'desconocido'}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Si necesitas acceso, contacta con un administrador.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Configuración", href: "/configuracion" },
              { label: "Roles", href: "/configuracion/roles" },
            ]}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="h-8 w-8 text-purple-600" />
                  Gestión de Roles
                </h1>
                <p className="text-gray-600 mt-2">
                  Administra los roles y permisos del sistema
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={loadData}
                  disabled={loadingData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`}
                  />
                  Actualizar
                </button>
                <button
                  onClick={handleAddRole}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Rol
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Lista de Roles
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Total: {roles.length} roles
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permisos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingData ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando roles...</p>
                      </td>
                    </tr>
                  ) : roles.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No hay roles configurados</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Comienza agregando tu primer rol
                        </p>
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                              role.name
                            )}`}
                          >
                            {role.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {role.description || "Sin descripción"}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {getPermissionCount(role.permissions)} permisos
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {role.profiles_count?.[0]?.count || 0} usuarios
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleManagePermissions(role)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                              title="Gestionar permisos"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditRole(role)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                              title="Editar rol"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 transition-colors"
                              title="Eliminar rol"
                              disabled={(role.profiles_count?.[0]?.count || 0) > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showRoleModal && (
        <RoleFormModal
          role={selectedRole}
          onClose={handleCloseRoleModal}
          onSave={handleRoleSaved}
        />
      )}

      {showPermissionsModal && (
        <PermissionsModal
          role={selectedRole}
          availablePermissions={availablePermissions}
          onClose={handleClosePermissionsModal}
          onSave={handlePermissionsSaved}
        />
      )}
    </div>
  );
}
