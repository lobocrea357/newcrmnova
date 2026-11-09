"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, RefreshCw, Shield, Key, UserCheck, ShieldCheck, UsersRound, Building2, MapPin } from "lucide-react";
import { Page, PageHeader, Panel, Button, EmptyState, Skeleton } from "@/components/ui/kit";
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
      <Page>
        <Skeleton className="mb-6 h-9 w-72" />
        <Skeleton className="h-96" />
      </Page>
    );
  }

  if (!isSuperAdmin && !isAdmin) {
    return (
      <Page>
        <Panel className="mx-auto mt-10 max-w-lg">
          <EmptyState
            icon={Shield}
            title="Solo los administradores gestionan usuarios"
            description={`Tu rol (${profile?.role?.name || "sin rol"}) no incluye esta pantalla. Si la necesitas, pide el permiso a un administrador.`}
            action={<Button variant="primary" href="/">Ir al inicio</Button>}
          />
        </Panel>
      </Page>
    );
  }

  return (
    <Page wide>
      <PageHeader
        title="Usuarios y permisos"
        description="Altas, roles, permisos, equipos, agencias y sedes."
        actions={
          activeTab === "usuarios" && (
            <>
              <Button onClick={loadData} disabled={loadingData}>
                <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button variant="primary" onClick={handleAddUser}>
                <UserPlus className="h-4 w-4" />
                Agregar usuario
              </Button>
            </>
          )
        }
      />

      <nav
        ref={tabsRef}
        role="tablist"
        aria-label="Secciones de usuarios"
        className="mb-6 flex gap-1 overflow-x-auto border-b border-linea [scrollbar-width:none]"
      >
        {visibleTabs.map((tab) => {
          const on = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
                on ? "border-nova-600 font-medium text-tinta" : "border-transparent text-gray-500 hover:text-tinta"
              }`}
            >
              <tab.icon className="h-4 w-4" strokeWidth={1.8} />
              {tab.label}
              {tab.id === "usuarios" && users.length > 0 && (
                <span className={`rounded px-1.5 text-xs tabular ${on ? "bg-nova-50 text-nova-700" : "bg-gray-100 text-gray-600"}`}>
                  {users.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div role="tabpanel">
        {activeTab === "usuarios" && (
          <UserList
            users={users}
            roles={roles}
            onEdit={handleEditUser}
            onToggleStatus={handleToggleStatus}
            loading={loadingData}
            currentUserRole={profile?.role?.name}
          />
        )}
        {activeTab === "roles" && <RolesManager />}
        {activeTab === "permisos" && <PermissionsManager />}
        {activeTab === "permisos-roles" && <RolePermissionsManager />}
        {activeTab === "permisos-usuarios" && <UserPermissionsManager />}
        {activeTab === "equipos" && <EquiposTab allUsers={users} roles={roles} onDataChange={loadData} user={user} />}
        {activeTab === "agencias" && <AgenciasManager />}
        {activeTab === "sedes" && <SedesManager />}
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
    </Page>
  );
}
