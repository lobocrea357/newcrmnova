# 🏗️ Arquitectura Completa del Sistema CRM WhatsApp

## 📋 **Descripción General**

Sistema CRM para gestión de bots de WhatsApp con arquitectura de microservicios usando Docker. Cada componente tiene responsabilidades específicas y se comunica de manera eficiente.

---

## 🎯 **Componentes Principales**

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                              │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ Escanea QR                 │ Accede al Dashboard
             │                            │
             ▼                            ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│   WAHA PLUS (Puerto    │    │   DASHBOARD (Puerto 3001)    │
│        3000)           │    │      Next.js Frontend        │
│                        │    │                              │
│  - Crea Workers/Bots   │    │  - Acceso directo a Supabase │
│  - Gestiona WhatsApp   │    │  - Escritura directa en BD   │
│  - Genera QR Codes     │    │  - Sube archivos a Storage  │
│  - Envía Webhooks      │    │  - Validación de roles       │
└───────────┬────────────┘    └──────────────┬───────────────┘
            │                                │
            │ Webhooks                       │ Queries + Escrituras
            │                                │
            ▼                                ▼
┌────────────────────────────────────────────────────────────┐
│           EXPRESS API (Puerto 4000)                        │
│                Backend del CRM                             │
│                                                            │
│  - Recibe Webhooks de WAHA                                │
│  - Procesa y Almacena Datos                               │
│  - API REST para operaciones específicas                   │
│  - SIN validación de inputs (pendiente)                   │
└───────────────────────┬────────────────────────────────────┘
                        │
                        │ Almacena/Consulta
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│                    SUPABASE                                │
│              Base de Datos PostgreSQL                      │
│                                                            │
│  - Almacena: Mensajes, Contactos, Chats, Workers        │
│  - Storage para archivos multimedia                       │
│  - Realtime para actualizaciones                          │
│  - SIN RLS implementado (pendiente)                      │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Flujo de Datos Detallado**

### **1️⃣ Recepción de Mensajes**
```
WhatsApp → WAHA → Webhook → Express API → Supabase → Dashboard (Realtime)
```

1. **WhatsApp** envía mensaje
2. **WAHA** procesa y envía webhook a **Express**
3. **Express** almacena en **Supabase** (tabla `messages`)
4. **Dashboard** recibe actualización vía **Supabase Realtime**

### **2️⃣ Consulta de Datos**
```
Dashboard → Supabase (consulta directa)
```

- **Dashboard** consulta directamente a **Supabase** usando cliente JS
- Lectura de mensajes, contactos, estadísticas
- No pasa por Express API

### **3️⃣ Escritura de Datos**
```
Dashboard → Supabase (escritura directa)
```

- **Dashboard** escribe directamente en **Supabase**
- Evaluaciones, análisis, vuelos, reportes
- No pasa por Express API

### **4️⃣ Manejo de Archivos**
```
Dashboard → Supabase Storage (subida directa)
```

- **Dashboard** sube archivos directamente a **Supabase Storage**
- Límite: 10MB por archivo
- Validación de tipo y tamaño en frontend

---

## 📁 **Estructura de Carpetas**

### **Backend (Express)**
```
src/
├── config/           # Configuración de servicios (supabase.js, waha.js)
├── routes/           # Rutas API (22 archivos)
├── services/         # Lógica de negocio (24 servicios)
├── scripts/          # Scripts de mantenimiento
└── utils/            # Utilidades compartidas
```

