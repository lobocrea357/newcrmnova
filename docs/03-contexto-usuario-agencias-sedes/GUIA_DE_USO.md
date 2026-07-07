# Guía de Uso: Contexto de Agencias y Sedes

**Fecha:** 13 de Abril, 2026  
**Versión:** 1.0  
**Sistema:** ERP Nova CRM

---

## 📚 Introducción

Esta guía explica cómo usar el nuevo contexto de **agencias** y **sedes** disponible en el `UserProfileContext`. Ahora puedes acceder fácilmente a la información de agencias y sedes del usuario autenticado, de la misma forma que accedes a roles y permisos.

---

## 🎯 Datos Disponibles

### Propiedades del Contexto

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'

function MiComponente() {
  const {
    // ========================================
    // AGENCIAS
    // ========================================
    agencias,           // Array de agencias del usuario
    primaryAgencia,     // Agencia primaria (objeto completo)
    
    // ========================================
    // SEDE
    // ========================================
    sede,               // Sede del usuario (objeto completo o null)
    
    // ========================================
    // HELPERS DE AGENCIAS
    // ========================================
    hasAgencia,         // (codigo) => boolean
    isAgenciaPrimary,   // (codigo) => boolean
    getAgenciaByCode,   // (codigo) => agencia | null
    hasAnyAgencia,      // () => boolean
    getAllAgencias,     // () => agencia[]
    getAgenciaIds,      // () => string[]
    
    // ========================================
    // HELPERS DE SEDES
    // ========================================
    hasSede,            // () => boolean
    isSedeCode,         // (codigo) => boolean
    getSede,            // () => sede | null
    getSedeId,          // () => string | null
    
    // ========================================
    // DATOS EXISTENTES (roles, permisos, etc.)
    // ========================================
    role,
    isSuperAdmin,
    hasPermission,
    // ... etc
  } = useUserProfile()
  
  // Tu código aquí
}
```

### Estructura de Datos

#### Objeto Agencia

```javascript
{
  id: "uuid",
  nombre: "Nova Flash",
  codigo: "nova_flash",
  descripcion: "Agencia principal",
  color_primario: "#6366f1",
  logo_url: "https://...",
  is_active: true
}
```

#### Objeto Sede

```javascript
{
  id: "uuid",
  nombre: "Oficina del Parral",
  codigo: "parral",
  ciudad: "Valencia",
  pais: "Venezuela",
  direccion: "Av. Principal...",
  telefono: "+58 xxx xxx xxxx",
  is_active: true
}
```

---

## 💡 Ejemplos de Uso

### 1. Validar si el Usuario Tiene Agencia

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
import { Alert } from '@/components/ui/Alert'

function CotizadorForm() {
  const { hasAnyAgencia, primaryAgencia } = useUserProfile()
  
  if (!hasAnyAgencia()) {
    return (
      <Alert type="warning">
        Debes tener una agencia asignada para crear cotizaciones.
        Contacta con un administrador.
      </Alert>
    )
  }
  
  return (
    <div>
      <h2>Cotizador - {primaryAgencia.nombre}</h2>
      {/* Formulario de cotización */}
    </div>
  )
}
```

### 2. Usar Color de la Agencia (Tematización)

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'

function DashboardHeader() {
  const { primaryAgencia } = useUserProfile()
  
  const agenciaColor = primaryAgencia?.color_primario || '#6366f1'
  
  return (
    <header 
      className="p-4 border-b-4"
      style={{ borderColor: agenciaColor }}
    >
      <div className="flex items-center gap-3">
        {primaryAgencia?.logo_url && (
          <img 
            src={primaryAgencia.logo_url} 
            alt={primaryAgencia.nombre}
            className="h-10"
          />
        )}
        <h1 className="text-2xl font-bold">
          {primaryAgencia?.nombre || 'ERP Nova'}
        </h1>
      </div>
    </header>
  )
}
```

### 3. Filtrar Datos por Agencias del Usuario

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function MisCotizaciones() {
  const { getAgenciaIds } = useUserProfile()
  const [cotizaciones, setCotizaciones] = useState([])
  
  useEffect(() => {
    const fetchCotizaciones = async () => {
      const agenciaIds = getAgenciaIds()
      
      if (agenciaIds.length === 0) {
        setCotizaciones([])
        return
      }
      
      const { data } = await supabase
        .from('cotizaciones')
        .select('*')
        .in('agencia_id', agenciaIds)  // Filtrar por agencias del usuario
        .order('created_at', { ascending: false })
      
      setCotizaciones(data || [])
    }
    
    fetchCotizaciones()
  }, [getAgenciaIds])
  
  return (
    <div>
      <h2>Mis Cotizaciones</h2>
      {cotizaciones.map(cot => (
        <CotizacionCard key={cot.id} cotizacion={cot} />
      ))}
    </div>
  )
}
```

