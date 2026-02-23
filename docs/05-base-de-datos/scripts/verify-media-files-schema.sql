-- Verificar estructura de la tabla media_files
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'media_files'
ORDER BY ordinal_position;
