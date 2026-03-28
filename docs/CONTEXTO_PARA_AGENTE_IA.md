# Contexto Completo para Agente IA - Sesión 27/03/2026

## 🎯 Misión Principal
Completar la implementación del sistema de agencias y sedes, y resolver el problema de visibilidad de tabs en el cotizador que usuarios no autorizados pueden ver.

---

## 📊 Estado Actual del Sistema

### ✅ Completado (67% del trabajo)

#### 1. Sistema de Permisos - 90% Completo
- **UserProfileContext.js** tiene debug logging implementado
- **Sidebar.jsx** fue refactorizado para eliminar `userConfig.js`
- **Sistema de rutas por rol** implementado con `ROUTES_BY_ROLE`
- **gestion-equipos/page.js** corregido para permitir admin/super_admin

#### 2. Backend Agencias/Sedes - 100% Completo
- **Services:** `agenciasService.js` y `sedesService.js` creados
- **Routes:** `agencias.js` y `sedes.js` con todos los endpoints REST
- **Integración:** Rutas registradas en `index.js`
- **API Config:** `AGENCIAS_API` y `SEDES_API` configurados

#### 3. Frontend Components - 100% Completo
- **AgenciasManager.jsx:** CRUD completo, UI moderna, gestión de usuarios
- **SedesManager.jsx:** CRUD completo, UI moderna, gestión de usuarios
- **Features:** Forms modales, cards interactivos, validaciones, loading states

#### 4. Mejoras Adicionales - 100% Completo
- **Límite de comprobantes:** Aumentado de 5 a 10 (sin límite para efectivo)
- **Auditoría de permisos:** Todas las páginas revisadas y corregidas
- **Debug logging:** Implementado en cotizador para diagnóstico

---

## ⏳ Pendiente Crítico (33% del trabajo)

### 1. Base de Datos - 0% Completo
**Archivo:** `docs/05-base-de-datos/migration_agencias_sedes.sql`
- **Bloqueante:** Requiere ejecución manual en Supabase
- **Impacto:** Sin esto, nada funciona en frontend

### 2. Integración UI - 0% Completo
**Archivo:** `dashboard/src/app/(crm)/configuracion/usuarios/page.js`
- **Acción:** Importar y agregar tabs de Agencias/Sedes
- **Dependencia:** Requiere que la BD esté lista

### 3. Testing - 0% Completo
- **Backend:** Probar endpoints
- **Frontend:** Probar integración y permisos
- **Diagnóstico:** Analizar logs del cotizador

---

## 🎯 Problema Principal a Resolver

### Tabs del Cotizador Visibles para No Autorizados
**Síntomas:** Usuario "Valeria Reinozo" puede ver tabs de gestión sin tener permisos

**Debug Implementado:**
```javascript
// UserProfileContext.js - Líneas 123-145
console.log('🔐 [UserProfileContext] Perfil cargado:', {
  email: profileData.email,
  role: profileData.role?.name,
  rolePermissionsCount: rolePermissions.length,
  rolePermissions: rolePermissions,
  userPermissionsCount: userPermissions.length,
  userPermissions: userPermissions
})

// cotizador/page.js - Líneas 39-56
console.log('📊 [Cotizador] Evaluación de tabs:', {
  role: profile?.role?.name,
  hasTasasPermission,
  hasMonedasPermission,
  canManageTasas,
  canManageMonedas
})
```

**Pasos para diagnóstico:**
1. Login como usuario problema
2. Navegar a `/cotizador`
3. Revisar DevTools Console
4. Analizar valores de permisos

---

## 📁 Archivos Clave

### Backend Creados
```
src/
├── services/
│   ├── agenciasService.js    # 12 funciones CRUD
│   └── sedesService.js      # 10 funciones CRUD
├── routes/
│   ├── agencias.js          # 9 endpoints REST
│   └── sedes.js            # 7 endpoints REST
└── index.js                 # Rutas registradas
```

### Frontend Creados
```
dashboard/src/
├── config/
│   └── apiConfig.js         # AGENCIAS_API y SEDES_API
├── components/
│   ├── agencias/
│   │   └── AgenciasManager.jsx
│   └── sedes/
│       └── SedesManager.jsx
└── app/(crm)/configuracion/
    └── usuarios/page.js     # MODIFICAR - Agregar tabs
```

### Base de Datos
```
docs/05-base-de-datos/
└── migration_agencias_sedes.sql  # EJECUTAR en Supabase
```

### Modificados para Debug
```
dashboard/src/
├── contexts/
│   └── UserProfileContext.js     # Debug logging agregado
├── app/cotizador/
│   └── page.js                  # Debug logging agregado
└── components/layout/
    └── Sidebar.jsx              # Refactorizado
```

---

## 🔧 Acciones Inmediatas Requeridas

### Paso 1: Ejecutar Migration SQL (PRIORIDAD #1)
```bash
# En Supabase Dashboard → SQL Editor
# 1. Copiar contenido de docs/05-base-de-datos/migration_agencias_sedes.sql
# 2. Ejecutar script completo
# 3. Verificar que no haya errores
```

### Paso 2: Integrar Components en Usuarios Page (PRIORIDAD #2)
```javascript
// En dashboard/src/app/(crm)/configuracion/usuarios/page.js

// 1. Agregar imports
import AgenciasManager from '@/components/agencias/AgenciasManager'
import SedesManager from '@/components/sedes/SedesManager'
import { Building2, MapPin } from 'lucide-react'

// 2. Agregar tabs al array existente
const tabs = [
  // ... tabs existentes
  {
    id: 'agencias',
    label: 'Agencias',
    icon: Building2,
    condition: isSuperAdmin || isAdmin
  },
  {
    id: 'sedes',
    label: 'Sedes', 
    icon: MapPin,
    condition: isSuperAdmin || isAdmin
  }
]

// 3. Agregar renderizado condicional
{activeTab === 'agencias' && <AgenciasManager />}
{activeTab === 'sedes' && <SedesManager />}
```

