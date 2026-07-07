"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Calculator, ClipboardList, Plus, ChevronUp } from "lucide-react";

/**
 * Floating Action Button contextual que cambia según la página
 * Proporciona accesos rápidos entre Cotizador y Cotizaciones
 */
export default function FloatingActionButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Determinar el contexto actual
  const isInCotizador = pathname?.includes('/cotizador');
  const isInCotizaciones = pathname?.includes('/cotizaciones');

  // No mostrar el FAB si no estamos en ninguna de estas vistas
  if (!isInCotizador && !isInCotizaciones) return null;

  const config = isInCotizador
    ? {
        icon: ClipboardList,
        label: "Ver mis cotizaciones",
        onClick: () => router.push('/ventas/cotizaciones'),
        gradient: "from-indigo-500 to-purple-600",
        hoverGradient: "from-indigo-600 to-purple-700",
      }
    : {
        icon: Plus,
        label: "Nueva cotización",
        onClick: () => router.push('/cotizador'),
        gradient: "from-green-500 to-emerald-600",
        hoverGradient: "from-green-600 to-emerald-700",
      };

  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Label flotante */}
      <div
        className={`
          transition-all duration-300 ease-out transform
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
        `}
      >
        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
          {config.label}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900" />
          </div>
        </div>
      </div>

      {/* Botón principal */}
      <button
        onClick={config.onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative
          w-14 h-14 rounded-full shadow-2xl
          bg-gradient-to-br ${config.gradient}
          hover:${config.hoverGradient}
          transform transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          flex items-center justify-center
          ring-4 ring-white
        `}
        aria-label={config.label}
      >
        {/* Efecto de pulsación */}
        <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        
        {/* Icono */}
        <Icon className="w-6 h-6 text-white relative z-10" />

        {/* Animación de ondas */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" style={{ animationDuration: '2s' }} />
      </button>

      {/* Botón scroll to top (opcional, se muestra al hacer scroll) */}
      {typeof window !== 'undefined' && window.scrollY > 300 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-800 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Ir arriba"
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
