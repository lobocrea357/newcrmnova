'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Package, CreditCard, CheckCircle } from 'lucide-react'

/**
 * Componente de navegación horizontal para el módulo de finanzas de administración
 * Muestra tabs para las 4 vistas relacionadas con badges de contadores
 */
export default function AdminFinanceNav() {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Dashboard Emisiones',
      href: '/admin/dashboard-emisiones',
      icon: BarChart3,
      badge: null // Se puede agregar lógica de contador después
    },
    {
      label: 'Control Emisiones',
      href: '/admin/control-emisiones',
      icon: Package,
      badge: null
    },
    {
      label: 'Gestión Deudas',
      href: '/admin/deudas',
      icon: CreditCard,
      badge: null
    },
    {
      label: 'Confirmar Pagos',
      href: '/admin/confirmar-pagos',
      icon: CheckCircle,
      badge: null
    }
  ]

  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors
                  ${active
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
