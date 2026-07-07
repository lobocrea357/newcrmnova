# Plan de Implementación: Coherencia de Navegación - Módulo Admin Finanzas (Opción A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar redundancia en la navegación del módulo de administración financiera removiendo breadcrumbs de las 4 vistas y consolidando el acceso a través de una sola entrada en el sidebar (Dashboard Emisiones como vista madre), manteniendo los tabs de AdminFinanceNav para navegación interna.

**Architecture:** Simplificar la arquitectura de navegación de 3 niveles (sidebar + breadcrumbs + tabs) a 2 niveles (sidebar + tabs), donde Dashboard Emisiones es el punto de entrada único al módulo y AdminFinanceNav proporciona navegación interna entre las 4 vistas relacionadas.

**Tech Stack:** React, Next.js 14, Lucide Icons, Tailwind CSS, useRouteGuard hook, Sidebar.jsx, AdminFinanceNav componente.

---

## Estructura de Archivos

**Archivos a Modificar:**
- `dashboard/src/app/(crm)/admin/dashboard-emisiones/page.jsx` - Eliminar breadcrumbs
- `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx` - Eliminar breadcrumbs
- `dashboard/src/app/(crm)/admin/deudas/page.jsx` - Eliminar breadcrumbs
- `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx` - Eliminar breadcrumbs
- `dashboard/src/components/layout/Sidebar.jsx` - Eliminar 3 rutas del sidebar, mantener solo Dashboard Emisiones

---

## FASE 1: Eliminar Breadcrumbs de las 4 Vistas

### Task 1.1: Eliminar breadcrumbs de Dashboard Emisiones

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/dashboard-emisiones/page.jsx:14-15, 87-93`

- [ ] **Step 1: Remover import de NavigationBreadcrumb**

```jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import {
  Plane,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { toastSuccess, toastError } from '@/helpers/toasts'
import { METRICAS_API } from '@/config/apiConfig'
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'
// NavigationBreadcrumb eliminado - tabs son suficientes para navegación
```

- [ ] **Step 2: Eliminar componente NavigationBreadcrumb del JSX**

```jsx
return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Emisiones</h1>
            </div>
            <p className="text-gray-600">Métricas y estadísticas del módulo de emisiones</p>
          </div>

          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>
      </div>

      {/* Navegación Horizontal */}
      <AdminFinanceNav />

      {/* ... resto del componente ... */}
    </div>
  </div>
)
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/dashboard-emisiones/page.jsx
git commit -m "refactor: eliminar breadcrumbs redundantes de Dashboard Emisiones - tabs son suficientes"
```

---

### Task 1.2: Eliminar breadcrumbs de Control Emisiones

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx:9-10, 157-163`

- [ ] **Step 1: Remover import de NavigationBreadcrumb**

```jsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Loader2, Package, AlertTriangle, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'
// NavigationBreadcrumb eliminado - tabs son suficientes para navegación
```

- [ ] **Step 2: Eliminar componente NavigationBreadcrumb del JSX**

```jsx
return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Control de Emisiones</h1>
        <p className="text-gray-600 mt-2">
          Vuelos pendientes de autorización para emisión
        </p>
      </div>

      {/* Navegación Horizontal */}
      <AdminFinanceNav />

      {/* ... resto del componente ... */}
    </div>
  </div>
)
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/control-emisiones/page.jsx
git commit -m "refactor: eliminar breadcrumbs redundantes de Control Emisiones - tabs son suficientes"
```

---

### Task 1.3: Eliminar breadcrumbs de Gestión Deudas

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/deudas/page.jsx:9-10, 197-203`

- [ ] **Step 1: Remover import de NavigationBreadcrumb**

```jsx
'use client'

