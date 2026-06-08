# Sync Services Rename — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **REQUIRED SKILLS AT EXECUTION TIME:**
> - `code-review-excellence` — para revisar cada cambio antes de commitear
> - `api-design-principles` — para validar nombres y contratos de endpoints

**Goal:** Renombrar los tres servicios de sincronización con nombres descriptivos que reflejen su responsabilidad real, y actualizar los endpoints HTTP y todas las referencias en el codebase.

**Architecture:** Cada servicio tiene una sola razón de existir (SRP). El renombrado es cosmético/semántico: no cambia lógica interna, solo nombres de archivos, clases, imports y rutas HTTP. Los cambios en endpoints impactan el frontend, por eso el orden de fases importa.

**Tech Stack:** Node.js/Express (backend), Next.js/React (frontend dashboard), Supabase

---

## Mapa de Cambios

### Servicios (src/services/)

| Archivo actual | Archivo nuevo | Clase actual | Clase nueva |
|---|---|---|---|
| `syncService.js` | `wahaMetadataSyncService.js` | `SyncService` | `WahaMetadataSyncService` |
| `fullSyncService.js` | `wahaMessageHistoryService.js` | `FullSyncService` | `WahaMessageHistoryService` |
| `autoSyncService.js` | `syncSchedulerService.js` | `AutoSyncService` | `SyncSchedulerService` |

### Rutas (src/routes/)

| Archivo actual | Archivo nuevo | Mount prefix actual | Mount prefix nuevo |
|---|---|---|---|
| `sync.js` | `wahaMetadataSync.js` | `/api/sync` | `/api/metadata-sync` |
| `fullSync.js` | `messageHistory.js` | `/api/full-sync` | `/api/message-history` |
| `autoSync.js` | `syncScheduler.js` | `/api/auto-sync` | `/api/sync-scheduler` |

### Archivos a modificar (no renombrar)

| Archivo | Qué cambia |
|---|---|
| `src/index.js` | 4 imports + 3 mount paths + objeto `endpoints` |
| `src/services/syncSchedulerService.js` | Import interno de `syncService` → `wahaMetadataSyncService` |
| `dashboard/src/app/(crm)/conversaciones/page.js` | 2 fetch URLs |

---

## Fase 1: Renombrar y actualizar los archivos de servicios

### Tarea 1.1: Renombrar `syncService.js` → `wahaMetadataSyncService.js`

**Archivos:**
- Crear: `src/services/wahaMetadataSyncService.js`
- Eliminar: `src/services/syncService.js` (mover contenido)

- [ ] **Paso 1: Crear el nuevo archivo con el contenido actualizado**

Crear `src/services/wahaMetadataSyncService.js` con exactamente el mismo contenido de `syncService.js` pero cambiando:
  - Línea 14: `export class SyncService {` → `export class WahaMetadataSyncService {`
  - Última línea (434): `export default new SyncService();` → `export default new WahaMetadataSyncService();`

- [ ] **Paso 2: Verificar que el archivo nuevo existe y tiene los cambios**

```bash
grep -n "WahaMetadataSyncService" src/services/wahaMetadataSyncService.js
```
Expected output:
```
14:export class WahaMetadataSyncService {
434:export default new WahaMetadataSyncService();
```

- [ ] **Paso 3: Eliminar el archivo original**

```bash
# Windows PowerShell
Remove-Item src/services/syncService.js
```

- [ ] **Paso 4: Commit**

```bash
git add src/services/wahaMetadataSyncService.js src/services/syncService.js
git commit -m "refactor(sync): rename SyncService -> WahaMetadataSyncService"
```

---

### Tarea 1.2: Renombrar `fullSyncService.js` → `wahaMessageHistoryService.js`

**Archivos:**
- Crear: `src/services/wahaMessageHistoryService.js`
- Eliminar: `src/services/fullSyncService.js`

- [ ] **Paso 1: Crear el nuevo archivo con el contenido actualizado**

Crear `src/services/wahaMessageHistoryService.js` con exactamente el mismo contenido de `fullSyncService.js` pero cambiando:
  - Línea 19: `export class FullSyncService {` → `export class WahaMessageHistoryService {`
  - Última línea (364): `export default new FullSyncService();` → `export default new WahaMessageHistoryService();`

- [ ] **Paso 2: Verificar que el archivo nuevo existe y tiene los cambios**

