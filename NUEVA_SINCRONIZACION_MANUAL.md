# Nueva sincronización manual de mensajes

Este documento describe **de forma simple y detallada** cómo funciona la nueva sincronización manual de mensajes que combina:

- Limpieza y corrección de datos existentes en la BD.
- Sincronización completa de mensajes desde WAHA.
- Corrección de nombres de contactos y chats.
- Actualización de fotos de perfil de contactos.
- Selección de 1 a 3 bots desde el dashboard para optimizar recursos.

---

## 1. Objetivo general

La nueva sincronización manual tiene como objetivo:

- **Corregir datos históricos dañados** (antes de que se arreglara el webhook):
  - Contactos y chats duplicados.
  - Nombres incorrectos (chats/contacts con el nombre del bot).
- **Mantener la base de datos limpia**:
  - Evitar crear nuevos duplicados por IDs `@lid` de WhatsApp.
- **Traer todos los mensajes posibles** de cada chat desde WAHA (especialmente los que no llegaron por webhook).
- **Actualizar datos enriquecidos**:
  - Nombre correcto de contacto/chat.
  - Foto de perfil del contacto.

Todo esto se hace **sin borrar información válida** y sin romper los datos que el webhook ya guarda correctamente.

---

## 2. Flujo general de la sincronización manual

La sincronización manual se ejecuta llamando a `FullSyncService.syncAllMessages(sessionName)` desde las rutas:

- `POST /api/full-sync/all-bots` → sincroniza **todos** los bots válidos.
- `POST /api/full-sync/selected-bots` → sincroniza **solo los bots seleccionados (1 a 3)**.

Para cada bot, el flujo de `syncAllMessages` es:

1. Limpiar cachés internas.
2. Cargar el bot desde la tabla `bots`.
3. Obtener el **nombre del bot** desde WAHA (para detectar nombres incorrectos).
4. **FASE DE LIMPIEZA** (antes de sincronizar mensajes):
   - Fusionar **contactos duplicados**.
   - Fusionar **chats duplicados**.
   - Corregir **nombres incorrectos** (nombre del bot usado como nombre de contacto/chat).
5. Volver a cargar contactos y chats en caché (ya limpios).
6. Obtener **todos los chats** con mensajes desde WAHA (`/api/{sessionName}/chats`).
7. Procesar los chats por lotes (3 en paralelo) con `syncChatMessages`.
8. Mostrar un resumen con estadísticas de limpieza y de sincronización.

Esto permite que **en cada sincronización manual** se:

- Limpien duplicados antiguos.
- Corrijan nombres dañados.
- Traigan/actualicen mensajes y metadatos (fotos, nombres, etc.).

---

## 3. Fase de limpieza de datos (antes de sincronizar mensajes)

### 3.1. Fusión de contactos duplicados

Función: `mergeDuplicateContacts(botId)`

1. Obtiene todos los contactos del bot (`contacts` por `bot_id`).
2. Agrupa por `phone_number`.
3. Para cada número con **más de un contacto**:
   - El primer contacto (más antiguo) se toma como **contacto principal**.
   - Los demás se consideran **duplicados**.
4. Para cada contacto duplicado:
   - Actualiza la tabla `chats` para que `contact_id` apunte al **contacto principal**.
   - Elimina el contacto duplicado.

**Resultado:**

- Solo queda **un contacto por número de teléfono** por bot.
- Los chats siguen apuntando a un contacto válido.

---

### 3.2. Fusión de chats duplicados

Función: `mergeDuplicateChats(botId)`

1. Obtiene todos los chats del bot (`chats` por `bot_id`).
2. Agrupa por `contact_number`.
3. Para cada número con **más de un chat**:
   - El primer chat (más antiguo) se toma como **chat principal**.
   - Los demás son **chats duplicados**.
4. Para cada chat duplicado:
   - Actualiza la tabla `messages` para que `chat_id` apunte al **chat principal**.
   - Elimina el chat duplicado.

**Resultado:**

