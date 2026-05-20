# Sistema de Eventos para Timeline Enriquecido - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## ⚠️ ADVERTENCIA CRÍTICA: ESTE PLAN EXTIENDE SISTEMA EXISTENTE

**❌ NO partir de cero**  
**❌ NO reemplazar archivos existentes**  
**✅ EXTENDER pocThreadService.js con nuevos métodos**  
**✅ AGREGAR nuevos servicios (pocEventService, pocLeadStatusService)**  
**✅ AGREGAR nuevos endpoints a poc.js existente**  

**Sistema POC EXISTENTE (implementado en `2026-05-12-poc-thread-global.md`):**
- ✅ `src/services/pocThreadService.js` - Servicio de threads funcionando
- ✅ `src/routes/poc.js` - 3 endpoints funcionando
- ✅ Frontend: `conversaciones-poc/page.js`, `ThreadRow.jsx`, `ComparisonBadge.jsx`

**Este plan AGREGA:**
- Sistema de eventos sobre threads existentes
- Estados granulares de leads
- Timeline enriquecido (mensajes + eventos)

---

**Goal:** Implementar sistema de eventos que permita marcar hitos importantes (ventas, cotizaciones, etc.) en el timeline de conversaciones con detección automática híbrida (triggers + manual).

**Architecture:** Sistema híbrido con detección automática via triggers PostgreSQL + API REST para marcado manual. Timeline enriquecido que intercala mensajes con eventos visuales. Estados granulares de leads (NUEVO → EN_NEGOCIACION → VENTA_CONCRETADA → POST_VENTA).

**Tech Stack:** PostgreSQL/Supabase, Node.js/Express, React/Next.js 16, TailwindCSS

---

## ⚠️ IMPORTANTE: Skills Requeridos por Fase

| Fase | Skills a Invocar ANTES de Implementar |
|------|--------------------------------------|
| FASE 1 | `supabase`, `supabase-postgres-best-practices` |
| FASE 2 | `api-design-principles`, `code-review-excellence` |
| FASE 3-4 | `interface-design`, `code-review-excellence` |
| FASE 5 | `api-design-principles`, `supabase` |

---

## 📂 Archivos Complementarios del Plan

Este plan principal se complementa con 3 documentos detallados:

1. **`2026-05-18-fase-1-base-datos.md`** - SQL completo con triggers y funciones
2. **`2026-05-18-fase-2-backend-api.md`** - Servicios y endpoints detallados
3. **`2026-05-18-fase-3-4-frontend-ui.md`** - Componentes React completos

**Consultar estos archivos para código específico de cada fase.**

---

# RESUMEN EJECUTIVO DE FASES

## FASE 1: Base de Datos (0 horas - YA PREPARADA)

### ✅ **BASE DE DATOS COMPLETAMENTE PREPARADA**

**⚠️ IMPORTANTE: No requiere ninguna acción en la base de datos**

**Estado actual:**
- ✅ Tablas `poc_thread_events` y `poc_thread_status` ya existen
- ✅ Foreign keys implementadas y funcionando
- ✅ Triggers automáticos ya creados y funcionando:
  - `trigger_poc_create_status` - Crea estado inicial cuando se crea thread
  - `trigger_poc_sync_contact` - Sincroniza fechas de contacto
  - `trigger_poc_update_status` - Actualiza estado cuando se crea evento
  - `trigger_poc_detect_sale` - Detecta ventas automáticamente desde tabla vuelos
- ✅ Funciones de negocio implementadas:
  - `poc_create_status_on_thread_insert()`
  - `poc_detect_sale_from_vuelo()`
  - `poc_sync_first_contact()`
  - `poc_update_thread_status_from_event()`
- ✅ Índices optimizados (17 índices totales)
- ✅ Integridad referencial garantizada con CASCADE
- ✅ Tablas vacías y listas para uso

