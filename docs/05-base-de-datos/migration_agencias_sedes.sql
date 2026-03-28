-- ============================================================
-- MIGRACIÓN: Sistema de Agencias y Sedes
-- Fecha: 2026-03-27
-- Descripción: Tablas para gestión de agencias, sedes y 
--              asociaciones de usuarios
-- ACCESO: Solo admin y super_admin pueden gestionar
-- ============================================================

-- 1. TABLA: agencias
CREATE TABLE IF NOT EXISTS agencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    logo_url TEXT,
    color_primario VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datos iniciales de agencias
INSERT INTO agencias (nombre, codigo, descripcion, color_primario) VALUES
('Nova', 'nova', 'Agencia principal Nova', '#6366f1'),
('Nova Flash', 'nova_flash', 'Agencia Nova Flash', '#8b5cf6'),
('Nova Colombia', 'nova_colombia', 'Agencia Nova Colombia', '#f59e0b'),
('Apolo', 'apolo', 'Agencia Apolo', '#ef4444')
ON CONFLICT (codigo) DO NOTHING;

-- 2. TABLA: sedes
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Venezuela',
    telefono VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datos iniciales de sedes
INSERT INTO sedes (nombre, codigo, ciudad, direccion, pais) VALUES
('Oficina del Parral', 'parral', 'Valencia', 'Centro Comercial El Parral', 'Venezuela'),
('Torre Seguro Los Andes', 'torre_seguro_andes', 'Valencia', 'Torre Seguro Los Andes', 'Venezuela')
ON CONFLICT (codigo) DO NOTHING;

-- 3. TABLA: usuario_agencias (relación N:M - un usuario puede pertenecer a varias agencias)
CREATE TABLE IF NOT EXISTS usuario_agencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agencia_id UUID NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    UNIQUE(user_id, agencia_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_agencias_user ON usuario_agencias(user_id);
CREATE INDEX IF NOT EXISTS idx_usuario_agencias_agencia ON usuario_agencias(agencia_id);

-- 4. Agregar sede_id a profiles (relación 1:1 - un usuario solo puede estar en una sede)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);
CREATE INDEX IF NOT EXISTS idx_profiles_sede ON profiles(sede_id);

-- 5. Trigger para updated_at en agencias
CREATE OR REPLACE FUNCTION update_agencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_agencias_updated_at ON agencias;
CREATE TRIGGER trigger_agencias_updated_at
    BEFORE UPDATE ON agencias
    FOR EACH ROW
    EXECUTE FUNCTION update_agencias_updated_at();

-- 6. Trigger para updated_at en sedes
CREATE OR REPLACE FUNCTION update_sedes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_sedes_updated_at ON sedes;
CREATE TRIGGER trigger_sedes_updated_at
    BEFORE UPDATE ON sedes
    FOR EACH ROW
    EXECUTE FUNCTION update_sedes_updated_at();

-- 7. RLS (Row Level Security) para agencias
ALTER TABLE agencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver agencias activas" ON agencias
    FOR SELECT USING (is_active = true);

CREATE POLICY "Solo admin puede insertar agencias" ON agencias
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Solo admin puede actualizar agencias" ON agencias
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Solo admin puede eliminar agencias" ON agencias
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- 8. RLS para sedes
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver sedes activas" ON sedes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Solo admin puede insertar sedes" ON sedes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Solo admin puede actualizar sedes" ON sedes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Solo admin puede eliminar sedes" ON sedes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- 9. RLS para usuario_agencias
ALTER TABLE usuario_agencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus agencias" ON usuario_agencias
    FOR SELECT USING (true);

CREATE POLICY "Solo admin puede gestionar usuario_agencias" ON usuario_agencias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );
