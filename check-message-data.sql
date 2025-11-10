-- ============================================
-- VERIFICAR DATOS DEL MENSAJE CON MULTIMEDIA
-- ============================================

-- 1. Ver el último mensaje con multimedia y sus datos completos
SELECT 
    m.id,
    m.message_id,
    m.type,
    m.has_media,
    m.body,
    m.from_me,
    m.timestamp,
    json_agg(
        json_build_object(
            'id', mf.id,
            'file_url', mf.file_url,
            'file_name', mf.file_name,
            'mimetype', mf.mimetype,
            'file_size', mf.file_size
        )
    ) as media_files
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.has_media = true
GROUP BY m.id, m.message_id, m.type, m.has_media, m.body, m.from_me, m.timestamp
ORDER BY m.timestamp DESC
LIMIT 5;

-- 2. Ver específicamente el mensaje más reciente
SELECT 
    m.*
FROM messages m
ORDER BY m.timestamp DESC
LIMIT 1;

-- 3. Ver el archivo multimedia del mensaje más reciente
SELECT 
    mf.*
FROM media_files mf
ORDER BY mf.created_at DESC
LIMIT 1;
