-- ============================================
-- SCHEMA PARA CRM WHATSAPP CON WAHA
-- ============================================

-- Tabla de Bots/Sesiones de WhatsApp
CREATE TABLE IF NOT EXISTS bots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_name VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'disconnected',
    engine VARCHAR(20) DEFAULT 'NOWEB',
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de Contactos
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    push_name VARCHAR(255),
    is_business BOOLEAN DEFAULT FALSE,
    is_enterprise BOOLEAN DEFAULT FALSE,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(bot_id, phone_number)
);

-- Tabla de Chats/Conversaciones
CREATE TABLE IF NOT EXISTS chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(bot_id, chat_id)
);

-- Tabla de Mensajes
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(bot_id, message_id)
);

-- Tabla de Media/Archivos
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    mimetype VARCHAR(100),
    file_size BIGINT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de Webhooks/Eventos
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de Etiquetas/Tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bot_id, name)
);

-- Tabla de relación Contactos-Etiquetas
CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (contact_id, tag_id)
);

-- Tabla de Notas de Contactos
CREATE TABLE IF NOT EXISTS contact_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bots_session_name ON bots(session_name);
CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);

CREATE INDEX IF NOT EXISTS idx_contacts_bot_id ON contacts(bot_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);

CREATE INDEX IF NOT EXISTS idx_chats_bot_id ON chats(bot_id);
CREATE INDEX IF NOT EXISTS idx_chats_chat_id ON chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_time DESC);

CREATE INDEX IF NOT EXISTS idx_messages_bot_id ON messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from_me ON messages(from_me);

CREATE INDEX IF NOT EXISTS idx_webhook_events_bot_id ON webhook_events(bot_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- ============================================
-- FUNCIONES Y TRIGGERS
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
CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON contact_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS ÚTILES PARA EL DASHBOARD
-- ============================================

-- Vista de estadísticas por bot
CREATE OR REPLACE VIEW bot_statistics AS
SELECT 
    b.id as bot_id,
    b.session_name,
    b.phone_number,
    b.status,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT ch.id) as total_chats,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = true THEN m.id END) as sent_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = false THEN m.id END) as received_messages,
    MAX(m.timestamp) as last_message_time
FROM bots b
LEFT JOIN contacts c ON b.id = c.bot_id
LEFT JOIN chats ch ON b.id = ch.bot_id
LEFT JOIN messages m ON b.id = m.bot_id
GROUP BY b.id, b.session_name, b.phone_number, b.status;

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

-- Vista de mensajes con detalles
CREATE OR REPLACE VIEW messages_detailed AS
SELECT 
    m.id,
    m.bot_id,
    b.session_name,
    m.chat_id,
    ch.name as chat_name,
    m.message_id,
    m.from_me,
    m.from_number,
    m.to_number,
    c.name as contact_name,
    m.body,
    m.type,
    m.timestamp,
    m.ack,
    m.has_media,
    m.media_url,
    m.caption,
    m.created_at
FROM messages m
LEFT JOIN bots b ON m.bot_id = b.id
LEFT JOIN chats ch ON m.chat_id = ch.id
LEFT JOIN contacts c ON m.contact_id = c.id
ORDER BY m.timestamp DESC;

-- ============================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ============================================

-- Habilitar RLS en las tablas principales
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones con service_role
CREATE POLICY "Enable all for service role" ON bots FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON contacts FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON chats FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON messages FOR ALL USING (true);

-- ============================================
-- COMENTARIOS EN LAS TABLAS
-- ============================================

COMMENT ON TABLE bots IS 'Almacena información de las sesiones/bots de WhatsApp';
COMMENT ON TABLE contacts IS 'Almacena información de los contactos de WhatsApp';
COMMENT ON TABLE chats IS 'Almacena información de las conversaciones/chats';
COMMENT ON TABLE messages IS 'Almacena todos los mensajes enviados y recibidos';
COMMENT ON TABLE media_files IS 'Almacena información de archivos multimedia';
COMMENT ON TABLE webhook_events IS 'Almacena eventos recibidos de webhooks';
COMMENT ON TABLE tags IS 'Etiquetas para organizar contactos';
COMMENT ON TABLE contact_tags IS 'Relación entre contactos y etiquetas';
COMMENT ON TABLE contact_notes IS 'Notas adicionales sobre contactos';
