-- ============================================
-- VERIFICAR ESTADO ACTUAL DESPUÉS DE LIMPIEZA
-- ============================================

-- 1. Contar registros actuales
SELECT 
    'performance_analyses' as tabla,
    COUNT(*) as total
FROM performance_analyses
UNION ALL
SELECT 
    'conversation_evaluations' as tabla,
    COUNT(*) as total
FROM conversation_evaluations
UNION ALL
SELECT 
    'performance_reports' as tabla,
    COUNT(*) as total
FROM performance_reports;

-- 2. Ver últimos análisis creados
SELECT 
    pa.id,
    pa.analysis_name,
    pa.total_conversations_analyzed,
    COUNT(ce.id) as evaluations_count,
    pa.average_percentage,
    pa.status,
    pa.created_at
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pa.id, pa.analysis_name, pa.total_conversations_analyzed, pa.average_percentage, pa.status, pa.created_at
ORDER BY pa.created_at DESC
LIMIT 5;

-- 3. Ver si hay análisis con evaluaciones
SELECT 
    CASE 
        WHEN COUNT(DISTINCT pa.id) = 0 THEN '❌ No hay análisis'
        WHEN COUNT(DISTINCT CASE WHEN ce.id IS NOT NULL THEN pa.id END) = 0 THEN '❌ Hay análisis pero SIN evaluaciones'
        ELSE '✅ Hay análisis CON evaluaciones'
    END as estado,
    COUNT(DISTINCT pa.id) as total_analisis,
    COUNT(DISTINCT CASE WHEN ce.id IS NOT NULL THEN pa.id END) as analisis_con_evaluaciones,
    COUNT(ce.id) as total_evaluaciones
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id;