**Preparación realizada:** Ver `docs/poc/PREPARACION-TERRENO-PLAN-EVENTOS.md`

**Acción requerida:** Ninguna. La base de datos está 100% lista.

---

## FASE 2: Backend API (3-4 horas)

**⚠️ IMPORTANTE: EXTENDER, NO REEMPLAZAR**

Este plan **EXTIENDE** el sistema POC existente (`2026-05-12-poc-thread-global.md`).

**Sistema EXISTENTE (NO TOCAR):**
- ✅ `pocThreadService.js` con métodos: `syncThreadsFromMessages()`, `getThreads()`, `calculateThreadMetrics()`, etc.
- ✅ `src/routes/poc.js` con endpoints: `POST /threads/sync`, `GET /threads`, `GET /threads/stats`
- ✅ Frontend: `conversaciones-poc/page.js`, `ThreadRow.jsx`, `ComparisonBadge.jsx`

**Servicios NUEVOS a crear:**
1. `src/services/pocEventService.js` - CRUD eventos (crear, listar, filtrar eventos)
2. `src/services/pocLeadStatusService.js` - Gestión de estados de leads

**Métodos a AGREGAR a `pocThreadService.js` EXISTENTE:**
1. `getThreadTimeline(threadId)` - Obtener mensajes de un thread en orden cronológico
   - Lee de `poc_thread_chats` para obtener chat_ids
   - Lee de `messages` para obtener mensajes de esos chats
   - NO accede a tablas de eventos

**Servicios NUEVOS - pocEventService.js:**
1. `createEvent(eventData)` - Crear evento manual
2. `getEventsByThread(threadId, options)` - Listar eventos con filtros
3. `markSale(threadId, saleData)` - Atajo para marcar venta
4. `getEnrichedTimeline(threadId)` - Combinar mensajes + eventos
   - Llama a `pocThreadService.getThreadTimeline()` para mensajes
   - Lee eventos de `poc_thread_events`
   - Combina y ordena cronológicamente

**Servicios NUEVOS - pocLeadStatusService.js:**
1. `getStatus(threadId)` - Obtener estado actual del thread
2. `createInitialStatus(threadId)` - Crear estado inicial (NUEVO)
3. `changeStatus(threadId, statusData)` - Cambiar estado manualmente
   - ⚠️ IMPORTANTE: Debe usar `import()` dinámico para evitar circular dependency:
   ```js
   const pocEventService = (await import('./pocEventService.js')).default;
   await pocEventService.createEvent({...});
   ```
4. `getStatusStats()` - Estadísticas generales

**Endpoints a AGREGAR a `poc.js` EXISTENTE:**
```
// EVENTOS
POST   /api/poc/threads/:id/events            → pocEventService.createEvent()
GET    /api/poc/threads/:id/events            → pocEventService.getEventsByThread()
POST   /api/poc/threads/:id/mark-sale         → pocEventService.markSale()

// TIMELINE
GET    /api/poc/threads/:id/timeline          → pocThreadService.getThreadTimeline()
GET    /api/poc/threads/:id/timeline-enriched → pocEventService.getEnrichedTimeline()

// ESTADOS (todos en pocLeadStatusService para consistencia)
GET    /api/poc/threads/:id/status            → pocLeadStatusService.getStatus()
PATCH  /api/poc/threads/:id/status            → pocLeadStatusService.changeStatus()
GET    /api/poc/status/stats                  → pocLeadStatusService.getStatusStats()
```

**⚠️ PREVENCIÓN DE ROOT CAUSES:**
1. **NO** usar `getThreadStatus()` en pocThreadService (confunde responsabilidades)
2. **SÍ** usar import dinámico en pocLeadStatusService para evitar circular dependency
3. **SÍ** poner getEnrichedTimeline() en pocEventService (accede a eventos)
4. **SÍ** mantener getThreadTimeline() en pocThreadService (solo accede a mensajes)

