"use client";

import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Componente de Breadcrumbs mejorado con botón de retroceso contextual
 * @param {Array} items - Array de objetos con { label, href }
 * @param {string} backLabel - Texto del botón de retroceso (opcional)
 * @param {string} backHref - URL de retroceso (opcional)
 * @param {boolean} showBackButton - Mostrar botón de retroceso
 */
export default function NavigationBreadcrumb({ 
  items = [], 
  backLabel = "Volver",
  backHref = null,
  showBackButton = false 
}) {
  const router = useRouter();

  if (!items.length && !showBackButton) return null;

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
              
              {isLast ? (
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  {isFirst && <Home className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  {isFirst && <Home className="h-4 w-4" />}
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Botón de retroceso contextual */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
      )}
    </div>
  );
}
