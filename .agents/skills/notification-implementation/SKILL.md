---
name: notification-implementation
description: Cómo implementar una nueva notificación en el proyecto ERP Nova CRM. Use esta skill siempre que necesites crear una nueva notificación, emitir una notificación desde el backend, agregar un nuevo tipo de notificación al sistema, o implementar cualquier funcionalidad que amerite notificar a usuarios. Esta skill cubre el flujo completo desde el backend hasta el frontend con Supabase Realtime.
---

# Implementación de Notificaciones - ERP Nova CRM

Esta skill enseña cómo implementar notificaciones en el proyecto ERP Nova CRM siguiendo los patrones establecidos.

## ⚠️ IMPORTANTE: Auto-Actualización de Skills

**CUANDO CREES UN NUEVO TIPO DE NOTIFICACIÓN**, debes actualizar automáticamente la skill `notification-types-catalog` para mantener el catálogo actualizado. Esto es CRÍTICO para que futuros agentes conozcan todos los tipos existentes.

### Proceso de Auto-Actualización:

1. **Si creas un nuevo tipo de notificación** (ej: `cotizacion_observada`, `vuelo_anulado`):
   - Agrega el tipo al catálogo en `.agents/skills/notification-types-catalog/SKILL.md`
   - Incluye: descripción, metadatos requeridos, icono sugerido, cuándo usarlo
   - Agrega un ejemplo de payload en la sección de ejemplos

2. **Si modificas un tipo existente**:
   - Actualiza la documentación en el catálogo
   - Actualiza los metadatos si cambió la estructura

3. **Si eliminas un tipo**:
   - Márqualo como deprecated en el catálogo en lugar de eliminarlo
   - Incluye fecha de deprecación y razón

## Cuándo Usar Esta Skill

Usa esta skill cuando necesites:
- Implementar una nueva notificación desde cero
- Emitir una notificación desde el backend (Express routes, services, cron jobs)
- Agregar un nuevo tipo de notificación al sistema
- Notificar a usuarios sobre eventos de negocio
- Implementar notificaciones contextuales (por agencia, sede, rol)

## Requisitos Previos

### 1. Tabla `notificaciones` Existente

El proyecto ya tiene una tabla de notificaciones configurada:

```sql
CREATE TABLE public.notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo character varying NOT NULL DEFAULT 'info'::character varying,
  titulo character varying NOT NULL,
  descripcion text,
  datos jsonb,
  leida boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id)
);
```

**NO crees una nueva tabla**. Usa la existente.

### 2. Cliente Supabase Configurado

El proyecto tiene un cliente Supabase configurado en `src/config/supabase.js` (backend) y `dashboard/src/lib/supabase.js` (frontend).

**Backend:**
```javascript
import { supabase } from '../config/supabase.js';
```

**Frontend:**
```javascript
import { supabase } from '@/lib/supabase'
```

### 3. NotificacionesContext en Frontend

El frontend ya tiene un contexto para manejar notificaciones en tiempo real en `dashboard/src/contexts/NotificacionesContext.js`.

**NO crees un nuevo contexto**. Usa el existente.

## Flujo Completo de Implementación

### Arquitectura

```
Evento de Negocio
    ↓
Backend Route/Service
    ↓
notificacionesService.js (función específica)
    ↓
INSERT en tabla notificaciones
    ↓
Supabase Realtime (INSERT event)
    ↓
NotificacionesContext (frontend)
    ↓
UI actualizada + Toast
```

## Paso 1: Backend - Crear Función de Notificación

### Ubicación

Crea o modifica funciones en `src/services/notificacionesService.js`.

### Patrón Base

