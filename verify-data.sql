-- ============================================
-- VERIFICACIÓN RÁPIDA DE DATOS
-- ============================================
-- Ejecutar en Supabase SQL Editor para ver qué datos existen
-- ============================================

-- 1. Ver usuarios autenticados
SELECT '=== USUARIOS AUTENTICADOS ===' as section;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Ver perfiles
SELECT '=== PERFILES ===' as section;
SELECT 
    p.email,
    p.full_name,
    r.name as role,
    w.name as worker_name,
    p.is_active
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN workers w ON p.worker_id = w.id
ORDER BY p.email;

-- 3. Ver workers
SELECT '=== WORKERS ===' as section;
SELECT id, name, email, status, created_at 
FROM workers 
ORDER BY created_at DESC;

-- 4. Ver bots
SELECT '=== BOTS ===' as section;
SELECT 
    b.id,
    b.session_name,
    b.phone_number,
    b.status,
    w.name as worker_name,
    b.created_at
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
ORDER BY b.created_at DESC;

-- 5. Ver chats (primeros 10)
SELECT '=== CHATS (primeros 10) ===' as section;
SELECT 
    ch.id,
    ch.chat_id,
    b.session_name as bot_name,
    ch.name,
    ch.last_message_time
FROM chats ch
LEFT JOIN bots b ON ch.bot_id = b.id
ORDER BY ch.last_message_time DESC NULLS LAST
LIMIT 10;

-- 6. Ver conteo de mensajes
SELECT '=== CONTEO DE MENSAJES ===' as section;
SELECT 
    b.session_name as bot,
    COUNT(m.id) as total_mensajes
FROM bots b
LEFT JOIN messages m ON b.id = m.bot_id
GROUP BY b.id, b.session_name
ORDER BY total_mensajes DESC;

-- 7. Ver políticas RLS activas
SELECT '=== POLÍTICAS RLS ===' as section;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('workers', 'bots', 'contacts', 'chats', 'messages')
ORDER BY tablename, policyname;

-- 8. Ver si RLS está habilitado
SELECT '=== ESTADO RLS ===' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workers', 'bots', 'contacts', 'chats', 'messages')
ORDER BY tablename;
