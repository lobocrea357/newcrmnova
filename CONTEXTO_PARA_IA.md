# 🤖 Contexto Completo del Proyecto - CRM Nova

> **Documento para Asistentes de IA**  
> Este archivo contiene todo el contexto necesario para que cualquier asistente de IA (ChatGPT, Gemini, Claude, Kimi, etc.) pueda trabajar eficientemente en este proyecto.

---

## 📋 ÍNDICE RÁPIDO

1. [Qué es el Proyecto](#-qué-es-el-proyecto)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Reglas Críticas](#-reglas-críticas-prohibiciones-absolutas)
5. [Estructura de Carpetas](#-estructura-de-carpetas)
6. [Base de Datos](#-base-de-datos)
7. [Sistema de Roles y Permisos](#-sistema-de-roles-y-permisos)
8. [Patrones de Código](#-patrones-de-código-obligatorios)
9. [Convenciones de Nombres](#-convenciones-de-nombres)
10. [APIs Centralizadas](#-apis-centralizadas)
11. [Flujo de Trabajo](#-flujo-de-trabajo-antes-de-codear)
12. [Estado Actual](#-estado-actual-del-proyecto)

---

## 🎯 QUÉ ES EL PROYECTO

### Descripción
**CRM Nova** es un sistema CRM interno para gestión de ventas de vuelos con:
- Sistema de cotizaciones y vuelos completo
- Ranking en tiempo real de asesores y equipos
- Gestión de equipos, roles y permisos granulares
- Integración con WhatsApp mediante WAHA Plus (módulo complementario)
- Análisis de rendimiento y reportes

### Componentes Principales
```
┌─────────────────┐
│   Dashboard     │  Puerto 3001 - Next.js Frontend
│   (Frontend)    │  Acceso DIRECTO a Supabase
└────────┬────────┘
         │
         │ API Calls + Acceso Directo Supabase
         │
┌────────▼────────┐
│   Express API   │  Puerto 4000 - Backend Node.js
│   (Backend)     │  Webhooks + APIs específicas
└────────┬────────┘
         │
         │ SQL + Storage
         │
┌────────▼────────┐
│    Supabase     │  Base de Datos PostgreSQL
│   (Database)    │  + Storage + Realtime
└─────────────────┘
```

### Módulos Implementados
- ✅ **Autenticación y Usuarios** - Supabase Auth
- ✅ **Gestión de Roles y Permisos** - Sistema granular completo
- ✅ **Equipos y Gerentes** - Organización jerárquica
- ✅ **Cotizaciones** - Vista individual y múltiple, pasajeros
- ✅ **Vuelos** - CRUD completo, estados, confirmación de pago, emisión
- ✅ **Ranking** - Tiempo real con 4 vistas (General, Asesores, Gerentes, Equipos)
- ✅ **Multi-moneda** - Conversión USD ↔ EUR automática
- 🔄 **WhatsApp** - Integración WAHA (módulo complementario)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Flujo de Datos Crítico

**1. Dashboard accede DIRECTAMENTE a Supabase**
```javascript
// ✅ Dashboard consulta y escribe directo en Supabase
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('vuelos')
  .select('*')
  .eq('estado', 'EMITIDO')
```

**2. Express solo maneja APIs específicas**
```javascript
// ✅ Express para webhooks y operaciones especializadas
router.post('/api/vuelos', async (req, res) => {
  // Lógica de negocio
  const vuelo = await vuelosService.crearVuelo(data)
  res.json({ success: true, data: vuelo })
})
```

**3. Archivos suben DIRECTAMENTE a Supabase Storage**
```javascript
// ✅ Upload directo desde Dashboard
const { data, error } = await supabase.storage
  .from('vuelos-adjuntos')
  .upload(filePath, file)
```

### Decisiones Arquitectónicas Importantes

| Decisión | Razón | Implementación |
|----------|-------|----------------|
| Dashboard → Supabase directo | Velocidad y simplicidad | ✅ Implementado |
| Express → Solo APIs específicas | Separación de responsabilidades | ✅ Implementado |
| Validación de roles en frontend | Pendiente backend | ⚠️ Solo frontend |
| RLS en Supabase | Seguridad a nivel DB | ❌ Pendiente |

---

## 🔧 STACK TECNOLÓGICO

### Frontend (Dashboard - Puerto 3001)
```javascript
{
  "framework": "Next.js 16 (App Router)",
  "ui": "Tailwind CSS + Lucide React",
  "estado": "React Hooks + Context API",
  "notificaciones": {
    "criticas": "SweetAlert2",  // Confirmaciones
    "informativas": "react-hot-toast"  // Toasts
  },
  "pdf": "jsPDF + html2canvas-pro",
  "graficos": "Recharts",
  "lenguaje": "JavaScript (NO TypeScript)"
}
```

### Backend (Express - Puerto 4000)
```javascript
{
  "runtime": "Node.js con ES Modules",
  "framework": "Express.js",
  "database": "Supabase (PostgreSQL)",
  "httpClient": "Axios",
  "lenguaje": "JavaScript (NO TypeScript)"
}
```

### Base de Datos
```javascript
{
  "motor": "PostgreSQL (Supabase)",
  "auth": "Supabase Auth + JWT",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime Subscriptions",
  "rls": "NO implementado (pendiente)"
}
```

---

## 🚫 REGLAS CRÍTICAS (PROHIBICIONES ABSOLUTAS)

### ❌ NUNCA HACER

1. **NO usar TypeScript** - Proyecto es JavaScript puro
2. **NO usar Server Actions de Next.js** - Solo en casos específicos
3. **NO hardcodear URLs** - Usar `apiConfig.js`
4. **NO acceder a variables de entorno desde cliente sin `NEXT_PUBLIC_`**
5. **NO crear código duplicado** - SIEMPRE revisar si ya existe
6. **NO reescribir componentes completos** - Solo editar lo necesario
7. **NO eliminar logs de debugging** sin preguntar
8. **NO hacer fetch en cada render** - Usar debounce
9. **NO mutar estado directamente** - Siempre usar `setState`
10. **NO confiar 100% en datos del cliente** - Validación pendiente

### ⚠️ REGLA DE ORO

**ANTES de escribir CUALQUIER código:**
```bash
# 1. Buscar si ya existe
grep -r "nombreFuncion" dashboard/src/lib/
grep -r "useHook" dashboard/src/hooks/
grep -r "Componente" dashboard/src/components/

# 2. Revisar endpoints centralizados
# Ver: dashboard/src/config/apiConfig.js

# 3. Verificar patrones existentes
# Ver: dashboard/src/components/, src/services/
```

---

## 📁 ESTRUCTURA DE CARPETAS

### Frontend (Dashboard)
```
dashboard/src/
├── app/                    # Next.js App Router (40+ rutas)
│   ├── (auth)/            # Rutas de autenticación
│   ├── (crm)/             # Rutas principales del CRM
│   └── api/               # API Routes (si las hay)
│
├── components/            # Componentes UI (60+ componentes)
│   ├── cotizador/         # Sistema de cotizaciones (12 items)
│   │   ├── CotizadorForm.jsx
│   │   ├── CotizadorTutorial.jsx
│   │   ├── pasajeros/PasajerosManager.jsx
│   │   └── resultados/
│   ├── vuelos/            # Gestión de vuelos (8 items)
│   │   ├── VuelosList.jsx
│   │   ├── VueloForm.jsx
│   │   └── VuelosStats.jsx
│   ├── ranking/           # Ranking de ventas
│   │   └── RankingGlobal.jsx
│   ├── permissions/       # Sistema de permisos (4 items)
│   └── rendimiento/       # Análisis de rendimiento (16 items)
│
├── hooks/                 # Hooks personalizados (9 hooks)
│   ├── useAuth.js
│   ├── useUserProfile.js
│   └── cotizador/         # Hooks del cotizador (4 items)
│       ├── useMonedas.js
│       ├── usePasajeros.js
│       ├── useVistaCotizacion.js
│       └── useCalculoCotizacion.js
│
├── lib/                   # Utilidades y helpers (25+ archivos)
│   ├── supabase.js        # Cliente Supabase + helpers
│   ├── utils/             # Utilidades generales
│   └── cotizador/         # Configuraciones del cotizador (6 archivos)
│       ├── aerolineas.json
│       ├── conversorInteligente.js
│       ├── monedasConfig.js
│       ├── passengerConfig.js
│       ├── paymentConfig.js
│       └── tasasHelpers.js
│
├── contexts/              # Context API (3 contextos)
│   ├── UserProfileContext.js   # Permisos y roles
│   ├── RankingContext.js       # Ranking global
│   └── ThemeContext.js         # Tema (si existe)
│
└── config/
    └── apiConfig.js       # ⭐ ENDPOINTS CENTRALIZADOS
```

### Backend (Express)
```
src/
├── config/               # Configuración
│   ├── supabase.js      # Cliente Supabase (Service Role)
│   └── waha.js          # Configuración WAHA (si aplica)
│
├── routes/              # Rutas API (22 archivos)
│   ├── cotizaciones.js  # POST, GET, PUT, DELETE, PATCH
│   ├── vuelos.js        # CRUD + confirmar-pago + marcar-emitido
│   ├── rankings.js      # GET /global?moneda=USD|EUR
│   ├── tasas.js         # Gestión de tasas de cambio
│   ├── equipos.js       # Gestión de equipos
│   ├── users.js         # Gestión de usuarios
│   └── ...
│
├── services/            # Lógica de negocio (24 servicios)
│   ├── cotizacionesService.js
│   ├── vuelosService.js
│   ├── userService.js
│   └── ...
│
└── utils/               # Utilidades compartidas
```

---

## 🗄️ BASE DE DATOS

### Tablas Principales

#### Usuarios y Permisos
```sql
users                    -- Usuarios Supabase Auth
profiles                 -- Perfiles con roles y equipos
roles                    -- Definición de roles (6 roles)
permissions              -- Permisos granulares (40+ permisos)
role_permissions         -- Permisos por rol
user_permissions         -- Overrides de permisos por usuario
```

#### Vuelos y Cotizaciones
```sql
cotizaciones             -- Sistema de cotizaciones
  ├── id (UUID, PK)
  ├── created_by (UUID, FK → profiles)
  ├── nombre_cliente (VARCHAR)
  ├── tipo_vuelo (VARCHAR: ida, ida_vuelta, multiple)
  ├── origen, destino (VARCHAR)
  ├── fecha_salida, fecha_regreso (DATE)
  ├── estado (VARCHAR: EN_REVISION, APROBADA, RECHAZADA)
  ├── moneda_precio, moneda_cotizacion (VARCHAR: USD, EUR)
  └── precio_final_cotizacion (NUMERIC)

cotizaciones_pasajeros   -- Pasajeros de cotizaciones
  ├── id (UUID, PK)
  ├── cotizacion_id (UUID, FK → cotizaciones)
  ├── tipo (VARCHAR: ADT, CHD, INF)
  ├── precio_pantalla, fee_emision, fee_agencia (NUMERIC)
  └── equipaje_completo, equipaje_mediano, equipaje_ligero (BOOLEAN)

vuelos                   -- Sistema de vuelos
  ├── id (UUID, PK)
  ├── created_by (UUID, FK → profiles)
  ├── cotizacion_id (UUID, FK → cotizaciones, NULLABLE)
  ├── pax_nombre (VARCHAR)
  ├── tipo_vuelo (VARCHAR)
  ├── ruta (VARCHAR)
  ├── fecha_vuelo (DATE)
  ├── estado (VARCHAR: PENDIENTE_CONFIRMACION_PAGO, 
  │            PENDIENTE_EMISION, EMITIDO, CANCELADO)
  ├── monto_venta (NUMERIC)
  ├── total_cotizacion (NUMERIC)
  ├── moneda_precio (VARCHAR: USD, EUR)
  ├── pago_confirmado_por, pago_confirmado_at (UUID, TIMESTAMP)
  ├── emitido_por, emitido_at (UUID, TIMESTAMP)
  └── ediciones_disponibles (INTEGER, DEFAULT 3)

vuelos_pasajeros         -- Pasajeros de vuelos
vuelos_adjuntos          -- Adjuntos (PDFs, imágenes)
```

#### Organización
```sql
equipos                  -- Equipos de trabajo
  ├── id (UUID, PK)
  ├── nombre (VARCHAR)
  ├── gerente_id (UUID, FK → profiles)
  ├── color (VARCHAR)
  └── is_active (BOOLEAN)

agencias                 -- Agencias de viajes
sedes                    -- Sedes de la empresa
```

#### Multi-moneda
```sql
monedas                  -- USD, EUR, etc.
  ├── id (UUID, PK)
  ├── codigo (VARCHAR: USD, EUR)
  ├── nombre (VARCHAR)
  └── simbolo (VARCHAR: $, €)

tasas_conversion         -- Tasas de cambio
  ├── id (UUID, PK)
  ├── moneda_origen_id (UUID, FK → monedas)
  ├── moneda_destino_id (UUID, FK → monedas)
  ├── tasa (NUMERIC)
  ├── activa (BOOLEAN)
  └── fecha_actualizacion (TIMESTAMP)
```

### Storage Buckets
```
vuelos-adjuntos/         -- PDFs, imágenes de vuelos
  ├── Límite: 10MB por archivo
  ├── Tipos permitidos: PDF, PNG, JPG, JPEG
  └── Estructura: {vueloId}/{filename}

whatsapp/                -- Archivos multimedia de WhatsApp (si aplica)
```

### Índices Importantes
```sql
-- Vuelos
CREATE INDEX idx_vuelos_created_by ON vuelos(created_by);
CREATE INDEX idx_vuelos_estado ON vuelos(estado);
CREATE INDEX idx_vuelos_fecha_vuelo ON vuelos(fecha_vuelo);

-- Cotizaciones
CREATE INDEX idx_cotizaciones_created_by ON cotizaciones(created_by);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);

-- Pasajeros
CREATE INDEX idx_vuelos_pasajeros_vuelo_id ON vuelos_pasajeros(vuelo_id);
CREATE INDEX idx_cotizaciones_pasajeros_cotizacion_id ON cotizaciones_pasajeros(cotizacion_id);
```

---

## 🔐 SISTEMA DE ROLES Y PERMISOS

### Roles del Sistema

| Rol | Ranking | Descripción |
|-----|---------|-------------|
| **super_admin** | 100 | Acceso total sin restricciones |
| **admin** | 90 | Acceso completo a todas las funcionalidades |
| **gerente** | 70 | Gestión de equipos y bots asignados |
| **administracion** | 60 | Funciones administrativas (vuelos, cotizaciones) |
| **emisor** | 50 | Emisión especializada de boletos |
| **asesor** | 30 | Acceso básico de consulta y ventas |

### Sistema de Permisos Granular

**Jerarquía de permisos:**
1. **Permisos del rol** (base desde `role_permissions`)
2. **Permisos agregados al usuario** (`user_permissions` con `granted=true`)
3. **Permisos revocados del usuario** (`user_permissions` con `granted=false`)

**Uso en el código:**
```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'

const { 
  hasPermission,         // Verificar un permiso
  hasAnyPermission,      // Verificar al menos uno (OR)
  hasAllPermissions,     // Verificar todos (AND)
  isAdmin,               // Helper por rol
  isSuperAdmin,
  isManager,
  canManageRole          // Validar jerarquía
} = useUserProfile()

// Validación simple
if (hasPermission('manage_users')) {
  // mostrar gestión de usuarios
}

// Validación múltiple (OR)
if (hasAnyPermission(['edit_flights', 'view_flights'])) {
  // mostrar vuelos
}

// Validación de jerarquía
if (canManageRole('asesor')) {
  // puede gestionar asesores
}
```

### Permisos Disponibles (Ejemplos)
```
- manage_users           - Gestionar usuarios
- view_users             - Ver usuarios
- manage_roles           - Gestionar roles
- manage_permissions     - Gestionar permisos
- view_reports           - Ver reportes
- manage_flights         - Gestionar vuelos
- edit_flights           - Editar vuelos
- view_flights           - Ver vuelos
- manage_quotations      - Gestionar cotizaciones
- view_rankings          - Ver rankings
- manage_teams           - Gestionar equipos
- ...40+ permisos más
```

---

## 💻 PATRONES DE CÓDIGO OBLIGATORIOS

### 1. Fetch de Datos con Manejo de Errores
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

// ❌ MALO: Sin manejo de errores
const data = await fetch(url).then(r => r.json())
```

### 2. Notificaciones
```javascript
// ✅ SweetAlert2 para decisiones críticas
const result = await Swal.fire({
  title: '¿Estás seguro?',
  text: 'Esta acción no se puede deshacer',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sí, eliminar',
  cancelButtonText: 'Cancelar'
})

if (result.isConfirmed) {
  // ejecutar acción
}

// ✅ Toast para notificaciones informativas
toast.success('Operación completada')
toast.error('Error en la operación')
toast.loading('Procesando...')
```

### 3. Validación de Archivos
```javascript
// ✅ SIEMPRE validar tamaño y tipo
import { validateFileSize, ALLOWED_FILE_TYPES } from '@/lib/utils/vuelos-storage'

const MAX_FILE_SIZE_MB = 10

// Validar tamaño
if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
  toast.error(`El archivo no debe superar ${MAX_FILE_SIZE_MB}MB`)
  return
}

// Validar tipo
if (!ALLOWED_FILE_TYPES.pdf.includes(file.type)) {
  toast.error('Solo se permiten archivos PDF')
  return
}
```

### 4. Endpoints Centralizados
```javascript
// ✅ BUENO: Usar apiConfig.js
import { VUELOS_API, COTIZACIONES_API, TASAS_API } from '@/config/apiConfig'

// Endpoints simples
await fetch(VUELOS_API.listar)

// Endpoints con parámetros
await fetch(VUELOS_API.obtener(vueloId))

// Endpoints complejos
await fetch(VUELOS_API.confirmarPago(vueloId), {
  method: 'PATCH',
  body: JSON.stringify({ userId })
})

// ❌ MALO: Hardcodear URLs
await fetch('http://localhost:4000/api/vuelos')
```

### 5. Loading States
```javascript
// ✅ Skeleton loaders para listas
{loading ? (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
) : (
  <DataList data={data} />
)}

// ✅ Spinner para acciones rápidas
{loading ? (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
) : (
  <Button>Guardar</Button>
)}
```

### 6. Acceso a Supabase
```javascript
// ✅ Usar helpers de autenticación
import { getValidSession, getValidUser, handleAuthError } from '@/lib/supabase'

try {
  const session = await getValidSession()
  const user = await getValidUser()
  
  // Operación con Supabase
  const { data, error } = await supabase
    .from('vuelos')
    .select('*')
  
  if (error) throw error
  return data
} catch (error) {
  await handleAuthError(error)
}
```

---

## 📝 CONVENCIONES DE NOMBRES

### Frontend
| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Componentes | **PascalCase** | `UserProfile.jsx`, `VuelosList.jsx` |
| Páginas | **kebab-case** | `user-profile/page.js` |
| Hooks | **camelCase** | `useAuth.js`, `useUserProfile.js` |
| Utils | **camelCase/kebab-case** | `formatDate.js`, `date-utils.js` |
| Constantes | **UPPER_SNAKE_CASE** | `MAX_FILE_SIZE_MB`, `API_BASE_URL` |

### Backend
| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Servicios | **PascalCase** | `VuelosService.js` |
| Rutas | **camelCase** | `vuelos.js`, `cotizaciones.js` |
| Constantes | **UPPER_SNAKE_CASE** | `DATABASE_URL` |

---

## 🔌 APIS CENTRALIZADAS

### Todas las APIs están en `dashboard/src/config/apiConfig.js`

```javascript
// Importar APIs
import { 
  TASAS_API,
  COTIZACIONES_API,
  VUELOS_API,
  EQUIPOS_API,
  RANKINGS_API,
  ANULABLES_API,
  AGENCIAS_API,
  SEDES_API,
  USERS_API
} from '@/config/apiConfig'

// Uso de endpoints
fetch(TASAS_API.crear, { method: 'POST', body: ... })
fetch(VUELOS_API.obtener(vueloId))
fetch(VUELOS_API.confirmarPago(vueloId), { method: 'PATCH', ... })
fetch(RANKINGS_API.global) // GET /api/rankings/global?moneda=USD
```

### Estructura de APIs
```javascript
export const VUELOS_API = {
  listar: buildApiUrl('/api/vuelos'),
  crear: buildApiUrl('/api/vuelos'),
  obtener: (id) => buildApiUrl(`/api/vuelos/${id}`),
  editar: (id) => buildApiUrl(`/api/vuelos/${id}/editar`),
  confirmarPago: (id) => buildApiUrl(`/api/vuelos/${id}/confirmar-pago`),
  marcarEmitido: (id) => buildApiUrl(`/api/vuelos/${id}/marcar-emitido`),
  copiarPasajeros: (vueloId) => buildApiUrl(`/api/vuelos/${vueloId}/copiar-pasajeros`)
}
```

---

## 🚀 FLUJO DE TRABAJO (ANTES DE CODEAR)

### Checklist Obligatorio

```markdown
□ 1. LEÍ AI_CONTEXT.md completo
□ 2. BUSQUÉ si ya existe código similar:
     - grep -r "nombreFuncion" dashboard/src/
     - Revisé /lib/, /utils/, /hooks/, /services/
□ 3. VERIFIQUÉ endpoints en apiConfig.js
□ 4. ENTIENDO la arquitectura del flujo
□ 5. CONOZCO las prohibiciones del proyecto
□ 6. SÉ qué patrón usar para mi caso
```

### Proceso de Desarrollo

```
1. Planificar
   ├── ¿Ya existe código similar?
   ├── ¿Qué patrón usar?
   └── ¿Dónde va el código?

2. Implementar
   ├── Seguir convenciones de nombres
   ├── Usar endpoints centralizados
   ├── Manejar todos los errores
   └── Agregar loading states

3. Validar
   ├── ¿Funciona correctamente?
   ├── ¿Manejo todos los errores?
   ├── ¿Seguí las convenciones?
   └── ¿No dupliqué código?
```

---

## ✅ ESTADO ACTUAL DEL PROYECTO

### Módulos Completados (7/7)

| Módulo | Estado | Notas |
|--------|--------|-------|
| **Autenticación** | ✅ 100% | Supabase Auth + JWT |
| **Usuarios y Roles** | ✅ 100% | Sistema granular de permisos |
| **Equipos** | ✅ 100% | Gerentes + asesores |
| **Cotizaciones** | ✅ 100% | Individual + múltiple, pasajeros |
| **Vuelos** | ✅ 100% | CRUD, estados, pago, emisión |
| **Ranking** | ✅ 100% | 4 vistas, tiempo real, multi-moneda |
| **Multi-moneda** | ✅ 100% | Conversión USD ↔ EUR |

### Características Implementadas

**Cotizaciones:**
- Vista individual y múltiple
- Gestión de pasajeros (ADT, CHD, INF)
- Estados: EN_REVISION, APROBADA, RECHAZADA
- Historial de cambios automático
- Solo el creador puede editar

**Vuelos:**
- Creación desde cotización o manual
- Copia automática de pasajeros
- Estados: PENDIENTE_CONFIRMACION_PAGO → PENDIENTE_EMISION → EMITIDO
- Confirmación de pago (solo Admin)
- Marcado como emitido
- Adjuntos (PDFs, imágenes)
- Bloqueo de edición si está EMITIDO
- Límite de 3 ediciones

**Ranking:**
- Vista General, Asesores, Gerentes, Equipos
- Auto-cycle cada 4 segundos
- Cambio de moneda cada 8 segundos
- Tiempo real con Supabase Realtime
- Métricas: total vuelos, emitidos, % conversión, monto, fee agencia

### Pendientes de Implementar

- ❌ **Validación de inputs en Express** - Actualmente solo frontend
- ❌ **Row Level Security (RLS)** - Seguridad a nivel de base de datos
- ❌ **Validación de roles en backend** - Solo validación en frontend
- ❌ **Sistema de logging profesional** - Solo console.log/error
- ❌ **Tests automatizados** - Sin tests unitarios ni E2E

---

## 📊 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Crear un nuevo componente de lista

```javascript
// ✅ PROCESO CORRECTO

// 1. Buscar si ya existe
grep -r "Lista de" dashboard/src/components/

// 2. Revisar componentes similares
// Ver: /components/vuelos/VuelosList.jsx

// 3. Crear con patrón existente
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export default function MiLista() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchItems()
  }, [])
  
  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('mi_tabla')
        .select('*')
      
      if (error) throw error
      setItems(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  }
  
  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="p-4 border rounded">
          {item.nombre}
        </div>
      ))}
    </div>
  )
}
```

### Ejemplo 2: Agregar nuevo endpoint

```javascript
// ✅ Backend: src/routes/mirecurso.js
import express from 'express'
import miRecursoService from '../services/miRecursoService.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const data = req.body
    const resultado = await miRecursoService.crear(data)
    res.json({ success: true, data: resultado })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: error.message 
      } 
    })
  }
})

