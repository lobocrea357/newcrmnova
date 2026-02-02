"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

/**
 * Componente de Breadcrumbs para navegación
 * @param {Array} items - Array de objetos con { label, href }
 *   Ejemplo: [{ label: "Inicio", href: "/" }, { label: "Rendimiento", href: "/rendimiento" }]
 */
export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4">
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
  );
}
