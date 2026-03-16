'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Plane } from 'lucide-react'
import VuelosList from '@/components/vuelos/VuelosList'
import { VUELOS_API } from '@/config/apiConfig'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useAuth } from '@/contexts/AuthContext'

export default function VuelosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { role, loading: profileLoading } = useUserProfile()
  const [vuelos, setVuelos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    if (!profileLoading && user) {
      fetchVuelos()
    }
  }, [filters, profileLoading, user, role])

  const fetchVuelos = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('user_id', user.id)
      params.append('role', role)

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`${VUELOS_API.listar}?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al obtener vuelos')
      }

      const { data } = await response.json()
      setVuelos(data || [])
    } catch (error) {
      console.error('Error fetching vuelos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const getTituloVista = () => {
    if (role === 'asesor') return 'Mis Vuelos'
    if (role === 'gerente') return 'Vuelos de Mi Equipo'
    return 'Todos los Vuelos'
  }

  const getDescripcionVista = () => {
    if (role === 'asesor') return 'Vuelos que has creado'
    if (role === 'gerente') return 'Vuelos de tu equipo de asesores'
    return 'Gestión completa de vuelos'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Plane className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">{getTituloVista()}</h1>
            </div>
            <p className="text-gray-600">{getDescripcionVista()}</p>
          </div>

          <button
            onClick={() => router.push('/ventas/vuelos/nuevo')}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Vuelo
          </button>
        </div>

        <VuelosList
          vuelos={vuelos}
          role={role}
          onFilterChange={handleFilterChange}
          isLoading={isLoading || profileLoading}
        />
      </div>
    </div>
  )
}
