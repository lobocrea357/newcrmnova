-- ============================================
-- DIAGNOSTICAR PROBLEMA DE IMÁGENES
-- ============================================

-- 1. Ver mensajes con imágenes
SELECT 
    id,
    message_id,
    from_me,
    type,
    has_media,
    body,
    media_mimetype,
    timestamp
FROM messages
WHERE type = 'image' OR has_media = true
ORDER BY timestamp DESC
LIMIT 10;

-- 2. Ver archivos multimedia guardados
SELECT 
    mf.id,
    mf.file_name,
    mf.mimetype,
    mf.file_url,
    mf.file_size,
    mf.created_at,
    m.message_id,
    m.type as message_type
FROM media_files mf
LEFT JOIN messages m ON mf.message_id = m.id
ORDER BY mf.created_at DESC
LIMIT 10;

-- 3. Ver mensajes de imagen SIN archivo multimedia
SELECT 
    m.id,
    m.message_id,
    m.type,
    m.has_media,
    m.timestamp,
    COUNT(mf.id) as archivos_multimedia
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.type = 'image' OR m.has_media = true
GROUP BY m.id, m.message_id, m.type, m.has_media, m.timestamp
HAVING COUNT(mf.id) = 0
ORDER BY m.timestamp DESC;

-- 4. Ver estructura completa de un mensaje con imagen
SELECT 
    m.*,
    mf.file_url,
    mf.file_name,
    mf.mimetype as media_mimetype
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.type = 'image' OR m.has_media = true
ORDER BY m.timestamp DESC
LIMIT 5;
