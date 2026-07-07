-- ============================================================================
-- VERIFICACIÓN DE ESTRUCTURA POC
-- Ejecutar en Supabase SQL Editor para verificar estado actual
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR FOREIGN KEYS (Constraints de integridad referencial)
-- ============================================================================

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.table_schema = 'public'
    AND tc.table_name LIKE 'poc_%'
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY 
    tc.table_name, tc.constraint_name;

-- ============================================================================
-- 2. VERIFICAR TRIGGERS EN TABLAS POC
-- ============================================================================

SELECT 
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS trigger_event,
    action_timing AS trigger_timing,
    action_statement AS trigger_action
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'public'
    AND event_object_table LIKE 'poc_%'
ORDER BY 
    event_object_table, trigger_name;

-- ============================================================================
-- 3. VERIFICAR FUNCIONES RELACIONADAS CON POC
-- ============================================================================

SELECT 
    routine_name AS function_name,
    routine_type AS type,
    data_type AS return_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name LIKE '%poc%'
ORDER BY 
    routine_name;

-- ============================================================================
-- 4. VERIFICAR ÍNDICES EN TABLAS POC
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND tablename LIKE 'poc_%'
ORDER BY 
    tablename, indexname;

-- ============================================================================
-- 5. VERIFICAR ESTRUCTURA COMPLETA DE TABLAS POC
-- ============================================================================

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name LIKE 'poc_%'
ORDER BY 
    table_name, ordinal_position;

-- ============================================================================
-- 6. VERIFICAR CHECK CONSTRAINTS (Validaciones)
-- ============================================================================

SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
WHERE 
    tc.table_schema = 'public'
    AND tc.table_name LIKE 'poc_%'
    AND tc.constraint_type = 'CHECK'
ORDER BY 
    tc.table_name, tc.constraint_name;

-- ============================================================================
-- 7. VERIFICAR DATOS EXISTENTES EN TABLAS POC
-- ============================================================================

-- Contar registros en cada tabla
SELECT 'poc_customer_threads' AS table_name, COUNT(*) AS row_count FROM poc_customer_threads
UNION ALL
SELECT 'poc_thread_chats', COUNT(*) FROM poc_thread_chats
UNION ALL
SELECT 'poc_thread_metrics', COUNT(*) FROM poc_thread_metrics
UNION ALL
SELECT 'poc_thread_events', COUNT(*) FROM poc_thread_events
UNION ALL
SELECT 'poc_thread_status', COUNT(*) FROM poc_thread_status;

-- ============================================================================
-- 8. VERIFICAR TRIGGERS EN TABLA VUELOS (Para detección automática de ventas)
-- ============================================================================

SELECT 
    trigger_name,
    event_manipulation AS trigger_event,
    action_timing AS trigger_timing,
    action_statement AS trigger_action
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'public'
    AND event_object_table = 'vuelos'
    AND trigger_name LIKE '%poc%'
ORDER BY 
    trigger_name;

-- ============================================================================
-- RESULTADOS ESPERADOS SI TODO ESTÁ CORRECTO:
-- ============================================================================

/*
1. FOREIGN KEYS esperados:
   - poc_thread_chats.thread_id → poc_customer_threads.id ✅
   - poc_thread_metrics.thread_id → poc_customer_threads.id ✅
   - poc_thread_events.thread_id → poc_customer_threads.id ❓ (verificar)
   - poc_thread_status.thread_id → poc_customer_threads.id ❓ (verificar)

2. TRIGGERS esperados (si se implementó el plan de eventos):
   - trigger_poc_detect_sale en tabla vuelos ❓
   - trigger_poc_update_status en tabla poc_thread_events ❓

3. FUNCIONES esperadas:
   - poc_detect_sale_from_vuelo() ❓
   - poc_update_thread_status_from_event() ❓

4. ÍNDICES esperados:
   - Índice en poc_thread_events.thread_id
   - Índice en poc_thread_events.event_type
   - Índice en poc_thread_status.thread_id
   - Índice en poc_thread_status.current_status
*/
