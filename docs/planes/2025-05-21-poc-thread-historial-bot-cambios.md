# Implementación de Historial de Cambios de Bot en Threads PoC

> **Para trabajadores agentes:** SUB-SKILL REQUERIDO: Use superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para seguimiento.

**Objetivo:** Implementar historial completo de cambios de bot en el sistema de threads globales PoC mediante la creación de una tabla de historial en paralelo, permitiendo tracking de reasignaciones sin afectar el performance de consultas frecuentes.

**Arquitectura:** Separación de datos en caliente (estado actual en `poc_thread_chats`) y datos en frío (historial completo en `poc_thread_chat_history`). Esto optimiza consultas frecuentes (lista de threads) mientras mantiene historial completo para timeline detallado.

**Tech Stack:** PostgreSQL (Supabase), Node.js (Express), React (Next.js), Supabase Client

---

## Estructura de Archivos

**Archivos a crear:**
- `docs/migrations/2025-05-21-poc-thread-chat-history.sql` - Script de migración SQL para ejecución manual
- `docs/migrations/2025-05-21-poc-thread-chat-history-indexes.sql` - Índices adicionales para performance

**Archivos a modificar:**
- `src/services/pocThreadService.js` - Lógica de sincronización de threads (líneas 261-434)
- `src/services/pocEventService.js` - Timeline enriquecido (líneas 132-159)
- `dashboard/src/components/poc/ThreadRow.jsx` - Visualización de bot actual (líneas 11-66)
- `dashboard/src/components/poc/TimelineEnriched.jsx` - Visualización de timeline (líneas 266-305)

---

## FASE 1: Migración de Base de Datos

### Task 1: Crear script SQL de migración

**Files:**
- Create: `docs/migrations/2025-05-21-poc-thread-chat-history.sql`

- [ ] **Step 1: Crear archivo de migración con la nueva tabla de historial**

```sql
-- ============================================================================
-- Migración: Tabla de Historial de Cambios de Bot en Threads PoC
-- Fecha: 2025-05-21
-- Propósito: Permitir tracking completo de reasignaciones de bot sin afectar performance
-- ============================================================================

-- Tabla de historial de cambios de bot
-- Esta tabla almacena TODOS los registros de asignación de bot a un chat
-- Permitiendo reconstruir el timeline completo de reasignaciones
CREATE TABLE IF NOT EXISTS public.poc_thread_chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  chat_id uuid NOT NULL,
  bot_name text NOT NULL,
  started_at timestamp without time zone NOT NULL,
  ended_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT poc_thread_chat_history_thread_id_fkey 
    FOREIGN KEY (thread_id) REFERENCES public.poc_customer_threads(id) ON DELETE CASCADE
);

-- Índice para consultas por thread_id (timeline de un thread específico)
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_thread_id_idx 
  ON public.poc_thread_chat_history(thread_id);

-- Índice para consultas por chat_id (historial de un chat específico)
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_chat_id_idx 
  ON public.poc_thread_chat_history(chat_id);

-- Índice compuesto para ordenar cronológicamente por thread
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_thread_started_idx 
  ON public.poc_thread_chat_history(thread_id, started_at);

-- Índice para consultas de bot específico
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_bot_name_idx 
  ON public.poc_thread_chat_history(bot_name);

-- Comentario para documentación
COMMENT ON TABLE public.poc_thread_chat_history IS 
  'Historial completo de asignaciones de bot a chats. Cada cambio de bot crea un nuevo registro con started_at y ended_at. La tabla poc_thread_chats mantiene solo el estado actual activo.';

COMMENT ON COLUMN public.poc_thread_chat_history.thread_id IS 
  'ID del thread al que pertenece este chat';

COMMENT ON COLUMN public.poc_thread_chat_history.chat_id IS 
  'ID del chat (UUID de la tabla chats)';

COMMENT ON COLUMN public.poc_thread_chat_history.bot_name IS 
  'Nombre del bot que atendió este chat (session_name de la tabla bots)';

COMMENT ON COLUMN public.poc_thread_chat_history.started_at IS 
  'Timestamp cuando este bot empezó a atender el chat';

COMMENT ON COLUMN public.poc_thread_chat_history.ended_at IS 
  'Timestamp cuando este bot dejó de atender el chat (NULL si es el bot actual)';

COMMENT ON COLUMN public.poc_thread_chat_history.created_at IS 
  'Timestamp cuando se creó este registro de historial';
```

