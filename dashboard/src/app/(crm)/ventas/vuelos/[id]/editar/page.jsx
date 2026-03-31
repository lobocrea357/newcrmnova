'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import VueloFormEditar from '@/components/vuelos/VueloFormEditar'

export default function EditarVueloPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission, hasAnyPermission, profile } = useUserProfile()

  const [vuelo, setVuelo] = useState(null)
  const [pasajeros, setPasajeros] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Verificar permisos de edición
  const tieneEditAll = hasPermission('vuelos.edit_all')
  const tieneEditTeam = hasPermission('vuelos.edit_team')
  const tieneEditOwn = hasPermission('vuelos.edit_own')

  useEffect(() => {
    if (id) {
      cargarVuelo()
    }
  }, [id])

  const cargarVuelo = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(VUELOS_API.obtener(id))
      if (!response.ok) {
        throw new Error('Error al cargar el vuelo')
      }

      const { data } = await response.json()

      if (!data) {
        throw new Error('Vuelo no encontrado')
      }

      // Validar que se puede editar
      if (data.estado === 'EMITIDO') {
        setError('Este vuelo ya ha sido emitido y no se puede editar.')
        return
      }

      // Validar permisos con sistema granular
      const esCreador = data.created_by === user?.id
      const mismoEquipo = profile?.equipo_id && data.creator?.equipo_id === profile.equipo_id

      let puedeEditar = false

      if (tieneEditAll) {
        // Admin/Super Admin pueden editar todo
        puedeEditar = true
      } else if (tieneEditTeam && mismoEquipo) {
        // Gerente puede editar vuelos de su equipo
        puedeEditar = true
      } else if (tieneEditOwn && esCreador) {
        // Asesor puede editar sus propios vuelos (con límite)
        const edicionesDisponibles = data.ediciones_disponibles ?? 3
        if (edicionesDisponibles > 0) {
          puedeEditar = true
        } else {
          setError('Has agotado tus intentos de edición para este vuelo.')
          return
        }
      }

      if (!puedeEditar) {
        setError('No tienes permisos para editar este vuelo.')
        return
      }

      setVuelo(data)
      setPasajeros(data.pasajeros || [])

    } catch (err) {
      console.error('Error cargando vuelo:', err)
      setError(err.message || 'Error al cargar el vuelo')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true)

      const response = await fetch(VUELOS_API.editar(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vuelo: formData.vuelo,
          pasajeros: formData.pasajeros,
          razon_edicion: formData.razon_edicion,
          user_id: user?.id,
          user_role: user?.role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al editar el vuelo')
      }

      // Si hay nuevos pasaportes, subirlos
      if (formData.pasaportesNuevos && formData.pasaportesNuevos.length > 0) {
        for (const { pasajero_id, file } of formData.pasaportesNuevos) {
          if (file && pasajero_id) {
            const formDataFile = new FormData()
            formDataFile.append('file', file)
            formDataFile.append('tipo_adjunto', 'PASAPORTE')
            formDataFile.append('uploaded_by', user?.id)
            formDataFile.append('pasajero_id', pasajero_id)

            await fetch(VUELOS_API.subirAdjunto(id), {
              method: 'POST',
              body: formDataFile
            })
          }
        }
      }

      // Si hay nuevos comprobantes, subirlos
      if (formData.comprobantesNuevos && formData.comprobantesNuevos.length > 0) {
        for (const file of formData.comprobantesNuevos) {
          const formDataFile = new FormData()
          formDataFile.append('file', file)
          formDataFile.append('tipo_adjunto', 'COMPROBANTE_PAGO')
          formDataFile.append('uploaded_by', user?.id)

          await fetch(VUELOS_API.subirAdjunto(id), {
            method: 'POST',
            body: formDataFile
          })
        }
      }

      toastSuccess('Vuelo editado exitosamente')

      // Redirigir al detalle del vuelo
      router.push(`/ventas/vuelos/${id}`)

    } catch (err) {
      console.error('Error editando vuelo:', err)
      toastError(err.message || 'Error al editar el vuelo')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-600">Cargando vuelo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-700 mb-2">No se puede editar</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Editar Vuelo
          </h1>
          <p className="text-gray-600 mt-1">
            {vuelo?.pax_nombre} - {vuelo?.ruta}
          </p>
        </div>

        {/* Formulario de edición */}
        <VueloFormEditar
          vuelo={vuelo}
          pasajeros={pasajeros}
          onSubmit={handleSubmit}
          isLoading={submitting}
          edicionesDisponibles={vuelo?.ediciones_disponibles ?? 3}
          esGerente={esGerente}
        />
      </div>
    </div>
  )
}