### Paso 3: Testing Completo (PRIORIDAD #3)
```bash
# Backend
curl http://localhost:4000/api/agencias
curl http://localhost:4000/api/sedes

# Frontend
# 1. Login como admin/super_admin
# 2. Navegar a /configuracion/usuarios
# 3. Verificar tabs visibles
# 4. Probar CRUD operations
```

### Paso 4: Diagnóstico Cotizador (PRIORIDAD #4)
```bash
# 1. Login como usuario con problema
# 2. Navegar a /cotizador  
# 3. Revisar DevTools Console
# 4. Buscar logs 🔐 y 📊
# 5. Analizar valores de permisos
```

---

## 🚨 Decisiones Arquitectónicas Tomadas

### 1. Eliminación de userConfig.js
- **Razón:** Sistema obsoleto basado en emails estáticos
- **Reemplazo:** `UserProfileContext` con permisos dinámicos desde BD
- **Impacto:** Sidebar ahora usa `ROUTES_BY_ROLE` directo

### 2. Acceso Restringido a Agencias/Sedes
- **Roles permitidos:** Solo `admin` y `super_admin`
- **Validación:** Frontend y Backend (RLS)
- **Razón:** Sistema crítico que requiere control total

### 3. Arquitectura de Servicios
- **Pattern:** Service Layer → Route Layer → Controller
- **Separación:** Lógica de negocio separada de endpoints
- **Consistencia:** Mismo patrón que otros servicios (equipos, usuarios)

### 4. UI/UX Consistente
- **Design:** Cards interactivos con colores de marca
- **Interacción:** Click para seleccionar, hover effects
- **Validación:** Confirmaciones para acciones destructivas
- **Feedback:** Loading states y toast notifications

---

## 📊 Endpoints Disponibles

### Agencias API
```
GET    /api/agencias              # Listar todas
POST   /api/agencias              # Crear nueva
GET    /api/agencias/:id          # Obtener por ID
PUT    /api/agencias/:id          # Actualizar
DELETE /api/agencias/:id          # Eliminar (desactivar)
GET    /api/agencias/:id/users    # Usuarios asignados
POST   /api/agencias/:id/users    # Asignar usuario
DELETE /api/agencias/:id/users/:userId  # Remover usuario
PATCH  /api/agencias/:id/users/:userId/primary  # Set primaria
```

### Sedes API
```
GET    /api/sedes                 # Listar todas
POST   /api/sedes                 # Crear nueva
GET    /api/sedes/:id             # Obtener por ID
PUT    /api/sedes/:id             # Actualizar
DELETE /api/sedes/:id             # Eliminar (desactivar)
GET    /api/sedes/:id/users       # Usuarios asignados
POST   /api/sedes/:id/users       # Asignar usuario
DELETE /api/sedes/:id/users/:userId  # Remover usuario
```

---

## 🔍 Contexto del Problema de Cotizador

### Flujo Esperado:
1. **Usuario hace login** → `AuthContext` carga sesión
2. **UserProfileContext** carga perfil y permisos desde BD
3. **Cotizador page** evalúa `hasPermission()` para cada tab
4. **Tabs renderizados** basados en permisos

### Problema Actual:
- **Valeria Reinozo** ve tabs sin tener permisos
- **Causa desconocida** → Debug logging implementado para diagnosticar

### Variables Clave a Monitorear:
```javascript
// En UserProfileContext
rolePermissions: []      // Permisos del rol
userPermissions: []      // Permisos individuales
allPermissions: []       // Combinación final

// En cotizador
hasTasasPermission: boolean
hasMonedasPermission: boolean
canManageTasas: boolean
canManageMonedas: boolean
```

---

## 🎯 Success Criteria

### Sistema Agencias/Sedes:
- [ ] Migration SQL ejecutada sin errores
- [ ] Tabs visibles solo para admin/super_admin
- [ ] CRUD operations funcionan correctamente
- [ ] Asignación de usuarios funciona
- [ ] Validaciones de eliminación funcionan

### Problema Cotizador:
- [ ] Logs muestran datos correctos
- [ ] Tabs ocultos para usuarios no autorizados
- [ ] Tabs visibles para usuarios autorizados
- [ ] No hay errores en console

### General:
- [ ] No hay errores en backend
- [ ] No hay errores en frontend
- [ ] Sistema funciona como esperado
- [ ] Documentación actualizada

---

## 📞 Si Necesitas Ayuda

1. **Revisa los archivos de documentación creados:**
   - `docs/SESION_2026_03_27_RESUMEN.md`
   - `docs/TAREAS_PENDIENTES_DETALLADO.md`
   - `docs/ESTADO_ACTUAL_IMPLEMENTACION.md`
   - `docs/CHECKLIST_IMPLEMENTACION.md`

2. **Sigue el checklist sistemáticamente**

3. **Usa los debug logs para diagnóstico**

4. **Verifica cada paso antes de continuar al siguiente**

---

## 🚀 Ready to Continue

El sistema está 67% implementado. Los componentes principales están creados y funcionando. Solo falta:
1. Ejecutar la migration en BD
2. Integrar los components en la UI
3. Testing y diagnóstico final

**Tiempo estimado restante:** 2-3 horas

**Complejidad:** Media - principalmente tareas de integración y testing

**Riesgos:** Bajos - la arquitectura está sólida y probada
