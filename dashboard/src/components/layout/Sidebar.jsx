'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { visibleGroups, isActivePath } from '@/lib/navigation'
import { avatarUrl, initials } from '@/lib/avatar'

const ROLE_LABELS = {
    super_admin: 'Super administrador',
    admin: 'Administrador',
    gerente: 'Gerente',
    lider: 'Líder',
    asesor: 'Asesor',
    emisor: 'Emisor',
    administracion: 'Administración',
    supervisor: 'Supervisor',
}

/**
 * Menú lateral. Los ítems de cada grupo cuelgan de una línea discontinua (una
 * ruta de vuelo); el ítem activo se marca con un punto sobre esa línea.
 */
const Sidebar = ({ isOpen = false, onClose, collapsed = false, onToggleCollapse }) => {
    const pathname = usePathname()
    const { profile, role, loading, hasPermission } = useUserProfile()
    const ready = !loading && profile !== null
    const groups = React.useMemo(
        () => (ready ? visibleGroups({ role: role?.toLowerCase(), hasPermission }) : []),
        [ready, role, hasPermission]
    )
    const name = profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'
    const photo = avatarUrl(profile?.avatar_url)

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-tinta/40 z-30 lg:hidden" onClick={onClose} aria-hidden="true" />
            )}

            <aside
                className={`fixed left-0 top-0 h-screen z-40 flex flex-col bg-tinta text-white
                    transition-[width,transform] duration-200 ease-out
                    ${collapsed ? 'w-[72px]' : 'w-[248px]'}
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                aria-label="Menú principal"
            >
                {/* Marca */}
                <div className={`flex items-center h-16 shrink-0 ${collapsed ? 'justify-center px-2' : 'px-5 gap-3'}`}>
                    <img src="/logo-blanco2.png" alt="" className="h-8 w-8 object-contain shrink-0" />
                    {!collapsed && (
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="text-[15px] font-semibold tracking-tight">Viajes Nova</p>
                            <p className="text-xs text-white/50">CRM</p>
                        </div>
                    )}
                    <button onClick={onClose} className="lg:hidden p-1.5 rounded-md hover:bg-white/10" aria-label="Cerrar menú">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navegación */}
                <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
                    {!ready ? (
                        <div className="space-y-2 pt-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="h-8 rounded-md bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.id} className="mt-5 first:mt-1">
                                {group.label && !collapsed && (
                                    <p className="px-3 mb-1.5 text-xs font-medium text-white/40">{group.label}</p>
                                )}
                                {group.label && collapsed && <div className="mx-auto mb-2 h-px w-6 bg-white/10" />}
                                <ul className={`relative ${collapsed ? '' : 'ml-3 border-l border-dashed border-white/15'}`}>
                                    {group.items.map((item) => {
                                        const Icon = item.icon
                                        const active = isActivePath(pathname, item)
                                        return (
                                            <li key={item.href} className="relative">
                                                {!collapsed && active && (
                                                    <span
                                                        className="absolute -left-[5px] top-1/2 -translate-y-1/2 h-[9px] w-[9px] rounded-full bg-nova-400 ring-4 ring-tinta"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <Link
                                                    href={item.href}
                                                    onClick={onClose}
                                                    title={collapsed ? item.label : undefined}
                                                    aria-current={active ? 'page' : undefined}
                                                    className={`flex items-center gap-3 rounded-md text-sm transition-colors
                                                        ${collapsed ? 'justify-center h-10 w-10 mx-auto my-0.5' : 'ml-3 px-2.5 py-2'}
                                                        ${active
                                                            ? 'bg-white/10 text-white font-medium'
                                                            : 'text-white/65 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-nova-300' : ''}`} strokeWidth={1.8} />
                                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </nav>

                {/* Usuario + colapsar */}
                <div className="shrink-0 border-t border-white/10 p-3">
                    <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
                        <Link href="/perfil" className={`flex items-center gap-3 min-w-0 rounded-md p-1.5 hover:bg-white/5 ${collapsed ? '' : 'flex-1'}`} title="Mi perfil">
                            {photo ? (
                                <img src={photo} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                            ) : (
                                <span className="h-8 w-8 rounded-full bg-nova-600 grid place-items-center text-xs font-semibold shrink-0">
                                    {initials(name)}
                                </span>
                            )}
                            {!collapsed && (
                                <span className="min-w-0 leading-tight">
                                    <span className="block text-sm font-medium truncate">{name}</span>
                                    <span className="block text-xs text-white/50 truncate">{ROLE_LABELS[role?.toLowerCase()] || role || ''}</span>
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={onToggleCollapse}
                            className="hidden lg:grid place-items-center h-8 w-8 rounded-md text-white/50 hover:text-white hover:bg-white/10 shrink-0"
                            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
                            title={collapsed ? 'Expandir menú' : 'Contraer menú'}
                        >
                            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
