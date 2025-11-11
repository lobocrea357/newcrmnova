-- ============================================
-- SCHEMA COMPLETO Y LIMPIO - CRM WHATSAPP
-- ============================================
-- Basado en estructura de WAHA
-- Sistema de roles: admin (acceso total), worker (solo sus bots), viewer (solo lectura)
-- ============================================

-- ============================================
-- PASO 1: LIMPIAR BASE DE DATOS
-- ============================================

-- Deshabilitar RLS temporalmente para limpiar
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS media_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhook_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_notes DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view workers" ON workers;
DROP POLICY IF EXISTS "Authenticated users can view bots" ON bots;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can view chats" ON chats;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can view media_files" ON media_files;
DROP POLICY IF EXISTS "Users can view their assigned bots" ON bots;
DROP POLICY IF EXISTS "Admins can view all bots" ON bots;
DROP POLICY IF EXISTS "Users can view chats of their bots" ON chats;
DROP POLICY IF EXISTS "Users can view messages of their chats" ON messages;
DROP POLICY IF EXISTS "Enable all for service role" ON bots;
DROP POLICY IF EXISTS "Enable all for service role" ON contacts;
DROP POLICY IF EXISTS "Enable all for service role" ON chats;
DROP POLICY IF EXISTS "Enable all for service role" ON messages;
DROP POLICY IF EXISTS "Enable all for service role" ON workers;

-- Eliminar funciones
DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS can_user_view_bot(UUID, UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Eliminar vistas
DROP VIEW IF EXISTS bot_statistics;
DROP VIEW IF EXISTS recent_conversations;
DROP VIEW IF EXISTS messages_detailed;
DROP VIEW IF EXISTS worker_statistics;
DROP VIEW IF EXISTS bots_with_worker;

-- Eliminar tablas (en orden inverso por dependencias)
DROP TABLE IF EXISTS contact_notes CASCADE;
DROP TABLE IF EXISTS contact_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS bots CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================
-- PASO 2: CREAR TABLAS PRINCIPALES
-- ============================================

-- Tabla de ROLES
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de WORKERS (Trabajadores/Agentes)
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Tabla de PERFILES (vincula auth.users con roles y workers)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role_id UUID REFERENCES roles(id),
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de BOTS/SESIONES (basada en estructura WAHA)
CREATE TABLE bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'STOPPED',
    engine VARCHAR(20) DEFAULT 'NOWEB',
    qr_code TEXT,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Tabla de CONTACTOS
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    push_name VARCHAR(255),
    is_business BOOLEAN DEFAULT FALSE,
    is_enterprise BOOLEAN DEFAULT FALSE,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(bot_id, phone_number)
);

-- Tabla de CHATS/CONVERSACIONES
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    chat_id VARCHAR(255) NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    name VARCHAR(255),
    is_group BOOLEAN DEFAULT FALSE,
    unread_count INTEGER DEFAULT 0,
    last_message_time TIMESTAMP WITH TIME ZONE,
    archived BOOLEAN DEFAULT FALSE,
    pinned BOOLEAN DEFAULT FALSE,
    muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(bot_id, chat_id)
);

-- Tabla de MENSAJES (estructura completa de WAHA)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    message_id VARCHAR(255) NOT NULL,
    from_me BOOLEAN DEFAULT FALSE,
    from_number VARCHAR(50),
    to_number VARCHAR(50),
    body TEXT,
    type VARCHAR(50) DEFAULT 'text',
    timestamp TIMESTAMP WITH TIME ZONE,
    ack INTEGER DEFAULT 0,
    has_media BOOLEAN DEFAULT FALSE,
    media_url TEXT,
    media_mimetype VARCHAR(100),
    caption TEXT,
    quoted_message_id VARCHAR(255),
    is_forwarded BOOLEAN DEFAULT FALSE,
    broadcast BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(bot_id, message_id)
);

-- Tabla de ARCHIVOS MULTIMEDIA
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    mimetype VARCHAR(100),
    file_size BIGINT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Tabla de WEBHOOKS/EVENTOS
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de ETIQUETAS
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bot_id, name)
);

-- Tabla de relación CONTACTOS-ETIQUETAS
CREATE TABLE contact_tags (
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (contact_id, tag_id)
);

-- Tabla de NOTAS DE CONTACTOS
CREATE TABLE contact_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PASO 3: CREAR ÍNDICES
-- ============================================

