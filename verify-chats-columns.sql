-- ============================================
-- VERIFICAR COLUMNAS DE LA TABLA CHATS
-- ============================================

-- Ver todas las columnas de la tabla chats
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chats'
ORDER BY ordinal_position;

-- Ver algunos registros de chats (si existen)
SELECT * FROM chats LIMIT 5;

-- Contar chats por bot
SELECT 
    bot_id,
    COUNT(*) as total_chats
FROM chats
GROUP BY bot_id;
