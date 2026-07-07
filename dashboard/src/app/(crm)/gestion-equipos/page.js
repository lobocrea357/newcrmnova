'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { supabase } from '@/lib/supabase'
import { EQUIPOS_API } from '@/config/apiConfig'
import { Users, UserPlus, UserMinus, Shield, Search, RefreshCw, ChevronRight } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { useRouter, usePathname } from 'next/navigation'

export default function GestionEquiposPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { profile, loading: loadingProfile, isSuperAdmin, isAdmin, isManager } = useUserProfile()
  const canAccessPage = isSuperAdmin || isAdmin || isManager
  const [equipo, setEquipo] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [asesoresSinEquipo, setAsesoresSinEquipo] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Log para verificar la ruta actual
  useEffect(() => {
    // console.log("🔍 Ruta actual:", pathname)
    // if (pathname === '/configuracion/mi-equipo') {
    //   console.log("⚠️ Usuario accediendo a ruta antigua, debería redirigir a /gestion-equipos")
    // }
  }, [pathname])

  const loadData = useCallback(async () => {
    // console.log("🔍 loadData: Perfil actual", profile)
    // console.log("🔍 loadData: User ID", user?.id)
    // console.log("🔍 loadData: Profile ID", profile?.id)
    // console.log("🔍 loadData: Profile role", profile?.role?.name)

    if (!profile?.id || !canAccessPage) {
      setLoadingData(false)
      return
    }

    try {
      setLoadingData(true)
      // console.log("🔍 loadData: Buscando equipo para gerente_id =", profile.id)
      
      // 1. Cargar equipo del gerente (buscar donde gerente_id = profile.id)
      const { data: equipoData, error: equipoError } = await supabase
        .from('equipos')
        .select('*')
        .eq('gerente_id', profile.id)
        .eq('is_active', true)
        .single()
      
      // console.log("🔍 loadData: Resultado consulta equipoData", equipoData)
      // console.log("🔍 loadData: Error consulta equipoError", equipoError)

      if (equipoData) {
        // console.log("✅ loadData: Equipo encontrado:", equipoData.nombre)
        setEquipo(equipoData)
      } else {
        // console.log("❌ loadData: No se encontró equipo para el gerente")
      }

      // 2. Cargar miembros del equipo (asesores con equipo_id = equipo.id)
      if (equipoData) {
        const { data: miembrosData, error: miembrosError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role:roles(name)')
          .eq('equipo_id', equipoData.id)
        
        // console.log("🔍 loadData: Resultado consulta miembrosData", miembrosData)
        // console.log("🔍 loadData: Error consulta miembrosError", miembrosError)

        if (miembrosData) setMiembros(miembrosData)

        // 3. Cargar asesores sin equipo
        const { data: sinEquipoData, error: sinEquipoError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role:roles(name)')
          .is('equipo_id', null)
          .neq('id', user?.id) // No incluirse a sí mismo
          .eq('role_id', (await supabase.from('roles').select('id').eq('name', 'asesor').single()).data?.id)

        // console.log("🔍 loadData: Resultado consulta sinEquipoData", sinEquipoData)
        // console.log("🔍 loadData: Error consulta sinEquipoError", sinEquipoError)

        if (sinEquipoData) setAsesoresSinEquipo(sinEquipoData)
      }

    } catch (err) {
      console.error('❌ Error cargando datos del equipo:', err)
    } finally {
      setLoadingData(false)
    }
  }, [profile?.id, canAccessPage, user?.id])

  useEffect(() => {
    if (profile) loadData()
  }, [profile, loadData])

  const handleAsignar = async (asesorId) => {
    if (!equipo?.id) return
    setIsProcessing(true)
    try {
      const res = await fetch(EQUIPOS_API.asignar, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: asesorId,
          equipoId: equipo.id
        })
      })
      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error('Error asignando asesor:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemover = async (asesorId) => {
    setIsProcessing(true)
    try {
      const res = await fetch(EQUIPOS_API.remover(asesorId), {
        method: 'PATCH'
      })
      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error('Error removiendo asesor:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredSinEquipo = asesoresSinEquipo.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loadingProfile || (loadingData && !equipo)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!equipo && canAccessPage) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">No tienes un equipo asignado</h1>
        <p className="text-gray-600 mt-2">Como gerente, necesitas estar asignado a un equipo para gestionarlo. Contacta con un administrador.</p>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Nota para administradores:</strong> Si ya creaste equipos pero los gerentes no pueden verlos, 
            verifica que cada gerente tenga un equipo creado donde <code>gerente_id</code> sea el ID del gerente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Gestión de Equipos', href: '/gestion-equipos' },
          ]}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: equipo?.color || '#6366f1' }}
              >
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{equipo?.nombre || 'Gestión de Equipos'}</h1>
                <p className="text-gray-500 text-sm">Administra los miembros de tu equipo de ventas</p>
              </div>
            </div>
            <button 
              onClick={loadData}
              className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Miembros del Equipo */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Miembros actuales ({miembros.length})
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {miembros.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <p>No hay miembros en este equipo todavía.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {miembros.map((m) => (
                    <li key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {m.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{m.full_name}</p>
                          <p className="text-xs text-gray-500">{m.email}</p>
                        </div>
                      </div>
                      {/* Solo permitir remover si no es el gerente mismo */}
                      {m.id !== user?.id && (
                        <button
                          onClick={() => handleRemover(m.id)}
                          disabled={isProcessing}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Remover del equipo"
                        >
                          <UserMinus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Asesores Disponibles */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Agregar Asesores
            </h2>
            <div className="space-y-4">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar asesores sin equipo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                {filteredSinEquipo.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <p>{searchQuery ? 'No se encontraron asesores' : 'No hay asesores disponibles sin equipo'}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredSinEquipo.map((m) => (
                      <li key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                            {m.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{m.full_name}</p>
                            <p className="text-xs text-gray-500">{m.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAsignar(m.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Agregar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
