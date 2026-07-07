# Auditoría: Contexto de Agencias y Sedes en Sesión de Usuario

**Fecha:** 13 de Abril, 2026  
**Auditor:** Senior Full-Stack Developer (con skills: frontend-design, interface-design, code-review-excellence)  
**Sistema:** ERP Nova CRM

---

## 📋 Resumen Ejecutivo

Se realizó una auditoría completa del ERP para determinar cómo implementar el contexto de **agencias** y **sedes** en la sesión del usuario, de manera que esta información sea tan accesible como los roles y permisos actuales.

### Hallazgos Clave

✅ **Infraestructura existente sólida:**
- Sistema de autenticación robusto con `AuthContext` y `UserProfileContext`
- Endpoints backend funcionales para agencias y sedes
- Relaciones de base de datos bien definidas
- Patrón de acceso a roles/permisos ya establecido

⚠️ **Gap identificado:**
- El contexto del usuario NO incluye información de agencias/sedes
- Se requieren múltiples llamadas API para obtener esta información
- No hay helpers de fácil acceso como `isSuperAdmin`, `hasPermission`, etc.

---

## 🔍 Análisis de Base de Datos

### Relaciones Usuario-Agencia-Sede

```sql
-- AGENCIAS: Relación Many-to-Many con is_primary
CREATE TABLE public.usuario_agencias (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,           -- FK a profiles
  agencia_id uuid NOT NULL,        -- FK a agencias
  is_primary boolean DEFAULT false, -- ⭐ Agencia principal del usuario
  created_at timestamp,
  created_by uuid
);

-- SEDES: Relación One-to-One directa en profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email varchar NOT NULL,
  full_name varchar,
  role_id uuid,                    -- FK a roles
  sede_id uuid,                    -- ⭐ FK a sedes (solo UNA sede por usuario)
  equipo_id uuid,
  avatar_url text,
  is_active boolean DEFAULT true
);

-- AGENCIAS: Tabla maestra
CREATE TABLE public.agencias (
  id uuid PRIMARY KEY,
  nombre varchar NOT NULL UNIQUE,
  codigo varchar NOT NULL UNIQUE,
  descripcion text,
  logo_url text,
  color_primario varchar DEFAULT '#6366f1',
  is_active boolean DEFAULT true
);

-- SEDES: Tabla maestra
CREATE TABLE public.sedes (
  id uuid PRIMARY KEY,
  nombre varchar NOT NULL UNIQUE,
  codigo varchar NOT NULL UNIQUE,
  direccion text,
  ciudad varchar,
  pais varchar DEFAULT 'Venezuela',
  telefono varchar,
  is_active boolean DEFAULT true
);
```

### Modelo de Datos Identificado

**Usuario → Agencias:**
- ✅ Un usuario puede pertenecer a **múltiples agencias**
- ✅ Una agencia puede estar marcada como **primaria** (`is_primary`)
- ✅ Tabla intermedia: `usuario_agencias`

**Usuario → Sede:**
- ✅ Un usuario pertenece a **UNA sola sede**
- ✅ Relación directa en `profiles.sede_id`
- ✅ Más simple que agencias

---

## 🏗️ Arquitectura Actual

### Frontend: Sistema de Contextos

```javascript
// 1. AuthContext - Autenticación básica
AuthContext {
  user,              // Usuario de Supabase Auth
  session,           // Sesión activa
  loading,
  isAuthenticated,
  signIn(),
  signOut()
}

// 2. UserProfileContext - Perfil y permisos ⭐
UserProfileContext {
  profile,           // Datos del perfil
  role,              // Nombre del rol (string)
  roleObject,        // Objeto completo del rol
  rolePermissions,   // Permisos del rol
  userPermissions,   // Permisos específicos del usuario
  allPermissions,    // Combinación final
  
  // Helpers de permisos
  hasPermission(name),
  hasAnyPermission(array),
  hasAllPermissions(array),
  
  // Helpers de roles
  isRole(name),
  isSuperAdmin,
  isAdmin,
  isManager,
  isAsesor,
  isEmisor,
  
  // Helpers jerárquicos
  getRoleRanking(),
  canManageRole(targetRanking)
}

// 3. useRouteGuard - Protección de rutas
useRouteGuard({
  requireAuth: true,
  allowedRoles: ['admin', 'super_admin']
})
```

### Backend: Servicios Existentes

