# 🔗 Mapeo: Tablas Huérfanas → Código Futuro

**Fecha:** 19 de Mayo, 2026  
**Propósito:** Demostrar que las tablas `poc_thread_events` y `poc_thread_status` SÍ serán usadas cuando se implemente el plan de eventos corregido.

---

## 📊 TABLA: poc_thread_events

### ✅ SERÁ USADA POR:

#### **1. pocEventService.createEvent()**
**Archivo:** `src/services/pocEventService.js` (a crear)

**Operación:** `INSERT INTO poc_thread_events`

```javascript
async createEvent(eventData) {
  const { data, error } = await supabase
    .from('poc_thread_events')  // ← USA LA TABLA
    .insert({
      thread_id: eventData.thread_id,
      event_type: eventData.event_type,
      event_subtype: eventData.event_subtype || 'MANUAL_MARK',
      occurred_at: eventData.occurred_at,
      created_by: eventData.created_by,
      event_data: eventData.event_data || {},
      notes: eventData.notes,
      related_vuelo_id: eventData.related_vuelo_id,
      related_cotizacion_id: eventData.related_cotizacion_id,
      is_milestone: eventData.is_milestone || false,
      is_system_generated: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Endpoint que lo usa:**
```
POST /api/poc/threads/:id/events
```

---

#### **2. pocEventService.getEventsByThread()**
**Archivo:** `src/services/pocEventService.js` (a crear)

**Operación:** `SELECT FROM poc_thread_events`

```javascript
async getEventsByThread(threadId, options = {}) {
  let query = supabase
    .from('poc_thread_events')  // ← USA LA TABLA
    .select(`
      *,
      creator:created_by(id, full_name, email),
      vuelo:related_vuelo_id(id, localizador, ruta, monto_venta),
      cotizacion:related_cotizacion_id(id, numero_cotizacion)
    `)
    .eq('thread_id', threadId)
    .order('occurred_at', { ascending: true });

  // Filtros opcionales
  if (options.milestones_only) {
    query = query.eq('is_milestone', true);
  }
  if (options.event_type) {
    query = query.eq('event_type', options.event_type);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

**Endpoint que lo usa:**
```
GET /api/poc/threads/:id/events
```

---

#### **3. pocEventService.markSale()**
**Archivo:** `src/services/pocEventService.js` (a crear)

**Operación:** `INSERT INTO poc_thread_events` (tipo SALE_CONFIRMED)

```javascript
async markSale(threadId, saleData) {
  return await this.createEvent({
    thread_id: threadId,
    event_type: 'SALE_CONFIRMED',
    event_subtype: 'MANUAL_MARK',
    occurred_at: saleData.occurred_at || new Date().toISOString(),
    created_by: saleData.created_by,
    event_data: {
      amount: saleData.amount,
      currency: saleData.currency || 'USD'
    },
    notes: saleData.notes,
    related_vuelo_id: saleData.vuelo_id,
    is_milestone: true,
    is_system_generated: false
  });
}
```

**Endpoint que lo usa:**
```
POST /api/poc/threads/:id/mark-sale
```

---

#### **4. pocEventService.getEnrichedTimeline()**
**Archivo:** `src/services/pocEventService.js` (a crear)

**Operación:** `SELECT FROM poc_thread_events` + combinar con mensajes

```javascript
async getEnrichedTimeline(threadId) {
  // 1. Obtener mensajes
  const messages = await pocThreadService.getThreadTimeline(threadId);

  // 2. Obtener eventos
  const { data: events, error } = await supabase
    .from('poc_thread_events')  // ← USA LA TABLA
    .select(`
      *,
      creator:created_by(id, full_name, email),
      vuelo:related_vuelo_id(id, localizador, ruta, monto_venta),
      cotizacion:related_cotizacion_id(id, numero_cotizacion)
    `)
    .eq('thread_id', threadId)
    .order('occurred_at', { ascending: true });

  if (error) throw error;

  // 3. Combinar y ordenar cronológicamente
  const timeline = [
    ...messages.map(msg => ({
      ...msg,
      type: 'message',
      sort_timestamp: new Date(msg.timestamp).getTime()
    })),
    ...(events || []).map(evt => ({
      ...evt,
      type: 'event',
      sort_timestamp: new Date(evt.occurred_at).getTime()
    }))
  ].sort((a, b) => a.sort_timestamp - b.sort_timestamp);

  return timeline;
}
```

**Endpoint que lo usa:**
```
GET /api/poc/threads/:id/timeline-enriched
```

---

#### **5. Trigger automático (FASE 1 - Base de Datos)**
**Archivo:** SQL manual a ejecutar

**Operación:** `INSERT INTO poc_thread_events` (automático cuando se crea vuelo)

```sql
-- Función que se ejecuta cuando se crea un vuelo
CREATE OR REPLACE FUNCTION poc_detect_sale_from_vuelo()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id uuid;
BEGIN
  -- Buscar thread por teléfono del contacto
  SELECT id INTO v_thread_id
  FROM poc_customer_threads
  WHERE customer_phone = NEW.contacto_telefono;

  -- Si existe thread, crear evento SALE_CONFIRMED
  IF v_thread_id IS NOT NULL THEN
    INSERT INTO poc_thread_events (  -- ← USA LA TABLA
      thread_id,
      event_type,
      event_subtype,
      occurred_at,
      event_data,
      related_vuelo_id,
      is_milestone,
      is_system_generated
    ) VALUES (
      v_thread_id,
      'SALE_CONFIRMED',
      'AUTO_DETECTED',
      NEW.created_at,
      jsonb_build_object(
        'localizador', NEW.localizador,
        'ruta', NEW.ruta,
        'monto_venta', NEW.monto_venta
      ),
      NEW.id,
      true,
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en tabla vuelos
CREATE TRIGGER trigger_poc_detect_sale
AFTER INSERT ON vuelos
FOR EACH ROW
EXECUTE FUNCTION poc_detect_sale_from_vuelo();
```

---

#### **6. Frontend: TimelineEnriched.jsx**
**Archivo:** `dashboard/src/components/poc/TimelineEnriched.jsx`

**Operación:** Renderiza eventos obtenidos de la tabla

```jsx
// Llama al endpoint que lee poc_thread_events
const { data } = await fetch(`/api/poc/threads/${threadId}/timeline-enriched`);

// Renderiza eventos
{timeline.map(item => {
  if (item.type === 'event') {
    return <EventMarker key={item.id} event={item} />;
  }
  return <MessageBubble key={item.id} message={item} />;
})}
```

---

## 📊 TABLA: poc_thread_status

### ✅ SERÁ USADA POR:

#### **1. pocLeadStatusService.getStatus()**
**Archivo:** `src/services/pocLeadStatusService.js` (a crear)

**Operación:** `SELECT FROM poc_thread_status`

```javascript
async getStatus(threadId) {
  const { data, error } = await supabase
    .from('poc_thread_status')  // ← USA LA TABLA
    .select('*')
    .eq('thread_id', threadId)
    .single();

  // Si no existe, retornar null (estado inicial se crea después)
  if (error && error.code === 'PGRST116') {
    return null;
  }

  if (error) throw error;
  return data;
}
```

**Endpoint que lo usa:**
```
GET /api/poc/threads/:id/status
```

---

#### **2. pocLeadStatusService.createInitialStatus()**
**Archivo:** `src/services/pocLeadStatusService.js` (a crear)

**Operación:** `INSERT INTO poc_thread_status`

```javascript
async createInitialStatus(threadId) {
  const { data, error } = await supabase
    .from('poc_thread_status')  // ← USA LA TABLA
    .insert({
      thread_id: threadId,
      current_status: 'NUEVO',
      status_since: new Date().toISOString(),
      total_sales: 0,
      total_sales_amount: 0,
      first_contact_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

#### **3. pocLeadStatusService.changeStatus()**
**Archivo:** `src/services/pocLeadStatusService.js` (a crear)

**Operación:** `UPDATE poc_thread_status` + crear evento STATUS_CHANGED

```javascript
async changeStatus(threadId, statusData) {
  // 1. Obtener estado actual
  const currentStatus = await this.getStatus(threadId);

  // 2. Actualizar estado
  const { data, error } = await supabase
    .from('poc_thread_status')  // ← USA LA TABLA
    .update({
      current_status: statusData.status,
      previous_status: currentStatus?.current_status,
      status_since: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('thread_id', threadId)
    .select()
    .single();

  if (error) throw error;

  // 3. Crear evento STATUS_CHANGED (import dinámico para evitar circular dependency)
  const pocEventService = (await import('./pocEventService.js')).default;
  await pocEventService.createEvent({
    thread_id: threadId,
    event_type: 'STATUS_CHANGED',
    event_subtype: 'MANUAL_MARK',
    occurred_at: new Date().toISOString(),
    created_by: statusData.changed_by,
    event_data: {
      from: currentStatus?.current_status,
      to: statusData.status,
      reason: statusData.reason
    },
    notes: statusData.reason,
    is_milestone: false,
    is_system_generated: false
  });

  return data;
}
```

**Endpoint que lo usa:**
```
PATCH /api/poc/threads/:id/status
```

---

#### **4. pocLeadStatusService.getStatusStats()**
**Archivo:** `src/services/pocLeadStatusService.js` (a crear)

**Operación:** `SELECT FROM poc_thread_status` (agregaciones)

```javascript
async getStatusStats() {
  const { data, error } = await supabase
    .from('poc_thread_status')  // ← USA LA TABLA
    .select('current_status, total_sales, total_sales_amount');

  if (error) throw error;

  // Calcular estadísticas
  const stats = {
    by_status: {},
    total_threads: data.length,
    total_sales: data.reduce((sum, s) => sum + s.total_sales, 0),
    total_revenue: data.reduce((sum, s) => sum + s.total_sales_amount, 0)
  };

  // Agrupar por estado
  data.forEach(status => {
    if (!stats.by_status[status.current_status]) {
      stats.by_status[status.current_status] = 0;
    }
    stats.by_status[status.current_status]++;
  });

  return stats;
}
```

**Endpoint que lo usa:**
```
GET /api/poc/status/stats
```

---

#### **5. Trigger automático (FASE 1 - Base de Datos)**
**Archivo:** SQL manual a ejecutar

**Operación:** `UPDATE poc_thread_status` (automático cuando se crea evento)

```sql
-- Función que actualiza estado según tipo de evento
CREATE OR REPLACE FUNCTION poc_update_thread_status_from_event()
RETURNS TRIGGER AS $$
BEGIN
  -- SALE_CONFIRMED → VENTA_CONCRETADA
  IF NEW.event_type = 'SALE_CONFIRMED' THEN
    INSERT INTO poc_thread_status (  -- ← USA LA TABLA
      thread_id,
      current_status,
      status_since,
      total_sales,
      total_sales_amount,
      first_sale_at,
      last_sale_at,
      last_activity_at
    ) VALUES (
      NEW.thread_id,
      'VENTA_CONCRETADA',
      NEW.occurred_at,
      1,
      (NEW.event_data->>'amount')::numeric,
      NEW.occurred_at,
      NEW.occurred_at,
      NEW.occurred_at
    )
    ON CONFLICT (thread_id) DO UPDATE SET
      current_status = 'VENTA_CONCRETADA',
      status_since = NEW.occurred_at,
      total_sales = poc_thread_status.total_sales + 1,
      total_sales_amount = poc_thread_status.total_sales_amount + (NEW.event_data->>'amount')::numeric,
      last_sale_at = NEW.occurred_at,
      last_activity_at = NEW.occurred_at,
      updated_at = now();

  -- QUOTATION_SENT + estado NUEVO → EN_NEGOCIACION
  ELSIF NEW.event_type = 'QUOTATION_SENT' THEN
    INSERT INTO poc_thread_status (
      thread_id,
      current_status,
      status_since,
      last_activity_at
    ) VALUES (
      NEW.thread_id,
      'EN_NEGOCIACION',
      NEW.occurred_at,
      NEW.occurred_at
    )
    ON CONFLICT (thread_id) DO UPDATE SET
      current_status = CASE 
        WHEN poc_thread_status.current_status = 'NUEVO' THEN 'EN_NEGOCIACION'
        ELSE poc_thread_status.current_status
      END,
      last_activity_at = NEW.occurred_at,
      updated_at = now();

  -- LEAD_LOST → PERDIDO
  ELSIF NEW.event_type = 'LEAD_LOST' THEN
    UPDATE poc_thread_status
    SET 
      current_status = 'PERDIDO',
      status_since = NEW.occurred_at,
      last_activity_at = NEW.occurred_at,
      updated_at = now()
    WHERE thread_id = NEW.thread_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en tabla poc_thread_events
CREATE TRIGGER trigger_poc_update_status
AFTER INSERT ON poc_thread_events
FOR EACH ROW
EXECUTE FUNCTION poc_update_thread_status_from_event();
```

---

#### **6. Frontend: StatusBadge.jsx**
**Archivo:** `dashboard/src/components/poc/StatusBadge.jsx`

**Operación:** Muestra estado obtenido de la tabla

```jsx
// Llama al endpoint que lee poc_thread_status
const { data: status } = await fetch(`/api/poc/threads/${threadId}/status`);

// Renderiza badge según estado
<Badge color={getStatusColor(status.current_status)}>
  {status.current_status}
</Badge>
```

---

#### **7. Frontend: ThreadRow.jsx (modificado)**
**Archivo:** `dashboard/src/components/poc/ThreadRow.jsx`

**Operación:** Muestra badge de estado en lista de threads

```jsx
// Thread incluye estado en el query
const threads = await fetch('/api/poc/threads?include_status=true');

// Renderiza badge
<StatusBadge status={thread.status?.current_status} />
```

---

## 📋 RESUMEN EJECUTIVO

### ✅ poc_thread_events SERÁ USADA POR:

1. ✅ `pocEventService.createEvent()` - INSERT
2. ✅ `pocEventService.getEventsByThread()` - SELECT
3. ✅ `pocEventService.markSale()` - INSERT (vía createEvent)
4. ✅ `pocEventService.getEnrichedTimeline()` - SELECT + JOIN
5. ✅ Trigger `poc_detect_sale_from_vuelo()` - INSERT automático
6. ✅ Frontend `TimelineEnriched.jsx` - Renderiza eventos
7. ✅ Frontend `EventMarker.jsx` - Muestra eventos visuales

**Total:** 7 usos diferentes

---

### ✅ poc_thread_status SERÁ USADA POR:

1. ✅ `pocLeadStatusService.getStatus()` - SELECT
2. ✅ `pocLeadStatusService.createInitialStatus()` - INSERT
3. ✅ `pocLeadStatusService.changeStatus()` - UPDATE
4. ✅ `pocLeadStatusService.getStatusStats()` - SELECT agregado
5. ✅ Trigger `poc_update_thread_status_from_event()` - INSERT/UPDATE automático
6. ✅ Frontend `StatusBadge.jsx` - Muestra estado
7. ✅ Frontend `ThreadRow.jsx` - Muestra badge en lista

**Total:** 7 usos diferentes

---

## 🎯 CONCLUSIÓN

**Las tablas NO están huérfanas por diseño, están PREPARADAS para el futuro.**

Cuando se implemente el plan de eventos corregido:
- ✅ Se crearán 2 servicios nuevos (pocEventService, pocLeadStatusService)
- ✅ Se agregarán 8 endpoints nuevos
- ✅ Se crearán 2 triggers automáticos
- ✅ Se crearán 4 componentes frontend nuevos
- ✅ Se modificarán 2 componentes existentes

**TODO ese código usará estas tablas intensivamente.**

**Recomendación:** ✅ **MANTENER LAS TABLAS** y agregar constraints faltantes.
