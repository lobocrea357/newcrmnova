# Cambios de paginación y scroll en Dashboard y Chat

## Objetivo

Optimizar el rendimiento y la experiencia de uso del dashboard y de la vista de chat:

- Reduciendo la cantidad de datos que se cargan de Supabase en cada vista.
- Mejorando los tiempos de respuesta al cambiar de bot y al abrir una conversación.
- Replicando el comportamiento de WhatsApp (paginación, scroll inverso, carga progresiva).

---

## Resumen rápido de cambios

- **Paginación de conversaciones por bot** en el dashboard (10 conversaciones por página).
- **Persistencia** de la última conversación visitada y de la **página actual del paginador** por bot.
- **Scroll inverso con carga progresiva** de mensajes en la vista de chat (últimos 50 mensajes + carga al hacer scroll hacia arriba).
- **Corrección del contador de "Bots Activos"** para que considere correctamente el estado `working` (y variantes de mayúsculas/minúsculas).

---

## 1. Paginación de conversaciones en el dashboard

### 1.1 Cambios en `dashboard/src/lib/supabase.js`

**Función modificada:** `getConversationsByBot`

Antes:
- Firma simple: `getConversationsByBot(botId)`.
- Devolvía **todas** las conversaciones del bot en un solo arreglo.

Ahora:

```ts
export async function getConversationsByBot(
  botId: string,
  page = 1,
  pageSize = 10
): Promise<{
  data: any[];
  total: number;
  totalPages: number;
  currentPage: number;
}>;
```

Detalles de implementación:

- Obtiene primero el **total de conversaciones** del bot:
  - `select('*', { count: 'exact', head: true })` sobre la tabla `chats`.
- Calcula:
  - `total = totalCount || 0`.
  - `totalPages = Math.ceil(total / pageSize)`.
  - Rango para Supabase: `from = (page - 1) * pageSize`, `to = from + pageSize - 1`.
- Obtiene las conversaciones de la página actual:
  - `order('created_at', { ascending: false })` para ver primero las más recientes.
  - `.range(from, to)` para limitar los resultados a la página.
- Para cada chat, sigue calculando:
  - `message_count` (conteo de mensajes por `chat_id`).
  - `contact_name` y `contact_phone` desde la relación `contacts`.
- Devuelve un objeto con:
  - `data`: arreglo de conversaciones de la página.
  - `total`: total de conversaciones del bot.
  - `totalPages`: número total de páginas.
  - `currentPage`: página solicitada.

### 1.2 Cambios en `dashboard/src/app/dashboard/page.js`

#### Estado nuevo y modificado

Se añadieron/ajustaron los siguientes estados en `DashboardContent`:

- `conversations`: mantiene las conversaciones por bot, indexadas por `botId`.
- `conversationsPagination`: mantiene la **paginación por bot**, con la forma:
  
  ```ts
  conversationsPagination[botId] = {
    currentPage: number;
    totalPages: number;
    total: number;
  };
  ```

#### `fetchConversations(botId, page = 1)`

- Ahora recibe también `page` (por defecto `1`).
- Llama a `getConversationsByBot(botId, page, 10)`.
- Actualiza:
  - `conversations[botId] = result.data`.
  - `conversationsPagination[botId] = { currentPage, totalPages, total }`.
- Mantiene el control de `loadingConversations[botId]` para mostrar estados de carga.

#### Controles de paginación en la UI

En el panel derecho (lista de conversaciones del bot seleccionado):

- Se añadió un bloque de **paginación** debajo de la lista cuando `selectedBotPagination.totalPages > 1`.
- Controles:
  - Botón **Anterior** (`ChevronLeft`):
    - Llama a `handlePageChange(selectedBotId, currentPage - 1)`.
    - Deshabilitado cuando `currentPage === 1` o `loadingConversations[botId]`.
  - Botón **Siguiente** (`ChevronRight`):
    - Llama a `handlePageChange(selectedBotId, currentPage + 1)`.
    - Deshabilitado cuando `currentPage === totalPages` o `loadingConversations[botId]`.
- Se muestra un resumen:
  
  ```
  Página X de Y (N conversaciones totales)
  ```

#### Persistencia de la página del paginador por bot

Para evitar que el usuario tenga que "buscar" nuevamente una conversación tras volver del chat al dashboard, se implementó:

- **Al hacer click en una conversación** (`handleConversationClick(botId, chatId)`):
  - Se guarda `lastChatId` en `localStorage`:
    - Clave: `dashboard:lastChatId`.
  - Se guarda la **página actual del paginador** para ese bot en `localStorage`:
    - Clave: `dashboard:bot:${botId}:page`.
    - Valor: `currentPagination.currentPage`.

