# Contexto para Refactorizaciones Pendientes del Módulo Conversaciones (Fase 2)

> Este documento provee el contexto necesario para crear un plan de implementación dividido en fases para las refactorizaciones 6-11 del módulo de conversaciones. Se asume que las **Fases 1-5 del plan `2026-06-05-conversaciones-god-component-refactor.md` ya fueron ejecutadas**.

## Estado Post-Fase 1 (punto de partida para este plan)

Después de ejecutar las fases 1-5:
- `page.js` tiene ~1684 líneas (reducido desde 2667)
- `generatePdfReport` vive en `lib/conversaciones/generatePdfReport.js`
- Modales extraídos: `SalesModal`, `SyncModal`, `ReportModal` en `components/conversaciones/`
- Auth usa `useAuth().session` (no `checkUser` manual)
- `parseBotSessionName` importado de `lib/botNameParser.js`
- Debug logs comentados

---

## Refactorización 6: Extraer Lógica de Filtrado a Hook `useConversacionesFiltros`

### Problema

El componente `DashboardContent` contiene ~200 líneas de lógica de filtrado de bots que deberían vivir en un hook personalizado. Esto incluye:

- 5 estados de filtro: `searchFilter`, `statusFilter`, `leaderFilter`, `leadFilter`, `sedeFilter`
- 1 estado de toggle: `showFilters`
- 1 estado de búsqueda lateral: `botSearchQuery`
- Funciones: `filterBots()`, `getAllFilteredBots()`, `formatBotStatus()`, `isBotActive()`, `activeFiltersCount()`, `clearFilters()`, `getActiveFilterPills()`, `getFilterPillClasses()`, `handleRemoveFilter()`
- La función `filterBots` llama `parseBotSessionName()` por cada bot en cada render **sin memoización**

### Archivos Involucrados

- **Crear:** `dashboard/src/hooks/useConversacionesFiltros.js`
- **Modificar:** `dashboard/src/app/(crm)/conversaciones/page.js`

### Datos Clave

- `filterBots` depende del array `bots` (de `useBots()`) y de los 5 estados de filtro
- `getAllFilteredBots()` simplemente llama `filterBots(bots)` — debería ser un `useMemo`
- `activeFiltersCount()` se llama 5+ veces en el JSX sin memoización
- `parseBotSessionName` ya se importa de `@/lib/botNameParser`
- `formatBotStatus` e `isBotActive` son funciones puras (no dependen de estado)

### Interfaz Sugerida del Hook

```javascript
const {
  // Estados
  searchFilter, setSearchFilter,
  statusFilter, setStatusFilter,
  leaderFilter, setLeaderFilter,
  leadFilter, setLeadFilter,
  sedeFilter, setSedeFilter,
  showFilters, setShowFilters,
  botSearchQuery, setBotSearchQuery,
  
  // Valores derivados (memoizados)
  filteredBots,        // useMemo de filterBots(bots)
  activeFiltersCount,  // useMemo
  activeFilterPills,   // useMemo
  
  // Handlers
  clearFilters,
  handleRemoveFilter,
  
  // Helpers puros
  formatBotStatus,
  isBotActive,
  getFilterPillClasses,
} = useConversacionesFiltros(bots)
```

---

## Refactorización 7: Abstraer `localStorage` en Hook `useLocalStorage`

### Problema

El patrón `typeof window !== "undefined"` + `try/catch` + `localStorage.get/setItem` aparece en **6+ lugares** entre `page.js` y `chat/[chatId]/page.js`:

1. Guardar/restaurar `lastChatId` (page.js L209-234)
2. Guardar/restaurar `globalSearchQuery` + `globalSearchResults` (page.js L238-261)
3. Guardar/restaurar página del paginador por bot (page.js L160-173)
4. Guardar búsqueda al hacer click en resultado (page.js L1290-1303)
5. Guardar/restaurar búsqueda en chat page (chat/[chatId]/page.js L29-47, L54-66, L106-119)

