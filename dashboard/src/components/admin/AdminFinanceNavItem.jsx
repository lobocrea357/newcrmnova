'use client'

import Link from 'next/navigation'

/**
 * Componente individual de item de navegación para AdminFinanceNav
 * Permite personalizar el renderizado de cada item si es necesario
 */
export default function AdminFinanceNavItem({ item, isActive }) {
  const { label, href, icon: Icon, badge } = item

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors
        ${isActive
          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {badge !== null && badge > 0 && (
        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  )
}
