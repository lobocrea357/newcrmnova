-- ============================================
-- CORRECCIÓN: Vistas sin usar ch.name
-- ============================================
-- Usar esta versión si la tabla chats NO tiene columna 'name'
-- ============================================

-- ============================================
-- 1. VISTA DE CONVERSACIONES RECIENTES (SIN ch.name)
-- ============================================

CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    ch.id as chat_id,
    ch.bot_id,
    b.session_name,
    b.phone_number as bot_phone,
    ch.chat_id as whatsapp_chat_id,
    
    -- Mostrar nombre del contacto o número (SIN usar ch.name)
    COALESCE(
        NULLIF(c.name, ''),
        NULLIF(c.push_name, ''),
        c.phone_number,
        SPLIT_PART(ch.chat_id, '@', 1)
    ) as chat_name,
    
    ch.is_group,
    c.phone_number as contact_phone,
    
    -- Nombre del contacto (con fallback a número)
    COALESCE(
        NULLIF(c.name, ''),
        NULLIF(c.push_name, ''),
        c.phone_number
    ) as contact_name,
    
    ch.unread_count,
    ch.last_message_time,
    ch.archived,
    ch.pinned,
    ch.muted,
    
    -- Información del último mensaje
    m.body as last_message,
    m.from_me as last_message_from_me,
    m.type as last_message_type,
    m.has_media as last_message_has_media,
    m.timestamp as last_message_timestamp,
    
    -- URL de la imagen del último mensaje (si existe)
    mf.file_url as last_message_media_url,
    mf.mimetype as last_message_media_type
    
FROM chats ch
LEFT JOIN bots b ON ch.bot_id = b.id
LEFT JOIN contacts c ON ch.contact_id = c.id
LEFT JOIN LATERAL (
    SELECT 
        body, 
        from_me, 
        timestamp, 
        type, 
        has_media,
        id as message_id
    FROM messages
    WHERE chat_id = ch.id
    ORDER BY timestamp DESC
    LIMIT 1
) m ON true
LEFT JOIN media_files mf ON m.message_id = mf.message_id
ORDER BY ch.last_message_time DESC NULLS LAST;

-- ============================================
-- 2. VISTA DE MENSAJES DETALLADOS (SIN ch.name)
-- ============================================

CREATE OR REPLACE VIEW messages_detailed AS
SELECT 
    m.id,
    m.bot_id,
    b.session_name,
    m.chat_id,
    ch.chat_id as whatsapp_chat_id,
    
    -- Nombre del chat (solo desde contacto, SIN ch.name)
    COALESCE(
        NULLIF(c.name, ''),
        c.phone_number,
        SPLIT_PART(ch.chat_id, '@', 1)
    ) as chat_name,
    
    m.contact_id,
    
    -- Nombre del contacto (con fallback a número)
    COALESCE(
        NULLIF(c.name, ''),
        NULLIF(c.push_name, ''),
        c.phone_number
    ) as contact_name,
    
    c.phone_number as contact_phone,
    m.message_id,
    m.from_me,
    m.from_number,
    m.to_number,
    m.body,
    m.type,
    m.timestamp,
    m.ack,
    m.has_media,
    m.media_url as waha_media_url,
    m.media_mimetype,
    m.caption,
    m.quoted_message_id,
    m.is_forwarded,
    m.broadcast,
    m.created_at,
    m.metadata,
    
    -- Información de multimedia desde Supabase Storage
    mf.id as media_file_id,
    mf.file_url as supabase_media_url,
    mf.file_name,
    mf.mimetype as supabase_mimetype,
    mf.file_size,
    mf.thumbnail_url,
    mf.metadata as media_metadata
    
FROM messages m
LEFT JOIN bots b ON m.bot_id = b.id
LEFT JOIN chats ch ON m.chat_id = ch.id
LEFT JOIN contacts c ON m.contact_id = c.id
LEFT JOIN media_files mf ON m.id = mf.message_id
ORDER BY m.timestamp DESC;

-- ============================================
-- 3. VISTA DE ESTADÍSTICAS POR BOT
-- ============================================

