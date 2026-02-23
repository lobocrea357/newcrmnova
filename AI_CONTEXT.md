# 🧠 AI_CONTEXT.md - Guía para Agentes de IA

## 🎯 **PROPÓSITO DE ESTE ARCHIVO**

Este es el archivo más importante para cualquier agente de IA o modelo que trabaje en este proyecto. Contiene toda la información contextual necesaria para tomar decisiones técnicas correctas y evitar errores comunes.

**LEE ESTE ARCHIVO COMPLETO ANTES DE ESCRIBIR CUALQUIER CÓDIGO**

---

## 🏗️ **QUÉ ES EL PROYECTO**

### **Descripción General**
CRM interno para gestión de bots de WhatsApp con análisis de conversaciones mediante IA, sistema de cotización de vuelos, y gestión de rendimiento de asesores.

### **Arquitectura Principal**
- **Frontend**: Next.js 16 (Dashboard en puerto 3001)
- **Backend**: Express.js (API en puerto 4000)
- **WhatsApp**: WAHA Plus (API en puerto 3000)
- **Base de Datos**: Supabase (PostgreSQL)
- **Contenerización**: Docker con red interna

### **Flujo de Datos Clave**
```
Dashboard ↔ Supabase (acceso directo para lecturas/escrituras)
WAHA → Express → Supabase (webhooks de mensajes)
Dashboard → Supabase Storage (subida directa de archivos)
```

---

## 🔧 **STACK TECNOLÓGICO**

### **Frontend (Dashboard)**
- **Framework**: Next.js 16 con App Router
- **UI**: Tailwind CSS + Lucide React
- **Estado**: React Hooks + Context API
- **Notificaciones**: SweetAlert2 (confirmaciones) + react-hot-toast (info)
- **PDF**: jsPDF + html2canvas-pro
- **Gráficos**: Recharts
- **Automatización**: node-cron + Puppeteer
- **IA**: OpenAI SDK para análisis de conversaciones

### **Backend (Express)**
- **Runtime**: Node.js con ES Modules
- **Base de Datos**: Supabase (Service Role Key)
- **HTTP Client**: Axios
- **Logging**: Morgan + console.error
- **WAHA Integration**: Requests directos (sin helper centralizado aún)

### **Base de Datos (Supabase)**
- **Motor**: PostgreSQL
- **Auth**: Supabase Auth con roles personalizados
- **Storage**: Para archivos multimedia
- **Realtime**: Para actualizaciones en vivo
- **RLS**: NO implementado aún (pendiente)

---

## 🚫 **COSAS QUE NUNCA DEBES HACER**

### **Prohibiciones Absolutas**
- ❌ **NO usar TypeScript** (proyecto es JavaScript puro)
- ❌ **NO usar Server Actions de Next.js** (depende del caso, preguntar)
- ❌ **NO acceder a variables de entorno desde el cliente sin `NEXT_PUBLIC_`**
- ❌ **NO hardcodear URLs de producción**
- ❌ **NO usar `any` en validaciones**
- ❌ **NO mutar estado directamente sin `setState`**
- ❌ **NO hacer fetch en cada render sin debounce**

### **Errores Comunes a Evitar**
- ❌ **NO crear código duplicado** - SIEMPRE revisa si ya existe
- ❌ **NO reescribir componentes completos** sin confirmar primero
- ❌ **NO cambiar nombres de funciones existentes** sin motivo válido
- ❌ **NO eliminar logs de debugging** sin preguntar
- ❌ **NO confiar 100% en datos del cliente** (validación backend pendiente)

---

## ✅ **CÓMO SE TOMAN DECISIONES TÉCNICAS**

### **Decisiones de Arquitectura**
1. **Dashboard accede directamente a Supabase** para lecturas y escrituras
2. **Express solo maneja webhooks de WAHA** y APIs específicas
3. **Archivos se suben directamente a Supabase Storage** desde el dashboard
4. **Roles se validan solo en frontend** (backend pendiente)
5. **Endpoints se centralizan en apiConfig.js** (parcialmente implementado)

### **Cuándo Usar Cada Patrón**
- **Context API**: Para estado global de la app (usuario, tema, config)
- **Prop Drilling**: Para datos específicos de componente
- **Supabase Realtime**: Para datos colaborativos (mensajes, estados)
- **Hooks Personalizados**: Cuando la lógica se repite 2+ veces
- **useReducer**: Para lógica compleja de estado

---

## 📁 **DÓNDE VA CADA COSA**

