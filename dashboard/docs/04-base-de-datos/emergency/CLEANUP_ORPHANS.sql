-- Limpiar Análisis Huérfanos (sin evaluaciones)
-- Ejecutar en Supabase SQL Editor

-- Mostrar análisis que se eliminarán
SELECT 
  pa.id,
  pa.analysis_name,
  pa.total_conversations_analyzed,
  pa.created_at::date as fecha
FROM performance_analyses pa
WHERE NOT EXISTS (
  SELECT 1 FROM conversation_evaluations ce 
  WHERE ce.performance_analysis_id = pa.id
);

-- Eliminar análisis huérfanos
DELETE FROM performance_analyses
WHERE id IN (
  SELECT pa.id
  FROM performance_analyses pa
  WHERE NOT EXISTS (
    SELECT 1 FROM conversation_evaluations ce 
    WHERE ce.performance_analysis_id = pa.id
  )
);

-- Verificar que se eliminaron
SELECT 
  'Análisis restantes' as metric,
  COUNT(*)::text as value
FROM performance_analyses;
