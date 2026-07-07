# Control de Emisiones - Features Pendientes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar features pendientes del módulo Control de Emisiones: Dashboard con métricas, upload de comprobantes, notificación de recordatorio, paginación de deudas y logs de auditoría.

**Architecture:** Extensión del módulo existente Control de Emisiones con nuevas funcionalidades de reporting, storage de archivos, notificaciones adicionales, paginación de listados y trazabilidad de cambios.

**Tech Stack:** PostgreSQL, Supabase (Database + Storage + Realtime), Express.js, React, Next.js 14, TailwindCSS, Lucide Icons, Supabase Storage para comprobantes.

---

## Estado de Ejecución del Plan

**Fecha de última actualización:** 2026-04-22

### Fases Completadas ✅

- **FASE 1: Logs de Auditoría de Cambios de Estado** (Tasks 1-4) - COMPLETADA
  - Tabla auditoria_cambios_estado creada
  - Servicio auditoriaService.js implementado
  - Integración en emisionesService (autorizarEmision, rechazarEmision, marcarComoEmitido)
  - Endpoint GET /api/vuelos/:id/historial creado

- **FASE 2: Notificación Tipo recordatorio_autorizacion** (Tasks 5-8) - COMPLETADA
  - Tipo agregado al catálogo de notificaciones
  - Función notificarRecordatorioAutorizacion implementada
  - Icono agregado en frontend (NotificacionesCampana.jsx)
  - Endpoint POST /api/vuelos/:id/solicitar-autorizacion creado

- **FASE 3: Paginación en Lista de Deudas** (Tasks 9-10) - COMPLETADA
  - Paginación agregada a endpoint GET /api/deudas-proveedores
  - Frontend actualizado con controles de paginación

- **FASE 4: Upload de Comprobantes de Pago** (Tasks 11-15) - COMPLETADA
  - Bucket comprobantes-deudas creado en Supabase Storage (público, 10MB)
  - Servicio storageService.js creado con subirComprobantePago y eliminarComprobante
  - Multer integrado en endpoint POST /api/deudas-proveedores/pagos
  - Componente UploadComprobante creado en frontend
  - Upload integrado en página de deudas con FormData

- **FASE 5: Dashboard de Emisiones con Métricas** (Tasks 16-17) - COMPLETADA
  - Endpoint GET /api/metricas/emisiones creado con parámetro periodo
  - Métricas: autorizados, emitidos, pendientes, deudas por proveedor
  - Distribución por cuenta de emisión
  - Página Dashboard de Emisiones creada con cards de métricas
  - Selector de periodo (hoy, semana, mes)
  - Ruta agregada al sidebar con control de acceso por rol

### Fases Pendientes ⏳

- **FASE 6: Testing Final** (Tasks 18-19) - PENDIENTE
  - Crear tests de integración
  - Verificación final (tests, manual E2E, summary)

### Estado de Commits

**⚠️ IMPORTANTE:** Los cambios implementados en las fases 1, 2, 3, 4 y 5 AÚN NO han sido commitados. Solo falta ejecutar la FASE 6 y hacer los commits correspondientes.

Los archivos modificados/creados son:

**FASE 1:**
- `docs/05-base-de-datos/migrations/20260422_create_auditoria_cambios_estado.sql` (nuevo)
- `src/services/auditoriaService.js` (nuevo)
- `src/services/emisionesService.js` (modificado)
- `src/routes/vuelos.js` (modificado)

**FASE 2:**
- `.agents/skills/notification-types-catalog/SKILL.md` (modificado)
- `src/services/notificacionesService.js` (modificado)
- `dashboard/src/components/ui/NotificacionesCampana.jsx` (modificado)
- `src/routes/vuelos.js` (modificado)

**FASE 3:**
- `src/routes/deudas.js` (modificado)
- `dashboard/src/app/(crm)/admin/deudas/page.jsx` (modificado)

**FASE 4:**
- `src/services/storageService.js` (nuevo)
- `src/routes/deudas.js` (modificado - multer + upload)
- `dashboard/src/components/deudas/UploadComprobante.jsx` (nuevo)
- `dashboard/src/app/(crm)/admin/deudas/page.jsx` (modificado - integración upload)

**FASE 5:**
- `src/routes/metricas.js` (nuevo)
- `src/index.js` (modificado - registro ruta metricas)
- `dashboard/src/app/(crm)/admin/dashboard-emisiones/page.jsx` (nuevo)
- `dashboard/src/components/layout/Sidebar.jsx` (modificado - ruta dashboard + permisos)

**Instrucción para continuar:**
1. Commitar los cambios de las fases 1, 2, 3, 4 y 5 con mensajes apropiados
2. Continuar con FASE 6 en un nuevo chat/ sesión

---

---

## FASE 1: Logs de Auditoría de Cambios de Estado

### Task 1: Crear tabla de auditoría de cambios de estado

**Files:**
- Create: `docs/05-base-de-datos/migrations/20260422_create_auditoria_cambios_estado.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Tabla para auditar cambios de estado de vuelos
CREATE TABLE IF NOT EXISTS public.auditoria_cambios_estado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_tipo VARCHAR(50) NOT NULL,  -- 'vuelo', 'deuda', etc.
  entidad_id UUID NOT NULL,             -- ID de la entidad que cambió
  campo_cambiado VARCHAR(100) NOT NULL, -- 'estado', 'estado_emision', etc.
  valor_anterior VARCHAR(100),
  valor_nuevo VARCHAR(100) NOT NULL,
  usuario_id UUID REFERENCES public.profiles(id),
  usuario_nombre VARCHAR(255),
  razon_cambio TEXT,                   -- Motivo del cambio
  ip_address INET,
  fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_auditoria_entidad ON public.auditoria_cambios_estado(entidad_tipo, entidad_id);
CREATE INDEX idx_auditoria_fecha ON public.auditoria_cambios_estado(fecha_cambio DESC);
CREATE INDEX idx_auditoria_usuario ON public.auditoria_cambios_estado(usuario_id);

-- Comentario de tabla
COMMENT ON TABLE public.auditoria_cambios_estado IS 'Auditoría de cambios de estado en entidades del sistema';
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Run: Ejecutar el SQL en Supabase Dashboard → SQL Editor
Expected: Tabla creada exitosamente sin errores

- [ ] **Step 3: Commit**

```bash
git add docs/05-base-de-datos/migrations/20260422_create_auditoria_cambios_estado.sql
git commit -m "feat(auditoria): Crear tabla auditoria_cambios_estado

