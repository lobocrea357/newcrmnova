"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertTriangle, RefreshCw } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function RolesDebugPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAdmin } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'superadmin']
  });
  const [apiData, setApiData] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      testApiConnection();
    }
  }, [authLoading, user, isAdmin]);

  const testApiConnection = async () => {
    setTestLoading(true);
    setError(null);
    setApiData(null);
    
    try {
      console.log('🔍 Probando conexión API...');
      
      // Probar diferentes URLs
      const urls = [
        'http://localhost:4000/api/roles',
        'http://localhost:3000/api/roles',
        'http://172.18.0.2:4000/api/roles',
        'http://172.18.0.3:3000/api/roles'
      ];

      for (const url of urls) {
        console.log(`📍 Probando: ${url}`);
        try {
          const response = await fetch(url);
          const data = await response.json();
          console.log(`✅ Éxito en: ${url}`, data);
          setApiData(data);
          break;
        } catch (err) {
          console.log(`❌ Error en: ${url}`, err.message);
          setError(`Error en ${url}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('❌ Error general:', err);
      setError('Error general: ' + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  if (authLoading) {
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
              { label: "Roles (Debug)", href: "/configuracion/roles/debug" },
            ]}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="h-8 w-8 text-purple-600" />
                  Gestión de Roles (Debug)
                </h1>
                <p className="text-gray-600 mt-2">
                  Página de depuración para identificar errores
                </p>
              </div>

              <button
                onClick={testApiConnection}
                disabled={testLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${testLoading ? "animate-spin" : ""}`}
                />
                Probar Conexión API
              </button>
            </div>

            {/* Estado de la API */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Estado de la Conexión</h3>
              {testLoading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-gray-600">Probando conexión...</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">Error:</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              {apiData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-green-600 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-green-800 font-medium">Conexión exitosa</p>
                      <p className="text-sm text-green-700">Roles encontrados: {apiData.data?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Datos de la API */}
            {apiData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Datos de la API
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Respuesta de: {apiData.success ? 'API Backend' : 'Error'}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuarios
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {apiData.data?.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {role.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border-purple-200">
                              {role.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {role.description || 'Sin descripción'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {role.profiles_count || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Información del usuario */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Información del Usuario</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <p><strong>Rol:</strong> {profile?.role?.name || 'N/A'}</p>
                <p><strong>Es Admin:</strong> {isAdmin ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
