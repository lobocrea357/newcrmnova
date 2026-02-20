'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import VueloForm from '@/components/vuelos/VueloForm'
import { supabase } from '@/lib/supabase'

export default function NuevoVueloPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const vueloData = {
        pax_nombre: formData.pax_nombre,
        num_adultos: formData.num_adultos,
        num_ninos: formData.num_ninos,
        num_infantes: formData.num_infantes,
        contacto_nombre: formData.contacto_nombre,
        contacto_telefono: formData.contacto_telefono,
        fecha_vuelo: formData.fecha_vuelo,
        ruta: formData.ruta,
        horario: formData.horario || null,
        aerolinea_codigo: formData.aerolinea_codigo || null,
        aerolinea_nombre: formData.aerolinea_nombre || null,
        localizador: formData.localizador,
        proveedor: formData.proveedor,
        monto_venta: formData.monto_venta,
        monto_sabre: formData.monto_sabre || null,
        monto_expedia: formData.monto_expedia || null,
        monto_emision: formData.monto_emision || null,
        metodo_pago: formData.metodo_pago || null,
        tipo_vuelo: formData.tipo_vuelo,
        requiere_anulable: formData.requiere_anulable,
        observaciones: formData.observaciones || null,
        created_by: user.id
      }

      const response = await fetch('/api/vuelos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vueloData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Error al crear vuelo')
      }

      const responseData = await response.json()
      console.log('✅ Response data completa:', JSON.stringify(responseData, null, 2))
      
      const vuelo = responseData.vuelo
      
      if (!vuelo) {
        console.error('❌ No se encontró el objeto vuelo en la respuesta:', responseData)
        throw new Error('La respuesta del servidor no contiene el vuelo creado')
      }
      
      if (!vuelo.id) {
        console.error('❌ El vuelo no tiene ID:', vuelo)
        throw new Error('El vuelo se creó pero no tiene ID válido')
      }
      
      console.log('✅ Vuelo creado exitosamente con ID:', vuelo.id)

      // Subir archivos solo si el vuelo tiene un ID válido
      if ((formData.comprobantes?.length > 0 || formData.pasaportes?.length > 0) && vuelo.id) {
        console.log(`📎 Subiendo ${formData.comprobantes?.length || 0} comprobantes y ${formData.pasaportes?.length || 0} pasaportes...`)
        
        const uploadPromises = []

        if (formData.comprobantes) {
          for (const file of formData.comprobantes) {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            formDataUpload.append('tipo_adjunto', 'COMPROBANTE_PAGO')
            formDataUpload.append('uploaded_by', user.id)

            uploadPromises.push(
              fetch(`/api/vuelos/${vuelo.id}/adjuntos`, {
                method: 'POST',
                body: formDataUpload,
              }).then(res => {
                if (!res.ok) {
                  console.error('❌ Error al subir comprobante:', file.name)
                  return res.json().then(err => console.error('Detalles:', err))
                }
                console.log('✅ Comprobante subido:', file.name)
                return res.json()
              })
            )
          }
        }

        if (formData.pasaportes) {
          for (const file of formData.pasaportes) {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            formDataUpload.append('tipo_adjunto', 'PASAPORTE')
            formDataUpload.append('uploaded_by', user.id)

            uploadPromises.push(
              fetch(`/api/vuelos/${vuelo.id}/adjuntos`, {
                method: 'POST',
                body: formDataUpload,
              }).then(res => {
                if (!res.ok) {
                  console.error('❌ Error al subir pasaporte:', file.name)
                  return res.json().then(err => console.error('Detalles:', err))
                }
                console.log('✅ Pasaporte subido:', file.name)
                return res.json()
              })
            )
          }
        }

        try {
          await Promise.all(uploadPromises)
          console.log('✅ Todos los archivos subidos correctamente')
        } catch (uploadError) {
          console.error('⚠️ Error al subir algunos archivos:', uploadError)
          // No lanzamos error, permitimos continuar
        }
      }

      console.log('🔄 Redirigiendo a:', `/vuelos/${vuelo.id}`)
      router.push(`/vuelos/${vuelo.id}`)
    } catch (err) {
      console.error('Error creating vuelo:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Vuelo</h1>
          <p className="text-gray-600 mt-2">
            Registra la información completa del vuelo pagado
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error al crear vuelo</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        <VueloForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}
