-- ============================================
-- MIGRACIÓN: AGREGAR TABLA DE WORKERS
-- ============================================

-- Tabla de Workers (Trabajadores/Agentes)
CREATE TABLE IF NOT EXISTS workers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    role VARCHAR(50) DEFAULT 'agent',
    status VARCHAR(50) DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Agregar columna worker_id a la tabla bots
ALTER TABLE bots ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES workers(id) ON DELETE SET NULL;

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_workers_email ON workers(email);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_bots_worker_id ON bots(worker_id);

-- Función para actualizar updated_at en workers
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS en workers
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones con service_role
CREATE POLICY "Enable all for service role" ON workers FOR ALL USING (true);

-- ============================================
-- VISTA ACTUALIZADA: Estadísticas por Worker
-- ============================================

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

-- ============================================
-- VISTA ACTUALIZADA: Bots con información de Worker
-- ============================================

CREATE OR REPLACE VIEW bots_with_worker AS
SELECT 
    b.*,
    w.name as worker_name,
    w.email as worker_email,
    w.status as worker_status
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;

-- Comentarios
COMMENT ON TABLE workers IS 'Almacena información de los trabajadores/agentes que gestionan los bots';
COMMENT ON COLUMN bots.worker_id IS 'Referencia al trabajador asignado a este bot';
