-- Script de diagnóstico para verificar mensajes
-- Ejecuta esto en el Editor SQL de Supabase

-- 1. Ver todos los mensajes de un chat específico
-- (Reemplaza 'TU_CHAT_ID' con el ID del chat que estás viendo)
SELECT 
  id,
  from_me,
  from_number,
  to_number,
  body,
  type,
  timestamp,
  created_at
FROM messages
WHERE chat_id = 'TU_CHAT_ID'
ORDER BY timestamp ASC;

-- 2. Contar mensajes por tipo (entrantes vs salientes)
SELECT 
  from_me,
  COUNT(*) as total
FROM messages
WHERE chat_id = 'TU_CHAT_ID'
GROUP BY from_me;

-- 3. Ver los últimos 10 mensajes de CUALQUIER chat para verificar
SELECT 
  chat_id,
  from_me,
  body,
  timestamp
FROM messages
ORDER BY created_at DESC
LIMIT 10;
