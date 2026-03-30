# 📋 Reglas de Código - CRM WhatsApp

## 🎯 **Objetivo**

Establecer convenciones claras y consistentes para mantener la calidad, mantenibilidad y escalabilidad del código en todo el proyecto.

---

## 🏗️ **Convenciones de Nombres**

### **Frontend (Dashboard)**
| Tipo de Archivo | Formato | Ejemplos |
|-----------------|---------|----------|
| Componentes | **PascalCase** | `UserProfile.js`, `MessageBubble.jsx` |
| Páginas/Rutas | **kebab-case** | `about-us/page.js`, `user-profile/page.jsx` |
| Hooks | **camelCase** | `useAuth.js`, `useUserProfile.js` |
| Utils/Helpers | **camelCase** o **kebab-case** | `formatDate.js`, `date-utils.js` |
| Configuración | **kebab-case** | `next.config.js`, `api-config.js` |
| Constantes | **UPPER_SNAKE_CASE** | `MAX_FILE_SIZE_MB`, `API_ENDPOINTS` |

### **Backend (Express)**
| Tipo de Archivo | Formato | Ejemplos |
|-----------------|---------|----------|
| Servicios | **PascalCase** | `MessageService.js`, `WahaService.js` |
| Rutas | **camelCase** | `messages.js`, `webhooks.js` |
| Configuración | **kebab-case** | `supabase.js`, `waha.js` |
| Constantes | **UPPER_SNAKE_CASE** | `DATABASE_URL`, `WAHA_API_KEY` |

---

## 📁 **Estructura de Archivos**

### **Frontend (Dashboard)**
```
dashboard/src/
├── app/                    # App Router (Next.js 13+)
├── components/             # Componentes UI reutilizables
├── hooks/                  # Hooks personalizados
├── lib/                    # Utilidades y helpers
├── contexts/               # Context API
├── config/                 # Configuración centralizada
└── services/               # Lógica de negocio (futuro)
```

### **Backend (Express)**
```
src/
├── config/                 # Configuración de servicios
├── routes/                 # Definición de rutas API
├── services/               # Lógica de negocio
├── scripts/                # Scripts de mantenimiento
└── utils/                  # Utilidades compartidas
```

---

## 💻 **Reglas de Código - Frontend**

### **Componentes React**
```javascript
// ✅ BUENO: Componentes funcionales con hooks
'use client'
import { useState, useEffect } from 'react'

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  
  // Lógica del componente
  
  return (
    <div className="user-profile">
      {/* JSX */}
    </div>
  )
}

// ❌ MALO: Componentes de clase (no usar)
class UserProfile extends React.Component {
  // No usar componentes de clase
}
```

### **Hooks Personalizados**
```javascript
// ✅ BUENO: Hook para lógica repetitiva
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// ✅ BUENO: Crear hook si la lógica se repite 2+ veces
// ✅ BUENO: Usar useReducer para lógica compleja
```

### **Estado y Context**
```javascript
// ✅ BUENO: Context para estado global
const AppContext = createContext()

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')
  
  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  )
}

// ✅ BUENO: Prop drilling para datos específicos
// ✅ BUENO: Supabase Realtime para datos colaborativos
```

### **Fetch de Datos**
```javascript
// ✅ BUENO: Manejo de errores completo
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching user data:', error)
    toast.error('Error al cargar datos del usuario')
    throw error
  }
}

// ❌ MALO: Sin manejo de errores
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`)
  const data = await response.json()
  return data
}
```

### **Endpoints Centralizados**
```javascript
// ✅ BUENO: Usar apiConfig.js para endpoints
import { TASAS_API, VUELOS_API, AGENCIAS_API } from '@/config/apiConfig'

// Endpoints simples
await fetch(TASAS_API.crear, options)

// Endpoints con parámetros
await fetch(VUELOS_API.obtener(vueloId), options)

// Endpoints complejos
await fetch(AGENCIAS_API.agenciasUsuario(userId), options)

// ❌ MALO: Hardcodear URLs
await fetch('http://localhost:4000/api/tasas/crear', options)
```

### **APIs Disponibles en apiConfig.js**
```javascript
// Todas las APIs están centralizadas:
- TASAS_API          // Tasas de cambio y monedas
- COTIZACIONES_API   // Sistema de cotizaciones
- VUELOS_API         // Gestión de vuelos
- EQUIPOS_API        // Equipos de trabajo
- RANKINGS_API       // Rankings globales
- ANULABLES_API      // Anulables
- AGENCIAS_API       // Agencias
- SEDES_API          // Sedes
- USERS_API          // Usuarios
```

---

## 🔧 **Reglas de Código - Backend**

### **Estructura de Rutas**
```javascript
// ✅ BUENO: Rutas delegan a servicios
router.get('/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params
    const messages = await messageService.getMessagesByBot(botId)
    res.json({ success: true, data: messages })
  } catch (error) {
    console.error('Error obteniendo mensajes:', error)
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: error.message 
      } 
    })
  }
})