- **Al cargar el dashboard con un `botId` en la URL** (efecto con `searchParams`):
  - Se lee `botIdFromUrl`.
  - Se intenta recuperar la página guardada desde `localStorage`:
    - Clave: `dashboard:bot:${botIdFromUrl}:page`.
  - Si existe y es válida, se llama a `fetchConversations(botIdFromUrl, pageRecuperada)`.
  - Si no existe o hay error, se llama a `fetchConversations(botIdFromUrl)` (página 1).

### 1.3 Marcado de la conversación visitada

- Se sigue utilizando `lastChatId` para marcar la conversación que el usuario vio por última vez.
- `lastChatId` se persiste en `localStorage` con la clave `dashboard:lastChatId`.
- En la lista de conversaciones:
  
  ```jsx
  className={
    lastChatId === String(conv.id)
      ? 'bg-indigo-50 hover:bg-indigo-100'
      : 'hover:bg-gray-50'
  }
  ```

Esto permite que, al volver desde la vista de chat, la conversación que se estaba viendo quede resaltada y visible en la **misma página** del paginador.

---

## 2. Scroll inverso e infinite scroll en la vista de chat

### 2.1 Cambios en `dashboard/src/lib/supabase.js`

**Función modificada:** `getConversationWithMessages`

Antes:
- `getConversationWithMessages(chatId)` devolvía la conversación y **todos** los mensajes asociados, ordenados ascendentemente por `timestamp`.

Ahora:

```ts
export async function getConversationWithMessages(
  chatId: string,
  limit = 50,
  beforeTimestamp: string | null = null
): Promise<{
  conversation: any;
  messages: any[];       // Ordenados de más antiguo a más reciente
  hasMore: boolean;      // true si hay mensajes más antiguos
  oldestTimestamp: string | null; // timestamp del mensaje más antiguo del lote devuelto
}>;
```

Detalles de implementación:

- Consulta base:
  - Tabla: `messages`.
  - Filtro: `.eq('chat_id', chatId)`.
  - Orden: `.order('timestamp', { ascending: false })` (más recientes primero).
  - Límite: `.limit(limit + 1)` para detectar si hay más mensajes antiguos.
- Si se recibe `beforeTimestamp`:
  - Se añade `.lt('timestamp', beforeTimestamp)` para traer solo mensajes más antiguos que el lote actual.
- Lógica de paginación:
  - Si el número de mensajes devueltos es `> limit` → `hasMore = true`.
  - Se usa `messages.slice(0, limit)` para quedarse solo con el lote solicitado.
  - Luego se **invierte** el arreglo `messagesToReturn.reverse()` para devolverlos **ordenados ascendentemente** (de más antiguo a más nuevo), que es lo que espera la UI.
- Se calcula `oldestTimestamp` como el `timestamp` del primer mensaje del lote (`sortedMessages[0]`).

### 2.2 Cambios en `dashboard/src/components/ChatView.js`

#### Estado y refs nuevos

- `messages`: lista de mensajes mostrados en el chat (últimos N, paginados).
- `loadingMore`: indica si se están cargando mensajes antiguos.
- `hasMore`: indica si existen más mensajes antiguos en Supabase.
- `oldestTimestamp`: `timestamp` del mensaje más antiguo actualmente cargado (se usa como cursor para pedir más).
- `messagesContainerRef`: referencia al contenedor con scroll de los mensajes.
- `previousScrollHeightRef`: guarda la altura del scroll **antes** de cargar más mensajes, para poder compensar.
- `isInitialLoadRef`: flag para ejecutar el scroll al fondo solo una vez en la carga inicial.

#### Carga inicial de la conversación

```js
const loadConversation = async () => {
  const result = await getConversationWithMessages(chatId, 50);
  setConversation(result.conversation);
  setMessages(result.messages);
  setHasMore(result.hasMore);
  setOldestTimestamp(result.oldestTimestamp);
};
```

- Se cargan solo los **últimos 50 mensajes**.
- `messages` queda ya ordenado de más antiguo (arriba) a más reciente (abajo).

#### Scroll inicial al fondo (estilo WhatsApp)

```js
useEffect(() => {
  if (messages.length > 0 && isInitialLoadRef.current) {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      isInitialLoadRef.current = false;
    }, 100);
  }
}, [messages]);
```

- Se usa `setTimeout` para asegurar que el DOM esté completamente renderizado antes de mover el scroll.
- De esta forma, al abrir el chat, el usuario ve **directamente los mensajes más recientes al fondo**, como en WhatsApp.

#### Carga de mensajes antiguos al hacer scroll hacia arriba

