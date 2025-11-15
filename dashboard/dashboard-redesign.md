# Rediseño Dashboard CRM WhatsApp y mejoras de UX

## Resumen

Este PR introduce un rediseño completo del dashboard de CRM WhatsApp orientado a:
- Mejorar la navegación entre asesores (bots) y conversaciones.
- Hacer los filtros más potentes, claros y usables (incluyendo móvil).
- Permitir un modo compacto para reducir ruido visual.
- Mantener el contexto al entrar/salir del chat, incluso usando el botón Atrás del navegador.
- Corregir problemas de legibilidad cuando el sistema operativo está en modo oscuro.

---

## Archivos modificados

- [dashboard/src/app/dashboard/page.js](cci:7://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:0:0-0:0)
- `dashboard/src/app/dashboard/chat/[chatId]/page.js`

---

## Detalle de cambios por archivo

### 1. [dashboard/src/app/dashboard/page.js](cci:7://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:0:0-0:0)

#### 1.1. Estado y sincronización con URL / localStorage

Se añadieron/ajustaron estados:

- `selectedBotId`: ID del asesor seleccionado.
- `loadingConversations`: `{ [botId]: boolean }` para mostrar carga por bot.
- Filtros:
  - `searchFilter`
  - `statusFilter` (`all | active | inactive`)
  - `leaderFilter` (`all | moises | jesus | endry`)
  - `leadFilter` (`all | colombia | venezuela`)
  - `sedeFilter` (`all | nova | apolo | flash`)
- `showFilters`: visibilidad del panel de filtros (inicial `false`).
- `compactMode`: modo compacto vs detallado (métricas visibles/ocultas).
- `lastChatId`: **última conversación visitada**, usada para resaltar la fila correspondiente.

Sincronización:

- Se usa `useSearchParams()` para leer:
  - `botId` y seleccionar automáticamente el asesor al entrar al dashboard.
  - `chatId` cuando está en la URL (resaltar conversación concreta).

Integración con `localStorage`:

- Al detectar `chatId` en la URL:
  - Se guarda en el estado `lastChatId`.
  - Se persiste en `localStorage` como `dashboard:lastChatId`.
- Si la URL **no** incluye `chatId` (caso botón Atrás del navegador):
  - Se intenta recuperar `dashboard:lastChatId` desde `localStorage` y se usa para resaltar la conversación.

Además:

- [handleConversationClick(botId, chatId)](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:339:2-341:4) ahora:
  - Actualiza `lastChatId` en estado.
  - Persiste `dashboard:lastChatId` en `localStorage`.
  - Navega a `/dashboard/chat/[chatId]?botId=[botId]`.

Resultado: el resaltado de la última conversación funciona tanto al volver con el botón interno del chat como con el botón Atrás del navegador.

---

#### 1.2. Parsing semántico de `session_name` de los bots

Se añadió [parseBotSessionName(sessionName)](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:125:2-186:4) para extraer metadatos del bot a partir de su `session_name`:

- Reconoce tokens conocidos:
  - Sede: `nova`, `apolo`, `flash`.
  - Lead: `colombia`, `venezuela`.
  - Líder: `moises`, `jesus`, `endry`.
- Devuelve:
  - `displayName`: nombre legible del asesor.
  - `sedeKey` / `sedeLabel`
  - `leadKey` / `leadLabel`
  - `leaderKey` / `leaderLabel`

Este parsing se usa para:

- Mostrar información estructurada en la lista de asesores y en el encabezado del asesor seleccionado.
- Aplicar filtros por líder, lead y sede.

---

#### 1.3. Filtros avanzados de asesores

Se amplió la lógica de filtrado:

- [filterBots(botsList)](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:189:2-229:4):
  - **Búsqueda global** (`searchFilter`) sobre:
    - `meta.displayName`
    - `session_name`
    - `phone_number`
    - `id`
  - **Estado** (`statusFilter`):
    - `active` → `status` ∈ `['working', 'active']`
    - `inactive` → resto.
  - **Líder** (`leaderFilter`) → compara con `meta.leaderKey`.
  - **Lead** (`leadFilter`) → compara con `meta.leadKey`.
  - **Sede** (`sedeFilter`) → compara con `meta.sedeKey`.

Helpers:

- [getAllFilteredBots()](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:232:2-234:4) → lista de bots filtrados.
- [activeFiltersCount()](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:274:2-282:4) → nº de filtros activos.
- [clearFilters()](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:284:2-290:4) → resetea todos los filtros a su valor “Todos”.

---

#### 1.4. Pills de filtros (resumen, colores e interactividad)

Se añadieron:

- [getActiveFilterPills()](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:292:2-332:4):
  - Construye pills `{ key, label }` para:
    - `search`, `status`, `leader`, `lead`, `sede`.

- [getFilterPillClasses(key)](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:334:2-348:4):
  - Define la paleta por tipo de filtro:
    - `status` → verde esmeralda.
    - `leader` → azul cielo.
    - `lead` → ámbar.
    - `sede` → índigo.
    - `search` → gris.

- [handleRemoveFilter(key)](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/page.js:350:2-370:4):
  - Permite limpiar **un solo filtro** pulsando sobre su pill.

UI:

- En la tarjeta de filtros:
  - Encabezado con icono `Filter`, título y chip “N filtros activos”.
  - Botón “Mostrar/Ocultar filtros” con `ChevronUp/ChevronDown`.
  - Resumen compacto + botón “Limpiar” con icono `Trash2` cuando el panel está colapsado.
- Pills:
  - Siempre visibles cuando hay filtros activos (aunque el panel de filtros esté oculto).
  - Son botones con color por tipo de filtro y `×` para limpiar.

---

#### 1.5. Corrección de colores en input/selects (tema oscuro del sistema)

Para evitar problemas de legibilidad cuando el SO o el navegador están en modo oscuro:

- **Input “Búsqueda Global”**:
  - Se forzaron clases Tailwind:
    - `bg-white`
    - `text-gray-700`
    - `placeholder-gray-400`
    - `border-gray-300`
- **Selects** de Estado, Líder, Lead, Sede:
  - Se forzaron:
    - `bg-white`
    - `text-gray-700`
    - `border-gray-300`

Con esto, los controles mantienen apariencia de tema claro independientemente del tema del sistema.

---

#### 1.6. Modo compacto del dashboard

- Nuevo estado: `compactMode`.
- Botón de toggle en la parte superior del `main`:
  - Muestra `Modo: Compacto` / `Modo: Detallado`.
  - Invierte el valor de `compactMode`.

- Bloque de métricas envuelto en `!compactMode && (...)`:
  - Métricas mostradas:
    - Nº de workers.
    - Nº total de bots (y “N mostrados” cuando hay filtros).
    - Nº de conversaciones.
    - Nº de bots activos.
  - En **modo compacto** → se oculta por completo la fila de métricas para aumentar área de trabajo.

---

#### 1.7. Nuevo layout: dos paneles (Asesores ↔ Conversaciones)

Se reemplazó el layout anterior (acordeones) por una grid:

- `lg:grid-cols-3`
  - 1 columna: lista de asesores.
  - 2 columnas: conversaciones del asesor seleccionado.

**Panel izquierdo – Asesores**:

- Tarjeta con título, subtítulo y contador “N de M visibles”.
- Estado vacío cuando los filtros dejan sin resultados.
- Lista scrollable:
  - `max-h-[60vh]` en pantallas pequeñas.
  - `lg:max-h-[600px]` en escritorio.

Cada asesor:

- Botón de fila con borde izquierdo.
  - Seleccionado → `bg-indigo-50 border-indigo-500`.
- Avatar:
  - Círculo verde/gris según estado.
  - Icono `Bot`.
  - `Circle` verde encima para indicar que está activo.
- Contenido:
  - `meta.displayName`.
  - Pills de:
    - Estado (verde esmeralda si activo).
    - Sede (índigo).
    - Lead (ámbar).
    - Líder (azul cielo).
  - Teléfono del bot (si existe).
- Lado derecho:
  - Nº de conversaciones del bot.

**Panel derecho – Conversaciones del asesor seleccionado**:

- Encabezado:
  - Título “Conversaciones de [displayName]”.
  - Subtítulo con nº total de conversaciones.
  - Pills:
    - `Sede: ...` (índigo).
    - `Lead: ...` (ámbar).
    - `Líder: ...` (azul cielo).
  - Caja a la derecha con:
    - Estado del bot.
    - Teléfono del bot.

- Cuerpo:
  - Diferentes estados:
    - Sin asesor seleccionado.
    - Cargando conversaciones.
    - Sin conversaciones.
  - Lista de conversaciones con scroll:
    - Muestra nombre/telefono del contacto, nº de mensajes y fecha del último mensaje.
    - Resalta la última conversación visitada (`lastChatId`) con fondo violeta.

---

#### 1.8. Header principal y botones de acción

En el `<header>` del dashboard:

- Título: “Dashboard CRM WhatsApp”.
- Subtítulo: “Bienvenido, [email]”.
- Botones:
  - `Actualizar` (icono `RefreshCw`).
  - `Cerrar Sesión` (icono `LogOut`).

Layout responsive:

- En móvil:
  - Botones apilados verticalmente y `w-full`.
- En escritorio:
  - Botones alineados en fila, a la derecha.

---

### 2. `dashboard/src/app/dashboard/chat/[chatId]/page.js`

Se ajustó la navegación de vuelta al dashboard para mantener contexto:

- Se importa `useSearchParams` de `next/navigation`.
- [handleClose](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/app/dashboard/chat/%5BchatId%5D/page.js:11:2-18:3):
  - Obtiene `botId` de la query:
    - `const botId = searchParams.get('botId')`
  - Si existe:
    - Navega a `/dashboard?botId=${botId}&chatId=${chatId}`.
  - Si no:
    - Navega a `/dashboard`.

[ChatView](cci:1://file:///c:/Users/USUARIO/Documents/Programacion/newcrmnova/dashboard/src/components/ChatView.js:6:0-195:1) recibe `onClose={handleClose}` y lo usa tanto en:

- La flecha de “volver” del header del chat.
- El botón “Volver” de la vista de error.

Gracias a este cambio, el dashboard:

- Selecciona el asesor correcto al volver.
- Resalta la conversación correcta usando `chatId` (o `lastChatId` desde `localStorage` cuando se usa Atrás del navegador).

---

## Notas de pruebas sugeridas

- **Navegación y contexto**:
  - Desde el dashboard, entrar a un chat y volver:
    - Con la flecha interna del chat.
    - Con el botón Atrás del navegador.
  - Verificar que:
    - El asesor seleccionado se mantiene.
    - La conversación queda resaltada.

- **Filtros y pills**:
  - Probar combinaciones de filtros (estado, líder, lead, sede, búsqueda).
  - Colapsar/expandir filtros y comprobar:
    - Pills visibles siempre con resumen de filtros activos.
    - Botón “Limpiar” global.
    - Click en una pill limpia solo ese filtro.

- **Modo compacto**:
  - Alternar entre `Compacto` y `Detallado`.
  - Verificar que la fila de métricas aparece/desaparece correctamente.

- **Tema oscuro de sistema**:
  - Activar modo oscuro en el sistema operativo.
  - Confirmar que input de búsqueda y selects se siguen viendo legibles (texto gris, fondo blanco).

- **Responsive**:
  - Revisar layout en móvil, tablet y escritorio:
    - Stacking de botones del header.
    - Scroll en listas de asesores y conversaciones.
    - Lectura cómoda de pills y filtros.
