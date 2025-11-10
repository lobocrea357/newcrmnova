-- ============================================
-- SIMULAR LO QUE EL FRONTEND DEBERÍA RECIBIR
-- ============================================

-- Esto simula exactamente la query que hace getConversationWithMessages
SELECT 
    m.id,
    m.message_id,
    m.chat_id,
    m.type,
    m.has_media,
    m.body,
    m.from_me,
    m.timestamp,
    m.metadata,
    -- Simular el array de media_files como lo devuelve Supabase
    COALESCE(
        json_agg(
            json_build_object(
                'id', mf.id,
                'message_id', mf.message_id,
                'file_url', mf.file_url,
                'file_name', mf.file_name,
                'mimetype', mf.mimetype,
                'file_size', mf.file_size,
                'thumbnail_url', mf.thumbnail_url,
                'created_at', mf.created_at
            )
        ) FILTER (WHERE mf.id IS NOT NULL),
        '[]'::json
    ) as media_files
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.has_media = true
GROUP BY m.id, m.message_id, m.chat_id, m.type, m.has_media, m.body, m.from_me, m.timestamp, m.metadata
ORDER BY m.timestamp DESC
LIMIT 5;
