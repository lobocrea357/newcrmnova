-- ============================================
-- DEBUG: VERIFICAR MENSAJES
-- ============================================

-- 1. Ver todos los mensajes con detalles
SELECT 
    id,
    message_id,
    from_me,
    from_number,
    to_number,
    body,
    type,
    has_media,
    timestamp,
    created_at
FROM messages
ORDER BY timestamp DESC
LIMIT 20;

-- 2. Contar mensajes por tipo (entrantes vs salientes)
SELECT 
    from_me,
    COUNT(*) as total,
    COUNT(CASE WHEN body IS NULL OR body = '' THEN 1 END) as sin_contenido,
    COUNT(CASE WHEN has_media = true THEN 1 END) as con_media
FROM messages
GROUP BY from_me;

-- 3. Ver mensajes de audio/ptt
SELECT 
    id,
    message_id,
    from_me,
    type,
    body,
    has_media,
    media_mimetype,
    metadata,
    timestamp
FROM messages
WHERE type IN ('audio', 'ptt', 'voice')
ORDER BY timestamp DESC;

-- 4. Ver archivos multimedia
SELECT 
    mf.id,
    mf.message_id,
    mf.file_name,
    mf.mimetype,
    mf.file_url,
    mf.file_size,
    mf.thumbnail_url,
    m.type as message_type,
    m.from_me,
    m.timestamp
FROM media_files mf
LEFT JOIN messages m ON mf.message_id = m.id
ORDER BY mf.created_at DESC
LIMIT 20;

-- 5. Ver webhooks recibidos
SELECT 
    event_type,
    COUNT(*) as total,
    MAX(created_at) as ultimo_evento
FROM webhook_events
GROUP BY event_type
ORDER BY ultimo_evento DESC;

-- 6. Ver mensajes con metadata (transcripciones)
SELECT 
    id,
    message_id,
    from_me,
    type,
    body,
    metadata,
    timestamp
FROM messages
WHERE metadata IS NOT NULL
  AND metadata::text LIKE '%transcription%'
ORDER BY timestamp DESC;

-- 7. Ver chats con conteo de mensajes
SELECT 
    ch.id,
    ch.chat_id,
    ch.last_message_time,
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.from_me = true THEN 1 END) as messages_sent,
    COUNT(CASE WHEN m.from_me = false THEN 1 END) as messages_received
FROM chats ch
LEFT JOIN messages m ON ch.id = m.chat_id
GROUP BY ch.id, ch.chat_id, ch.last_message_time
ORDER BY ch.last_message_time DESC;