- Solo queda **un chat por número** para ese bot.
- Todos los mensajes quedan asociados al chat principal.
- Se aprovechan los datos ya existentes (no se pierden mensajes).

---

### 3.3. Corrección de nombres incorrectos

Función: `fixIncorrectNames(botId)`

Usa `this.botPushName` (nombre del bot obtenido desde WAHA) para detectar nombres erróneos.

1. **Contactos:**
   - Busca contactos cuyo `name` contiene el nombre del bot.
   - Actualiza su `name` y `push_name` al **número de teléfono**.
2. **Chats:**
   - Busca chats cuyo `contact_name` contiene el nombre del bot.
   - Actualiza `contact_name` y `name` al **número de contacto**.

**Resultado:**

- Se eliminan los nombres "ensuciados" por el nombre del bot.
- Como mínimo, siempre queda el número como nombre consistente.

---

## 4. Sincronización de mensajes por chat

Función principal: `syncChatMessages(sessionName, chatId, options)`

Para cada chat devuelto por WAHA:

1. Obtiene el bot (`bots.session_name = sessionName`).
2. **PASO 1: Obtener mensajes de WAHA**
   - Llama a `/api/messages` con parámetros:
     - `session`: nombre de sesión.
     - `chatId`: ID original del chat (como lo conoce WAHA).
     - `limit`: hasta 500 mensajes.
     - Incluye cuerpo de texto y otros datos necesarios.
3. Si el chat no tiene mensajes → se ignora (no hay nada que sincronizar).
4. **PASO 2: Normalizar el `chatId` (manejo de @lid)**
   - Llama a `normalizeChatId(chatId, wahaChat, messages)`.
   - Intenta convertir IDs internos `@lid` a `numero@c.us` usando:
     - `remoteJidAlt` dentro de `wahaChat`.
     - `remoteJidAlt` o `from` dentro de cada mensaje.
   - Si encuentra un número real (`@c.us` o `@s.whatsapp.net`):
     - Devuelve `numero@c.us`.
   - Si **no** puede normalizar:
     - Busca en caché si ya existe un chat en BD para ese `lidNumber`.
     - Si existe → usa su `chat_id`.
     - Si no existe → usa el `@lid` tal cual (para **no perder datos**).

> Muy importante: **ya no se omiten chats @lid**. Siempre se usa algún ID (normalizado o el @lid existente) para no perder mensajes.

5. **PASO 3: Contacto asociado**
   - Usa `getOrCreateContactFromWaha`:
     - Busca en caché por `phone_number`.
     - Si el nombre actual es el del bot → lo corrige.
     - Si falta nombre o foto de perfil → consulta a WAHA (servicio `wahaContactService`).
     - Si WAHA devuelve una foto de perfil → se guarda/actualiza en `profile_picture_url`.

6. **PASO 4: Chat asociado**
   - Usa `getOrCreateChatWithCorrection`:
     - Busca en caché por `contact_number`.
     - Si el chat existe y su nombre es inválido (nombre del bot) → lo corrige con el nombre del contacto o el número.
     - Si no existe → crea un nuevo chat con el nombre correcto.

7. **PASO 5: Mensajes**
   - Carga mensajes existentes del chat en caché (`existingMessagesCache`) por `message_id`.
   - Para cada mensaje de WAHA:
     - Si el `message_id` ya existe:
       - Verifica si hace falta corregir `from_me`, `body`/`content`.
       - Actualiza solo si hay cambios.
     - Si no existe:
       - Llama a `messageService.saveMessage` para insertarlo.
   - De esta forma:
     - No se duplican mensajes.
     - Se corrigen mensajes existentes cuando hace falta.

---

## 5. Manejo de fotos de perfil

En `getOrCreateContactFromWaha`:

1. Si el contacto ya existe con **foto de perfil válida**, se reutiliza.
2. Si falta **nombre o foto de perfil**:
   - Llama a `WahaContactService.getFullContactData(sessionName, chatId)`.
   - Usa:
     - `name` y `push_name` (si no son el nombre del bot).
     - `profile_picture_url` si WAHA la devuelve.
