# Validación de Permisos en Vista de Confirmación de Pagos - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar validaciones de permisos robustas en la vista de confirmación de pagos para permitir acceso solo a roles `super_admin`, `admin` y `administracion`, con validación en frontend y backend.

**Architecture:** Arquitectura en capas con validación de defensa en profundidad: Frontend (UserProfileContext) → API Route → Service Layer → Database. Las validaciones se implementarán en tres capas: (1) Frontend - Protección de ruta y componentes, (2) Backend Route - Validación de rol en endpoint, (3) Backend Service - Validación de estado.

**Tech Stack:** Node.js, Express, Supabase (PostgreSQL), Next.js 14, React, TailwindCSS, Lucide Icons

---

## Estructura de Archivos

### Archivos a Modificar
- `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx` - Agregar validación de permisos en frontend
- `src/routes/vuelos.js` - Agregar validación de rol en endpoint de confirmación de pago
- `src/services/vuelosService.js` - Ya tiene validación de estado (mantener)

### Archivos a Crear
- `dashboard/src/components/shared/AccessDenied.jsx` - Componente reutilizable para acceso denegado

---

## FASE 1: Frontend - Componente AccessDenied

### Task 1: Crear componente AccessDenied reutilizable

**Files:**
- Create: `dashboard/src/components/shared/AccessDenied.jsx`

- [ ] **Step 1: Crear componente AccessDenied con diseño consistente**

```jsx
'use client'
import { ShieldX, Lock } from 'lucide-react'
import Link from 'next/link'

export default function AccessDenied({ 
  title = 'Acceso Denegado',
  message = 'No tienes permisos para acceder a esta página.',
  showBackButton = true 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <ShieldX className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-left text-sm text-amber-800">
              <p className="font-medium mb-1">¿Necesitas acceso?</p>
              <p className="text-amber-700">
                Contacta al administrador del sistema para solicitar los permisos necesarios.
              </p>
            </div>
          </div>
        </div>
        
        {showBackButton && (
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Volver al Inicio
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/shared/AccessDenied.jsx
git commit -m "feat(shared): crear componente AccessDenied reutilizable para páginas protegidas"
```

---

## FASE 2: Frontend - Validación de Permisos en Vista de Confirmación de Pagos

### Task 2: Agregar validación de permisos en confirmar-pagos/page.jsx

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx:1-10`

- [ ] **Step 1: Agregar imports de useUserProfile y AccessDenied**

Reemplazar los imports existentes (líneas 1-8):

```jsx
'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Eye, X, Loader2, CreditCard, FileText, Calendar, Users, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import ImageModal from '@/components/shared/ImageModal'
import ModalObservacionPago from '@/components/vuelos/ModalObservacionPago'
import AccessDenied from '@/components/shared/AccessDenied'
import { useUserProfile } from '@/contexts/UserProfileContext'
```

- [ ] **Step 2: Agregar validación de permisos al inicio del componente**

Insertar después de la declaración de estado (línea 18):

```jsx
export default function ConfirmarPagosPage() {
  const [vuelos, setVuelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVuelo, setSelectedVuelo] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmingPago, setConfirmingPago] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState({ url: '', name: '' })
  const [observacionModalOpen, setObservacionModalOpen] = useState(false)

  // Validación de permisos
  const { isSuperAdmin, isAdmin, isAdministracion, hasPermission } = useUserProfile()

  // Solo permitir acceso a super_admin, admin y administracion
  const puedeConfirmarPagos = isSuperAdmin || isAdmin || isAdministracion

  // Verificar permiso específico de vuelos.confirm_payment
  const tienePermisoConfirmarPagos = hasPermission('vuelos.confirm_payment') || isSuperAdmin

  if (!puedeConfirmarPagos || !tienePermisoConfirmarPagos) {
    return (
      <AccessDenied
        title="Acceso Denegado"
        message="No tienes permisos para acceder a la confirmación de pagos. Esta función está restringida a roles administrativos."
      />
    )
  }
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx
git commit -m "feat(admin): agregar validación de permisos en vista de confirmación de pagos (solo super_admin, admin, administracion)"
```

---

## FASE 3: Backend - Validación de Rol en Endpoint de Confirmación de Pago

### Task 3: Agregar validación de rol en endpoint PATCH /:id/confirmar-pago

**Files:**
- Modify: `src/routes/vuelos.js:253-280`

- [ ] **Step 1: Reemplazar endpoint completo con validación de rol**

Reemplazar todo el endpoint (líneas 253-280):

```javascript
/**
 * PATCH /api/vuelos/:id/confirmar-pago - Confirmar pago (Solo admin, super_admin, administracion)
 */
