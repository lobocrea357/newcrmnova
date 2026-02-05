-- Diagnóstico SIMPLE y RÁPIDO del Sistema de Análisis
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. RESUMEN RÁPIDO
-- ============================================

SELECT 
  '📊 Total Análisis' as metric,
  COUNT(*)::text as value
FROM performance_analyses

UNION ALL

SELECT 
  '✅ Análisis con Evaluaciones',
  COUNT(DISTINCT ce.performance_analysis_id)::text
FROM conversation_evaluations ce

UNION ALL

SELECT 
  '❌ Análisis SIN Evaluaciones (HUÉRFANOS)',
  (SELECT COUNT(*) FROM performance_analyses pa 
   WHERE NOT EXISTS (
     SELECT 1 FROM conversation_evaluations ce 
     WHERE ce.performance_analysis_id = pa.id
   ))::text

UNION ALL

SELECT 
  '📝 Total Evaluaciones',
  COUNT(*)::text
FROM conversation_evaluations

UNION ALL

SELECT 
  '📄 Total Reportes',
  COUNT(*)::text
FROM performance_reports;

-- ============================================
-- 2. ÚLTIMOS 10 ANÁLISIS CON ESTADO
-- ============================================

SELECT 
  pa.id,
  pa.analysis_name,
  pa.bot_id,
  pa.total_conversations_analyzed as conversaciones,
  COUNT(ce.id) as evaluaciones_guardadas,
  CASE 
    WHEN COUNT(ce.id) = 0 THEN '❌ SIN EVALUACIONES'
    WHEN COUNT(ce.id) < pa.total_conversations_analyzed THEN '⚠️ INCOMPLETO'
    WHEN COUNT(ce.id) = pa.total_conversations_analyzed THEN '✅ COMPLETO'
    ELSE '⚠️ EXCESO'
  END as estado,
  pa.created_at::date as fecha
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pa.id
ORDER BY pa.created_at DESC
LIMIT 10;

-- ============================================
-- 3. ANÁLISIS HUÉRFANOS (PARA ELIMINAR)
-- ============================================

SELECT 
  pa.id,
  pa.analysis_name,
  pa.total_conversations_analyzed as conversaciones,
  pa.created_at::date as fecha,
  '❌ ELIMINAR - Sin evaluaciones' as accion
FROM performance_analyses pa
WHERE NOT EXISTS (
  SELECT 1 FROM conversation_evaluations ce 
  WHERE ce.performance_analysis_id = pa.id
)
ORDER BY pa.created_at DESC;
