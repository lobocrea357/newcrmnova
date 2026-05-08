# 📘 GUÍA DE MIGRACIÓN - Optimización de Métricas de Conversaciones

**Última actualización:** 2025-01-08  
**Versión:** 1.0  
**Tiempo estimado:** 2-4 horas

---

## 🎯 OBJETIVO

Migrar el sistema de conversaciones de cálculo en tiempo real a métricas pre-calculadas, logrando:

- ✅ **30-60x más rápido** (15-30s → 300-500ms)
- ✅ **99% menos queries** (30+ → 1 query)
- ✅ **98% menos datos transferidos** (5-10 MB → 50-100 KB)

---

## 📋 PRE-REQUISITOS

### Acceso Necesario

- ✅ Acceso a Supabase Dashboard (o CLI)
- ✅ Permisos de superusuario en PostgreSQL
- ✅ Acceso al repositorio de código

### Verificaciones Previas

```bash
# 1. Verificar conexión a base de datos
psql -h [your-supabase-host] -U postgres -d postgres

# 2. Verificar versión de PostgreSQL (debe ser >= 12)
SELECT version();

# 3. Verificar espacio disponible
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## 🚀 FASE 1: QUICK WINS (30 minutos)

### Paso 1.1: Crear Índices Compuestos

**Ubicación:** Supabase SQL Editor o `psql`

```sql
-- Ejecutar estos índices PRIMERO para mejorar queries existentes

-- Índice para queries de mensajes por chat
CREATE INDEX CONCURRENTLY idx_messages_chat_timestamp 
ON messages(chat_id, timestamp DESC);

-- Índice para filtrar mensajes del asesor
CREATE INDEX CONCURRENTLY idx_messages_chat_fromme_timestamp 
ON messages(chat_id, from_me, timestamp);

-- Índice para chats activos del bot
CREATE INDEX CONCURRENTLY idx_chats_bot_active 
ON chats(bot_id, is_group, last_message_time DESC) 
WHERE archived = false AND is_group = false;

-- Verificar que se crearon
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('messages', 'chats')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Resultado esperado:**

```
✓ 3 índices creados
✓ Query time reducido en 50-80%
✓ Sin cambios en código necesarios
```

### Paso 1.2: Agregar Loading States Mejorados (Opcional)

**Ubicación:** `dashboard/src/app/(crm)/conversaciones/page.js`

```jsx
// Reemplazar el loading state actual (línea ~2216)

{loadingConversations[selectedBotId] ? (
  <div className="h-full flex flex-col items-center justify-center text-sm text-gray-500 gap-3 py-12">
    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
    <div className="text-center">
      <p className="font-semibold">Cargando conversaciones...</p>
      <p className="text-xs text-gray-400 mt-1">
        Optimizando consultas de base de datos
      </p>
    </div>
    {/* Progress bar opcional */}
    <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-600 animate-pulse" style={{width: '60%'}} />
    </div>
  </div>
) : ...}
```

**Resultado esperado:**

```
✓ Mejor UX durante carga
✓ Usuario sabe que el sistema está trabajando
```

---

## 🏗️ FASE 2: MIGRACIÓN ESTRUCTURAL (2-3 horas)

### Paso 2.1: Ejecutar Migración SQL Principal

**Ubicación:** Supabase SQL Editor

1. **Abrir archivo de migración:**
   ```
   docs/05-base-de-datos/migrations/20260108_conversation_metrics_optimization.sql
   ```

2. **Ejecutar el script completo** en Supabase SQL Editor

3. **Verificar salida:**
   ```
   ✓ Tabla conversation_metrics creada correctamente
   ✓ Índices creados correctamente
   ✓ Función calculate_conversation_metrics creada correctamente
   ✓ Trigger messages_update_metrics creado correctamente
   ✓ MIGRACIÓN COMPLETADA EXITOSAMENTE
   ```

**⚠️ IMPORTANTE:** Si hay errores, revisar log completo antes de continuar.

### Paso 2.2: Migrar Datos Históricos (Backfill)

**OPCIÓN A: Backfill Completo (Recomendado para < 10,000 chats)**

```sql
-- Ejecutar en batches de 100 chats
-- Repetir hasta que processed_chats sea 0

SELECT * FROM backfill_conversation_metrics(NULL, 100);

-- Output esperado:
-- processed_chats | total_chats | progress_percentage
-- 100             | 5432        | 1.8
```

**Repetir el SELECT cada 30 segundos** hasta completar:

```sql
-- Verificar progreso
SELECT 
  COUNT(*) as total_chats,
  (SELECT COUNT(*) FROM conversation_metrics) as chats_with_metrics,
  ROUND(
    (SELECT COUNT(*)::numeric FROM conversation_metrics) / 
    COUNT(*)::numeric * 100, 
    1
  ) as percentage
FROM chats 
WHERE is_group = false;
```

**OPCIÓN B: Backfill por Bot (Recomendado para > 10,000 chats)**