- [ ] **Step 2: Guardar el archivo**

El archivo se ha guardado en: `docs/migrations/2025-05-21-poc-thread-chat-history.sql`

- [ ] **Step 3: Notificar al usuario para ejecución manual**

**NOTA PARA EL USUARIO:** Este script SQL debe ejecutarse manualmente en el SQL Editor de Supabase. No hay dependencias de otros scripts.

---

## FASE 2: Backend - Modificar pocThreadService.js

### Task 2: Actualizar updateThreadForNewMessage para escribir en historial

**Files:**
- Modify: `src/services/pocThreadService.js:332-410`

- [ ] **Step 1: Leer el archivo actual para entender el contexto**

```bash
# El archivo ya ha sido leído en la fase de investigación
# Contexto: Líneas 332-410 manejan la detección de cambio de bot
```

- [ ] **Step 2: Modificar el método updateThreadForNewMessage para escribir en historial**

Reemplazar la sección de detección de cambio (líneas 332-410) con:

```javascript
// Verificar si ya existe un registro para este chat en poc_thread_chats
const { data: existingChat, error: existingError } = await supabase
  .from('poc_thread_chats')
  .select('id, bot_name, started_at')
  .eq('thread_id', thread.id)
  .eq('chat_id', chatId)
  .single();

let botChanged = false;

if (existingChat && existingChat.bot_name !== botName) {
  console.log(`[PoC Threads] 🔄 DETECTADO CAMBIO DE BOT: ${existingChat.bot_name} → ${botName}`);
  botChanged = true;

  // PASO 1: Guardar registro anterior en historial ANTES de actualizar
  try {
    await supabase
      .from('poc_thread_chat_history')
      .insert({
        thread_id: thread.id,
        chat_id: chatId,
        bot_name: existingChat.bot_name,
        started_at: existingChat.started_at,
        ended_at: messageTimestamp
      });
    console.log(`[PoC Threads] ✅ Registro anterior guardado en historial: ${existingChat.bot_name}`);
  } catch (historyError) {
    console.error('[PoC Threads] ❌ ERROR guardando en historial:', historyError);
    // No bloquear el flujo principal si falla el historial
  }

  // PASO 2: Actualizar el registro actual en poc_thread_chats con el nuevo bot
  const { error: updateError } = await supabase
    .from('poc_thread_chats')
    .update({ 
      bot_name: botName,
      started_at: messageTimestamp,
      ended_at: null
    })
    .eq('id', existingChat.id);

  if (updateError) {
    console.error('[PoC Threads] ❌ ERROR actualizando chat actual:', updateError);
  } else {
    console.log(`[PoC Threads] ✅ Chat actual actualizado con nuevo bot: ${botName}`);
  }

  // PASO 3: Insertar nuevo registro en historial para el bot actual
  try {
    await supabase
      .from('poc_thread_chat_history')
      .insert({
        thread_id: thread.id,
        chat_id: chatId,
        bot_name: botName,
        started_at: messageTimestamp,
        ended_at: null
      });
    console.log(`[PoC Threads] ✅ Nuevo registro guardado en historial: ${botName}`);
  } catch (historyError) {
    console.error('[PoC Threads] ❌ ERROR guardando nuevo registro en historial:', historyError);
  }

  // PASO 4: Crear evento de reasignación
  try {
    await pocEventService.createEvent({
      thread_id: thread.id,
      event_type: 'REASSIGNMENT',
      event_data: {
        previous_bot: existingChat.bot_name,
        new_bot: botName,
        chat_id: chatId
      },
      notes: `Reasignación de bot: ${existingChat.bot_name} → ${botName}`
    });
    console.log(`[PoC Threads] ✅ Evento REASSIGNMENT creado`);
  } catch (eventError) {
    console.error('[PoC Threads] ❌ ERROR creando evento REASSIGNMENT:', eventError.message);
  }
} else if (existingChat) {
  // No hay cambio de bot, hacer upsert normal
  const { error: linkError } = await supabase
    .from('poc_thread_chats')
    .upsert({
      thread_id: thread.id,
      chat_id: chatId,
      bot_name: botName,
      started_at: existingChat.started_at || messageTimestamp
    }, { onConflict: 'thread_id,chat_id' });

  if (linkError) {
    console.error('[PoC Threads] ❌ ERROR linking chat:', linkError);
  } else {
    console.log(`[PoC Threads] ✅ Chat vinculado: ${chatId} (Bot: ${botName})`);
  }
} else {
  // No existe registro, crear nuevo
  const { error: insertError } = await supabase
    .from('poc_thread_chats')
    .insert({
      thread_id: thread.id,
      chat_id: chatId,
      bot_name: botName,
      started_at: messageTimestamp
    });

  if (insertError) {
    console.error('[PoC Threads] ❌ ERROR creando chat:', insertError);
  } else {
    console.log(`[PoC Threads] ✅ Chat creado: ${chatId} (Bot: ${botName})`);
  }

  // También insertar en historial
  try {
    await supabase
      .from('poc_thread_chat_history')
      .insert({
        thread_id: thread.id,
        chat_id: chatId,
        bot_name: botName,
        started_at: messageTimestamp,
        ended_at: null
      });
    console.log(`[PoC Threads] ✅ Registro inicial guardado en historial: ${botName}`);
  } catch (historyError) {
    console.error('[PoC Threads] ❌ ERROR guardando registro inicial en historial:', historyError);
  }
}
```