**✅ Servicios de Agencias (`agenciasService.js`):**
```javascript
- getAgencias()
- getAgenciaById(id)
- createAgencia(data)
- updateAgencia(id, data)
- deleteAgencia(id)
- getUsersByAgencia(agenciaId)
- getAgenciasByUserId(userId)      // ⭐ Clave para obtener agencias del usuario
- assignUserToAgencia(userId, agenciaId, isPrimary)
- removeUserFromAgencia(userId, agenciaId)
- setPrimaryAgencia(userId, agenciaId)
```

**✅ Servicios de Sedes (`sedesService.js`):**
```javascript
- getSedes()
- getSedeById(id)
- createSede(data)
- updateSede(id, data)
- deleteSede(id)
- getUsersBySede(sedeId)
- assignUserToSede(userId, sedeId)  // Reemplaza la sede anterior
- removeUserFromSede(userId)
```

**✅ Endpoints REST:**
```
GET    /api/agencias/user/:userId     → Obtener agencias del usuario
GET    /api/agencias/:id/users        → Usuarios de una agencia
POST   /api/agencias/:id/users        → Asignar usuario a agencia
DELETE /api/agencias/:id/users/:userId → Remover usuario de agencia
PATCH  /api/agencias/:id/users/:userId/primary → Marcar como primaria

GET    /api/sedes/:id/users           → Usuarios de una sede
POST   /api/sedes/:id/users           → Asignar usuario a sede
DELETE /api/sedes/:id/users/:userId   → Remover usuario de sede
```

---

## 🎯 Solución Propuesta

### Estrategia: Extender UserProfileContext

Similar a cómo se cargan roles y permisos, extenderemos el contexto para incluir agencias y sedes del usuario.

### Ventajas de esta Aproximación

1. ✅ **Consistencia:** Mismo patrón que roles/permisos
2. ✅ **Performance:** Una sola carga al iniciar sesión
3. ✅ **Accesibilidad:** Disponible en toda la app vía hook
4. ✅ **Tipado:** Fácil de tipar con TypeScript
5. ✅ **Caché:** No requiere llamadas repetidas
6. ✅ **Reactivo:** Se actualiza automáticamente

### Implementación Propuesta

#### 1. Extender UserProfileContext

```javascript
// dashboard/src/contexts/UserProfileContext.js

export const UserProfileProvider = ({ children }) => {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    profile: null,
    role: null,
    roleObject: null,
    rolePermissions: [],
    userPermissions: [],
    revokedPermissions: [],
    
    // ⭐ NUEVO: Agencias y Sedes
    agencias: [],              // Array de agencias del usuario
    primaryAgencia: null,      // Agencia primaria
    sede: null,                // Sede del usuario (solo una)
    
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return
      
      try {
        // 1. Obtener perfil con rol Y SEDE
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            avatar_url,
            is_active,
            equipo_id,
            role:roles(id, name, description, ranking),
            sede:sedes(id, nombre, codigo, ciudad, pais)  // ⭐ NUEVO
          `)
          .eq('id', user.id)
          .single()

        // 2. Obtener permisos del rol (código existente)
        // ...

        // 3. Obtener permisos del usuario (código existente)
        // ...

        // 4. ⭐ NUEVO: Obtener agencias del usuario
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const agenciasResponse = await fetch(`${apiUrl}/api/agencias/user/${user.id}`)
        const agenciasData = await agenciasResponse.json()
        
        const agencias = agenciasData.success ? agenciasData.data : []
        const primaryAgencia = agencias.find(ua => ua.is_primary)?.agencia || null

        setProfileData({
          profile: profileData,
          role: profileData.role?.name || null,
          roleObject: profileData.role,
          rolePermissions,
          userPermissions,
          revokedPermissions,
          
          // ⭐ NUEVO
          agencias: agencias.map(ua => ua.agencia).filter(Boolean),
          primaryAgencia,
          sede: profileData.sede || null,
          
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error en fetchUserProfile:', error)
        // ...
      }
    }

    fetchUserProfile()
  }, [user, refreshTrigger])

  // Helpers computados
  const helpers = useMemo(() => {
    const { agencias = [], primaryAgencia, sede } = profileData

    // ⭐ NUEVO: Helpers de agencias
    const hasAgencia = (agenciaCodigo) => {
      return agencias.some(a => a.codigo === agenciaCodigo)
    }

    const isAgenciaPrimary = (agenciaCodigo) => {
      return primaryAgencia?.codigo === agenciaCodigo
    }

    const getAgenciaByCode = (codigo) => {
      return agencias.find(a => a.codigo === codigo) || null
    }

    // ⭐ NUEVO: Helpers de sedes
    const hasSede = () => !!sede

    const isSedeCode = (sedeCodigo) => {
      return sede?.codigo === sedeCodigo
    }

    // Helpers existentes de roles/permisos
    // ...

    return {
      // Helpers existentes
      allPermissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isRole,
      isSuperAdmin,
      isAdmin,
      isManager,
      
      // ⭐ NUEVO: Helpers de agencias/sedes
      hasAgencia,
      isAgenciaPrimary,
      getAgenciaByCode,
      hasSede,
      isSedeCode
    }
  }, [profileData])

  const value = {
    ...profileData,
    ...helpers
  }

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  )
}
```

#### 2. Uso en Componentes

```javascript
// Ejemplo: Validar agencia en cotizador
import { useUserProfile } from '@/contexts/UserProfileContext'

