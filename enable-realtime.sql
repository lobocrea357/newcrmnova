-- ============================================
-- HABILITAR REALTIME EN SUPABASE
-- ============================================

-- 1. Habilitar Realtime en la tabla messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Verificar que está habilitado
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'messages';

-- 3. También habilitar en media_files (opcional, por si queremos escuchar cambios en multimedia)
ALTER PUBLICATION supabase_realtime ADD TABLE media_files;

-- 4. Verificar ambas tablas
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'media_files')
ORDER BY tablename;
