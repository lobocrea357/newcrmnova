-- ============================================
-- DIAGNÓSTICO RÁPIDO: Mensajes Salientes
-- ============================================

-- CONSULTA 1: Verificar UN chat específico (MÁS RÁPIDA)
-- Reemplaza 'TU_CHAT_ID' con el ID del chat que estás viendo
SELECT 
  from_me,
  COUNT(*) as total
FROM messages
WHERE chat_id = 'TU_CHAT_ID'
GROUP BY from_me;

-- CONSULTA 2: Ver últimos 20 mensajes de ese chat
SELECT 
  from_me,
  CASE 
    WHEN from_me = true THEN '📤 BOT'
    ELSE '📨 CLIENTE'
  END as tipo,
  LEFT(body, 80) as mensaje,
  timestamp
FROM messages
WHERE chat_id = 'TU_CHAT_ID'
ORDER BY timestamp DESC
LIMIT 20;

-- CONSULTA 3: Conteo simple de mensajes por tipo
SELECT 
  from_me,
  COUNT(*) as total_messages
FROM messages
GROUP BY from_me;

-- CONSULTA 4: Chats que NO tienen mensajes salientes (LIMITADO)
SELECT 
  c.id as chat_id,
  c.name,
  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND from_me = false) as entrantes,
  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND from_me = true) as salientes
FROM chats c
WHERE EXISTS (SELECT 1 FROM messages WHERE chat_id = c.id)
ORDER BY (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) DESC
LIMIT 50;

-- CONSULTA 5: Estadísticas por bot (SIMPLE)
SELECT 
  b.session_name,
  (SELECT COUNT(*) FROM messages m 
   JOIN chats c ON c.id = m.chat_id 
   WHERE c.bot_id = b.id AND m.from_me = true) as mensajes_salientes,
  (SELECT COUNT(*) FROM messages m 
   JOIN chats c ON c.id = m.chat_id 
   WHERE c.bot_id = b.id AND m.from_me = false) as mensajes_entrantes
FROM bots b
LIMIT 10;