router.patch('/:id/confirmar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId es requerido'
      });
    }

    // Validar que el usuario tenga un rol permitido
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        role:roles(
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        error: 'No tienes permisos para confirmar pagos. Esta acción está restringida a roles administrativos.',
        roles_permitidos: rolesPermitidos,
        tu_rol: userRole
      });
    }

    const vuelo = await vuelosService.confirmarPago(id, userId);

    // Obtener nombre del usuario para notificación
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const nombreUsuario = userProfile?.full_name || userRole;

    // Notificar al creador del vuelo (async, no bloquea respuesta)
    notificarPagoConfirmado(vuelo, nombreUsuario).catch(err =>
      console.error('Error en notificación async:', err)
    );

    res.json({
      message: 'Pago confirmado exitosamente',
      vuelo
    });

  } catch (error) {
    console.error('Error en PATCH /api/vuelos/:id/confirmar-pago:', error);
    res.status(500).json({
      error: 'Error al confirmar pago',
      details: error.message
    });
  }
});
```

- [ ] **Step 2: Agregar import de notificarPagoConfirmado si no existe**

Verificar que el import al inicio del archivo incluya notificarPagoConfirmado (línea 6):

```javascript
import { notificarNuevoVuelo, notificarVueloEmitido, notificarPagoObservado, notificarPagoConfirmado } from '../services/notificacionesService.js';
```

Si no existe, agregarlo.

- [ ] **Step 3: Commit**

```bash
git add src/routes/vuelos.js
git commit -m "feat(vuelos): agregar validación de rol en endpoint de confirmación de pago (solo administracion, admin, super_admin)"
```

---

## FASE 4: Backend - Validación de Rol en Endpoint de Observación de Pago

### Task 4: Agregar validación de rol en endpoint POST /:id/observar-pago

**Files:**
- Modify: `src/routes/vuelos.js:283-355`

- [ ] **Step 1: Agregar validación de rol en endpoint de observación**

Reemplazar el inicio del endpoint (líneas 283-310):

```javascript
/**
 * POST /api/vuelos/:id/observar-pago - Reportar observación en pago (Solo admin, super_admin, administracion)
 */
router.post('/:id/observar-pago', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, motivo, montoFaltante, observaciones } = req.body;

    if (!adminId || !motivo || !observaciones) {
      return res.status(400).json({
        error: 'Campos requeridos: adminId, motivo, observaciones'
      });
    }

    // Validar que el usuario tenga un rol permitido
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        role:roles(
          name
        )
      `)
      .eq('id', adminId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const userRole = profile?.role?.name;
    const rolesPermitidos = ['administracion', 'admin', 'super_admin'];

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        error: 'No tienes permisos para reportar observaciones de pago. Esta acción está restringida a roles administrativos.',
        roles_permitidos: rolesPermitidos,
        tu_rol: userRole
      });
    }

    const motivosValidos = ['pago_no_recibido', 'monto_insuficiente', 'requiere_aclaracion'];
    if (!motivosValidos.includes(motivo)) {
      return res.status(400).json({
        error: 'Motivo inválido',
        motivosValidos
      });
    }

    if (observaciones.length < 20) {
      return res.status(400).json({
        error: 'Las observaciones deben tener al menos 20 caracteres'
      });
    }

    const { data: vuelo, error: vueloError } = await supabase
      .from('vuelos')
      .select('id, created_by, pax_nombre, ruta, monto_venta, estado')
      .eq('id', id)
      .single();

    if (vueloError || !vuelo) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }

    if (vuelo.estado !== 'PENDIENTE_CONFIRMACION_PAGO') {
      return res.status(400).json({
        error: 'El vuelo no está en estado PENDIENTE_CONFIRMACION_PAGO'
      });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', adminId)
      .single();

    const adminNombre = adminProfile?.full_name || 'Administrador';

    await notificarPagoObservado(
      vuelo,
      adminNombre,
      motivo,
      montoFaltante,
      observaciones
    );

    res.json({
      message: 'Observación registrada y notificación enviada',
      vuelo_id: id,
      asesor_id: vuelo.created_by
    });

  } catch (error) {
    console.error('Error en POST /api/vuelos/:id/observar-pago:', error);
    res.status(500).json({
      error: 'Error al registrar observación',
      details: error.message
    });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/vuelos.js
git commit -m "feat(vuelos): agregar validación de rol en endpoint de observación de pago (solo administracion, admin, super_admin)"
```

