"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, RefreshCw, Shield, Key, UserCheck, ShieldCheck, UsersRound, AlertTriangle, Building2, MapPin } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import UserList from "@/components/users/UserList";
import UserFormModal from "@/components/users/UserFormModal";
import RolesManager from "@/components/permissions/RolesManager";
import PermissionsManager from "@/components/permissions/PermissionsManager";
import UserPermissionsManager from "@/components/permissions/UserPermissionsManager";
import RolePermissionsManager from "@/components/permissions/RolePermissionsManager";
import EquiposTab from "@/components/users/EquiposTab";
import AgenciasManager from "@/components/agencias/AgenciasManager";
import SedesManager from "@/components/sedes/SedesManager";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function UsuariosPage() {
  const router = useRouter();
  const { user, profile, loading, isSuperAdmin, isAdmin } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'super_admin']
  });
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('usuarios');
  const tabsRef = useRef(null);

  // Tab configuration based on user role
  const visibleTabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users, show: true },
    { id: 'roles', label: 'Roles', icon: Shield, show: true },
    { id: 'permisos', label: 'Permisos', icon: Key, show: isSuperAdmin }, // Solo super_admin
    { id: 'permisos-roles', label: 'Permisos por Rol', icon: ShieldCheck, show: isSuperAdmin }, // Solo super_admin
    { id: 'permisos-usuarios', label: 'Permisos Especiales', icon: UserCheck, show: isSuperAdmin }, // Solo super_admin
    { id: 'equipos', label: 'Equipos', icon: UsersRound, show: true },
    { id: 'agencias', label: 'Agencias', icon: Building2, show: true },
    { id: 'sedes', label: 'Sedes', icon: MapPin, show: true }
  ].filter(tab => tab.show);

  // Estados y refs para el drag-to-scroll (arrastre con mouse)
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeftBase = useRef(0);

  const handleMouseDown = (e) => {
    if (!tabsRef.current) return;
    setIsDragging(true);
    startX.current = e.pageX - tabsRef.current.offsetLeft;
    scrollLeftBase.current = tabsRef.current.scrollLeft;
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging || !tabsRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Multiplicador de velocidad
    tabsRef.current.scrollLeft = scrollLeftBase.current - walk;
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (tabsRef.current) {
        // En desktop la rueda suele ser vertical, la convertimos en horizontal para el nav
        if (e.deltaY !== 0) {
          tabsRef.current.scrollLeft += e.deltaY * 1.5; // Multiplicador para mejor sensibilidad
          e.preventDefault();
        }
      }
    };
    
    const tabs = tabsRef.current;
    if (tabs) {
      tabs.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (tabs) tabs.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    if (!loading && user && (isSuperAdmin || isAdmin)) {
      loadData();
    }
  }, [loading, user, isSuperAdmin, isAdmin]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      
      // Pasar userId para filtrado jerárquico (solo verás usuarios/roles debajo de tu ranking)
      const userId = user?.id;
      
      if (!userId) {
        console.error('No se puede cargar usuarios sin userId');
        setLoadingData(false);
        return;
      }

      const headers = {
        'x-user-id': userId
      };

      const [usersResponse, rolesResponse] = await Promise.all([
        fetch(`${apiUrl}/api/users`, { headers }),
        fetch(`${apiUrl}/api/users/roles`, { headers }),
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
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      // Agregar x-user-id para validación jerárquica
      if (user?.id) {
        headers["x-user-id"] = user.id;
      }
      
      const response = await fetch(`${apiUrl}/api/users/${userId}/status`, {
        method: "PATCH",
        headers,
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

  if (!isSuperAdmin && !isAdmin) {
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                  <span className="leading-tight">Gestión de Usuarios y Permisos</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl">
                  Administra usuarios, roles, permisos y asignaciones del sistema.
                </p>
              </div>

              {activeTab === 'usuarios' && (
                <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                  <button
                    onClick={loadData}
                    disabled={loadingData}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
                    Actualizar
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="whitespace-nowrap">Agregar Usuario</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tabs Navigation - Carousel behavior for all screens */}
            <div className="relative mb-6">
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 block" />
              <div className="border-b border-gray-200">
                <nav 
                  ref={tabsRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className={`-mb-px flex gap-4 overflow-x-auto scrollbar-hide select-none touch-pan-x ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: isDragging ? 'auto' : 'smooth'
                  }}
                >
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
              </nav>
            </div>
          </div>
              <style jsx>{`
                nav::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'usuarios' && (
                <div>
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
                    currentUserRole={profile?.role?.name}
                  />
                </div>
              )}

              {activeTab === 'roles' && <RolesManager />}
              
              {activeTab === 'permisos' && <PermissionsManager />}
              
              {activeTab === 'permisos-roles' && <RolePermissionsManager />}
              
              {activeTab === 'permisos-usuarios' && <UserPermissionsManager />}
              
              {activeTab === 'equipos' && <EquiposTab allUsers={users} roles={roles} onDataChange={loadData} user={user} />}

              {activeTab === 'agencias' && <AgenciasManager />}

              {activeTab === 'sedes' && <SedesManager />}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <UserFormModal
          user={selectedUser}
          roles={roles}
          currentUserId={user?.id}
          onClose={handleCloseModal}
          onSave={handleUserSaved}
        />
      )}
    </div>
  );
}
