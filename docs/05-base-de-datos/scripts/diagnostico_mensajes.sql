-- ============================================
-- DIAGNÓSTICO COMPLETO - MENSAJES Y CONTACTOS
-- ============================================
-- Ejecuta estas consultas EN ORDEN para diagnosticar problemas

-- ============================================
-- CONSULTA 1: RESUMEN GENERAL POR BOT (OPTIMIZADO)
-- ============================================
-- Esta es la MÁS IMPORTANTE - ejecuta esta primero
SELECT 
  b.session_name as bot,
  b.id as bot_id,
  (SELECT COUNT(*) FROM chats WHERE bot_id = b.id) as total_chats,
  (SELECT COUNT(*) FROM contacts WHERE bot_id = b.id) as total_contacts,
  (SELECT COUNT(*) FROM messages m 
   INNER JOIN chats c ON c.id = m.chat_id 
   WHERE c.bot_id = b.id) as total_messages,
  (SELECT COUNT(*) FROM messages m 
   INNER JOIN chats c ON c.id = m.chat_id 
   WHERE c.bot_id = b.id AND m.from_me = true) as messages_outgoing,
  (SELECT COUNT(*) FROM messages m 
   INNER JOIN chats c ON c.id = m.chat_id 
   WHERE c.bot_id = b.id AND m.from_me = false) as messages_incoming,
  (SELECT COUNT(*) FROM contacts 
   WHERE bot_id = b.id AND (name IS NULL OR name = '')) as contacts_sin_nombre
FROM bots b
ORDER BY (SELECT COUNT(*) FROM messages m 
          INNER JOIN chats c ON c.id = m.chat_id 
          WHERE c.bot_id = b.id) DESC;

-- ============================================
-- CONSULTA 2: CHATS CON PROBLEMAS DE NOMBRES
-- ============================================
-- Identifica chats donde falta el nombre del contacto
SELECT 
  c.id as chat_id,
  c.chat_id as whatsapp_id,
  c.name as chat_name,
  c.contact_id,
  co.name as contact_name,
  co.phone_number,
  COUNT(m.id) as total_messages,
  b.session_name as bot
FROM chats c
LEFT JOIN contacts co ON co.id = c.contact_id
LEFT JOIN messages m ON m.chat_id = c.id
LEFT JOIN bots b ON b.id = c.bot_id
WHERE co.name IS NULL OR co.name = '' OR c.name IS NULL OR c.name = ''
GROUP BY c.id, c.chat_id, c.name, c.contact_id, co.name, co.phone_number, b.session_name
HAVING COUNT(m.id) > 0
ORDER BY total_messages DESC
LIMIT 20;

-- ============================================
-- CONSULTA 3: MENSAJES HUÉRFANOS
-- ============================================
-- Mensajes que no tienen chat o contacto asociado
SELECT 
  m.id,
  m.message_id,
  m.chat_id,
  m.contact_id,
  m.from_me,
  LEFT(m.body, 50) as message_preview,
  m.timestamp,
  CASE 
    WHEN c.id IS NULL THEN 'Chat no existe'
    WHEN co.id IS NULL THEN 'Contacto no existe'
    ELSE 'OK'
  END as problema
FROM messages m
LEFT JOIN chats c ON c.id = m.chat_id
LEFT JOIN contacts co ON co.id = m.contact_id
WHERE c.id IS NULL OR co.id IS NULL
ORDER BY m.created_at DESC
LIMIT 50;

-- ============================================
-- CONSULTA 4: DISTRIBUCIÓN DE MENSAJES POR CHAT
-- ============================================
-- Ver cuántos mensajes tiene cada chat y su distribución
SELECT 
  c.id as chat_id,
  c.name as chat_name,
  co.name as contact_name,
  co.phone_number,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.from_me = true THEN 1 END) as outgoing,
  COUNT(CASE WHEN m.from_me = false THEN 1 END) as incoming,
  MIN(m.timestamp) as first_message,
  MAX(m.timestamp) as last_message,
  b.session_name as bot
FROM chats c
LEFT JOIN contacts co ON co.id = c.contact_id
LEFT JOIN messages m ON m.chat_id = c.id
LEFT JOIN bots b ON b.id = c.bot_id
GROUP BY c.id, c.name, co.name, co.phone_number, b.session_name
HAVING COUNT(m.id) > 0
ORDER BY total_messages DESC
LIMIT 30;

