-- ============================================
-- SCRIPT DE REPARACIÓN: Relaciones Chats-Contactos
-- ============================================
-- Este script repara las relaciones rotas entre chats y contactos
-- actualizando el contact_id en chats que lo tienen NULL

-- IMPORTANTE: Ejecuta este script en el Editor SQL de Supabase

-- ============================================
-- PASO 1: VERIFICAR PROBLEMA (ANTES)
-- ============================================
-- Ver cuántos chats tienen contact_id NULL
SELECT 
  COUNT(*) as chats_sin_contacto,
  COUNT(CASE WHEN contact_id IS NOT NULL THEN 1 END) as chats_con_contacto
FROM chats;

-- ============================================
-- PASO 2: REPARAR RELACIONES
-- ============================================
-- Esta consulta actualiza contact_id en chats que:
-- 1. Tienen contact_id NULL
-- 2. Tienen un contact_number que coincide con un contacto existente

UPDATE chats c
SET 
  contact_id = co.id,
  updated_at = NOW()
FROM contacts co
WHERE c.contact_id IS NULL
  AND c.contact_number = co.phone_number
  AND c.bot_id = co.bot_id;

-- ============================================
-- PASO 3: ACTUALIZAR chat_id SI ES NULL
-- ============================================
-- Algunos chats pueden tener chat_id NULL
-- Lo construimos desde contact_number

UPDATE chats
SET 
  chat_id = contact_number || '@c.us',
  updated_at = NOW()
WHERE chat_id IS NULL 
  AND contact_number IS NOT NULL;

-- ============================================
-- PASO 4: ACTUALIZAR NOMBRE DEL CHAT
-- ============================================
-- Actualizar nombre del chat desde el contacto relacionado
-- Solo si el chat no tiene nombre

UPDATE chats c
SET 
  name = COALESCE(co.name, co.push_name, c.contact_number),
  updated_at = NOW()
FROM contacts co
WHERE c.contact_id = co.id
  AND (c.name IS NULL OR c.name = '');

-- ============================================
-- PASO 5: VERIFICAR RESULTADO (DESPUÉS)
-- ============================================
-- Ver cuántos chats se repararon
SELECT 
  COUNT(*) as total_chats,
  COUNT(CASE WHEN contact_id IS NULL THEN 1 END) as chats_sin_contacto,
  COUNT(CASE WHEN contact_id IS NOT NULL THEN 1 END) as chats_con_contacto,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as chats_sin_nombre
FROM chats;

-- ============================================
-- PASO 6: VER CHATS QUE AÚN NO SE PUDIERON REPARAR
-- ============================================
-- Estos chats tienen contact_id NULL porque no hay contacto coincidente
SELECT 
  c.id,
  c.contact_number,
  c.chat_id,
  c.name,
  COUNT(m.id) as total_messages,
  b.session_name as bot
FROM chats c
LEFT JOIN messages m ON m.chat_id = c.id
LEFT JOIN bots b ON b.id = c.bot_id
WHERE c.contact_id IS NULL
GROUP BY c.id, c.contact_number, c.chat_id, c.name, b.session_name
ORDER BY COUNT(m.id) DESC
LIMIT 20;

-- ============================================
-- OPCIONAL: CREAR CONTACTOS FALTANTES
-- ============================================
-- Si hay chats sin contacto relacionado, podemos crear los contactos
-- ADVERTENCIA: Solo ejecuta esto si quieres crear contactos automáticamente

/*
INSERT INTO contacts (bot_id, phone_number, name, created_at, updated_at)
SELECT DISTINCT
  c.bot_id,
  c.contact_number,
  COALESCE(c.name, c.contact_number) as name,
  NOW(),
  NOW()
FROM chats c
WHERE c.contact_id IS NULL
  AND c.contact_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contacts co 
    WHERE co.phone_number = c.contact_number 
    AND co.bot_id = c.bot_id
  );

-- Después de crear contactos, ejecuta nuevamente el PASO 2
*/
