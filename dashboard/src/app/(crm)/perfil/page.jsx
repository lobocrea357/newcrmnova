'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Camera, Save, Loader2, Mail, Shield, Calendar, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { toastSuccess, toastError, toastInfo } from '@/helpers/toasts'
import Breadcrumb from '@/components/ui/Breadcrumb'

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-4xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Mi Perfil', href: '/perfil' }
          ]}
        />

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {avatarPreview || currentAvatar ? (
                    <img
                      src={avatarPreview || currentAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile?.full_name || 'Usuario'}</h1>
                <p className="text-blue-100 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {role || 'Usuario'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Avatar Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-gray-200">
                    {avatarPreview || currentAvatar ? (
                      <img
                        src={avatarPreview || currentAvatar}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Formatos permitidos: JPG, PNG, WebP
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Tamaño máximo: 10MB
                  </p>
                  {avatarFile && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      ✓ {avatarFile.name} seleccionado
                    </p>
                  )}
                  {(currentAvatar || avatarPreview) && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={uploadingAvatar}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar foto de perfil
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El correo no puede ser modificado
              </p>
            </div>

            {/* Fecha de creación */}
            {profile?.created_at && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Miembro desde
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={new Date(profile.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || uploadingAvatar}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
