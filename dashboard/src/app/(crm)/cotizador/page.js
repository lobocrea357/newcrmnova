'use client'
import { useState } from 'react'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { Calculator, Settings, TrendingUp } from 'lucide-react'
import CotizadorForm from '@/components/cotizador/CotizadorForm'
import TasasManager from '@/components/cotizador/TasasManager'
import MonedasManager from '@/components/cotizador/MonedasManager'
import HeroTutorial from '@/components/cotizador/HeroTutorial'
import BannerCotizacionGuardada from '@/components/cotizador/BannerCotizacionGuardada'
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'
import FloatingActionButton from '@/components/ui/FloatingActionButton'

export default function CotizadorPage() {
  const { profile, loading: profileLoading, isSuperAdmin, isAdmin, isManager, hasAnyPermission } = useUserProfile()
  const [activeTab, setActiveTab] = useState('calculadora')
  const [bannerVisible, setBannerVisible] = useState(false)
  const [bannerData, setBannerData] = useState({})
  const [formKey, setFormKey] = useState(0)
  
  const permissionsLoaded = !profileLoading && profile !== null
  
  const canManageTasas = permissionsLoaded && (
    isSuperAdmin || isAdmin || isManager ||
    hasAnyPermission(['tasas.edit', 'tasas.create', 'tasas.delete', 'tasas.manage'])
  )
  const canManageMonedas = permissionsLoaded && (
    isSuperAdmin || isAdmin || isManager ||
    hasAnyPermission(['monedas.edit', 'monedas.create', 'monedas.delete', 'monedas.manage'])
  )

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Cotizador', href: '/cotizador' }
  ]

  const handleCotizacionGuardada = (data) => {
    setBannerData(data)
    setBannerVisible(true)
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <NavigationBreadcrumb items={breadcrumbItems} />

        <div className="mb-6">
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

        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'calculadora' ? (
            <>
              <HeroTutorial />
              <BannerCotizacionGuardada
                isVisible={bannerVisible}
                onClose={() => setBannerVisible(false)}
                onNuevaCotizacion={() => {
                  setBannerVisible(false)
                  setBannerData({})
                  setFormKey(prev => prev + 1)
                }}
                cotizacionId={bannerData.id}
                nombreCliente={bannerData.nombreCliente}
                fechaCreacion={bannerData.createdAt}
              />
              <CotizadorForm 
                key={formKey}
                showBannerOutside={true}
                onCotizacionGuardada={handleCotizacionGuardada}
              />
            </>
          ) : activeTab === 'tasas' ? (
            <TasasManager />
          ) : (
            <MonedasManager />
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  )
}
