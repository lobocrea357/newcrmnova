-- ============================================
-- VERIFICAR DATOS EN LAS TABLAS
-- ============================================

-- 1. Ver todos los bots
SELECT 
    id,
    session_name,
    phone_number,
    status,
    worker_id
FROM bots;

-- 2. Ver todos los chats
SELECT 
    id,
    bot_id,
    chat_id,
    name,
    is_group,
    last_message_time,
    contact_id
FROM chats
ORDER BY last_message_time DESC;

-- 3. Ver conteo de chats por bot
SELECT 
    b.session_name,
    b.id as bot_id,
    COUNT(c.id) as total_chats
FROM bots b
LEFT JOIN chats c ON b.id = c.bot_id
GROUP BY b.id, b.session_name;

-- 4. Ver mensajes por chat
SELECT 
    ch.chat_id,
    ch.name as chat_name,
    COUNT(m.id) as total_messages
FROM chats ch
LEFT JOIN messages m ON ch.id = m.chat_id
GROUP BY ch.id, ch.chat_id, ch.name
ORDER BY total_messages DESC;

-- 5. Ver detalles completos de chats con contactos
SELECT 
    ch.id as chat_id,
    ch.chat_id as whatsapp_id,
    ch.name as chat_name,
    ch.is_group,
    ch.last_message_time,
    b.session_name as bot_name,
    c.name as contact_name,
    c.phone_number as contact_phone,
    (SELECT COUNT(*) FROM messages WHERE chat_id = ch.id) as message_count
FROM chats ch
LEFT JOIN bots b ON ch.bot_id = b.id
LEFT JOIN contacts c ON ch.contact_id = c.id
ORDER BY ch.last_message_time DESC;
