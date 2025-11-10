-- ============================================
-- MIGRACIÓN PARA SCHEMA EXISTENTE
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Agregar columnas faltantes a la tabla bots
ALTER TABLE public.bots 
ADD COLUMN IF NOT EXISTS session_name text,
ADD COLUMN IF NOT EXISTS engine text DEFAULT 'NOWEB',
ADD COLUMN IF NOT EXISTS qr_code text,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Hacer session_name único si no lo es
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bots_session_name_key'
    ) THEN
        ALTER TABLE public.bots ADD CONSTRAINT bots_session_name_key UNIQUE (session_name);
    END IF;
END $$;

-- Agregar columnas faltantes a la tabla chats
ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS chat_id text,
ADD COLUMN IF NOT EXISTS contact_id uuid,
ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS muted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Hacer chat_id único por bot si no lo es
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_bot_id_chat_id_key'
    ) THEN
        ALTER TABLE public.chats ADD CONSTRAINT chats_bot_id_chat_id_key UNIQUE (bot_id, chat_id);
    END IF;
END $$;

-- Agregar columnas faltantes a la tabla messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS chat_id uuid,
ADD COLUMN IF NOT EXISTS contact_id uuid,
ADD COLUMN IF NOT EXISTS body text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS from_me boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ack integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_media boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS media_mimetype text,
ADD COLUMN IF NOT EXISTS caption text,
ADD COLUMN IF NOT EXISTS quoted_message_id text,
ADD COLUMN IF NOT EXISTS is_forwarded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS broadcast boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Hacer message_id único por bot si no lo es
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_bot_id_message_id_key'
    ) THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_bot_id_message_id_key UNIQUE (bot_id, message_id);
    END IF;
END $$;

-- Crear tabla de contactos si no existe
CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id uuid REFERENCES public.bots(id) ON DELETE CASCADE,
    phone_number text NOT NULL,
    name text,
    push_name text,
    is_business boolean DEFAULT false,
    is_enterprise boolean DEFAULT false,
    profile_picture_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(bot_id, phone_number)
);

-- Agregar foreign key de chat a contact si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_contact_id_fkey'
    ) THEN
        ALTER TABLE public.chats 
        ADD CONSTRAINT chats_contact_id_fkey 
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Agregar foreign keys de messages si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_chat_id_fkey'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_contact_id_fkey'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_contact_id_fkey 
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Crear tabla de media_files si no existe
CREATE TABLE IF NOT EXISTS public.media_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id uuid REFERENCES public.bots(id) ON DELETE CASCADE,
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    file_name text,
    mimetype text,
    file_size bigint,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Crear tabla de webhook_events si no existe
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id uuid REFERENCES public.bots(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    processed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);

-- Crear tabla de tags si no existe
CREATE TABLE IF NOT EXISTS public.tags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id uuid REFERENCES public.bots(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text DEFAULT '#3B82F6',
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(bot_id, name)
);

-- Crear tabla de contact_tags si no existe
CREATE TABLE IF NOT EXISTS public.contact_tags (
    contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (contact_id, tag_id)
);

-- Crear tabla de contact_notes si no existe
CREATE TABLE IF NOT EXISTS public.contact_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bots_session_name ON public.bots(session_name);
CREATE INDEX IF NOT EXISTS idx_bots_status ON public.bots(status);
CREATE INDEX IF NOT EXISTS idx_bots_phone_number ON public.bots(phone_number);

CREATE INDEX IF NOT EXISTS idx_contacts_bot_id ON public.contacts(bot_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone_number);

CREATE INDEX IF NOT EXISTS idx_chats_bot_id ON public.chats(bot_id);
CREATE INDEX IF NOT EXISTS idx_chats_chat_id ON public.chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON public.chats(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_bot_id ON public.messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from_me ON public.messages(from_me);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON public.messages(message_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_bot_id ON public.webhook_events(bot_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.webhook_events(created_at DESC);

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
DROP TRIGGER IF EXISTS update_bots_updated_at ON public.bots;
CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON public.bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_notes_updated_at ON public.contact_notes;
CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON public.contact_notes
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
FROM public.bots b
LEFT JOIN public.contacts c ON b.id = c.bot_id
LEFT JOIN public.chats ch ON b.id = ch.bot_id
LEFT JOIN public.messages m ON b.id = m.bot_id
GROUP BY b.id, b.session_name, b.phone_number, b.status;

-- Vista de conversaciones recientes
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    ch.id as chat_id,
    ch.bot_id,
    b.session_name,
    ch.chat_id as whatsapp_chat_id,
    ch.contact_name as chat_name,
    ch.is_group,
    c.phone_number,
    c.name as contact_name,
    ch.unread_count,
    ch.last_message_at,
    ch.last_message,
    m.from_me as last_message_from_me
FROM public.chats ch
LEFT JOIN public.bots b ON ch.bot_id = b.id
LEFT JOIN public.contacts c ON ch.contact_id = c.id
LEFT JOIN LATERAL (
    SELECT from_me, timestamp
    FROM public.messages
    WHERE chat_id = ch.id
    ORDER BY timestamp DESC
    LIMIT 1
) m ON true
ORDER BY ch.last_message_at DESC NULLS LAST;

-- Vista de mensajes con detalles
CREATE OR REPLACE VIEW messages_detailed AS
SELECT 
    m.id,
    m.bot_id,
    b.session_name,
    m.chat_id,
    ch.contact_name as chat_name,
    m.message_id,
    m.from_me,
    m.from_number,
    m.to_number,
    c.name as contact_name,
    COALESCE(m.body, m.content) as body,
    COALESCE(m.type, m.message_type) as type,
    m.timestamp,
    m.ack,
    m.has_media,
    m.media_url,
    m.caption,
    m.created_at
FROM public.messages m
LEFT JOIN public.bots b ON m.bot_id = b.id
LEFT JOIN public.chats ch ON m.chat_id = ch.id
LEFT JOIN public.contacts c ON m.contact_id = c.id
ORDER BY m.timestamp DESC;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.bots IS 'Almacena información de las sesiones/bots de WhatsApp';
COMMENT ON TABLE public.contacts IS 'Almacena información de los contactos de WhatsApp';
COMMENT ON TABLE public.chats IS 'Almacena información de las conversaciones/chats';
COMMENT ON TABLE public.messages IS 'Almacena todos los mensajes enviados y recibidos';
COMMENT ON TABLE public.media_files IS 'Almacena información de archivos multimedia';
COMMENT ON TABLE public.webhook_events IS 'Almacena eventos recibidos de webhooks';
COMMENT ON TABLE public.tags IS 'Etiquetas para organizar contactos';
COMMENT ON TABLE public.contact_tags IS 'Relación entre contactos y etiquetas';
COMMENT ON TABLE public.contact_notes IS 'Notas adicionales sobre contactos';

-- ============================================
-- FINALIZADO
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 'Migración completada exitosamente' as status;