**Rutas API disponibles:**
- `agencias.js` - Gestión de agencias
- `autoSync.js` - Sincronización automática
- `bots.js` - Gestión de bots
- `chats.js` - Gestión de chats
- `contacts.js` - Gestión de contactos
- `cotizaciones.js` - Sistema de cotizaciones
- `dashboard.js` - Datos del dashboard
- `diagnostics.js` - Diagnósticos del sistema
- `equipos.js` - Gestión de equipos
- `fullSync.js` - Sincronización completa
- `media.js` - Gestión de archivos multimedia
- `messages.js` - Gestión de mensajes
- `rankings.js` - Rankings de asesores
- `rendimiento.js` - Análisis de rendimiento
- `roles.js` - Gestión de roles y permisos
- `sedes.js` - Gestión de sedes
- `sync.js` - Sincronización de datos
- `tasas.js` - Tasas de cambio
- `users.js` - Gestión de usuarios
- `vuelos.js` - Gestión de vuelos
- `webhooks.js` - Webhooks de WAHA
- `workers.js` - Gestión de workers

### **Frontend (Dashboard Next.js)**
```
dashboard/src/
├── app/              # App Router (40+ rutas)
├── components/       # Componentes UI (60+ componentes)
│   ├── cotizador/    # Sistema de cotizaciones (12 items)
│   ├── rendimiento/  # Análisis de rendimiento (16 items)
│   ├── vuelos/       # Gestión de vuelos (8 items)
│   ├── permissions/  # Sistema de permisos (4 items)
│   └── ...           # Otros componentes especializados
├── hooks/           # Hooks personalizados (9 hooks)
│   └── cotizador/    # Hooks especializados del cotizador (4 items)
├── lib/             # Utilidades y helpers (25+ archivos)
│   └── cotizador/    # Configuraciones del cotizador (6 archivos)
├── contexts/        # Context API (3 contextos)
└── config/          # Configuración centralizada (apiConfig.js)
```

---

## 🔧 **Tecnologías y Stack**

### **Backend (Express)**
- **Runtime**: Node.js con ES Modules
- **Framework**: Express.js
- **Base de Datos**: Supabase (PostgreSQL)
- **HTTP Client**: Axios
- **Logging**: Morgan + console.error

### **Frontend (Dashboard)**
- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + Lucide React
- **Estado**: React Hooks + Context API
- **Notificaciones**: SweetAlert2 + react-hot-toast
- **PDF**: jsPDF + html2canvas-pro
- **Gráficos**: Recharts
- **Automatización**: node-cron + Puppeteer
- **IA**: OpenAI SDK

### **WAHA (WhatsApp)**
- **WhatsApp HTTP API**: WAHA Plus
- **Workers**: Múltiples sesiones por instancia
- **Webhooks**: Integración con Express

---

## 🔐 **Autenticación y Roles**

### **Roles del Sistema**
- **super_admin**: Acceso total sin restricciones
- **admin**: Acceso completo a todas las funcionalidades
- **gerente**: Acceso de gestión de equipos y bots asignados
- **administracion**: Acceso a funciones administrativas (vuelos, cotizaciones)
- **asesor**: Acceso básico de consulta
- **emisor**: Acceso especializado para emisión de boletos

### **Sistema de Permisos Granular**
- ✅ **Permisos por rol**: Definidos en tabla `role_permissions`
- ✅ **Permisos por usuario**: Overrides en tabla `user_permissions`
- ✅ **Ranking jerárquico**: Cada rol tiene un ranking para validación de jerarquía
- ✅ **Frontend**: Validación completa mediante `UserProfileContext`
- ❌ **Backend**: SIN validación (pendiente implementar)
- ❌ **RLS**: SIN Row Level Security (pendiente implementar)

### **Autenticación**
- **Supabase Auth** para login/logout
- **JWT Tokens** para sesiones
- **Middleware** de protección de rutas

---

## 📊 **Base de Datos (Supabase)**