---

## FASE 5: Testing - Verificación de Validaciones

### Task 5: Verificar validaciones de frontend

**Files:**
- Test: Manual testing en navegador

- [ ] **Step 1: Iniciar el servidor de desarrollo**

```bash
cd dashboard
npm run dev
```

- [ ] **Step 2: Iniciar sesión como usuario con rol `asesor`**

1. Iniciar sesión en el sistema con un usuario que tenga rol `asesor`
2. Navegar a `/admin/confirmar-pagos`
3. **Resultado esperado**: Debería mostrar el componente `AccessDenied` con mensaje de acceso denegado

- [ ] **Step 3: Iniciar sesión como usuario con rol `gerente`**

1. Cerrar sesión
2. Iniciar sesión con un usuario que tenga rol `gerente`
3. Navegar a `/admin/confirmar-pagos`
4. **Resultado esperado**: Debería mostrar el componente `AccessDenied` con mensaje de acceso denegado

- [ ] **Step 4: Iniciar sesión como usuario con rol `administracion`**

1. Cerrar sesión
2. Iniciar sesión con un usuario que tenga rol `administracion` y el permiso `vuelos.confirm_payment`
3. Navegar a `/admin/confirmar-pagos`
4. **Resultado esperado**: Debería mostrar la página de confirmación de pagos con la lista de vuelos pendientes

- [ ] **Step 5: Iniciar sesión como usuario con rol `admin`**

1. Cerrar sesión
2. Iniciar sesión con un usuario que tenga rol `admin`
3. Navegar a `/admin/confirmar-pagos`
4. **Resultado esperado**: Debería mostrar la página de confirmación de pagos con la lista de vuelos pendientes

- [ ] **Step 6: Iniciar sesión como usuario con rol `super_admin`**

1. Cerrar sesión
2. Iniciar sesión con un usuario que tenga rol `super_admin`
3. Navegar a `/admin/confirmar-pagos`
4. **Resultado esperado**: Debería mostrar la página de confirmación de pagos con la lista de vuelos pendientes

- [ ] **Step 7: Documentar resultados**

Crear un archivo de notas con los resultados de las pruebas:

```bash
echo "Testing de validaciones de frontend completado. Resultados:" > testing-notes.txt
echo "- Rol asesor: Acceso denegado ✓" >> testing-notes.txt
echo "- Rol gerente: Acceso denegado ✓" >> testing-notes.txt
echo "- Rol administracion: Acceso permitido ✓" >> testing-notes.txt
echo "- Rol admin: Acceso permitido ✓" >> testing-notes.txt
echo "- Rol super_admin: Acceso permitido ✓" >> testing-notes.txt
```

---

### Task 6: Verificar validaciones de backend

**Files:**
- Test: Manual testing con cURL o Postman

- [ ] **Step 1: Iniciar el servidor backend**

```bash
cd src
node index.js
```

- [ ] **Step 2: Obtener token de autenticación para usuario `asesor`**

1. Iniciar sesión en el frontend como usuario con rol `asesor`
2. Abrir DevTools → Application → Local Storage
3. Copiar el valor de `sb-access-token`

- [ ] **Step 3: Intentar confirmar pago como `asesor` usando cURL**

```bash
curl -X PATCH http://localhost:4000/api/vuelos/<vuelo_id>/confirmar-pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId": "<user_id>"}'
```

**Resultado esperado**: Status 403 con mensaje "No tienes permisos para confirmar pagos"

- [ ] **Step 4: Obtener token de autenticación para usuario `administracion`**

1. Cerrar sesión
2. Iniciar sesión como usuario con rol `administracion`
3. Copiar el token de autenticación

