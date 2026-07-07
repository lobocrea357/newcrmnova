# Orden de Ejecución de Scripts SQL - Sistema de Eventos POC

## 📌 INSTRUCCIONES PARA SUPABASE SQL EDITOR

### Prerrequisitos
- Acceso a Supabase Dashboard del proyecto
- Permisos de administrador de base de datos
- Tablas POC existentes (poc_customer_threads, poc_thread_chats, poc_thread_metrics)

---

## 🔢 ORDEN DE EJECUCIÓN (CRÍTICO)

Ejecutar los archivos en este orden EXACTO. NO omitir pasos.

### 📄 Archivo 1: Tablas de Eventos
**Ruta:** `docs/sql-manual/01-create-events-tables.sql`  
**Propósito:** Crear tablas `poc_thread_events` y `poc_thread_status`  
**Tiempo estimado:** 5-10 segundos  
**Resultado esperado:** `Success. No rows returned`

**Qué crea:**
- Tabla `poc_thread_events` con constraints y comentarios
- Tabla `poc_thread_status` con métricas agregadas
- Constraints de validación de estados y tipos de eventos

---

### 📄 Archivo 2: Triggers y Funciones
**Ruta:** `docs/sql-manual/02-create-triggers-functions.sql`  
**Propósito:** Crear funciones automáticas y triggers  
**Tiempo estimado:** 10-15 segundos  
**Resultado esperado:** `Success. No rows returned`

**Qué crea:**
- Función `poc_detect_sale_from_vuelo()` - Detección automática de ventas
- Trigger `trigger_poc_detect_sale` - Se ejecuta al insertar en `vuelos`
- Función `poc_update_thread_status_from_event()` - Actualiza estado del thread
- Trigger `trigger_poc_update_status` - Se ejecuta al insertar evento
- Función `poc_sync_first_contact()` - Sincroniza timestamps
- Trigger `trigger_poc_sync_contact` - Mantiene métricas actualizadas

---

### 📄 Archivo 3: Índices
**Ruta:** `docs/sql-manual/03-create-indexes.sql`  
**Propósito:** Optimizar queries con índices  
**Tiempo estimado:** 5-10 segundos  
**Resultado esperado:** `Success. No rows returned`

**Qué crea:**
- 6 índices en `poc_thread_events` para queries comunes
- 3 índices en `poc_thread_status` para filtrado por estado

---

## ✅ VALIDACIÓN POST-EJECUCIÓN

Después de ejecutar los 3 archivos, ejecutar esta query de verificación:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'poc_%'
ORDER BY table_name;
```

**Resultado esperado (5 tablas):**
```
poc_customer_threads    (ya existía)
poc_thread_chats        (ya existía)
poc_thread_events       ← NUEVA
poc_thread_metrics      (ya existía)
poc_thread_status       ← NUEVA
```

---

## 🔍 VERIFICAR TRIGGERS

```sql
-- Ver todos los triggers creados
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_poc%'
ORDER BY trigger_name;
```

**Resultado esperado (3 triggers):**
```
trigger_poc_detect_sale     | vuelos                 | AFTER | INSERT
trigger_poc_sync_contact    | poc_customer_threads   | AFTER | INSERT, UPDATE
trigger_poc_update_status   | poc_thread_events      | AFTER | INSERT
```

---

## 🧪 PRUEBA RÁPIDA

Ejecutar esta prueba para verificar que todo funciona:

```sql
-- 1. Crear thread de prueba
INSERT INTO poc_customer_threads (customer_phone, customer_name)
VALUES ('+584141111111', 'Cliente Test')
RETURNING id;

-- Copiar el ID retornado y usarlo en la siguiente query

-- 2. Verificar que se creó el estado automáticamente
SELECT * FROM poc_thread_status 
WHERE thread_id = 'PEGAR_ID_AQUI';
-- Debe mostrar: current_status = 'NUEVO'

-- 3. Crear evento de venta manualmente
INSERT INTO poc_thread_events (
  thread_id,
  event_type,
  occurred_at,
  event_data
) VALUES (
  'PEGAR_ID_AQUI',
  'SALE_CONFIRMED',
  NOW(),
  '{"amount": 500}'::jsonb
);

-- 4. Verificar que el estado cambió automáticamente
SELECT current_status, total_sales, total_sales_amount
FROM poc_thread_status 
WHERE thread_id = 'PEGAR_ID_AQUI';
-- Debe mostrar: current_status = 'VENTA_CONCRETADA', total_sales = 1

-- 5. Limpiar prueba
DELETE FROM poc_customer_threads WHERE id = 'PEGAR_ID_AQUI';
```

---

## ⚠️ TROUBLESHOOTING

### Error: "relation already exists"
**Causa:** Ya ejecutaste el script antes  
**Solución:** Es seguro ignorar. Las tablas ya existen. Puedes continuar.

### Error: "function does not exist"
**Causa:** Archivo 2 no se ejecutó correctamente  
**Solución:** Volver a ejecutar archivo 02-create-triggers-functions.sql

### Error: "could not create trigger"
**Causa:** La tabla objetivo no existe o el nombre de función está mal  
**Solución:** 
1. Verificar que archivo 1 se ejecutó (tablas existen)
2. Verificar que tabla `vuelos` existe en tu base de datos
3. Revisar logs de Supabase para error específico

### Error: "permission denied"
**Causa:** El usuario no tiene permisos suficientes  
**Solución:** Ejecutar como usuario administrador o service_role

### Trigger no se ejecuta automáticamente
**Causa:** Trigger creado pero deshabilitado o error silencioso  
**Solución:**
```sql
-- Ver estado del trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_poc_detect_sale';

-- Habilitar trigger si está deshabilitado
ALTER TABLE vuelos ENABLE TRIGGER trigger_poc_detect_sale;
```

---

## 📊 MONITOREO

### Ver eventos creados recientemente
```sql
SELECT 
  e.event_type,
  e.occurred_at,
  e.is_system_generated,
  t.customer_phone,
  t.customer_name
FROM poc_thread_events e
JOIN poc_customer_threads t ON t.id = e.thread_id
ORDER BY e.created_at DESC
LIMIT 20;
```

### Ver threads por estado
```sql
SELECT 
  current_status,
  COUNT(*) as cantidad,
  ROUND(AVG(total_sales), 2) as promedio_ventas
FROM poc_thread_status
GROUP BY current_status
ORDER BY cantidad DESC;
```

---

## ✅ CHECKLIST DE EJECUCIÓN

Marcar cada paso al completarlo:

- [ ] Archivo 01 ejecutado sin errores
- [ ] Archivo 02 ejecutado sin errores  
- [ ] Archivo 03 ejecutado sin errores
- [ ] Query de validación muestra 5 tablas poc_*
- [ ] Query de triggers muestra 3 triggers activos
- [ ] Prueba rápida ejecutada exitosamente
- [ ] No hay errores en Supabase Dashboard → Database → Functions
- [ ] No hay errores en Supabase Dashboard → Database → Triggers

---

## 🎯 PRÓXIMO PASO

Una vez completado este checklist, continuar con:
**FASE 2: Backend API** - Implementar servicios y endpoints

Ver: `docs/superpowers/plans/2026-05-18-poc-eventos-implementacion.md`