```bash
grep -n "WahaMessageHistoryService" src/services/wahaMessageHistoryService.js
```
Expected output:
```
19:export class WahaMessageHistoryService {
364:export default new WahaMessageHistoryService();
```

- [ ] **Paso 3: Eliminar el archivo original**

```bash
Remove-Item src/services/fullSyncService.js
```

- [ ] **Paso 4: Commit**

```bash
git add src/services/wahaMessageHistoryService.js src/services/fullSyncService.js
git commit -m "refactor(sync): rename FullSyncService -> WahaMessageHistoryService"
```

---

### Tarea 1.3: Renombrar `autoSyncService.js` → `syncSchedulerService.js` y actualizar import interno

**Archivos:**
- Crear: `src/services/syncSchedulerService.js`
- Eliminar: `src/services/autoSyncService.js`

- [ ] **Paso 1: Crear el nuevo archivo con el contenido actualizado**

Crear `src/services/syncSchedulerService.js` con exactamente el mismo contenido de `autoSyncService.js` pero cambiando:
  - Línea 4: `import syncService from './syncService.js';` → `import syncService from './wahaMetadataSyncService.js';`
  - Línea 19: `export class AutoSyncService {` → `export class SyncSchedulerService {`
  - Línea 289: `export default new AutoSyncService();` → `export default new SyncSchedulerService();`

- [ ] **Paso 2: Verificar los tres cambios en el nuevo archivo**

```bash
grep -n "SyncSchedulerService\|wahaMetadataSyncService" src/services/syncSchedulerService.js
```
Expected output:
```
4:import syncService from './wahaMetadataSyncService.js';
19:export class SyncSchedulerService {
289:export default new SyncSchedulerService();
```

- [ ] **Paso 3: Eliminar el archivo original**

```bash
Remove-Item src/services/autoSyncService.js
```

- [ ] **Paso 4: Commit**

```bash
git add src/services/syncSchedulerService.js src/services/autoSyncService.js
git commit -m "refactor(sync): rename AutoSyncService -> SyncSchedulerService, update internal import"
```

---

## Fase 2: Renombrar y actualizar los archivos de rutas

> Los archivos de rutas NO necesitan cambiar sus rutas internas relativas (ej: `/:sessionName/contacts`). Solo cambia el import del servicio. El prefijo del endpoint cambia en `index.js` (Fase 3).

### Tarea 2.1: Renombrar `routes/sync.js` → `routes/wahaMetadataSync.js`

**Archivos:**
- Crear: `src/routes/wahaMetadataSync.js`
- Eliminar: `src/routes/sync.js`

- [ ] **Paso 1: Crear el nuevo archivo**

Crear `src/routes/wahaMetadataSync.js` con exactamente el mismo contenido de `src/routes/sync.js` pero cambiando:
  - Línea 2: `import syncService from '../services/syncService.js';` → `import syncService from '../services/wahaMetadataSyncService.js';`

- [ ] **Paso 2: Verificar el import actualizado**

```bash
grep -n "wahaMetadataSyncService" src/routes/wahaMetadataSync.js
```
Expected output:
```
2:import syncService from '../services/wahaMetadataSyncService.js';
```

- [ ] **Paso 3: Eliminar el archivo original**

```bash
Remove-Item src/routes/sync.js
```

- [ ] **Paso 4: Commit**

```bash
git add src/routes/wahaMetadataSync.js src/routes/sync.js
git commit -m "refactor(routes): rename sync route file, update service import"
```

---

### Tarea 2.2: Renombrar `routes/fullSync.js` → `routes/messageHistory.js`

**Archivos:**
- Crear: `src/routes/messageHistory.js`
- Eliminar: `src/routes/fullSync.js`

- [ ] **Paso 1: Crear el nuevo archivo**

Crear `src/routes/messageHistory.js` con exactamente el mismo contenido de `src/routes/fullSync.js` pero cambiando:
  - Línea 2: `import fullSyncService from '../services/fullSyncService.js';` → `import messageHistoryService from '../services/wahaMessageHistoryService.js';`
  - Todas las referencias a `fullSyncService` dentro del archivo (3 ocurrencias: líneas 19, 123, 251) → `messageHistoryService`

- [ ] **Paso 2: Verificar que no quedan referencias al nombre anterior**

```bash
grep -n "fullSyncService\|fullSync" src/routes/messageHistory.js
```
Expected output: (sin resultados)