function CotizadorForm() {
  const { 
    primaryAgencia,      // Agencia principal
    agencias,            // Todas las agencias
    sede,                // Sede del usuario
    hasAgencia,          // Helper
    isAgenciaPrimary     // Helper
  } = useUserProfile()

  // Validación simple
  if (!primaryAgencia) {
    return <Alert>Debes tener una agencia asignada para cotizar</Alert>
  }

  // Usar color de la agencia
  const agenciaColor = primaryAgencia.color_primario

  // Validar si pertenece a agencia específica
  if (hasAgencia('nova_flash')) {
    // Lógica específica para Nova Flash
  }

  // Mostrar sede
  console.log('Usuario trabaja en:', sede?.nombre)

  return (
    <div style={{ borderColor: agenciaColor }}>
      <h2>Cotizador - {primaryAgencia.nombre}</h2>
      <p>Sede: {sede?.nombre || 'Sin sede asignada'}</p>
    </div>
  )
}
```

#### 3. Uso en Protección de Rutas

```javascript
// Ejemplo: Proteger ruta por agencia
export const useAgenciaRequired = (requiredAgencia) => {
  const { hasAgencia, loading } = useUserProfile()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !hasAgencia(requiredAgencia)) {
      router.push('/no-autorizado')
    }
  }, [loading, hasAgencia, requiredAgencia, router])

  return { loading, hasAccess: hasAgencia(requiredAgencia) }
}

// En un componente
function NovaFlashPage() {
  const { loading, hasAccess } = useAgenciaRequired('nova_flash')
  
  if (loading) return <Loading />
  if (!hasAccess) return null
  
  return <div>Contenido exclusivo de Nova Flash</div>
}
```

---

## 📊 Casos de Uso Identificados

### 1. Cotizador con Temas por Agencia

```javascript
// Ya existe: dashboard/src/lib/cotizador/agencyThemes.js
// Se puede mejorar usando primaryAgencia del contexto

const { primaryAgencia } = useUserProfile()
const theme = getAgencyTheme(primaryAgencia?.codigo || 'nova')
```

### 2. Filtrado de Datos por Agencia

```javascript
// Filtrar cotizaciones por agencia del usuario
const { agencias } = useUserProfile()
const agenciaIds = agencias.map(a => a.id)

const { data } = await supabase
  .from('cotizaciones')
  .select('*')
  .in('agencia_id', agenciaIds)  // Filtrar por agencias del usuario
```

### 3. Reportes por Sede

```javascript
// Generar reporte de ventas por sede
const { sede } = useUserProfile()

if (sede) {
  const report = await generateSedeReport(sede.id)
}
```

### 4. Validaciones de Negocio

```javascript
// Solo usuarios de agencia primaria pueden aprobar cotizaciones
const { isAgenciaPrimary } = useUserProfile()

if (isAgenciaPrimary('nova_flash')) {
  // Mostrar botón de aprobar
}
```

### 5. Personalización de UI

```javascript
// Cambiar logo según agencia
const { primaryAgencia } = useUserProfile()