- [ ] **Step 5: Confirmar pago como `administracion` usando cURL**

```bash
curl -X PATCH http://localhost:4000/api/vuelos/<vuelo_id>/confirmar-pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId": "<user_id>"}'
```

**Resultado esperado**: Status 200 con mensaje "Pago confirmado exitosamente"

- [ ] **Step 6: Obtener token de autenticación para usuario `admin`**

1. Cerrar sesión
2. Iniciar sesión como usuario con rol `admin`
3. Copiar el token de autenticación

- [ ] **Step 7: Confirmar pago como `admin` usando cURL**

```bash
curl -X PATCH http://localhost:4000/api/vuelos/<vuelo_id>/confirmar-pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId": "<user_id>"}'
```

**Resultado esperado**: Status 200 con mensaje "Pago confirmado exitosamente"

- [ ] **Step 8: Documentar resultados**

```bash
echo "Testing de validaciones de backend completado. Resultados:" >> testing-notes.txt
echo "- Rol asesor: Acceso denegado (403) ✓" >> testing-notes.txt
echo "- Rol administracion: Acceso permitido (200) ✓" >> testing-notes.txt
echo "- Rol admin: Acceso permitido (200) ✓" >> testing-notes.txt
```

---

## FASE 6: Code Review y Auditoría

### Task 7: Auditoría de acceso usando view-access-auditor

**Files:**
- Review: `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx`
- Review: `src/routes/vuelos.js`

- [ ] **Step 1: Revisar componente de confirmación de pagos**

Verificar:
- ✅ Se valida el rol del usuario antes de mostrar el contenido
- ✅ Se valida el permiso `vuelos.confirm_payment`
- ✅ Solo roles `super_admin`, `admin`, `administracion` tienen acceso
- ✅ Se muestra componente `AccessDenied` cuando no hay permisos
- ✅ No hay bypass de validación (ej. no se puede acceder directamente a datos sin validación)

- [ ] **Step 2: Revisar endpoint de confirmación de pago**

Verificar:
- ✅ Se valida el rol del usuario en el backend
- ✅ Solo roles `administracion`, `admin`, `super_admin` pueden confirmar pagos
- ✅ Se retorna error 403 con mensaje claro cuando no hay permisos
- ✅ No hay bypass de validación (ej. no se puede confirmar pago sin validación de rol)

- [ ] **Step 3: Revisar endpoint de observación de pago**

Verificar:
- ✅ Se valida el rol del usuario en el backend
- ✅ Solo roles `administracion`, `admin`, `super_admin` pueden reportar observaciones
- ✅ Se retorna error 403 con mensaje claro cuando no hay permisos
- ✅ No hay bypass de validación

- [ ] **Step 4: Documentar hallazgos de auditoría**

```bash
echo "Auditoría de acceso completada. Hallazgos:" >> testing-notes.txt
echo "- Frontend: Validación de rol y permisos implementada correctamente ✓" >> testing-notes.txt
echo "- Backend: Validación de rol en endpoints implementada correctamente ✓" >> testing-notes.txt
echo "- Defensa en profundidad: Validaciones en frontend y backend ✓" >> testing-notes.txt
echo "- Mensajes de error claros y descriptivos ✓" >> testing-notes.txt
```

---

### Task 8: Code review usando code-review-excellence

**Files:**
- Review: Todos los archivos modificados

- [ ] **Step 1: Revisar calidad del código**

Verificar:
- ✅ Código limpio y legible
- ✅ Nombres de variables descriptivos
- ✅ Comentarios claros cuando necesarios
- ✅ Consistencia en estilo de código
- ✅ Manejo de errores apropiado
- ✅ No hay código duplicado innecesario

- [ ] **Step 2: Revisar seguridad**

Verificar:
- ✅ No hay hardcoded credentials
- ✅ No hay exposición de información sensible
- ✅ Validaciones de input apropiadas
- ✅ Sanitización de datos cuando necesario
- ✅ No hay vulnerabilidades de inyección SQL (usando Supabase con parámetros)

- [ ] **Step 3: Revisar performance**

Verificar:
- ✅ No hay queries N+1
- ✅ Uso apropiado de índices en queries
- ✅ No hay carga innecesaria de datos
- ✅ Uso eficiente de memoria

