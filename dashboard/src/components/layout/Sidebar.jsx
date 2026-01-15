'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Brain,
    TrendingUp,
    FileText,
    BookOpen,
    AlertTriangle,
    XCircle,
    Settings
} from 'lucide-react'

const Sidebar = () => {
    const pathname = usePathname()

    const menuItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/conversaciones', label: 'Conversaciones', icon: MessageSquare },
        { href: '/inteligencia-artificial', label: 'IA', icon: Brain },
        { href: '/desempenio', label: 'Desempeño', icon: TrendingUp },
        { href: '/reportes', label: 'Reportes', icon: FileText },
        { href: '/manual-ventas', label: 'Manual de Ventas', icon: BookOpen },
        { href: '/rutas-riesgo', label: 'Rutas en Riesgo', icon: AlertTriangle },
        { href: '/anulables', label: 'Anulables', icon: XCircle },
        { href: '/configuracion', label: 'Configuración', icon: Settings },
    ]

    const isActive = (href) => {
        if (href === '/') {
            return pathname === '/'
        }
        return pathname?.startsWith(href)
    }

    return (
        <aside className="fixed left-0 top-0 w-64 bg-gray-800 text-white h-screen flex flex-col z-40">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">CRM Nova</h2>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                                        transition-colors duration-200
                                        ${active
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }
                                    `}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}

export default Sidebar