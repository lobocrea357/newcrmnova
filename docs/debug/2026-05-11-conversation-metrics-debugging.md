# Debugging: Conversation Metrics No Pobladas

**Fecha**: 2026-05-11  
**Prioridad**: Alta  
**Estado**: En investigación

## Problema Principal

Las métricas de conversación (`conversation_metrics`) no se están poblando para la mayoría de los chats, resultando en que el frontend muestre "0 mensajes" para conversaciones que SÍ tienen mensajes.

### Evidencia del Problema

**Query ejecutado**:
```sql
SELECT 
  c.id as chat_id,
  c.chat_id as whatsapp_id,
  cm.total_messages,
  cm.last_calculated_at
FROM chats c
LEFT JOIN conversation_metrics cm ON cm.chat_id = c.id
WHERE c.bot_id = '874a2556-ffa5-4764-bd50-7ffdf2602058'
  AND c.is_group = false
  AND c.chat_id NOT ILIKE '%status%'
LIMIT 10;
```

**Resultado**:
| chat_id | whatsapp_id | total_messages | last_calculated_at |
|---------|-------------|----------------|-------------------|
| 874a2556-ffa5-4764-bd50-7ffdf2602058 | 584264608238@c.us | **null** | **null** |
| 30fea135-7aba-4281-8c1a-8923d58b141f | 584125548935@c.us | **null** | **null** |
| ab6a7f92-2394-4c3f-a7f0-e3ce5612002f | 584146789356@c.us | **null** | **null** |
| cc670767-c87d-4c65-b360-0eb703b01d79 | 584149407586@c.us | **null** | **null** |
| cacf6cf0-d36b-4127-ae69-18b7d39604f3 | 19152945283@c.us | **78** | 2026-05-11 03:03:33 ✅ |
| 3f996b51-2076-43c0-9540-7e44b67ce030 | 584145622935@c.us | **null** | **null** |
| d1178f5f-e15f-44ac-80bb-533c7b145b5e | 584127495777@c.us | **null** | **null** |

**Observación crítica**: Solo 1 de 10 chats tiene métricas. Los demás están NULL.

---

## Contexto Técnico

### Arquitectura Implementada

Se implementó un sistema de métricas precalculadas para optimizar la carga de conversaciones:

**Tabla `conversation_metrics`**:
```sql
CREATE TABLE public.conversation_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL UNIQUE,
  total_messages integer NOT NULL DEFAULT 0,
  incoming_messages integer NOT NULL DEFAULT 0,
  outgoing_messages integer NOT NULL DEFAULT 0,
  avg_response_time_minutes numeric,
  max_response_time_minutes numeric,
  response_samples integer DEFAULT 0,
  payment_mentions_count integer DEFAULT 0,
  payment_first_mention_at timestamp with time zone,
  payment_last_mention_at timestamp with time zone,
  payment_last_from_me boolean,
  cotizacion_mentions_count integer DEFAULT 0,
  cotizacion_files jsonb DEFAULT '[]'::jsonb,
  last_calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_metrics_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
```

**Función de cálculo**: `calculate_conversation_metrics(p_chat_id uuid)`
- Calcula total de mensajes
- Calcula tiempos de respuesta
- Detecta menciones de pago
- Detecta PDFs de cotización
- Inserta o actualiza en `conversation_metrics`

**Triggers configurados**:
```sql
-- Verificado que existen y están ENABLED
CREATE TRIGGER messages_insert_recalc_metrics
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_metrics();

CREATE TRIGGER messages_update_recalc_metrics
  AFTER UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_metrics();
```

**Estado de los triggers**:
| trigger_name | enabled | status |
|--------------|---------|--------|
| messages_insert_recalc_metrics | O | Enabled ✅ |
| messages_update_recalc_metrics | O | Enabled ✅ |

---

## Diagnóstico Realizado

### ✅ Cosas que SÍ funcionan

1. **Función `calculate_conversation_metrics` funciona correctamente**:
   - Ejecutada manualmente sobre un chat específico
   - Resultado: Métricas creadas correctamente
   
2. **Triggers están creados y habilitados**:
   - Verificado en `pg_trigger`
   - Estado: `O` (Enabled)

3. **Mensajes nuevos SÍ disparan el trigger**:
   ```sql
   -- Mensajes recientes (últimas 24 horas) con métricas actualizadas
   SELECT m.timestamp, cm.total_messages, cm.last_calculated_at
   FROM messages m
   LEFT JOIN conversation_metrics cm ON cm.chat_id = m.chat_id
   WHERE m.timestamp > NOW() - INTERVAL '24 hours'
   ORDER BY m.timestamp DESC
   LIMIT 10;
   ```
   
   **Resultado**: Los mensajes nuevos SÍ actualizan métricas (ej: 26891 msgs, 29 msgs, 18 msgs con timestamps recientes)

### ❌ El Problema Real

**Los chats antiguos (sin actividad reciente) NO tienen métricas calculadas**.