-- ============================================
-- CONSULTA 5: CONTACTOS SIN NOMBRE
-- ============================================
-- Contactos que tienen mensajes pero no tienen nombre
SELECT 
  co.id,
  co.phone_number,
  co.name,
  co.push_name,
  COUNT(DISTINCT c.id) as chats_count,
  COUNT(m.id) as messages_count,
  b.session_name as bot
FROM contacts co
LEFT JOIN chats c ON c.contact_id = co.id
LEFT JOIN messages m ON m.contact_id = co.id
LEFT JOIN bots b ON b.id = co.bot_id
WHERE (co.name IS NULL OR co.name = '') 
  AND (co.push_name IS NULL OR co.push_name = '')
GROUP BY co.id, co.phone_number, co.name, co.push_name, b.session_name
HAVING COUNT(m.id) > 0
ORDER BY messages_count DESC
LIMIT 20;

-- ============================================
-- CONSULTA 6: VERIFICAR RELACIONES ROTAS
-- ============================================
-- Chats que tienen contact_id NULL pero tienen mensajes
SELECT 
  c.id as chat_id,
  c.chat_id as whatsapp_id,
  c.name as chat_name,
  c.contact_id,
  c.contact_number,
  COUNT(m.id) as messages_count,
  b.session_name as bot
FROM chats c
LEFT JOIN messages m ON m.chat_id = c.id
LEFT JOIN bots b ON b.id = c.bot_id
WHERE c.contact_id IS NULL
GROUP BY c.id, c.chat_id, c.name, c.contact_id, c.contact_number, b.session_name
HAVING COUNT(m.id) > 0
ORDER BY messages_count DESC;

-- ============================================
-- CONSULTA 7: ÚLTIMOS 100 MENSAJES (TODOS LOS CHATS)
-- ============================================
-- Ver los mensajes más recientes para verificar que se están guardando
SELECT 
  m.id,
  m.from_me,
  CASE WHEN m.from_me THEN 'Bot →' ELSE '← Cliente' END as direction,
  c.name as chat_name,
  co.name as contact_name,
  co.phone_number,
  LEFT(m.body, 60) as message,
  m.timestamp,
  b.session_name as bot
FROM messages m
LEFT JOIN chats c ON c.id = m.chat_id
LEFT JOIN contacts co ON co.id = m.contact_id
LEFT JOIN bots b ON b.id = m.bot_id
ORDER BY m.timestamp DESC
LIMIT 100;

-- ============================================
-- CONSULTA 8: PARA UN CHAT ESPECÍFICO
-- ============================================
-- INSTRUCCIONES:
-- 1. Ejecuta primero CONSULTA 4 para obtener chat_id
-- 2. Reemplaza 'PEGAR_CHAT_ID_AQUI' con el UUID del chat
-- 3. Ejecuta esta consulta para ver TODOS los mensajes de ese chat

SELECT 
  m.id,
  m.message_id,
  m.from_me,
  CASE 
    WHEN m.from_me THEN '🤖 Bot (Saliente)'
    ELSE '👤 Cliente (Entrante)'
  END as tipo,
  m.from_number,
  m.to_number,
  m.body,
  m.type,
  m.timestamp,
  m.created_at,
  c.name as chat_name,
  co.name as contact_name,
  co.phone_number
FROM messages m
LEFT JOIN chats c ON c.id = m.chat_id
LEFT JOIN contacts co ON co.id = m.contact_id
WHERE m.chat_id = 'PEGAR_CHAT_ID_AQUI'
ORDER BY m.timestamp ASC;

-- ============================================
-- CONSULTA 9: ESTADÍSTICAS DE INTEGRIDAD
-- ============================================
-- Resumen de problemas de integridad de datos
SELECT 
  'Mensajes sin chat' as problema,
  COUNT(*) as cantidad
FROM messages m
LEFT JOIN chats c ON c.id = m.chat_id
WHERE c.id IS NULL

UNION ALL

SELECT 
  'Mensajes sin contacto' as problema,
  COUNT(*) as cantidad
FROM messages m
LEFT JOIN contacts co ON co.id = m.contact_id
WHERE co.id IS NULL

UNION ALL

SELECT 
  'Chats sin contacto' as problema,
  COUNT(*) as cantidad
FROM chats c
WHERE c.contact_id IS NULL

UNION ALL

SELECT 
  'Contactos sin nombre' as problema,
  COUNT(*) as cantidad
FROM contacts co
WHERE (co.name IS NULL OR co.name = '') 
  AND (co.push_name IS NULL OR co.push_name = '')

UNION ALL

SELECT 
  'Chats sin nombre' as problema,
  COUNT(*) as cantidad
FROM chats c
WHERE c.name IS NULL OR c.name = '';

