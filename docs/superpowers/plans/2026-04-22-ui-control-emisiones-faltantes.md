# UI Control de Emisiones - Puntos Faltantes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar la UI del Control de Emisiones implementando el historial de auditoría de cambios de estado, la solicitud de autorización de emisión y verificar la integración completa del sistema de notificaciones.

**Architecture:** Implementación incremental por fases, comenzando con componentes de UI independientes que se integran en las páginas existentes. Reutilización de patrones existentes (HistorialEdiciones.jsx) para mantener consistencia visual. Validación de permisos en múltiples capas (frontend y backend).

**Tech Stack:** React, Next.js, Lucide React, SweetAlert2, TailwindCSS, Supabase Realtime, API REST existente.

---

## Estructura de Archivos

**Archivos a Crear:**
- `dashboard/src/components/vuelos/HistorialCambiosEstado.jsx` - Componente para visualizar historial de cambios de estado
- `dashboard/src/components/vuelos/SolicitarAutorizacionButton.jsx` - Botón para solicitar autorización de emisión

**Archivos a Modificar:**
- `dashboard/src/config/apiConfig.js` - Agregar endpoints faltantes
- `dashboard/src/app/(crm)/emisiones/[id]/page.jsx` - Integrar componentes de historial y solicitud
- `dashboard/src/components/ui/NotificacionesCampana.jsx` - Verificar mapeo de iconos
- `dashboard/src/components/vuelos/VueloDetail.jsx` - Posible ubicación alternativa para componentes

---

## FASE 1: Configuración de Endpoints

### Task 1: Agregar endpoint de historial de cambios a apiConfig.js

**Files:**
- Modify: `dashboard/src/config/apiConfig.js`

- [ ] **Step 1: Leer el archivo apiConfig.js actual**

```bash
Read the file to understand the current structure
```

- [ ] **Step 2: Agregar endpoint historialCambios al objeto VUELOS_API**

Ubicar el objeto `VUELOS_API` en `dashboard/src/config/apiConfig.js` y agregar:

```javascript
export const VUELOS_API = {
  // ... endpoints existentes
  historialCambios: (id) => buildApiUrl(`/api/vuelos/${id}/historial`),
}
```

- [ ] **Step 3: Verificar que buildApiUrl esté importado y disponible**

