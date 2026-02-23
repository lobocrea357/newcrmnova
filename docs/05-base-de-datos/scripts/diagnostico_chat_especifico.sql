-- ============================================
-- DIAGNÓSTICO CHAT ESPECÍFICO
-- Chat ID: 02197aca-b4bb-4e4a-9325-572bfc237adb
-- ============================================

-- CONSULTA 1: Conteo de mensajes por tipo
SELECT 
  from_me,
  CASE 
    WHEN from_me = true THEN '📤 SALIENTE (BOT)'
    ELSE '📨 ENTRANTE (CLIENTE)'
  END as tipo,
  COUNT(*) as total
FROM messages
WHERE chat_id = '02197aca-b4bb-4e4a-9325-572bfc237adb'
GROUP BY from_me;

-- CONSULTA 2: Ver últimos 30 mensajes
SELECT 
  from_me,
  CASE 
    WHEN from_me = true THEN '📤 BOT'
    ELSE '📨 CLIENTE'
  END as tipo,
  LEFT(body, 100) as mensaje,
  timestamp,
  type as message_type
FROM messages
WHERE chat_id = '02197aca-b4bb-4e4a-9325-572bfc237adb'
ORDER BY timestamp DESC
LIMIT 30;

-- CONSULTA 3: Ver TODOS los mensajes salientes de este chat
SELECT 
  id,
  body,
  timestamp,
  type,
  metadata
FROM messages
WHERE chat_id = '02197aca-b4bb-4e4a-9325-572bfc237adb'
  AND from_me = true
ORDER BY timestamp DESC;

-- CONSULTA 4: Información del chat
SELECT 
  c.id,
  c.chat_id as whatsapp_id,
  c.name as chat_name,
  c.contact_number,
  co.name as contact_name,
  co.phone_number,
  b.session_name as bot
FROM chats c
LEFT JOIN contacts co ON co.id = c.contact_id
LEFT JOIN bots b ON b.id = c.bot_id
WHERE c.id = '02197aca-b4bb-4e4a-9325-572bfc237adb';
