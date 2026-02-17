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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha Registro
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {getInitials(user.full_name)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name || "Sin nombre"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  {user.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                    user.role?.name,
                  )}`}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role?.name || "Sin rol"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggleStatus(user.id, user.is_active)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-md ${
                    user.is_active
                      ? "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                      : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                  }`}
                >
                  {user.is_active ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactivo
                    </>
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(user)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
