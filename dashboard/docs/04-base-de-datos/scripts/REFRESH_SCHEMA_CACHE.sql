-- ============================================
-- REFRESCAR SCHEMA CACHE DE POSTGREST
-- ============================================

-- Método 1: Notificar a PostgREST para recargar schema
NOTIFY pgrst, 'reload schema';

-- Método 2: Verificar que la tabla es visible
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'conversation_evaluations';

-- Método 3: Verificar columnas visibles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_evaluations'
ORDER BY ordinal_position;

-- Método 4: Probar acceso directo
SELECT COUNT(*) as total_rows
FROM conversation_evaluations;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Comando NOTIFY enviado a PostgREST';
    RAISE NOTICE '⏳ El cache debería actualizarse en 1-2 minutos';
    RAISE NOTICE '🔄 Si el error persiste, reinicia el servidor Next.js';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '  1. Espera 1-2 minutos';
    RAISE NOTICE '  2. Reinicia npm run dev (Ctrl+C y npm run dev)';
    RAISE NOTICE '  3. Prueba generar un análisis nuevamente';
END $$;