### Archivos Involucrados

- **Crear:** `dashboard/src/hooks/useLocalStorage.js`
- **Modificar:** `dashboard/src/app/(crm)/conversaciones/page.js`
- **Modificar:** `dashboard/src/app/(crm)/conversaciones/chat/[chatId]/page.js`

### Datos Clave

- Todas las keys usan prefijo `conversaciones:` (ej: `conversaciones:lastChatId`, `conversaciones:globalSearchQuery`)
- Algunos valores se guardan como strings, otros como `JSON.stringify` de arrays
- El hook debería manejar internamente `typeof window !== "undefined"` y `try/catch`

### Interfaz Sugerida del Hook

```javascript
// Hook simple para un valor
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue)

// O un helper más simple:
import { getStoredValue, setStoredValue, removeStoredValue } from '@/lib/utils/localStorage'
```

---

## Refactorización 8: Implementar o Eliminar `ai-insights/page.js`

### Problema

La página `conversaciones/ai-insights/page.js` (165 líneas) es un **stub con datos hardcodeados** que se presenta al usuario como funcionalidad real:

```javascript
// TODO: Implement API call for aggregated report
setTimeout(() => {
  setReport({
    totalChats: 45,
    salesCompleted: 12,
    salesFailed: 33,
    conversionRate: "26.6%",
    topAdvisor: "Sharon",
    commonFailureReasons: ["Precio alto", "Sin respuesta del cliente", "Falta de stock"],
  });
  setLoading(false);
}, 2000);
```

Hay un botón "AI Insights" visible en el dashboard principal que navega a esta página.

### Archivos Involucrados

- `dashboard/src/app/(crm)/conversaciones/ai-insights/page.js`
- `dashboard/src/app/(crm)/conversaciones/page.js` (botón de navegación, línea ~1543)

### Decisión Requerida

**Opción A — Implementar:** Conectar con el API real `/api/generate-report` o crear un endpoint nuevo de insights agregados.

**Opción B — Eliminar:** Borrar la página y el botón que navega a ella hasta que se implemente la funcionalidad real.

**Recomendación:** Opción B, eliminar temporalmente. Datos falsos visibles al usuario generan desconfianza.

---

## Refactorización 9: Eliminar Rutas Legacy `bot/[botId]/`

### Problema

Existen dos rutas que parecen **huérfanas/legacy**:

1. `conversaciones/bot/[botId]/page.js` (226 líneas) — Lista de conversaciones de un bot
2. `conversaciones/bot/[botId]/conversation/[conversationId]/page.js` (218 líneas) — Vista de conversación individual

La funcionalidad de ambas ya está cubierta por:
- El panel derecho de `conversaciones/page.js` (lista de conversaciones por bot)
- `conversaciones/chat/[chatId]/page.js` (vista de conversación con `ChatView`, `ChatAnalysis`, `MessageInsightsPanel`)

### Archivos Involucrados

- `dashboard/src/app/(crm)/conversaciones/bot/[botId]/page.js`
- `dashboard/src/app/(crm)/conversaciones/bot/[botId]/conversation/[conversationId]/page.js`

### Verificación Requerida Antes de Eliminar

1. **Buscar en todo el proyecto** si algún otro componente o ruta navega a `/conversaciones/bot/`:
   ```
   grep -r "conversaciones/bot/" dashboard/src/
   ```
2. **Verificar en `Sidebar.jsx`** si hay links a estas rutas
3. **Verificar en Google Analytics / logs** si alguien accede directamente por URL

### Datos Clave

