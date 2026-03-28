"use client";

import { Mail, Edit2, Shield, CheckCircle, XCircle, User } from "lucide-react";

export default function UserList({ users, roles, onEdit, onToggleStatus, loading }) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando usuarios...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-12 text-center">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No hay usuarios registrados</p>
        <p className="text-gray-400 text-sm mt-2">
          Comienza agregando tu primer usuario
        </p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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

  return (
    <div className="space-y-4">
      {/* Mobile/Tablet/Small Desktop Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:hidden gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(user.full_name)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{user.full_name || "Sin nombre"}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onEdit(user)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-50">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${getRoleBadgeColor(user.role?.name)}`}>
                <Shield className="h-3 w-3 mr-1" />
                {user.role?.name || "Sin rol"}
              </span>
              
              <button
                onClick={() => onToggleStatus(user.id, user.is_active)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                  user.is_active
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {user.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {user.is_active ? "Activo" : "Inactivo"}
              </button>
              
              <span className="text-[10px] text-gray-400 ml-auto uppercase tracking-tighter">
                Reg: {new Date(user.created_at).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block overflow-x-auto border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-9 w-9">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        {getInitials(user.full_name)}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.full_name || "Sin nombre"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 mr-2 opacity-60" /> {user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role?.name)}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role?.name || "Sin rol"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(user.id, user.is_active)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${
                      user.is_active ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {user.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {user.is_active ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
