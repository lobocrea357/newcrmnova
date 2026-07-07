-- ============================================================================
-- AGREGAR CONSTRAINTS FALTANTES A TABLAS POC
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR FOREIGN KEY: poc_thread_events → poc_customer_threads
-- ============================================================================

-- Verificar si ya existe el constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'poc_thread_events_thread_id_fkey'
        AND table_name = 'poc_thread_events'
    ) THEN
        ALTER TABLE public.poc_thread_events
        ADD CONSTRAINT poc_thread_events_thread_id_fkey
        FOREIGN KEY (thread_id) 
        REFERENCES public.poc_customer_threads(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key poc_thread_events_thread_id_fkey creado exitosamente';
    ELSE
        RAISE NOTICE 'Foreign key poc_thread_events_thread_id_fkey ya existe';
    END IF;
END $$;

-- ============================================================================
-- 2. AGREGAR FOREIGN KEY: poc_thread_status → poc_customer_threads
-- ============================================================================

-- Verificar si ya existe el constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'poc_thread_status_thread_id_fkey'
        AND table_name = 'poc_thread_status'
    ) THEN
        ALTER TABLE public.poc_thread_status
        ADD CONSTRAINT poc_thread_status_thread_id_fkey
        FOREIGN KEY (thread_id) 
        REFERENCES public.poc_customer_threads(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key poc_thread_status_thread_id_fkey creado exitosamente';
    ELSE
        RAISE NOTICE 'Foreign key poc_thread_status_thread_id_fkey ya existe';
    END IF;
END $$;

-- ============================================================================
-- 3. CREAR ÍNDICES PARA MEJORAR PERFORMANCE
-- ============================================================================

-- Índice en poc_thread_events.thread_id (para búsquedas por thread)
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_thread_id 
ON public.poc_thread_events(thread_id);

-- Índice en poc_thread_events.event_type (para filtros por tipo)
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_event_type 
ON public.poc_thread_events(event_type);

-- Índice en poc_thread_events.occurred_at (para ordenamiento cronológico)
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_occurred_at 
ON public.poc_thread_events(occurred_at DESC);

-- Índice en poc_thread_events.is_milestone (para filtrar hitos)
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_is_milestone 
ON public.poc_thread_events(is_milestone) 
WHERE is_milestone = true;

-- Índice en poc_thread_status.current_status (para filtros por estado)
CREATE INDEX IF NOT EXISTS idx_poc_thread_status_current_status 
ON public.poc_thread_status(current_status);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_thread_type 
ON public.poc_thread_events(thread_id, event_type);

-- ============================================================================
-- 4. VERIFICAR CONSTRAINTS CREADOS
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
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.table_name IN ('poc_thread_events', 'poc_thread_status')
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY 
    tc.table_name;

-- ============================================================================
-- 5. VERIFICAR ÍNDICES CREADOS
-- ============================================================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename IN ('poc_thread_events', 'poc_thread_status')
    AND schemaname = 'public'
ORDER BY 
    tablename, indexname;

-- ============================================================================
-- RESULTADOS ESPERADOS:
-- ============================================================================

/*
FOREIGN KEYS:
✅ poc_thread_events.thread_id → poc_customer_threads.id (ON DELETE CASCADE)
✅ poc_thread_status.thread_id → poc_customer_threads.id (ON DELETE CASCADE)

ÍNDICES:
✅ idx_poc_thread_events_thread_id
✅ idx_poc_thread_events_event_type
✅ idx_poc_thread_events_occurred_at
✅ idx_poc_thread_events_is_milestone
✅ idx_poc_thread_events_thread_type
✅ idx_poc_thread_status_current_status

BENEFICIOS:
1. Integridad referencial garantizada (no se pueden crear eventos/estados para threads inexistentes)
2. Cascada de eliminación (si se elimina un thread, se eliminan sus eventos y estado)
3. Performance mejorada en queries comunes
4. Base de datos lista para implementar el plan de eventos
*/
