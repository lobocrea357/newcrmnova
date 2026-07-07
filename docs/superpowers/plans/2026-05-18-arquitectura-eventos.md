# Arquitectura del Sistema de Eventos - POC Conversaciones

**Fecha:** 18 de Mayo, 2026  
**Versión:** 1.0  
**Estado:** Diseño aprobado para implementación

---

## 📋 Resumen Ejecutivo

Este documento describe la arquitectura completa del **Sistema de Eventos para Timeline Enriquecido**, que permite marcar hitos importantes en las conversaciones (ventas, cotizaciones, reuniones) con detección **híbrida automática + manual**.

**Problema que resuelve:**
- Vista unificada del historial completo de un cliente (un solo thread)
- Identificar CUÁNDO y DÓNDE se concretó una venta en el timeline
- Marcar estados de leads (NUEVO → VENTA_CONCRETADA → POST_VENTA)
- Auditoría completa de eventos importantes

---

## 🎯 Objetivos

1. **Timeline enriquecido**: Intercalar mensajes con eventos visuales (ventas, cotizaciones, etc.)
2. **Detección automática**: Trigger en BD detecta ventas cuando se crea un vuelo
3. **Marcado manual**: API permite marcar eventos retroactivamente
4. **Estados granulares**: 5 estados de leads con transiciones automáticas
5. **Auditoría completa**: Saber quién marcó qué y cuándo

---

## 🏗️ Arquitectura de 3 Capas

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React/Next.js)               │
│  Timeline Enriquecido │ EventMarker │ StatusBadge  │
└─────────────────────────┬───────────────────────────┘
                          │ API REST
┌─────────────────────────▼───────────────────────────┐
│              BACKEND (Node.js/Express)              │
│  pocEventService │ pocLeadStatusService │ Routes   │
└─────────────────────────┬───────────────────────────┘
                          │ SQL Queries
┌─────────────────────────▼───────────────────────────┐
│         BASE DE DATOS (PostgreSQL/Supabase)         │
│  Tables │ Triggers │ Functions │ Indexes            │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Datos

### Tabla: `poc_thread_events`

Almacena TODOS los eventos importantes del timeline.

```sql
poc_thread_events
├── id (UUID, PK)
├── thread_id (UUID, FK → poc_customer_threads)
├── event_type (VARCHAR) - Tipo: SALE_CONFIRMED, QUOTATION_SENT, etc.
├── event_subtype (VARCHAR) - Subtipo: AUTO_DETECTED, MANUAL_MARK
├── occurred_at (TIMESTAMPTZ) - Momento REAL del evento
├── created_at (TIMESTAMPTZ) - Momento en que se registró
├── created_by (UUID, FK → profiles) - Quién lo creó (NULL si automático)
├── event_data (JSONB) - Datos específicos del evento
├── notes (TEXT) - Notas adicionales
├── related_message_id (UUID, FK → messages)
├── related_vuelo_id (UUID, FK → vuelos)
├── related_cotizacion_id (UUID, FK → cotizaciones)
├── is_milestone (BOOLEAN) - Si debe destacarse en timeline
└── is_system_generated (BOOLEAN) - Si fue automático
```

**Tipos de eventos válidos:**
- `SALE_CONFIRMED` - Venta confirmada
- `SALE_CANCELLED` - Venta cancelada
- `QUOTATION_SENT` - Cotización enviada
- `QUOTATION_ACCEPTED` - Cotización aceptada
- `MEETING_SCHEDULED` - Reunión agendada
- `CALL_MADE` - Llamada realizada
- `LEAD_LOST` - Lead perdido
- `LEAD_REACTIVATED` - Lead reactivado
- `REASSIGNMENT` - Reasignación de asesor
- `NOTE_ADDED` - Nota agregada
- `STATUS_CHANGED` - Cambio de estado manual

---

### Tabla: `poc_thread_status`

Estado actual y métricas agregadas de cada lead.

```sql
poc_thread_status
├── thread_id (UUID, PK, FK → poc_customer_threads)
├── current_status (VARCHAR) - Estado actual
├── status_since (TIMESTAMPTZ) - Desde cuándo está en este estado
├── previous_status (VARCHAR) - Estado anterior
├── total_sales (INTEGER) - Cantidad de ventas
├── total_sales_amount (NUMERIC) - Suma total vendido
├── first_sale_at (TIMESTAMPTZ) - Fecha primera venta
├── last_sale_at (TIMESTAMPTZ) - Fecha última venta
├── first_contact_at (TIMESTAMPTZ) - Primer mensaje
├── last_activity_at (TIMESTAMPTZ) - Última actividad
└── updated_at (TIMESTAMPTZ) - Última actualización
```