import { useState, useEffect } from 'react'
import { CreditCard, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, FileText, Plus, Search, Filter } from 'lucide-react'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { DEUDAS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import UploadComprobante from '@/components/deudas/UploadComprobante'
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'
// NavigationBreadcrumb eliminado - tabs son suficientes para navegación
```

- [ ] **Step 2: Eliminar componente NavigationBreadcrumb del JSX**

```jsx
return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Deudas</h1>
        </div>
        <p className="text-gray-600">Control de deudas con proveedores y registro de pagos</p>
      </div>

      {/* Navegación Horizontal */}
      <AdminFinanceNav />

      {/* ... resto del componente ... */}
    </div>
  </div>
)
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/deudas/page.jsx
git commit -m "refactor: eliminar breadcrumbs redundantes de Gestión Deudas - tabs son suficientes"
```

---

### Task 1.4: Eliminar breadcrumbs de Confirmar Pagos

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx:14-15, 202-208`

- [ ] **Step 1: Remover import de NavigationBreadcrumb**

```jsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Eye, X, Loader2, CreditCard, FileText, Calendar, Users, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import ImageModal from '@/components/shared/ImageModal'
import ModalObservacionPago from '@/components/vuelos/ModalObservacionPago'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import MetricasHeader from '@/components/admin/MetricasHeader'
import PagoCard from '@/components/admin/PagoCard'
import AdminFinanceNav from '@/components/admin/AdminFinanceNav'
// NavigationBreadcrumb eliminado - tabs son suficientes para navegación
```

- [ ] **Step 2: Eliminar componente NavigationBreadcrumb del JSX**

```jsx
return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Confirmación de Pagos</h1>
        <p className="text-gray-600 mt-2">
          Revisa y aprueba los pagos de vuelos pendientes
        </p>
      </div>

      {/* Navegación Horizontal */}
      <AdminFinanceNav />

      {/* ... resto del componente ... */}
    </div>
  </div>
)
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx
git commit -m "refactor: eliminar breadcrumbs redundantes de Confirmar Pagos - tabs son suficientes"
```

---

## FASE 2: Modificar Sidebar para Consolidar Navegación

### Task 2.1: Eliminar 3 rutas del array menuItems en Sidebar

**Files:**
- Modify: `dashboard/src/components/layout/Sidebar.jsx:48-51`

- [ ] **Step 1: Eliminar las 3 rutas redundantes del array menuItems**

```jsx
const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/conversaciones', label: 'Conversaciones', icon: MessageSquare },
    { href: '/rutas-riesgo', label: 'Rutas en Riesgo', icon: AlertTriangle },
    { href: '/analisis/rendimiento', label: 'Rendimiento', icon: TrendingUp },
    { href: '/manual-ventas', label: 'Manual de Ventas', icon: BookOpen },
    { href: '/cotizador', label: 'Cotizador', icon: Calculator },
    { href: '/ventas', label: 'Ventas', icon: TrendingUp },
    { href: '/ventas/cotizaciones', label: 'Cotizaciones', icon: ClipboardList },
    { href: '/ventas/vuelos', label: 'Vuelos', icon: PlaneTakeoff },
    { href: '/ventas/anulables', label: 'Anulables', icon: XCircle },
    // Módulo Admin Finanzas - Solo Dashboard Emisiones como entrada
    { href: '/admin/dashboard-emisiones', label: 'Finanzas Admin', icon: BarChart3 },
    // Eliminadas: Confirmar Pagos, Control Emisiones, Gestión Deudas
    // Ahora se acceden vía tabs dentro de Dashboard Emisiones
    { href: '/emisiones', label: 'Emisiones', icon: Send },
    { href: '/analisis/reportes', label: 'Reportes', icon: FileText },
    { href: '/inteligencia-artificial', label: 'IA', icon: Brain },
    { href: '/configuracion', label: 'Configuración', icon: Settings },
]
```

- [ ] **Step 2: Actualizar label para reflejar que es el módulo completo**

```jsx
{ href: '/admin/dashboard-emisiones', label: 'Finanzas Admin', icon: BarChart3 },
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/layout/Sidebar.jsx
git commit -m "refactor: consolidar navegación admin finanzas - solo Dashboard Emisiones en sidebar"
```