### **Tablas Principales**
```
# Usuarios y Permisos
users                     → Usuarios del sistema
profiles                  → Perfiles con roles
roles                     → Definición de roles del sistema
permissions               → Permisos granulares
role_permissions          → Permisos asignados a cada rol
user_permissions          → Permisos específicos de usuario (overrides)

# WhatsApp y Mensajería
workers                   → Workers/Bots de WAHA
bots                      → Bots de WhatsApp
contacts                  → Contactos de WhatsApp
chats                     → Conversaciones
messages                  → Mensajes (texto, multimedia)
media_files               → Metadatos de archivos

# Vuelos y Cotizaciones
vuelos                    → Gestión de vuelos
vuelos_pasajeros          → Pasajeros de vuelos
anulables                 → Anulables de vuelos
cotizaciones              → Cotizaciones de vuelos
cotizaciones_pasajeros    → Pasajeros de cotizaciones
cotizaciones_historial    → Historial de cambios

# Organización
agencias                  → Gestión de agencias
agencias_usuarios         → Relación usuarios-agencias
sedes                     → Gestión de sedes
sedes_usuarios            → Relación usuarios-sedes
equipos                   → Equipos de trabajo

# Análisis y Reportes
conversation_evaluations  → Evaluaciones de IA
performance_analyses      → Análisis de rendimiento
performance_reports       → Reportes generados
```

### **Storage Buckets**
```
whatsapp/          → Archivos multimedia de WhatsApp
vuelos-adjuntos/   → Adjuntos de vuelos (PDF, imágenes)
```

---

## 🐳 **Arquitectura Docker**

### **Red Interna**
- **Nombre**: `crm_network`
- **Comunicación**: Por nombre de contenedor
- **Aislamiento**: De red externa

### **Volúmenes Persistentes**
```yaml
waha_data:         # Configuración de WAHA
waha_sessions:     # Sesiones de WhatsApp
waha_media:        # Archivos temporales
```

### **Puertos**
```
3000  → WAHA Plus (Dashboard + API)
4000  → Express API (Backend)
3001  → Dashboard Next.js (Frontend)
```

---

## 🔄 **Patrones de Comunicación**

### **Dashboard ↔ Supabase**
- **Lecturas**: Directas con cliente Supabase
- **Escrituras**: Directas con cliente Supabase
- **Archivos**: Directos a Supabase Storage
- **Realtime**: Suscripciones para actualizaciones

### **Express ↔ Supabase**
- **Webhooks**: Almacenamiento de mensajes
- **Sincronización**: Datos de WAHA
- **Reportes**: Generación automatizada

### **Express ↔ WAHA**
- **API Calls**: Sin helper centralizado (cada servicio maneja sus requests)
- **Webhooks**: Recepción de eventos de WhatsApp

---

## 🚀 **Despliegue y Escalabilidad**

### **Requisitos Mínimos**
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 20 GB SSD
- **OS**: Ubuntu 20.04+ o Debian 11+

### **Escalabilidad**
- **WAHA**: Múltiples workers por instancia
- **Express**: Escalable con réplicas
- **Dashboard**: Escalable con réplicas
- **Supabase**: Escala automática

---

## ⚠️ **Estado Actual y Pendientes**

### **✅ Implementado**
- Autenticación con Supabase Auth
- Roles básicos (validación frontend)
- Dashboard con acceso directo a Supabase
- Sistema de archivos multimedia
- Análisis de conversaciones con IA
- Sistema de vuelos y cotizaciones

### **❌ Pendiente Implementar**
- **Validación de inputs en Express**
- **Row Level Security (RLS) en Supabase**
- **Validación de roles y permisos en backend**
- **Helper centralizado para WAHA API**
- **Sistema de logging profesional**
- **Tests unitarios y de integración**

---

## 📚 **Documentación Adicional**

- **Dashboard específico**: `dashboard/docs/README.md`
- **General del proyecto**: `docs/README.md`
- **Instalación**: `docs/01-instalacion/`
- **Mantenimiento**: `docs/06-mantenimiento/`

---

## 🎯 **Ventajas de esta Arquitectura**

1. **Separación clara**: Cada servicio tiene su responsabilidad
2. **Acceso directo**: Dashboard con acceso rápido a datos
3. **Escalabilidad**: Componentes independientes
4. **Mantenibilidad**: Estructura organizada y modular
5. **Desarrollo**: Fácil de desarrollar y probar localmente
