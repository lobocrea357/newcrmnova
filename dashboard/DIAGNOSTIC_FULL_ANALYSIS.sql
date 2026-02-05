-- Diagnóstico Completo del Sistema de Análisis
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR INTEGRIDAD DE ANÁLISIS
-- ============================================

SELECT 
  pa.id,
  pa.analysis_name,
  pa.bot_id,
  pa.total_conversations,
  pa.status,
  pa.created_at,
  COUNT(ce.id) as evaluations_saved,
  CASE 
    WHEN COUNT(ce.id) = 0 THEN '❌ SIN EVALUACIONES'
    WHEN COUNT(ce.id) < pa.total_conversations THEN '⚠️ INCOMPLETO'
    WHEN COUNT(ce.id) = pa.total_conversations THEN '✅ COMPLETO'
    ELSE '⚠️ MÁS EVALUACIONES QUE CONVERSACIONES'
  END as integrity_status,
  CASE
    WHEN COUNT(ce.id) = 0 THEN 'CRÍTICO: No se guardaron evaluaciones'
    WHEN COUNT(ce.id) < pa.total_conversations THEN 'ADVERTENCIA: Faltan ' || (pa.total_conversations - COUNT(ce.id))::text || ' evaluaciones'
    ELSE 'OK'
  END as diagnostic
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pa.id
ORDER BY pa.created_at DESC
LIMIT 20;

-- ============================================
-- 2. ANÁLISIS SIN EVALUACIONES (HUÉRFANOS)
-- ============================================

SELECT 
  pa.id,
  pa.analysis_name,
  pa.total_conversations,
  pa.created_at,
  '❌ ANÁLISIS HUÉRFANO - ELIMINAR' as action_needed
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
WHERE ce.id IS NULL
ORDER BY pa.created_at DESC;

-- ============================================
-- 3. REPORTES SIN EVALUACIONES
-- ============================================

SELECT 
  pr.id as report_id,
  pr.analysis_id,
  pa.analysis_name,
  pr.status as report_status,
  COUNT(ce.id) as evaluations_count,
  CASE
    WHEN COUNT(ce.id) = 0 THEN '❌ REPORTE INVÁLIDO - NO HAY EVALUACIONES'
    ELSE '✅ REPORTE VÁLIDO'
  END as report_validity
FROM performance_reports pr
JOIN performance_analyses pa ON pa.id = pr.analysis_id
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pr.id, pr.analysis_id, pa.analysis_name, pr.status
ORDER BY pr.created_at DESC;

-- ============================================
-- 4. ESTADÍSTICAS GENERALES
-- ============================================

SELECT 
  'Total Análisis' as metric,
  COUNT(*)::text as value
FROM performance_analyses

UNION ALL

SELECT 
  'Análisis con Evaluaciones',
  COUNT(DISTINCT pa.id)::text
FROM performance_analyses pa
JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id

UNION ALL

SELECT 
  'Análisis SIN Evaluaciones (HUÉRFANOS)',
  COUNT(pa.id)::text
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
WHERE ce.id IS NULL

UNION ALL

SELECT 
  'Total Evaluaciones',
  COUNT(*)::text
FROM conversation_evaluations

UNION ALL

SELECT 
  'Total Reportes',
  COUNT(*)::text
FROM performance_reports;

-- ============================================
-- 5. ÚLTIMAS 5 EVALUACIONES GUARDADAS
-- ============================================

SELECT 
  ce.id,
  ce.performance_analysis_id,
  ce.chat_id,
  ce.score,
  ce.percentage,
  ce.generated_by,
  ce.created_at
FROM conversation_evaluations ce
ORDER BY ce.created_at DESC
LIMIT 5;

-- ============================================
-- 6. VERIFICAR PERMISOS RLS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('performance_analyses', 'conversation_evaluations', 'performance_reports')
ORDER BY tablename, policyname;
