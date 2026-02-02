"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function NoAutorizadoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            403
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-4">
            Acceso No Autorizado
          </h2>

          {/* Descripción */}
          <p className="text-lg text-gray-600 mb-2">
            Lo sentimos, no tienes permisos para acceder a este módulo.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Tu rol actual <span className="font-semibold text-orange-600">Gerente</span> no incluye acceso a esta sección del sistema.
          </p>

          {/* Mensaje informativo */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-orange-800">
              <strong>¿Necesitas acceso?</strong> Contacta al administrador del sistema para solicitar los permisos necesarios.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver Atrás
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Home className="w-5 h-5" />
              Ir al Dashboard
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta con el equipo de soporte.
          </p>
        </div>
      </div>
    </div>
  );
}
