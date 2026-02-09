'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserInfo, isRouteHidden } from '@/lib/userConfig'
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
    Settings,
    User,
    Plane,
    PlaneTakeoff,
    Calculator,
    X
} from 'lucide-react'

const Sidebar = ({ isOpen = false, onClose, collapsed = false }) => {
    const pathname = usePathname()
    const [user, setUser] = useState(null)
    const [userInfo, setUserInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            const info = getUserInfo(user?.email)
            setUserInfo(info)
            console.log('🔐 Usuario loggeado (Sidebar):', {
                id: user?.id,
                email: user?.email,
                fullName: user?.user_metadata?.full_name,
                metadata: user?.user_metadata,
                role: user?.role,
                appMetadata: user?.app_metadata,
                fullPayload: user,
                customInfo: info
            })
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/conversaciones', label: 'Conversaciones', icon: MessageSquare },
        { href: '/rutas-riesgo', label: 'Rutas en Riesgo', icon: AlertTriangle },
        { href: '/rendimiento', label: 'Rendimiento', icon: TrendingUp },
        { href: '/manual-ventas', label: 'Manual de Ventas', icon: BookOpen },
        { href: '/cotizador', label: 'Cotizador', icon: Calculator },
        { href: '/vuelos', label: 'Vuelos', icon: PlaneTakeoff },
        { href: '/anulables', label: 'Anulables', icon: XCircle },
        { href: '/reportes', label: 'Reportes', icon: FileText },
        { href: '/inteligencia-artificial', label: 'IA', icon: Brain },
        { href: '/configuracion', label: 'Configuración', icon: Settings },
    ]

    const isActive = (href) => {
        if (href === '/') {
            return pathname === '/'
        }
        return pathname?.startsWith(href)
    }

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 top-0 bg-gray-800 text-white h-screen flex flex-col z-40
                transition-all duration-300 ease-in-out
                ${collapsed
                    ? 'w-20'
                    : 'w-64'
                }
                ${isOpen
                    ? 'translate-x-0'
                    : '-translate-x-full lg:translate-x-0'
                }
            `}>
                {/* Header Logo */}
                <div className="p-5 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                            <Plane className="h-6 w-6 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-white truncate">Viajes Nova</h2>
                                <p className="text-xs text-gray-400 truncate">CRM</p>
                            </div>
                        )}
                        {/* Botón cerrar en móvil */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1 hover:bg-gray-700 rounded transition-colors ml-auto"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                    <ul className="space-y-1 px-3">
                        {loading ? (
                            // Skeleton loading para menú
                            Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="px-3 py-2.5">
                                    <div className="h-5 bg-gray-700 rounded animate-pulse" />
                                </li>
                            ))
                        ) : (
                            menuItems.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)

                                // Filtrar rutas según permisos del usuario
                                if (user?.email && isRouteHidden(user.email, item.href)) {
                                    return null
                                }

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`
                                                flex items-center gap-3 rounded-lg
                                                transition-colors duration-200
                                                ${collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5'}
                                                ${active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                }
                                            `}
                                            title={collapsed ? item.label : ''}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                                        </Link>
                                    </li>
                                )
                            })
                        )}
                    </ul>
                </nav>

                {/* Footer Usuario */}
                <div className="p-4 border-t border-gray-700 bg-gray-900">
                    {loading ? (
                        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                            <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse" />
                            {!collapsed && (
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-700 rounded animate-pulse" />
                                    <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse" />
                                </div>
                            )}
                        </div>
                    ) : (
                            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold text-white">
                                        {(userInfo?.fullName || user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                {!collapsed && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {userInfo?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                                        </p>
                                        <p className="text-xs text-gray-400">{userInfo?.role || 'Usuario'}</p>
                                    </div>
                                )}
                            </div>
                    )}
                </div>
            </aside>
        </>
    )
}

export default Sidebar