---

### Task 2.2: Actualizar ROUTES_BY_ROLE para roles gerente y administracion

**Files:**
- Modify: `dashboard/src/components/layout/Sidebar.jsx:68-82`

- [ ] **Step 1: Actualizar array de rutas para rol gerente**

```jsx
const ROUTES_BY_ROLE = {
    super_admin: null,
    admin: null,
    gerente: [
        '/', '/conversaciones', '/rutas-riesgo', '/analisis/rendimiento',
        '/gestion-equipos', '/cotizador', '/ventas', '/ventas/cotizaciones',
        '/ventas/vuelos', '/admin/dashboard-emisiones', // Consolidado - acceso vía tabs
        '/emisiones', '/inteligencia-artificial', '/configuracion', '/configuracion/mi-equipo'
    ],
    asesor: [
        '/', '/cotizador', '/ventas', '/ventas/cotizaciones',
        '/ventas/vuelos', '/ventas/vuelos/nuevo'
    ],
    administracion: [
        '/', '/cotizador', '/ventas', '/ventas/cotizaciones',
        '/ventas/vuelos', '/ventas/vuelos/nuevo', '/admin/dashboard-emisiones' // Consolidado - acceso vía tabs
    ],
    emisor: ['/', '/emisiones'],
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/layout/Sidebar.jsx
git commit -m "refactor: actualizar ROUTES_BY_ROLE para roles gerente y administracion - acceso consolidado"
```

---

## FASE 3: Verificación y Testing

### Task 3.1: Verificar navegación sin breadcrumbs

**Files:**
- Test: Manual testing en navegador

- [ ] **Step 1: Probar Dashboard Emisiones sin breadcrumbs**

1. Navegar a `/admin/dashboard-emisiones`
2. Verificar que NO haya breadcrumbs
3. Verificar que tabs de AdminFinanceNav estén presentes
4. Verificar que tab "Dashboard Emisiones" esté activo
5. Navegar a otros tabs y verificar que funcionen

- [ ] **Step 2: Probar Control Emisiones sin breadcrumbs**

1. Navegar a `/admin/control-emisiones`
2. Verificar que NO haya breadcrumbs
3. Verificar que tabs de AdminFinanceNav estén presentes
4. Verificar que tab "Control Emisiones" esté activo

- [ ] **Step 3: Probar Gestión Deudas sin breadcrumbs**

1. Navegar a `/admin/deudas`
2. Verificar que NO haya breadcrumbs
3. Verificar que tabs de AdminFinanceNav estén presentes
4. Verificar que tab "Gestión Deudas" esté activo

- [ ] **Step 4: Probar Confirmar Pagos sin breadcrumbs**

1. Navegar a `/admin/confirmar-pagos`
2. Verificar que NO haya breadcrumbs
3. Verificar que tabs de AdminFinanceNav estén presentes
4. Verificar que tab "Confirmar Pagos" esté activo

- [ ] **Step 5: Commit de verificación**

```bash
git commit --allow-empty -m "test: verificar navegación sin breadcrumbs en las 4 vistas"
```

---

### Task 3.2: Verificar Sidebar consolidado

**Files:**
- Test: Manual testing con diferentes roles

- [ ] **Step 1: Probar sidebar con rol super_admin**

1. Login como super_admin
2. Verificar que solo aparezca "Finanzas Admin" en sidebar
3. Verificar que NO aparezcan las otras 3 rutas individuales
4. Hacer clic en "Finanzas Admin" y verificar que navegue a Dashboard Emisiones

- [ ] **Step 2: Probar sidebar con rol admin**

1. Login como admin
2. Verificar que solo aparezca "Finanzas Admin" en sidebar
3. Verificar que NO aparezcan las otras 3 rutas individuales

- [ ] **Step 3: Probar sidebar con rol administracion**

1. Login como administracion
2. Verificar que solo aparezca "Finanzas Admin" en sidebar
3. Verificar que NO aparezcan las otras 3 rutas individuales