**Ver:** `docs/superpowers/plans/2026-05-18-fase-2-backend-api.md` para código completo

---

## FASE 3: Frontend - Componentes Base (2-3 horas)

**Componentes nuevos:**
- `EventMarker.jsx` - Marcador visual de evento
- `StatusBadge.jsx` - Badge de estado del lead
- `EventForm.jsx` - Formulario para crear eventos
- `lib/poc/eventTypes.js` - Constantes y metadata

**Componentes modificados:**
- `ThreadRow.jsx` - Agregar badge de estado
- `apiConfig.js` - Nuevos endpoints

---

## FASE 4: Frontend - Timeline Enriquecido (3-4 horas)

**Vista mejorada:**
- Timeline intercala mensajes + eventos
- Eventos destacados visualmente con iconos y colores
- Marcadores de reasignación de bot
- Botón "Marcar Venta" flotante
- Modal para crear eventos manualmente

**Archivo principal:**
- `[threadId]/timeline/page.js` - Reemplazar con nueva versión

**Ver:** `docs/superpowers/plans/2026-05-18-fase-3-4-frontend-ui.md` para componentes completos

---

## FASE 5: Integración Webhook (1-2 horas)

**Modificar:**
- `src/services/webhookService.js` - Ya tiene integración, verificar que funcione

**Prueba:**
- Crear un vuelo manualmente → debe crear evento automático
- Verificar en frontend que aparece en timeline

---

## FASE 6: Testing Final (1-2 horas)

**Checklist de validación:**
- [ ] SQL ejecutado sin errores en Supabase
- [ ] Triggers funcionan (crear vuelo → evento automático)
- [ ] API responde correctamente (Postman/curl)
- [ ] Frontend muestra eventos intercalados
- [ ] Badge de estado aparece en ThreadRow
- [ ] Modal de "Marcar Venta" funciona
- [ ] Timeline carga sin errores de performance
- [ ] Estados cambian correctamente (manual y automático)

---

# ORDEN DE EJECUCIÓN PASO A PASO

## DÍA 1: Base de Datos + Backend

### Mañana (3 horas): FASE 1
- [ ] Invocar skills `supabase` y `supabase-postgres-best-practices`
- [ ] Leer `docs/superpowers/plans/2026-05-18-fase-1-base-datos.md`
- [ ] Ejecutar 3 archivos SQL en Supabase SQL Editor (orden 01 → 02 → 03)
- [ ] Verificar que tablas y triggers se crearon correctamente
- [ ] Commit: `feat(db): add event system tables and triggers`

### Tarde (4 horas): FASE 2
- [ ] Invocar skills `api-design-principles` y `code-review-excellence`
- [ ] Leer `docs/superpowers/plans/2026-05-18-fase-2-backend-api.md`
- [ ] Crear `pocEventService.js` con tests (TDD)
- [ ] Crear `pocLeadStatusService.js`
- [ ] Crear `pocEvents.js` routes
- [ ] Integrar rutas en `poc.js`
- [ ] Actualizar `apiConfig.js` en frontend
- [ ] Probar endpoints con Postman/curl
- [ ] Commit: `feat(api): add event and status endpoints`

---

## DÍA 2: Frontend

### Mañana (3 horas): FASE 3
- [ ] Invocar skills `interface-design` y `code-review-excellence`
- [ ] Leer `docs/superpowers/plans/2026-05-18-fase-3-4-frontend-ui.md` (Primera parte)
- [ ] Crear `eventTypes.js`, `eventIcons.js`, `statusConfig.js`
- [ ] Crear componente `StatusBadge.jsx`
- [ ] Crear componente `EventMarker.jsx`
- [ ] Modificar `ThreadRow.jsx` para mostrar badge
- [ ] Commit: `feat(ui): add status badge and event marker components`