**Razón**: La función `populate_all_conversation_metrics()` **NO se ejecutó** porque:
- El usuario tiene millones de mensajes históricos
- Ejecutar la población causaba timeouts en Supabase
- Se decidió NO poblar métricas históricas y solo confiar en los triggers

**Consecuencia**:
- Chats con mensajes antiguos pero sin actividad reciente → `total_messages = NULL`
- Frontend muestra "0 mensajes" para estos chats
- Solo los chats con actividad nueva tienen métricas

---

## Código Frontend Afectado

**Archivo**: `dashboard/src/lib/supabase.js`

**Función refactorizada**: `getConversationsByBot` (líneas 460-612)

```javascript
export async function getConversationsByBot(botId, page = 1, pageSize = 10) {
  // OPTIMIZADO: Query única con JOIN a conversation_metrics
  const { data, error } = await supabase
    .from("chats")
    .select(`
      *,
      contact:contacts(id, name, phone_number, profile_picture_url, push_name),
      metrics:conversation_metrics(
        total_messages,
        avg_response_time_minutes,
        max_response_time_minutes,
        response_samples,
        payment_mentions_count,
        payment_first_mention_at,
        payment_last_mention_at,
        payment_last_from_me,
        cotizacion_mentions_count,
        cotizacion_files
      )
    `)
    .eq("bot_id", botId)
    // ... resto de filtros

  // Construir métricas usando datos precalculados
  const metrics = chat.metrics?.[0];
  const conversationMetrics = metrics ? {
    // ... mapeo de métricas
  } : null; // NULL si no hay métricas
  
  return {
    ...chat,
    message_count: metrics?.total_messages || 0, // ❌ AQUÍ está el problema
    conversation_metrics: conversationMetrics
  };
}
```

**Problema**: `message_count: metrics?.total_messages || 0` devuelve 0 cuando `metrics` es NULL.

---

## Opciones de Solución

### Opción 1: Población Gradual (Batch Processing)
Poblar métricas en lotes pequeños para evitar timeouts:

```sql
-- Procesar en lotes de 100 chats
DO $$
DECLARE
  v_batch_size integer := 100;
  v_offset integer := 0;
  v_chat_id uuid;
BEGIN
  FOR v_chat_id IN 
    SELECT id FROM chats
    WHERE is_group = false
      AND chat_id NOT ILIKE '%status%'
      AND chat_id NOT ILIKE '%@broadcast%'
      AND chat_id NOT ILIKE '%@g.us'
    ORDER BY last_message_time DESC NULLS LAST
    LIMIT v_batch_size OFFSET v_offset
  LOOP
    PERFORM calculate_conversation_metrics(v_chat_id);
    v_offset := v_offset + 1;
  END LOOP;
END $$;
```

**Pros**: Llena las métricas históricas  
**Contras**: Requiere múltiples ejecuciones manuales

### Opción 2: Fallback en Frontend (Actual)
Cuando `metrics` es NULL, el frontend debería hacer fallback a contar mensajes:

```javascript
// En getConversationsByBot
const messageCount = metrics?.total_messages || 
  (await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("chat_id", chat.id)
  ).count || 0;
```

**Pros**: No requiere poblar métricas históricas  
**Contras**: Queries adicionales, pierde la optimización

### Opción 3: Población Lazy (On-Demand)
Calcular métricas al acceder a una conversación por primera vez:

```javascript
// Al abrir un chat específico
if (!conversation.metrics) {
  await supabase.rpc('calculate_conversation_metrics', { 
    p_chat_id: chatId 
  });
  // Recargar conversación
}
```

**Pros**: Solo calcula lo que se necesita  
**Contras**: Primera carga de chat antigua será lenta

### Opción 4: Vista Híbrida (Recomendada)
Crear una vista que haga fallback automático:

```sql
CREATE VIEW conversation_metrics_with_fallback AS
SELECT 
  c.id as chat_id,
  COALESCE(cm.total_messages, (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id)) as total_messages,
  COALESCE(cm.incoming_messages, (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.from_me = false)) as incoming_messages,
  -- ... resto de campos con fallback
FROM chats c
LEFT JOIN conversation_metrics cm ON cm.chat_id = c.id;
```

**Pros**: Transparente, siempre tiene datos  
**Contras**: Subconsultas pueden ser lentas en chats sin métricas

---

## Archivos Relevantes

### Migración SQL
- **Ruta**: `docs/05-base-de-datos/migraciones/2026-05-10-conversation-metrics.sql`
- **Contiene**: Tabla, índices, función, triggers

### Schema Local
- **Ruta**: `docs/05-base-de-datos/esquemalocal.sql`
- **Líneas 229-249**: Definición de `conversation_metrics`

### Frontend
- **Ruta**: `dashboard/src/lib/supabase.js`
- **Líneas 460-612**: `getConversationsByBot` (refactorizada)
- **Líneas 270-300**: `getBotCotizacionesCount` (refactorizada)

### Plan de Implementación
- **Ruta**: `docs/superpowers/plans/2026-05-10-optimizacion-conversaciones.md`

---

## Skills Requeridas para Debugging