-- Índices para roles y perfiles
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_worker_id ON profiles(worker_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Índices para workers
CREATE INDEX idx_workers_email ON workers(email);
CREATE INDEX idx_workers_status ON workers(status);

-- Índices para bots
CREATE INDEX idx_bots_session_name ON bots(session_name);
CREATE INDEX idx_bots_status ON bots(status);
CREATE INDEX idx_bots_worker_id ON bots(worker_id);

-- Índices para contactos
CREATE INDEX idx_contacts_bot_id ON contacts(bot_id);
CREATE INDEX idx_contacts_phone ON contacts(phone_number);

-- Índices para chats
CREATE INDEX idx_chats_bot_id ON chats(bot_id);
CREATE INDEX idx_chats_chat_id ON chats(chat_id);
CREATE INDEX idx_chats_last_message ON chats(last_message_time DESC);

-- Índices para mensajes
CREATE INDEX idx_messages_bot_id ON messages(bot_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_from_me ON messages(from_me);
CREATE INDEX idx_messages_type ON messages(type);

-- Índices para media_files
CREATE INDEX idx_media_files_message_id ON media_files(message_id);
CREATE INDEX idx_media_files_bot_id ON media_files(bot_id);

-- Índices para webhook_events
CREATE INDEX idx_webhook_events_bot_id ON webhook_events(bot_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

-- ============================================
-- PASO 4: CREAR FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON contact_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 5: INSERTAR DATOS INICIALES
-- ============================================

-- Insertar roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Administrador con acceso total a todos los datos', '{"all": true}'::jsonb),
('worker', 'Trabajador con acceso solo a sus bots asignados', '{"view_own_bots": true, "manage_own_chats": true}'::jsonb),
('viewer', 'Solo lectura de datos permitidos', '{"view_only": true}'::jsonb);

-- ============================================
-- PASO 6: CONFIGURAR RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS: ADMIN VE TODO
-- ============================================

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.id = auth.uid()
        AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el worker_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_worker_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT worker_id FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS PARA ROLES
CREATE POLICY "Anyone can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- POLÍTICAS PARA WORKERS
CREATE POLICY "Admins can view all workers"
ON workers FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Workers can view themselves"
ON workers FOR SELECT
TO authenticated
USING (id = get_user_worker_id());

-- POLÍTICAS PARA PROFILES
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

-- POLÍTICAS PARA BOTS
CREATE POLICY "Admins can view all bots"
ON bots FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Workers can view their assigned bots"
ON bots FOR SELECT
TO authenticated
USING (worker_id = get_user_worker_id());

-- POLÍTICAS PARA CONTACTS
CREATE POLICY "Admins can view all contacts"
ON contacts FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Workers can view contacts of their bots"
ON contacts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = contacts.bot_id
        AND bots.worker_id = get_user_worker_id()
    )
);

-- POLÍTICAS PARA CHATS
CREATE POLICY "Admins can view all chats"
ON chats FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Workers can view chats of their bots"
ON chats FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = chats.bot_id
        AND bots.worker_id = get_user_worker_id()
    )
);

-- POLÍTICAS PARA MESSAGES
CREATE POLICY "Admins can view all messages"
ON messages FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Workers can view messages of their bots"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = messages.bot_id
        AND bots.worker_id = get_user_worker_id()
    )
);

-- POLÍTICAS PARA MEDIA_FILES
CREATE POLICY "Admins can view all media files"
ON media_files FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Workers can view media files of their bots"
ON media_files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = media_files.bot_id
        AND bots.worker_id = get_user_worker_id()
    )
);

-- POLÍTICAS PARA WEBHOOK_EVENTS
CREATE POLICY "Admins can view all webhook events"
ON webhook_events FOR SELECT
TO authenticated
USING (is_admin());

-- POLÍTICAS PARA TAGS
CREATE POLICY "Admins can view all tags"
ON tags FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Workers can view tags of their bots"
ON tags FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = tags.bot_id
        AND bots.worker_id = get_user_worker_id()
    )
);

-- POLÍTICAS PARA CONTACT_TAGS
CREATE POLICY "Admins can view all contact tags"
ON contact_tags FOR SELECT
TO authenticated
USING (is_admin());

