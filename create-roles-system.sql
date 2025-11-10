-- ============================================
-- SISTEMA DE ROLES Y PERMISOS
-- ============================================

-- 1. Crear tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de usuarios (profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role_id UUID REFERENCES roles(id),
    worker_id UUID REFERENCES workers(id), -- Asociar usuario con worker
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insertar roles predefinidos
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Administrador con acceso total', '{"all": true}'::jsonb),
('worker', 'Trabajador con acceso limitado a sus bots', '{"view_own_bots": true, "manage_own_chats": true}'::jsonb),
('viewer', 'Solo lectura', '{"view_only": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 4. Crear función para obtener el rol de un usuario
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

-- 5. Crear función para verificar si un usuario puede ver un bot
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

-- 6. Crear políticas RLS (Row Level Security) para bots
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo los bots que les corresponden
CREATE POLICY "Users can view their assigned bots"
ON bots FOR SELECT
USING (can_user_view_bot(auth.uid(), id));

-- Política: Admin puede ver todo
CREATE POLICY "Admins can view all bots"
ON bots FOR SELECT
USING (get_user_role(auth.uid()) = 'admin');

-- 7. Crear políticas RLS para chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver chats de sus bots
CREATE POLICY "Users can view chats of their bots"
ON chats FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = chats.bot_id
        AND can_user_view_bot(auth.uid(), bots.id)
    )
);

-- 8. Crear políticas RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver mensajes de sus chats
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

-- 9. Crear función trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_worker_id ON profiles(worker_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- CREAR USUARIOS INICIALES
-- ============================================

-- Nota: Primero debes crear los usuarios en Supabase Auth
-- Luego ejecutar estos INSERTs con los IDs correctos

-- Verificar roles existentes
SELECT * FROM roles ORDER BY name;

-- Ver estructura de profiles
SELECT * FROM profiles;
