'use client';

import { useState, useEffect } from 'react';
import { VUELOS_API } from '@/config/apiConfig';
import { Clock, User, FileText, AlertCircle } from 'lucide-react';
import { useUserProfile } from '@/contexts/UserProfileContext';

export default function HistorialCambiosEstado({ vueloId }) {
  const { isAdmin, isSuperAdmin } = useUserProfile();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Validación de permisos: solo admins y super_admins pueden ver historial
  const puedeVerHistorial = isAdmin || isSuperAdmin;

  useEffect(() => {
    if (vueloId && isExpanded) {
      fetchHistorial();
    }
  }, [vueloId, isExpanded]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const response = await fetch(VUELOS_API.historialCambios(vueloId));
      if (!response.ok) throw new Error('Error al cargar historial');
      const data = await response.json();
      setHistorial(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!puedeVerHistorial) {
    return null;
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <Clock className="w-4 h-4" />
        <span>Ver Historial de Cambios</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Historial de Cambios de Estado
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : historial.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No hay cambios de estado registrados
        </div>
      ) : (
        <div className="space-y-3">
          {historial.map((cambio, index) => (
            <div
              key={index}
              className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded-r"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-gray-800">
                      Campo: {cambio.campo_cambiado}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Anterior:</span>
                      <span className="ml-2 text-gray-700">
                        {cambio.valor_anterior || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Nuevo:</span>
                      <span className="ml-2 text-green-600 font-medium">
                        {cambio.valor_nuevo || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {cambio.razon_cambio && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Razón:</span>
                      <span className="ml-2 text-gray-700 italic">
                        {cambio.razon_cambio}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <User className="w-3 h-3" />
                    <span>{cambio.usuario_nombre || 'Sistema'}</span>
                  </div>
                  <div className="text-gray-500">
                    {new Date(cambio.fecha_cambio).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </div>
                  {cambio.ip_address && (
                    <div className="text-xs text-gray-400 mt-1">
                      IP: {cambio.ip_address}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