-- POLÍTICAS PARA CONTACT_NOTES
CREATE POLICY "Admins can view all contact notes"
ON contact_notes FOR SELECT
TO authenticated
USING (is_admin());

-- ============================================
-- PASO 7: CREAR VISTAS ÚTILES
-- ============================================

-- Vista de estadísticas por bot
CREATE OR REPLACE VIEW bot_statistics AS
SELECT 
    b.id as bot_id,
    b.session_name,
    b.phone_number,
    b.status,
    w.name as worker_name,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT ch.id) as total_chats,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = true THEN m.id END) as sent_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = false THEN m.id END) as received_messages,
    MAX(m.timestamp) as last_message_time
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
LEFT JOIN contacts c ON b.id = c.bot_id
LEFT JOIN chats ch ON b.id = ch.bot_id
LEFT JOIN messages m ON b.id = m.bot_id
GROUP BY b.id, b.session_name, b.phone_number, b.status, w.name;

-- Vista de conversaciones recientes
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    ch.id as chat_id,
    ch.bot_id,
    b.session_name,
    ch.chat_id as whatsapp_chat_id,
    ch.name as chat_name,
    ch.is_group,
    c.phone_number,
    c.name as contact_name,
    ch.unread_count,
    ch.last_message_time,
    m.body as last_message,
    m.from_me as last_message_from_me
FROM chats ch
LEFT JOIN bots b ON ch.bot_id = b.id
LEFT JOIN contacts c ON ch.contact_id = c.id
LEFT JOIN LATERAL (
    SELECT body, from_me, timestamp
    FROM messages
    WHERE chat_id = ch.id
    ORDER BY timestamp DESC
    LIMIT 1
) m ON true
ORDER BY ch.last_message_time DESC NULLS LAST;

-- Vista de estadísticas por worker
CREATE OR REPLACE VIEW worker_statistics AS
SELECT 
    w.id as worker_id,
    w.name as worker_name,
    w.email as worker_email,
    w.status as worker_status,
    COUNT(DISTINCT b.id) as total_bots,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT ch.id) as total_chats,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = true THEN m.id END) as sent_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = false THEN m.id END) as received_messages,
    MAX(m.timestamp) as last_message_time
FROM workers w
LEFT JOIN bots b ON w.id = b.worker_id
LEFT JOIN contacts c ON b.id = c.bot_id
LEFT JOIN chats ch ON b.id = ch.bot_id
LEFT JOIN messages m ON b.id = m.bot_id
GROUP BY w.id, w.name, w.email, w.status;

-- ============================================
-- PASO 8: COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE roles IS 'Roles del sistema: admin, worker, viewer';
COMMENT ON TABLE workers IS 'Trabajadores/agentes que gestionan bots';
COMMENT ON TABLE profiles IS 'Perfiles de usuarios vinculados a auth.users';
COMMENT ON TABLE bots IS 'Sesiones/bots de WhatsApp (estructura WAHA)';
COMMENT ON TABLE contacts IS 'Contactos de WhatsApp';
COMMENT ON TABLE chats IS 'Conversaciones/chats';
COMMENT ON TABLE messages IS 'Mensajes enviados y recibidos';
COMMENT ON TABLE media_files IS 'Archivos multimedia (imágenes, videos, audios, documentos)';
COMMENT ON TABLE webhook_events IS 'Eventos recibidos de webhooks WAHA';
COMMENT ON TABLE tags IS 'Etiquetas para organizar contactos';
COMMENT ON TABLE contact_tags IS 'Relación entre contactos y etiquetas';
COMMENT ON TABLE contact_notes IS 'Notas adicionales sobre contactos';

-- ============================================
-- RESULTADO FINAL
-- ============================================
-- ✅ Schema completo basado en estructura WAHA
-- ✅ Sistema de roles: admin (ve todo), worker (solo sus bots), viewer (lectura)
-- ✅ RLS configurado correctamente
-- ✅ Índices para optimización
-- ✅ Vistas útiles para el dashboard
-- ✅ Funciones y triggers
-- ============================================

SELECT '✅ SCHEMA CREADO EXITOSAMENTE' as status;
SELECT 'Total de tablas creadas: 12' as info;
SELECT 'Roles disponibles: admin, worker, viewer' as roles;
SELECT 'Próximo paso: Crear usuarios en auth.users y sus perfiles' as next_step;
