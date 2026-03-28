# 🏗️ ARQUITECTURA DE AUTENTICACIÓN - FUENTE ÚNICA DE VERDAD

## 📊 DIAGRAMA DE FLUJO

```
Usuario → AuthContext → useUserProfile → useRouteGuard → Vista Protegida
    ↓          ↓              ↓                ↓
Supabase   Session       Permisos         Validación
           Global         + Roles          de Acceso
```

---

## 🔐 1. AuthContext.js - CAPA BASE (Sesión de Supabase)

**Responsabilidad:** Manejar la sesión de Supabase y estado global de autenticación.

### ¿Qué hace?
- ✅ Detecta si hay un usuario autenticado en Supabase
- ✅ Provee `user`, `loading`, `isAuthenticated`, `initialized`
- ✅ Funciones: `signIn()`, `signOut()`, `signUp()`
- ✅ Listener de cambios de sesión en tiempo real

### ¿Qué NO hace?
- ❌ NO maneja roles
- ❌ NO maneja permisos
- ❌ NO obtiene perfil de la DB

### Uso:
```javascript
import { useAuth } from '@/contexts/AuthContext'

const { user, loading, isAuthenticated, signOut } = useAuth()
// user = { id, email, created_at, ... }
```

**Archivo:** `dashboard/src/contexts/AuthContext.js`

---

## 👤 2. useUserProfile.js - CAPA DE NEGOCIO (Permisos y Roles)

**Responsabilidad:** Obtener perfil completo del usuario con roles y permisos granulares.

### ¿Qué hace?
- ✅ Consulta tabla `profiles` → Obtiene `full_name`, `avatar_url`, `role`
- ✅ Consulta tabla `role_permissions` → Permisos del rol
- ✅ Consulta tabla `user_permissions` → Permisos específicos del usuario
- ✅ Combina permisos: `allPermissions = rolePermissions + userPermissions - revocados`
- ✅ Provee helpers: `isAdmin`, `isManager`, `hasPermission()`, `isRole()`

### ¿Qué retorna?
```javascript
{
  profile: { id, email, full_name, avatar_url, ... },
  role: 'admin', // String con el nombre del rol
  roleObject: { id, name, description }, // Objeto completo
  
  // Arrays de permisos
  rolePermissions: ['users.read', 'users.create', ...],
  userPermissions: ['tasas.edit'], // Permisos específicos
  allPermissions: [...combinados],
  
  // Helpers
  isAdmin: true,
  isManager: false,
  hasPermission: (name) => boolean,
  isRole: (name) => boolean,
  ...
}
```

### Uso:
```javascript
import { useUserProfile } from '@/hooks/useUserProfile'

const { profile, role, isAdmin, hasPermission } = useUserProfile()

if (isAdmin) {
  // Mostrar panel de admin
}

if (hasPermission('tasas.edit')) {
  // Permitir editar tasas
}
```

**Archivo:** `dashboard/src/hooks/useUserProfile.js`

---

## 🛡️ 3. useRouteGuard.js - CAPA DE PROTECCIÓN (Validación de Rutas)

**Responsabilidad:** Proteger rutas y redirigir usuarios no autorizados.

### ¿Qué hace?
- ✅ Combina `useAuth` + `useUserProfile`
- ✅ Valida si usuario está autenticado
- ✅ Valida si usuario tiene rol permitido
- ✅ Redirige a `/login` si no autenticado
- ✅ Redirige a `/no-autorizado` si no tiene permiso

### Configuración:
```javascript
import { useRouteGuard } from '@/hooks/useRouteGuard'

// Requiere solo autenticación
const { user, loading } = useRouteGuard({
  requireAuth: true
})

// Requiere rol específico
const { user, isAdmin } = useRouteGuard({
  requireAuth: true,
  allowedRoles: ['admin']
})

// Admin o Gerente
const { user, isAdmin, isManager } = useRouteGuard({
  requireAuth: true,
  allowedRoles: ['admin', 'gerente']
})
```

### Hooks predefinidos:
```javascript
// Solo autenticación
useAuthRequired()

// Solo admin
useAdminRequired()

// Admin o gerente
useManagerRequired()

// Página pública
usePublicPage()
```

**Archivo:** `dashboard/src/hooks/useRouteGuard.js`

---

## 🚪 4. ProtectedRoute.jsx - COMPONENTE LEGACY (DEPRECADO)

**⚠️ NO USAR - Mantener solo por compatibilidad.**

Este componente es la forma antigua de proteger rutas. Se recomienda usar `useRouteGuard` en su lugar.

**Archivo:** `dashboard/src/components/auth/ProtectedRoute.jsx`

---

## 📚 5. userConfig.js - CONFIGURACIÓN LEGACY (DEPRECADO PARCIALMENTE)

**Responsabilidad:** Configuración manual de permisos de usuario (sistema antiguo).

### ¿Qué contiene?
- Lista hardcodeada de usuarios con roles y permisos
- Función `getUserInfo(email)` que retorna info del usuario
- Función `isRouteHidden(email, route)` para ocultar rutas

### ⚠️ Problema:
- Datos hardcodeados en código (no en DB)
- No se sincroniza con la tabla `profiles`
- Duplica lógica de `useUserProfile`

### ✅ Recomendación:
- **Migrar todo a la DB** y usar `useUserProfile`
- Mantener solo `isRouteHidden` si es necesario para compatibilidad

**Archivo:** `dashboard/src/lib/userConfig.js`

---

## 🌐 6. layout.js - LAYOUT GLOBAL

