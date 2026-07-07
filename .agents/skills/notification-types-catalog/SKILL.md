---
name: notification-types-catalog
description: Catálogo completo de tipos de notificaciones existentes en el proyecto ERP Nova CRM. Use esta skill cuando necesites conocer qué tipos de notificaciones existen, qué metadatos usa cada tipo, cuándo usar cada tipo de notificación, o necesites seleccionar el tipo apropiado para una nueva implementación. Esta skill es la fuente de verdad para todos los tipos de notificaciones del sistema.
---

# Catálogo de Tipos de Notificaciones - ERP Nova CRM

Este catálogo contiene todos los tipos de notificaciones existentes en el proyecto ERP Nova CRM. Es la fuente de verdad para el sistema de notificaciones.

## ⚠️ IMPORTANTE: Mantener Actualizado

**CUANDO CREES UN NUEVO TIPO DE NOTIFICACIÓN**, DEBES actualizar este catálogo inmediatamente. Esto es CRÍTICO para mantener la consistencia del sistema.

### Proceso de Actualización:

1. **Al crear un nuevo tipo:**
   - Agrega una sección nueva con el formato de los tipos existentes
   - Incluye: descripción, metadatos requeridos, icono sugerido, cuándo usarlo
   - Agrega un ejemplo de payload completo
   - Actualiza el índice al inicio

2. **Al modificar un tipo existente:**
   - Actualiza la documentación del tipo
   - Actualiza los metadatos si cambió la estructura
   - Agrega nota de cambio con fecha

3. **Al deprecar un tipo:**
   - Márqualo como `~~DEPRECATED~~` en lugar de eliminarlo
   - Incluye fecha de deprecación, razón, y alternativa sugerida

## Índice de Tipos

1. **vuelo_creado** - Notificación cuando se crea un nuevo vuelo
2. **vuelo_emitido** - Notificación cuando un vuelo es marcado como emitido
3. **pago_observado** - Notificación cuando un admin observa un pago
4. **pago_confirmado** - Notificación cuando un admin confirma un pago
5. **recordatorio_autorizacion** - Notificación cuando emisor solicita autorización

---

## Tipo: vuelo_creado

### Descripción
Notifica a todos los usuarios (excepto el creador) cuando se registra un nuevo vuelo en el sistema.

### Cuándo Usar
- Cuando se crea un nuevo registro de vuelo
- Cuando un asesor registra un vuelo por primera vez
- En endpoints POST /api/vuelos o similares

### Metadatos Requeridos

```javascript
datos: {
  vuelo_id: uuid,              // ID del vuelo creado
  creador_id: uuid,            // ID del usuario que creó el vuelo
  creador_nombre: string,      // Nombre del creador
  ruta: string,                // Ruta del vuelo (ej: "LIM-MIA")
  estado: string               // Estado del vuelo
}
```

### Metadatos Opcionales

```javascript
datos: {
  // ... requeridos
  num_pasajeros: number,       // Cantidad de pasajeros (si está disponible)
}
```

### Icono Sugerido
```jsx
<Plane className="w-4 h-4 text-blue-500" />
```

### Ejemplo de Payload Completo

```javascript
{
  user_id: "user-uuid-receptor",
  tipo: "vuelo_creado",
  titulo: "✈️ Nuevo vuelo registrado",
  descripcion: "Juan Pérez registró un vuelo LIM-MIA con 2 pasajeros",
  datos: {
    vuelo_id: "550e8400-e29b-41d4-a716-446655440000",
    creador_id: "550e8400-e29b-41d4-a716-446655440001",
    creador_nombre: "Juan Pérez",
    ruta: "LIM-MIA",
    estado: "PENDIENTE_CONFIRMACION_PAGO",
    num_pasajeros: 2
  }
}
```

### Referencia en Código
- Función: `notificarNuevoVuelo()` en `src/services/notificacionesService.js`
- Icono: `NotificacionesCampana.jsx` línea 18

---

## Tipo: vuelo_emitido

### Descripción
Notifica al creador del vuelo cuando un admin marca el vuelo como emitido (confirmación de boletos).

### Cuándo Usar
- Cuando un admin marca un vuelo como emitido
- Cuando se confirman los boletos con la aerolínea
- En endpoints PATCH /api/vuelos/:id/marcar-emitido o similares

### Metadatos Requeridos