```bash
grep -n "messageHistoryService" src/routes/messageHistory.js
```
Expected output (3 líneas):
```
2:import messageHistoryService from '../services/wahaMessageHistoryService.js';
19:    const result = await messageHistoryService.syncAllMessages(session, {
123:        const result = await messageHistoryService.syncAllMessages(bot.session_name, {
251:    const stats = await messageHistoryService.syncChatMessages(session, chatId, {
```

- [ ] **Paso 3: Eliminar el archivo original**

```bash
Remove-Item src/routes/fullSync.js
```

- [ ] **Paso 4: Commit**

```bash
git add src/routes/messageHistory.js src/routes/fullSync.js
git commit -m "refactor(routes): rename fullSync route -> messageHistory, update service import"
```

---

### Tarea 2.3: Renombrar `routes/autoSync.js` → `routes/syncScheduler.js`

**Archivos:**
- Crear: `src/routes/syncScheduler.js`
- Eliminar: `src/routes/autoSync.js`

- [ ] **Paso 1: Crear el nuevo archivo**

Crear `src/routes/syncScheduler.js` con exactamente el mismo contenido de `src/routes/autoSync.js` pero cambiando:
  - Línea 2: `import autoSyncService from '../services/autoSyncService.js';` → `import syncSchedulerService from '../services/syncSchedulerService.js';`
  - Todas las referencias a `autoSyncService` (5 ocurrencias: líneas 12, 37, 38, 59, 80) → `syncSchedulerService`

- [ ] **Paso 2: Verificar que no quedan referencias al nombre anterior**

```bash
grep -n "autoSyncService\|autoSync" src/routes/syncScheduler.js
```
Expected output: (sin resultados)

```bash
grep -n "syncSchedulerService" src/routes/syncScheduler.js
```
Expected output (5 líneas):
```
2:import syncSchedulerService from '../services/syncSchedulerService.js';
12:    const status = syncSchedulerService.getStatus();
37:    syncSchedulerService.start();
38:    const status = syncSchedulerService.getStatus();
59:    syncSchedulerService.stop();
80:    syncSchedulerService.forceSyncNow().catch(err => {
```

- [ ] **Paso 3: Eliminar el archivo original**

```bash
Remove-Item src/routes/autoSync.js
```

- [ ] **Paso 4: Commit**

```bash
git add src/routes/syncScheduler.js src/routes/autoSync.js
git commit -m "refactor(routes): rename autoSync route -> syncScheduler, update service import"
```

---

## Fase 3: Actualizar `index.js`

**Archivos:**
- Modificar: `src/index.js`

Este es el archivo de mayor impacto. Hay 4 cambios:
1. Imports de rutas (líneas 16, 17, 18)
2. Import del servicio de scheduler (línea 37)
3. Mount paths (líneas 60, 61, 62)
4. Objeto `endpoints` en la ruta GET `/` (líneas 104, 105, 106)

- [ ] **Paso 1: Actualizar import de rutas**

En `src/index.js`, reemplazar:
```js
import syncRoutes from './routes/sync.js';
import autoSyncRoutes from './routes/autoSync.js';
import fullSyncRoutes from './routes/fullSync.js';
```
Por:
```js
import metadataSyncRoutes from './routes/wahaMetadataSync.js';
import syncSchedulerRoutes from './routes/syncScheduler.js';
import messageHistoryRoutes from './routes/messageHistory.js';
```

- [ ] **Paso 2: Actualizar import del servicio de scheduler**

Reemplazar:
```js
import autoSyncService from './services/autoSyncService.js';
```
Por:
```js
import syncSchedulerService from './services/syncSchedulerService.js';
```

- [ ] **Paso 3: Actualizar mount paths**

Reemplazar:
```js
app.use('/api/sync', syncRoutes);
app.use('/api/auto-sync', autoSyncRoutes);
app.use('/api/full-sync', fullSyncRoutes);
```
Por:
```js
app.use('/api/metadata-sync', metadataSyncRoutes);
app.use('/api/sync-scheduler', syncSchedulerRoutes);
app.use('/api/message-history', messageHistoryRoutes);
```

- [ ] **Paso 4: Actualizar objeto `endpoints` en ruta GET `/`**

Reemplazar:
```js
sync: '/api/sync',
autoSync: '/api/auto-sync',
fullSync: '/api/full-sync'
```
Por:
```js
metadataSync: '/api/metadata-sync',
syncScheduler: '/api/sync-scheduler',
messageHistory: '/api/message-history'
```

- [ ] **Paso 5: Actualizar llamada al scheduler**