**Estados válidos:**
- `NUEVO` - Primer contacto, sin interacción profunda
- `EN_NEGOCIACION` - Conversando, enviando cotizaciones
- `VENTA_CONCRETADA` - Cliente compró
- `POST_VENTA` - Seguimiento post-compra
- `PERDIDO` - Cliente no compró / no responde

---

## ⚡ Flujos Automáticos (Triggers)

### Flujo 1: Detección Automática de Ventas

```
Usuario crea vuelo en frontend
         ↓
INSERT en tabla vuelos
         ↓
Trigger: trigger_poc_detect_sale
         ↓
Función: poc_detect_sale_from_vuelo()
    1. Buscar thread por contacto_telefono
    2. Verificar que no exista evento duplicado
    3. Crear evento SALE_CONFIRMED con datos del vuelo
         ↓
Trigger: trigger_poc_update_status
         ↓
Función: poc_update_thread_status_from_event()
    1. Actualizar current_status = 'VENTA_CONCRETADA'
    2. Actualizar total_sales y total_sales_amount
    3. Actualizar first_sale_at / last_sale_at
```

**Resultado:** El evento aparece automáticamente en el timeline en <5 segundos.

---

### Flujo 2: Actualización de Estado por Evento

```
Se crea evento (manual o automático)
         ↓
INSERT en poc_thread_events
         ↓
Trigger: trigger_poc_update_status
         ↓
Función: poc_update_thread_status_from_event()
    Evalúa event_type:
    - SALE_CONFIRMED → current_status = 'VENTA_CONCRETADA'
    - LEAD_LOST → current_status = 'PERDIDO'
    - QUOTATION_SENT + estado=NUEVO → current_status = 'EN_NEGOCIACION'
         ↓
UPSERT en poc_thread_status con nuevas métricas
```

---

## 🔌 API REST Endpoints

### Eventos

```http
# Crear evento manualmente
POST /api/poc/threads/:threadId/events
Content-Type: application/json
{
  "event_type": "SALE_CONFIRMED",
  "occurred_at": "2026-05-18T14:30:00Z",
  "event_data": {
    "amount": 850.50,
    "notes": "Cliente pagó 50% adelanto"
  },
  "created_by": "uuid-del-usuario"
}

# Obtener eventos de un thread
GET /api/poc/threads/:threadId/events?milestones_only=true

# Timeline enriquecido (mensajes + eventos intercalados)
GET /api/poc/threads/:threadId/timeline-enriched

# Atajo para marcar venta
POST /api/poc/threads/:threadId/mark-sale
{
  "occurred_at": "2026-05-18T14:30:00Z",
  "amount": 850.50,
  "vuelo_id": "uuid-opcional",
  "notes": "Detalles adicionales"
}
```

### Estados

```http
# Obtener estado actual
GET /api/poc/threads/:threadId/status

# Cambiar estado manualmente
PATCH /api/poc/threads/:threadId/status
{
  "status": "PERDIDO",
  "reason": "Cliente no respondió en 7 días",
  "changed_by": "uuid-del-usuario"
}

# Estadísticas generales
GET /api/poc/status/stats
```

---

## 🎨 Componentes Frontend

### EventMarker.jsx

Componente visual que muestra un evento en el timeline.

**Props:**
```typescript
{
  eventType: 'SALE_CONFIRMED',
  occurredAt: '2026-05-18T14:30:00Z',
  eventData: { amount: 850.50 },
  notes: 'Cliente pagó 50% adelanto',
  isSystemGenerated: true
}
```

**Renderizado:**
```jsx
┌──────────────────────────────────────┐
│ 🎉 VENTA CONFIRMADA                  │
│ 18 May, 2026 - 14:30                 │
│ Monto: $850.50                       │
│ Cliente pagó 50% adelanto            │
│ [Automático]                         │
└──────────────────────────────────────┘
```

---

### StatusBadge.jsx

Badge visual del estado actual del lead.

```jsx
// NUEVO
<Badge color="gray">🆕 Nuevo</Badge>

// EN_NEGOCIACION
<Badge color="blue">💬 En Negociación</Badge>

// VENTA_CONCRETADA
<Badge color="green">✅ Venta Concretada</Badge>

// POST_VENTA
<Badge color="purple">📦 Post-Venta</Badge>

// PERDIDO
<Badge color="red">❌ Perdido</Badge>
```

---

### Timeline Enriquecido

Vista que intercala mensajes con eventos:

