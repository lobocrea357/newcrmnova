'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Bell, User, LogOut, ChevronDown, Menu, PanelLeftClose, PanelLeft } from 'lucide-react'

const Navbar = ({ onMenuClick, onToggleCollapse, sidebarCollapsed = false }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getPageTitle = () => {
    const routes = {
      '/': 'Dashboard',
      '/conversaciones': 'Conversaciones',
      '/inteligencia-artificial': 'Inteligencia Artificial',
      '/desempenio': 'Desempeño',
      '/reportes': 'Reportes',
      '/manual-ventas': 'Manual de Ventas',
      '/rutas-riesgo': 'Rutas en Riesgo',
      '/anulables': 'Anulables',
      '/configuracion': 'Configuración',
    }
    return routes[pathname] || 'Dashboard'
  }

  const getPageSubtitle = () => {
    const subtitles = {
      '/': 'Vista general del negocio',
      '/conversaciones': 'Gestión de conversaciones con clientes',
      '/inteligencia-artificial': 'Análisis y insights con IA',
      '/desempenio': 'Métricas y rendimiento del equipo',
      '/reportes': 'Reportes y análisis de datos',
      '/manual-ventas': 'Guías y recursos de ventas',
      '/rutas-riesgo': 'Rutas y clientes en riesgo',
      '/anulables': 'Gestión de anulaciones',
      '/configuracion': 'Configuración del sistema',
    }
    return subtitles[pathname] || 'Bienvenido al CRM'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Sección izquierda: Botones */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Botón hamburguesa solo visible en móvil */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </button>

            {/* Botón toggle collapse solo visible en desktop */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-5 w-5 text-gray-600" />
              ) : (
                <PanelLeftClose className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Título de página */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 truncate">
                {getPageTitle()}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate hidden sm:block">
                {getPageSubtitle()}
              </p>
            </div>
          </div>

          {/* Sección derecha: Acciones */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Búsqueda - Oculta en móvil */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversaciones, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 lg:w-80 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notificaciones - Ocultas en móvil pequeño */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.user_metadata?.full_name || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar