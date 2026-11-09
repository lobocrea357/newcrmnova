'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { supabase } from '@/lib/supabase'
import { EQUIPOS_API } from '@/config/apiConfig'
import { Users, UserPlus, UserMinus, Shield, Search, RefreshCw } from 'lucide-react'
import { Page, PageHeader, Panel, Badge, Button, EmptyState, Skeleton } from '@/components/ui/kit'
import { initials } from '@/lib/avatar'

export default function MiEquipoPage() {
  const { user } = useAuth()
  const { profile, loading: loadingProfile, isManager } = useUserProfile()
  const [equipo, setEquipo] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [asesoresSinEquipo, setAsesoresSinEquipo] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadData = useCallback(async () => {
    // console.log("🔍 loadData (VIEJA): Perfil actual", profile)
    // console.log("🔍 loadData (VIEJA): User ID", user?.id)
    // console.log("🔍 loadData (VIEJA): Profile ID", profile?.id)
    // console.log("🔍 loadData (VIEJA): Profile role", profile?.role?.name)

    if (!profile?.id || !isManager) {
      setLoadingData(false)
      // console.log("❌ loadData (VIEJA): No es gerente o no hay ID de perfil.")
      return
    }

    try {
      setLoadingData(true)
      // console.log("🔍 loadData (VIEJA): Buscando equipo para gerente_id =", profile.id)
      
      // 1. Cargar equipo del gerente (buscar donde gerente_id = profile.id)
      const { data: equipoData, error: equipoError } = await supabase
        .from('equipos')
        .select('*')
        .eq('gerente_id', profile.id)
        .eq('is_active', true)
        .single()
      
      // console.log("🔍 loadData (VIEJA): Resultado consulta equipoData", equipoData)
      // console.log("🔍 loadData (VIEJA): Error consulta equipoError", equipoError)

      if (equipoData) {
        // console.log("✅ loadData (VIEJA): Equipo encontrado:", equipoData.nombre)
        setEquipo(equipoData)
      } else {
        // console.log("❌ loadData (VIEJA): No se encontró equipo para el gerente")
      }

      // 2. Cargar miembros del equipo (asesores con equipo_id = equipo.id)
      if (equipoData) {
        const { data: miembrosData, error: miembrosError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role:roles(name)')
          .eq('equipo_id', equipoData.id)
        
        // console.log("🔍 loadData (VIEJA): Resultado consulta miembrosData", miembrosData)
        // console.log("🔍 loadData (VIEJA): Error consulta miembrosError", miembrosError)

        if (miembrosData) setMiembros(miembrosData)

        // 3. Cargar asesores sin equipo
        const { data: sinEquipoData, error: sinEquipoError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role:roles(name)')
          .is('equipo_id', null)
          .neq('id', user?.id) // No incluirse a sí mismo
          .eq('role_id', (await supabase.from('roles').select('id').eq('name', 'asesor').single()).data?.id)

        // console.log("🔍 loadData (VIEJA): Resultado consulta sinEquipoData", sinEquipoData)
        // console.log("🔍 loadData (VIEJA): Error consulta sinEquipoError", sinEquipoError)

        if (sinEquipoData) setAsesoresSinEquipo(sinEquipoData)
      }

    } catch (err) {
      console.error('❌ Error cargando datos del equipo (VIEJA):', err)
    } finally {
      setLoadingData(false)
    }
  }, [profile?.id, isManager, user?.id])

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
      <Page>
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </Page>
    )
  }

  if (!equipo && isManager) {
    return (
      <Page>
        <Panel className="mx-auto mt-10 max-w-lg">
          <EmptyState
            icon={Shield}
            title="Aún no tienes un equipo asignado"
            description="Un administrador debe crear tu equipo y marcarte como su gerente. Cuando lo haga, aquí verás a tus asesores."
          />
        </Panel>
      </Page>
    )
  }

  const Avatar = ({ name }) => (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-nova-50 text-sm font-semibold text-nova-700">
      {initials(name)}
    </span>
  )

  return (
    <Page>
      <PageHeader
        title={equipo?.nombre || 'Mi equipo'}
        description="Suma asesores libres a tu equipo o quita a quien ya no esté contigo."
        actions={
          <Button onClick={loadData} disabled={loadingData}>
            <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="En el equipo" actions={<Badge>{miembros.length}</Badge>} padded={false}>
          {miembros.length === 0 ? (
            <EmptyState icon={Users} title="Todavía no hay asesores" description="Agrégalos desde la lista de asesores libres." />
          ) : (
            <ul className="divide-y divide-linea">
              {miembros.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={m.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-tinta">{m.full_name}</p>
                    <p className="truncate text-xs text-gray-500">{m.email}</p>
                  </div>
                  {m.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemover(m.id)}
                      disabled={isProcessing}
                      aria-label={`Quitar a ${m.full_name} del equipo`}
                      title="Quitar del equipo"
                      className="text-gray-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                      Quitar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Asesores libres" description="Sin equipo asignado" padded={false}>
          <div className="border-b border-linea p-3">
            <label className="relative block">
              <span className="sr-only">Buscar asesores libres</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Nombre o correo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-linea bg-white pl-9 pr-3 text-sm focus:border-nova-500 focus:outline-none focus:ring-2 focus:ring-nova-500/20"
              />
            </label>
          </div>
          {filteredSinEquipo.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title={searchQuery ? 'Nadie coincide con la búsqueda' : 'No hay asesores libres'}
              description={searchQuery ? 'Prueba con otro nombre o correo.' : 'Todos los asesores ya pertenecen a un equipo.'}
            />
          ) : (
            <ul className="max-h-[480px] divide-y divide-linea overflow-y-auto">
              {filteredSinEquipo.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={m.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-tinta">{m.full_name}</p>
                    <p className="truncate text-xs text-gray-500">{m.email}</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => handleAsignar(m.id)} disabled={isProcessing}>
                    <UserPlus className="h-4 w-4" />
                    Agregar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Page>
  )
}