```sql
-- Listar bots ordenados por cantidad de conversaciones
SELECT 
  b.id, 
  b.name, 
  COUNT(c.id) as chat_count
FROM bots b
LEFT JOIN chats c ON c.bot_id = b.id AND c.is_group = false
GROUP BY b.id, b.name
ORDER BY chat_count DESC;

-- Migrar bot por bot (reemplazar con ID real)
SELECT * FROM backfill_conversation_metrics('bot-uuid-aqui', 100);
```

**Tiempo estimado:**
- ~100 chats/minuto
- 5,000 chats = ~50 minutos
- 10,000 chats = ~100 minutos

### Paso 2.3: Verificar Integridad de Datos

```sql
-- 1. Verificar que todos los chats tienen métricas
SELECT 
  'Chats sin métricas' as status,
  COUNT(*) as count
FROM chats c
WHERE c.is_group = false
  AND NOT EXISTS (
    SELECT 1 FROM conversation_metrics cm 
    WHERE cm.chat_id = c.id
  );

-- Resultado esperado: count = 0

-- 2. Verificar que las métricas tienen sentido
SELECT 
  chat_id,
  total_messages,
  messages_from_client,
  messages_from_advisor,
  avg_response_time_minutes,
  cotizacion_mentions_count,
  payment_mentions_count
FROM conversation_metrics
ORDER BY total_messages DESC
LIMIT 10;

-- 3. Comparar métricas calculadas vs mensajes reales (sample)
SELECT 
  cm.chat_id,
  cm.total_messages as metrics_count,
  (SELECT COUNT(*) FROM messages WHERE chat_id = cm.chat_id) as actual_count,
  cm.total_messages - (SELECT COUNT(*) FROM messages WHERE chat_id = cm.chat_id) as difference
FROM conversation_metrics cm
WHERE cm.total_messages > 0
ORDER BY random()
LIMIT 20;

-- Resultado esperado: difference = 0 para todos
```

### Paso 2.4: Actualizar Código Frontend

**Ubicación:** `dashboard/src/lib/supabase.js`

**Opción Conservadora (Recomendada):**

```javascript
// Importar versión optimizada
import { getConversationsByBotSmart } from './supabase-optimized';

// Reemplazar en fetchConversations (línea ~460)
const fetchConversations = async (botId, page = 1) => {
  try {
    setLoadingConversations((prev) => ({ ...prev, [botId]: true }));
    
    // Usar versión smart que auto-detecta si usar optimizada o legacy
    const result = await getConversationsByBotSmart(botId, page, 10);
    
    setConversations((prev) => ({ ...prev, [botId]: result.data }));
    setConversationsPagination((prev) => ({
      ...prev,
      [botId]: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        total: result.total,
      },
    }));

    const totalCotizaciones = result.data.reduce((sum, conv) => {
      return sum + (conv.conversation_metrics?.cotizacionMentions?.count || 0);
    }, 0);
    setBotCotizaciones((prev) => ({ ...prev, [botId]: totalCotizaciones }));
  } catch (error) {
    console.error("Error fetching conversations:", error);
  } finally {
    setLoadingConversations((prev) => ({ ...prev, [botId]: false }));
  }
};
```

**Opción Agresiva (Solo si backfill está 100% completo):**

```javascript
// Importar directamente versión optimizada
import { getConversationsByBotOptimized } from './supabase-optimized';

// Usar directamente en fetchConversations
const result = await getConversationsByBotOptimized(botId, page, 10);
```

### Paso 2.5: Testing en Desarrollo

```bash
# 1. Instalar dependencias
cd dashboard
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir navegador en http://localhost:3000/conversaciones
```

**Checklist de Testing:**

- [ ] Las conversaciones cargan en < 1 segundo
- [ ] El contador de mensajes es correcto
- [ ] Los tiempos de respuesta promedio son correctos
- [ ] Las cotizaciones se muestran correctamente
- [ ] Las menciones de pago son correctas
- [ ] La paginación funciona correctamente
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs de Supabase

### Paso 2.6: Monitoreo Post-Migración

**Crear dashboard de monitoreo en Supabase:**

```sql
-- Query para monitorear rendimiento
SELECT 
  DATE_TRUNC('hour', calculated_at) as hour,
  COUNT(*) as metrics_calculated,
  AVG(total_messages) as avg_messages,
  MAX(total_messages) as max_messages
FROM conversation_metrics
WHERE calculated_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

**Configurar alerta para métricas desactualizadas:**

```sql
-- Chats con métricas desactualizadas (> 1 hora desde último mensaje)
SELECT 
  c.id,
  c.bot_id,
  c.last_message_time,
  cm.calculated_at,
  EXTRACT(EPOCH FROM (c.last_message_time - cm.calculated_at)) / 60 as minutes_outdated
FROM chats c
LEFT JOIN conversation_metrics cm ON cm.chat_id = c.id
WHERE c.is_group = false
  AND c.last_message_time > NOW() - INTERVAL '24 hours'
  AND (
    cm.calculated_at IS NULL 
    OR c.last_message_time > cm.calculated_at + INTERVAL '1 hour'
  )
