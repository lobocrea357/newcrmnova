-- ============================================
-- SINCRONIZAR WORKERS DESDE LA API
-- ============================================

-- Si tienes workers en tu sistema de API (como "Moisés"), agrégalos aquí

-- 1. Insertar worker "Moisés" (ajusta los datos según corresponda)
INSERT INTO workers (name, email, role, status)
VALUES ('Moisés', 'moises@example.com', 'agent', 'active')
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 2. Asignar el bot "default" a Moisés
UPDATE bots
SET worker_id = (SELECT id FROM workers WHERE name = 'Moisés')
WHERE session_name = 'default'
  AND worker_id IS NULL;

-- 3. Verificar workers y sus bots
SELECT 
    w.id,
    w.name,
    w.email,
    w.status,
    COUNT(b.id) as total_bots,
    STRING_AGG(b.session_name, ', ') as bot_names
FROM workers w
LEFT JOIN bots b ON w.id = b.worker_id
GROUP BY w.id, w.name, w.email, w.status
ORDER BY w.name;

-- 4. Ver todos los bots con sus workers
SELECT 
    b.session_name,
    b.phone_number,
    b.status,
    w.name as worker_name,
    w.email as worker_email
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
ORDER BY w.name, b.session_name;
