-- ============================================
-- CONFIGURAR WORKER MOISES Y ASIGNAR BOT
-- ============================================

-- PASO 1: Verificar si existe el worker "Moises"
SELECT * FROM workers WHERE name ILIKE '%moises%';

-- PASO 2: Crear worker "Moises" si no existe
INSERT INTO workers (name, email, phone, is_active)
VALUES ('Moises', 'Moisesnova923@gmail.com', NULL, true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
RETURNING *;

-- PASO 3: Obtener el ID del worker "Moises"
SELECT id, name, email FROM workers WHERE name ILIKE '%moises%';

-- PASO 4: Asignar el bot "default" al worker "Moises"
UPDATE bots
SET worker_id = (SELECT id FROM workers WHERE name ILIKE '%moises%' LIMIT 1)
WHERE session_name = 'default'
RETURNING id, session_name, phone_number, worker_id;

-- PASO 5: Verificar la asignación
SELECT 
    b.id,
    b.session_name,
    b.phone_number,
    w.name as worker_name,
    w.email as worker_email
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
WHERE b.session_name = 'default';

-- ============================================
-- VERIFICAR PERMISOS DESPUÉS DE LA ASIGNACIÓN
-- ============================================

-- Ver qué usuarios pueden ver el bot "default" ahora
SELECT 
    'admin@novapolointranet.xyz' as user_email,
    b.session_name,
    w.name as worker_name,
    can_user_view_bot(
        (SELECT id FROM auth.users WHERE email = 'admin@novapolointranet.xyz'),
        b.id
    ) as can_view
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
WHERE b.session_name = 'default'

UNION ALL

SELECT 
    'Moisesnova923@gmail.com' as user_email,
    b.session_name,
    w.name as worker_name,
    can_user_view_bot(
        (SELECT id FROM auth.users WHERE email = 'Moisesnova923@gmail.com'),
        b.id
    ) as can_view
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
WHERE b.session_name = 'default';

-- ============================================
-- RESUMEN FINAL
-- ============================================

-- Ver todos los bots con sus workers
SELECT 
    b.session_name,
    b.phone_number,
    b.status,
    w.name as worker_name,
    w.email as worker_email
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
ORDER BY b.created_at DESC;

-- Ver todos los usuarios con sus roles y workers
SELECT 
    p.email,
    p.full_name,
    r.name as role,
    w.name as worker_name
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN workers w ON p.worker_id = w.id
ORDER BY r.name, p.email;
