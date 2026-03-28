# 🛡️ Guía Completa de Uso del Sistema de Guards

## 📍 Ubicación de Archivos

### **1. Contexto Centralizado**
```
dashboard/src/contexts/UserProfileContext.js
```
**Accesible desde cualquier parte del proyecto** (integrado en `layout.js`)

### **2. Sistema de Guards**
```
dashboard/src/lib/guards.js
```
Funciones helper para control de acceso granular

---

## 🎯 Uso Básico en Componentes

### **1. Importar el Hook**
```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
```

### **2. Obtener Datos y Helpers**
```javascript
function MiComponente() {
  const {
    // Datos del usuario
    profile,        // { id, email, full_name, avatar_url... }
    role,           // 'super_admin' | 'admin' | 'gerente' | 'asesor'...
    roleObject,     // { id, name, description, ranking }
    loading,
    
    // Permisos
    hasPermission,       // hasPermission('users.create')
    hasAnyPermission,    // hasAnyPermission(['users.create', 'users.edit'])
    hasAllPermissions,   // hasAllPermissions(['users.create', 'users.edit'])
    allPermissions,      // Array: ['users.view', 'tasas.edit', ...]
    
    // Roles
    isSuperAdmin,        // boolean
    isAdmin,             // boolean
    isManager,           // boolean (gerente)
    isAsesor,            // boolean
    isRole,              // isRole('emisor')
    
    // Jerarquía
    getRoleRanking,      // getRoleRanking() → 100, 90, 70...
    canManageRole        // canManageRole(targetRanking) → boolean
  } = useUserProfile()
  
  // Tu lógica aquí...
}
```

---

## 🔒 Casos de Uso Comunes

### **1. Mostrar/Ocultar Elementos de UI**

#### **Por Permiso**
```javascript
function UsuariosPage() {
  const { hasPermission } = useUserProfile()
  
  return (
    <div>
      <h1>Usuarios</h1>
      
      {hasPermission('users.create') && (
        <button>Crear Usuario</button>
      )}
      
      {hasPermission('users.edit') && (
        <button>Editar Usuario</button>
      )}
    </div>
  )
}
```

#### **Por Rol**
```javascript
function Dashboard() {
  const { isAdmin, isSuperAdmin, isManager } = useUserProfile()
  
  return (
    <div>
      {(isSuperAdmin || isAdmin) && (
        <section>Panel de Administración</section>
      )}
      
      {isManager && (
        <section>Panel de Gerencia</section>
      )}
    </div>
  )
}
```

#### **Usando el Componente CanAccess**
```javascript
import { CanAccess } from '@/lib/guards'

function MiComponente() {
  return (
    <div>
      <CanAccess permissions="users.create">
        <button>Crear Usuario</button>
      </CanAccess>
      
      <CanAccess 
        permissions={['users.edit', 'users.delete']} 
        requireAll={false}  // OR: cualquiera de los dos
      >
        <button>Gestionar Usuario</button>
      </CanAccess>
      
      <CanAccess roles={['admin', 'super_admin']}>
        <AdminPanel />
      </CanAccess>
      
      <CanAccess 
        permissions="users.create"
        fallback={<p>No tienes permiso</p>}
      >
        <FormularioCrearUsuario />
      </CanAccess>
    </div>
  )
}
```

---

### **2. Validar Acciones antes de Ejecutar**

```javascript
function handleCrearUsuario() {
  const { hasPermission, isSuperAdmin } = useUserProfile()
  
  if (!hasPermission('users.create')) {
    toast.error('No tienes permiso para crear usuarios')
    return
  }
  
  // Proceder con la creación...
}
```

---

### **3. Validar Jerarquía (Gestión de Usuarios/Roles)**

#### **Verificar si puede editar un usuario**
```javascript
import { canEditUser } from '@/lib/guards'

function UserList({ users }) {
  const userProfile = useUserProfile()
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.full_name}
          
          {canEditUser(user, userProfile) && (
            <button onClick={() => editUser(user)}>
              Editar
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
```

#### **Verificar si puede asignar un rol**
```javascript
import { canAssignRole } from '@/lib/guards'

function RoleSelector({ allRoles }) {
  const userProfile = useUserProfile()
  
  // Filtrar roles que puedo asignar
  const assignableRoles = allRoles.filter(role => 
    canAssignRole(role, userProfile)
  )
  
  return (
    <select>
      {assignableRoles.map(role => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
    </select>
  )
}
```