```js
const handleScroll = () => {
  if (!messagesContainerRef.current || loadingMore || !hasMore) return;

  const { scrollTop } = messagesContainerRef.current;

  if (scrollTop < 50) {
    loadMoreMessages();
  }
};
```

```js
const loadMoreMessages = async () => {
  if (loadingMore || !hasMore || !oldestTimestamp) return;

  setLoadingMore(true);
  
  if (messagesContainerRef.current) {
    previousScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
  }

  const result = await getConversationWithMessages(chatId, 50, oldestTimestamp);

  if (result && result.messages.length > 0) {
    setMessages(prev => [...result.messages, ...prev]);
    setHasMore(result.hasMore);
    setOldestTimestamp(result.oldestTimestamp);
  }

  setLoadingMore(false);
};
```

- Cuando el usuario se acerca a la parte superior del scroll (`scrollTop < 50`), se cargan **50 mensajes más antiguos**.
- Los nuevos mensajes antiguos se **pre-pendean**: `[nuevosViejos, ...prev]`.

#### Mantenimiento de la posición de scroll

Después de cargar mensajes antiguos:

```js
useEffect(() => {
  if (!loadingMore && messagesContainerRef.current && previousScrollHeightRef.current > 0) {
    const newScrollHeight = messagesContainerRef.current.scrollHeight;
    const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
    messagesContainerRef.current.scrollTop = scrollDiff;
    previousScrollHeightRef.current = 0;
  }
}, [loadingMore, messages]);
```

- Se calcula la diferencia entre la nueva altura del contenido y la anterior.
- Se ajusta `scrollTop` para que el usuario **permanezca viendo el mismo mensaje** tras la carga, sin saltos.

#### Manejo de mensajes en tiempo real

- Se mantiene la suscripción a cambios en la tabla `messages` de Supabase.
- En el handler `handleMessageChange`:
  - Para `eventType === 'INSERT'` se agrega el nuevo mensaje **al final** del array `messages` (parte inferior del chat).
  - Para `UPDATE` o `DELETE` se vuelve a cargar la conversación (comportamiento conservador y seguro).

#### Indicadores visuales

- Mientras `loadingMore` es `true` se muestra un indicador en la parte superior:

  ```
  [ ⟳ Cargando mensajes anteriores... ]
  ```

- Cuando `!hasMore` y hay mensajes cargados, se muestra una pastilla:

  ```
  📜 Inicio de la conversación
  ```

- En el header del chat se muestra:

  ```
  {messages.length} mensajes {hasMore && '(+más)'}
  ```

---

## 3. Corrección del contador de "Bots Activos"

### 3.1 Ubicación

- Archivo: `dashboard/src/app/dashboard/page.js`.
- Card de estadísticas en la parte superior del dashboard.

### 3.2 Cambio realizado

Antes:

```jsx
bots.filter(
  (bot) => bot.status === 'working' || bot.status === 'active'
).length
```

Problema:
- Si `bot.status` venía en mayúsculas (`"WORKING"`) u otra variante, el contador no lo consideraba como activo.

Ahora:

```jsx
bots.filter((bot) => isBotActive(bot.status)).length
```

Donde `isBotActive` es:

```js
const isBotActive = (status) => {
  if (!status) return false;
  const statusLower = status.toLowerCase();
  return statusLower === 'working' || statusLower === 'active';
};
```

Beneficio:
- El contador de "Bots Activos" es consistente con la lógica usada en el listado de asesores/bots y tolera variaciones de mayúsculas/minúsculas.

---

## 4. Comportamiento final esperado

1. **Dashboard / Lista de conversaciones**
   - Al seleccionar un bot:
     - Se cargan sus conversaciones paginadas (10 por página).
     - Si ya existía una página seleccionada previamente para ese bot, se restaura.
   - Al entrar a una conversación específica:
     - Se guarda el `lastChatId` y la página actual para ese bot en `localStorage`.
   - Al volver desde la vista de chat al dashboard:
     - Se mantiene el mismo bot seleccionado.
     - Se restaura la página del paginador.
     - La conversación visitada aparece resaltada.

2. **Vista de chat**
   - Al abrir un chat:
     - Se cargan solo los **últimos 50 mensajes**.
     - El scroll se posiciona al **fondo** mostrando el mensaje más reciente.
   - Al hacer scroll hacia arriba:
     - Se cargan tramos de 50 mensajes más antiguos de forma progresiva.
     - No hay saltos bruscos de scroll; se mantiene el contexto visual.
   - Los mensajes se muestran ordenados como en WhatsApp:
     - Mensajes más recientes **abajo**, más antiguos **arriba**.

3. **Estadísticas**
   - El card de "Bots Activos" refleja correctamente la cantidad de bots cuyo estado es `working`/`active` sin importar el uso de mayúsculas.