- [ ] **Step 3: Verificar que no haya errores de sintaxis**

Revisar:
- Todas las llaves están cerradas
- Los await están correctamente colocados
- Los console.log son informativos
- El manejo de errores no bloquea el flujo principal

- [ ] **Step 4: Commit**

```bash
git add src/services/pocThreadService.js
git commit -m "feat(poc): escribir historial de cambios de bot en poc_thread_chat_history"
```

---

### Task 3: Actualizar syncThreadsFromMessages para poblar historial inicial

**Files:**
- Modify: `src/services/pocThreadService.js:146-159`

- [ ] **Step 1: Modificar el método _linkChatsToThread para escribir en historial**

Reemplazar el método _linkChatsToThread (líneas 146-159) con:

```javascript
async _linkChatsToThread(threadId, chats) {
  // Primero insertar en poc_thread_chats (estado actual)
  const records = chats.map(chat => ({
    thread_id: threadId,
    chat_id: chat.chat_id,
    bot_name: chat.bot_name,
    started_at: chat.started_at
  }));

  for (const record of records) {
    await supabase
      .from('poc_thread_chats')
      .upsert(record, { onConflict: 'thread_id,chat_id' });
    
    // También insertar en historial
    try {
      await supabase
        .from('poc_thread_chat_history')
        .insert({
          thread_id: threadId,
          chat_id: record.chat_id,
          bot_name: record.bot_name,
          started_at: record.started_at,
          ended_at: null
        });
    } catch (historyError) {
      console.error('[PoC Threads] Error guardando en historial durante sync:', historyError);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/pocThreadService.js
git commit -m "feat(poc): poblar historial inicial durante syncThreadsFromMessages"
```

---

### Task 4: Actualizar getThreadTimeline para incluir historial

**Files:**
- Modify: `src/services/pocThreadService.js:444-483`

- [ ] **Step 1: Modificar el método getThreadTimeline para unir datos de historial**

Reemplazar el método getThreadTimeline (líneas 444-483) con:

