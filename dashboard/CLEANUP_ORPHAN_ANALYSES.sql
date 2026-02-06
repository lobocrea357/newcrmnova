-- ============================================
-- LIMPIAR ANÁLISIS SIN EVALUACIONES (HUÉRFANOS)
-- ============================================

-- 1. Identificar análisis sin evaluaciones
SELECT 
    pa.id,
    pa.analysis_name,
    pa.created_at,
    pa.total_conversations_analyzed,
    pa.status,
    COUNT(ce.id) as evaluations_count
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pa.id, pa.analysis_name, pa.created_at, pa.total_conversations_analyzed, pa.status
HAVING COUNT(ce.id) = 0
ORDER BY pa.created_at DESC;

-- 2. Ver detalles de análisis huérfanos
SELECT 
    pa.id,
    pa.analysis_name,
    pa.bot_id,
    b.session_name as bot_name,
    pa.total_conversations_analyzed,
    pa.average_score,
    pa.average_percentage,
    pa.status,
    pa.created_at
FROM performance_analyses pa
LEFT JOIN bots b ON b.id = pa.bot_id
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
WHERE ce.id IS NULL
ORDER BY pa.created_at DESC;

-- 3. OPCIONAL: Eliminar análisis huérfanos (sin evaluaciones)
-- ⚠️ CUIDADO: Esto eliminará permanentemente los análisis sin evaluaciones
-- Descomenta las siguientes líneas solo si estás seguro

/*
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Primero eliminar reportes asociados
    WITH orphan_analyses AS (
        SELECT pa.id
        FROM performance_analyses pa
        LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
        WHERE ce.id IS NULL
    )
    DELETE FROM performance_reports pr
    WHERE pr.performance_analysis_id IN (SELECT id FROM orphan_analyses);
    
    -- Luego eliminar análisis huérfanos
    WITH orphan_analyses AS (
        SELECT pa.id
        FROM performance_analyses pa
        LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
        WHERE ce.id IS NULL
    )
    DELETE FROM performance_analyses
    WHERE id IN (SELECT id FROM orphan_analyses);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Eliminados % análisis huérfanos', deleted_count;
END $$;
*/

-- 4. Ver análisis CON evaluaciones (los buenos)
SELECT 
    pa.id,
    pa.analysis_name,
    b.session_name as bot_name,
    pa.total_conversations_analyzed,
    COUNT(ce.id) as evaluations_count,
    pa.average_percentage,
    pa.status,
    pa.created_at
FROM performance_analyses pa
LEFT JOIN bots b ON b.id = pa.bot_id
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pa.id, pa.analysis_name, b.session_name, pa.total_conversations_analyzed, pa.average_percentage, pa.status, pa.created_at
HAVING COUNT(ce.id) > 0
ORDER BY pa.created_at DESC
LIMIT 10;

-- 5. Estadísticas generales
SELECT 
    COUNT(DISTINCT pa.id) as total_analyses,
    COUNT(DISTINCT CASE WHEN ce.id IS NOT NULL THEN pa.id END) as analyses_with_evaluations,
    COUNT(DISTINCT CASE WHEN ce.id IS NULL THEN pa.id END) as orphan_analyses,
    COUNT(ce.id) as total_evaluations
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id;