ORDER BY minutes_outdated DESC
LIMIT 20;
```

---

## 🔧 FASE 3: OPTIMIZACIONES AVANZADAS (Opcional)

### Paso 3.1: Implementar Cache con Redis (Opcional)

Solo si tienes > 50,000 conversaciones y necesitas optimización adicional.

**Pre-requisito:** Redis instalado

```bash
# Instalar cliente Redis
npm install redis
```

**Ver documentación completa en:**
`docs/AUDITORIA_RENDIMIENTO_CONVERSACIONES.md` - Solución #3

### Paso 3.2: Background Jobs para Actualización (Opcional)

En lugar de trigger síncrono, usar job asíncrono para conversaciones con muchos mensajes.

```sql
-- Deshabilitar trigger para chats con > 1000 mensajes
-- Usar pg_cron o sistema externo de jobs
```

---

## ⚠️ TROUBLESHOOTING

### Problema: Migración SQL falla con error de permisos

**Solución:**

```sql
-- Otorgar permisos necesarios
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
```

### Problema: Backfill muy lento

**Solución:**

```sql
-- Aumentar batch size si tu servidor lo soporta
SELECT * FROM backfill_conversation_metrics(NULL, 500);

-- O ejecutar en paralelo por bot
-- Terminal 1:
SELECT * FROM backfill_conversation_metrics('bot-1-uuid', 100);
-- Terminal 2:
SELECT * FROM backfill_conversation_metrics('bot-2-uuid', 100);
```

### Problema: Métricas inconsistentes

**Solución:**

```sql
-- Recalcular métricas para chats específicos
SELECT calculate_conversation_metrics('chat-uuid-aqui');

-- O recalcular todas
DELETE FROM conversation_metrics;
SELECT * FROM backfill_conversation_metrics(NULL, 100);
```

### Problema: Trigger causa locks en base de datos

**Solución temporal:**

```sql
-- Deshabilitar trigger temporalmente
ALTER TABLE messages DISABLE TRIGGER messages_update_metrics;

-- Recalcular manualmente después
SELECT * FROM backfill_conversation_metrics(NULL, 100);

-- Re-habilitar trigger
ALTER TABLE messages ENABLE TRIGGER messages_update_metrics;
```

---

## 📊 VALIDACIÓN DE ÉXITO

### Métricas Antes vs Después

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tiempo de carga (10 convs) | 15-30s | 300-500ms | **30-60x** |
| Queries por página | 30+ | 1-2 | **98%** |
| Datos transferidos | 5-10 MB | 50-100 KB | **99%** |
| CPU usage | 80-90% | 10-20% | **75%** |

### Checklist Final

- [ ] Tabla `conversation_metrics` creada
- [ ] Índices compuestos creados
- [ ] Función `calculate_conversation_metrics` funciona
- [ ] Trigger `messages_update_metrics` activo
- [ ] Backfill completo (100% chats con métricas)
- [ ] Código frontend actualizado
- [ ] Testing en desarrollo exitoso
- [ ] Tiempo de carga < 1 segundo
- [ ] Sin errores en logs
- [ ] Monitoreo configurado

---

## 🔄 ROLLBACK (Si algo sale mal)

### Paso 1: Revertir Código Frontend

```javascript
// Volver a usar versión original en supabase.js
import { getConversationsByBot } from './supabase'; // versión original
```

### Paso 2: Deshabilitar Trigger (Opcional)

```sql
ALTER TABLE messages DISABLE TRIGGER messages_update_metrics;
```

### Paso 3: Eliminar Tabla de Métricas (Solo en emergencia)

```sql
-- SOLO SI ES ABSOLUTAMENTE NECESARIO
DROP TABLE IF EXISTS conversation_metrics CASCADE;
DROP FUNCTION IF EXISTS calculate_conversation_metrics(UUID);
DROP FUNCTION IF EXISTS backfill_conversation_metrics(UUID, INTEGER);
```

### Paso 4: Eliminar Índices Nuevos (Opcional)

```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_chat_timestamp;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_chat_fromme_timestamp;
DROP INDEX CONCURRENTLY IF EXISTS idx_chats_bot_active;
```

---

## 📞 SOPORTE

**Archivos de Referencia:**
- Auditoría completa: `docs/AUDITORIA_RENDIMIENTO_CONVERSACIONES.md`
- Migración SQL: `docs/05-base-de-datos/migrations/20260108_conversation_metrics_optimization.sql`
- Código optimizado: `dashboard/src/lib/supabase-optimized.js`

**Logs Importantes:**
- Supabase SQL Editor: Ver "Query Results" y "Logs"
- Browser Console: Verificar errores JavaScript
- Network Tab: Verificar tiempo de queries

---

**✅ FIN DE LA GUÍA**

Tiempo total estimado: **2-4 horas**  
Mejora de rendimiento esperada: **30-60x más rápido**