### 4. Validar Agencia Específica

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'

function NovaFlashFeature() {
  const { hasAgencia } = useUserProfile()
  
  // Solo mostrar si el usuario pertenece a Nova Flash
  if (!hasAgencia('nova_flash')) {
    return null
  }
  
  return (
    <div className="bg-indigo-50 p-4 rounded-lg">
      <h3>Función exclusiva de Nova Flash</h3>
      <p>Este contenido solo está disponible para usuarios de Nova Flash</p>
    </div>
  )
}
```

### 5. Mostrar Información de la Sede

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
import { MapPin } from 'lucide-react'

function UserInfo() {
  const { profile, sede, hasSede } = useUserProfile()
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-bold">{profile.full_name}</h3>
      <p className="text-sm text-gray-600">{profile.email}</p>
      
      {hasSede() && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>
            {sede.nombre} - {sede.ciudad}, {sede.pais}
          </span>
        </div>
      )}
      
      {!hasSede() && (
        <p className="mt-3 text-sm text-amber-600">
          Sin sede asignada
        </p>
      )}
    </div>
  )
}
```

### 6. Selector de Agencia (para usuarios con múltiples agencias)

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useState } from 'react'

function AgenciaSelector() {
  const { agencias, primaryAgencia } = useUserProfile()
  const [selectedAgencia, setSelectedAgencia] = useState(primaryAgencia?.id)
  
  if (agencias.length <= 1) {
    return null // No mostrar selector si solo tiene una agencia
  }
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Selecciona Agencia
      </label>
      <select
        value={selectedAgencia}
        onChange={(e) => setSelectedAgencia(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
      >
        {agencias.map(agencia => (
          <option key={agencia.id} value={agencia.id}>
            {agencia.nombre}
            {agencia.id === primaryAgencia?.id && ' (Principal)'}
          </option>
        ))}
      </select>
    </div>
  )
}
```

### 7. Proteger Ruta por Agencia

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function useAgenciaRequired(requiredAgencia) {
  const { hasAgencia, loading } = useUserProfile()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !hasAgencia(requiredAgencia)) {
      router.push('/no-autorizado')
    }
  }, [loading, hasAgencia, requiredAgencia, router])
  
  return { loading, hasAccess: hasAgencia(requiredAgencia) }
}

// Uso en un componente
function NovaFlashPage() {
  const { loading, hasAccess } = useAgenciaRequired('nova_flash')
  
  if (loading) {
    return <div>Cargando...</div>
  }
  
  if (!hasAccess) {
    return null
  }
  
  return (
    <div>
      <h1>Página exclusiva de Nova Flash</h1>
    </div>
  )
}
```

### 8. Reportes por Sede

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useState, useEffect } from 'react'

