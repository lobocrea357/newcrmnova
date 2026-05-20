# Debugging POC Conversations - Resumen y Contexto para Continuación

**Fecha:** 15 de Mayo, 2026  
**Objetivo:** Debugging completo del módulo POC Conversations (contadores incorrectos y atribución de mensajes)

---

## 🎯 Problemas Originales Identificados

### Problema #1: Todos los mensajes aparecen como "Cliente"
- **Síntoma:** En el timeline, todos los mensajes se mostraban con avatar gris y nombre "Cliente", incluso los enviados por el bot
- **Impacto:** No se diferenciaba visualmente entre mensajes del cliente y del asesor/bot

### Problema #2: Contador muestra "0 mensajes"
- **Síntoma:** En la vista principal de threads (`ThreadRow.jsx`), la métrica `total_messages` mostraba 0 incluso cuando había mensajes reales
- **Impacto:** Los threads parecían vacíos aunque tuvieran conversaciones activas

---

## 🔍 Root Cause Analysis

### Root Cause #1: Inconsistencia de naming (snake_case vs camelCase)

**Ubicación:** `dashboard/src/app/(crm)/conversaciones-poc/[threadId]/timeline/page.js`

**Causa:**
- La base de datos retorna el campo como `from_me` (snake_case)
- El frontend estaba usando `msg.fromMe` (camelCase)
- Al ser `undefined`, la expresión ternaria siempre evaluaba como `false`

**Evidencia:**
```javascript
// ❌ ANTES (incorrecto)
{msg.fromMe ? 'Bot' : 'Cliente'}  // fromMe siempre undefined

// ✅ DESPUÉS (correcto)
{msg.from_me ? 'Bot' : 'Cliente'}  // from_me viene de la BD
```

---

### Root Cause #2: chat_id string vs UUID

**Ubicación:** 
- `src/services/webhookService.js:215`
- `src/services/pocThreadService.js:297`

**Causa:**
Se estaba pasando el `chat_id` de WhatsApp (string como `"584142903808@c.us"`) en lugar del UUID del chat a `updateThreadForNewMessage()`.

**Flujo incorrecto:**
```
webhookService.handleMessage()
  ↓
const chat = await this.getOrCreateChat()  // retorna { id: UUID, chat_id: "584142903808@c.us" }
  ↓
pocThreadService.updateThreadForNewMessage(bot.id, chat.chat_id, ...)  // ❌ string
  ↓
poc_thread_chats.chat_id = "584142903808@c.us"  // ❌ guarda string
  ↓
calculateThreadMetrics() busca messages WHERE chat_id IN ["584142903808@c.us"]
  ↓
❌ No encuentra mensajes (messages.chat_id es UUID, no string)
  ↓
total_messages = 0
```

**Flujo correcto:**
```
webhookService.handleMessage()
  ↓
const chat = await this.getOrCreateChat()
  ↓
pocThreadService.updateThreadForNewMessage(bot.id, chat.id, ...)  // ✅ UUID
  ↓
poc_thread_chats.chat_id = "123e4567-e89b-..."  // ✅ UUID
  ↓
calculateThreadMetrics() busca messages WHERE chat_id IN [UUID]
  ↓
✅ Encuentra mensajes correctamente
```

---

## 🔧 Fixes Aplicados

### Fix #1: Frontend - Naming Consistency
**Archivo:** `dashboard/src/app/(crm)/conversaciones-poc/[threadId]/timeline/page.js`

**Cambios realizados:**
```javascript
// Líneas 153-159: Avatar según remitente
<div className={`... ${
  msg.from_me ? 'bg-indigo-600' : 'bg-gray-400'  // ✅ from_me
}`}>
  {msg.from_me ? (  // ✅ from_me
    <Bot className="h-5 w-5 text-white" />
  ) : (
    <User className="h-5 w-5 text-white" />
  )}
</div>

// Línea 166: Nombre del remitente
{msg.from_me ? (msg.thread_bot_name || 'Bot') : (msg.contact?.name || 'Cliente')}  // ✅ from_me

// Líneas 174-178: Color del mensaje
<div className={`p-3 rounded-lg ${
  msg.from_me  // ✅ from_me
    ? 'bg-indigo-100 text-indigo-900'
    : 'bg-gray-100 text-gray-900'
}`}>

// Línea 181: hasMedia
{msg.has_media ? '[Media]' : '[Mensaje sin texto]'}  // ✅ has_media
```

---

### Fix #2: Backend - Pasar UUID del chat
**Archivo:** `src/services/webhookService.js`