export default router

// ✅ Frontend: Agregar a apiConfig.js
export const MI_RECURSO_API = {
  listar: buildApiUrl('/api/mi-recurso'),
  crear: buildApiUrl('/api/mi-recurso'),
  obtener: (id) => buildApiUrl(`/api/mi-recurso/${id}`)
}

// ✅ Uso en componente
import { MI_RECURSO_API } from '@/config/apiConfig'

const crear = async (data) => {
  const response = await fetch(MI_RECURSO_API.crear, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) throw new Error('Error al crear')
  return response.json()
}
```

### Ejemplo 3: Validar permisos

```javascript
// ✅ Validación en componente
import { useUserProfile } from '@/contexts/UserProfileContext'

export default function AdminPanel() {
  const { hasPermission, isAdmin, hasAnyPermission } = useUserProfile()
  
  // Validación simple
  if (!hasPermission('manage_users')) {
    return <div>No tienes permisos para acceder</div>
  }
  
  return (
    <div>
      {/* Mostrar botón solo si tiene permiso */}
      {hasPermission('delete_users') && (
        <button>Eliminar Usuario</button>
      )}
      
      {/* Validación múltiple (OR) */}
      {hasAnyPermission(['edit_flights', 'view_flights']) && (
        <VuelosSection />
      )}
      
      {/* Validación por rol */}
      {isAdmin && (
        <AdminOnlyFeature />
      )}
    </div>
  )
}
```

---

## 🎯 CHECKLIST FINAL

### Antes de Escribir Código
- [ ] Leí este documento completo
- [ ] Busqué si ya existe código similar
- [ ] Entiendo la arquitectura del proyecto
- [ ] Conozco las prohibiciones
- [ ] Sé qué patrón usar

### Durante el Desarrollo
- [ ] Uso endpoints centralizados (apiConfig.js)
- [ ] Manejo todos los errores con try/catch
- [ ] Uso notificaciones apropiadas (SweetAlert2/toast)
- [ ] Sigo convenciones de nombres
- [ ] No duplico código existente

### Antes de Commit
- [ ] El código funciona correctamente
- [ ] Manejé todos los casos de error
- [ ] Agregué loading states
- [ ] Validé inputs del usuario
- [ ] No hardcodeé valores sensibles
- [ ] Seguí los patrones del proyecto

---

## 📞 RECURSOS ADICIONALES

### Archivos de Contexto Detallado
- `AI_GUIDE.md` - Guía de 3 minutos para agentes IA
- `AI_CONTEXT.md` - Contexto técnico completo del proyecto
- `CODE_RULES.md` - Reglas de código y convenciones
- `ARCHITECTURE.md` - Arquitectura detallada del sistema
- `ROADMAP.md` - Visión general y timeline del proyecto
- `CHANGELOG.md` - Registro de cambios diarios/semanales

### Documentación Específica
- `features/_TEMPLATE.md` - Template para documentar nuevas features
- `docs/GUIA_PLANIFICACION.md` - Sistema de planificación completo
- `ESTADO_MODULO_VENTAS_RANKING.md` - Estado actual detallado

---

## 🚨 EN CASO DE DUDA

**Orden de consulta:**
1. Este documento (CONTEXTO_PARA_IA.md)
2. AI_CONTEXT.md (detalles técnicos)
3. CODE_RULES.md (convenciones específicas)
4. ARCHITECTURE.md (decisiones arquitectónicas)
5. Preguntar al desarrollador humano

**Frases para buscar ayuda:**
- "No encuentro un patrón existente para..."
- "¿Debería usar Express o Dashboard directo para...?"
- "No estoy seguro de las convenciones para..."

---

## 🎯 CONCLUSIÓN

Este documento contiene **TODO** el contexto necesario para trabajar eficientemente en este proyecto:

✅ Arquitectura clara y decisiones técnicas  
✅ Stack tecnológico completo  
✅ Reglas y prohibiciones absolutas  
✅ Estructura de carpetas y base de datos  
✅ Sistema de roles y permisos granular  
✅ Patrones de código obligatorios  
✅ Convenciones de nombres  
✅ APIs centralizadas  
✅ Flujo de trabajo profesional  
✅ Estado actual y pendientes  
✅ Ejemplos prácticos reales

**RECUERDA:** El éxito en este proyecto depende de:
1. Leer este documento completo
2. Buscar siempre código existente antes de crear
3. Seguir los patrones establecidos
4. Preguntar cuando haya dudas

**¡Listo para trabajar en CRM Nova! 🚀**
