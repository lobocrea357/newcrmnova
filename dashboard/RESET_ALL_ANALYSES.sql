-- ============================================
-- LIMPIAR TODOS LOS ANÁLISIS DE RENDIMIENTO
-- ⚠️ CUIDADO: Esto eliminará TODOS los análisis y evaluaciones
-- ============================================

-- 1. Ver qué se va a eliminar
SELECT 
    'performance_analyses' as tabla,
    COUNT(*) as registros_a_eliminar
FROM performance_analyses
UNION ALL
SELECT 
    'conversation_evaluations' as tabla,
    COUNT(*) as registros_a_eliminar
FROM conversation_evaluations
UNION ALL
SELECT 
    'performance_reports' as tabla,
    COUNT(*) as registros_a_eliminar
FROM performance_reports
UNION ALL
SELECT 
    'daily_sales_reports' as tabla,
    COUNT(*) as registros_a_eliminar
FROM daily_sales_reports;

-- 2. ELIMINAR TODO (descomenta para ejecutar)
-- ⚠️ ADVERTENCIA: Esta acción NO se puede deshacer

DO $$
DECLARE
    deleted_reports INTEGER;
    deleted_evaluations INTEGER;
    deleted_analyses INTEGER;
    deleted_daily_reports INTEGER;
BEGIN
    -- Paso 1: Eliminar reportes de rendimiento
    DELETE FROM performance_reports;
    GET DIAGNOSTICS deleted_reports = ROW_COUNT;
    RAISE NOTICE '✅ Eliminados % reportes de rendimiento', deleted_reports;
    
    -- Paso 2: Eliminar reportes diarios de ventas
    DELETE FROM daily_sales_reports;
    GET DIAGNOSTICS deleted_daily_reports = ROW_COUNT;
    RAISE NOTICE '✅ Eliminados % reportes diarios de ventas', deleted_daily_reports;
    
    -- Paso 3: Eliminar evaluaciones de conversaciones
    DELETE FROM conversation_evaluations;
    GET DIAGNOSTICS deleted_evaluations = ROW_COUNT;
    RAISE NOTICE '✅ Eliminadas % evaluaciones de conversaciones', deleted_evaluations;
    
    -- Paso 4: Eliminar análisis de rendimiento
    DELETE FROM performance_analyses;
    GET DIAGNOSTICS deleted_analyses = ROW_COUNT;
    RAISE NOTICE '✅ Eliminados % análisis de rendimiento', deleted_analyses;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 LIMPIEZA COMPLETADA';
    RAISE NOTICE '📊 Resumen:';
    RAISE NOTICE '   - Reportes eliminados: %', deleted_reports;
    RAISE NOTICE '   - Reportes diarios eliminados: %', deleted_daily_reports;
    RAISE NOTICE '   - Evaluaciones eliminadas: %', deleted_evaluations;
    RAISE NOTICE '   - Análisis eliminados: %', deleted_analyses;
    RAISE NOTICE '';
    RAISE NOTICE '✨ Base de datos lista para nuevas pruebas';
END $$;

-- 3. Verificar que todo se eliminó
SELECT 
    'performance_analyses' as tabla,
    COUNT(*) as registros_restantes
FROM performance_analyses
UNION ALL
SELECT 
    'conversation_evaluations' as tabla,
    COUNT(*) as registros_restantes
FROM conversation_evaluations
UNION ALL
SELECT 
    'performance_reports' as tabla,
    COUNT(*) as registros_restantes
FROM performance_reports
UNION ALL
SELECT 
    'daily_sales_reports' as tabla,
    COUNT(*) as registros_restantes
FROM daily_sales_reports;

-- 4. Resetear secuencias (opcional, para IDs limpios)
-- Descomenta si quieres que los nuevos IDs empiecen desde 1
/*
ALTER SEQUENCE IF EXISTS performance_analyses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS conversation_evaluations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS performance_reports_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS daily_sales_reports_id_seq RESTART WITH 1;
*/

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASOS:';
    RAISE NOTICE '  1. Reinicia el servidor Next.js (Ctrl+C y npm run dev)';
    RAISE NOTICE '  2. Ve a /rendimiento/new';
    RAISE NOTICE '  3. Crea un nuevo análisis de prueba';
    RAISE NOTICE '  4. Verifica que se guarden las evaluaciones';
    RAISE NOTICE '  5. Genera el reporte';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sistema listo para pruebas frescas';
END $$;
