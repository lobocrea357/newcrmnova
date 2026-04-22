'use client';

import { useState } from 'react';
import { VUELOS_API } from '@/config/apiConfig';
import { Send } from 'lucide-react';
import Swal from 'sweetalert2';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SolicitarAutorizacionButton({ vueloId, vueloEstado }) {
  const { isEmisor } = useUserProfile();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Verificar permisos: solo emisores pueden solicitar
  const puedeSolicitar = isEmisor && vueloEstado === 'PENDIENTE_EMISION';

  if (!puedeSolicitar) {
    return null;
  }

  const handleSolicitar = async () => {
    const result = await Swal.fire({
      title: '¿Solicitar Autorización?',
      text: 'Se notificará a todos los administradores para que revisen esta emisión.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, solicitar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(VUELOS_API.solicitarAutorizacion(vueloId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al solicitar autorización');
      }

      const data = await response.json();

      await Swal.fire({
        title: '¡Solicitud Enviada!',
        text: data.message,
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });

      // Recargar página para actualizar estado
      window.location.reload();
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSolicitar}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Enviando...</span>
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          <span>Solicitar Autorización</span>
        </>
      )}
    </button>
  );
}