CREATE OR REPLACE VIEW bot_statistics AS
SELECT 
    b.id as bot_id,
    b.session_name,
    b.phone_number,
    b.status,
    b.engine,
    w.name as worker_name,
    w.email as worker_email,
    
    -- Contadores
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT ch.id) as total_chats,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = true THEN m.id END) as sent_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = false THEN m.id END) as received_messages,
    COUNT(DISTINCT CASE WHEN m.has_media = true THEN m.id END) as messages_with_media,
    COUNT(DISTINCT mf.id) as total_media_files,
    
    -- Tipos de multimedia
    COUNT(DISTINCT CASE WHEN mf.mimetype LIKE 'image/%' THEN mf.id END) as total_images,
    COUNT(DISTINCT CASE WHEN mf.mimetype LIKE 'video/%' THEN mf.id END) as total_videos,
    COUNT(DISTINCT CASE WHEN mf.mimetype LIKE 'audio/%' THEN mf.id END) as total_audios,
    COUNT(DISTINCT CASE WHEN mf.mimetype LIKE 'application/%' THEN mf.id END) as total_documents,
    
    -- Timestamps
    MAX(m.timestamp) as last_message_time,
    MIN(m.timestamp) as first_message_time,
    b.created_at as bot_created_at,
    b.last_seen as bot_last_seen
    
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
LEFT JOIN contacts c ON b.id = c.bot_id
LEFT JOIN chats ch ON b.id = ch.bot_id
LEFT JOIN messages m ON b.id = m.bot_id
LEFT JOIN media_files mf ON b.id = mf.bot_id
GROUP BY b.id, b.session_name, b.phone_number, b.status, b.engine, w.name, w.email, b.created_at, b.last_seen;

-- ============================================
-- 4. VISTA DE CONTACTOS DETALLADOS
-- ============================================

CREATE OR REPLACE VIEW contacts_detailed AS
SELECT 
    c.id,
    c.bot_id,
    b.session_name,
    c.phone_number,
    
    -- Nombre con fallback a número
    COALESCE(
        NULLIF(c.name, ''),
        NULLIF(c.push_name, ''),
        c.phone_number
    ) as display_name,
    
    c.name,
    c.push_name,
    c.is_business,
    c.is_enterprise,
    c.profile_picture_url,
    c.created_at,
    c.updated_at,
    c.metadata,
    
    -- Estadísticas del contacto
    COUNT(DISTINCT ch.id) as total_chats,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = false THEN m.id END) as received_from_contact,
    COUNT(DISTINCT CASE WHEN m.from_me = true THEN m.id END) as sent_to_contact,
    MAX(m.timestamp) as last_message_time,
    
    -- Etiquetas del contacto
    STRING_AGG(DISTINCT t.name, ', ') as tags
    
FROM contacts c
LEFT JOIN bots b ON c.bot_id = b.id
LEFT JOIN chats ch ON c.id = ch.contact_id
LEFT JOIN messages m ON c.id = m.contact_id
LEFT JOIN contact_tags ct ON c.id = ct.contact_id
LEFT JOIN tags t ON ct.tag_id = t.id
GROUP BY c.id, c.bot_id, b.session_name, c.phone_number, c.name, c.push_name, 
         c.is_business, c.is_enterprise, c.profile_picture_url, c.created_at, c.updated_at, c.metadata;

-- ============================================
-- 5. FUNCIÓN AUXILIAR: Obtener nombre o número
-- ============================================

CREATE OR REPLACE FUNCTION get_display_name(
    p_name TEXT,
    p_push_name TEXT,
    p_phone_number TEXT,
    p_chat_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(p_name, ''),
        NULLIF(p_push_name, ''),
        p_phone_number,
        SPLIT_PART(p_chat_id, '@', 1),
        'Desconocido'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. CREAR ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

-- Índice para búsqueda por nombre o número
CREATE INDEX IF NOT EXISTS idx_contacts_search 
ON contacts USING gin(
    to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(push_name, '') || ' ' || phone_number)
);

-- Índice para chats activos
CREATE INDEX IF NOT EXISTS idx_chats_active 
ON chats(bot_id, last_message_time DESC) 
WHERE archived = false;

-- Índice para mensajes con multimedia
CREATE INDEX IF NOT EXISTS idx_messages_media 
ON messages(bot_id, has_media, timestamp DESC) 
WHERE has_media = true;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver conversaciones recientes con nombres correctos
SELECT 
    chat_name,
    contact_phone,
    last_message,
    last_message_time
FROM recent_conversations
LIMIT 10;

-- Ver contactos sin nombre (deberían mostrar número)
SELECT 
    display_name,
    phone_number,
    name,
    push_name
FROM contacts_detailed
WHERE name IS NULL OR name = ''
LIMIT 10;

-- Ver estadísticas por bot
SELECT 
    session_name,
    total_contacts,
    total_messages,
    total_images,
    total_audios
FROM bot_statistics;

SELECT '✅ VISTAS CREADAS EXITOSAMENTE (SIN usar ch.name)' as status;
SELECT 'Los chats ahora muestran el número cuando no hay nombre' as info;
SELECT 'Las vistas funcionan sin la columna ch.name' as info2;