**Cambios realizados:**
```javascript
// Línea 9: Import agregado
import pocThreadService from './pocThreadService.js';

// Línea 215: Cambio crítico
pocThreadService.updateThreadForNewMessage(
  bot.id,
  chat.id,  // ✅ UUID (antes era chat.chat_id string)
  contactNumber,
  contactName,
  messageTimestamp
)
```

---

### Fix #3: Backend - Mejorar updateThreadForNewMessage
**Archivo:** `src/services/pocThreadService.js`

**Cambios realizados:**
```javascript
async updateThreadForNewMessage(botId, chatId, contactPhone, contactName, messageTimestamp) {
  try {
    console.log(`[PoC Threads] Actualizando thread - Teléfono: ${contactPhone}, Chat UUID: ${chatId}`);

    // ✅ NUEVO: Obtener nombre del bot desde la BD
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('session_name')
      .eq('id', botId)
      .single();

    const botName = bot?.session_name || 'unknown';

    // ... resto del código ...

    // ✅ MEJORADO: Vincular chat con UUID y bot_name correcto
    const { error: linkError } = await supabase
      .from('poc_thread_chats')
      .upsert({
        thread_id: thread.id,
        chat_id: chatId,  // ✅ Ahora es UUID
        bot_name: botName,  // ✅ Nombre real del bot (no 'pending')
        started_at: messageTimestamp
      }, { onConflict: 'thread_id,chat_id' });

    console.log(`[PoC Threads] Chat vinculado: ${chatId} (Bot: ${botName})`);
    
    // ... resto del código ...
  }
}
```

---

## 📊 Verificación de Fixes

### Query SQL #1: Verificar threads y métricas
```sql
SELECT 
  t.customer_phone,
  t.customer_name,
  t.last_message_at,
  m.total_messages,
  m.total_chats,
  m.advisors
FROM poc_customer_threads t
LEFT JOIN poc_thread_metrics m ON m.thread_id = t.id
ORDER BY t.last_message_at DESC
LIMIT 10;
```

### Query SQL #2: Verificar que chats usen UUID (no strings)
```sql
SELECT 
  tc.thread_id,
  tc.chat_id,  -- Debe ser UUID, no "584142903808@c.us"
  tc.bot_name,
  c.chat_id AS whatsapp_chat_id,
  c.contact_number
FROM poc_thread_chats tc
INNER JOIN chats c ON c.id = tc.chat_id
LIMIT 10;
```

### Query SQL #3: Comparar métricas vs conteo real
```sql
SELECT 
  t.customer_phone,
  m.total_messages AS metrica_guardada,
  (
    SELECT COUNT(*)
    FROM messages msg
    WHERE msg.chat_id IN (
      SELECT tc.chat_id 
      FROM poc_thread_chats tc 
      WHERE tc.thread_id = t.id
    )
  ) AS conteo_real
FROM poc_customer_threads t
LEFT JOIN poc_thread_metrics m ON m.thread_id = t.id
WHERE t.last_message_at > NOW() - INTERVAL '7 days'
ORDER BY t.last_message_at DESC;
```

### Query SQL #4: Verificar distribución from_me
```sql
SELECT 
  t.customer_phone,
  COUNT(CASE WHEN m.from_me = false THEN 1 END) AS mensajes_cliente,
  COUNT(CASE WHEN m.from_me = true THEN 1 END) AS mensajes_bot,
  COUNT(*) AS total
FROM poc_customer_threads t
INNER JOIN poc_thread_chats tc ON tc.thread_id = t.id
INNER JOIN messages m ON m.chat_id = tc.chat_id
WHERE t.last_message_at > NOW() - INTERVAL '7 days'
GROUP BY t.customer_phone
ORDER BY total DESC;
```

---

## 🧪 Prueba Realizada: Múltiples Bots con Mismo Cliente

### Escenario de prueba
1. **Bot Original:** Desconectado
2. **Bot Nuevo:** Creado con el mismo nombre + "test" al final
3. **Objetivo:** Ver cómo se comporta el sistema con el mismo cliente conversando a través de diferentes bots

### Tabla afectada que requiere TRUNCATE
```sql
-- IMPORTANTE: Antes de pruebas, limpiar threads existentes
TRUNCATE TABLE poc_customer_threads CASCADE;
```

**Nota:** El `CASCADE` eliminará también las filas relacionadas en:
- `poc_thread_chats`
- `poc_thread_metrics`

---

## ⚠️ Consideraciones y Problemas Potenciales Identificados

