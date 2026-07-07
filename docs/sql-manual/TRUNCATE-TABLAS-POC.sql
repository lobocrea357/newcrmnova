-- ============================================================================
-- TRUNCATE TABLAS POC - LIMPIEZA COMPLETA
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- ⚠️ ADVERTENCIA: Este script ELIMINARÁ TODOS LOS DATOS de las tablas POC
-- Los datos NO se pueden recuperar después de ejecutar esto
-- Asegúrate de hacer backup si necesitas los datos

-- ============================================================================
-- OPCIÓN 1: TRUNCATE COMPLETO (Elimina todo y reinicia secuencias)
-- ============================================================================

-- Desactivar temporalmente los triggers para evitar problemas
SET session_replication_role = 'replica';

-- Truncate en orden correcto (de hijos a padres para respetar FK)
TRUNCATE TABLE public.poc_thread_events CASCADE;
TRUNCATE TABLE public.poc_thread_status CASCADE;
TRUNCATE TABLE public.poc_thread_metrics CASCADE;
TRUNCATE TABLE public.poc_thread_chats CASCADE;
TRUNCATE TABLE public.poc_customer_threads CASCADE;

-- Reactivar triggers
SET session_replication_role = 'origin';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ TRUNCATE completado exitosamente';
    RAISE NOTICE '✅ Todas las tablas POC están vacías';
END $$;

-- ============================================================================
-- OPCIÓN 2: TRUNCATE SELECTIVO (Solo tablas específicas)
-- ============================================================================

-- Si solo quieres limpiar eventos y estados (mantener threads):
-- TRUNCATE TABLE public.poc_thread_events CASCADE;
-- TRUNCATE TABLE public.poc_thread_status CASCADE;

-- Si solo quieres limpiar métricas:
-- TRUNCATE TABLE public.poc_thread_metrics CASCADE;

-- ============================================================================
-- VERIFICAR QUE LAS TABLAS ESTÁN VACÍAS
-- ============================================================================

SELECT 
    'poc_customer_threads' AS table_name, 
    COUNT(*) AS row_count 
FROM poc_customer_threads
UNION ALL
SELECT 'poc_thread_chats', COUNT(*) FROM poc_thread_chats
UNION ALL
SELECT 'poc_thread_metrics', COUNT(*) FROM poc_thread_metrics
UNION ALL
SELECT 'poc_thread_events', COUNT(*) FROM poc_thread_events
UNION ALL
SELECT 'poc_thread_status', COUNT(*) FROM poc_thread_status;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================

/*
| table_name           | row_count |
| -------------------- | --------- |
| poc_customer_threads | 0         |
| poc_thread_chats     | 0         |
| poc_thread_metrics   | 0         |
| poc_thread_events    | 0         |
| poc_thread_status    | 0         |
*/

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================

/*
1. CASCADE: Elimina automáticamente datos de tablas dependientes
2. RESTART IDENTITY: Reinicia secuencias de IDs (no aplicable aquí porque usamos UUID)
3. Los triggers se desactivan temporalmente para evitar conflictos
4. Los foreign keys se respetan gracias a CASCADE
5. Esta operación NO se puede deshacer

ALTERNATIVA SEGURA (Si tienes dudas):
En lugar de TRUNCATE, puedes usar DELETE:

DELETE FROM poc_thread_events;
DELETE FROM poc_thread_status;
DELETE FROM poc_thread_metrics;
DELETE FROM poc_thread_chats;
DELETE FROM poc_customer_threads;

DELETE es más lento pero permite ROLLBACK si estás en una transacción.
*/