// ✅ BUENO: Lógica simple permitida en rutas
// ❌ MALO: Lógica compleja en rutas (delegar a servicios)
```

### **Manejo de Errores**
```javascript
// ✅ BUENO: Formato estandarizado de errores
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'El campo email es requerido',
    details: validationErrors
  }
})

// ❌ MALO: Mensajes de error sin estructura
res.status(400).json({ error: 'Email requerido' })
```

### **Servicios**
```javascript
// ✅ BUENO: Clases de servicio con métodos claros
export class MessageService {
  async saveMessage(botId, chatDbId, contactId, messageData) {
    try {
      const messageInsertData = {
        bot_id: botId,
        message_id: messageData.id,
        content: messageData.body || messageData.text || '',
        // ... otros campos
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageInsertData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving message:', error)
      throw error
    }
  }
}
```

---

## 🚫 **Prohibiciones Absolutas**

### **General**
- ❌ **NO usar TypeScript** (proyecto es JavaScript puro)
- ❌ **NO acceder a variables de entorno desde el cliente sin `NEXT_PUBLIC_`**
- ❌ **NO hardcodear URLs de producción**
- ❌ **NO eliminar logs de debugging sin preguntar**
- ❌ **NO usar `any` en validaciones**
- ❌ **NO mutar estado directamente sin `setState`**

### **Frontend**
- ❌ **NO usar Server Actions de Next.js** (depende del caso)
- ❌ **NO hacer fetch en cada render sin debounce**
- ❌ **NO duplicar lógica de validación**
- ❌ **NO reescribir componentes completos sin confirmar**

### **Backend**
- ❌ **NO validar inputs en frontend únicamente** (pendiente backend)
- ❌ **NO confiar 100% en datos del cliente**
- ❌ **NO exponer credenciales sensibles en respuestas**

---

## ✅ **Buenas Prácticas Obligatorias**

### **Antes de Crear Código Nuevo**
1. **REVISAR SI YA EXISTE**: Buscar en `/lib`, `/utils`, `/hooks`, `/services`
2. **VERIFICAR COMPONENTES**: Revisar `/components` para UI similar
3. **CONSULTAR API CONFIG**: Ver si endpoint ya está centralizado

### **Manejo de Archivos**
```javascript
// ✅ BUENO: Validar tamaño y tipo
import { validateFileSize, ALLOWED_FILE_TYPES } from '@/lib/utils/vuelos-storage'

if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
  toast.error(`El archivo no debe superar ${MAX_FILE_SIZE_MB}MB`)
  return
}

if (!ALLOWED_FILE_TYPES[tipo].includes(file.type)) {
  toast.error('Tipo de archivo no permitido')
  return
}
```

### **Notificaciones**
```javascript
// ✅ BUENO: SweetAlert2 para decisiones críticas
const result = await Swal.fire({
  title: '¿Estás seguro?',
  text: 'Esta acción no se puede deshacer',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sí, eliminar'
})

// ✅ BUENO: Toast para notificaciones informativas
toast.success('Datos guardados correctamente')
toast.error('Error al procesar la solicitud')
```

### **Loading States**
```javascript
// ✅ BUENO: Mix según contexto
// Para listas largas: Skeleton loaders
{loading ? (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
) : (
  <DataList data={data} />
)}

// Para acciones rápidas: Spinner
{loading ? (
  <div className="flex justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
  </div>
) : (
  <Button onClick={handleAction}>Acción</Button>
)}
```

---

## 🔄 **Patrones Específicos del Proyecto**

### **Roles y Permisos**
```javascript
// ✅ BUENO: Validación por permisos granulares (preferido)
import { useUserProfile } from '@/contexts/UserProfileContext'

const { hasPermission, hasAnyPermission, isAdmin, isManager } = useUserProfile()

// Validación por permiso específico
if (!hasPermission('manage_users')) {
  return <div>No tienes permisos para acceder</div>
}

// Validación por múltiples permisos (OR)
if (!hasAnyPermission(['edit_flights', 'view_flights'])) {
  return <div>No tienes permisos para ver vuelos</div>
}

// Validación por rol (cuando aplica)
if (!isAdmin && !isManager) {
  return <div>No tienes permisos para acceder</div>
}

// ✅ BUENO: Componentes protegidos con permisos
<ProtectedRoute requiredPermission="manage_users">
  <UserManagement />
</ProtectedRoute>
```

### **Supabase Integration**
```javascript
// ✅ BUENO: Manejo de errores de autenticación
import { handleAuthError } from '@/lib/supabase'

try {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
  
  if (error) throw error
  return data
} catch (error) {
  await handleAuthError(error)
}
```

### **WAHA Integration**
```javascript
// ✅ BUENO: Requests directos a WAHA (sin helper centralizado)
const wahaResponse = await axios.get(`${process.env.WAHA_BASE_URL}/api/sessions`, {
  headers: {
    'X-API-Key': process.env.WAHA_API_KEY
  }
})

// Nota: No hay helper centralizado para WAHA, cada servicio maneja sus requests
```

### **Helpers de Supabase**
```javascript
// ✅ BUENO: Usar helpers de autenticación
import { getValidSession, getValidUser, handleAuthError } from '@/lib/supabase'

