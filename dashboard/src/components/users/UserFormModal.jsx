"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, User, Mail, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from 'react-hot-toast';

export default function UserFormModal({ user, roles, onClose, onSave, currentUserId }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleId: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        roleId: user.role?.id || "",
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!user && !formData.password) {
      newErrors.password = "La contraseña es requerida para crear un usuario";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (formData.password && !formData.confirmPassword) {
      newErrors.confirmPassword = "Debe confirmar la contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!formData.roleId) {
      newErrors.roleId = "Debe seleccionar un rol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const url = user
        ? `${apiUrl}/api/users/${user.id}`
        : `${apiUrl}/api/users`;
      const method = user ? "PUT" : "POST";

      const body = {
        fullName: formData.fullName,
        email: formData.email,
        roleId: formData.roleId,
      };

      if (formData.password) {
        body.password = formData.password;
      }

      const headers = {
        "Content-Type": "application/json",
      };

      // Agregar x-user-id para validación jerárquica
      if (currentUserId) {
        headers["x-user-id"] = currentUserId;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.error || "Error al guardar usuario"}`);
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      toast.error("Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Nombre Completo
              </div>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${errors.fullName ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.fullName && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </div>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="usuario@ejemplo.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-400" />
                Contraseña
                {user && (
                  <span className="text-xs text-gray-400 font-normal">
                    (dejar en blanco para mantener la actual)
                  </span>
                )}
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 hover:border-gray-300"
                  }`}
                placeholder={user ? "••••••••" : "Mínimo 6 caracteres"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-all"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.password}</p>
            )}
          </div>

          {formData.password && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  Confirmar Contraseña
                </div>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${errors.confirmPassword ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 hover:border-gray-300"
                    }`}
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-all"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                Rol
              </div>
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => handleChange("roleId", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none bg-white ${errors.roleId ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <option value="">Seleccionar rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                  {role.description && ` - ${role.description}`}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.roleId}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {user ? "Guardar Cambios" : "Crear Usuario"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
