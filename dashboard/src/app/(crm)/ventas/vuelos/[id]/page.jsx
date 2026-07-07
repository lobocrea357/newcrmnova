'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react'
import VueloDetail from '@/components/vuelos/VueloDetail'
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'
import { VUELOS_API } from '@/config/apiConfig'

export default function VueloDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params?.id
  const [vuelo, setVuelo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  useEffect(() => {
    if (id) fetchVuelo()

    // Mostrar banner de éxito si viene de crear vuelo
    const created = searchParams.get('created')
    if (created === 'true') {
      setShowSuccessBanner(true)
      // Ocultar el banner después de 10 segundos
      setTimeout(() => setShowSuccessBanner(false), 10000)
    }
  }, [id, searchParams])

  const fetchVuelo = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(VUELOS_API.obtener(id))

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Vuelo no encontrado')
        }
        throw new Error('Error al cargar vuelo')
      }

      const result = await response.json()
      setVuelo(result.data || result.vuelo)
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
      const response = await fetch(VUELOS_API.eliminar(id), {
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
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-yellow-800 font-semibold mb-2">Vuelo no encontrado</h2>
            <p className="text-yellow-600">El vuelo solicitado no existe o no tienes permisos para verlo.</p>
            <button
              onClick={() => router.push('/ventas/vuelos')}
              className="mt-4 text-yellow-700 hover:text-yellow-900 font-medium"
            >
              Volver a vuelos
            </button>
          </div>
        </div>
      </div>
    )
  }

  const breadcrumbItems = vuelo ? [
    { label: 'Inicio', href: '/' },
    { label: 'Ventas', href: '/ventas' },
    { label: 'Vuelos', href: '/ventas/vuelos' },
    { label: vuelo.pax_nombre, href: `/ventas/vuelos/${id}` }
  ] : []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {vuelo && <NavigationBreadcrumb items={breadcrumbItems} />}

        {/* Banner de éxito */}
        {showSuccessBanner && vuelo && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-900 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Vuelo creado exitosamente
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Localizador: {vuelo.localizador} · Estado: {vuelo.estado}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/ventas/vuelos/nuevo')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Crear otro vuelo
                </button>
                <button
                  onClick={() => router.push('/ventas/vuelos')}
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                >
                  Ver todos
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/ventas/vuelos')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a vuelos
          </button>

         {/*  <div className="flex gap-3">
            <button
              onClick={() => router.push(`/ventas/vuelos/${id}/editar`)}
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
          </div> */}
        </div>

        <VueloDetail vuelo={vuelo} />
      </div>
    </div>
  )
}
