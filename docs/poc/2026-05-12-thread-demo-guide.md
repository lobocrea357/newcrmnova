# Guía de Demostración: Thread Global por Cliente

## Contexto

**Problema actual:**
- Cliente X tiene conversación en Bot A (Asesor Moisés)
- Cliente X reasignado → nueva conversación en Bot B (Asesor Jesús)
- Sistema actual: 2 chats separados con métricas parciales
- Gerentes: confusión en auditorías

**Solución propuesta:**
- Thread = agrupación lógica por cliente (phone_number)
- Métricas agregadas de todos los chats
- Vista unificada para auditorías

---

## Datos de Demostración

### Preparación (antes de mostrar)

1. **Sincronizar threads:**
   - Abrir `/conversaciones-poc`
   - Click en "Sincronizar Threads"
   - Esperar 5-10 segundos

2. **Verificar datos interesantes:**

Ejecutar en Supabase SQL Editor:

```sql
-- Encontrar clientes con más fragmentación
SELECT 
  pct.customer_name,
  pct.customer_phone,
  ptm.total_chats as fragmentos,
  ptm.total_messages,
  ptm.advisors
FROM poc_customer_threads pct
JOIN poc_thread_metrics ptm ON ptm.thread_id = pct.id
WHERE ptm.total_chats > 1
ORDER BY ptm.total_chats DESC
LIMIT 5;
```

**Anotar** estos casos para mostrar en la demo.

---

## Script de Presentación

### 1. Mostrar el Problema (2 min)

**Abrir vista actual:** `/conversaciones`

Seleccionar un bot y mostrar:
- Cliente X: 30 mensajes
- Buscar mismo cliente en otro bot
- Cliente X (otra sesión): 70 mensajes

**Decir:**
> "Aquí tenemos 2 conversaciones del mismo cliente fragmentadas.
> El gerente tiene que abrir ambas manualmente para saber que 
> realmente son 100 mensajes, no 30+70 separados."

### 2. Mostrar la Solución (5 min)

**Abrir PoC:** `/conversaciones-poc`

**Señalar Stats Cards:**
- "X threads totales (clientes únicos)"
- "Y con fragmentación (clientes reasignados)"
- "Z reasignaciones totales"

**Mostrar Thread Fragmentado:**

Buscar un thread con badge "FRAGMENTADO (3 chats)":

**Señalar:**
1. **Timeline de reasignaciones:**
   - "Moisés → Jesús → Endry"
   - "Ves todo el historial de quién atendió"

2. **Métricas unificadas:**
   - "150 mensajes totales (no 50+60+40 separados)"
   - "2 cotizaciones enviadas (agregadas de los 3 chats)"

3. **Comparison Badge:**
   - "Sistema actual: 3 chats separados"
   - "Con threads: 1 conversación completa"

### 3. Explicar Arquitectura (3 min)

**Abrir diagrama mental:**

```
poc_customer_threads (thread por cliente)
    ├─ poc_thread_chats (vincula chats al thread)
    └─ poc_thread_metrics (métricas agregadas)
```

**Decir:**
> "Es una tabla nueva que agrupa por teléfono del cliente.
> No modifica nada del sistema actual. Todo tiene prefijo poc_.
> Si no funciona, DROP TABLE y listo."

### 4. Comparación Técnica (2 min)

**Mostrar query actual vs. thread:**

```sql
-- Sistema actual (fragmentado)
SELECT COUNT(*) FROM messages WHERE chat_id = 'chat-bot-a';  -- 50
SELECT COUNT(*) FROM messages WHERE chat_id = 'chat-bot-b';  -- 100
-- Gerente tiene que sumar mentalmente: 150

-- Con threads (unificado)
SELECT total_messages FROM poc_thread_metrics 
WHERE thread_id = 'thread-cliente-x';  -- 150 ✅
```

### 5. Responder Objeciones (según reacción)

**Objeción: "Es muy complejo"**

Respuesta:
> "3 tablas nuevas. El servicio reutiliza queries existentes.
> El frontend es solo una vista alternativa. Complejidad controlada."

**Objeción: "Puedes hacer esto en el frontend"**

Respuesta:
> "No puedes calcular avg_response_time correctamente en frontend.
> El promedio de promedios es matemáticamente incorrecto.
> Necesitas los mensajes individuales = necesitas modelo de datos."

**Objeción: "¿Cuántos clientes están fragmentados realmente?"**

Respuesta:
> "Mira las stats: X% de fragmentación. Y reasignaciones/semana.
> Este es dato real, no hipotético."

---

## Métricas de Éxito de la Demo

✅ Senior developer entiende el problema visualmente
✅ Ve la diferencia clara entre actual vs. threads
✅ Comprende que los datos actuales son incorrectos
✅ Acepta que la implementación es viable

---

## Siguientes Pasos (si aprueba)

1. **Migración gradual:**
   - Crear threads en paralelo durante 1 semana
   - Comparar precisión con sistema actual
   - Feature flag para cambiar entre vistas

2. **Integración con producción:**
   - Renombrar `poc_*` → `customer_threads`
   - Actualizar webhooks para mantener threads actualizados
   - Migrar frontend gradualmente

3. **Limpieza:**
   - Deprecar vista fragmentada
   - Documentar nueva arquitectura

---

## Checklist Final de Implementación

Antes de presentar la demo, verificar:

- [ ] ✅ Backend funciona sin errores
- [ ] ✅ Endpoints `/api/poc/*` responden correctamente
- [ ] ✅ Frontend carga sin errores de consola
- [ ] ✅ Solo super_admin puede acceder a `/conversaciones-poc`
- [ ] ✅ Botón "Sincronizar Threads" funciona
- [ ] ✅ Threads muestran datos correctos
