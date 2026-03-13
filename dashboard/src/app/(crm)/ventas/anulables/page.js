'use client'
import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import AnulablesList from '@/components/anulables/AnulablesList'
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function AnulablesPage() {
  const [anulables, setAnulables] = useState([])
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    fetchAnulables()
  }, [filters])

  const fetchAnulables = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/anulables?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener anulables')
      }

      const { data, pagination: paginationData } = await response.json()
      setAnulables(data)
      setPagination(paginationData)
    } catch (error) {
      console.error('Error fetching anulables:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Anulables</h1>
            </div>
            <p className="text-gray-600">
              Gestión de casos de anulación de vuelos
            </p>
          </div>

          <AnulablesList
            anulables={anulables}
            pagination={pagination}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}
