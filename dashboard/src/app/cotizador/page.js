'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { Calculator, ArrowLeft, Settings, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import CotizadorForm from '@/components/cotizador/CotizadorForm'
import TasasManager from '@/components/cotizador/TasasManager'
import MonedasManager from '@/components/cotizador/MonedasManager'
import HeroTutorial from '@/components/cotizador/HeroTutorial'
import BannerCotizacionGuardada from '@/components/cotizador/BannerCotizacionGuardada'

export default function CotizadorPage() {
  const { user, session, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, allPermissions, isSuperAdmin, isAdmin, isManager, hasAnyPermission } = useUserProfile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('calculadora') // 'calculadora' | 'tasas' | 'monedas'
  const [bannerVisible, setBannerVisible] = useState(false)
  const [formKey, setFormKey] = useState(0) // Para forzar remount del form
  
  const isAuthenticated = !!user && !!session
  
  // IMPORTANTE: Solo evaluar permisos cuando el perfil ha cargado completamente
  // Si aún está cargando, NO mostrar tabs de gestión
  const permissionsLoaded = !profileLoading && profile !== null
  
  // Pestañas de gestión: solo para roles privilegiados o permisos de ESCRITURA/GESTIÓN explícitos.
  // NOTA: tasas.view / monedas.view se excluyen a propósito — son permisos de lectura
  // para que los asesores vean las tasas al cotizar, pero NO para gestionarlas.
  const canManageTasas = permissionsLoaded && (
    isSuperAdmin || isAdmin || isManager ||
    hasAnyPermission(['tasas.edit', 'tasas.create', 'tasas.delete', 'tasas.manage'])
  )
  const canManageMonedas = permissionsLoaded && (
    isSuperAdmin || isAdmin || isManager ||
    hasAnyPermission(['monedas.edit', 'monedas.create', 'monedas.delete', 'monedas.manage'])
  )
  const canManageSettings = canManageTasas || canManageMonedas

  // DEBUG: Log para diagnosticar visibilidad de tabs
  if (permissionsLoaded) {
    console.log('📊 [Cotizador] Evaluación de tabs:', {
      profileLoading,
      profileExists: !!profile,
      permissionsLoaded,
      role: profile?.role?.name,
      isSuperAdmin,
      isAdmin,
      isManager,
      canManageTasas,
      canManageMonedas,
      canManageSettings
    })
  }

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado: mostrar con layout del CRM y Tabs
  if (isAuthenticated) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-gray-50">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
        />
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <Navbar
            onMenuClick={() => setSidebarOpen(true)}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
          />
          <main className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                {/* Tabs */}
                <div className="flex space-x-1 rounded-xl bg-gray-200 p-1 w-fit mb-6">
                  <button
                    onClick={() => setActiveTab('calculadora')}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200
                      ${activeTab === 'calculadora'
                        ? 'bg-white text-indigo-700 shadow'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
                      }
                    `}
                  >
                    <Calculator className="w-4 h-4" />
                    Cotizador
                  </button>
                  {canManageTasas && (
                    <button
                      onClick={() => setActiveTab('tasas')}
                        className={`
                          flex items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200
                          ${activeTab === 'tasas'
                            ? 'bg-white text-indigo-700 shadow'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
                          }
                        `}
                      >
                      <Settings className="w-4 h-4" />
                      Gestionar Tasas
                    </button>
                  )}
                  {canManageMonedas && (
                    <button
                      onClick={() => setActiveTab('monedas')}
                        className={`
                          flex items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200
                          ${activeTab === 'monedas'
                            ? 'bg-white text-indigo-700 shadow'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
                          }
                        `}
                      >
                      <TrendingUp className="w-4 h-4" />
                      Gestionar Monedas
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="transition-all duration-300 ease-in-out">
                {activeTab === 'calculadora' ? (
                  <>
                    <HeroTutorial />
                    <BannerCotizacionGuardada
                      isVisible={bannerVisible}
                      onClose={() => setBannerVisible(false)}
                      onNuevaCotizacion={() => {
                        setBannerVisible(false)
                        setFormKey(prev => prev + 1) // Forzar remount del form
                      }}
                    />
                    <CotizadorForm 
                      key={formKey}
                      isAuthenticated={isAuthenticated} 
                      showBannerOutside={true}
                      onCotizacionGuardada={() => setBannerVisible(true)}
                    />
                  </>
                ) : activeTab === 'tasas' ? (
                  <TasasManager />
                ) : (
                  <MonedasManager />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Si NO está autenticado: mostrar vista pública sin layout y sin tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Login
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Calculadora de Cotizaciones
          </h1>
          <p className="text-slate-600">
            Calcula tus cotizaciones de forma rápida y precisa
          </p>
        </div>

        <HeroTutorial />
        <CotizadorForm isAuthenticated={false} />
      </div>
    </div>
  )
}