- Nueva tabla para trazabilidad de cambios de estado
- Índices por entidad, fecha y usuario
- Soporte para múltiples tipos de entidades (vuelo, deuda, etc.)"
```

---

### Task 2: Crear servicio de auditoría

**Files:**
- Create: `src/services/auditoriaService.js`

- [ ] **Step 1: Write the service implementation**

```javascript
import { supabase } from '../config/supabase.js';

/**
 * Registrar un cambio de estado en auditoría
 */
export async function registrarCambioEstado({
  entidadTipo,      // 'vuelo', 'deuda', etc.
  entidadId,        // UUID de la entidad
  campoCambiado,    // 'estado', 'estado_emision', etc.
  valorAnterior,    // Valor antes del cambio
  valorNuevo,       // Valor después del cambio
  usuarioId,        // UUID del usuario que hizo el cambio
  usuarioNombre,    // Nombre del usuario
  razonCambio,      // Motivo del cambio (opcional)
  ipAddress         // IP del usuario (opcional)
}) {
  try {
    const { data, error } = await supabase
      .from('auditoria_cambios_estado')
      .insert({
        entidad_tipo: entidadTipo,
        entidad_id: entidadId,
        campo_cambiado: campoCambiado,
        valor_anterior: valorAnterior,
        valor_nuevo: valorNuevo,
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre,
        razon_cambio: razonCambio,
        ip_address: ipAddress
      })
      .select()
      .single();

    if (error) {
      console.error('Error registrando auditoría:', error);
      throw error;
    }

    console.log(`✅ Auditoría registrada: ${entidadTipo}:${entidadId} - ${campoCambiado}: ${valorAnterior} → ${valorNuevo}`);
    return data;
  } catch (error) {
    // No bloquear el flujo principal si falla auditoría
    console.error('Error en auditoría (no bloqueante):', error.message);
    return null;
  }
}

/**
 * Obtener historial de cambios de una entidad
 */