#### **Filtrar usuarios visibles según jerarquía**
```javascript
import { filterVisibleUsers } from '@/lib/guards'

function UsuariosPage() {
  const [allUsers, setAllUsers] = useState([])
  const userProfile = useUserProfile()
  
  // Solo mostrar usuarios que puedo gestionar
  const visibleUsers = filterVisibleUsers(allUsers, userProfile)
  
  return (
    <UserList users={visibleUsers} />
  )
}
```

---

### **4. Proteger Rutas Completas**

#### **Usando useRouteGuard (ya existe)**
```javascript
'use client'
import { useRouteGuard } from '@/hooks/useRouteGuard'

export default function UsuariosPage() {
  const { user, profile, loading, isAdmin } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'super_admin']
  })
  
  if (loading) return <Spinner />
  
  return <div>Panel de Usuarios</div>
}
```

#### **Guard Personalizado con Permisos**
```javascript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/contexts/UserProfileContext'

export default function ConfiguracionPage() {
  const router = useRouter()
  const { hasPermission, loading } = useUserProfile()
  
  useEffect(() => {
    if (!loading && !hasPermission('users.view')) {
      router.push('/dashboard')
    }
  }, [loading, hasPermission, router])
  
  if (loading) return <Spinner />
  
  return <div>Configuración</div>
}
```

---

## 🎭 Casos Específicos: Super Admin vs Admin

### **1. CRUD de Usuarios**

```javascript
function UserActions({ targetUser }) {
  const { isSuperAdmin, hasPermission } = useUserProfile()
  
  // Solo super_admin puede crear, editar, eliminar usuarios
  const canCRUD = isSuperAdmin && hasPermission('users.create')
  
  return (
    <div>
      {canCRUD && (
        <>
          <button>Crear Usuario</button>
          <button>Editar Usuario</button>
          <button>Eliminar Usuario</button>
        </>
      )}
    </div>
  )
}
```

### **2. Asignar/Quitar Permisos**

```javascript
function PermissionManager({ targetUser }) {
  const { isAdmin, isSuperAdmin, canManageRole } = useUserProfile()
  
  // Admin SÍ puede asignar permisos, pero solo a usuarios con ranking inferior
  const canManagePerms = 
    (isAdmin || isSuperAdmin) && 
    canManageRole(targetUser.role?.ranking || 0)
  
  return (
    <div>
      {canManagePerms && (
        <PermissionsForm user={targetUser} />
      )}
    </div>
  )
}
```

### **3. Desactivar Usuarios**

```javascript
import { canDeactivateUser } from '@/lib/guards'

function UserStatusToggle({ targetUser }) {
  const userProfile = useUserProfile()
  
  // Super admin: puede desactivar a cualquiera
  // Admin: puede desactivar a usuarios inferiores (pero NO ve super_admin)
  const canToggleStatus = canDeactivateUser(targetUser, userProfile)
  
  return (
    <div>
      {canToggleStatus && (
        <button onClick={toggleStatus}>
          {targetUser.is_active ? 'Desactivar' : 'Activar'}
        </button>
      )}
    </div>
  )
}
```

### **4. Gestionar Roles y Permisos del Sistema**

```javascript
function RolesManager() {
  const { isSuperAdmin } = useUserProfile()
  
  // Solo super_admin puede gestionar roles y permisos del sistema
  if (!isSuperAdmin) {
    return <p>No tienes acceso a esta sección</p>
  }
  
  return (
    <div>
      <RolesList />
      <PermissionsList />
    </div>
  )
}
```

---

## 📋 Tabla de Permisos: Super Admin vs Admin

| Acción                               | Super Admin | Admin | Gerente | Asesor |
|--------------------------------------|-------------|-------|---------|--------|
| Ver usuarios                         | ✅          | ✅    | ✅      | ❌     |
| Crear usuarios                       | ✅          | ❌    | ❌      | ❌     |
| Editar usuarios                      | ✅          | ❌    | ❌      | ❌     |
| Eliminar usuarios                    | ✅          | ❌    | ❌      | ❌     |
| Desactivar usuarios                  | ✅          | ✅*   | ❌      | ❌     |
| Asignar permisos a usuarios          | ✅          | ✅*   | ❌      | ❌     |
| Quitar permisos a usuarios           | ✅          | ✅*   | ❌      | ❌     |
| Gestionar roles del sistema          | ✅          | ❌    | ❌      | ❌     |
| Gestionar permisos del sistema       | ✅          | ❌    | ❌      | ❌     |
| Ver super_admin en listas            | ✅          | ❌    | ❌      | ❌     |
| Editar super_admin                   | ✅          | ❌    | ❌      | ❌     |
| Asignar rol super_admin              | ✅          | ❌    | ❌      | ❌     |
| Ver tasas y monedas                  | ✅          | ✅    | ✅      | ✅     |
| Editar tasas                         | ✅          | ✅    | ✅      | ❌     |
| Gestionar equipos                    | ✅          | ✅    | ✅      | ❌     |
| Crear cotizaciones                   | ✅          | ✅    | ✅      | ✅     |
| Gestionar vuelos                     | ✅          | ✅    | ✅      | ✅     |

