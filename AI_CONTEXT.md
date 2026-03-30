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
- **Framework**: Express.js
- **Base de Datos**: Supabase (Service Role Key)
- **HTTP Client**: Axios para llamadas a WAHA
- **Logging**: Morgan + console.error
- **WAHA Integration**: Requests directos (sin helper centralizado)
- **Servicios**: 24 servicios especializados
- **Rutas**: 22 rutas API centralizadas

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
// ✅ Roles reales: super_admin, admin, gerente, administracion, asesor, emisor
const { 
  profile, 
  role, 
  isSuperAdmin, 
  isAdmin, 
  isManager,
  isAdministracion,
  isAsesor,
  isEmisor,
  hasPermission,
  hasAnyPermission 
} = useUserProfile()

// ✅ Validación por rol
if (!isAdmin && !isManager) {
  return <div>No tienes permisos para acceder</div>
}

// ✅ Validación por permisos granulares (nuevo sistema)
if (!hasPermission('view_reports')) {
  return <div>No tienes permisos para ver reportes</div>
}

// ✅ Validación múltiple
if (!hasAnyPermission(['manage_users', 'view_users'])) {
  return <div>No tienes permisos para gestionar usuarios</div>
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
- `profiles` - Perfiles con roles
- `roles` - Definición de roles (super_admin, admin, gerente, administracion, asesor, emisor)
- `permissions` - Permisos granulares del sistema
- `role_permissions` - Permisos asignados a cada rol
- `user_permissions` - Permisos específicos de usuario (overrides)
- `workers` - Workers/Bots de WAHA
- `contacts` - Contactos de WhatsApp
- `chats` - Conversaciones
- `messages` - Mensajes
- `vuelos` - Sistema de vuelos
- `cotizaciones` - Cotizaciones de vuelos
- `cotizaciones_pasajeros` - Pasajeros de cotizaciones
- `agencias` - Gestión de agencias
- `sedes` - Gestión de sedes
- `equipos` - Equipos de trabajo
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

### **Escenario 3: Validar permisos granulares**
```javascript
// ❌ MALO: Solo validar por rol
if (role === 'admin') {
  // mostrar funcionalidad
}

// ✅ BUENO: Validar por permisos específicos
import { useUserProfile } from '@/contexts/UserProfileContext'

const { hasPermission, hasAnyPermission } = useUserProfile()

// Permiso único
if (hasPermission('manage_users')) {
  // mostrar funcionalidad de gestión de usuarios
}

// Múltiples permisos (OR)
if (hasAnyPermission(['edit_flights', 'view_flights'])) {
  // mostrar funcionalidad de vuelos
}
```

---

## 🎯 **MÓDULO DE COTIZADOR - PATRONES ESPECÍFICOS**

### **Cálculo Automático en Vista Múltiple** (detectado 2026-03-03)
El sistema de cotización tiene dos vistas: individual y múltiple pasajeros.

**Patrón de cálculo automático:**
```javascript
// ✅ useEffect que detecta cuándo debe calcular automáticamente
useEffect(() => {
  // Vista individual: requiere precioBase, feeEmision o feeAgencia
  const debeCalcularIndividual = vistaCotizacion === 'individual' && 
    (precioBase || feeEmision || feeAgencia) && monedaPrecio && monedaCotizacion

  // Vista múltiple: requiere al menos 1 pasajero configurado
  const debeCalcularMultiple = vistaCotizacion === 'multiple' && 
    tienePasajerosConfigurados() && monedaPrecio && monedaCotizacion

  if (debeCalcularIndividual || debeCalcularMultiple) {
    const timeoutId = setTimeout(() => {
      calcularCotizacion()
    }, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }
}, [vistaCotizacion, precioBase, feeEmision, feeAgencia, pasajeros, monedaPrecio, monedaCotizacion, metodoPago])
```

**Archivos:** `/components/cotizador/CotizadorForm.jsx`

### **Desglose de Pasajeros para Vista Múltiple** (detectado 2026-03-03)
Panel específico que muestra el desglose detallado de cada pasajero.

**Estructura del desglose:**
- Agrupa por categoría (Adultos, Niños, Infantes)
- Muestra cada pasajero individual con:
  - Precio Pantalla
  - Fee Emisión
  - Fee Agencia
  - Total por pasajero
  - Equipaje seleccionado
- Subtotal por categoría
- Total general con tasa de cambio y recargos

**Patrón de renderizado condicional:**
```javascript
// ✅ Renderizado diferenciado por vista
{vistaCotizacion === 'multiple' && tienePasajerosConfigurados() ? (
  <DesgloseMultiple pasajeros={pasajeros} />
) : desglose ? (
  <DesgloseIndividual desglose={desglose} />
) : vistaCotizacion === 'individual' ? (
  <MensajeVacio mensaje="Completa los campos para ver el desglose" />
) : (
  <MensajeVacio mensaje="Agrega pasajeros para ver el desglose" />
)}
```

**Archivos:** `/components/cotizador/CotizadorForm.jsx`

### **Gestión de PDF Multipágina** (actualizado 2026-03-03)
Generación de PDFs con múltiples páginas respetando márgenes.

**Configuración de márgenes:**
```javascript
// ✅ Márgenes aumentados para evitar cortes
const PDF_WIDTH = 210  // A4: 210mm
const PDF_HEIGHT = 297 // A4: 297mm
const MARGIN = 15      // 15mm de margen (aumentado desde 10mm)

const contentWidth = PDF_WIDTH - (MARGIN * 2)
const contentHeight = PDF_HEIGHT - (MARGIN * 2)
```

**Limitación conocida:** `html2canvas` convierte el DOM en una imagen única, por lo que `page-break-inside: avoid` solo funciona en impresión real del navegador, no en la generación del PDF.

**Archivos:** `/services/cotizador/pdfService.js`, `/components/cotizador/resultados/PdfContent.jsx`

### **Validación de Botón PDF por Vista** (detectado 2026-03-03)
Condiciones diferentes para habilitar el botón "Exportar PDF" según la vista.

**Patrón de validación:**
```javascript
// ✅ Validación condicional por tipo de vista
disabled={
  (vistaCotizacion === 'individual' && !desglose) || 
  (vistaCotizacion === 'multiple' && !tienePasajerosConfigurados()) || 
  exportingPdf
}
```

**Archivos:** `/components/cotizador/CotizadorForm.jsx`

### **Sistema de Permisos Granular** (detectado 2026-03-30)
Sistema completo de permisos basado en roles con override de permisos por usuario.

**Patrón de uso:**
```javascript
// ✅ Importar desde UserProfileContext
import { useUserProfile } from '@/contexts/UserProfileContext'

const { 
  hasPermission,      // Verificar un permiso específico
  hasAnyPermission,   // Verificar si tiene al menos uno
  hasAllPermissions,  // Verificar si tiene todos
  allPermissions,     // Array con todos los permisos del usuario
  getRoleRanking,     // Obtener ranking jerárquico del rol
  canManageRole       // Verificar si puede gestionar otro rol
} = useUserProfile()

// Verificación simple
if (hasPermission('manage_users')) {
  // mostrar gestión de usuarios
}

// Verificación múltiple (OR)
if (hasAnyPermission(['edit_flights', 'view_flights'])) {
  // mostrar sección de vuelos
}

// Verificación múltiple (AND)
if (hasAllPermissions(['manage_users', 'manage_roles'])) {
  // mostrar gestión completa
}
```

**Jerarquía de permisos:**
1. **Permisos del rol** (base)
2. **Permisos específicos del usuario** (agregados)
3. **Permisos revocados del usuario** (removidos)

**Archivos:** `/contexts/UserProfileContext.js`

### **APIs Centralizadas Completas** (actualizado 2026-03-30)
Todas las APIs del backend están centralizadas en `apiConfig.js` usando helper `buildApiUrl`.

**APIs disponibles:**
- `TASAS_API` - Gestión de tasas de cambio y monedas
- `COTIZACIONES_API` - Sistema de cotizaciones
- `VUELOS_API` - Gestión completa de vuelos
- `EQUIPOS_API` - Gestión de equipos de trabajo
- `RANKINGS_API` - Rankings globales
- `ANULABLES_API` - Gestión de anulables
- `AGENCIAS_API` - Gestión de agencias
- `SEDES_API` - Gestión de sedes
- `USERS_API` - Gestión de usuarios

**Patrón de uso:**
```javascript
import { VUELOS_API, AGENCIAS_API } from '@/config/apiConfig'

// Endpoints simples
const response = await fetch(VUELOS_API.listar)

// Endpoints con parámetros
const vueloResponse = await fetch(VUELOS_API.obtener(vueloId))

// Endpoints complejos
const agenciasUsuario = await fetch(AGENCIAS_API.agenciasUsuario(userId))
```

**Archivos:** `/config/apiConfig.js`

### **Helpers de Supabase** (detectado 2026-03-30)
Funciones helper avanzadas para interacción con Supabase.

**Funciones principales:**
```javascript
import { 
  handleAuthError,     // Manejo de errores de autenticación
  getValidSession,     // Obtener sesión válida o lanzar error
  getValidUser,        // Obtener usuario válido o lanzar error
  getAllWorkers,       // Workers con estadísticas
  getAllBots,          // Bots con estadísticas y filtros
  isBotExcluded        // Verificar si bot es de prueba
} from '@/lib/supabase'

// Validar sesión antes de operaciones críticas
try {
  const session = await getValidSession()
  // continuar operación
} catch (error) {
  // maneja error de sesión
}

// Obtener bots con estadísticas (excluye bots de prueba)
const bots = await getAllBots() // Incluye conversation_count, last_activity

// Verificar si un bot debe ser excluido
if (isBotExcluded(botName)) {
  // es bot de prueba (abraham, abrahama, paul, hernandez)
}
```

**Archivos:** `/lib/supabase.js`

### **Hooks del Cotizador** (detectado 2026-03-30)
Hooks especializados para el sistema de cotización.

**Hooks disponibles:**
- `useMonedas` - Gestión de monedas y tasas
- `usePasajeros` - Gestión de pasajeros en cotizaciones
- `useVistaCotizacion` - Cambio entre vista individual/múltiple
- `useCalculoCotizacion` - Lógica de cálculo de cotizaciones

**Ubicación:** `/hooks/cotizador/`

### **Configuraciones del Cotizador** (detectado 2026-03-30)
Archivos de configuración centralizados para el cotizador.

**Archivos principales:**
- `aerolineas.json` - Lista completa de aerolíneas
- `conversorInteligente.js` - Conversión inteligente de monedas
- `monedasConfig.js` - Configuración de monedas soportadas
- `passengerConfig.js` - Configuración de categorías de pasajeros
- `paymentConfig.js` - Métodos de pago por agencia y moneda
- `tasasHelpers.js` - Helpers para cálculo de tasas

**Patrón de uso:**
```javascript
import { PASSENGER_CATEGORIES } from '@/lib/cotizador/passengerConfig'
import { PAYMENT_METHODS } from '@/lib/cotizador/paymentConfig'
import { obtenerTasaActual } from '@/lib/cotizador/tasasHelpers'
```

**Ubicación:** `/lib/cotizador/`

---

## 🔄 **SISTEMA DE MANTENIMIENTO INTELIGENTE**

### **📊 Meta-datos del Contexto**
```yaml
meta:
  creado: "2026-02-24"
  ultima_revision_humana: "2026-02-24"
  ultima_actualizacion_ia: "2026-03-30"
  version_proyecto: "v1.1.0"
  patrones_documentados: "72"
  patrones_obsoletos: "0"
  ultima_validacion: "2026-03-30"
```

### **🤖 Tareas Automáticas (IA) - Cada Uso**
- ✅ **Detectar nuevos patrones** y agregarlos automáticamente
- ✅ **Actualizar ejemplos** con código real encontrado
- ✅ **Marcar uso reciente** de patrones existentes
- ✅ **Actualizar timestamp** de última actualización
- ✅ **Validar consistencia** básica

### **🔄 Tareas Semiautomáticas (IA) - Mensuales**
- 🔄 **Revisar patrones no usados** en último mes
- 🔄 **Marcar como "potencialmente obsoleto"** si no hay uso reciente
- 🔄 **Detectar contradicciones** entre secciones
- 🔄 **Generar reporte** de estado del contexto

### **👤 Tareas Humanas - Trimestrales**
- 📋 **Validar visión general** del proyecto
- 📋 **Eliminar información obsoleta** confirmada
- 📋 **Reestructurar secciones** si es necesario
- 📋 **Actualizar meta-datos** de versión

---

## 🧹 **REGLAS DE LIMPIEZA Y VALIDACIÓN**

### **⏰ Ciclo de Vida de Patrones**

| Estado | Duración | Acción |
|--------|----------|--------|
| **Activo** | Uso reciente | Mantener como está |
| **Potencialmente Obsoleto** | 3 meses sin uso | Marcar con advertencia |
| **Legacy** | 6 meses sin uso | Mover a sección "Legacy" |
| **Eliminado** | 9 meses sin uso | Eliminar del archivo |

### **🔍 Validación Automática**

**Antes de cada actualización, la IA debe verificar:**
```markdown
### ✅ Checklist de Validación:
- [ ] ¿El nuevo patrón tiene ejemplos de código real?
- [ ] ¿No contradice información existente?
- [ ] ¿Sigue las convenciones del proyecto?
- [ ] ¿Es relevante para el contexto actual?
- [ ] ¿Se actualizó el contador de patrones?
```

### **📈 Métricas de Salud del Contexto**

**Indicadores que la IA debe monitorear:**
- **Patrones activos vs obsoletos**: Mínimo 80% activos
- **Ejemplos por patrón**: Mínimo 1 ejemplo real
- **Actualizaciones mensuales**: Mínimo 2 actualizaciones/mes
- **Consistencia interna**: Cero contradicciones

---

## 🔄 **PROCESO DE ACTUALIZACIÓN ESTÁNDAR**

### **🤖 Para Agentes IA**

**Paso 1: Detectar Cambio**
```javascript
// La IA detecta un nuevo patrón
const nuevoPatron = {
  nombre: "useApiCache",
  tipo: "Hook personalizado",
  descripcion: "Cache para llamadas API",
  ejemplos: ["en /cotizador/CotizadorForm.jsx"]
}
```

**Paso 2: Validar y Documentar**
```markdown
### **Hooks Personalizados**
- **useApiCache**: Cache para llamadas API (detectado 2026-02-24)
  - Uso: Optimizar fetch repetitivos
  - Ejemplo: `const { data, loading } = useApiCache(url)`
  - Archivos: `/cotizador/CotizadorForm.jsx`
```

**Paso 3: Actualizar Meta-datos**
```yaml
ultima_actualizacion_ia: "2026-02-24"
patrones_documentados: 48
```

### **👤 Para Desarrolladores Humanos**

**Revisión Trimestral Estándar:**
1. **Leer reporte de IA** sobre estado del contexto
2. **Validar patrones marcados como obsoletos**
3. **Confirmar eliminación** de información irrelevante
4. **Actualizar visión general** si cambió el proyecto
5. **Firmar revisión** en meta-datos

---

## 🚨 **SISTEMA DE ALERTAS**

### **⚠️ Alertas Automáticas**

**La IA debe generar alertas cuando:**
- **Patrones obsoletos > 20%** del total
- **Sin actualizaciones por 30 días**
- **Contradicciones detectadas**
- **Ejemplos sin código real**

**Formato de alerta:**
```markdown
## 🚨 ALERTA DE MANTENIMIENTO - 2026-05-24

### Problemas Detectados:
- ⚠️ 15 patrones marcados como "potencialmente obsoletos"
- ⚠️ Sin actualizaciones en los últimos 45 días
- ⚠️ 3 contradicciones en sección de "Roles"

### Acciones Recomendadas:
- Revisar uso de patrones obsoletos
- Actualizar ejemplos con código reciente
- Validar consistencia de roles
```

---

## 📋 **REPORTES DE MANTENIMIENTO**

### **📊 Reporte Mensual Automático**

```markdown
## 📊 Reporte de Mantenimiento - Febrero 2026

### 📈 Estadísticas:
- **Patrones totales**: 48 (+3 este mes)
- **Patrones activos**: 45 (93.7%)
- **Patrones obsoletos**: 3 (6.3%)
- **Actualizaciones**: 7 este mes

### 🔄 Cambios Este Mes:
- ✅ Nuevo: `useApiCache` hook
- ✅ Actualizado: Ejemplos de fetch con manejo de errores
- ✅ Obsoleto: `formatDateLegacy` (reemplazado)

### 🎯 Salud del Contexto: ✅ EXCELENTE
```

---

## 🔄 **CÓMPLICAMENTE DEL MANTENIMIENTO**

### **🤖 Responsabilidades de la IA**
1. **Mantener contexto actualizado** con patrones reales
2. **Validar calidad** de la información
3. **Generar alertas** cuando sea necesario
4. **Optimizar estructura** para legibilidad

### **👤 Responsabilidades Humanas**
1. **Revisión trimestral** del estado general
2. **Decisión final** sobre eliminación de contenido
3. **Actualización estratégica** de visión del proyecto
4. **Validación de cambios** importantes

### **🎯 Objetivo a Largo Plazo**
- **8 meses**: 85-95% de información relevante
- **12 meses**: 75-85% de información relevante
- **18 meses**: 65-75% de información relevante

---

## 🔄 **CÓMO MANTENER ESTE ARCHIVO ACTUALIZADO**

### **Para Agentes de IA**
Si durante el desarrollo encuentras:
- **Nuevos patrones**: Agrega aquí con fecha y ejemplos
- **Cambios en arquitectura**: Actualiza secciones y meta-datos
- **Patrones sin uso**: Marcar como potencialmente obsoleto
- **Contradicciones**: Generar alerta para revisión humana

### **Para Desarrolladores Humanos**
- **Revisar reportes mensuales** de mantenimiento
- **Validar cambios trimestrales**
- **Actualizar visión general** cuando el proyecto evolucione
- **Firmar revisiones** en meta-datos

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