### 1. `systematic-debugging`
**Por qué**: Problema complejo con múltiples capas (BD, triggers, frontend)
**Usar para**:
- Fase 1: Root cause investigation
- Fase 2: Pattern analysis
- Fase 3: Hypothesis testing
- Fase 4: Implementation

### 2. `supabase`
**Por qué**: Trabajo directo con Supabase/PostgreSQL
**Usar para**:
- Verificar configuración de triggers
- Ejecutar queries de diagnóstico
- Crear funciones y vistas SQL
- Entender límites y timeouts de Supabase

### 3. `supabase-postgres-best-practices`
**Por qué**: Optimización de queries y performance
**Usar para**:
- Diseño de índices correctos
- Optimización de subconsultas
- Patrones de agregación eficientes
- Row-Level Security considerations

### 4. `api-design-principles`
**Por qué**: Refactorización del API de conversaciones
**Usar para**:
- Diseñar fallback patterns robustos
- Mantener compatibilidad con frontend
- Definir contratos de datos claros

---

## Próximos Pasos Recomendados

1. **Investigar por qué algunos chats SÍ tienen métricas y otros NO**:
   ```sql
   -- Comparar chats CON métricas vs SIN métricas
   SELECT 
     c.id,
     c.last_message_time,
     cm.total_messages,
     cm.last_calculated_at,
     (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as actual_message_count
   FROM chats c
   LEFT JOIN conversation_metrics cm ON cm.chat_id = c.id
   WHERE c.bot_id = 'TU_BOT_ID'
     AND c.is_group = false
   ORDER BY cm.total_messages IS NULL, c.last_message_time DESC
   LIMIT 20;
   ```

2. **Verificar si el trigger se dispara correctamente**:
   ```sql
   -- Revisar código del trigger
   SELECT prosrc 
   FROM pg_proc 
   WHERE proname = 'trigger_recalculate_metrics';
   ```

3. **Decidir estrategia de población**:
   - ¿Población batch manual?
   - ¿Fallback en frontend?
   - ¿Vista híbrida?
   - ¿Lazy loading?

4. **Implementar solución elegida y verificar**:
   - Ejecutar queries de prueba
   - Verificar en frontend
   - Medir performance

---

## Datos de Contexto

**Base de Datos**: PostgreSQL (Supabase)  
**Framework Frontend**: Next.js 16  
**Librería Supabase**: `@supabase/supabase-js`  

**Endpoints Supabase**:
- URL: `process.env.NEXT_PUBLIC_SUPABASE_URL`
- Anon Key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Tablas Relacionadas**:
- `chats` (conversaciones)
- `messages` (mensajes)
- `conversation_metrics` (métricas precalculadas)
- `contacts` (contactos)

---

## Logs y Evidencia

### Query de Diagnóstico Ejecutado
```sql
-- Ver mensajes recientes (últimas 24 horas)
SELECT 
  m.id,
  m.chat_id,
  m.message_id,
  m.timestamp,
  m.from_me,
  m.body,
  cm.total_messages,
  cm.last_calculated_at
FROM messages m
LEFT JOIN conversation_metrics cm ON cm.chat_id = m.chat_id
WHERE m.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY m.timestamp DESC
LIMIT 10;
```

### Resultado
| timestamp | total_messages | last_calculated_at |
|-----------|----------------|-------------------|
| 2026-05-11 02:57:19 | **26891** | 2026-05-11 02:57:20 ✅ |
| 2026-05-11 02:55:57 | **29** | 2026-05-11 02:55:57 ✅ |
| 2026-05-11 02:55:57 | **29** | 2026-05-11 02:55:57 ✅ |
| 2026-05-11 02:55:09 | **18** | 2026-05-11 02:55:09 ✅ |

**Conclusión**: Los triggers SÍ funcionan para mensajes nuevos.

---

## Preguntas Pendientes

1. ¿Por qué el chat `cacf6cf0-d36b-4127-ae69-18b7d39604f3` SÍ tiene métricas (78 mensajes) pero los demás NO?
2. ¿Cuál es el criterio que determina si un chat tiene métricas o no?
3. ¿Cuántos chats totales tienen métricas vs cuántos NO?
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE cm.id IS NOT NULL) as con_metricas,
     COUNT(*) FILTER (WHERE cm.id IS NULL) as sin_metricas,
     COUNT(*) as total
   FROM chats c
   LEFT JOIN conversation_metrics cm ON cm.chat_id = c.id
   WHERE c.is_group = false
     AND c.chat_id NOT ILIKE '%status%';
   ```

4. ¿Existe algún patrón temporal? (ej: solo chats después de cierta fecha tienen métricas)

---

## Notas del Desarrollador

- La decisión de NO ejecutar `populate_all_conversation_metrics()` fue tomada para evitar timeouts
- El trigger está funcionando correctamente para mensajes nuevos
- El problema NO es técnico del trigger, es de **cobertura de datos**
- Se necesita una estrategia para llenar métricas de chats antiguos O implementar fallback en frontend