```javascript
datos: {
  vuelo_id: uuid,              // ID del vuelo emitido
  emisor_nombre: string,       // Nombre del admin que marcó como emitido
  ruta: string                 // Ruta del vuelo
}
```

### Metadatos Opcionales

Ninguno específico para este tipo.

### Icono Sugerido
```jsx
<CheckCheck className="w-4 h-4 text-green-500" />
```

### Ejemplo de Payload Completo

```javascript
{
  user_id: "user-uuid-creador-vuelo",
  tipo: "vuelo_emitido",
  titulo: "✅ Vuelo emitido",
  descripcion: "María González marcó como emitido tu vuelo LIM-MIA",
  datos: {
    vuelo_id: "550e8400-e29b-41d4-a716-446655440000",
    emisor_nombre: "María González",
    ruta: "LIM-MIA"
  }
}
```

### Referencia en Código
- Función: `notificarVueloEmitido()` en `src/services/notificacionesService.js`
- Icono: `NotificacionesCampana.jsx` línea 19

---

## Tipo: pago_observado

### Descripción
Notifica al asesor cuando un admin observa un problema con el pago de un vuelo (pago no recibido, monto insuficiente, requiere aclaración).

### Cuándo Usar
- Cuando un admin reporta una observación en el pago
- Cuando el pago no ha caído en cuenta
- Cuando el monto recibido es menor al esperado
- Cuando se requiere aclaración adicional
- En endpoints POST /api/vuelos/:id/observar-pago

### Metadatos Requeridos

```javascript
datos: {
  vuelo_id: uuid,              // ID del vuelo
  admin_nombre: string,        // Nombre del admin que hizo la observación
  motivo: string,             // Uno de: 'pago_no_recibido', 'monto_insuficiente', 'requiere_aclaracion'
  monto_esperado: number,      // Monto esperado del vuelo
  observaciones: string,       // Detalles de la observación (mínimo 20 caracteres)
  ruta: string,                // Ruta del vuelo
  pax_nombre: string,          // Nombre del pasajero
  estado_vuelo: string         // Estado del vuelo
}
```

### Metadatos Opcionales

```javascript
datos: {
  // ... requeridos
  monto_faltante: number,      // Monto que falta (solo si motivo es 'monto_insuficiente')
  accion_requerida: string     // Acción que debe tomar el asesor (ej: "Contactar al cliente")
}
```

### Valores de `motivo`

- `pago_no_recibido`: El pago aún no ha caído en cuenta
- `monto_insuficiente`: Falta dinero por cubrir
- `requiere_aclaracion`: Se requiere aclaración sobre el pago

### Icono Sugerido
```jsx
<AlertTriangle className="w-4 h-4 text-amber-500" />
```

### Ejemplo de Payload Completo

```javascript
{
  user_id: "user-uuid-asesor",
  tipo: "pago_observado",
  titulo: "¡Observación en pago de vuelo!",
  descripcion: "Carlos López revisó el pago del vuelo LIM-MIA. El pago aún no ha sido recibido. El cliente dice que hizo transferencia pero no aparece en cuenta. Por favor verificar con banco.",
  datos: {
    vuelo_id: "550e8400-e29b-41d4-a716-446655440000",
    admin_nombre: "Carlos López",
    motivo: "pago_no_recibido",
    monto_esperado: 1500.00,
    monto_faltante: null,
    observaciones: "El cliente dice que hizo transferencia pero no aparece en cuenta. Por favor verificar con banco.",
    ruta: "LIM-MIA",
    pax_nombre: "Juan Pérez",
    estado_vuelo: "PENDIENTE_CONFIRMACION_PAGO",
    accion_requerida: "Contactar al cliente para verificar el pago"
  }
}
```

### Referencia en Código
- Función: `notificarPagoObservado()` en `src/services/notificacionesService.js`
- Icono: `NotificacionesCampana.jsx` línea 20
- Plan de implementación: `docs/PLAN_IMPLEMENTACION_NOTIFICACION_PAGOS.md`

---

## Tipo: pago_confirmado

### Descripción
Notifica al asesor cuando un admin confirma que el pago del vuelo es correcto y puede procederse con la emisión.

### Cuándo Usar
- Cuando un admin aprueba el pago de un vuelo
- Cuando el pago ha sido verificado y es correcto
- En endpoints POST /api/vuelos/:id/confirmar-pago

### Metadatos Requeridos