**\* Solo a usuarios con ranking inferior**

---

## 🔧 Helpers Avanzados

### **1. Guard Combinado (Rol + Permisos + Jerarquía)**

```javascript
import { useAccessGuard } from '@/lib/guards'

function ComplexComponent() {
  const userProfile = useUserProfile()
  
  const canAccessFeature = useAccessGuard({
    roles: ['admin', 'gerente'],           // Requiere ser admin o gerente
    permissions: 'users.edit',              // Y tener permiso users.edit
    targetRanking: 50,                      // Y poder gestionar roles hasta ranking 50
    customCheck: (profile) => {             // Y check personalizado
      return profile.profile?.is_active === true
    }
  })(userProfile)
  
  if (!canAccessFeature) {
    return <p>Acceso denegado</p>
  }
  
  return <FeatureContent />
}
```

### **2. Validación en Formularios**

```javascript
function UserForm({ targetUser }) {
  const userProfile = useUserProfile()
  const { filterAssignableRoles } = require('@/lib/guards')
  
  const [allRoles, setAllRoles] = useState([])
  
  // Obtener solo roles que puedo asignar
  const assignableRoles = filterAssignableRoles(allRoles, userProfile)
  
  const handleSubmit = (formData) => {
    // Validar antes de enviar
    const selectedRole = allRoles.find(r => r.id === formData.roleId)
    
    if (!canAssignRole(selectedRole, userProfile)) {
      toast.error('No tienes permiso para asignar este rol')
      return
    }
    
    // Proceder...
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <select name="roleId">
        {assignableRoles.map(role => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </form>
  )
}
```

---

## ⚡ Performance: Por qué está Centralizado

### **Antes (sin contexto centralizado):**
```
Componente A → useUserProfile() → 3 queries a Supabase
Componente B → useUserProfile() → 3 queries a Supabase
Componente C → useUserProfile() → 3 queries a Supabase
...
Total: 24+ queries redundantes
```

### **Ahora (con UserProfileContext):**
```
Layout → UserProfileProvider → 3 queries ÚNICAS al inicio
  └─> Componente A → useUserProfile() → lee del contexto (0 queries)
  └─> Componente B → useUserProfile() → lee del contexto (0 queries)
  └─> Componente C → useUserProfile() → lee del contexto (0 queries)
...
Total: 3 queries totales (88% menos)
```

---

## 🚀 Mejores Prácticas

### ✅ **DO (Hacer)**
```javascript
// 1. Usar el hook en el componente raíz de la página
const { hasPermission } = useUserProfile()

// 2. Validar antes de acciones críticas
if (!hasPermission('users.delete')) return

// 3. Filtrar listas en el frontend
const visibleUsers = filterVisibleUsers(allUsers, userProfile)

// 4. Usar CanAccess para UI condicional
<CanAccess permissions="users.create">
  <CreateButton />
</CanAccess>
```

### ❌ **DON'T (No Hacer)**
```javascript
// 1. NO llamar useUserProfile dentro de loops
users.map(user => {
  const { hasPermission } = useUserProfile() // ❌ MAL
  ...
})

// 2. NO confiar solo en validación frontend
// Siempre validar en backend también

// 3. NO hardcodear roles
if (role === 'admin') // ❌ MAL
if (isAdmin)         // ✅ BIEN
```

---

## 📚 Resumen de Exports

### **UserProfileContext**
```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'
```

### **Guards**
```javascript
import {
  usePermissionGuard,
  useHierarchyGuard,
  useRoleGuard,
  useAccessGuard,
  canEditUser,
  canAssignRole,
  canDeactivateUser,
  filterVisibleUsers,
  filterAssignableRoles,
  CanAccess
} from '@/lib/guards'
```

---

**🎯 Todo está listo y centralizado. Usa `useUserProfile()` desde cualquier componente para acceder a permisos, roles y jerarquía.**
