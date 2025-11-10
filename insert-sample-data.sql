-- ============================================
-- INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- 1. Insertar workers de ejemplo (solo si no existen)
INSERT INTO workers (name, email, role, status)
SELECT 'Juan Pérez', 'juan@example.com', 'agent', 'active'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE email = 'juan@example.com');

INSERT INTO workers (name, email, role, status)
SELECT 'María García', 'maria@example.com', 'supervisor', 'active'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE email = 'maria@example.com');

INSERT INTO workers (name, email, role, status)
SELECT 'Carlos López', 'carlos@example.com', 'agent', 'active'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE email = 'carlos@example.com');

-- 2. Asignar workers a bots existentes (actualiza según tus bots reales)
-- Primero, obtén los IDs de los workers
DO $$
DECLARE
    worker_juan_id UUID;
    worker_maria_id UUID;
    worker_carlos_id UUID;
BEGIN
    -- Obtener IDs de workers
    SELECT id INTO worker_juan_id FROM workers WHERE email = 'juan@example.com';
    SELECT id INTO worker_maria_id FROM workers WHERE email = 'maria@example.com';
    SELECT id INTO worker_carlos_id FROM workers WHERE email = 'carlos@example.com';
    
    -- Asignar el primer bot a Juan (si existe)
    UPDATE bots 
    SET worker_id = worker_juan_id
    WHERE id = (SELECT id FROM bots ORDER BY created_at LIMIT 1 OFFSET 0)
    AND worker_id IS NULL;
    
    -- Asignar el segundo bot a María (si existe)
    UPDATE bots 
    SET worker_id = worker_maria_id
    WHERE id = (SELECT id FROM bots ORDER BY created_at LIMIT 1 OFFSET 1)
    AND worker_id IS NULL;
    
    -- Asignar el tercer bot a Carlos (si existe)
    UPDATE bots 
    SET worker_id = worker_carlos_id
    WHERE id = (SELECT id FROM bots ORDER BY created_at LIMIT 1 OFFSET 2)
    AND worker_id IS NULL;
    
    RAISE NOTICE 'Workers asignados a bots exitosamente';
END $$;

-- 3. Verificar asignaciones
SELECT 
    b.session_name as bot,
    b.phone_number,
    b.status as bot_status,
    w.name as worker,
    w.email as worker_email,
    w.role as worker_role
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id
ORDER BY w.name, b.session_name;

-- 4. Mostrar estadísticas por worker
SELECT * FROM worker_statistics ORDER BY worker_name;
