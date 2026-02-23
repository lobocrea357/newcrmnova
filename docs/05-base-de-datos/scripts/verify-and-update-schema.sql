-- ============================================
-- VERIFICACIÓN Y ACTUALIZACIÓN DE SCHEMA
-- ============================================

-- 1. Verificar si la columna worker_id existe en bots
-- Si no existe, agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bots' 
        AND column_name = 'worker_id'
    ) THEN
        ALTER TABLE bots ADD COLUMN worker_id UUID REFERENCES workers(id) ON DELETE SET NULL;
        CREATE INDEX idx_bots_worker_id ON bots(worker_id);
        RAISE NOTICE 'Columna worker_id agregada a la tabla bots';
    ELSE
        RAISE NOTICE 'La columna worker_id ya existe en la tabla bots';
    END IF;
END $$;

-- 2. Verificar y crear vista worker_statistics si no existe
CREATE OR REPLACE VIEW worker_statistics AS
SELECT 
    w.id as worker_id,
    w.name as worker_name,
    w.email as worker_email,
    w.status as worker_status,
    COUNT(DISTINCT b.id) as total_bots,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT ch.id) as total_chats,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = true THEN m.id END) as sent_messages,
    COUNT(DISTINCT CASE WHEN m.from_me = false THEN m.id END) as received_messages,
    MAX(m.timestamp) as last_message_time
FROM workers w
LEFT JOIN bots b ON w.id = b.worker_id
LEFT JOIN contacts c ON b.id = c.bot_id
LEFT JOIN chats ch ON b.id = ch.bot_id
LEFT JOIN messages m ON b.id = m.bot_id
GROUP BY w.id, w.name, w.email, w.status;

-- 3. Verificar y crear vista bots_with_worker si no existe
CREATE OR REPLACE VIEW bots_with_worker AS
SELECT 
    b.*,
    w.name as worker_name,
    w.email as worker_email,
    w.status as worker_status
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;

-- 4. Verificar datos existentes
SELECT 
    'workers' as tabla,
    COUNT(*) as total_registros
FROM workers
UNION ALL
SELECT 
    'bots' as tabla,
    COUNT(*) as total_registros
FROM bots
UNION ALL
SELECT 
    'chats' as tabla,
    COUNT(*) as total_registros
FROM chats
UNION ALL
SELECT 
    'messages' as tabla,
    COUNT(*) as total_registros
FROM messages;

-- 5. Mostrar bots sin worker asignado
SELECT 
    id,
    session_name,
    phone_number,
    status,
    worker_id
FROM bots
WHERE worker_id IS NULL;

-- 6. Mostrar workers con conteo de bots
SELECT 
    w.id,
    w.name,
    w.email,
    w.status,
    COUNT(b.id) as total_bots
FROM workers w
LEFT JOIN bots b ON w.id = b.worker_id
GROUP BY w.id, w.name, w.email, w.status
ORDER BY w.name;