function ReporteSede() {
  const { sede, getSedeId, hasSede } = useUserProfile()
  const [reporte, setReporte] = useState(null)
  
  useEffect(() => {
    const fetchReporte = async () => {
      if (!hasSede()) return
      
      const sedeId = getSedeId()
      const response = await fetch(`/api/reportes/sede/${sedeId}`)
      const data = await response.json()
      
      setReporte(data)
    }
    
    fetchReporte()
  }, [hasSede, getSedeId])
  
  if (!hasSede()) {
    return <div>No tienes una sede asignada</div>
  }
  
  return (
    <div>
      <h2>Reporte de {sede.nombre}</h2>
      {reporte && (
        <div>
          <p>Ventas: {reporte.ventas}</p>
          <p>Cotizaciones: {reporte.cotizaciones}</p>
        </div>
      )}
    </div>
  )
}
```

### 9. Validación Condicional por Agencia

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'

function CotizacionActions({ cotizacion }) {
  const { isAgenciaPrimary, isSuperAdmin } = useUserProfile()
  
  // Solo usuarios de la agencia primaria o super admins pueden aprobar
  const canApprove = isSuperAdmin || isAgenciaPrimary('nova_flash')
  
  return (
    <div className="flex gap-2">
      <button className="btn-primary">Ver</button>
      <button className="btn-secondary">Editar</button>
      
      {canApprove && (
        <button className="btn-success">
          Aprobar
        </button>
      )}
    </div>
  )
}
```

### 10. Integración con Sistema de Temas Existente

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
import { getAgencyTheme } from '@/lib/cotizador/agencyThemes'

function CotizadorConTema() {
  const { primaryAgencia } = useUserProfile()
  
  // Obtener tema basado en la agencia primaria
  const theme = getAgencyTheme(primaryAgencia?.codigo || 'nova')
  
  return (
    <div className="p-6">
      <div 
        className="p-4 rounded-lg"
        style={{ 
          backgroundColor: theme.colors.light,
          borderColor: theme.colors.primary 
        }}
      >
        <h2 style={{ color: theme.colors.primary }}>
          Cotizador {primaryAgencia?.nombre}
        </h2>
        {/* Resto del formulario */}
      </div>
    </div>
  )
}
```

---

## 🔍 Casos de Uso Comunes

### Validaciones de Negocio

```javascript
// ✅ Verificar si puede crear cotizaciones
if (!hasAnyAgencia()) {
  toast.error('Necesitas una agencia asignada')
  return
}

// ✅ Verificar agencia específica
if (hasAgencia('apolo_viajes')) {
  // Lógica específica para Apolo Viajes
}

// ✅ Verificar si es la agencia primaria
if (isAgenciaPrimary('nova_flash')) {
  // Acciones solo para agencia primaria
}
```

### Filtrado de Datos

```javascript
// ✅ Filtrar por todas las agencias del usuario
const agenciaIds = getAgenciaIds()
const query = supabase
  .from('cotizaciones')
  .select('*')
  .in('agencia_id', agenciaIds)

// ✅ Filtrar por sede
if (hasSede()) {
  const sedeId = getSedeId()
  query.eq('sede_id', sedeId)
}
```

### Personalización de UI

```javascript
// ✅ Logo dinámico
<img src={primaryAgencia?.logo_url || '/default-logo.png'} />

// ✅ Color dinámico
<div style={{ borderColor: primaryAgencia?.color_primario }}>

// ✅ Nombre dinámico
<h1>{primaryAgencia?.nombre || 'ERP Nova'}</h1>
```

---

## ⚠️ Consideraciones Importantes

### 1. Validación Backend

**IMPORTANTE:** El contexto frontend es para UX, NO para seguridad.

```javascript
// ❌ MAL: Solo validar en frontend
if (hasAgencia('nova_flash')) {
  await crearCotizacion(data)
}

// ✅ BIEN: Validar también en backend
// Frontend
if (hasAgencia('nova_flash')) {
  await crearCotizacion(data)  // El backend validará de nuevo
}

// Backend (routes/cotizaciones.js)
router.post('/', async (req, res) => {
  const userId = req.user.id
  const { agencia_id } = req.body
  
  // Validar que el usuario pertenece a la agencia
  const { data: userAgencias } = await getAgenciasByUserId(userId)
  const hasAccess = userAgencias.some(ua => ua.agencia_id === agencia_id)
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'No autorizado' })
  }
  
  // Continuar con la creación
})
```

### 2. Loading State

```javascript
function MiComponente() {
  const { loading, hasAnyAgencia } = useUserProfile()
  
  if (loading) {
    return <div>Cargando...</div>
  }
  
  if (!hasAnyAgencia()) {
    return <Alert>Sin agencias asignadas</Alert>
  }
  
  return <div>Contenido</div>
}
```

### 3. Usuarios sin Agencias

```javascript
// Siempre verificar si el usuario tiene agencias
const { hasAnyAgencia, primaryAgencia } = useUserProfile()