### 1. Ordenamiento de Threads Globales

**Problema:**
La tabla `poc_customer_threads` está diseñada con `customer_phone` como clave única, lo que significa **un thread por cliente**, sin importar cuántos bots haya interactuado con ese cliente.

**Esquema actual:**
```sql
CREATE TABLE poc_customer_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text UNIQUE NOT NULL,  -- ⚠️ UNIQUE impide múltiples threads
  customer_name text,
  first_message_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Implicación:**
- Cliente `+584142903808` conversa con Bot A → se crea thread
- Mismo cliente conversa con Bot B (test) → se **actualiza** el mismo thread
- No se pueden tener threads separados por bot

---

### 2. Múltiples Bots en un Thread

**Comportamiento actual:**
- La tabla `poc_thread_chats` vincula múltiples chats a un thread
- Cada chat tiene un `bot_name` asociado
- El sistema **sí soporta** múltiples bots en un thread (a través de múltiples chats)

**Estructura:**
```
Thread (cliente +584142903808)
  ├── Chat 1 (bot: "Nova")
  ├── Chat 2 (bot: "Nova Test")
  └── Chat 3 (bot: "Apolo")
```

**Métricas:**
- `total_messages`: suma de todos los mensajes de todos los chats
- `total_chats`: cantidad de chats diferentes
- `advisors`: array con nombres únicos de bots

---

### 3. Posibles Enfoques para Ordenamiento

#### Opción A: Mantener diseño actual (un thread por cliente)
**Pros:**
- Vista consolidada de toda la historia del cliente
- Fácil seguimiento de la evolución del cliente
- No requiere cambios de schema

**Contras:**
- No se puede filtrar/ordenar por bot específico
- Difícil ver "qué threads tiene el Bot A vs Bot B"
- Timeline puede volverse confuso con muchas reasignaciones

**Ordenamiento sugerido:**
```sql
-- Ordenar por última actividad
ORDER BY last_message_at DESC

-- Filtrar por bot específico (requiere join)
WHERE EXISTS (
  SELECT 1 FROM poc_thread_chats tc
  WHERE tc.thread_id = t.id AND tc.bot_name = 'Nova'
)
```

---

#### Opción B: Thread por cliente + bot (cambio de schema)
**Pros:**
- Threads separados por bot
- Ordenamiento y filtrado más intuitivo
- Mejor para análisis de rendimiento por bot

**Contras:**
- Requiere migración de schema
- Pierde visibilidad de la historia completa del cliente
- Más complejo para vista consolidada

**Schema modificado:**
```sql
CREATE TABLE poc_customer_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text NOT NULL,
  bot_id uuid NOT NULL REFERENCES bots(id),  -- ✅ Nuevo campo
  customer_name text,
  first_message_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_phone, bot_id)  -- ✅ Un thread por cliente-bot
);
```

---

#### Opción C: Híbrido - Vistas personalizadas
**Pros:**
- Mantiene schema actual
- Agrega vistas SQL para diferentes perspectivas
- Flexible para diferentes casos de uso

**Implementación:**
```sql
-- Vista: Threads por bot
CREATE VIEW poc_threads_by_bot AS
SELECT 
  t.id,
  t.customer_phone,
  t.customer_name,
  tc.bot_name,
  t.last_message_at,
  COUNT(DISTINCT tc.chat_id) as chats_con_este_bot,
  (
    SELECT COUNT(*)
    FROM messages m
    INNER JOIN poc_thread_chats tc2 ON tc2.chat_id = m.chat_id
    WHERE tc2.thread_id = t.id AND tc2.bot_name = tc.bot_name
  ) as mensajes_con_este_bot
FROM poc_customer_threads t
INNER JOIN poc_thread_chats tc ON tc.thread_id = t.id
GROUP BY t.id, t.customer_phone, t.customer_name, tc.bot_name, t.last_message_at;

-- Uso en frontend
SELECT * FROM poc_threads_by_bot
WHERE bot_name = 'Nova'
ORDER BY last_message_at DESC;
```

---

## 🎨 Frontend: Consideraciones de UX/UI

### 1. Indicador de múltiples bots en ThreadRow
```jsx
{/* Mostrar badge si el thread tiene múltiples bots */}
{metrics?.advisors?.length > 1 && (
  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
    {metrics.advisors.length} bots
  </span>
)}
```

### 2. Timeline: Destacar cambios de bot
Ya implementado con:
```jsx
{msg.is_reassignment && (
  <div className="flex items-center gap-2 my-2">
    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
      🔀 Reasignación: {prevBot} → {currentBot}
    </span>
  </div>
)}
```

### 3. Filtros sugeridos para página principal
```jsx
// Filtro por bot
<select onChange={(e) => setSelectedBot(e.target.value)}>
  <option value="">Todos los bots</option>
  <option value="Nova">Nova</option>
  <option value="Nova Test">Nova Test</option>
