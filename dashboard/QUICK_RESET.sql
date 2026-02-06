-- ============================================
-- SCRIPT RÁPIDO: Limpiar TODO y empezar de cero
-- Ejecuta este script completo en Supabase SQL Editor
-- ============================================

-- Eliminar todo en orden correcto (respetando foreign keys)
DELETE FROM performance_reports;
DELETE FROM daily_sales_reports;
DELETE FROM conversation_evaluations;
DELETE FROM performance_analyses;

-- Verificar que todo se eliminó
SELECT 
    'performance_analyses' as tabla,
    COUNT(*) as registros
FROM performance_analyses
UNION ALL
SELECT 
    'conversation_evaluations' as tabla,
    COUNT(*) as registros
FROM conversation_evaluations
UNION ALL
SELECT 
    'performance_reports' as tabla,
    COUNT(*) as registros
FROM performance_reports
UNION ALL
SELECT 
    'daily_sales_reports' as tabla,
    COUNT(*) as registros
FROM daily_sales_reports;

-- Mensaje de confirmación
SELECT '✅ Base de datos limpia - Lista para nuevas pruebas' as status;
