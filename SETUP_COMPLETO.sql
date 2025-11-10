-- ============================================
-- SETUP COMPLETO: ROLES, USUARIOS Y PERMISOS
-- ============================================
-- Ejecutar TODO este script en orden en Supabase SQL Editor
-- ============================================

-- ============================================
-- PARTE 1: CREAR ESTRUCTURA DE ROLES
-- ============================================

-- 1.1 Crear tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role_id UUID REFERENCES roles(id),
    worker_id UUID REFERENCES workers(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Insertar roles predefinidos
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Administrador con acceso total', '{"all": true}'::jsonb),
('worker', 'Trabajador con acceso limitado a sus bots', '{"view_own_bots": true, "manage_own_chats": true}'::jsonb),
('viewer', 'Solo lectura', '{"view_only": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 1.4 Crear función para obtener rol de usuario
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT r.name INTO user_role
    FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = user_id;
    
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.5 Crear función para verificar permisos de bot
CREATE OR REPLACE FUNCTION can_user_view_bot(user_id UUID, bot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_worker_id UUID;
    bot_worker_id UUID;
BEGIN
    -- Obtener rol del usuario
    SELECT r.name, p.worker_id INTO user_role, user_worker_id
    FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.id = user_id;
    
    -- Si es admin, puede ver todo
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Si es worker, solo puede ver bots de su worker
    IF user_role = 'worker' AND user_worker_id IS NOT NULL THEN
        SELECT worker_id INTO bot_worker_id
        FROM bots
        WHERE id = bot_id;
        
        RETURN bot_worker_id = user_worker_id;
    END IF;
    
    -- Por defecto, no puede ver
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.6 Habilitar RLS en bots
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- 1.7 Crear políticas para bots
DROP POLICY IF EXISTS "Users can view their assigned bots" ON bots;
DROP POLICY IF EXISTS "Admins can view all bots" ON bots;

CREATE POLICY "Users can view their assigned bots"
ON bots FOR SELECT
USING (can_user_view_bot(auth.uid(), id));

-- 1.8 Habilitar RLS en chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view chats of their bots" ON chats;

CREATE POLICY "Users can view chats of their bots"
ON chats FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = chats.bot_id
        AND can_user_view_bot(auth.uid(), bots.id)
    )
);

-- 1.9 Habilitar RLS en messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages of their chats" ON messages;

CREATE POLICY "Users can view messages of their chats"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chats
        JOIN bots ON chats.bot_id = bots.id
        WHERE chats.id = messages.chat_id
        AND can_user_view_bot(auth.uid(), bots.id)
    )
);

-- 1.10 Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_worker_id ON profiles(worker_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- PARTE 2: CREAR WORKER MOISES
-- ============================================

-- 2.1 Crear worker "Moises"
INSERT INTO workers (name, email)
VALUES ('Moises', 'Moisesnova923@gmail.com')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 2.2 Asignar bot "default" al worker "Moises"
UPDATE bots
SET worker_id = (SELECT id FROM workers WHERE email = 'Moisesnova923@gmail.com' LIMIT 1)
WHERE session_name = 'default';

-- ============================================
-- PARTE 3: CREAR PERFILES DE USUARIOS
-- ============================================

-- 3.1 Perfil para admin@novapolointranet.xyz
INSERT INTO profiles (id, email, full_name, role_id, worker_id, is_active)
SELECT 
    au.id,
    au.email,
    'Administrador',
    r.id,
    NULL,
    true
FROM auth.users au
CROSS JOIN roles r
WHERE au.email = 'admin@novapolointranet.xyz'
  AND r.name = 'admin'
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 3.2 Perfil para Moisesnova923@gmail.com
INSERT INTO profiles (id, email, full_name, role_id, worker_id, is_active)
SELECT 
    au.id,
    au.email,
    'Moises',
    r.id,
    w.id,
    true
FROM auth.users au
CROSS JOIN roles r
LEFT JOIN workers w ON w.email = 'Moisesnova923@gmail.com'
WHERE au.email = 'Moisesnova923@gmail.com'
  AND r.name = 'worker'
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    worker_id = EXCLUDED.worker_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- ============================================
-- PARTE 4: VERIFICACIÓN
-- ============================================

-- 4.1 Ver roles creados
SELECT '=== ROLES ===' as section;
SELECT id, name, description FROM roles ORDER BY name;

-- 4.2 Ver workers
SELECT '=== WORKERS ===' as section;
SELECT id, name, email FROM workers ORDER BY name;

-- 4.3 Ver perfiles de usuarios
SELECT '=== PERFILES DE USUARIOS ===' as section;
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

-- 4.4 Ver bots con workers asignados
SELECT '=== BOTS Y WORKERS ===' as section;
SELECT 
    b.session_name,
    b.phone_number,
    b.status,
    w.name as worker_name,
    w.email as worker_email
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
ORDER BY b.session_name;

-- 4.5 Probar permisos
SELECT '=== PERMISOS ===' as section;
SELECT 
    CASE 
        WHEN au.email = 'admin@novapolointranet.xyz' THEN 'Admin'
        WHEN au.email = 'Moisesnova923@gmail.com' THEN 'Moises'
    END as usuario,
    b.session_name,
    w.name as worker_name,
    can_user_view_bot(au.id, b.id) as puede_ver
FROM auth.users au
CROSS JOIN bots b
LEFT JOIN workers w ON b.worker_id = w.id
WHERE au.email IN ('admin@novapolointranet.xyz', 'Moisesnova923@gmail.com')
ORDER BY au.email, b.session_name;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Admin: puede_ver = true para TODOS los bots
-- Moises: puede_ver = true SOLO para bots de su worker
-- ============================================