- `bot/[botId]/page.js` tiene su propio `checkAuth()` que llama `supabase.auth.getUser()` directamente (patrón incorrecto)
- `bot/[botId]/conversation/[conversationId]/page.js` también tiene `checkAuth()` propio
- `bot/[botId]/page.js` usa `handleConversationClick` que navega a la ruta legacy `conversaciones/bot/${botId}/conversation/${conversationId}`
- El componente `ChatView` (usado en `chat/[chatId]/page.js`) es mucho más completo que el renderizado de mensajes en la ruta legacy
- La ruta legacy NO tiene componentes de análisis IA (`ChatAnalysis`, `MessageInsightsPanel`)

### Problemas Adicionales en Rutas Legacy

- `handleDownloadAll` en `bot/[botId]/page.js` es un stub: `alert("Descargando todas las conversaciones...")`
- `formatDate` y `formatTime` están duplicados entre las dos rutas legacy — si se mantienen, deben extraerse a `lib/utils/`

---

## Refactorización 10: Eliminar Bloques de Código Comentado

### Problema

Hay dos bloques grandes de código comentado dentro del JSX de `page.js`:

1. **Líneas ~1957-1975** — Contadores de conversaciones y cotizaciones en la lista de bots
2. **Líneas ~2297-2347** — Métricas de conversación (tiempo de respuesta, pagos, cotizaciones) y contador de mensajes

### Archivos Involucrados

- `dashboard/src/app/(crm)/conversaciones/page.js`

### Datos Clave

- Estos bloques fueron comentados intencionalmente (tienen notas: "Comentado: Contadores de conversaciones y cotizaciones para simplificar la UI")
- El código referencia componentes y datos que aún existen (`conversation_metrics`, `botCotizaciones`)
- Si se decide re-habilitar en el futuro, puede recuperarse desde git history

### Recomendación

Eliminar los bloques comentados. El código está en git history si se necesita. Mantener código comentado extenso dificulta la lectura.

---

## Refactorización 11: Consolidar `formatDate` / `formatTime` en Utilidad Compartida

### Problema

Las funciones `formatDate` y `formatTime` están duplicadas en:

1. `conversaciones/bot/[botId]/page.js` (líneas 68-78)
2. `conversaciones/bot/[botId]/conversation/[conversationId]/page.js` (líneas 51-68)
3. Versiones similares en otros módulos del proyecto

### Archivos Involucrados

- **Crear (si no existe):** `dashboard/src/lib/utils/formatDate.js`
- **Modificar:** Todos los archivos que dupliquen esta lógica

### Datos Clave

- Si se ejecuta la Refactorización 9 (eliminar rutas legacy), esta refactorización se vuelve parcialmente innecesaria ya que los archivos duplicados se eliminan
- Sin embargo, aún es útil tener una utilidad centralizada de formateo de fechas para el resto del proyecto
- El proyecto ya tiene `dashboard/src/lib/utils/` como directorio para utilidades

### Interfaz Sugerida

```javascript
// dashboard/src/lib/utils/formatDate.js
export function formatDate(timestamp, options = {}) { ... }
export function formatTime(timestamp) { ... }
export function formatResponseTime(minutes) { ... }
```

`formatResponseTime` también existe inline en `page.js` (líneas 501-508) y podría extraerse aquí.

---

## Orden de Ejecución Recomendado

| # | Refactorización | Dependencias | Impacto |
|---|----------------|--------------|---------|
| 6 | Hook de filtros | Ninguna | Alto — separa ~200 líneas de lógica + agrega memoización |
| 7 | useLocalStorage | Ninguna | Medio — DRY en 6+ lugares |
| 8 | ai-insights | Ninguna | Bajo — decisión de producto |
| 9 | Rutas legacy | Verificar uso | Medio — elimina ~444 líneas de código muerto |
| 10 | Código comentado | Ninguna | Bajo — limpieza |
| 11 | formatDate utils | Depende de #9 | Bajo — se reduce si se eliminan rutas legacy |

Las refactorizaciones 6 y 7 son independientes entre sí y pueden ejecutarse en paralelo. La 9 debe verificarse antes de ejecutar. Las 10 y 11 son cleanup que pueden hacerse al final.
