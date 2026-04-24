'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, ArrowRight } from 'lucide-react'
import VueloFormNuevo from '@/components/vuelos/VueloFormNuevo'
import TutorialVuelos from '@/components/vuelos/TutorialVuelos'
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'
import { VUELOS_API } from '@/config/apiConfig'
import { supabase } from '@/lib/supabase'
import { toastInfo } from '@/helpers/toasts'

export default function NuevoVueloPage() {
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingCotizacion, setLoadingCotizacion] = useState(false)
  const [initialFormData, setInitialFormData] = useState(null)
  const [cotizacion, setCotizacion] = useState(null)

  // Cargar cotización si viene del parámetro
  useEffect(() => {
    const cotizacionId = searchParams.get('cotizacion_id')
    if (cotizacionId) {
      loadCotizacion(cotizacionId)
    }
  }, [searchParams])

  const loadCotizacion = async (cotizacionId) => {
    try {
      setLoadingCotizacion(true)

      const { data, error } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          pasajeros:cotizaciones_pasajeros(*)
        `)
        .eq('id', cotizacionId)
        .single()

      if (error) throw error

      if (data.estado !== 'APROBADA') {
        toastInfo('Esta cotización no está aprobada')
      }

      setCotizacion(data)

      // Mapear cotización a formato de VueloFormNuevo
      const mappedData = {
        pax_nombre: data.nombre_cliente,
        contacto_nombre: data.nombre_cliente,
        ruta: `${data.origen} - ${data.destino}`,
        fecha_vuelo: data.fecha_salida ? new Date(data.fecha_salida).toISOString().split('T')[0] : '',
        fecha_regreso: data.fecha_regreso ? new Date(data.fecha_regreso).toISOString().split('T')[0] : '',
        horario: data.hora_salida || '',
        hora_llegada: data.hora_llegada || '',
        aerolinea_nombre: data.aerolinea || '',
        aerolinea_codigo: data.aereolinea_codigo || '',
        monto_venta: data.precio_final_cotizacion || '',
        metodo_pago: data.metodo_pago || '',
        tipo_vuelo: data.tipo_vuelo || 'ida_vuelta',
        // Escalas
        tiene_escala: data.tiene_escala || false,
        escala_1_ciudad: data.escala_1_ciudad || '',
        escala_1_duracion: data.escala_1_duracion || '',
        tiene_segunda_escala: data.tiene_segunda_escala || false,
        escala_2_ciudad: data.escala_2_ciudad || '',
        escala_2_duracion: data.escala_2_duracion || '',
        // Info Financiera
        moneda_precio: data.moneda_precio || '',
        moneda_cotizacion: data.moneda_cotizacion || '',
        tasa_cambio: data.tasa_cambio || '',
        total_cotizacion: data.total_cotizacion || '',
        observaciones: `Creado desde cotización #${data.id}`,
        contacto_telefono: '',
        localizador: '',
        proveedor: '',
        pnr_desglose: ''
      }

      setInitialFormData(mappedData)
      toastInfo('Datos pre-llenados desde cotización aprobada')

    } catch (error) {
      console.error('Error cargando cotización:', error)
      setError('Error al cargar la cotización: ' + error.message)
    } finally {
      setLoadingCotizacion(false)
    }
  }

  const handleSubmit = async (submitData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Preparar datos del vuelo
      const vueloData = {
        ...submitData.vuelo,
        created_by: user.id,
        num_adultos: submitData.pasajeros.filter(p => p.tipo === 'ADULTO').length,
        num_ninos: submitData.pasajeros.filter(p => p.tipo === 'NINO').length,
        num_infantes: submitData.pasajeros.filter(p => p.tipo === 'INFANTE').length
      }

      // Crear vuelo via Express backend
      const response = await fetch(VUELOS_API.crear, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vuelo: vueloData,
          pasajeros: submitData.pasajeros
        }),
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

      // Subir archivos si hay
      if ((submitData.comprobantes?.length > 0 || submitData.pasaportes?.length > 0) && vuelo.id && responseData.pasajeros) {
        console.log(`📎 Subiendo archivos...`)

        const uploadPromises = []

        // Subir comprobantes
        if (submitData.comprobantes) {
          for (const file of submitData.comprobantes) {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            formDataUpload.append('tipo_adjunto', 'COMPROBANTE_PAGO')
            formDataUpload.append('uploaded_by', user.id)

            uploadPromises.push(
              fetch(VUELOS_API.subirAdjunto(vuelo.id), {
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

        // Subir pasaportes asociados a cada pasajero
        if (submitData.pasaportes && responseData.pasajeros) {
          for (let i = 0; i < submitData.pasaportes.length; i++) {
            const file = submitData.pasaportes[i]
            const pasajeroCreado = responseData.pasajeros[i]

            if (file && pasajeroCreado) {
              const formDataUpload = new FormData()
              formDataUpload.append('file', file)
              formDataUpload.append('tipo_adjunto', 'PASAPORTE')
              formDataUpload.append('uploaded_by', user.id)
              formDataUpload.append('pasajero_id', pasajeroCreado.id)

              uploadPromises.push(
                fetch(VUELOS_API.subirAdjunto(vuelo.id), {
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
        }

        try {
          await Promise.all(uploadPromises)
          console.log('✅ Todos los archivos subidos correctamente')
        } catch (uploadError) {
          console.error('⚠️ Error al subir algunos archivos:', uploadError)
        }
      }

      console.log('🔄 Redirigiendo a:', `/ventas/vuelos/${vuelo.id}`)
      router.push(`/ventas/vuelos/${vuelo.id}?created=true`)
    } catch (err) {
      console.error('Error creating vuelo:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Ventas', href: '/ventas' },
    { label: 'Vuelos', href: '/ventas/vuelos' },
    { label: 'Nuevo', href: '/ventas/vuelos/nuevo' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <NavigationBreadcrumb items={breadcrumbItems} />
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

        {/* Tutorial */}
        <div className="mb-6">
          <TutorialVuelos />
        </div>

        {cotizacion && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-900 font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4" />
                  Creando desde cotización aprobada
                </p>
                <p className="text-indigo-700 text-sm mt-1">
                  Cliente: {cotizacion.nombre_cliente} · Ruta: {cotizacion.origen} → {cotizacion.destino}
                </p>
                <p className="text-indigo-700 text-xs mt-2 font-medium">
                  Completa los campos faltantes: localizador, teléfono, pasajeros, proveedor y adjuntos
                </p>
              </div>
              <Link href={`/ventas/cotizaciones?id=${cotizacion.id}`}>
                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors">
                  Ver cotización
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error al crear vuelo</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {loadingCotizacion ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando cotización...</p>
            </div>
          </div>
        ) : (
            <VueloFormNuevo
            initialData={initialFormData}
              cotizacion={cotizacion}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