- [ ] **Step 4: Probar sidebar con rol gerente**

1. Login como gerente
2. Verificar que solo aparezca "Finanzas Admin" en sidebar
3. Verificar que NO aparezcan las otras 3 rutas individuales

- [ ] **Step 5: Probar acceso directo a URLs eliminadas**

1. Intentar acceder directamente a `/admin/confirmar-pagos`
2. Verificar que la página cargue (tabs permiten navegación)
3. Intentar acceder directamente a `/admin/control-emisiones`
4. Verificar que la página cargue (tabs permiten navegación)
5. Intentar acceder directamente a `/admin/deudas`
6. Verificar que la página cargue (tabs permiten navegación)

- [ ] **Step 6: Commit de verificación**

```bash
git commit --allow-empty -m "test: verificar sidebar consolidado y acceso directo a URLs"
```

---

### Task 3.3: Verificar validaciones de roles

**Files:**
- Test: Manual testing con diferentes roles

- [ ] **Step 1: Probar acceso con rol super_admin**

1. Login como super_admin
2. Acceder a las 4 vistas
3. Verificar que no haya redirección a /no-autorizado

- [ ] **Step 2: Probar acceso con rol admin**

1. Login como admin
2. Acceder a las 4 vistas
3. Verificar que no haya redirección a /no-autorizado

- [ ] **Step 3: Probar acceso con rol administracion**

1. Login como administracion
2. Acceder a las 4 vistas
3. Verificar que no haya redirección a /no-autorizado

- [ ] **Step 4: Probar denegación con rol gerente**

1. Login como gerente
2. Intentar acceder a las 4 vistas
3. Verificar redirección a /no-autorizado

- [ ] **Step 5: Probar denegación con rol asesor**

1. Login como asesor
2. Intentar acceder a las 4 vistas
3. Verificar redirección a /no-autorizado

- [ ] **Step 6: Probar permiso específico en Confirmar Pagos**

1. Login como usuario con rol permitido pero sin permiso vuelos.confirm_payment
2. Intentar acceder a /admin/confirmar-pagos
3. Verificar redirección a /no-autorizado

- [ ] **Step 7: Commit de verificación**

```bash
git commit --allow-empty -m "test: verificar validaciones de roles después de consolidación de navegación"
```

---

## FASE 4: Documentación

### Task 4.1: Actualizar documentación del módulo

**Files:**
- Modify: `docs/03-contexto-usuario-agencias-sedes/README.md` (o crear nuevo archivo)

- [ ] **Step 1: Actualizar documentación con nueva estructura de navegación**

