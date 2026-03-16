"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, RefreshCw, Shield, AlertTriangle, UsersRound } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import UserList from "@/components/users/UserList";
import UserFormModal from "@/components/users/UserFormModal";
import EquiposTab from "@/components/users/EquiposTab";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function UsuariosPage() {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'superadmin']
  });
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('usuarios');

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadData();
    }
  }, [loading, user, isAdmin]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const [usersResponse, rolesResponse] = await Promise.all([
        fetch(`${apiUrl}/api/users`),
        fetch(`${apiUrl}/api/users/roles`),
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.data || []);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleUserSaved = () => {
    loadData();
    handleCloseModal();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al cambiar el estado del usuario");
    }
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
              Solo los administradores pueden acceder a la gestión de usuarios del sistema.
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
              { label: "Usuarios", href: "/configuracion/usuarios" },
            ]}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  Gestión de Usuarios
                </h1>
                <p className="text-gray-600 mt-2">
                  Administra los usuarios del sistema (asesores, gerentes, administradores)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={loadData}
                  disabled={loadingData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
                  Actualizar
                </button>
                {activeTab === 'usuarios' && (
                  <button
                    onClick={handleAddUser}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Agregar Usuario
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'usuarios'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Usuarios
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{users.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('equipos')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'equipos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UsersRound className="w-4 h-4" />
                Equipos
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'usuarios' && (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Lista de Usuarios</h3>
                    <p className="text-sm text-gray-500 mt-1">Total: {users.length} usuarios</p>
                  </div>
                  <UserList
                    users={users}
                    roles={roles}
                    onEdit={handleEditUser}
                    onToggleStatus={handleToggleStatus}
                    loading={loadingData}
                  />
                </>
              )}

              {activeTab === 'equipos' && (
                <EquiposTab
                  allUsers={users}
                  roles={roles}
                  onDataChange={loadData}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <UserFormModal
          user={selectedUser}
          roles={roles}
          onClose={handleCloseModal}
          onSave={handleUserSaved}
        />
      )}
    </div>
  );
}
