# 🔐 Implementación Completa de Autenticación - Dashboard CRM

## 📋 **RESUMEN EJECUTIVO**

Guía completa para implementar y mantener el sistema de autenticación del dashboard CRM con Supabase Auth, roles personalizados y protección de rutas.

---

## 🎯 **OBJETIVOS DEL SISTEMA**

### **Autenticación Centralizada**
- ✅ Login seguro con email/password
- ✅ Sesiones persistentes con Supabase Auth
- ✅ Redirección automática según estado
- ✅ Logout completo

### **Gestión de Roles**
- ✅ **Admin**: Acceso total a todos los recursos
- ✅ **Gerente**: Acceso limitado a sus bots asignados
- ✅ **Administracion**: Acceso a funciones administrativas
- ✅ **Asesor**: Acceso básico de consulta

### **Protección de Rutas**
- ✅ Páginas completas con `useRequireAuth`
- ✅ Elementos específicos con lógica condicional
- ✅ Loading states durante autenticación

---

## 🏗️ **ARQUITECTURA DE AUTENTICACIÓN**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Usuario       │    │   Supabase      │    │   Dashboard     │
│                 │◄──►│   Auth          │◄──►│   Next.js       │
│ • Login/Logout  │    │ • Sessions      │    │ • Hooks         │
│ • Perfil        │    │ • JWT Tokens    │    │ • Middleware    │
│ • Roles         │    │ • RLS Policies  │    │ • Routes        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

### **Archivos Principales**
```
dashboard/src/
├── app/
│   ├── (crm)/layout.js           # Layout principal con autenticación
│   ├── login/page.js             # Página de login
│   ├── dashboard/page.js         # Dashboard protegido
│   └── cotizador/page.js        # Página híbrida
├── hooks/
│   ├── useAuth.js               # Hook principal de autenticación
│   ├── useRequireAuth.js       # Hook de protección de rutas
│   └── useRole.js              # Hook de utilidad de roles
├── lib/
│   └── supabase.js             # Cliente de Supabase
└── components/
    ├── ProtectedRoute.js       # Componente de protección
    └── RoleBasedComponent.js   # Componente basado en roles
```

---

## 🔧 **IMPLEMENTACIÓN PASO A PASO**

### **PASO 1: CONFIGURACIÓN DE SUPABASE**

#### **1.1 Variables de Entorno**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### **1.2 Cliente de Supabase**
```javascript
// dashboard/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### **PASO 2: HOOK PRINCIPAL DE AUTENTICACIÓN**

#### **2.1 useAuth Hook**
```javascript
// dashboard/src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Obtener sesión inicial
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        setUser(session?.user ?? null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const supabase = createClient()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  }
}
```

### **PASO 3: HOOK DE PROTECCIÓN DE RUTAS**

#### **3.1 useRequireAuth Hook**
```javascript
// dashboard/src/hooks/useRequireAuth.js
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'

export function useRequireAuth(redirectTo = '/login') {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [loading, isAuthenticated, redirectTo, router])

  return {
    user,
    loading,
    isAuthenticated,
    isReady: !loading && isAuthenticated,
  }
}
```

### **PASO 4: HOOK DE UTILIDAD DE ROLES**

#### **4.1 useRole Hook**
```javascript
// dashboard/src/hooks/useRole.js
import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  const role = user?.user_metadata?.role || 'viewer'
  const isAdmin = role === 'admin'
  const isManager = role === 'manager' || isAdmin
  const isWorker = role === 'worker' || isManager
  const isViewer = role === 'viewer' || isWorker

  return {
    role,
    isAdmin,
    isManager,
    isWorker,
    isViewer,
    permissions: {
      canViewAll: isAdmin,
      canManageUsers: isAdmin,
      canViewOwnBots: isWorker,
      canViewReports: isManager,
      readOnly: role === 'viewer',
    }
  }
}
```

### **PASO 5: LAYOUT PRINCIPAL PROTEGIDO**

#### **5.1 Layout CRM**
```javascript
// dashboard/src/app/(crm)/layout.js
import { useRequireAuth } from '@/hooks/useRequireAuth'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function CRMLayout({ children }) {
  const { loading, isAuthenticated, isReady } = useRequireAuth()

  // Mostrar loading durante autenticación
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Si está autenticado, mostrar el contenido
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation, Sidebar, etc. */}
      <main>{children}</main>
    </div>
  )
}
```

### **PASO 6: PÁGINA DE LOGIN**

#### **6.1 Login Component**
```javascript
// dashboard/src/app/login/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  )
}
```

### **PASO 7: PROTECCIÓN DE ELEMENTOS**

#### **7.1 Componente Basado en Roles**
```javascript
// dashboard/src/components/RoleBasedComponent.js
import { useRole } from '@/hooks/useRole'