```javascript
datos: {
  vuelo_id: uuid,              // ID del vuelo
  admin_nombre: string,        // Nombre del admin que confirmó
  ruta: string,                // Ruta del vuelo
  pax_nombre: string,          // Nombre del pasajero
  monto: number,               // Monto del vuelo
  estado_vuelo: string         // Nuevo estado (usualmente 'PENDIENTE_EMISION')
}
```

### Metadatos Opcionales

```javascript
datos: {
  // ... requeridos
  accion_requerida: string     // Acción que debe tomar el asesor (ej: "Proceder con emisión")
}
```

### Icono Sugerido
```jsx
<CheckCircle className="w-4 h-4 text-green-500" />
```

### Ejemplo de Payload Completo

```javascript
{
  user_id: "user-uuid-asesor",
  tipo: "pago_confirmado",
  titulo: "✅ Pago confirmado",
  descripcion: "Ana Martínez aprobó el pago del vuelo LIM-MIA. Ya puedes proceder con la emisión.",
  datos: {
    vuelo_id: "550e8400-e29b-41d4-a716-446655440000",
    admin_nombre: "Ana Martínez",
    ruta: "LIM-MIA",
    pax_nombre: "Juan Pérez",
    monto: 1500.00,
    estado_vuelo: "PENDIENTE_EMISION",
    accion_requerida: "Proceder con emisión del vuelo"
  }
}
```

### Referencia en Código
- Función: `notificarPagoConfirmado()` en `src/services/notificacionesService.js`

---

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

---

## Guía para Crear Nuevos Tipos

### Paso 1: Evaluar si Necesitas un Nuevo Tipo

Antes de crear un nuevo tipo, verifica si alguno de los existentes puede adaptarse:

- **vuelo_creado**: Para eventos de creación de cualquier entidad
- **vuelo_emitido**: Para eventos de confirmación/completado
- **pago_observado**: Para eventos que requieren atención del usuario
- **pago_confirmado**: Para eventos de aprobación exitosa

Si ninguno aplica, crea un nuevo tipo.

### Paso 2: Definir el Tipo

Sigue este formato:

```javascript
tipo: 'nombre_descriptivo_en_snake_case'
```

**Reglas de命名:**
- Usar snake_case (guiones bajos)
- Ser descriptivo pero conciso
- Usar prefijo del dominio si aplica (ej: `vuelo_`, `cotizacion_`, `pago_`)
- Evitar nombres genéricos como `info`, `alert`, `notification`

### Paso 3: Definir Metadatos

Define qué metadatos son requeridos y cuáles opcionales:

```javascript
datos: {
  // Requeridos
  entidad_id: uuid,
  actor_nombre: string,
  
  // Opcionales
  contexto_extra: string
}
```

### Paso 4: Definir Icono

Elige un icono de Lucide React que represente el tipo:

- **Azul**: Información general
- **Verde**: Éxito/confirmación
- **Ámbar**: Advertencia/acción requerida
- **Rojo**: Error/crítico
- **Gris**: Genérico

### Paso 5: Agregar al Catálogo

Agrega una sección nueva con el formato de los tipos existentes en este archivo.

### Paso 6: Actualizar Frontend (si aplica)

Agrega el icono en `dashboard/src/components/ui/NotificacionesCampana.jsx`:

```javascript
function iconoTipo(tipo) {
  if (tipo === 'tu_nuevo_tipo') return <TuIcono className="w-4 h-4 color-class" />
  // ... otros tipos
}
```

### Paso 7: Documentar

Actualiza la skill `notification-implementation` si el nuevo tipo requiere instrucciones especiales.

---

## Tipos Deprecated

Actualmente no hay tipos deprecated.

---

## Estadísticas de Tipos

- **Total de tipos activos:** 5
- **Última actualización:** 2026-04-22
- **Tipos por dominio:**
  - Vuelos: 3 (vuelo_creado, vuelo_emitido, recordatorio_autorizacion)
  - Pagos: 2 (pago_observado, pago_confirmado)

---

## Referencias

- **Implementación:** `.agents/skills/notification-implementation/SKILL.md`
- **Backend Service:** `src/services/notificacionesService.js`
- **Frontend Context:** `dashboard/src/contexts/NotificacionesContext.js`
- **Frontend UI:** `dashboard/src/components/ui/NotificacionesCampana.jsx`
