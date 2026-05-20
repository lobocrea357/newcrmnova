# PoC Thread Global - Sincronización Incremental en Tiempo Real

**Fecha:** 2026-05-14  
**Objetivo:** Implementar sincronización incremental automática via webhook de WAHA para manejar volúmenes masivos de mensajes y conversaciones.

---

## 📋 Contexto del Problema Original

### Problema
El botón de "Sincronizar Threads" se quedaba en estado de loading indefinidamente porque:

1. **Cantidad masiva de datos:** Hay demasiadas conversaciones y mensajes para procesarlas en una sola operación
2. **Operación síncrona:** La sincronización completa bloqueaba el proceso
3. **No escalable:** Un cron de lotes pequeños tardaría demasiado en sincronizar todo el backlog histórico

### Requisitos del Usuario
- **Sincronización automática incremental:** No manual por botón
- **Procesamiento en tiempo real:** No por lotes periódicos
- **Escalable para millones de mensajes:** Arquitectura que crezca con el volumen
- **Vista de timeline completo:** Ver todo el hilo de conversación de un cliente
- **No afectar producción:** Sistema aislado con tablas prefijo `poc_*`

---

## 🏗️ Arquitectura Elegida: Webhooks en Tiempo Real

### ¿Por qué esta arquitectura?

**Opción 1: Webhooks en Tiempo Real ✅ ELEGIDA**
```
Nuevo mensaje → Webhook WAHA → Upsert thread inmediato
- Trigger: cada vez que llega un mensaje a Supabase
- Procesamiento: 1 mensaje a la vez (instantáneo)
- Escalabilidad: infinita (cada mensaje es independiente)
- Estado actual: threads se crean automáticamente con el tiempo
```

**Opción 2: Triggers de Supabase** (descartada por menor control)
**Opción 3: Queue Híbrida** (descartada por complejidad innecesaria)

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Mensaje nuevo llega a WhatsApp                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Webhook WAHA → /webhooks/waha                                 │
│    webhookService.processWebhook()                               │
│    webhookService.handleMessage()                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Guardar mensaje en BD (messages)                              │
│    messageService.saveMessage()                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Actualizar thread (ASÍNCRONO, NO BLOQUEANTE)                  │
│    pocThreadService.updateThreadForNewMessage()                   │
│    └─ Upsert thread por teléfono                                 │
│    └─ Vincular chat al thread                                   │
│    └─ calculateThreadMetrics() [async, no bloqueante]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend - Cambios Realizados

### 1. `src/services/pocThreadService.js`

#### Método Nuevo: `updateThreadForNewMessage()`
```javascript
async updateThreadForNewMessage(botId, chatId, contactPhone, contactName, messageTimestamp) {
  // Upsert thread por teléfono
  // Vincular chat al thread
  // Calcular métricas (async, no bloqueante)
}
```

**Características:**
- **No bloqueante:** Errores no lanzan excepción (no crítico)
- **Upsert inteligente:** Crea o actualiza thread por `customer_phone`
- **Métricas asíncronas:** `calculateThreadMetrics()` en background
- **Log detallado:** Para debugging

#### Método Nuevo: `getThreadTimeline()`
```javascript
async getThreadTimeline(threadId) {
  // Obtener todos los chats del thread
  // Obtener todos los mensajes de esos chats
  // Ordenar cronológicamente
  // Agregar metadata de reasignaciones
}
```

**Características:**
- **Timeline completo:** Todos los mensajes en orden cronológico
- **Metadata de reasignaciones:** Detecta cambios de bot
- **Relaciones completas:** Incluye chat y bot de cada mensaje

### 2. `src/services/webhookService.js`

#### Integración en `handleMessage()`
```javascript
// PASO 6: Actualizar thread de PoC (sincronización incremental - no bloqueante)
pocThreadService.updateThreadForNewMessage(
  bot.id,
  chat.chat_id,
  contactNumber,
  contactName,
  messageTimestamp
).catch(err => {
  console.warn('[Webhook] Error actualizando thread PoC (no crítico):', err.message);
});
```

**Características:**
- **Llamada asíncrona:** No bloquea el webhook principal
- **Error handling:** Errores logueados como warning (no crítico)
- **Datos disponibles:** Usa contact, chat y bot ya procesados

### 3. `src/routes/poc.js`