<img src={primaryAgencia?.logo_url || '/default-logo.png'} />
```

---

## 🚀 Plan de Implementación

### Fase 1: Backend (Opcional - Ya existe)
- ✅ Endpoints ya funcionan
- ✅ Servicios ya implementados
- ⚠️ Considerar agregar endpoint `/api/users/me/context` que devuelva todo en una llamada

### Fase 2: Frontend - UserProfileContext
1. ✅ Extender estado inicial con `agencias`, `primaryAgencia`, `sede`
2. ✅ Agregar fetch de agencias en `fetchUserProfile`
3. ✅ Incluir `sede` en query de perfil (ya está en schema)
4. ✅ Crear helpers: `hasAgencia`, `isAgenciaPrimary`, `hasSede`, `isSedeCode`
5. ✅ Agregar tipos TypeScript (opcional pero recomendado)

### Fase 3: Actualización de Componentes
1. ✅ Actualizar `CotizadorForm` para usar `primaryAgencia`
2. ✅ Actualizar filtros de datos para considerar agencias
3. ✅ Agregar validaciones donde sea necesario

### Fase 4: Testing
1. ✅ Probar con usuario sin agencias
2. ✅ Probar con usuario con múltiples agencias
3. ✅ Probar cambio de agencia primaria
4. ✅ Probar asignación/remoción de sede

---

## ⚠️ Consideraciones Importantes

### Performance
- ✅ **Una sola carga:** Al iniciar sesión
- ✅ **Caché:** Datos disponibles en memoria
- ⚠️ **Refresh:** Agregar listener para actualizar cuando cambien agencias/sedes

### Seguridad
- ✅ **Validación backend:** Siempre validar en servidor
- ✅ **No confiar solo en frontend:** El contexto es para UX, no seguridad
- ✅ **Middleware:** Considerar middleware de Express para validar agencia en requests

### Escalabilidad
- ✅ **Pocos datos:** Agencias y sedes son tablas pequeñas
- ✅ **No bloquea:** Carga asíncrona
- ⚠️ **Usuarios con muchas agencias:** Considerar paginación si un usuario tiene >20 agencias

### Mantenibilidad
- ✅ **Patrón consistente:** Igual que roles/permisos
- ✅ **Documentado:** Fácil de entender para nuevos devs
- ✅ **Testeable:** Helpers son funciones puras

---

## 🔧 Root Cause Analysis

### ¿Por qué no estaba implementado?

1. **Evolución del sistema:** El sistema empezó con roles/permisos, agencias/sedes se agregaron después
2. **Diferentes patrones:** Sedes usa FK directa, agencias usa tabla intermedia
3. **Falta de necesidad inicial:** Las validaciones por agencia no eran críticas al inicio
4. **Complejidad percibida:** Parece más complejo de lo que realmente es

### ¿Por qué es importante ahora?

1. **Múltiples agencias operando:** Nova, Nova Colombia, Apolo
2. **Temas por agencia:** Cotizador necesita saber la agencia
3. **Reportes segmentados:** Por sede y agencia
4. **Validaciones de negocio:** Ciertas acciones solo para ciertas agencias
5. **Escalabilidad:** Preparar el sistema para más agencias

---

## 📝 Recomendaciones Finales

### Prioridad Alta
1. ✅ **Implementar extensión de UserProfileContext** (2-3 horas)
2. ✅ **Agregar helpers básicos** (1 hora)
3. ✅ **Actualizar CotizadorForm** (1 hora)

### Prioridad Media
4. ✅ **Crear endpoint `/api/users/me/context`** para optimizar (1 hora)
5. ✅ **Agregar refresh listener** para cambios en tiempo real (1 hora)
6. ✅ **Documentar en README** (30 min)

### Prioridad Baja
7. ⚠️ **Migrar a TypeScript** para mejor tipado (4-6 horas)
8. ⚠️ **Agregar tests unitarios** para helpers (2 horas)
9. ⚠️ **Crear middleware de validación** en backend (2 horas)

---

## 🎓 Conclusión

El sistema tiene una **base sólida** para implementar el contexto de agencias y sedes. La solución propuesta es:

- ✅ **Consistente** con el patrón existente
- ✅ **No invasiva** (no rompe código existente)
- ✅ **Performante** (una sola carga)
- ✅ **Escalable** (soporta múltiples agencias)
- ✅ **Fácil de usar** (helpers intuitivos)

**Tiempo estimado de implementación:** 4-6 horas  
**Complejidad:** Media  
**Riesgo:** Bajo  
**Impacto:** Alto

---

**Siguiente paso recomendado:** Implementar la extensión de `UserProfileContext` siguiendo el código propuesto en este documento.
