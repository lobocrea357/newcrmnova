-- ============================================
-- DIAGNOSTICAR POR QUÉ NO HAY IMÁGENES
-- ============================================

-- 1. ¿Hay archivos multimedia en la BD?
SELECT COUNT(*) as total_archivos FROM media_files;

-- 2. ¿Hay mensajes con has_media = true?
SELECT COUNT(*) as mensajes_con_media 
FROM messages 
WHERE has_media = true;

-- 3. Ver últimos mensajes recibidos
SELECT 
    id,
    message_id,
    from_me,
    type,
    has_media,
    body,
    timestamp
FROM messages
ORDER BY timestamp DESC
LIMIT 10;

-- 4. Ver si hay mensajes de imagen sin archivo multimedia
SELECT 
    m.id,
    m.message_id,
    m.type,
    m.has_media,
    m.timestamp,
    COUNT(mf.id) as archivos
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.has_media = true
GROUP BY m.id, m.message_id, m.type, m.has_media, m.timestamp
ORDER BY m.timestamp DESC
LIMIT 10;

-- 5. Ver estructura completa del último mensaje
SELECT * FROM messages 
ORDER BY timestamp DESC 
LIMIT 1;