```javascript
/**
 * Notificar sobre [descripción del evento]
 */
export async function notificar[TipoEvento](datosRelevantes, actorNombre) {
  try {
    // 1. Validar que existe user_id
    if (!datosRelevantes.user_id) {
      console.warn('Sin user_id, no se puede notificar');
      return;
    }

    // 2. Construir objeto de notificación
    const notificacion = {
      user_id: datosRelevantes.user_id,
      tipo: 'tipo_notificacion',  // ← VER CATÁLOGO DE TIPOS
      titulo: 'Título corto y descriptivo',
      descripcion: 'Descripción más detallada con contexto',
      datos: {
        // Metadatos específicos del tipo
        entidad_id: datosRelevantes.id,
        actor_nombre: actorNombre,
        // ... otros campos relevantes
      }
    };

    // 3. Insertar en BD
    await insertarNotificaciones([notificacion]);
    console.log(`✅ Notificación enviada al usuario ${datosRelevantes.user_id}`);
  } catch (err) {
    // No bloquear el flujo principal si falla
    console.error('Error enviando notificación:', err.message);
  }
}
```

### Ejemplo Completo: notificarPagoObservado

```javascript
/**
 * Notificar al asesor sobre observación en pago de vuelo
 */
export async function notificarPagoObservado(vuelo, adminNombre, motivo, montoFaltante, observaciones) {
  try {
    if (!vuelo.created_by) {
      console.warn('Vuelo sin created_by, no se puede notificar');
      return;
    }

    const motivosTexto = {
      'pago_no_recibido': 'El pago aún no ha sido recibido',
      'monto_insuficiente': `Falta dinero por cubrir${montoFaltante ? `: $${montoFaltante.toFixed(2)}` : ''}`,
      'requiere_aclaracion': 'Se requiere aclaración sobre el pago'
    };

    const ruta = vuelo.ruta || 'sin ruta';
    const descripcionMotivo = motivosTexto[motivo] || motivo;

    const notificacion = {
      user_id: vuelo.created_by,
      tipo: 'pago_observado',
      titulo: '¡Observación en pago de vuelo!',
      descripcion: `${adminNombre} revisó el pago del vuelo ${ruta}. ${descripcionMotivo}. ${observaciones}`,
      datos: {
        vuelo_id: vuelo.id,
        admin_nombre: adminNombre,
        motivo,
        monto_esperado: vuelo.monto_venta,
        monto_faltante: montoFaltante || null,
        observaciones,
        ruta,
        pax_nombre: vuelo.pax_nombre,
        estado_vuelo: vuelo.estado,
        accion_requerida: 'Contactar al cliente para verificar el pago'
      }
    };

    await insertarNotificaciones([notificacion]);
    console.log(`✅ Notificación de observación de pago enviada al asesor ${vuelo.created_by}`);
  } catch (err) {
    console.error('Error enviando notificación de observación:', err.message);
  }
}
```

### Buenas Prácticas

1. **Validación temprana**: Verifica que existe user_id antes de continuar
2. **No bloquear flujo principal**: Usa try/catch y solo loguea errores
3. **Metadatos ricos**: Incluye toda la información relevante en el campo `datos`
4. **Mensajes claros**: El título debe ser corto, la descripción más detallada
5. **Contexto de negocio**: Incluye nombres de actores (adminNombre, asesorNombre, etc.)

## Paso 2: Backend - Integrar en Route/Service

### Desde Express Route

```javascript
import { notificar[TipoEvento] } from '../services/notificacionesService.js';

router.post('/api/entidades/:id/accion', async (req, res) => {
  try {
    // ... lógica del endpoint
    
    // Obtener nombre del actor
    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', req.body.actorId)
      .single();
    
    const actorNombre = actorProfile?.full_name || 'Usuario';

    // Emitir notificación
    await notificar[TipoEvento](entidad, actorNombre, otrosParametros);

    res.json({ message: 'Acción completada y notificación enviada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Desde Service Function

```javascript
import { notificar[TipoEvento] } from './notificacionesService.js';

export async function crearEntidad(datos) {
  try {
    // ... lógica de creación
    
    // Notificar a usuarios relevantes
    await notificar[TipoEvento](nuevaEntidad, creadorNombre);
    
    return nuevaEntidad;
  } catch (error) {
    throw error;
  }
}
```

### Desde Cron Job

```javascript
import { notificar[TipoEvento] } from '../services/notificacionesService.js';