#### Nuevo Endpoint: `GET /api/poc/threads/:threadId/timeline`
```javascript
router.get('/threads/:threadId/timeline', async (req, res) => {
  const { threadId } = req.params;
  const timeline = await pocThreadService.getThreadTimeline(threadId);
  
  res.json({
    success: true,
    data: timeline,
    meta: { count: timeline.length, thread_id: threadId }
  });
});
```

---

## 🎨 Frontend - Cambios Realizados

### 1. `dashboard/src/config/apiConfig.js`

#### Nueva URL
```javascript
export const POC_API = {
  threads: (limit) => buildApiUrl(`/api/poc/threads?limit=${limit}`),
  threadsStats: buildApiUrl('/api/poc/threads/stats'),
  syncThreads: buildApiUrl('/api/poc/threads/sync'),
  threadTimeline: (threadId) => buildApiUrl(`/api/poc/threads/${threadId}/timeline`) // NUEVO
}
```

### 2. `dashboard/src/components/poc/ThreadRow.jsx`

#### Nuevo Botón: "Ver Timeline"
```javascript
<button
  onClick={() => window.location.href = `/conversaciones-poc/${thread.id}/timeline`}
  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
>
  <Eye className="h-4 w-4" />
  <span className="text-sm font-medium">Ver Timeline</span>
</button>
```

**Características:**
- Navegación directa a vista de timeline
- Estilo consistente con el resto de la UI
- Icono de "ojo" para representar visualización

### 3. `dashboard/src/app/(crm)/conversaciones-poc/page.js`

#### Eliminación de Sincronización Manual
- ❌ Eliminado botón "Sincronizar Threads"
- ❌ Eliminado estado `syncing`
- ❌ Eliminado método `syncThreads()`

#### UI Actualizada
```javascript
// Header
<div className="bg-white/20 px-4 py-2 rounded-lg">
  <div className="flex items-center gap-2 text-white">
    <RefreshCw className="h-5 w-5 animate-spin" />
    <span className="text-sm font-medium">Sincronización automática via webhook</span>
  </div>
</div>

// Footer Info
<li>• <strong>Sincronización automática incremental</strong> via webhook de WAHA</li>
<li>• Cada mensaje nuevo actualiza el thread correspondiente en tiempo real</li>
```

### 4. `dashboard/src/app/(crm)/conversaciones-poc/[threadId]/timeline/page.js`

#### Nueva Página: Vista de Timeline Completo

**Características:**
- **Protección super_admin:** Solo accesible por super admins
- **Timeline visual:** Todos los mensajes en orden cronológico
- **Marcadores de reasignación:** Líneas ámbar cuando cambia el bot
- **Avatar diferenciado:** Bot vs Cliente
- **Metadata:** Timestamp, chat, bot de cada mensaje
- **Recarga:** Botón para recargar timeline
- **Navegación:** Botón "Volver a Threads"

**Estructura:**
```
Header (info del thread)
├─ Timeline de mensajes
│   ├─ Marcador de reasignación (si aplica)
│   └─ Mensaje individual
│       ├─ Avatar (Bot/Cliente)
│       ├─ Timestamp
│       └─ Contenido
└─ Footer Info (explicación)
```

---

## 📊 Consideraciones de Escalabilidad

### ¿Por qué es escalable?

1. **Procesamiento por mensaje:**
   - Cada mensaje se procesa independientemente
   - No hay operaciones masivas que bloqueen
   - Latencia constante independientemente del volumen

2. **No bloqueante:**
   - Errores en threads no afectan el webhook
   - Métricas calculadas en background
   - Sistema sigue funcionando incluso si hay errores

3. **Aislado:**
   - Tablas prefijo `poc_*` no afectan producción
   - Puede desactivarse sin impacto
   - Fácil de eliminar si no se necesita

4. **Crecimiento orgánico:**
   - Threads se crean con el tiempo
   - No requiere sincronización inicial masiva
   - Estado actual refleja actividad reciente

### Limitaciones Actuales

1. **Backlog histórico:**
   - Mensajes antiguos no se sincronizan automáticamente
   - Requiere worker en background (pendiente implementar)

2. **Métricas asíncronas:**
   - Se calculan después de upsert del thread
   - Puede haber delay de segundos en métricas

3. **No realtime en frontend:**
   - Frontend requiere recarga manual
   - No usa Supabase Realtime para actualizaciones