export function RoleBasedComponent({ 
  children, 
  requiredRole = 'viewer',
  fallback = null 
}) {
  const { role, permissions } = useRole()

  const hasPermission = {
    admin: permissions.isAdmin,
    manager: permissions.isManager,
    worker: permissions.isWorker,
    viewer: permissions.isViewer,
  }[requiredRole]

  if (!hasPermission) {
    return fallback
  }

  return children
}

// Ejemplo de uso:
// <RoleBasedComponent requiredRole="admin">
//   <button>Eliminar Usuario</button>
// </RoleBasedComponent>
```

---

## 🎯 **CASOS DE USO ESPECÍFICOS**

### **PÁGINAS HÍBRIDAS (COTIZADOR)**
```javascript
// dashboard/src/app/cotizador/page.js
'use client'

import { useAuth } from '@/hooks/useAuth'
import CotizadorForm from '@/components/CotizadorForm'
import LoginPrompt from '@/components/LoginPrompt'

export default function CotizadorPage() {
  const { user, isAuthenticated } = useAuth()

  // Página híbrida: accesible públicamente pero con funcionalidades extra para usuarios autenticados
  return (
    <div className="min-h-screen">
      <header>
        <h1>Cotizador de Vuelos</h1>
        {isAuthenticated && (
          <p>Bienvenido, {user.email}</p>
        )}
      </header>

      <main>
        {isAuthenticated ? (
          <CotizadorForm user={user} />
        ) : (
          <LoginPrompt />
        )}
      </main>
    </div>
  )
}
```

### **PÁGINAS PÚBLICAS (DEBUG)**
```javascript
// dashboard/src/app/debug/page.js
export default function DebugPage() {
  // Página completamente pública - sin protección
  return (
    <div className="min-h-screen">
      <h1>Página de Debug</h1>
      <p>Información de diagnóstico del sistema</p>
    </div>
  )
}
```

---

## 🔐 **CONFIGURACIÓN DE SEGURIDAD**

### **POLÍTICAS RLS EN SUPABASE**
```sql
-- Políticas para tabla profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para tabla bots
CREATE POLICY "Admins can view all bots" ON bots
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Workers can view their assigned bots" ON bots
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'worker' 
    AND worker_id IN (
      SELECT id FROM workers WHERE email = auth.jwt() ->> 'email'
    )
  );
```

### **METADATA DE USUARIO**
```javascript
// Al crear usuario, asignar rol
const { data, error } = await supabase.auth.admin.updateUserById(
  userId,
  {
    user_metadata: {
      role: 'admin', // o 'worker', 'viewer'
      name: 'John Doe',
      department: 'sales'
    }
  }
)
```

---

## 🚀 **MEJORES PRÁCTICAS**

### **1. Manejo de Estados**
```javascript
// Siempre mostrar loading durante autenticación
if (loading) return <LoadingSpinner />

// Verificar autenticación antes de mostrar contenido
if (!isAuthenticated) return null