3. Si WAHA no devuelve foto (`null`) → se deja como `null` (no se inventa nada).

**Resultado:**

- Los contactos pueden ir completando poco a poco su foto de perfil con cada sincronización manual.

---

## 6. Endpoints de sincronización en Express

Archivo: `src/routes/fullSync.js`

### 6.1. `POST /api/full-sync/:session/messages`

- Sincroniza **solo un bot**, indicado por `:session`.
- Usa `fullSyncService.syncAllMessages(session, { ... })`.

### 6.2. `POST /api/full-sync/all-bots`

- Sincroniza **todos los bots** con estado `WORKING` (y, si es posible, con sesión activa en WAHA).
- Para cada bot:
  - Llama a `syncAllMessages`.
  - Acumula estadísticas globales (chats, mensajes, errores, etc.).

### 6.3. `POST /api/full-sync/selected-bots`

- **Nuevo endpoint** para sincronización más controlada.
- Body esperado:
  ```json
  {
    "botSessionNames": ["session_1", "session_2"],
    "limit": 1000,
    "includeMedia": true,
    "transcribeAudio": true
  }
  ```
- Reglas:
  - Debe venir al menos 1 bot.
  - Máximo 3 bots por petición.
  - Solo sincroniza bots `WORKING` (y, si es posible, con sesión activa en WAHA).
- Devuelve estadísticas y lista de bots inactivos omitidos.

---

## 7. Integración con el dashboard (modal de selección de bots)

Archivo: `dashboard/src/app/dashboard/page.js`

### 7.1. Estados principales

- `syncModalOpen` / `setSyncModalOpen` → controla el modal de selección.
- `selectedBotsForSync` / `setSelectedBotsForSync` → lista de `session_name` seleccionados.
- `syncingAll`, `syncProgress`, `syncLogs` → estado del modal de progreso.

### 7.2. Flujo de selección y sincronización

1. El usuario hace clic en el botón **"Sincronizar"** (parte superior del dashboard).
2. Se abre el **modal de selección de bots**:
   - Se muestran solo bots con estado `WORKING`.
   - El usuario puede seleccionar de **1 a 3 bots**.
3. Al confirmar, se llama a `handleSelectedBotsSync()`:
   - Cierra el modal de selección.
   - Abre el modal de progreso.
   - Llama vía `fetch` a `POST /api/full-sync/selected-bots`.
   - Muestra logs y progreso en tiempo real en el modal.
4. Al terminar:
   - Muestra estadísticas básicas (bots, conversaciones, mensajes).
   - Refresca los datos (`fetchData()`).

### 7.3. Compatibilidad con sincronización total

Sigue existiendo `handleFullSync()`:

- Llama a `POST /api/full-sync/all-bots`.
- Usa el mismo modal de progreso.
- Está pensado para escenarios donde se quiere sincronizar **absolutamente todo**.

La nueva funcionalidad **recomendada en producción** es usar el modal de selección para sincronizar pocos bots a la vez y así:

- Reducir el tiempo total de ejecución.
- Evitar saturar WAHA y la BD.
- Tener más control sobre qué bots se están corrigiendo/sincronizando.

---

## 8. Resumen

La nueva sincronización manual:

- **No solo sincroniza mensajes**, también:
  - **Fusiona contactos duplicados**.
  - **Fusiona chats duplicados** moviendo sus mensajes al chat principal.
  - **Corrige nombres incorrectos** (cuando se usó el nombre del bot por error).
  - **Completa nombres y fotos de perfil** usando datos de WAHA.
- Maneja correctamente IDs `@lid` para evitar nuevos duplicados.
- Se puede ejecutar:
  - Para **todos los bots** (`/all-bots`).
  - Para **bots específicos** seleccionados desde el dashboard (`/selected-bots`).
- Está pensada como una herramienta de **limpieza y corrección progresiva** de datos en producción, sin romper lo que ya está bien.