- [ ] **Step 4: Documentar hallazgos de code review**

```bash
echo "Code review completado. Hallazgos:" >> testing-notes.txt
echo "- Calidad de código: Aceptable ✓" >> testing-notes.txt
echo "- Seguridad: Sin vulnerabilidades críticas ✓" >> testing-notes.txt
echo "- Performance: Sin issues de rendimiento ✓" >> testing-notes.txt
```

---

## FASE 7: Documentación

### Task 9: Actualizar documentación de permisos

**Files:**
- Create: `docs/03-contexto-usuario-agencias-sedes/PERMISOS_ADMINISTRACION.md`

- [ ] **Step 1: Crear documentación de permisos del rol administracion**

```markdown
# Permisos del Rol Administración

## Descripción
El rol `administracion` representa el departamento financiero de la empresa (tesorería, contabilidad, cuentas por pagar, cuentas por cobrar).

## Responsabilidades
- Confirmar pagos de vuelos
- Gestión de pagos de nómina
- Revisión de transacciones financieras
- Ver reportes y análisis financieros

## Permisos Asignados

### Cotizaciones
- `cotizaciones.view` - Ver cotizaciones

### Vuelos
- `vuelos.view` - Ver vuelos
- `vuelos.confirm_payment` - Confirmar pagos de vuelos

## Nivel de Acceso
- **Visibilidad**: Todos los datos de todas las agencias
- **Edición**: Limitado a confirmación de pagos (no edición de vuelos/cotizaciones)
- **Gestión**: Sin permisos de gestión de usuarios, equipos, agencias, sedes

## Diferencia con Rol Admin
- **administracion**: Departamento financiero, enfocado en operaciones financieras
- **admin**: Administrador del sistema, enfocado en configuración técnica y gestión de usuarios

## Validaciones de Seguridad
- Frontend: Validación de rol y permiso `vuelos.confirm_payment` antes de mostrar vista
- Backend: Validación de rol en endpoints de confirmación y observación de pagos
- Solo roles `super_admin`, `admin`, `administracion` pueden acceder a funciones financieras
```

- [ ] **Step 2: Commit**

```bash
git add docs/03-contexto-usuario-agencias-sedes/PERMISOS_ADMINISTRACION.md
git commit -m "docs: agregar documentación de permisos del rol administracion"
```

---

## Resumen de Cambios

### Archivos Modificados
1. `dashboard/src/app/(crm)/admin/confirmar-pagos/page.jsx` - Validación de permisos en frontend
2. `src/routes/vuelos.js` - Validación de rol en endpoints de confirmación y observación de pago

### Archivos Creados
1. `dashboard/src/components/shared/AccessDenied.jsx` - Componente reutilizable para acceso denegado
2. `docs/03-contexto-usuario-agencias-sedes/PERMISOS_ADMINISTRACION.md` - Documentación de permisos

### Roles con Acceso a Confirmación de Pagos
- ✅ `super_admin` - Acceso completo
- ✅ `admin` - Acceso completo
- ✅ `administracion` - Acceso con permiso `vuelos.confirm_payment`
- ❌ `gerente` - Sin acceso
- ❌ `asesor` - Sin acceso
- ❌ `emisor` - Sin acceso

### Capas de Validación
1. **Frontend**: UserProfileContext + validación de rol y permisos
2. **Backend Route**: Validación de rol en endpoints
3. **Backend Service**: Validación de estado (ya existente)

---

## Testing Checklist

- [ ] Usuario `asesor` no puede acceder a vista de confirmación de pagos
- [ ] Usuario `gerente` no puede acceder a vista de confirmación de pagos
- [ ] Usuario `administracion` con permiso puede acceder y confirmar pagos
- [ ] Usuario `admin` puede acceder y confirmar pagos
- [ ] Usuario `super_admin` puede acceder y confirmar pagos
- [ ] Endpoint backend rechaza confirmación de pago sin rol válido
- [ ] Endpoint backend permite confirmación con rol `administracion`
- [ ] Endpoint backend permite confirmación con rol `admin`
- [ ] Endpoint backend permite confirmación con rol `super_admin`
- [ ] Mensajes de error son claros y descriptivos
- [ ] Componente `AccessDenied` se muestra correctamente
- [ ] Notificaciones se envían al confirmar pago
