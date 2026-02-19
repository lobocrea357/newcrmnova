'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Plane } from 'lucide-react'
import VuelosList from '@/components/vuelos/VuelosList'

export default function VuelosPage() {
  const router = useRouter()
  const [vuelos, setVuelos] = useState([])
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    fetchVuelos()
  }, [filters])

  const fetchVuelos = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/vuelos?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener vuelos')
      }

      const { data, pagination: paginationData } = await response.json()
      setVuelos(data)
      setPagination(paginationData)
    } catch (error) {
      console.error('Error fetching vuelos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Plane className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Vuelos</h1>
            </div>
            <p className="text-gray-600">
              Gestión de vuelos pagados y seguimiento de anulables
            </p>
          </div>
          
          <button
            onClick={() => router.push('/vuelos/nuevo')}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Vuelo
          </button>
        </div>

        <VuelosList
          vuelos={vuelos}
          pagination={pagination}
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
