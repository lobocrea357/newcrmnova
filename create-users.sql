-- ============================================
-- CREAR USUARIOS ESPECÍFICOS
-- ============================================

-- PASO 1: Primero, obtener los IDs de los roles
SELECT id, name FROM roles;

-- PASO 2: Obtener el ID del worker "Moises" (si existe)
SELECT id, name FROM workers WHERE name ILIKE '%moises%';

-- PASO 3: Verificar usuarios existentes en auth.users
SELECT id, email FROM auth.users WHERE email IN ('admin@novapolointranet.xyz', 'Moisesnova923@gmail.com');

-- ============================================
-- OPCIÓN A: Si los usuarios YA EXISTEN en auth.users
-- ============================================

-- Insertar perfil para admin@novapolointranet.xyz
INSERT INTO profiles (id, email, full_name, role_id, worker_id, is_active)
SELECT 
    au.id,
    au.email,
    'Administrador',
    r.id,
    NULL, -- Admin no tiene worker específico
    true
FROM auth.users au
CROSS JOIN roles r
WHERE au.email = 'admin@novapolointranet.xyz'
  AND r.name = 'admin'
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Insertar perfil para Moisesnova923@gmail.com
INSERT INTO profiles (id, email, full_name, role_id, worker_id, is_active)
SELECT 
    au.id,
    au.email,
    'Moises',
    r.id,
    w.id, -- Asociar con el worker "Moises"
    true
FROM auth.users au
CROSS JOIN roles r
LEFT JOIN workers w ON w.name ILIKE '%moises%'
WHERE au.email = 'Moisesnova923@gmail.com'
  AND r.name = 'worker'
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    worker_id = EXCLUDED.worker_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- ============================================
-- VERIFICAR USUARIOS CREADOS
-- ============================================

SELECT 
    p.id,
    p.email,
    p.full_name,
    r.name as role,
    w.name as worker_name,
    p.is_active,
    p.created_at
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN workers w ON p.worker_id = w.id
ORDER BY p.created_at DESC;

-- ============================================
-- PROBAR PERMISOS
-- ============================================

-- Verificar qué bots puede ver cada usuario
-- (Ejecutar esto después de crear los perfiles)

-- Para admin@novapolointranet.xyz
SELECT 
    'admin@novapolointranet.xyz' as user_email,
    b.id as bot_id,
    b.session_name,
    b.phone_number,
    w.name as worker_name,
    can_user_view_bot(
        (SELECT id FROM auth.users WHERE email = 'admin@novapolointranet.xyz'),
        b.id
    ) as can_view
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;

-- Para Moisesnova923@gmail.com
SELECT 
    'Moisesnova923@gmail.com' as user_email,
    b.id as bot_id,
    b.session_name,
    b.phone_number,
    w.name as worker_name,
    can_user_view_bot(
        (SELECT id FROM auth.users WHERE email = 'Moisesnova923@gmail.com'),
        b.id
    ) as can_view
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;
