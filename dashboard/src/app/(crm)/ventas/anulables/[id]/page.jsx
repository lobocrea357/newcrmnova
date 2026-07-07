'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import AnulableDetail from '@/components/anulables/AnulableDetail'
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { ANULABLES_API } from '@/config/apiConfig'

export default function AnulableDetailPage({ params }) {
  const router = useRouter()
  const [anulable, setAnulable] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnulable()
  }, [params.id])

  const fetchAnulable = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(ANULABLES_API.obtener(params.id))

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Anulable no encontrado')
        }
        throw new Error('Error al cargar anulable')
      }

      const { anulable: anulableData } = await response.json()
      setAnulable(anulableData)
    } catch (err) {
      console.error('Error fetching anulable:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este anulable?')) {
      return
    }

    try {
      const response = await fetch(ANULABLES_API.eliminar(params.id), {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar anulable')
      }

      router.push('/ventas/anulables')
    } catch (err) {
      console.error('Error deleting anulable:', err)
      alert('Error al eliminar anulable: ' + err.message)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-red-800 font-semibold mb-2">Error</h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => router.push('/ventas/anulables')}
                className="mt-4 text-red-700 hover:text-red-900 font-medium"
              >
                Volver a anulables
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!anulable) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/ventas/anulables')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a anulables
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>

          <AnulableDetail anulable={anulable} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