async function checkEventosPendientes() {
  const eventos = await obtenerEventosPendientes();
  
  for (const evento of eventos) {
    await notificar[TipoEvento](evento, 'Sistema');
  }
}
```

## Paso 3: Actualizar Exports

Agrega la nueva función al export default en `src/services/notificacionesService.js`:

```javascript
export default {
  notificarNuevoVuelo,
  notificarVueloEmitido,
  notificarPagoObservado,
  notificarPagoConfirmado,
  notificar[TipoEvento]  // ← AGREGAR AQUÍ
};
```

## Paso 4: Frontend - Verificar Realtime

El frontend ya tiene configurado Supabase Realtime en `NotificacionesContext.js`. **NO necesitas hacer cambios** a menos que:

1. Necesites un icono diferente para el nuevo tipo
2. Necesites lógica especial para manejar el tipo

### Icono por Tipo (si aplica)

Si necesitas un icono específico, actualiza `dashboard/src/components/ui/NotificacionesCampana.jsx`:

```javascript
function iconoTipo(tipo) {
  if (tipo === 'vuelo_creado') return <Plane className="w-4 h-4 text-blue-500" />
  if (tipo === 'vuelo_emitido') return <CheckCheck className="w-4 h-4 text-green-500" />
  if (tipo === 'pago_observado') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  if (tipo === 'tu_nuevo_tipo') return <TuIcono className="w-4 h-4 color-class" />  // ← AGREGAR
  return <Info className="w-4 h-4 text-gray-400" />
}
```

### Lógica Especial (si aplica)

Si necesitas lógica especial para tu tipo de notificación, puedes extender el handler en `NotificacionesContext.js`:

```javascript
const handleChange = (payload) => {
  const nueva = payload.new
  
  // Lógica especial para tu tipo
  if (nueva.tipo === 'tu_nuevo_tipo') {
    // Hacer algo especial
    ejecutarLogicaEspecial(nueva)
  }
  
  setNotificaciones(prev => {
    const existe = prev.some(n => n.id === nueva.id)
    if (existe) return prev
    return [nueva, ...prev]
  })
  agregarToast(nueva)
}
```

## Paso 5: Notificaciones Múltiples

Para notificar a múltiples usuarios:

```javascript
/**
 * Notificar a todos los usuarios excepto uno
 */