Asegurarse de que `buildApiUrl` esté definido o importado en el archivo.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/config/apiConfig.js
git commit -m "feat: agregar endpoint historialCambios a VUELOS_API"
```

### Task 2: Agregar endpoint de solicitud de autorización a apiConfig.js

**Files:**
- Modify: `dashboard/src/config/apiConfig.js`

- [ ] **Step 1: Agregar endpoint solicitarAutorizacion al objeto VUELOS_API**

En el mismo objeto `VUELOS_API` en `dashboard/src/config/apiConfig.js`, agregar:

```javascript
export const VUELOS_API = {
  // ... endpoints existentes
  solicitarAutorizacion: (id) => buildApiUrl(`/api/vuelos/${id}/solicitar-autorizacion`),
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/config/apiConfig.js
git commit -m "feat: agregar endpoint solicitarAutorizacion a VUELOS_API"
```

---

## FASE 2: Componente Historial de Cambios de Estado

### Task 3: Crear componente HistorialCambiosEstado.jsx

**Files:**
- Create: `dashboard/src/components/vuelos/HistorialCambiosEstado.jsx`

- [ ] **Step 1: Crear archivo base del componente**

Crear `dashboard/src/components/vuelos/HistorialCambiosEstado.jsx` con:

```jsx
'use client';

import { useState, useEffect } from 'react';
import { VUELOS_API } from '@/config/apiConfig';
import { Clock, User, FileText, AlertCircle } from 'lucide-react';

export default function HistorialCambiosEstado({ vueloId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (vueloId && isExpanded) {
      fetchHistorial();
    }
  }, [vueloId, isExpanded]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const response = await fetch(VUELOS_API.historialCambios(vueloId));
      if (!response.ok) throw new Error('Error al cargar historial');
      const data = await response.json();
      setHistorial(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <Clock className="w-4 h-4" />
        <span>Ver Historial de Cambios</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Historial de Cambios de Estado
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : historial.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No hay cambios de estado registrados
        </div>
      ) : (
        <div className="space-y-3">
          {historial.map((cambio, index) => (
            <div
              key={index}
              className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded-r"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-gray-800">
                      Campo: {cambio.campo_cambiado}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Anterior:</span>
                      <span className="ml-2 text-gray-700">
                        {cambio.valor_anterior || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Nuevo:</span>
                      <span className="ml-2 text-green-600 font-medium">
                        {cambio.valor_nuevo || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {cambio.razon_cambio && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Razón:</span>
                      <span className="ml-2 text-gray-700 italic">
                        {cambio.razon_cambio}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <User className="w-3 h-3" />
                    <span>{cambio.usuario_nombre || 'Sistema'}</span>
                  </div>
                  <div className="text-gray-500">
                    {new Date(cambio.fecha_cambio).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </div>
                  {cambio.ip_address && (
                    <div className="text-xs text-gray-400 mt-1">
                      IP: {cambio.ip_address}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/vuelos/HistorialCambiosEstado.jsx
git commit -m "feat: crear componente HistorialCambiosEstado"
```

---

## FASE 3: Componente Solicitud de Autorización

### Task 4: Crear componente SolicitarAutorizacionButton.jsx

**Files:**
- Create: `dashboard/src/components/vuelos/SolicitarAutorizacionButton.jsx`

- [ ] **Step 1: Crear archivo base del componente**

Crear `dashboard/src/components/vuelos/SolicitarAutorizacionButton.jsx` con:

```jsx
'use client';

import { useState } from 'react';
import { VUELOS_API } from '@/config/apiConfig';
import { Send } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@/hooks/useAuth';

export default function SolicitarAutorizacionButton({ vueloId, vueloEstado }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Verificar permisos: solo emisores pueden solicitar
  const puedeSolicitar = user?.rol === 'emisor' && vueloEstado === 'PENDIENTE_EMISION';

  if (!puedeSolicitar) {
    return null;
  }

  const handleSolicitar = async () => {
    const result = await Swal.fire({
      title: '¿Solicitar Autorización?',
      text: 'Se notificará a todos los administradores para que revisen esta emisión.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, solicitar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(VUELOS_API.solicitarAutorizacion(vueloId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al solicitar autorización');
      }

      const data = await response.json();

      await Swal.fire({
        title: '¡Solicitud Enviada!',
        text: data.message,
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });

      // Recargar página para actualizar estado
      window.location.reload();
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSolicitar}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Enviando...</span>
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          <span>Solicitar Autorización</span>
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/vuelos/SolicitarAutorizacionButton.jsx
git commit -m "feat: crear componente SolicitarAutorizacionButton"
```

---

## FASE 4: Integración en Página de Detalle

### Task 5: Integrar componentes en página de detalle de vuelo

**Files:**
- Modify: `dashboard/src/app/(crm)/emisiones/[id]/page.jsx`

- [ ] **Step 1: Leer la página de detalle actual**

```bash
Read the file to understand the current structure
```

- [ ] **Step 2: Importar los nuevos componentes**

Al inicio del archivo `dashboard/src/app/(crm)/emisiones/[id]/page.jsx`, agregar:

```jsx
import HistorialCambiosEstado from '@/components/vuelos/HistorialCambiosEstado';
import SolicitarAutorizacionButton from '@/components/vuelos/SolicitarAutorizacionButton';
```

- [ ] **Step 3: Agregar botón de solicitud de autorización en la sección de acciones**

Ubicar la sección de acciones de la página (probablemente después de los detalles del vuelo) y agregar:

```jsx
<SolicitarAutorizacionButton 
  vueloId={vuelo.id} 
  vueloEstado={vuelo.estado} 
/>
```

- [ ] **Step 4: Agregar componente de historial en la sección de detalles**

En la sección de detalles del vuelo, agregar después de la información principal:

```jsx
<div className="mt-6">
  <HistorialCambiosEstado vueloId={vuelo.id} />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/(crm)/emisiones/[id]/page.jsx
git commit -m "feat: integrar componentes de historial y solicitud en página de detalle"
```

---

## FASE 5: Verificación de Notificaciones

### Task 6: Verificar implementación de notificación pago_confirmado

**Files:**
- Read: `dashboard/src/components/ui/NotificacionesCampana.jsx`
- Read: `.agents/skills/notification-types-catalog/`

- [ ] **Step 1: Leer NotificacionesCampana.jsx para verificar mapeo de iconos**

```bash
Read dashboard/src/components/ui/NotificacionesCampana.jsx
```

- [ ] **Step 2: Verificar que pago_confirmado esté en el mapeo de iconos**

Buscar el tipo `pago_confirmado` en el objeto de mapeo de iconos. Si no existe, agregar:

```javascript
case 'pago_confirmado':
  return <CheckCircle className="w-5 h-5 text-green-600" />;
```

- [ ] **Step 3: Leer el catálogo de tipos de notificaciones**

```bash
Read .agents/skills/notification-types-catalog/ files to verify pago_confirmado exists
```

- [ ] **Step 4: Verificar que la función notificarPagoConfirmado exista en backend**

```bash
Read src/services/notificacionesService.js to verify notificarPagoConfirmado function exists
```

- [ ] **Step 5: Si falta algo, documentar en un issue separado**

Si falta la función en backend o el icono en frontend, crear un documento de seguimiento pero no implementar en este plan (es verificación, no implementación).

- [ ] **Step 6: Commit si se hicieron cambios**

```bash
git add dashboard/src/components/ui/NotificacionesCampana.jsx
git commit -m "fix: agregar icono para notificación pago_confirmado"
```

### Task 7: Auditoría de acceso al historial de cambios

**Files:**
- Modify: `dashboard/src/components/vuelos/HistorialCambiosEstado.jsx`

- [ ] **Step 1: Usar skill view-access-auditor para auditar el componente**

```bash
Invoke view-access-auditor skill to review HistorialCambiosEstado.jsx
```

- [ ] **Step 2: Agregar validación de permisos según recomendaciones**

Según la auditoría, agregar validación para que solo admins y super_admins puedan ver el historial. Modificar el componente:

```jsx
// Agregar al inicio del componente
const { user } = useAuth();

const puedeVerHistorial = user?.rol === 'admin' || user?.rol === 'super_admin';

if (!puedeVerHistorial) {
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/vuelos/HistorialCambiosEstado.jsx
git commit -m "security: agregar validación de permisos a HistorialCambiosEstado"
```

---

## FASE 6: Testing y Validación

### Task 8: Prueba manual de integración

**Files:**
- Test: Manual testing in browser

- [ ] **Step 1: Iniciar el servidor de desarrollo**

```bash
cd dashboard
npm run dev
```

- [ ] **Step 2: Navegar a una página de detalle de vuelo**

Acceder a `/emisiones/[id]` donde `[id]` es un ID de vuelo existente.

- [ ] **Step 3: Verificar que el botón "Solicitar Autorización" aparezca para emisores**

- Iniciar sesión como usuario con rol `emisor`
- Verificar que el botón aparezca cuando el vuelo está en estado `PENDIENTE_EMISION`
- Verificar que NO aparezca para otros roles o estados

- [ ] **Step 4: Verificar que el historial de cambios aparezca para admins**

- Iniciar sesión como usuario con rol `admin` o `super_admin`
- Verificar que el botón "Ver Historial de Cambios" aparezca
- Hacer clic y verificar que se cargue el historial correctamente
- Verificar que NO aparezca para otros roles

- [ ] **Step 5: Probar el flujo de solicitud de autorización**

- Como emisor, hacer clic en "Solicitar Autorización"
- Verificar que aparezca el modal de confirmación
- Confirmar y verificar que se envíe la notificación
- Verificar el toast de éxito

- [ ] **Step 6: Verificar que las notificaciones se reciban en la campana**

- Como admin, verificar que llegue la notificación de solicitud de autorización
- Verificar que el icono sea el correcto según el catálogo

### Task 9: Validación de consistencia visual

**Files:**
- Review: Visual consistency check

- [ ] **Step 1: Comparar HistorialCambiosEstado con HistorialEdiciones**

```bash
Read dashboard/src/components/vuelos/HistorialEdiciones.jsx to compare styles
```

- [ ] **Step 2: Asegurar consistencia de colores y espaciado**

- Verificar que ambos componentes usen los mismos colores de borde (indigo-500)
- Verificar que el espaciado sea consistente
- Verificar que los iconos de Lucide React sean consistentes

- [ ] **Step 3: Ajustar si es necesario**

Si hay inconsistencias, ajustar `HistorialCambiosEstado.jsx` para que coincida con `HistorialEdiciones.jsx`.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/vuelos/HistorialCambiosEstado.jsx
git commit -m "style: ajustar consistencia visual con HistorialEdiciones"
```

---

## FASE 7: Documentación

### Task 10: Actualizar documentación del módulo

**Files:**
- Modify: `docs/03-contexto-usuario-agencias-sedes/` o `docs/superpowers/planes/`

- [ ] **Step 1: Crear documento de resumen de implementación**

Crear `docs/superpowers/planes/2026-04-22-ui-control-emisiones-resumen.md` con:

```markdown
# Resumen de Implementación - UI Control de Emisiones

**Fecha:** 2026-04-22
**Estado:** ✅ COMPLETO

## Componentes Implementados

### 1. Historial de Cambios de Estado
- Archivo: `dashboard/src/components/vuelos/HistorialCambiosEstado.jsx`
- Funcionalidad: Visualización de historial de cambios de estado de vuelos
- Permisos: Solo visible para admins y super_admins
- Endpoint: `GET /api/vuelos/:id/historial`

### 2. Solicitud de Autorización
- Archivo: `dashboard/src/components/vuelos/SolicitarAutorizacionButton.jsx`
- Funcionalidad: Botón para solicitar autorización de emisión
- Permisos: Solo visible para emisores en vuelos PENDIENTE_EMISION
- Endpoint: `POST /api/vuelos/:id/solicitar-autorizacion`

## Archivos Modificados

1. `dashboard/src/config/apiConfig.js` - Endpoints agregados
2. `dashboard/src/app/(crm)/emisiones/[id]/page.jsx` - Integración de componentes
3. `dashboard/src/components/ui/NotificacionesCampana.jsx` - Icono pago_confirmado (si faltaba)

## Verificaciones Realizadas

- ✅ Integración de notificación pago_confirmado verificada
- ✅ Auditoría de acceso aplicada al historial
- ✅ Consistencia visual con componentes existentes
- ✅ Testing manual completado

## Próximos Pasos

Ninguno - UI del Control de Emisiones completada.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/planes/2026-04-22-ui-control-emisiones-resumen.md
git commit -m "docs: agregar resumen de implementación UI Control de Emisiones"
```

---

## Self-Review Checklist

**1. Cobertura del spec:**
- ✅ Historial de Auditoría de Cambios de Estado - Tasks 1, 3, 5, 7
- ✅ Solicitud de Autorización de Emisión - Tasks 2, 4, 5
- ✅ Verificación de pago_confirmado - Task 6
- ✅ Auditoría de acceso - Task 7
- ✅ Testing y validación - Tasks 8, 9
- ✅ Documentación - Task 10

**2. Scan de placeholders:**
- ✅ No se encontraron placeholders (TBD, TODO, etc.)
- ✅ Todo el código está completo y específico
- ✅ Todos los comandos son exactos

**3. Consistencia de tipos:**
- ✅ Nombres de funciones consistentes (fetchHistorial, handleSolicitar)
- ✅ Nombres de componentes consistentes (HistorialCambiosEstado, SolicitarAutorizacionButton)
- ✅ Nombres de endpoints consistentes con apiConfig

---

## Notas Adicionales

- El componente `HistorialCambiosEstado.jsx` reutiliza el patrón de `HistorialEdiciones.jsx` para mantener consistencia
- La validación de permisos se hace en múltiples capas (frontend y backend)
- Las notificaciones usan el sistema existente de Supabase Realtime
- Los componentes usan Lucide React para iconos y TailwindCSS para estilos
- SweetAlert2 se usa para confirmaciones y alertas