export async function obtenerHistorialCambios(entidadTipo, entidadId) {
  try {
    const { data, error } = await supabase
      .from('auditoria_cambios_estado')
      .select('*')
      .eq('entidad_tipo', entidadTipo)
      .eq('entidad_id', entidadId)
      .order('fecha_cambio', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
}

export default {
  registrarCambioEstado,
  obtenerHistorialCambios
};
```

- [ ] **Step 2: Test the service manually**

Run: Node REPL o crear test simple
```javascript
import auditoriaService from './src/services/auditoriaService.js';

await auditoriaService.registrarCambioEstado({
  entidadTipo: 'vuelo',
  entidadId: 'test-uuid',
  campoCambiado: 'estado',
  valorAnterior: 'PENDIENTE',
  valorNuevo: 'EMITIDO',
  usuarioId: 'user-uuid',
  usuarioNombre: 'Test User',
  razonCambio: 'Prueba de auditoría'
});
```
Expected: Registro insertado en tabla auditoria_cambios_estado

- [ ] **Step 3: Commit**

```bash
git add src/services/auditoriaService.js
git commit -m "feat(auditoria): Crear servicio de auditoría

- registrarCambioEstado() para registrar cambios
- obtenerHistorialCambios() para ver historial
- Manejo de errores no bloqueante
- Logs de auditoría en consola"
```

---

### Task 3: Integrar auditoría en emisionesService

**Files:**
- Modify: `src/services/emisionesService.js`

- [ ] **Step 1: Add import and integrate in autorizarEmision**

```javascript
import { registrarCambioEstado } from './auditoriaService.js';

// En la función autorizarEmision, después de actualizar el vuelo:
await registrarCambioEstado({
  entidadTipo: 'vuelo',
  entidadId: vuelo.id,
  campoCambiado: 'estado_emision',
  valorAnterior: vuelo.estado_emision,
  valorNuevo: 'autorizado_pendiente_emision',
  usuarioId: autorizadoPor,
  usuarioNombre: adminNombre,
  razonCambio: observaciones
});
```

- [ ] **Step 2: Integrate in rechazarEmision**

```javascript
// En la función rechazarEmision, después de actualizar el vuelo:
await registrarCambioEstado({
  entidadTipo: 'vuelo',
  entidadId: vuelo.id,
  campoCambiado: 'estado_emision',
  valorAnterior: vuelo.estado_emision,
  valorNuevo: 'rechazado',
  usuarioId: rechazadoPor,
  usuarioNombre: adminNombre,
  razonCambio: motivo
});
```

- [ ] **Step 3: Integrate in marcarComoEmitido**

```javascript
// En la función marcarComoEmitido, después de actualizar el vuelo:
await registrarCambioEstado({
  entidadTipo: 'vuelo',
  entidadId: vuelo.id,
  campoCambiado: 'estado',
  valorAnterior: vuelo.estado,
  valorNuevo: 'EMITIDO',
  usuarioId: emitidoPor,
  usuarioNombre: emisorNombre,
  razonCambio: 'Vuelo emitido exitosamente'
});
```

- [ ] **Step 4: Test the integration**

Run: Ejecutar autorización de emisión desde API
Expected: Vuelo autorizado Y registro en auditoria_cambios_estado

- [ ] **Step 5: Commit**

```bash
git add src/services/emisionesService.js
git commit -m "feat(auditoria): Integrar auditoría en emisionesService

- Registrar cambios en autorizarEmision
- Registrar cambios en rechazarEmision
- Registrar cambios en marcarComoEmitido
- Trazabilidad completa de cambios de estado"
```

---

### Task 4: Crear endpoint para ver historial de cambios

**Files:**
- Modify: `src/routes/vuelos.js`

- [ ] **Step 1: Add GET endpoint for historial**

```javascript
import { obtenerHistorialCambios } from '../services/auditoriaService.js';

// GET /api/vuelos/:id/historial
router.get('/:id/historial', async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await obtenerHistorialCambios('vuelo', id);

    res.json({
      historial,
      total: historial.length
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 2: Test the endpoint**

Run: `curl http://localhost:3000/api/vuelos/:id/historial`
Expected: JSON con array de cambios ordenados por fecha

- [ ] **Step 3: Commit**

```bash
git add src/routes/vuelos.js
git commit -m "feat(auditoria): Agregar endpoint para ver historial de cambios

- GET /api/vuelos/:id/historial
- Retorna array de cambios ordenados por fecha
- Incluye usuario, razón y valores antes/después"
```

---

## FASE 2: Notificación Tipo recordatorio_autorizacion

### Task 5: Agregar tipo de notificación al catálogo

**Files:**
- Modify: `.agents/skills/notification-types-catalog/SKILL.md`

- [ ] **Step 1: Add new notification type to catalog**

```markdown
## Tipo: recordatorio_autorizacion

### Descripción
Notifica a administración cuando Johan (emisor) solicita autorización para emitir un vuelo específico.

### Cuándo Usar
- Cuando el emisor solicita autorización de emisión
- Cuando se requiere aprobación rápida para un vuelo
- En endpoints POST /api/vuelos/:id/solicitar-autorizacion

### Metadatos Requeridos

```javascript
datos: {
  vuelo_id: uuid,              // ID del vuelo
  solicitante_nombre: string,  // Nombre del solicitante (Johan)
  ruta: string,                // Ruta del vuelo
  cuenta_emision: string,      // Cuenta de emisión asignada
  precio_base: number,         // Precio base del vuelo
  localizador: string,         // Localizador de la reserva
}
```

### Metadatos Opcionales

```javascript
datos: {
  // ... requeridos
  accion_requerida: string     // Acción que debe tomar admin
}
```

### Icono Sugerido
```jsx
<Bell className="w-4 h-4 text-purple-500" />
```

### Ejemplo de Payload Completo

```javascript
{
  user_id: "user-uuid-admin",
  tipo: "recordatorio_autorizacion",
  titulo: "📌 Solicitud de autorización de emisión",
  descripcion: "Johan Viajes solicita autorización para emitir el vuelo LIM-MIA. Favor revisar saldo en Servivuelo 1.",
  datos: {
    vuelo_id: "550e8400-e29b-41d4-a716-446655440000",
    solicitante_nombre: "Johan Viajes",
    ruta: "LIM-MIA",
    cuenta_emision: "SERVIVUELO_1",
    precio_base: 718.00,
    localizador: "858K9A",
    accion_requerida: "Revisar saldo y autorizar emisión"
  }
}
```

### Referencia en Código
- Función: `notificarRecordatorioAutorizacion()` en `src/services/notificacionesService.js`
```

- [ ] **Step 2: Update index at top of catalog**

```markdown
## Índice de Tipos

1. **vuelo_creado** - Notificación cuando se crea un nuevo vuelo
2. **vuelo_emitido** - Notificación cuando un vuelo es marcado como emitido
3. **pago_observado** - Notificación cuando un admin observa un pago
4. **pago_confirmado** - Notificación cuando un admin confirma un pago
5. **recordatorio_autorizacion** - Notificación cuando emisor solicita autorización
```

- [ ] **Step 3: Update statistics**

```markdown
## Estadísticas de Tipos

- **Total de tipos activos:** 5
- **Última actualización:** 2026-04-22
- **Tipos por dominio:
  - Vuelos: 3 (vuelo_creado, vuelo_emitido, recordatorio_autorizacion)
  - Pagos: 2 (pago_observado, pago_confirmado)
```

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/notification-types-catalog/SKILL.md
git commit -m "docs(notifications): Agregar tipo recordatorio_autorizacion al catálogo

- Nuevo tipo para solicitudes de autorización de emisor
- Metadatos requeridos y opcionales documentados
- Icono sugerido (Bell púrpura)
- Ejemplo de payload completo"
```

---

### Task 6: Implementar función de notificación

**Files:**
- Modify: `src/services/notificacionesService.js`

- [ ] **Step 1: Add function to service**

```javascript
/**
 * Notificar a administración cuando emisor solicita autorización
 */
export async function notificarRecordatorioAutorizacion(vuelo, solicitanteNombre) {
  try {
    // Obtener usuarios con rol administracion, admin o super_admin
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .in('rol', ['administracion', 'admin', 'super_admin']);

    if (error || !admins || admins.length === 0) {
      console.warn('No se encontraron administradores para notificar');
      return;
    }

    const ruta = vuelo.ruta || 'sin ruta';
    const cuentaEmision = vuelo.cuenta_emision_asignada || 'N/A';
    const precioBase = vuelo.precio_base || 0;
    const localizador = vuelo.localizador || 'N/A';

    const notificaciones = admins.map(admin => ({
      user_id: admin.id,
      tipo: 'recordatorio_autorizacion',
      titulo: '📌 Solicitud de autorización de emisión',
      descripcion: `${solicitanteNombre} solicita autorización para emitir el vuelo ${ruta}. Favor revisar saldo en ${cuentaEmision}.`,
      datos: {
        vuelo_id: vuelo.id,
        solicitante_nombre: solicitanteNombre,
        ruta,
        cuenta_emision: cuentaEmision,
        precio_base: precioBase,
        localizador,
        accion_requerida: 'Revisar saldo y autorizar emisión'
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificación de recordatorio enviada a ${admins.length} administradores`);
  } catch (err) {
    console.error('Error enviando notificación de recordatorio:', err.message);
  }
}
```

- [ ] **Step 2: Add to exports**

```javascript
export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado,
  notificarPagoConfirmado,
  notificarEmisionAutorizada,
  notificarDeudaGenerada,
  notificarRecordatorioAutorizacion
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/notificacionesService.js
git commit -m "feat(notifications): Implementar notificarRecordatorioAutorizacion

- Notificar a todos los admins cuando emisor solicita autorización
- Incluye datos del vuelo, cuenta y localizador
- Acción requerida clara en payload"
```

---

### Task 7: Agregar icono en frontend

**Files:**
- Modify: `dashboard/src/components/ui/NotificacionesCampana.jsx`

- [ ] **Step 1: Add icon mapping**

```javascript
function iconoTipo(tipo) {
  if (tipo === 'vuelo_creado') return <Plane className="w-4 h-4 text-blue-500" />
  if (tipo === 'vuelo_emitido') return <CheckCheck className="w-4 h-4 text-green-500" />
  if (tipo === 'pago_observado') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  if (tipo === 'pago_confirmado') return <CheckCircle className="w-4 h-4 text-green-500" />
  if (tipo === 'recordatorio_autorizacion') return <Bell className="w-4 h-4 text-purple-500" />
  return <Info className="w-4 h-4 text-gray-400" />
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/ui/NotificacionesCampana.jsx
git commit -m "feat(notifications): Agregar icono para recordatorio_autorizacion

- Icono Bell púrpura para solicitudes de autorización
- Mapeo en iconoTipo()"
```

---

### Task 8: Crear endpoint para solicitar autorización

**Files:**
- Modify: `src/routes/vuelos.js`

- [ ] **Step 1: Add POST endpoint**

```javascript
import { notificarRecordatorioAutorizacion } from '../services/notificacionesService.js';

// POST /api/vuelos/:id/solicitar-autorizacion
router.post('/:id/solicitar-autorizacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Obtener vuelo
    const { data: vuelo, error: vueloError } = await supabase
      .from('vuelos')
      .select('*')
      .eq('id', id)
      .single();

    if (vueloError || !vuelo) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }

    // Obtener nombre del solicitante
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const solicitanteNombre = profile?.full_name || 'Usuario';

    // Enviar notificación a admins
    await notificarRecordatorioAutorizacion(vuelo, solicitanteNombre);

    res.json({
      message: 'Solicitud de autorización enviada a administración',
      vuelo_id: id
    });
  } catch (error) {
    console.error('Error solicitando autorización:', error);
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 2: Test the endpoint**

Run: `curl -X POST http://localhost:3000/api/vuelos/:id/solicitar-autorizacion -H "Content-Type: application/json" -d '{"userId":"user-uuid"}'`
Expected: Notificaciones creadas para todos los admins

- [ ] **Step 3: Commit**

```bash
git add src/routes/vuelos.js
git commit -m "feat(emissions): Agregar endpoint para solicitar autorización

- POST /api/vuelos/:id/solicitar-autorizacion
- Notifica a todos los admins cuando emisor solicita
- Incluye nombre del solicitante en notificación"
```

---

## FASE 3: Paginación en Lista de Deudas

### Task 9: Agregar paginación a endpoint de deudas

**Files:**
- Modify: `src/routes/deudas.js`

- [ ] **Step 1: Modify GET endpoint to support pagination**

```javascript
// GET /api/deudas-proveedores
router.get('/', async (req, res) => {
  try {
    const { 
      proveedor, 
      estado, 
      grupo_por,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Query base con paginación
    let query = supabase
      .from('deudas_proveedores')
      .select(`
        *,
        vuelo:vuelos(id, ruta, pax_nombre, estado)
      `,
      { count: 'exact' }
      );

    // Filtros
    if (proveedor) {
      query = query.eq('proveedor', proveedor);
    }
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Paginación
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Calcular totales
    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      deudas: data || [],
      pagination: {
        current_page: parseInt(page),
        per_page: limitNum,
        total,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error listando deudas:', error);
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 2: Test pagination**

Run: `curl "http://localhost:3000/api/deudas-proveedores?page=1&limit=10"`
Expected: JSON con array de deudas y metadata de paginación

- [ ] **Step 3: Commit**

```bash
git add src/routes/deudas.js
git commit -m "feat(debts): Agregar paginación a endpoint de deudas

- Query params: page, limit
- Retorna metadata de paginación (total, totalPages, has_next, has_prev)
- Usar select count exact para total exacto"
```

---

### Task 10: Actualizar frontend para usar paginación

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/deudas-proveedores/page.jsx`

- [ ] **Step 1: Add pagination state**

```javascript
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(20)
const [totalItems, setTotalItems] = useState(0)
const [totalPages, setTotalPages] = useState(1)

// Modificar cargarDeudas para usar paginación
const cargarDeudas = async () => {
  setLoading(true)
  try {
    const response = await fetch(
      `/api/deudas-proveedores?page=${currentPage}&limit=${itemsPerPage}${
        filtroEstado ? `&estado=${filtroEstado}` : ''
      }${
        filtroProveedor ? `&proveedor=${filtroProveedor}` : ''
      }`
    )
    if (!response.ok) throw new Error('Error cargando deudas')

    const data = await response.json()
    setDeudas(data.deudas)
    setTotalItems(data.pagination.total)
    setTotalPages(data.pagination.total_pages)
  } catch (error) {
    console.error('Error:', error)
    toast.error('Error cargando deudas')
  } finally {
    setLoading(false)
  }
}

// Recargar cuando cambia página o filtros
useEffect(() => {
  cargarDeudas()
}, [currentPage, filtroEstado, filtroProveedor])
```

- [ ] **Step 2: Add pagination controls UI**

```javascript
{/* Controles de paginación */}
<div className="flex items-center justify-between mt-6">
  <div className="text-sm text-gray-600">
    Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} deudas
  </div>
  
  <div className="flex items-center gap-2">
    <button
      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
    >
      Anterior
    </button>
    
    <span className="px-4 py-2">
      Página {currentPage} de {totalPages}
    </span>
    
    <button
      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
      disabled={currentPage === totalPages}
      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
    >
      Siguiente
    </button>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/deudas-proveedores/page.jsx
git commit -m "feat(debts): Agregar UI de paginación en frontend

- Estado de página y límites
- Controles de Anterior/Siguiente
- Indicador de rango mostrado (1-20 de 100)
- Recarga automática al cambiar página"
```

---

## FASE 4: Upload de Comprobantes de Pago

### Task 11: Crear bucket en Supabase Storage

**Files:**
- None (manual step in Supabase Dashboard)

- [ ] **Step 1: Create bucket in Supabase Dashboard**

Run: 
1. Ir a Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `comprobantes-deudas`
4. Public bucket: NO (private)
5. File size limit: 5MB
6. Allowed MIME types: PDF, PNG, JPG, JPEG

Expected: Bucket creado exitosamente

- [ ] **Step 2: Configure RLS policies**

Run: SQL en Supabase SQL Editor

```sql
-- Política para permitir upload a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir comprobantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comprobantes-deudas'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver comprobantes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprobantes-deudas'
);
```

Expected: Políticas creadas sin errores

---

### Task 12: Crear servicio de upload de archivos

**Files:**
- Create: `src/services/storageService.js`

- [ ] **Step 1: Write storage service**

```javascript
import { supabase } from '../config/supabase.js';

/**
 * Subir comprobante de pago
 */
export async function subirComprobantePago(file, deudaId, userId) {
  try {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo PDF, PNG, JPG.');
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 5MB.');
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop();
    const fileName = `${deudaId}/${Date.now()}.${fileExt}`;

    // Subir archivo
    const { data, error } = await supabase
      .storage
      .from('comprobantes-deudas')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('comprobantes-deudas')
      .getPublicUrl(fileName);

    console.log(`✅ Comprobante subido: ${publicUrl}`);
    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    throw error;
  }
}

/**
 * Eliminar comprobante
 */
export async function eliminarComprobante(path) {
  try {
    const { error } = await supabase
      .storage
      .from('comprobantes-deudas')
      .remove([path]);

    if (error) throw error;

    console.log(`✅ Comprobante eliminado: ${path}`);
    return true;
  } catch (error) {
    console.error('Error eliminando comprobante:', error);
    throw error;
  }
}

export default {
  subirComprobantePago,
  eliminarComprobante
};
```

- [ ] **Step 2: Test upload manually**

Run: Crear test simple en Node REPL
```javascript
import { subirComprobantePago } from './src/services/storageService.js';

const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
await subirComprobantePago(file, 'deuda-uuid', 'user-uuid');
```
Expected: Archivo subido y URL retornada

- [ ] **Step 3: Commit**

```bash
git add src/services/storageService.js
git commit -m "feat(storage): Crear servicio de upload de archivos

- subirComprobantePago() con validaciones
- Validación de tipo (PDF, PNG, JPG)
- Validación de tamaño (max 5MB)
- Generación de nombre único con timestamp
- eliminarComprobante() para cleanup"
```

---

### Task 13: Integrar upload en registro de pagos

**Files:**
- Modify: `src/routes/deudas.js`

- [ ] **Step 1: Add multer for file uploads**

Run: `npm install multer`

- [ ] **Step 2: Modify POST /api/pagos-deudas to handle file upload**

```javascript
import multer from 'multer';
import { subirComprobantePago } from '../services/storageService.js';

// Configurar multer para memoria (no guardar en disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// POST /api/pagos-deudas (con upload de archivo)
router.post('/', upload.single('comprobante'), async (req, res) => {
  try {
    const { deuda_id, monto_pagado, metodo_pago, referencia_pago, fecha_pago, observaciones } = req.body;
    const userId = req.user?.id;

    if (!deuda_id || !monto_pagado || !fecha_pago) {
      return res.status(400).json({ error: 'deuda_id, monto_pagado y fecha_pago son requeridos' });
    }

    // Subir comprobante si se proporcionó
    let comprobanteUrl = null;
    if (req.file) {
      const uploadResult = await subirComprobantePago(
        req.file,
        deuda_id,
        userId
      );
      comprobanteUrl = uploadResult.url;
    }

    // Crear registro de pago
    const { data: pago, error: pagoError } = await supabase
      .from('pagos_deudas')
      .insert({
        deuda_id,
        monto_pagado: parseFloat(monto_pagado),
        metodo_pago,
        referencia_pago,
        comprobante_url: comprobanteUrl,
        fecha_pago,
        registrado_por: userId,
        observaciones
      })
      .select()
      .single();

    if (pagoError) throw pagoError;

    // Actualizar deuda
    const { data: deudaActual } = await supabase
      .from('deudas_proveedores')
      .select('monto_deuda, saldo_pendiente')
      .eq('id', deuda_id)
      .single();

    const nuevoSaldo = deudaActual.saldo_pendiente - pago.monto_pagado;
    const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO_TOTAL' : 'PAGADO_PARCIAL';

    await supabase
      .from('deudas_proveedores')
      .update({
        saldo_pendiente: Math.max(0, nuevoSaldo),
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', deuda_id);

    res.json({
      message: 'Pago registrado exitosamente',
      pago,
      deuda_actualizada: {
        saldo_pendiente: Math.max(0, nuevoSaldo),
        estado: nuevoEstado
      }
    });
  } catch (error) {
    console.error('Error registrando pago:', error);
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 3: Test file upload endpoint**

Run: 
```bash
curl -X POST http://localhost:3000/api/pagos-deudas \
  -F "comprobante=@/path/to/file.pdf" \
  -F "deuda_id=uuid" \
  -F "monto_pagado=500" \
  -F "fecha_pago=2026-04-22"
```
Expected: Pago creado con URL de comprobante

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/routes/deudas.js
git commit -m "feat(debts): Integrar upload de comprobantes en registro de pagos

- Configurar multer para manejo de archivos
- Validación de tipo y tamaño en backend
- Subida a Supabase Storage bucket comprobantes-deudas
- Guardar URL en tabla pagos_deudas"
```

---

### Task 14: Crear componente de upload en frontend

**Files:**
- Create: `dashboard/src/components/deudas/UploadComprobante.jsx`

- [ ] **Step 1: Write upload component**

```javascript
'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UploadComprobante({ onUploadComplete, disabled = false }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Solo se permiten archivos PDF, PNG o JPG')
      setFile(null)
      return
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('El archivo no puede exceder 5MB')
      setFile(null)
      return
    }

    setError(null)
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Upload via API endpoint
      const response = await fetch('/api/upload-comprobante', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error subiendo archivo')
      }

      const data = await response.json()
      
      toast.success('Comprobante subido exitosamente')
      onUploadComplete(data.url)
      setFile(null)
    } catch (error) {
      console.error('Error:', error)
      setError('Error subiendo archivo. Intente nuevamente.')
      toast.error('Error subiendo comprobante')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={disabled || uploading}
            className="hidden"
            id="comprobante-input"
          />
          
          <label
            htmlFor="comprobante-input"
            className={`cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">
              Click para subir comprobante
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, PNG o JPG (máx. 5MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-3 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo...' : 'Subir Comprobante'}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/deudas/UploadComprobante.jsx
git commit -m "feat(debts): Crear componente UploadComprobante

- UI para seleccionar y subir archivos
- Validación de tipo (PDF, PNG, JPG) y tamaño (5MB)
- Preview del archivo seleccionado
- Estado de upload con feedback visual"
```

---

### Task 15: Integrar upload en página de deudas

**Files:**
- Modify: `dashboard/src/app/(crm)/admin/deudas-proveedores/page.jsx`

- [ ] **Step 1: Add upload component to modal**

```javascript
import UploadComprobante from '@/components/deudas/UploadComprobante'

// En el modal de registrar pago, agregar:
<UploadComprobante
  onUploadComplete={(url) => {
    setFormData(prev => ({ ...prev, comprobante_url: url }))
  }}
  disabled={registrandoPago}
/>
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/app/(crm)/admin/deudas-proveedores/page.jsx
git commit -m "feat(debts): Integrar upload de comprobante en registro de pago

- Agregar componente UploadComprobante en modal
- Guardar URL del comprobante en formData
- Mostrar preview del archivo subido"
```

---

## FASE 5: Dashboard de Emisiones con Métricas

### Task 16: Crear endpoint de métricas

**Files:**
- Create: `src/routes/metricas.js`

- [ ] **Step 1: Write metrics endpoint**

```javascript
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/metricas/emisiones
router.get('/emisiones', async (req, res) => {
  try {
    const { periodo = 'semana' } = req.query;

    // Calcular fecha de inicio según periodo
    const ahora = new Date();
    let fechaInicio;
    
    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7));
        break;
      case 'mes':
        fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 1));
        break;
      default:
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7));
    }

    // Métricas de autorizaciones
    const { data: vuelosAutorizados, error: errorAutorizados } = await supabase
      .from('vuelos')
      .select('id, cuenta_emision_asignada, fecha_autorizacion_emision')
      .eq('autorizado_emision', true)
      .gte('fecha_autorizacion_emision', fechaInicio.toISOString());

    // Métricas de emisiones completadas
    const { data: vuelosEmitidos, error: errorEmitidos } = await supabase
      .from('vuelos')
      .select('id, cuenta_emision_asignada, updated_at')
      .eq('estado', 'EMITIDO')
      .gte('updated_at', fechaInicio.toISOString());

    // Vuelos pendientes de autorización
    const { data: vuelosPendientes, error: errorPendientes } = await supabase
      .from('vuelos')
      .select('id, cuenta_emision_asignada')
      .eq('autorizado_emision', false)
      .in('estado', ['PENDIENTE_EMISION']);

    // Deudas por proveedor
    const { data: deudas, error: errorDeudas } = await supabase
      .from('deudas_proveedores')
      .select('proveedor, monto_deuda, saldo_pendiente, estado')
      .in('estado', ['PENDIENTE', 'PAGADO_PARCIAL']);

    // Distribución por cuenta
    const distribucionCuenta = {};
    vuelosAutorizados?.forEach(v => {
      const cuenta = v.cuenta_emision_asignada || 'Sin cuenta';
      distribucionCuenta[cuenta] = (distribucionCuenta[cuenta] || 0) + 1;
    });

    // Deudas por proveedor
    const deudasPorProveedor = {};
    deudas?.forEach(d => {
      const proveedor = d.proveedor;
      if (!deudasPorProveedor[proveedor]) {
        deudasPorProveedor[proveedor] = {
          total: 0,
          pendiente: 0
        };
      }
      deudasPorProveedor[proveedor].total += d.monto_deuda;
      deudasPorProveedor[proveedor].pendiente += d.saldo_pendiente;
    });

    res.json({
      periodo,
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: new Date().toISOString(),
      autorizados: {
        total: vuelosAutorizados?.length || 0,
        por_cuenta: distribucionCuenta
      },
      emitidos: {
        total: vuelosEmitidos?.length || 0
      },
      pendientes: {
        total: vuelosPendientes?.length || 0
      },
      deudas: {
        por_proveedor: deudasPorProveedor,
        total_pendiente: Object.values(deudasPorProveedor).reduce((sum, d) => sum + d.pendiente, 0)
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

- [ ] **Step 2: Register route in server**

**Files:**
- Modify: `src/server.js`

```javascript
import metricasRouter from './routes/metricas.js';

app.use('/api/metricas', metricasRouter);
```

- [ ] **Step 3: Test metrics endpoint**

Run: `curl http://localhost:3000/api/metricas/emisiones?periodo=semana`
Expected: JSON con métricas de autorizados, emitidos, pendientes y deudas

- [ ] **Step 4: Commit**

```bash
git add src/routes/metricas.js src/server.js
git commit -m "feat(metrics): Crear endpoint de métricas de emisiones

- GET /api/metricas/emisiones con parametro periodo
- Métricas: autorizados, emitidos, pendientes
- Distribución por cuenta de emisión
- Deudas agrupadas por proveedor
- Soporte para periodos: hoy, semana, mes"
```

---

### Task 17: Crear página de Dashboard

**Files:**
- Create: `dashboard/src/app/(crm)/admin/dashboard-emisiones/page.jsx`

- [ ] **Step 1: Write dashboard page with metrics**

```javascript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Plane, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  CreditCard,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function DashboardEmisiones() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('semana')

  // Validar acceso
  useEffect(() => {
    if (!profile) return

    const rolesPermitidos = ['administracion', 'admin', 'super_admin']
    if (!rolesPermitidos.includes(profile.rol)) {
      toast.error('No tienes permisos para acceder a esta página')
      router.push('/')
    }
  }, [profile, router])

  // Cargar métricas
  const cargarMetricas = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/metricas/emisiones?periodo=${periodo}`)
      if (!response.ok) throw new Error('Error cargando métricas')

      const data = await response.json()
      setMetricas(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error cargando métricas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarMetricas()
  }, [periodo])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Emisiones</h1>
          <p className="text-gray-600 mt-1">Métricas y estadísticas del módulo de emisiones</p>
        </div>
        
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="hoy">Hoy</option>
          <option value="semana">Esta Semana</option>
          <option value="mes">Este Mes</option>
        </select>
      </div>

      {/* Cards de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Vuelos Autorizados"
          value={metricas?.autorizados?.total || 0}
          icon={<CheckCircle className="w-8 h-8" />}
          color="from-green-500 to-green-600"
          description="Autorizados para emisión"
        />
        
        <MetricCard
          title="Vuelos Emitidos"
          value={metricas?.emitidos?.total || 0}
          icon={<Plane className="w-8 h-8" />}
          color="from-blue-500 to-blue-600"
          description="Boletos confirmados"
        />
        
        <MetricCard
          title="Pendientes de Autorización"
          value={metricas?.pendientes?.total || 0}
          icon={<Clock className="w-8 h-8" />}
          color="from-amber-500 to-amber-600"
          description="Esperando aprobación"
        />
      </div>

      {/* Deudas por proveedor */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Deudas por Proveedor
        </h2>
        
        {Object.keys(metricas?.deudas?.por_proveedor || {}).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay deudas activas</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(metricas.deudas.por_proveedor).map(([proveedor, datos]) => (
              <DeudaCard
                key={proveedor}
                proveedor={proveedor}
                total={datos.total}
                pendiente={datos.pendiente}
              />
            ))}
          </div>
        )}
      </div>

      {/* Distribución por cuenta */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Distribución por Cuenta de Emisión
        </h2>
        
        {Object.keys(metricas?.autorizados?.por_cuenta || {}).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(metricas.autorizados.por_cuenta)
              .sort(([, a], [, b]) => b - a)
              .map(([cuenta, cantidad]) => (
                <CuentaRow
                  key={cuenta}
                  cuenta={cuenta}
                  cantidad={cantidad}
                  total={metricas.autorizados.total}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color, description }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-lg">
          {icon}
        </div>
        <span className="text-sm font-medium opacity-80">{description}</span>
      </div>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-sm opacity-80 mt-1">{title}</p>
    </div>
  )
}

function DeudaCard({ proveedor, total, pendiente }) {
  const porcentajePendiente = total > 0 ? (pendiente / total) * 100 : 0

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">{proveedor}</h3>
        <DollarSign className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total adeudado:</span>
          <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Pendiente:</span>
          <span className="font-bold text-amber-600">${pendiente.toFixed(2)}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${porcentajePendiente}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function CuentaRow({ cuenta, cantidad, total }) {
  const porcentaje = total > 0 ? (cantidad / total) * 100 : 0

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="font-medium text-gray-900">{cuenta}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{cantidad} vuelos</span>
        <span className="text-sm font-bold text-indigo-600">{porcentaje.toFixed(1)}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add route to sidebar**

**Files:**
- Modify: `dashboard/src/components/layout/Sidebar.jsx`

```javascript
{
  label: 'Dashboard Emisiones',
  href: '/admin/dashboard-emisiones',
  icon: <BarChart3 className="w-5 h-5" />,
  roles: ['administracion', 'admin', 'super_admin']
}
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/(crm)/admin/dashboard-emisiones/page.jsx
git add dashboard/src/components/layout/Sidebar.jsx
git commit -m "feat(dashboard): Crear página Dashboard de Emisiones

- Cards de métricas principales (autorizados, emitidos, pendientes)
- Sección de deudas por proveedor con barras de progreso
- Distribución por cuenta de emisión
- Selector de periodo (hoy, semana, mes)
- UI moderna con gradientes y cards"
```

---

## FASE 6: Testing Final

### Task 18: Crear tests de integración

**Files:**
- Create: `tests/integration/features-pendientes.test.js`

- [ ] **Step 1: Write integration tests**

```javascript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../src/server.js'

describe('Features Pendientes - Integration Tests', () => {
  let authToken
  let vueloId
  let deudaId

  beforeAll(async () => {
    // Login y setup inicial
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' })
    authToken = loginRes.body.token
  })

  describe('Auditoría de Cambios', () => {
    test('registro de auditoría al autorizar emisión', async () => {
      const res = await request(app)
        .patch(`/api/vuelos/${vueloId}/autorizar-emision`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          autorizado_por: 'admin-uuid',
          observaciones: 'Test'
        })

      expect(res.status).toBe(200)

      // Verificar que se creó registro en auditoría
      const historialRes = await request(app)
        .get(`/api/vuelos/${vueloId}/historial`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(historialRes.body.historial.length).toBeGreaterThan(0)
      expect(historialRes.body.historial[0].campo_cambiado).toBe('estado_emision')
    })

    test('obtener historial de cambios', async () => {
      const res = await request(app)
        .get(`/api/vuelos/${vueloId}/historial`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.historial).toBeInstanceOf(Array)
      expect(res.body.total).toBe(res.body.historial.length)
    })
  })

  describe('Notificación de Recordatorio', () => {
    test('solicitar autorización envía notificación', async () => {
      const res = await request(app)
        .post(`/api/vuelos/${vueloId}/solicitar-autorizacion`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-uuid' })

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('Solicitud enviada')
    })
  })

  describe('Paginación de Deudas', () => {
    test('endpoint soporta paginación', async () => {
      const res = await request(app)
        .get('/api/deudas-proveedores?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.pagination.current_page).toBe(1)
      expect(res.body.pagination.per_page).toBe(10)
    })

    test('metadata de paginación correcta', async () => {
      const res = await request(app)
        .get('/api/deudas-proveedores?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.body.pagination.total_pages).toBeGreaterThanOrEqual(1)
      expect(res.body.pagination.has_next_page).toBeDefined()
      expect(res.body.pagination.has_prev_page).toBeDefined()
    })
  })

  describe('Métricas de Emisiones', () => {
    test('endpoint retorna métricas', async () => {
      const res = await request(app)
        .get('/api/metricas/emisiones?periodo=semana')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.autorizados).toBeDefined()
      expect(res.body.emitidos).toBeDefined()
      expect(res.body.pendientes).toBeDefined()
      expect(res.body.deudas).toBeDefined()
    })

    test('cambio de periodo afecta resultados', async () => {
      const semanaRes = await request(app)
        .get('/api/metricas/emisiones?periodo=semana')
        .set('Authorization', `Bearer ${authToken}`)

      const mesRes = await request(app)
        .get('/api/metricas/emisiones?periodo=mes')
        .set('Authorization', `Bearer ${authToken}`)

      expect(mesRes.body.autorizados.total).toBeGreaterThanOrEqual(
        semanaRes.body.autorizados.total
      )
    })
  })
})
```

- [ ] **Step 2: Run integration tests**

Run: `npm test tests/integration/features-pendientes.test.js`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration/features-pendientes.test.js
git commit -m "test(features): Crear tests de integración para features pendientes

- Tests de auditoría de cambios
- Tests de notificación de recordatorio
- Tests de paginación de deudas
- Tests de métricas de emisiones
- Validación de metadata de paginación"
```

---

### Task 19: Verificación final

**Files:**
- None (verification step)

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass (0 failures)

- [ ] **Step 2: Verify database migrations applied**

Run: SQL en Supabase Dashboard
```sql
SELECT COUNT(*) FROM auditoria_cambios_estado;
SELECT COUNT(*) FROM deudas_proveedores;
```
Expected: Tablas existen y tienen datos

- [ ] **Step 3: Verify Supabase Storage bucket exists**

Run: Supabase Dashboard → Storage
Expected: Bucket `comprobantes-deudas` existe con políticas RLS

- [ ] **Step 4: Manual E2E verification**

Run: 
1. Login como admin
2. Navegar a `/admin/dashboard-emisiones`
3. Verificar que cargan métricas
4. Cambiar periodo y verificar que se actualizan
5. Navegar a `/admin/deudas-proveedores`
6. Verificar paginación funciona
7. Registrar pago con comprobante
8. Verificar historial de cambios de un vuelo
9. Solicitar autorización y verificar notificación

Expected: All features work as expected

- [ ] **Step 5: Create summary document**

**Files:**
- Create: `docs/FEATURES-PENDIENTES-IMPLEMENTATION-SUMMARY.md`

```markdown
# Resumen de Implementación - Features Pendientes

**Fecha:** 22 de Abril de 2026  
**Features Implementados:**

## 1. Logs de Auditoría de Cambios de Estado
- Tabla `auditoria_cambios_estado` creada
- Servicio `auditoriaService.js` con funciones de registro y consulta
- Integración en `emisionesService.js` para autorizar, rechazar y emitir
- Endpoint `GET /api/vuelos/:id/historial`

## 2. Notificación Tipo recordatorio_autorizacion
- Tipo agregado al catálogo de notificaciones
- Función `notificarRecordatorioAutorizacion()` implementada
- Icono Bell púrpura en frontend
- Endpoint `POST /api/vuelos/:id/solicitar-autorizacion`

## 3. Paginación en Lista de Deudas
- Endpoint `GET /api/deudas-proveedores` con query params page/limit
- Metadata de paginación (total, totalPages, has_next, has_prev)
- Frontend con controles de Anterior/Siguiente
- Indicador de rango mostrado

## 4. Upload de Comprobantes de Pago
- Bucket `comprobantes-deudas` en Supabase Storage
- Servicio `storageService.js` con validaciones
- Integración en endpoint `POST /api/pagos-deudas`
- Componente `UploadComprobante.jsx` en frontend
- Validación de tipo (PDF, PNG, JPG) y tamaño (5MB)

## 5. Dashboard de Emisiones con Métricas
- Endpoint `GET /api/metricas/emisiones`
- Página `/admin/dashboard-emisiones`
- Cards de métricas principales
- Deudas por proveedor con barras de progreso
- Distribución por cuenta de emisión
- Selector de periodo (hoy, semana, mes)

## Testing
- Tests de integración creados
- Verificación manual E2E completada
- Todas las funcionalidades probadas

## Próximos Pasos
- Monitorizar uso de dashboard en producción
- Revisar performance de métricas con más datos
- Considerar agregar más métricas según feedback
```

- [ ] **Step 6: Final commit**

```bash
git add docs/FEATURES-PENDIENTES-IMPLEMENTATION-SUMMARY.md
git commit -m "docs(features): Agregar resumen de implementación

- Documentación de features implementados
- Lista de archivos modificados/creados
- Resumen de testing completado
- Próximos pasos sugeridos"
```

---

## Resumen del Plan

### Fases Implementadas:
1. **FASE 1:** Logs de Auditoría de Cambios de Estado (4 tareas)
2. **FASE 2:** Notificación Tipo recordatorio_autorizacion (4 tareas)
3. **FASE 3:** Paginación en Lista de Deudas (2 tareas)
4. **FASE 4:** Upload de Comprobantes de Pago (5 tareas)
5. **FASE 5:** Dashboard de Emisiones con Métricas (2 tareas)
6. **FASE 6:** Testing Final (2 tareas)

**Total de tareas:** 19 tareas

**Archivos creados:**
- 4 migraciones SQL
- 3 nuevos servicios (auditoriaService, storageService, metricas)
- 3 nuevos componentes frontend (UploadComprobante, Dashboard)
- 1 archivo de tests

**Archivos modificados:**
- emisionesService.js (integración auditoría)
- notificacionesService.js (nuevo tipo)
- vuelos.js (nuevos endpoints)
- deudas.js (paginación + upload)
- server.js (registro de rutas)
- NotificacionesCampana.jsx (icono)
- Sidebar.jsx (nueva ruta)

**Tecnologías usadas:**
- PostgreSQL (auditoría)
- Supabase Storage (comprobantes)
- Supabase Realtime (notificaciones)
- Express.js (API endpoints)
- React/Next.js (frontend)
- TailwindCSS (styling)
- Lucide Icons (iconos)
- Multer (file uploads)

**NO usado:**
- Redis (como solicitado por usuario)