```
┌─ Timeline ──────────────────────────┐
│                                     │
│ [Mensaje] Cliente: Hola, necesito  │
│           un vuelo a Miami          │
│           10:25 AM                  │
│                                     │
│ [Mensaje] Bot: ¡Con gusto! ¿Para   │
│           cuántas personas?         │
│           10:26 AM                  │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📄 COTIZACIÓN ENVIADA               │
│    18 May - 10:35 AM                │
│    Cotización_Miami_Cliente.pdf     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ [Mensaje] Cliente: Me interesa,    │
│           ¿puedo pagar 50% ahora?   │
│           11:20 AM                  │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🎉 VENTA CONFIRMADA                 │
│    18 May - 14:30 PM                │
│    Monto: $850.50                   │
│    [Automático]                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ [Mensaje] Bot: ¡Perfecto! Tu vuelo  │
│           está confirmado           │
│           14:35 PM                  │
└─────────────────────────────────────┘
```

---

## 🔐 Seguridad y Permisos

### RLS (Row Level Security)

```sql
-- Solo super admins pueden ver eventos
ALTER TABLE poc_thread_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all events"
ON poc_thread_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name = 'Super Admin'
      )
  )
);

-- Similar para poc_thread_status
ALTER TABLE poc_thread_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all statuses"
ON poc_thread_status FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name = 'Super Admin'
      )
  )
);
```

### Validaciones Backend

- Event types validados contra lista VALID_EVENT_TYPES
- Estados validados contra lista VALID_STATUSES
- Campos requeridos: thread_id, occurred_at, event_type
- Sanitización de inputs antes de INSERT

---

## 📈 Performance y Escalabilidad

### Índices Optimizados

```sql
-- Búsquedas por thread (timeline)
CREATE INDEX idx_thread_events_thread_occurred 
ON poc_thread_events(thread_id, occurred_at DESC);

-- Búsquedas de ventas
CREATE INDEX idx_thread_events_sales 
ON poc_thread_events(thread_id, event_type) 
WHERE event_type IN ('SALE_CONFIRMED', 'SALE_CANCELLED');

-- Threads con ventas
CREATE INDEX idx_thread_status_sales 
ON poc_thread_status(total_sales DESC) 
WHERE total_sales > 0;
```

### Caching

- Timeline enriquecido se puede cachear con `stale-while-revalidate`
- Cache key: `thread-timeline-${threadId}-${lastActivityAt}`
- TTL: 5 minutos

### Paginación

Para threads con miles de mensajes:
```javascript
GET /api/poc/threads/:id/timeline-enriched?limit=50&offset=0
```

---

## 🧪 Testing

### Tests Unitarios (Backend)

```javascript
describe('pocEventService', () => {
  it('should create sale event manually');
  it('should reject invalid event type');
  it('should return events ordered by occurred_at');
  it('should calculate event stats correctly');
});

describe('pocLeadStatusService', () => {
  it('should change status and create event');
  it('should reject invalid status');
  it('should calculate status stats');
});
```

### Tests de Integración

```javascript
it('should auto-detect sale when vuelo created', async () => {
  // 1. Crear thread
  // 2. Crear vuelo con contacto_telefono del thread
  // 3. Esperar 2 segundos
  // 4. Verificar que existe evento SALE_CONFIRMED
  // 5. Verificar que estado = VENTA_CONCRETADA
});
```

### Tests E2E (Frontend)

```javascript
it('should display events in timeline', () => {
  // 1. Navegar a /conversaciones-poc/[threadId]/timeline
  // 2. Verificar que aparecen EventMarkers
  // 3. Verificar orden cronológico correcto
});

it('should allow marking sale manually', () => {
  // 1. Click botón "Marcar Venta"
  // 2. Llenar modal con datos
  // 3. Submit
  // 4. Verificar que evento aparece en timeline
  // 5. Verificar que badge cambió a "Venta Concretada"
});
```

---

## 🚀 Roadmap Futuro

### Fase 1.5 (Opcional - Corto Plazo)
- [ ] Notificaciones en tiempo real cuando cambia estado
- [ ] Filtros avanzados en timeline (solo ventas, solo cotizaciones)
- [ ] Exportar timeline a PDF

### Fase 2 (Media - Largo Plazo)
- [ ] Reproducci ón de audios/videos/imágenes (ver `funcionalidades-pendientes-media.md`)
- [ ] Transcripción automática de audios con Whisper API
- [ ] Análisis de sentimiento en mensajes

### Fase 3 (Largo Plazo)
- [ ] Lead scoring automático basado en eventos
- [ ] Predicción de probabilidad de venta con ML
- [ ] Automatizaciones (recordatorios si no hay actividad)
- [ ] Dashboard analytics avanzado

---

## 📚 Referencias

- [Supabase Triggers Documentation](https://supabase.com/docs/guides/database/postgres/triggers)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [REST API Best Practices](https://restfulapi.net/)
- [React Timeline Libraries](https://www.npmjs.com/package/react-chrono)

---

**Última actualización:** 18 de Mayo, 2026  
**Mantenido por:** Equipo de Desarrollo ERP Nova CRM