Reemplazar:
```js
autoSyncService.start();
```
Por:
```js
syncSchedulerService.start();
```

- [ ] **Paso 6: Verificar que no quedan referencias a nombres anteriores**

```bash
grep -n "syncRoutes\|autoSyncRoutes\|fullSyncRoutes\|autoSyncService\|/api/sync\b\|/api/auto-sync\|/api/full-sync" src/index.js
```
Expected output: (sin resultados)

- [ ] **Paso 7: Commit**

```bash
git add src/index.js
git commit -m "refactor(server): update index.js with new route imports, mount paths and service references"
```

---

## Fase 4: Actualizar el frontend (Dashboard)

**Archivos:**
- Modificar: `dashboard/src/app/(crm)/conversaciones/page.js`

Hay exactamente 2 URLs hardcodeadas que consumen los endpoints del backend.

- [ ] **Paso 1: Actualizar endpoint de sync individual de bot**

En `conversaciones/page.js` línea 268, reemplazar:
```js
const response = await fetch(`${apiUrl}/api/sync/${sessionName}/all`, {
```
Por:
```js
const response = await fetch(`${apiUrl}/api/metadata-sync/${sessionName}/all`, {
```

- [ ] **Paso 2: Actualizar endpoint de full sync de todos los bots**

En `conversaciones/page.js` línea 410, reemplazar:
```js
const response = await fetch(`${apiUrl}/api/full-sync/all-bots`, {
```
Por:
```js
const response = await fetch(`${apiUrl}/api/message-history/all-bots`, {
```

- [ ] **Paso 3: Verificar que no quedan URLs con los nombres anteriores**

```bash
grep -n "api/sync\|api/full-sync\|api/auto-sync" dashboard/src/app/\(crm\)/conversaciones/page.js
```
Expected output: (sin resultados)

- [ ] **Paso 4: Commit**

```bash
git add "dashboard/src/app/(crm)/conversaciones/page.js"
git commit -m "refactor(dashboard): update sync endpoint URLs to new naming"
```

---

## Fase 5: Verificación Final

- [ ] **Paso 1: Iniciar el servidor backend**

```bash
node src/index.js
```
Expected output en consola:
```
🚀 Servidor corriendo en http://localhost:4000
```
Sin errores de `Cannot find module` o `undefined`.

- [ ] **Paso 2: Verificar que el scheduler arranca**

En los logs de inicio debería aparecer:
```
🔄 Auto-Sincronización INICIADA
   ⏱️  Intervalo general: cada 30 minutos
```

- [ ] **Paso 3: Verificar endpoints disponibles**

```bash
curl http://localhost:4000/
```
Expected: objeto JSON con `metadataSync`, `syncScheduler`, `messageHistory` como keys.

- [ ] **Paso 4: Verificar endpoint de status del scheduler**

```bash
curl http://localhost:4000/api/sync-scheduler/status
```
Expected: `{ "success": true, "data": { "enabled": true, "isRunning": true, ... } }`

- [ ] **Paso 5: Verificar que los endpoints anteriores ya NO responden**

```bash
curl http://localhost:4000/api/sync/status
curl http://localhost:4000/api/full-sync/status
curl http://localhost:4000/api/auto-sync/status
```
Expected: `404 Not Found` en los tres.

- [ ] **Paso 6: Verificar que no quedan referencias a nombres anteriores en todo el proyecto**

```bash
grep -rn "syncService\|fullSyncService\|autoSyncService\|/api/sync\b\|/api/full-sync\|/api/auto-sync" src/ dashboard/src/ --include="*.js" --include="*.jsx"
```
Expected output: (sin resultados)

- [ ] **Paso 7: Commit final y push**

```bash
git add -A
git commit -m "chore(sync): complete rename verification - all references updated"
git push
```

---

## Resumen de Commits Esperados

1. `refactor(sync): rename SyncService -> WahaMetadataSyncService`
2. `refactor(sync): rename FullSyncService -> WahaMessageHistoryService`
3. `refactor(sync): rename AutoSyncService -> SyncSchedulerService, update internal import`
4. `refactor(routes): rename sync route file, update service import`
5. `refactor(routes): rename fullSync route -> messageHistory, update service import`
6. `refactor(routes): rename autoSync route -> syncScheduler, update service import`
7. `refactor(server): update index.js with new route imports, mount paths and service references`
8. `refactor(dashboard): update sync endpoint URLs to new naming`
9. `chore(sync): complete rename verification - all references updated`