### **Frontend (Dashboard)**
```
dashboard/src/
├── app/              # App Router - Páginas y layouts
├── components/       # Componentes UI reutilizables
├── hooks/           # Hooks personalizados (useAuth, useBots, etc.)
├── lib/             # Utilidades, helpers, servicios
├── contexts/        # Context API para estado global
├── config/          # Configuración centralizada (apiConfig.js)
└── services/        # Lógica de negocio (futuro refactor)
```

### **Backend (Express)**
```
src/
├── config/          # Configuración de servicios (supabase.js, waha.js)
├── routes/          # Definición de rutas API
├── services/        # Lógica de negocio (MessageService, etc.)
├── scripts/         # Scripts de mantenimiento
└── utils/           # Utilidades compartidas
```

---

## 🔍 **REGLA DE ORO: ANTES DE ESCRIBIR CÓDIGO**

### **PASO 1: REVISAR SI YA EXISTE**
Antes de crear cualquier función, componente, o utilidad:

```bash
# Buscar en todo el proyecto
grep -r "nombreDeFuncionQueQuieresCrear" dashboard/src/
grep -r "formatDate" dashboard/src/lib/
grep -r "useAuth" dashboard/src/hooks/
```

**Lugares específicos que revisar:**
- `dashboard/src/lib/` - Utilidades y helpers
- `dashboard/src/hooks/` - Hooks personalizados
- `dashboard/src/components/` - Componentes UI
- `dashboard/src/config/` - Configuración
- `src/services/` - Servicios del backend

### **PASO 2: VERIFICAR ENDPOINTS**
```javascript
// Revisar apiConfig.js antes de hardcodear URLs
import { TASAS_API } from '@/config/apiConfig'
```

### **PASO 3: REVISAR PATRONES EXISTENTES**
- Busca componentes similares en `dashboard/src/components/`
- Revisa hooks existentes en `dashboard/src/hooks/`
- Verifica servicios similares en `src/services/`

---

## 🎯 **PATRONES ESPECÍFICOS DEL PROYECTO**

### **Manejo de Fetch de Datos**
```javascript
// ✅ SIEMPRE usar este patrón
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching data:', error)
    toast.error('Error al cargar datos')
    throw error
  }
}
```

### **Manejo de Archivos**
```javascript
// ✅ SIEMPRE validar tamaño y tipo
import { validateFileSize, ALLOWED_FILE_TYPES } from '@/lib/utils/vuelos-storage'

const MAX_FILE_SIZE_MB = 10

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
// ✅ SweetAlert2 para decisiones críticas
const result = await Swal.fire({
  title: '¿Estás seguro?',
  text: 'Esta acción no se puede deshacer',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sí, eliminar'
})

// ✅ Toast para notificaciones informativas
toast.success('Operación completada')
toast.error('Error en la operación')
```

### **Roles y Permisos**
```javascript
// ✅ Roles reales: admin, gerente, administracion, asesor
const { profile, role, isAdmin, isManager } = useUserProfile()

// ✅ Validación en vistas
if (!isAdmin && !isManager) {
  return <div>No tienes permisos para acceder</div>
}
```

---

## 🔧 **CONVENCIONES DE NOMBRES**

### **Frontend**
- **Componentes**: PascalCase (`UserProfile.js`)
- **Páginas**: kebab-case (`user-profile/page.js`)
- **Hooks**: camelCase (`useAuth.js`)
- **Utils**: camelCase o kebab-case (`formatDate.js`)
- **Config**: kebab-case (`api-config.js`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE_MB`)

### **Backend**
- **Servicios**: PascalCase (`MessageService.js`)
- **Rutas**: camelCase (`messages.js`)
- **Config**: kebab-case (`supabase.js`)
- **Constantes**: UPPER_SNAKE_CASE (`DATABASE_URL`)

---

## 🚨 **SITUACIONES ESPECIALES**

### **Cuándo Preguntar**
- Si vas a cambiar una arquitectura existente
- Si necesitas crear un nuevo servicio de backend
- Si vas a modificar la estructura de la base de datos
- Si no encuentras un patrón existente para algo que necesitas

### **Cuándo Decidir por Ti Mismo**
- Para componentes UI simples
- Para utilidades de formateo
- Para hooks de lógica repetitiva
- Para validaciones de frontend

### **Características Pendientes**
Estas cosas están planeadas pero no implementadas:
- Validación de inputs en Express
- Row Level Security (RLS) en Supabase
- Helper centralizado para WAHA API
- Sistema de logging profesional
- Tests unitarios

---

## 🔄 **ESTADO ACTUAL DEL PROYECTO**

### **✅ Implementado y Funcional**
- Autenticación con Supabase Auth
- Dashboard con acceso directo a Supabase
- Sistema de roles (validación frontend)
- Análisis de conversaciones con IA
- Sistema de vuelos y cotizaciones
- Manejo de archivos multimedia
- Reportes de rendimiento

### **❌ Pendiente de Implementar**
- Validación de roles en backend
- RLS en Supabase
- Validación de inputs en Express
- Helper centralizado para WAHA
- Sistema de logging profesional
- Tests automatizados

---

## 📊 **INFORMACIÓN CRÍTICA DE BASE DE DATOS**

### **Tablas Principales**
- `users` - Usuarios del sistema
- `profiles` - Perfiles con roles (admin, gerente, administracion, asesor)
- `workers` - Workers/Bots de WAHA (todos en un solo worker actualmente)
- `contacts` - Contactos de WhatsApp
- `chats` - Conversaciones
- `messages` - Mensajes
- `vuelos` - Sistema de vuelos
- `conversation_evaluations` - Evaluaciones de IA
- `performance_analyses` - Análisis de rendimiento

### **Storage Buckets**
- `whatsapp/` - Archivos multimedia de WhatsApp
- `vuelos-adjuntos/` - Adjuntos de vuelos

---

## 🎯 **EJEMPLOS PRÁCTICOS**

### **Escenario 1: Crear una nueva vista de reportes**
```javascript
// ❌ MALO: Crear desde cero sin revisar
function ReportView() {
  const [data, setData] = useState([])
  // ... lógica duplicada de fetch
  
  // Formato de fechas duplicado
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }
}