// Manejar errores de forma amigable
{error && <ErrorMessage message={error} />}
```

### **2. Optimización de Rendimiento**
```javascript
// Cache de sesión en localStorage si es necesario
const cachedSession = localStorage.getItem('supabase.session')
if (cachedSession) {
  // Usar cache mientras se verifica con servidor
}
```

### **3. Seguridad Adicional**
```javascript
// Validar roles en el servidor también
export async function serverAction() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.user_metadata.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  
  // Ejecutar acción
}
```

---

## 🐛 **TROUBLESHOOTING COMÚN**

### **Problema: "Usuario no se redirige después del login"**
```javascript
// Solución: Asegurar que el hook escuche cambios de estado
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      }
    }
  )
  return () => subscription.unsubscribe()
}, [])
```

### **Problema: "Loading infinito"**
```javascript
// Solución: Manejar correctamente el estado de loading
const { loading, isAuthenticated } = useAuth()

if (loading) {
  return <LoadingSpinner />
}

// No mostrar contenido si no está autenticado
if (!isAuthenticated) {
  return null // El hook se encargará de redirigir
}
```

### **Problema: "Roles no funcionan"**
```javascript
// Solución: Verificar metadata del usuario
console.log('User metadata:', user?.user_metadata)

// Asegurar que el rol esté configurado correctamente
const role = user?.user_metadata?.role || 'viewer'
```

---

## 📊 **MONITOREO Y LOGGING**

### **Logs de Autenticación**
```javascript
// Agregar logging para debugging
const login = async (email, password) => {
  console.log('🔐 Login attempt:', { email, timestamp: new Date() })
  
  try {
    const result = await supabase.auth.signInWithPassword({ email, password })
    console.log('✅ Login success:', { userId: result.data.user?.id })
    return result
  } catch (error) {
    console.error('❌ Login failed:', { error: error.message, email })
    throw error
  }
}
```

### **Métricas de Rendimiento**
```javascript
// Medir tiempo de carga de autenticación
const startTime = performance.now()
// ... lógica de autenticación
const endTime = performance.now()
console.log(`Auth loading time: ${endTime - startTime}ms`)
```

---

## 🔄 **MIGRACIÓN DESDE SISTEMA ANTIGUO**

### **Pasos para Migrar**
1. **Identificar páginas protegidas** actuales
2. **Reemplazar lógica manual** con `useRequireAuth`
3. **Actualizar componentes** para usar `useRole`
4. **Mover validaciones** del layout a hooks
5. **Probar todos los flujos** de autenticación

### **Código Antiguo vs Nuevo**
```javascript
// ANTES (manual en layout.js)
useEffect(() => {
  const checkAuth = async () => {
    const session = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }
  checkAuth()
}, [])

// DESPUÉS (con hook)
const { loading, isAuthenticated } = useRequireAuth()
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **✅ Configuración Básica**
- [ ] Variables de entorno configuradas
- [ ] Cliente de Supabase creado
- [ ] Hooks de autenticación implementados
- [ ] Layout principal protegido

### **✅ Funcionalidad**
- [ ] Login/logout funcionando
- [ ] Redirecciones automáticas
- [ ] Protección de rutas
- [ ] Manejo de roles

### **✅ Seguridad**
- [ ] Políticas RLS configuradas
- [ ] Validación en cliente y servidor
- [ ] Manejo seguro de errores
- [ ] Logs de auditoría

### **✅ UX/UI**
- [ ] Loading states
- [ ] Mensajes de error amigables
- [ ] Redirecciones suaves
- [ ] Estado persistente

---

## 🎯 **CONCLUSIÓN**

El sistema de autenticación implementado proporciona:

- **Seguridad robusta** con Supabase Auth
- **Gestión flexible de roles**
- **Protección completa de rutas**
- **Experiencia de usuario optimizada**
- **Código mantenible y escalable**

Esta implementación puede ser replicada en cualquier proyecto Next.js con Supabase, proporcionando una base sólida para sistemas que requieren autenticación y autorización.

---

**Última Actualización**: 23 de Febrero, 2026  
**Versión**: 2.0.0  
**Estado**: ✅ **PRODUCCIÓN ACTIVA**