**Responsabilidad:** Configurar providers y componentes globales.

### ¿Qué hace?
- ✅ Envuelve toda la app con `<AuthProvider>`
- ✅ Configura `<Toaster>` de react-hot-toast
- ✅ Configura ErrorBoundary

### Jerarquía:
```
<AuthProvider>  ← Provee useAuth a toda la app
  <Navbar />    ← Usa useUserProfile
  <Sidebar />   ← Usa useUserProfile
  <children />  ← Vistas protegidas con useRouteGuard
</AuthProvider>
```

**Archivo:** `dashboard/src/app/layout.js`

---

## 🔄 FLUJO COMPLETO DE AUTENTICACIÓN

### **Paso 1: Usuario ingresa a una ruta protegida**
```
/configuracion/usuarios
```

### **Paso 2: Vista usa useRouteGuard**
```javascript
export default function UsuariosPage() {
  const { user, isAdmin, loading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin']
  })
  
  if (loading) return <Loader />
  
  return <div>Panel de usuarios</div>
}
```

### **Paso 3: useRouteGuard valida en orden**
```javascript
1. ¿AuthContext está inicializado? → Si no, espera
2. ¿Usuario autenticado (useAuth)? → Si no, redirect a /login
3. ¿Tiene rol permitido (useUserProfile)? → Si no, redirect a /no-autorizado
4. ✅ Todo OK → Renderiza vista
```

### **Paso 4: useUserProfile carga datos**
```javascript
1. Consulta tabla profiles → Obtiene perfil y rol
2. Consulta role_permissions → Permisos del rol
3. Consulta user_permissions → Permisos específicos
4. Combina y retorna todo
```

---

## 📋 GUÍA DE USO SEGÚN CASO

### **Caso 1: Proteger una página completa**
```javascript
// pages/admin/usuarios/page.js
import { useRouteGuard } from '@/hooks/useRouteGuard'

export default function UsuariosPage() {
  const { user, isAdmin } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin']
  })
  
  return <div>...</div>
}
```

### **Caso 2: Mostrar/ocultar elementos en UI**
```javascript
import { useUserProfile } from '@/hooks/useUserProfile'

export default function Dashboard() {
  const { isAdmin, hasPermission } = useUserProfile()
  
  return (
    <div>
      {isAdmin && <AdminPanel />}
      {hasPermission('tasas.edit') && <EditButton />}
    </div>
  )
}
```

### **Caso 3: Validar en un componente (sin proteger ruta)**
```javascript
import { useUserProfile } from '@/hooks/useUserProfile'

export default function MiComponente() {
  const { profile, role, isManager } = useUserProfile()
  
  return (
    <div>
      <p>Hola {profile?.full_name}</p>
      <p>Tu rol: {role}</p>
      {isManager && <ManagerTools />}
    </div>
  )
}
```

### **Caso 4: Obtener solo info del usuario autenticado**
```javascript
import { useAuth } from '@/contexts/AuthContext'

export default function SimpleComponent() {
  const { user, signOut } = useAuth()
  
  return (
    <div>
      <p>{user?.email}</p>
      <button onClick={signOut}>Salir</button>
    </div>
  )
}
```

---

## ✅ MEJORES PRÁCTICAS

### **DO ✅**
1. Usar `useUserProfile` para obtener rol y permisos
2. Usar `useRouteGuard` en páginas protegidas
3. Usar helpers: `isAdmin`, `isManager`, `hasPermission()`
4. Validar permisos específicos con `hasPermission('nombre.permiso')`

### **DON'T ❌**
1. NO usar `getUserInfo()` de `userConfig.js` (deprecado)
2. NO hardcodear permisos en código
3. NO comparar roles manualmente (`role === 'admin'`), usar `isAdmin` o `isRole('admin')`
4. NO duplicar lógica de validación en cada componente

---

## 🎯 REGLAS DE ORO

1. **Una sola fuente de verdad:** `useUserProfile` para roles y permisos
2. **Protección de rutas:** `useRouteGuard` en el componente de la página
3. **UI condicional:** Helpers de `useUserProfile` (`isAdmin`, `hasPermission`)
4. **Sesión global:** `useAuth` para autenticación básica

---

## 🔧 MANTENIMIENTO

### **Agregar nuevo rol:**
1. Crear en Supabase tabla `roles`
2. Usar automáticamente en `useUserProfile`
3. Agregar helper si es común: `isNuevoRol` en `useUserProfile.js`

### **Agregar nuevo permiso:**
1. Crear en Supabase tabla `permissions`
2. Asignar a rol en tabla `role_permissions`
3. Validar con `hasPermission('nuevo.permiso')`

### **Revocar permiso a usuario:**
1. Crear registro en `user_permissions` con `granted: false`
2. Automáticamente se filtra en `useUserProfile`

---

## 📝 RESUMEN

| Componente | Responsabilidad | Usar cuando... |
|------------|----------------|-----------------|
| `AuthContext` | Sesión Supabase | Necesitas `user`, `signOut`, etc. |
| `useUserProfile` | Permisos y roles | Necesitas validar permisos o roles |
| `useRouteGuard` | Proteger rutas | Página requiere autenticación/rol |
| `userConfig.js` | ⚠️ Deprecado | NO USAR (solo legacy) |
| `ProtectedRoute` | ⚠️ Deprecado | NO USAR (usar `useRouteGuard`) |

---

**✨ Con esta arquitectura, tienes un sistema centralizado, escalable y fácil de mantener.**