async function getActiveUsersExcept(excludeUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', excludeUserId);

  if (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
  return data || [];
}

/**
 * Notificar a todos sobre evento global
 */
export async function notificarEventoGlobal(evento, creadorNombre) {
  try {
    const usuarios = await getActiveUsersExcept(evento.created_by);
    if (usuarios.length === 0) return;

    const notificaciones = usuarios.map(u => ({
      user_id: u.id,
      tipo: 'tipo_global',
      titulo: 'Título',
      descripcion: `Descripción con ${creadorNombre}`,
      datos: {
        evento_id: evento.id,
        creador_id: evento.created_by,
        creador_nombre: creadorNombre
      }
    }));

    await insertarNotificaciones(notificaciones);
    console.log(`✅ Notificaciones enviadas a ${usuarios.length} usuarios`);
  } catch (err) {
    console.error('Error enviando notificaciones:', err.message);
  }
}
```

## Paso 6: Testing

### Backend Testing

```javascript
// Test unitario
const testNotificacion = async () => {
  const vueloMock = {
    id: 'uuid-test',
    created_by: 'user-uuid-test',
    ruta: 'LIM-MIA',
    pax_nombre: 'Juan Pérez',
    monto_venta: 1500,
    estado: 'PENDIENTE_CONFIRMACION_PAGO'
  };

  await notificarPagoObservado(
    vueloMock,
    'Admin Test',
    'pago_no_recibido',
    null,
    'Por favor verificar con el banco'
  );
  
  // Verificar en BD que se insertó la notificación
};
```

### Manual Testing

1. **Backend:**
   - Ejecuta la función/endpoint que emite la notificación
   - Verifica en Supabase Dashboard que el registro se creó

2. **Frontend:**
   - Login como el usuario que debería recibir la notificación
   - Verifica que aparece en la campana de notificaciones
   - Verifica que aparece el toast automático
   - Marca como leída y verifica que el badge se actualiza

## Estructura de `datos` (jsonb)

El campo `datos` es flexible pero sigue patrones comunes:

### Campos Comunes

```javascript
datos: {
  // Identificación de entidad
  entidad_id: uuid,
  
  // Información del actor
  actor_nombre: string,
  actor_id: uuid,
  
  // Información de contexto
  ruta: string,
  monto: number,
  estado: string,
  
  // Acción requerida (opcional)
  accion_requerida: string
}
```

### Por Tipo de Notificación

Consulta el catálogo completo en la skill `notification-types-catalog` para ver los metadatos específicos de cada tipo.

## Errores Comunes

### 1. No validar user_id

**Error:** Notificación no se envía porque user_id es null/undefined

**Solución:**
```javascript
if (!datos.user_id) {
  console.warn('Sin user_id, no se puede notificar');
  return;
}
```

### 2. Bloquear flujo principal

**Error:** Si la notificación falla, toda la operación falla

**Solución:** Siempre usa try/catch y solo loguea el error
```javascript
try {
  await notificarAlgo(datos);
} catch (err) {
  console.error('Error en notificación:', err.message);
  // NO throw err - no bloquear el flujo
}
```

### 3. Metadatos insuficientes

**Error:** El frontend no tiene suficiente información para mostrar la notificación

**Solución:** Incluye todos los metadatos relevantes en el campo `datos`
```javascript
datos: {
  vuelo_id: vuelo.id,
  admin_nombre: adminNombre,
  motivo,
  monto_esperado: vuelo.monto_venta,
  monto_faltante: montoFaltante || null,
  observaciones,
  ruta,
  pax_nombre: vuelo.pax_nombre,
  estado_vuelo: vuelo.estado,
  accion_requerida: 'Contactar al cliente'
}
```

### 4. Tipo de notificación no documentado

**Error:** Creas un tipo nuevo pero no lo documentas en el catálogo

**Solución:** **SIEMPRE actualiza la skill `notification-types-catalog` cuando crees un nuevo tipo**

## Checklist de Implementación

Antes de considerar una implementación completa:

- [ ] Función creada en `src/services/notificacionesService.js`
- [ ] Validación de user_id antes de insertar
- [ ] Try/catch para no bloquear flujo principal
- [ ] Tipo de notificación documentado en catálogo
- [ ] Metadatos completos en campo `datos`
- [ ] Mensajes claros (título corto, descripción detallada)
- [ ] Función exportada en default export
- [ ] Integrada en route/service que la dispara
- [ ] Icono agregado en `NotificacionesCampana.jsx` (si aplica)
- [ ] Testing manual completado
- [ ] **Catálogo de tipos actualizado** (CRÍTICO)

## Referencias en el Proyecto

- **Backend Service:** `src/services/notificacionesService.js`
- **Frontend Context:** `dashboard/src/contexts/NotificacionesContext.js`
- **Frontend UI:** `dashboard/src/components/ui/NotificacionesCampana.jsx`
- **Catálogo de Tipos:** `.agents/skills/notification-types-catalog/SKILL.md`
- **Ejemplo Implementación:** `docs/PLAN_IMPLEMENTACION_NOTIFICACION_PAGOS.md`
- **Plan de Ejecución:** `docs/superpowers/plans/2026-04-09-notificacion-pagos-observados.md`

## Ejemplo Completo de Implementación

Para un ejemplo completo paso a paso, consulta el plan de implementación de notificaciones de pagos observados en `docs/PLAN_IMPLEMENTACION_NOTIFICACION_PAGOS.md`.
