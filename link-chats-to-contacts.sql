-- ============================================
-- VINCULAR CHATS CON CONTACTOS
-- ============================================

-- 1. Crear contactos para los chats que no tienen contacto asociado
INSERT INTO contacts (bot_id, phone_number, name)
SELECT DISTINCT
    ch.bot_id,
    ch.chat_id,
    'Contacto ' || SUBSTRING(ch.chat_id, 1, 10) as name
FROM chats ch
WHERE ch.contact_id IS NULL
  AND ch.chat_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contacts c 
    WHERE c.bot_id = ch.bot_id 
    AND c.phone_number = ch.chat_id
  )
ON CONFLICT (bot_id, phone_number) DO NOTHING;

-- 2. Vincular los chats con sus contactos
UPDATE chats ch
SET contact_id = (
    SELECT c.id
    FROM contacts c
    WHERE c.bot_id = ch.bot_id
    AND c.phone_number = ch.chat_id
    LIMIT 1
)
WHERE ch.contact_id IS NULL
  AND ch.chat_id IS NOT NULL;

-- 3. Verificar que se vincularon correctamente
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

-- 4. Ver resumen de contactos creados
SELECT 
    bot_id,
    COUNT(*) as total_contacts
FROM contacts
GROUP BY bot_id;
