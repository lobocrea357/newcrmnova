"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Key, CheckSquare, Square, AlertCircle } from "lucide-react";

export default function PermissionsModal({ role, availablePermissions, onClose, onSave }) {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions || []);
    }
  }, [role]);

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleCategoryToggle = (categoryPermissions) => {
    const categoryPermissionIds = categoryPermissions.map((p) => p.id);
    const allSelected = categoryPermissionIds.every((id) => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Deseleccionar todos los permisos de esta categoría
      setSelectedPermissions((prev) => 
        prev.filter((id) => !categoryPermissionIds.includes(id))
      );
    } else {
      // Seleccionar todos los permisos de esta categoría
      setSelectedPermissions((prev) => [
        ...prev.filter((id) => !categoryPermissionIds.includes(id)),
        ...categoryPermissionIds
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/roles/${role.id}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permissions: selectedPermissions,
        }),
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Error al guardar permisos"}`);
      }
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      alert("Error al guardar los permisos");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      usuarios: "👥",
      roles: "🛡️",
      dashboard: "📊",
      reportes: "📈",
      contactos: "📞",
      mensajes: "💬",
      bots: "🤖",
      configuracion: "⚙️",
    };
    return icons[category] || "📋";
  };

  const getCategoryTitle = (category) => {
    const titles = {
      usuarios: "Gestión de Usuarios",
      roles: "Gestión de Roles",
      dashboard: "Dashboard",
      reportes: "Reportes",
      contactos: "Contactos",
      mensajes: "Mensajes",
      bots: "Bots",
      configuracion: "Configuración",
    };
    return titles[category] || category;
  };

  const isCategoryAllSelected = (categoryPermissions) => {
    return categoryPermissions.every((p) => selectedPermissions.includes(p.id));
  };

  const isCategoryPartiallySelected = (categoryPermissions) => {
    const selected = categoryPermissions.filter((p) => selectedPermissions.includes(p.id));
    return selected.length > 0 && selected.length < categoryPermissions.length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Gestionar Permisos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Rol: <span className="font-medium">{role?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Permisos del Sistema
                </h3>
              </div>
              <div className="text-sm text-gray-600">
                {selectedPermissions.length} permisos seleccionados
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(availablePermissions).map(([category, permissions]) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(permissions)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">
                          {getCategoryTitle(category)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {permissions.length} permisos disponibles
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCategoryAllSelected(permissions) && (
                        <CheckSquare className="h-5 w-5 text-purple-600" />
                      )}
                      {isCategoryPartiallySelected(permissions) && (
                        <div className="h-5 w-5 border-2 border-purple-600 rounded bg-purple-100 flex items-center justify-center">
                          <span className="text-xs text-purple-600 font-medium">
                            {permissions.filter((p) => selectedPermissions.includes(p.id)).length}
                          </span>
                        </div>
                      )}
                      {!isCategoryAllSelected(permissions) && !isCategoryPartiallySelected(permissions) && (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  <div className="divide-y divide-gray-200">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {permission.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Consejos:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Haz clic en el encabezado de una categoría para seleccionar todos sus permisos</li>
                  <li>• Los permisos controlan lo que los usuarios pueden hacer en el sistema</li>
                  <li>• Los roles de sistema (admin, superadmin) tienen acceso completo por defecto</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Permisos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
