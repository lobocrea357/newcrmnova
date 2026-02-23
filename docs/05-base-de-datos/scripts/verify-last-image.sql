-- ============================================
-- VERIFICAR ÚLTIMA IMAGEN PROCESADA
-- ============================================

-- 1. Ver la última imagen guardada
SELECT 
    mf.id,
    mf.file_name,
    mf.file_url,
    mf.mimetype,
    mf.file_size,
    mf.created_at,
    m.message_id,
    m.from_me
FROM media_files mf
LEFT JOIN messages m ON mf.message_id = m.id
WHERE mf.id = 'ae3b18c3-471c-41e7-9139-4bc8f6c45ce3';

-- 2. Ver el mensaje asociado
SELECT 
    m.*,
    mf.file_url
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.id = 'ab0a5c3e-a363-4817-8af4-672362416a72';

-- 3. Ver todas las imágenes recientes
SELECT 
    mf.file_url,
    mf.created_at,
    m.from_me
FROM media_files mf
LEFT JOIN messages m ON mf.message_id = m.id
WHERE mf.mimetype LIKE 'image%'
ORDER BY mf.created_at DESC
LIMIT 5;
