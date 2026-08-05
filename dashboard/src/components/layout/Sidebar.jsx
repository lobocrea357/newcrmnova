'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserProfile } from '@/contexts/UserProfileContext'
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
    PlaneTakeoff,
    Calculator,
    ClipboardList,
    X,
    CheckCircle,
    Send,
    UserPlus,
    Package,
    CreditCard,
    BarChart3,
    Clock,
    Users as UsersIcon
} from 'lucide-react'

const BASE_MENU_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/conversaciones', label: 'Conversaciones', icon: MessageSquare },
    { href: '/manual-ventas', label: 'Manual de Ventas', icon: BookOpen },
    { href: '/auditoria-ia', label: 'Auditoría IA', icon: Brain },
    { href: '/configuracion', label: 'Configuración', icon: Settings },
    // Dashboard especial para bots con sufijo _other - solo supervisor
    { href: '/other/conversaciones', label: 'Conversaciones', icon: MessageSquare, supervisorOnly: true },
    // Rutas Admin - Visible para admin, super_admin y manager
    { href: '/admin/team-members', label: 'Team Members', icon: Users, adminOnly: true },
]

const Sidebar = ({ isOpen = false, onClose, collapsed = false, onToggleCollapse }) => {
    const pathname = usePathname()
    const { profile, role, loading: profileLoading, isSuperAdmin, isAdmin, isManager, isSupervisor, isLider } = useUserProfile()

    // Solo hay un loading: el del perfil
    const loading = profileLoading

    // IMPORTANTE: Solo evaluar permisos cuando el perfil ha cargado completamente
    const permissionsLoaded = !profileLoading && profile !== null
    const canManageTeam = permissionsLoaded && (isSuperAdmin || isAdmin || isManager)

    // ROUTES_BY_ROLE — fuente única de verdad para el acceso al Sidebar.
    // null = sin restricciones (puede ver todo).
    // array = lista de rutas permitidas (prefijos).
    const ROUTES_BY_ROLE = {
        super_admin: null,
        admin: null,
        gerente: [
            '/', '/conversaciones', '/analisis/rendimiento',
            '/gestion-equipos', '/configuracion', '/auditoria-ia'
        ],
        asesor: [
            '/'
        ],
        administracion: [
            '/'
        ],
        emisor: ['/'],
        supervisor: ['/other'],
        lider: ['/conversaciones'],
    }

    // Determinar las rutas permitidas para el rol actual
    let allowedRoutes = null
    if (role) {
        const roleConfig = ROUTES_BY_ROLE[role.toLowerCase()]
        allowedRoutes = roleConfig !== undefined ? roleConfig : ['/']
    }

    // Función que determina si una ruta está visible para el usuario actual
    const isRouteVisible = (href, superAdminOnly = false, adminOnly = false, supervisorOnly = false) => {
        // Si no cargó el perfil aún, no mostrar nada (seguridad)
        if (!permissionsLoaded) return false

        // Si la ruta es solo para super_admin, verificar rol
        if (superAdminOnly) {
            return isSuperAdmin
        }

        // Si la ruta es solo para admin/super_admin/manager, verificar rol
        if (adminOnly) {
            return isSuperAdmin || isAdmin || isManager
        }

        // Si la ruta es solo para supervisor, verificar rol
        if (supervisorOnly) {
            return isSupervisor
        }

        // Si el usuario es supervisor, solo puede ver rutas bajo /other
        if (isSupervisor) {
            return href === '/other' || href.startsWith('/other/')
        }

        // Si allowedRoutes es null → puede ver todo
        if (allowedRoutes === null) return true

        // Verificar si la ruta está en las rutas permitidas
        return allowedRoutes.some(allowed => href === allowed || href.startsWith(allowed + '/'))
    }

    // Crear array final de menuItems sin mutar el original
    const finalMenuItems = React.useMemo(() => {
        const items = [...BASE_MENU_ITEMS]
        return items
    }, [canManageTeam])

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
                        <button
                            onClick={onToggleCollapse}
                            className="hidden lg:flex h-10 w-10 rounded-lg items-center justify-center flex-shrink-0 overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer group"
                            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                        >
                            <img src="/logo-blanco2.png" alt="Logo" className="h-12 w-12 object-contain group-hover:scale-110 transition-transform duration-200" />
                        </button>
                        {/* Logo no clickeable en móvil */}
                        <div className="lg:hidden h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img src="/logo-blanco2.png" alt="Logo" className="h-12 w-12 object-contain" />
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
                                finalMenuItems.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)

                                    // Filtrar rutas según ROUTES_BY_ROLE, superAdminOnly, adminOnly y supervisorOnly
                                    if (!isRouteVisible(item.href, item.superAdminOnly, item.adminOnly, item.supervisorOnly)) {
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
                            {profile?.avatar_url ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`}
                                    alt="Avatar"
                                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold text-white">
                                        {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'}
                                    </p>
                                    <p className="text-xs text-gray-400">{role || 'Usuario'}</p>
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