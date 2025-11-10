-- Verificar estructura de la tabla workers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workers'
ORDER BY ordinal_position;
