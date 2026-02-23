-- ============================================
-- AGREGAR CAMPO report_data A performance_reports
-- ============================================
-- Este campo almacenará el reporte generado por IA en formato JSONB
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna report_data (JSONB)
ALTER TABLE public.performance_reports 
ADD COLUMN IF NOT EXISTS report_data jsonb DEFAULT '{}'::jsonb;

-- 2. Agregar comentario explicativo
COMMENT ON COLUMN public.performance_reports.report_data IS 
'Datos del reporte generado por IA en formato JSON. Incluye executive_summary, strengths, improvements, action_plan y metrics.';

-- 3. Verificar que se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'performance_reports' 
AND column_name = 'report_data';

-- EJEMPLO DE ESTRUCTURA DE report_data:
-- {
--   "executive_summary": "Resumen ejecutivo del rendimiento...",
--   "strengths": [
--     {"area": "Tiempo de respuesta", "description": "Excelente rapidez..."}
--   ],
--   "improvements": [
--     {"area": "Seguimiento", "recommendation": "Implementar recordatorios..."}
--   ],
--   "action_plan": [
--     {"step": "Capacitación", "priority": "alta", "description": "..."}
--   ],
--   "metrics": {
--     "total_evaluations": 25,
--     "avg_score": 8.5,
--     "parameters": {...}
--   },
--   "generated_at": "2026-01-26T12:00:00Z"
-- }
