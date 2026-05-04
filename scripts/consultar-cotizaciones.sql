-- =============================================
-- CONSULTA: Quiénes han realizado cotizaciones
-- =============================================

-- 1. COTIZACIONES CREADAS EN EL SISTEMA (tabla cotizaciones)
-- Muestra asesores que han creado cotizaciones y cuántas
SELECT 
    p.id AS user_id,
    p.email AS correo,
    p.raw_user_meta_data->>'full_name' AS nombre_completo,
    COUNT(c.id) AS total_cotizaciones,
    MIN(c.created_at) AS primera_cotizacion,
    MAX(c.created_at) AS ultima_cotizacion,
    COUNT(CASE WHEN c.estado = 'PENDIENTE' THEN 1 END) AS pendientes,
    COUNT(CASE WHEN c.estado = 'APROBADA' THEN 1 END) AS aprobadas,
    COUNT(CASE WHEN c.estado = 'RECHAZADA' THEN 1 END) AS rechazadas
FROM auth.users p
LEFT JOIN public.cotizaciones c ON c.created_by = p.id
WHERE c.deleted_at IS NULL  -- Excluir eliminadas
GROUP BY p.id, p.email, p.raw_user_meta_data->>'full_name'
HAVING COUNT(c.id) > 0
ORDER BY total_cotizaciones DESC;


-- 2. COTIZACIONES ENVIADAS POR WHATSAPP (PDFs en mensajes)
-- Detecta quién envió PDFs de cotización por WhatsApp
WITH mensajes_con_pdfs AS (
    SELECT 
        m.chat_id,
        m.from_me,
        m.body,
        m.content,
        m.timestamp,
        c.bot_id,
        b.session_name AS bot_nombre,
        CASE 
            WHEN (m.body || ' ' || m.content) ~ 'Cotizacion_[A-Z_]+_\d{4}-\d{2}-\d{2}\.' THEN 
                array_length(regexp_matches(m.body || ' ' || m.content, 'Cotizacion_[A-Z_]+_\d{4}-\d{2}-\d{2}\.', 'gi'), 1)
            ELSE 0
        END AS pdfs_encontrados
    FROM public.messages m
    JOIN public.chats c ON c.id = m.chat_id
    JOIN public.bots b ON b.id = c.bot_id
    WHERE m.from_me = true  -- Solo mensajes enviados por el bot/asesor
      AND c.is_group = false
      AND c.chat_id NOT LIKE '%status%'
      AND c.chat_id NOT LIKE '%@broadcast%'
)
SELECT 
    bot_id,
    bot_nombre,
    COUNT(*) AS mensajes_con_pdfs,
    SUM(pdfs_encontrados) AS total_pdfs_cotizacion,
    MIN(timestamp) AS primer_pdf_enviado,
    MAX(timestamp) AS ultimo_pdf_enviado
FROM mensajes_con_pdfs
WHERE pdfs_encontrados > 0
GROUP BY bot_id, bot_nombre
ORDER BY total_pdfs_cotizacion DESC;


-- 3. RESUMEN DETALLADO POR ASESOR
-- Combina cotizaciones del sistema + PDFs enviados por WhatsApp
WITH cotizaciones_sistema AS (
    SELECT 
        c.created_by AS user_id,
        COUNT(*) AS total_creadas
    FROM public.cotizaciones c
    WHERE c.deleted_at IS NULL
    GROUP BY c.created_by
),
pdfs_whatsapp AS (
    SELECT 
        b.session_name,
        c.bot_id,
        COUNT(DISTINCT m.id) AS mensajes_con_pdf
    FROM public.messages m
    JOIN public.chats c ON c.id = m.chat_id
    JOIN public.bots b ON b.id = c.bot_id
    WHERE m.from_me = true
      AND (m.body ~ 'Cotizacion_[A-Z_]+_\d{4}-\d{2}-\d{2}\.' 
           OR m.content ~ 'Cotizacion_[A-Z_]+_\d{4}-\d{2}-\d{2}\.')
    GROUP BY b.session_name, c.bot_id
)
SELECT 
    COALESCE(cs.user_id::text, pw.bot_id::text) AS id,
    COALESCE(p.email, pw.session_name) AS identificador,
    COALESCE(p.raw_user_meta_data->>'full_name', pw.session_name) AS nombre,
    COALESCE(cs.total_creadas, 0) AS cotizaciones_sistema,
    COALESCE(pw.mensajes_con_pdf, 0) AS pdfs_enviados_whatsapp,
    COALESCE(cs.total_creadas, 0) + COALESCE(pw.mensajes_con_pdf, 0) AS total_actividad
FROM cotizaciones_sistema cs
FULL OUTER JOIN pdfs_whatsapp pw ON cs.user_id::text = pw.bot_id::text
LEFT JOIN auth.users p ON p.id = cs.user_id
ORDER BY total_actividad DESC;


-- 4. ÚLTIMAS 10 COTIZACIONES CREADAS
SELECT 
    c.id,
    c.nombre_cliente,
    c.origen || ' → ' || c.destino AS ruta,
    c.precio_final_cotizacion,
    c.moneda_cotizacion,
    c.estado,
    c.created_at,
    p.email AS creado_por,
    p.raw_user_meta_data->>'full_name' AS asesor
FROM public.cotizaciones c
JOIN auth.users p ON p.id = c.created_by
WHERE c.deleted_at IS NULL
ORDER BY c.created_at DESC
LIMIT 10;