if (!hasAnyAgencia()) {
  // Mostrar mensaje o redirigir
  return <SinAgenciasAsignadas />
}

// Usar primaryAgencia de forma segura
const agenciaColor = primaryAgencia?.color_primario || '#6366f1'
```

### 4. Actualización en Tiempo Real

Si un administrador cambia las agencias/sedes del usuario, el contexto se actualizará automáticamente al refrescar la página. Para actualizaciones en tiempo real sin refresh, puedes:

```javascript
// Forzar recarga del perfil
window.dispatchEvent(new Event('avatar-updated'))
```

---

## 🚀 Migración de Código Existente

### Antes (sin contexto)

```javascript
function CotizadorForm() {
  const [agencias, setAgencias] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchAgencias = async () => {
      const response = await fetch(`/api/agencias/user/${userId}`)
      const data = await response.json()
      setAgencias(data.data || [])
      setLoading(false)
    }
    fetchAgencias()
  }, [userId])
  
  if (loading) return <div>Cargando...</div>
  
  const primaryAgencia = agencias.find(a => a.is_primary)
  
  return <div>{primaryAgencia?.nombre}</div>
}
```

### Después (con contexto)

```javascript
function CotizadorForm() {
  const { primaryAgencia, loading } = useUserProfile()
  
  if (loading) return <div>Cargando...</div>
  
  return <div>{primaryAgencia?.nombre}</div>
}
```

**Beneficios:**
- ✅ Menos código
- ✅ Más rápido (ya está cargado)
- ✅ Consistente en toda la app
- ✅ Fácil de mantener

---

## 📊 Debugging

### Ver Datos en Consola

Al cargar el perfil, verás un log como este:

```javascript
🔐 [UserProfileContext] Perfil cargado: {
  email: "usuario@example.com",
  fullName: "Juan Pérez",
  role: "asesor",
  roleId: "uuid...",
  rolePermissionsCount: 5,
  rolePermissions: [...],
  userPermissionsCount: 0,
  userPermissions: [],
  revokedPermissions: [],
  agenciasCount: 2,
  agencias: ["Nova Flash", "Apolo Viajes"],
  primaryAgencia: "Nova Flash",
  sede: "Oficina del Parral"
}
```

### Verificar en DevTools

```javascript
// En la consola del navegador
window.__userProfile = useUserProfile()
console.log(window.__userProfile.agencias)
console.log(window.__userProfile.primaryAgencia)
console.log(window.__userProfile.sede)
```

---

## 🎓 Resumen

### Datos Disponibles
- ✅ `agencias` - Array de agencias del usuario
- ✅ `primaryAgencia` - Agencia principal
- ✅ `sede` - Sede del usuario

### Helpers de Agencias
- ✅ `hasAgencia(codigo)` - Verificar pertenencia
- ✅ `isAgenciaPrimary(codigo)` - Verificar si es primaria
- ✅ `getAgenciaByCode(codigo)` - Obtener agencia
- ✅ `hasAnyAgencia()` - Verificar si tiene alguna
- ✅ `getAllAgencias()` - Obtener todas
- ✅ `getAgenciaIds()` - Obtener IDs para filtros

### Helpers de Sedes
- ✅ `hasSede()` - Verificar si tiene sede
- ✅ `isSedeCode(codigo)` - Verificar código de sede
- ✅ `getSede()` - Obtener sede
- ✅ `getSedeId()` - Obtener ID para filtros

### Patrón de Uso
1. Importar `useUserProfile`
2. Extraer datos/helpers necesarios
3. Validar loading state
4. Usar datos de forma segura (con `?.` o validaciones)

---

**¿Necesitas ayuda?** Consulta la auditoría completa en `AUDITORIA_CONTEXTO_AGENCIAS_SEDES.md`