---

## 🚀 Próximos Pasos Pendientes

### 1. Worker de Backlog Histórico (Opcional)

**Objetivo:** Sincronizar mensajes antiguos muy lentamente en background

**Implementación sugerida:**
```javascript
// src/workers/pocBacklogWorker.js
class PocBacklogWorker {
  async processBacklog() {
    // Obtener mensajes no procesados
    // Procesar en lotes de 100
    // Pausa de 5 segundos entre lotes
    // Continuar hasta completar
  }
}
```

**Consideraciones:**
- Muy lento (días/semanas para millones de mensajes)
- No bloqueante (background)
- Pausable/reanudable
- Monitoreo de progreso

### 2. Supabase Realtime en Frontend (Opcional)

**Objetivo:** Actualizaciones automáticas en frontend cuando cambian threads

**Implementación sugerida:**
```javascript
// dashboard/src/hooks/usePocThreadsRealtime.js
export function usePocThreadsRealtime() {
  const [threads, setThreads] = useState([]);
  
  useEffect(() => {
    const subscription = supabase
      .channel('poc_threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poc_customer_threads' }, payload => {
        // Actualizar threads en tiempo real
      })
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, []);
  
  return threads;
}
```

### 3. Optimización de Métricas (Opcional)

**Objetivo:** Calcular métricas de forma más eficiente

**Implementación sugerida:**
- Usar triggers de Supabase para actualización incremental
- Cache de métricas en Redis
- Batch processing de métricas

---

## 📁 Archivos Modificados/Creados

### Backend
- `src/services/pocThreadService.js` - Métodos nuevos
- `src/services/webhookService.js` - Integración con thread service
- `src/routes/poc.js` - Nuevo endpoint de timeline

### Frontend
- `dashboard/src/config/apiConfig.js` - Nueva URL de timeline
- `dashboard/src/components/poc/ThreadRow.jsx` - Botón de timeline
- `dashboard/src/app/(crm)/conversaciones-poc/page.js` - UI actualizada
- `dashboard/src/app/(crm)/conversaciones-poc/[threadId]/timeline/page.js` - NUEVA PÁGINA

---

## 🔍 Debugging y Monitoreo

### Logs Relevantes

**Backend (webhookService.js):**
```javascript
console.log('[Webhook] Error actualizando thread PoC (no crítico):', err.message);
```

**Backend (pocThreadService.js):**
```javascript
console.log(`[PoC Threads] Actualizando thread para nuevo mensaje - Teléfono: ${contactPhone}`);
console.log(`[PoC Threads] Thread actualizado exitosamente: ${thread.id}`);
console.warn('[PoC Threads] Error upsert thread (no crítico):', threadError);
```

### Comandos Útiles

```bash
# Ver logs del contenedor Express
docker logs -f crm-express

# Ver threads en BD
# (usar SQL editor en Supabase)
SELECT * FROM poc_customer_threads ORDER BY last_message_at DESC LIMIT 10;

# Ver timeline de un thread específico
SELECT * FROM poc_thread_chats WHERE thread_id = 'xxx';

# Ver métricas
SELECT * FROM poc_thread_metrics ORDER BY updated_at DESC LIMIT 10;
```

---

## 🎯 Resumen de Impacto

### Antes (Sincronización Manual)
- ❌ Botón se quedaba en loading
- ❌ Operación masiva bloqueante
- ❌ No escalable para millones de mensajes
- ❌ Requiere intervención manual

### Después (Sincronización Automática)
- ✅ Automático via webhook
- ✅ Procesamiento por mensaje (instantáneo)
- ✅ Escalabilidad infinita
- ✅ No requiere intervención
- ✅ Vista de timeline completo
- ✅ Marcadores de reasignación

---

## 📞 Contacto para Mejoras

Para continuar mejorando este sistema, considerar:

1. **Performance:** Optimizar queries de timeline para threads con miles de mensajes
2. **Realtime:** Implementar Supabase Realtime en frontend
3. **Backlog:** Worker para sincronizar mensajes históricos
4. **Analítica:** Métricas adicionales (tiempo entre reasignaciones, etc.)
5. **Export:** Exportar timeline a PDF/Excel

---

**Última actualización:** 2026-05-14  
**Estado:** ✅ Implementación completada y en producción
