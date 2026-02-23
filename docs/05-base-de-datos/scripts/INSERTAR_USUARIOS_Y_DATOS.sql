-- ============================================
-- INSERTAR USUARIOS Y DATOS DE PRUEBA
-- ============================================
-- Ejecutar DESPUÉS de SCHEMA_COMPLETO_LIMPIO.sql
-- ============================================

-- ============================================
-- PASO 1: CREAR WORKERS
-- ============================================

-- ⚠️ IMPORTANTE: Los workers se crean desde el Dashboard de WAHA
-- Este script NO crea workers automáticamente
-- Los workers se sincronizan desde WAHA usando el backend Express

-- Si necesitas crear un worker manualmente para testing:
-- INSERT INTO workers (name, email, phone_number, status)
-- VALUES ('Worker Test', 'test@example.com', NULL, 'active');

-- ============================================
-- PASO 2: CREAR PERFILES PARA USUARIOS
-- ============================================

-- IMPORTANTE: Los usuarios deben existir primero en auth.users
-- Puedes crearlos desde Supabase Dashboard > Authentication > Users
-- O usar el siguiente comando (ajusta el email y password):

-- Para crear usuarios, ve a Supabase Dashboard:
-- 1. Authentication > Users > Add User
-- 2. Email: admin@novapolointranet.xyz, Password: tu_password
-- 3. Email: Moisesnova923@gmail.com, Password: tu_password

-- Perfil para ADMIN
INSERT INTO profiles (id, email, full_name, role_id, worker_id, is_active)
SELECT 
    au.id,
    au.email,
    'Administrador',
    r.id,
    NULL,  -- Admin no tiene worker asignado
    true
FROM auth.users au
CROSS JOIN roles r
WHERE au.email = 'admin@novapolointranet.xyz'
  AND r.name = 'admin'
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Perfil para WORKER (Moises)
-- ⚠️ NOTA: El worker_id se asignará después cuando el worker se cree desde WAHA
INSERT INTO profiles (id, email, full_name, role_id, worker_id, is_active)
SELECT 
    au.id,
    au.email,
    'Moises',
    r.id,
    NULL,  -- worker_id se asigna después desde el dashboard
    true
FROM auth.users au
CROSS JOIN roles r
WHERE au.email = 'Moisesnova923@gmail.com'
  AND r.name = 'worker'
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- ============================================
-- PASO 3: CREAR BOTS DE EJEMPLO
-- ============================================

-- ⚠️ IMPORTANTE: Los bots se crean desde WAHA cuando inicias una sesión
-- Este script NO crea bots automáticamente
-- Los bots se sincronizan desde WAHA usando webhooks del backend Express

-- Si necesitas crear un bot manualmente para testing:
-- INSERT INTO bots (session_name, phone_number, status, engine, worker_id)
-- VALUES ('test-bot', NULL, 'STOPPED', 'NOWEB', NULL);

-- ============================================
-- PASO 4: VERIFICACIÓN
-- ============================================

-- Ver roles creados
SELECT '=== ROLES ===' as section;
SELECT id, name, description FROM roles ORDER BY name;

-- Ver workers creados
SELECT '=== WORKERS ===' as section;
SELECT id, name, email, status FROM workers ORDER BY name;

-- Ver usuarios autenticados
SELECT '=== USUARIOS AUTH ===' as section;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Ver perfiles creados
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
ORDER BY r.name, p.email;

-- Ver bots creados
SELECT '=== BOTS ===' as section;
SELECT 
    b.session_name,
    b.phone_number,
    b.status,
    w.name as worker_name,
    w.email as worker_email
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
ORDER BY b.session_name;

-- Verificar políticas RLS
SELECT '=== POLÍTICAS RLS ===' as section;
SELECT 
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('workers', 'bots', 'chats', 'messages')
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ 3 roles: admin, worker, viewer
-- ✅ 1-2 workers creados
-- ✅ 2 usuarios con perfiles:
--    - admin@novapolointranet.xyz (admin)
--    - Moisesnova923@gmail.com (worker)
-- ✅ 1-2 bots creados
-- ============================================

SELECT '✅ DATOS INSERTADOS EXITOSAMENTE' as status;
SELECT 'Ahora puedes hacer login en el dashboard' as next_step;
