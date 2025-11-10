-- ============================================
-- VERIFICAR MENSAJES "(Sin contenido)"
-- ============================================

-- 1. Ver mensajes sin body
SELECT 
    id,
    message_id,
    from_me,
    type,
    has_media,
    body,
    content,
    timestamp
FROM messages
WHERE (body IS NULL OR body = '' OR body = 'null')
  AND (content IS NULL OR content = '' OR content = 'null')
ORDER BY timestamp DESC
LIMIT 10;

-- 2. Ver si tienen archivos multimedia asociados
SELECT 
    m.id,
    m.message_id,
    m.type,
    m.has_media,
    m.body,
    m.content,
    mf.file_url,
    mf.file_name
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE (m.body IS NULL OR m.body = '' OR m.body = 'null')
  AND (m.content IS NULL OR m.content = '' OR m.content = 'null')
ORDER BY m.timestamp DESC
LIMIT 10;

-- 3. Contar mensajes por tipo
SELECT 
    type,
    has_media,
    COUNT(*) as total,
    COUNT(CASE WHEN body IS NULL OR body = '' THEN 1 END) as sin_body,
    COUNT(CASE WHEN content IS NULL OR content = '' THEN 1 END) as sin_content
FROM messages
GROUP BY type, has_media
ORDER BY total DESC;
