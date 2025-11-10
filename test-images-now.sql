-- ============================================
-- VERIFICAR IMÁGENES DESPUÉS DE HACER BUCKET PÚBLICO
-- ============================================

-- 1. Verificar que el bucket es público
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name = 'whatsapp';
-- Debe mostrar public = true

-- 2. Ver todas las imágenes guardadas
SELECT 
    mf.id,
    mf.file_name,
    mf.mimetype,
    mf.file_url,
    mf.file_size,
    mf.created_at,
    m.message_id,
    m.from_me,
    m.timestamp
FROM media_files mf
LEFT JOIN messages m ON mf.message_id = m.id
WHERE mf.mimetype LIKE 'image%'
ORDER BY mf.created_at DESC
LIMIT 10;

-- 3. Ver mensajes con imágenes
SELECT 
    m.id,
    m.message_id,
    m.from_me,
    m.type,
    m.has_media,
    m.timestamp,
    mf.file_url
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.type = 'image' OR m.has_media = true
ORDER BY m.timestamp DESC
LIMIT 10;

-- 4. Contar imágenes por tipo
SELECT 
    CASE WHEN m.from_me THEN 'Enviadas' ELSE 'Recibidas' END as tipo,
    COUNT(*) as total_imagenes
FROM messages m
INNER JOIN media_files mf ON m.id = mf.message_id
WHERE mf.mimetype LIKE 'image%'
GROUP BY m.from_me;