```javascript
async getThreadTimeline(threadId) {
  console.log(`[PoC Threads] Obteniendo timeline para thread ${threadId}`);

  // Obtener chat_ids vinculados al thread (solo estado actual)
  const { data: threadChats, error: chatsError } = await supabase
    .from('poc_thread_chats')
    .select('chat_id')
    .eq('thread_id', threadId);

  if (chatsError) {
    console.error('[PoC Threads] Error obteniendo thread_chats:', chatsError);
    throw chatsError;
  }

  if (!threadChats || threadChats.length === 0) {
    console.log(`[PoC Threads] Thread ${threadId} no tiene chats vinculados`);
    return [];
  }

  const chatIds = threadChats.map(tc => tc.chat_id);
  console.log(`[PoC Threads] Thread ${threadId}: ${chatIds.length} chats vinculados`);

  // Obtener mensajes de esos chats con información del bot
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *,
      bot:bots(session_name)
    `)
    .in('chat_id', chatIds)
    .order('timestamp', { ascending: true });

  if (messagesError) {
    console.error('[PoC Threads] Error obteniendo mensajes:', messagesError);
    throw messagesError;
  }

  // Enriquecer mensajes con información del historial de bots
  // Esto permite saber qué bot estaba activo en cada momento
  const enrichedMessages = await Promise.all(
    messages.map(async (msg) => {
      // Obtener el bot_name del historial para el timestamp del mensaje
      const { data: historyRecord } = await supabase
        .from('poc_thread_chat_history')
        .select('bot_name')
        .eq('chat_id', msg.chat_id)
        .lte('started_at', msg.timestamp)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...msg,
        thread_bot_name: historyRecord?.bot_name || msg.bot?.session_name || 'Desconocido'
      };
    })
  );

  console.log(`[PoC Threads] Thread ${threadId}: ${enrichedMessages?.length || 0} mensajes enriquecidos`);
  return enrichedMessages || [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/pocThreadService.js
git commit -m "feat(poc): enriquecer timeline con historial de bots desde poc_thread_chat_history"
```

---

## FASE 3: Backend - Modificar pocEventService.js

### Task 5: Actualizar getEnrichedTimeline para usar datos enriquecidos

**Files:**
- Modify: `src/services/pocEventService.js:132-159`

- [ ] **Step 1: Modificar el método getEnrichedTimeline para usar thread_bot_name**

El método ya llama a `pocThreadService.getThreadTimeline(threadId)` que ahora retorna mensajes enriquecidos con `thread_bot_name`. No se requiere modificación adicional en este servicio.

- [ ] **Step 2: Verificar que el método funcione correctamente con los datos enriquecidos**

Los mensajes ahora tienen `thread_bot_name` que indica qué bot estaba activo en el momento del mensaje, permitiendo detección correcta de reasignaciones en el frontend.

---

## FASE 4: Frontend - Modificar ThreadRow.jsx

### Task 6: Actualizar ThreadRow para usar datos del historial

**Files:**
- Modify: `dashboard/src/components/poc/ThreadRow.jsx:11-18`

- [ ] **Step 1: Modificar la lógica de obtención del bot actual**

La lógica actual (líneas 11-18) ya obtiene el bot más reciente por `started_at`, lo cual es correcto. No se requiere modificación porque:
- `poc_thread_chats` mantiene solo el estado actual
- El bot actual es el único registro en esta tabla
- No hay necesidad de filtrar por `ended_at IS NULL`

- [ ] **Step 2: Verificar que la visualización sea correcta**

El componente ya muestra correctamente el bot actual. No se requieren cambios.

---

## FASE 5: Frontend - Modificar TimelineEnriched.jsx

### Task 7: Actualizar detección de reasignación en timeline

**Files:**
- Modify: `dashboard/src/components/poc/TimelineEnriched.jsx:266-305`

- [ ] **Step 1: Modificar la lógica de detección de reasignación**

Reemplazar la sección de detección de reasignación (líneas 266-305) con:

```jsx
// Detectar reasignación de bot (solo para mensajes)
const isReassignment = item.type === 'message' &&
  index > 0 &&
  timeline[index - 1].type === 'message' &&
  timeline[index - 1].data?.thread_bot_name !== item.data?.thread_bot_name;
```

- [ ] **Step 2: Actualizar el marcador visual de reasignación**

Reemplazar el marcador visual (líneas 289-305) con:

```jsx
{/* Marcador de reasignación de bot */}
{isReassignment && (
  <div className="my-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
    <div className="flex items-center gap-2 text-amber-800">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span className="font-semibold">Reasignación de Bot</span>
    </div>
    <div className="text-sm text-amber-700 mt-1">
      <span className="font-medium">{timeline[index - 1].data?.thread_bot_name || 'Bot anterior'}</span>
      {' → '}
      <span className="font-medium">{item.data?.thread_bot_name || 'Bot actual'}</span>
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/poc/TimelineEnriched.jsx
git commit -m "feat(poc): usar thread_bot_name para detección de reasignaciones en timeline"
```

---

## FASE 6: Code Review y Verificación

### Task 8: Invocar code-review-excellence para revisión completa

**Files:**
- Review: Todos los archivos modificados

- [ ] **Step 1: Invocar skill code-review-excellence**

Usar el skill code-review-excellence para revisar:
- `src/services/pocThreadService.js` - Cambios en lógica de sincronización
- `src/services/pocEventService.js` - Verificación de integración
- `dashboard/src/components/poc/TimelineEnriched.jsx` - Cambios en detección de reasignación

- [ ] **Step 2: Aplicar correcciones sugeridas por code-review-excellence**

Implementar cualquier corrección sugerida por el review.

- [ ] **Step 3: Commit final de correcciones**

```bash
git add .
git commit -m "fix(poc): aplicar correcciones de code-review-excellence"
```

---

## FASE 7: Testing Manual

### Task 9: Verificación manual de la implementación

**Files:**
- Test: Sistema completo

- [ ] **Step 1: Ejecutar el script SQL de migración**

El usuario debe ejecutar manualmente en Supabase SQL Editor:
```bash
# Ejecutar el contenido de: docs/migrations/2025-05-21-poc-thread-chat-history.sql
```

- [ ] **Step 2: Verificar que la tabla se creó correctamente**

```sql
-- Verificar que la tabla existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'poc_thread_chat_history';

-- Verificar los índices
SELECT * FROM pg_indexes 
WHERE tablename = 'poc_thread_chat_history';
```

- [ ] **Step 3: Probar el flujo de cambio de bot**

1. Enviar un mensaje con el bot `efrain_flash_moises_test` a un número
2. Desconectar ese bot y conectar `efrain_flash_moises`
3. Enviar otro mensaje al MISMO número con el nuevo bot
4. Verificar en la base de datos:
   - `poc_thread_chats` tiene solo 1 registro (bot actual)
   - `poc_thread_chat_history` tiene 2 registros (bot anterior + bot actual)
5. Verificar en el frontend:
   - Lista de threads muestra el bot actual
   - Timeline muestra el marcador de reasignación

- [ ] **Step 4: Verificar performance de consultas**

```sql
-- Verificar que la consulta de lista de threads sea rápida
EXPLAIN ANALYZE
SELECT * FROM poc_thread_chats 
WHERE thread_id = 'some-uuid';

-- Verificar que la consulta de timeline sea aceptable
EXPLAIN ANALYZE
SELECT * FROM poc_thread_chat_history 
WHERE thread_id = 'some-uuid'
ORDER BY started_at;
```

---

## FASE 8: Documentación

### Task 10: Actualizar documentación del esquema

**Files:**
- Modify: `docs/05-base-de-datos/esquemalocal.sql`

- [ ] **Step 1: Agregar la nueva tabla al esquema de referencia**

Agregar después de la tabla `poc_thread_chats` (línea 571):

```sql
CREATE TABLE public.poc_thread_chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  chat_id uuid NOT NULL,
  bot_name text NOT NULL,
  started_at timestamp without time zone NOT NULL,
  ended_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT poc_thread_chat_history_pkey PRIMARY KEY (id),
  CONSTRAINT poc_thread_chat_history_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.poc_customer_threads(id)
);
```

- [ ] **Step 2: Commit**

```bash
git add docs/05-base-de-datos/esquemalocal.sql
git commit -m "docs(poc): agregar tabla poc_thread_chat_history al esquema de referencia"
```

---

## Resumen de Cambios

**Base de Datos:**
- Nueva tabla `poc_thread_chat_history` para historial completo de cambios
- Índices optimizados para consultas por thread_id, chat_id, y bot_name

**Backend:**
- `pocThreadService.js`: Escribe en ambas tablas (estado actual + historial)
- `pocThreadService.js`: Enriquece mensajes con `thread_bot_name` desde historial
- `pocEventService.js`: Usa datos enriquecidos (sin cambios necesarios)

**Frontend:**
- `ThreadRow.jsx`: Sin cambios (ya funciona correctamente)
- `TimelineEnriched.jsx`: Usa `thread_bot_name` para detección de reasignaciones

---

## Puntos de Verificación Post-Implementación

- [ ] La tabla `poc_thread_chat_history` se crea correctamente
- [ ] Los índices se crean correctamente
- [ ] Cada cambio de bot crea un nuevo registro en historial
- [ ] `poc_thread_chats` mantiene solo el estado actual
- [ ] La lista de threads muestra el bot actual correctamente
- [ ] El timeline muestra marcadores de reasignación
- [ ] Las consultas frecuentes (lista) son rápidas
- [ ] Las consultas de timeline son aceptables
- [ ] No hay errores en los logs del webhook
- [ ] La documentación está actualizada