### Tarde (4 horas): FASE 4
- [ ] Continuar con `docs/superpowers/plans/2026-05-18-fase-3-4-frontend-ui.md` (Segunda parte)
- [ ] Crear componente `EventForm.jsx` (modal)
- [ ] Reemplazar `[threadId]/timeline/page.js` con versión enriquecida
- [ ] Probar timeline con eventos intercalados
- [ ] Probar modal "Marcar Venta"
- [ ] Commit: `feat(ui): add enriched timeline with events`

---

## DÍA 3: Integración y Testing

### Mañana (2 horas): FASE 5
- [ ] Invocar skills `api-design-principles` y `supabase`
- [ ] Verificar `webhookService.js` integración
- [ ] Crear vuelo de prueba manualmente
- [ ] Verificar que evento aparece automáticamente
- [ ] Commit: `test: verify automatic sale detection`

### Tarde (2 horas): FASE 6
- [ ] Ejecutar checklist de validación completo
- [ ] Probar todos los flujos end-to-end
- [ ] Documentar cualquier issue encontrado
- [ ] Commit final: `docs: update POC status with event system`

---

# CRITERIOS DE ACEPTACIÓN

## Base de Datos
- [x] Tablas `poc_thread_events` y `poc_thread_status` existen
- [x] Trigger en `vuelos` crea evento `SALE_CONFIRMED` automáticamente
- [x] Estados válidos: NUEVO, EN_NEGOCIACION, VENTA_CONCRETADA, POST_VENTA, PERDIDO
- [x] Índices optimizados aplicados

## Backend API
- [x] POST evento manual funciona
- [x] GET eventos retorna lista ordenada cronológicamente
- [x] GET timeline enriquecido intercala mensajes + eventos
- [x] PATCH cambiar estado funciona y crea evento `STATUS_CHANGED`
- [x] Validaciones rechazan datos inválidos

## Frontend
- [x] Badge de estado aparece en `ThreadRow`
- [x] Timeline muestra eventos con iconos y colores
- [x] Modal "Marcar Venta" permite crear eventos manualmente
- [x] Performance: Timeline carga en <2 segundos con 100+ items
- [x] No errores en consola del navegador

## Integración
- [x] Crear vuelo → evento aparece automáticamente en <5 segundos
- [x] Marcar venta manualmente → estado cambia a VENTA_CONCRETADA
- [x] Cambiar estado manualmente → se crea evento `STATUS_CHANGED`

---

# DOCUMENTOS COMPLEMENTARIOS

📄 **Ver archivos detallados para código completo:**

1. `docs/superpowers/plans/2026-05-18-fase-1-base-datos.md`
   - SQL completo con todas las tablas, triggers y funciones
   - Instrucciones paso a paso de ejecución en Supabase
   
2. `docs/superpowers/plans/2026-05-18-fase-2-backend-api.md`
   - Código completo de servicios (`pocEventService`, `pocLeadStatusService`)
   - Rutas API con validaciones
   - Tests unitarios
   
3. `docs/superpowers/plans/2026-05-18-fase-3-4-frontend-ui.md`
   - Componentes React completos
   - Constantes y utilidades
   - Timeline enriquecido con eventos

---

# PRÓXIMOS PASOS DESPUÉS DE COMPLETAR

Una vez implementado el Enfoque 2, considerar:

1. **Reproducci

ón de Media** (docs/poc/funcionalidades-pendientes-media.md)
   - Audios, videos, imágenes, documentos
   - Estimado: 8-12 días adicionales

2. **Analytics Avanzados**
   - Dashboard de métricas por asesor
   - Tiempo promedio entre eventos
   - Funnel de conversión

3. **Automatizaciones**
   - Recordatorios automáticos si no hay actividad en 48h
   - Sugerencias de acciones basadas en comportamiento
   - Lead scoring automático

---

**Tiempo total estimado:** 3 días de implementación intensiva  
**Complejidad:** Media-Alta  
**Prioridad:** Alta (funcionalidad core del CRM)
