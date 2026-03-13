'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import VueloDetail from '@/components/vuelos/VueloDetail'

export default function VueloDetailPage({ params }) {
  const router = useRouter()
  const [vuelo, setVuelo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchVuelo()
  }, [params.id])

  const fetchVuelo = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vuelos/${params.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Vuelo no encontrado')
        }
        throw new Error('Error al cargar vuelo')
      }

      const { vuelo: vueloData } = await response.json()
      setVuelo(vueloData)
    } catch (err) {
      console.error('Error fetching vuelo:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este vuelo?')) {
      return
    }

    try {
      const response = await fetch(`/api/vuelos/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar vuelo')
      }

      router.push('/ventas/vuelos')
    } catch (err) {
      console.error('Error deleting vuelo:', err)
      alert('Error al eliminar vuelo: ' + err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/ventas/vuelos')}
              className="mt-4 text-red-700 hover:text-red-900 font-medium"
            >
              Volver a vuelos
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!vuelo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/ventas/vuelos')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a vuelos
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/ventas/vuelos/${params.id}/editar`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>

        <VueloDetail vuelo={vuelo} />
      </div>
    </div>
  )
}