try {
  const session = await getValidSession()
  const user = await getValidUser()
  // continuar con operación
} catch (error) {
  await handleAuthError(error) // Maneja errores de sesión automáticamente
}

// ✅ BUENO: Usar helpers de bots
import { getAllBots, isBotExcluded } from '@/lib/supabase'

const bots = await getAllBots() // Retorna bots con estadísticas

if (isBotExcluded(botName)) {
  // Es un bot de prueba, excluir de análisis
}
```

---

## 📝 **Guía de Estilo**

### **Imports**
```javascript
// ✅ BUENO: Orden correcto
import React, { useState, useEffect } from 'react'           // React
import { useRouter } from 'next/navigation'                    // Next.js
import { supabase } from '@/lib/supabase'                     // Librerías locales
import { formatFileSize } from '@/lib/utils/file-utils'       // Utilidades
import UserProfile from '@/components/UserProfile'             // Componentes
import './styles.css'                                         // CSS
```

### **Variables y Funciones**
```javascript
// ✅ BUENO: Nombres descriptivos
const isUserAuthenticated = true
const fetchUserDataWithRetry = async (userId) => {
  // implementación
}

// ❌ MALO: Nombres ambiguos
const flag = true
const getData = async (id) => {
  // implementación
}
```

### **Comentarios**
```javascript
// ✅ BUENO: Comentarios útiles
// Validar que el usuario tenga permisos de admin antes de mostrar
if (!isAdmin) return null

// ❌ MALO: Comentarios obvios
// Si no es admin, retorna null
if (!isAdmin) return null
```

---

## 🔍 **Code Review Checklist**

### **Antes de Commit**
- [ ] ¿Revisé si ya existe código similar?
- [ ] ¿Seguí las convenciones de nombres?
- [ ] ¿Manejé todos los errores posibles?
- [ ] ¿Usé los endpoints centralizados?
- [ ] ¿Validé inputs del usuario?
- [ ] ¿Agregué logs útiles?
- [ ] ¿No hardcodeé valores sensibles?

### **Después de Implementar**
- [ ] ¿El código es fácil de entender?
- [ ] ¿Hay duplicación de lógica?
- [ ] ¿Los componentes son reutilizables?
- [ ] ¿El manejo de errores es claro?
- [ ] ¿Los loading states son apropiados?

---

## 🆕 **Patrones Específicos del Proyecto**

### **Hooks Personalizados del Cotizador**
```javascript
// ✅ BUENO: Usar hooks especializados del cotizador
import { useMonedas } from '@/hooks/cotizador/useMonedas'
import { usePasajeros } from '@/hooks/cotizador/usePasajeros'
import { useVistaCotizacion } from '@/hooks/cotizador/useVistaCotizacion'
import { useCalculoCotizacion } from '@/hooks/cotizador/useCalculoCotizacion'

const { monedas, loading } = useMonedas()
const { pasajeros, agregarPasajero } = usePasajeros()
```

### **Configuraciones del Cotizador**
```javascript
// ✅ BUENO: Usar configuraciones centralizadas
import { PASSENGER_CATEGORIES } from '@/lib/cotizador/passengerConfig'
import { PAYMENT_METHODS } from '@/lib/cotizador/paymentConfig'
import { obtenerTasaActual } from '@/lib/cotizador/tasasHelpers'
import aerolineas from '@/lib/cotizador/aerolineas.json'

// Usar categorías de pasajeros predefinidas
const categoria = PASSENGER_CATEGORIES.ADULT

// Obtener métodos de pago por agencia
const metodos = PAYMENT_METHODS[agencia][moneda]
```

### **Sistema de Permisos Context**
```javascript
// ✅ BUENO: Usar UserProfileContext para permisos
import { useUserProfile } from '@/contexts/UserProfileContext'

const { 
  profile,
  role,
  isSuperAdmin,
  isAdmin,
  hasPermission,
  hasAnyPermission,
  allPermissions
} = useUserProfile()

// Renderizado condicional basado en permisos
{hasPermission('manage_users') && (
  <UserManagementButton />
)}
```

---

## 🚀 **Mejoras Futuras**

### **Pendiente Implementar**
- [ ] **Validación de inputs en Express**
- [ ] **Row Level Security (RLS) en Supabase**
- [ ] **Helper centralizado para WAHA API**
- [ ] **Sistema de logging profesional**
- [ ] **Tests unitarios y de integración**

---

## 📚 **Recursos Adicionales**

- **Documentación completa**: `ARCHITECTURE.md`
- **Contexto para IA**: `AI_CONTEXT.md`
- **Guía de instalación**: `docs/01-instalacion/`
- **Documentación del dashboard**: `dashboard/docs/`

---

## 🎯 **Recordatorio Importante**

**ESTE DOCUMENTO ESTÁ VIVO**: Se debe actualizar cuando se agreguen nuevas convenciones o patrones al proyecto.

Si tienes dudas sobre alguna regla, pregunta antes de implementar. Es mejor preguntar dos veces que corregir después.
