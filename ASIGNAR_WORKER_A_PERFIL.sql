-- ============================================
-- ASIGNAR WORKER A PERFIL DE USUARIO
-- ============================================
-- Ejecutar después de crear workers desde WAHA Dashboard
-- ============================================

-- ============================================
-- OPCIÓN 1: Asignar worker por email
-- ============================================

-- Asignar worker "Moises" al usuario Moisesnova923@gmail.com
UPDATE profiles
SET worker_id = (
    SELECT id FROM workers 
    WHERE email = 'Moisesnova923@gmail.com' 
    LIMIT 1
)
WHERE email = 'Moisesnova923@gmail.com';

-- ============================================
-- OPCIÓN 2: Asignar worker por nombre
-- ============================================

-- Si el worker tiene un nombre diferente al email
UPDATE profiles
SET worker_id = (
    SELECT id FROM workers 
    WHERE name = 'Moises'  -- Cambiar por el nombre del worker
    LIMIT 1
)
WHERE email = 'Moisesnova923@gmail.com';

-- ============================================
-- OPCIÓN 3: Ver workers disponibles y asignar manualmente
-- ============================================

-- Ver todos los workers disponibles
SELECT 
    id,
    name,
    email,
    status
FROM workers
ORDER BY name;

-- Copiar el ID del worker que quieres asignar y ejecutar:
-- UPDATE profiles
-- SET worker_id = 'PEGAR_ID_AQUI'
-- WHERE email = 'email_del_usuario@example.com';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver perfiles con sus workers asignados
SELECT 
    p.email as usuario_email,
    p.full_name as usuario_nombre,
    r.name as rol,
    w.name as worker_nombre,
    w.email as worker_email,
    p.is_active
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN workers w ON p.worker_id = w.id
ORDER BY r.name, p.email;

-- ============================================
-- DESASIGNAR WORKER (si es necesario)
-- ============================================

-- Quitar worker de un perfil
-- UPDATE profiles
-- SET worker_id = NULL
-- WHERE email = 'usuario@example.com';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Los workers se crean desde WAHA Dashboard
-- 2. Después de crear un worker en WAHA, ejecuta este script
-- 3. El worker_id vincula el perfil con el worker
-- 4. Si eliminas un worker, el worker_id se pone en NULL automáticamente
-- 5. Admin no necesita worker_id (puede ver todos los bots)
-- ============================================