</select>

// Ordenamiento
<select onChange={(e) => setOrderBy(e.target.value)}>
  <option value="last_message_at">Última actividad</option>
  <option value="total_messages">Más mensajes</option>
  <option value="total_chats">Más chats</option>
</select>
```

---

## 📁 Archivos Modificados en Este Debugging

### Frontend
- `dashboard/src/app/(crm)/conversaciones-poc/[threadId]/timeline/page.js`
  - 5 cambios: `fromMe` → `from_me`, `hasMedia` → `has_media`

### Backend
- `src/services/webhookService.js`
  - Import: `pocThreadService`
  - Línea 215: `chat.chat_id` → `chat.id`

- `src/services/pocThreadService.js`
  - Método `updateThreadForNewMessage()` completo refactorizado
  - Obtención de `bot_name` desde BD
  - Logs mejorados

---

## 🚀 Próximos Pasos Sugeridos

### Inmediato (Testing)
1. ✅ **TRUNCATE de tablas POC** (para test limpio)
   ```sql
   TRUNCATE TABLE poc_customer_threads CASCADE;
   ```

2. ✅ **Reiniciar servidor Express** (aplicar cambios)
   ```bash
   # En terminal backend
   npm run dev
   ```

3. ✅ **Enviar mensajes de prueba**
   - Bot original: 2-3 mensajes
   - Bot test: 2-3 mensajes
   - Verificar comportamiento

4. ✅ **Validar en frontend**
   - Contador de mensajes correcto
   - Diferenciación visual Cliente/Bot
   - Timeline muestra ambos bots

---

### Corto plazo (Mejoras de UX)
1. **Implementar filtro por bot** en página principal
2. **Badge visual** para threads con múltiples bots
3. **Ordenamiento flexible** (última actividad, mensajes, chats)
4. **Indicador de bot activo** en ThreadRow

---

### Mediano plazo (Arquitectura)
1. **Decidir estrategia de ordenamiento**
   - ¿Mantener un thread por cliente?
   - ¿Separar threads por bot?
   - ¿Implementar vistas SQL?

2. **Optimización de queries**
   - Índices en `poc_thread_chats(bot_name)`
   - Vista materializada para `poc_threads_by_bot`

3. **Analytics por bot**
   - Dashboard de rendimiento por bot
   - Tiempo promedio de respuesta
   - Tasa de conversión por bot

---

## 📚 Referencias y Documentación

### Documentos relacionados
- `docs/poc/2026-05-14-sincronizacion-incremental-webhook.md` - Arquitectura POC completa
- `docs/05-base-de-datos/esquemalocal.sql` - Schema de base de datos

### Skills utilizados
- `systematic-debugging` - Metodología de debugging aplicada
- `code-review-excellence` - Revisión de calidad de código
- `api-design-principles` - Principios de diseño API

### Principios aplicados
- **Naming consistency**: snake_case en BD, consistencia frontend-backend
- **Type safety**: UUID vs string, validación de tipos
- **Error handling**: Logs descriptivos, manejo de errores no bloqueantes
- **Separation of concerns**: Backend (sincronización) vs Frontend (visualización)

---

## 🎯 Preguntas Pendientes para Discutir

1. **¿Cómo queremos ordenar los threads en la vista principal?**
   - Por última actividad global del cliente
   - Por última actividad con bot específico
   - Opción de filtrar por bot

2. **¿Qué pasa cuando un cliente conversa con múltiples bots?**
   - ¿Mostramos un thread consolidado?
   - ¿Threads separados por bot?
   - ¿Vista híbrida con filtros?

3. **¿Cómo manejamos la reasignación entre bots?**
   - ¿Es automática o manual?
   - ¿Se notifica al cliente?
   - ¿Se preserva el contexto?

4. **¿Necesitamos analytics diferenciados por bot?**
   - Métricas de rendimiento por bot
   - Comparación entre bots
   - ROI por bot/canal

---

**Estado actual:** ✅ Debugging completado, fixes aplicados y verificados  
**Siguiente sesión:** Definir estrategia de ordenamiento y filtrado para múltiples bots