// ✅ BUENO: Revisar y reutilizar
import { useFetch } from '@/hooks/useFetch'
import { formatDate } from '@/lib/utils/date-utils'
import ReportTable from '@/components/ReportTable'

function ReportView() {
  const { data, loading, error } = useFetch('/api/reports')
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return <ReportTable data={data} />
}
```

### **Escenario 2: Agregar nuevo endpoint**
```javascript
// ❌ MALO: Hardcodear URL
fetch('http://localhost:4000/api/nuevo-endpoint', options)

// ✅ BUENO: Centralizar en apiConfig.js
// En apiConfig.js:
export const NUEVO_API = {
  listar: buildApiUrl('/api/nuevo-endpoint'),
  crear: buildApiUrl('/api/nuevo-endpoint/crear')
}

// En componente:
import { NUEVO_API } from '@/config/apiConfig'
fetch(NUEVO_API.listar, options)
```

---

## 🔄 **CÓMO MANTENER ESTE ARCHIVO ACTUALIZADO**

### **Para Agentes de IA**
Si durante el desarrollo encuentras:
- **Nuevos patrones**: Agrega aquí
- **Cambios en arquitectura**: Actualiza las secciones correspondientes
- **Nuevas prohibiciones**: Agrega a la sección de "Cosas que nunca hacer"
- **Errores comunes**: Agrega a la sección de "Errores comunes a evitar"

### **Para Desarrolladores Humanos**
- Revisa este archivo periódicamente
- Actualízalo cuando hagas cambios significativos
- Usa este archivo como referencia en code reviews

---

## 🚀 **CHECKLIST ANTES DE ESCRIBIR CÓDIGO**

### **✅ Verificación Rápida**
- [ ] ¿Leí este archivo completo?
- [ ] ¿Revisé si ya existe código similar?
- [ ] ¿Entiendo la arquitectura del proyecto?
- [ ] ¿Sé qué patrón usar para mi caso?
- [ ] ¿Conozco las prohibiciones del proyecto?

### **✅ Durante el Desarrollo**
- [ ] ¿Estoy siguiendo las convenciones de nombres?
- [ ] ¿Manejo todos los errores posibles?
- [ ] ¿Uso los endpoints centralizados?
- [ ] ¿Valido inputs del usuario?
- [ ] ¿No estoy duplicando lógica existente?

---

## 📞 **EN CASO DE DUDA**

Si después de leer este archivo todavía tienes dudas:

1. **Revisa los archivos existentes** buscando patrones similares
2. **Consulta la documentación adicional** (`ARCHITECTURE.md`, `CODE_RULES.md`)
3. **Pregunta específicamente** sobre el caso que no entiendes
4. **Propón soluciones** basadas en los patrones existentes

**RECUERDA**: Es mejor preguntar dos veces que cometer un error que requiera corrección posterior.

---

## 🎯 **CONCLUSIÓN**

Este archivo es tu guía para trabajar eficientemente en este proyecto. Sigue estas reglas, revisa siempre el código existente, y tendrás un desarrollo productivo y sin errores comunes.

**EL ÉXITO EN ESTE PROYECTO DEPENDE DE SEGUIR ESTE CONTEXTO**
