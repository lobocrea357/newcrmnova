-- ============================================
-- ARREGLAR TABLA CHATS
-- ============================================

-- 1. Verificar columnas existentes en la tabla chats
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chats'
ORDER BY ordinal_position;

-- 2. Agregar columna last_message_time si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'last_message_time'
    ) THEN
        ALTER TABLE chats ADD COLUMN last_message_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna last_message_time agregada a la tabla chats';
    ELSE
        RAISE NOTICE 'La columna last_message_time ya existe en la tabla chats';
    END IF;
END $$;

-- 3. Actualizar last_message_time con el timestamp del último mensaje
UPDATE chats ch
SET last_message_time = (
    SELECT MAX(m.timestamp)
    FROM messages m
    WHERE m.chat_id = ch.id
)
WHERE EXISTS (
    SELECT 1 FROM messages WHERE chat_id = ch.id
);

-- 4. Verificar que se actualizó correctamente
SELECT 
    id,
    chat_id,
    bot_id,
    last_message_time,
    created_at,
    (SELECT COUNT(*) FROM messages WHERE chat_id = chats.id) as message_count
FROM chats
ORDER BY last_message_time DESC NULLS LAST;