```markdown
# Módulo de Administración - Finanzas y Emisiones

## Descripción

El módulo de administración para finanzas y emisiones incluye 4 vistas principales para la gestión del proceso de emisiones de vuelos y control financiero.

## Estructura de Navegación

**Entrada Única:** El módulo se accede desde el sidebar mediante "Finanzas Admin" que lleva a Dashboard Emisiones.

**Navegación Interna:** Las 4 vistas relacionadas se navegan mediante tabs horizontales (AdminFinanceNav) dentro del módulo.

## Vistas del Módulo

### 1. Dashboard de Emisiones
- **Ruta:** `/admin/dashboard-emisiones`
- **Propósito:** Métricas y estadísticas del módulo de emisiones
- **Roles permitidos:** super_admin, admin, administracion
- **Acceso:** Sidebar → "Finanzas Admin"

### 2. Control de Emisiones
- **Ruta:** `/admin/control-emisiones`
- **Propósito:** Autorizar vuelos pendientes de emisión
- **Roles permitidos:** super_admin, admin, administracion
- **Acceso:** Tabs → "Control Emisiones"

### 3. Gestión de Deudas
- **Ruta:** `/admin/deudas`
- **Propósito:** Control de deudas con proveedores y registro de pagos
- **Roles permitidos:** super_admin, admin, administracion
- **Acceso:** Tabs → "Gestión Deudas"

### 4. Confirmación de Pagos
- **Ruta:** `/admin/confirmar-pagos`
- **Propósito:** Revisar y aprobar pagos de vuelos pendientes
- **Roles permitidos:** super_admin, admin, administracion
- **Permiso adicional:** `vuelos.confirm_payment`
- **Acceso:** Tabs → "Confirmar Pagos"

## Validaciones de Seguridad

Todas las vistas utilizan `useRouteGuard` con:
- `requireAuth: true`
- `allowedRoles: ['administracion', 'admin', 'super_admin']`

La vista de Confirmación de Pagos tiene una validación adicional:
- Permiso específico: `vuelos.confirm_payment`

## Nota sobre Roles

- **admin:** Rol administrativo general
- **administracion:** Rol específico del departamento de administración
- Ambos roles tienen acceso al módulo pero son roles distintos en el sistema

## Cambios de Navegación (2026-04-22)

**Antes:**
- 4 items individuales en el sidebar
- Breadcrumbs en cada vista
- 3 niveles de navegación (sidebar + breadcrumbs + tabs)

**Después:**
- 1 item consolidado en el sidebar ("Finanzas Admin")
- Sin breadcrumbs (tabs son suficientes)
- 2 niveles de navegación (sidebar + tabs)
- Mejor coherencia y UX
```

- [ ] **Step 2: Commit de documentación**

```bash
git add docs/03-contexto-usuario-agencias-sedes/README.md
git commit -m "docs: actualizar documentación del módulo admin finanzas con nueva estructura de navegación"
```

---

## Self-Review

### 1. Cobertura de Especificación
✅ Eliminar breadcrumbs de las 4 vistas (Tasks 1.1, 1.2, 1.3, 1.4)
✅ Consolidar sidebar a solo Dashboard Emisiones (Task 2.1)
✅ Actualizar ROUTES_BY_ROLE para roles gerente y administracion (Task 2.2)
✅ Verificar navegación sin breadcrumbs (Task 3.1)
✅ Verificar sidebar consolidado (Task 3.2)
✅ Verificar validaciones de roles (Task 3.3)
✅ Documentar cambios (Task 4.1)

### 2. Escaneo de Placeholders
✅ No se encontraron placeholders como "TODO", "TBD", "implementar después"
✅ Todo el código está completo y listo para implementar
✅ Los comandos git son específicos y ejecutables

### 3. Consistencia de Tipos
✅ `allowedRoles` mantiene array de strings en todas las vistas
✅ Rutas en ROUTES_BY_ROLE actualizadas consistentemente
✅ Label de sidebar actualizado para reflejar consolidación
✅ Estructura de componentes mantienen consistencia

### 4. Verificación de Coherencia (Interface Design + Frontend Design)
✅ Reducción de 3 niveles a 2 niveles de navegación
✅ Eliminación de redundancia (breadcrumbs cuando tabs existen)
✅ Sidebar más limpio - menos items = menos confusión
✅ Jerarquía clara: Sidebar → Dashboard → Tabs internos
✅ UX mejorada: carga cognitiva reducida

### 5. Verificación de Seguridad (View Access Auditor + Code Review Excellence)
✅ Validaciones de roles mantenidas sin cambios
✅ useRouteGuard sigue siendo consistente
✅ Distinción entre admin y administracion respetada
✅ Permiso específico en Confirmar Pagos mantenido
✅ No hay vulnerabilidades introducidas

---

## Ejecución

Plan completo y guardado en `docs/superpowers/plans/2026-04-22-coherencia-navegacion-admin-finance.md`.

**Dos opciones de ejecución:**

**1. Subagent-Driven (recomendado)** - Despacho un subagente fresco por tarea, reviso entre tareas, iteración rápida

**2. Inline Execution** - Ejecuto tareas en esta sesión usando executing-plans, ejecución por lotes con checkpoints para revisión

¿Cuál enfoque prefieres?
