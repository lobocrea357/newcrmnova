-- ============================================
-- ARREGLAR chat_id EN LA TABLA CHATS
-- ============================================

-- 1. Ver los mensajes y sus from/to para entender qué chat_id deberían tener
SELECT 
    m.chat_id as message_chat_id,
    m.from_number,
    m.to_number,
    m.from_me,
    COUNT(*) as message_count
FROM messages m
GROUP BY m.chat_id, m.from_number, m.to_number, m.from_me
ORDER BY message_count DESC;

-- 2. Actualizar chat_id en la tabla chats basándonos en los mensajes
-- El chat_id debería ser el número del contacto (from_number cuando from_me=false, to_number cuando from_me=true)
UPDATE chats ch
SET chat_id = COALESCE(
    (
        SELECT CASE 
            WHEN m.from_me = false THEN m.from_number
            ELSE m.to_number
        END
        FROM messages m
        WHERE m.chat_id = ch.id
        ORDER BY m.timestamp DESC
        LIMIT 1
    ),
    ch.id::text  -- Si no hay mensajes, usar el UUID como fallback
)
WHERE ch.chat_id IS NULL;

-- 3. Verificar que se actualizó correctamente
SELECT 
    id,
    chat_id,
    bot_id,
    last_message_time,
    (SELECT COUNT(*) FROM messages WHERE chat_id = chats.id) as message_count
FROM chats
ORDER BY last_message_time DESC;

-- 4. Ver los chats con sus contactos
SELECT 
    ch.id,
    ch.chat_id,
    ch.last_message_time,
    c.name as contact_name,
    c.phone_number as contact_phone,
    (SELECT COUNT(*) FROM messages WHERE chat_id = ch.id) as message_count
FROM chats ch
LEFT JOIN contacts c ON ch.contact_id = c.id
ORDER BY ch.last_message_time DESC;
