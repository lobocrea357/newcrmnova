'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Camera, Save, Loader2, Mail, Shield, Calendar, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { toastSuccess, toastError, toastInfo } from '@/helpers/toasts'
import { Page, PageHeader, Panel, Badge, Button, Skeleton } from '@/components/ui/kit'
import { initials } from '@/lib/avatar'

// Event para notificar cambios de avatar
const AVATAR_UPDATED_EVENT = 'avatar-updated'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function PerfilPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, role, loading: profileLoading } = useUserProfile()
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [currentAvatar, setCurrentAvatar] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || ''
      })

      if (profile.avatar_url) {
        loadAvatar(profile.avatar_url)
      }
    }
  }, [profile])

  const loadAvatar = async (avatarPath) => {
    try {
      const { data } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(avatarPath)

      if (data?.publicUrl) {
        setCurrentAvatar(data.publicUrl)
      }
    } catch (error) {
      console.error('Error loading avatar:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toastError('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toastError('La imagen no debe superar 10MB')
      return
    }

    setAvatarFile(file)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null

    setUploadingAvatar(true)
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Eliminar avatar anterior si existe
      if (profile?.avatar_url) {
        await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([profile.avatar_url])
      }

      // Subir nuevo avatar
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, avatarFile, {
          contentType: avatarFile.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error en storage.upload:', uploadError)
        throw uploadError
      }

      return filePath
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toastError('Error al subir la imagen')
      return null
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return

    try {
      setUploadingAvatar(true)

      // Eliminar de storage
      const { error: storageError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([profile.avatar_url])

      if (storageError) throw storageError

      // Actualizar avatar_url en la BD
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Limpiar estados locales
      setCurrentAvatar(null)
      setAvatarPreview(null)
      setAvatarFile(null)

      // Emitir evento para actualizar avatar en navbar/sidebar (null = sin avatar)
      window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT, { detail: { avatarUrl: null } }))

      toastSuccess('Foto de perfil eliminada correctamente')
    } catch (error) {
      console.error('Error eliminando avatar:', error)
      toastError('Error al eliminar la foto de perfil')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.full_name.trim()) {
      toastError('El nombre completo es requerido')
      return
    }

    setSaving(true)
    try {
      let avatarUrl = profile?.avatar_url

      // Subir avatar si hay uno nuevo
      if (avatarFile) {
        const uploadedPath = await uploadAvatar()
        if (uploadedPath) {
          avatarUrl = uploadedPath
        }
      }

      // Actualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          avatar_url: avatarUrl
        })
        .eq('id', user.id)

      if (error) throw error

      toastSuccess('Perfil actualizado exitosamente')

      // Recargar avatar
      if (avatarUrl) {
        loadAvatar(avatarUrl)
      }

      // Limpiar preview
      setAvatarFile(null)
      setAvatarPreview(null)

      // Recargar la página para refrescar el perfil
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error updating profile:', error)
      toastError('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <Page className="max-w-3xl">
        <Skeleton className="mb-6 h-9 w-48" />
        <Skeleton className="h-96" />
      </Page>
    )
  }

  const avatar = avatarPreview || currentAvatar
  const field = 'h-10 w-full rounded-lg border border-linea bg-white px-3 text-sm text-tinta focus:border-nova-500 focus:outline-none focus:ring-2 focus:ring-nova-500/20'
  const readonly = 'h-10 w-full rounded-lg border border-linea bg-gray-50 px-3 text-sm text-gray-500'

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Mi perfil" description="Tu nombre y tu foto se muestran al equipo en chats y reportes." />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Panel title="Foto">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-linea bg-nova-50">
              {avatar ? (
                <img src={avatar} alt="Tu foto de perfil" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-2xl font-semibold text-nova-700">
                  {initials(profile?.full_name) || <User className="h-10 w-10" />}
                </span>
              )}
              {uploadingAvatar && (
                <span className="absolute inset-0 grid place-items-center bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-linea bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-nova-500/30">
                  <Camera className="h-4 w-4" />
                  {avatar ? 'Cambiar foto' : 'Subir foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                {avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className="text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar foto
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {avatarFile ? `Seleccionada: ${avatarFile.name}. Se guarda al pulsar Guardar cambios.` : 'JPG, PNG o WebP, hasta 10 MB.'}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Datos">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={field}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Correo</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input id="email" type="email" value={formData.email} className={`${readonly} pl-9`} disabled />
              </div>
              <p className="mt-1 text-xs text-gray-500">Solo un administrador puede cambiarlo.</p>
            </div>
            <div>
              <p className="mb-1.5 block text-sm font-medium text-gray-700">Rol</p>
              <div className="flex h-10 items-center gap-2">
                <Badge tone="nova">
                  <Shield className="h-3.5 w-3.5" />
                  {role || 'Sin rol'}
                </Badge>
                {profile?.created_at && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Desde {new Date(profile.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving || uploadingAvatar}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Page>
  )
}
