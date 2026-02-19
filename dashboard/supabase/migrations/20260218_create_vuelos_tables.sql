-- Migración: Módulo de Gestión de Vuelos
-- Fecha: 2026-02-18
-- Descripción: Crea las tablas necesarias para el módulo de vuelos y su integración con anulables

-- =====================================================
-- TABLA: vuelos
-- =====================================================
CREATE TABLE IF NOT EXISTS vuelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  -- Información del PAX
  pax_nombre TEXT NOT NULL,
  num_adultos INTEGER DEFAULT 0 CHECK (num_adultos >= 0),
  num_ninos INTEGER DEFAULT 0 CHECK (num_ninos >= 0),
  num_infantes INTEGER DEFAULT 0 CHECK (num_infantes >= 0),
  contacto_nombre TEXT NOT NULL,
  contacto_telefono TEXT NOT NULL,
  
  -- Información del Vuelo
  fecha_vuelo DATE NOT NULL,
  ruta TEXT NOT NULL,
  horario TIME,
  aerolinea_codigo TEXT,
  aerolinea_nombre TEXT,
  localizador TEXT NOT NULL,
  proveedor TEXT NOT NULL,
  
  -- Información Financiera
  monto_venta DECIMAL(10,2) NOT NULL CHECK (monto_venta >= 0),
  monto_sabre DECIMAL(10,2) CHECK (monto_sabre >= 0),
  monto_expedia DECIMAL(10,2) CHECK (monto_expedia >= 0),
  monto_emision DECIMAL(10,2) CHECK (monto_emision >= 0),
  monto_fee DECIMAL(10,2),
  metodo_pago TEXT,
  
  -- Control de Tipo y Anulables
  tipo_vuelo TEXT NOT NULL CHECK (tipo_vuelo IN ('MIGRACION', 'TURISMO', 'NEGOCIOS', 'OTRO')),
  requiere_anulable BOOLEAN DEFAULT FALSE,
  anulable_id UUID,
  
  -- Observaciones
  observaciones TEXT,
  
  -- Constraint: Localizador único
  CONSTRAINT vuelos_localizador_unique UNIQUE(localizador)
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_vuelos_fecha ON vuelos(fecha_vuelo);
CREATE INDEX idx_vuelos_created_by ON vuelos(created_by);
CREATE INDEX idx_vuelos_tipo ON vuelos(tipo_vuelo);
CREATE INDEX idx_vuelos_anulable ON vuelos(anulable_id);
CREATE INDEX idx_vuelos_localizador ON vuelos(localizador);
CREATE INDEX idx_vuelos_pax_nombre ON vuelos(pax_nombre);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_vuelos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vuelos_updated_at
  BEFORE UPDATE ON vuelos
  FOR EACH ROW
  EXECUTE FUNCTION update_vuelos_updated_at();

-- =====================================================
-- TABLA: vuelos_adjuntos
-- =====================================================
CREATE TABLE IF NOT EXISTS vuelos_adjuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuelo_id UUID REFERENCES vuelos(id) ON DELETE CASCADE NOT NULL,
  tipo_adjunto TEXT NOT NULL CHECK (tipo_adjunto IN ('COMPROBANTE_PAGO', 'PASAPORTE')),
  nombre_archivo TEXT NOT NULL,
  url_storage TEXT NOT NULL,
  mime_type TEXT,
  tamano_bytes INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID NOT NULL
);

-- Índices para adjuntos
CREATE INDEX idx_vuelos_adjuntos_vuelo ON vuelos_adjuntos(vuelo_id);
CREATE INDEX idx_vuelos_adjuntos_tipo ON vuelos_adjuntos(tipo_adjunto);

-- =====================================================
-- TABLA: anulables (crear si no existe)
-- =====================================================
CREATE TABLE IF NOT EXISTS anulables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación con vuelo
  vuelo_id UUID REFERENCES vuelos(id),
  
  -- Información básica
  pax_nombre TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  fecha_vuelo DATE,
  ruta TEXT,
  localizador TEXT,
  
  -- Estado de anulación
  estado_anulacion TEXT DEFAULT 'PENDIENTE' CHECK (estado_anulacion IN ('PENDIENTE', 'ANULADO', 'NO_ANULADO')),
  fecha_limite DATE,
  fecha_anulacion DATE,
  monto_recuperado DECIMAL(10,2),
  
  -- Observaciones
  motivo_anulacion TEXT,
  observaciones TEXT,
  
  -- Asignación
  asignado_a UUID
);

-- Índices para anulables
CREATE INDEX IF NOT EXISTS idx_anulables_vuelo ON anulables(vuelo_id);
CREATE INDEX IF NOT EXISTS idx_anulables_estado ON anulables(estado_anulacion);
CREATE INDEX IF NOT EXISTS idx_anulables_fecha_limite ON anulables(fecha_limite);

-- Trigger para actualizar updated_at en anulables
CREATE OR REPLACE FUNCTION update_anulables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_anulables_updated_at ON anulables;
CREATE TRIGGER trigger_anulables_updated_at
  BEFORE UPDATE ON anulables
  FOR EACH ROW
  EXECUTE FUNCTION update_anulables_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en vuelos
ALTER TABLE vuelos ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver vuelos
CREATE POLICY "Usuarios autenticados pueden ver vuelos"
  ON vuelos FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: Usuarios autenticados pueden crear vuelos
CREATE POLICY "Usuarios autenticados pueden crear vuelos"
  ON vuelos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Usuarios autenticados pueden editar vuelos
CREATE POLICY "Usuarios autenticados pueden editar vuelos"
  ON vuelos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Política: Usuarios autenticados pueden eliminar vuelos
CREATE POLICY "Usuarios autenticados pueden eliminar vuelos"
  ON vuelos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Habilitar RLS en vuelos_adjuntos
ALTER TABLE vuelos_adjuntos ENABLE ROW LEVEL SECURITY;

-- Política: Ver adjuntos de vuelos accesibles
CREATE POLICY "Ver adjuntos de vuelos accesibles"
  ON vuelos_adjuntos FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: Usuarios autenticados pueden subir adjuntos
CREATE POLICY "Usuarios autenticados pueden subir adjuntos"
  ON vuelos_adjuntos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Usuarios autenticados pueden eliminar adjuntos
CREATE POLICY "Usuarios autenticados pueden eliminar adjuntos"
  ON vuelos_adjuntos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Habilitar RLS en anulables (si no está habilitado)
ALTER TABLE anulables ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver anulables
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver anulables" ON anulables;
CREATE POLICY "Usuarios autenticados pueden ver anulables"
  ON anulables FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: Usuarios autenticados pueden crear anulables
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear anulables" ON anulables;
CREATE POLICY "Usuarios autenticados pueden crear anulables"
  ON anulables FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Usuarios autenticados pueden editar anulables
DROP POLICY IF EXISTS "Usuarios autenticados pueden editar anulables" ON anulables;
CREATE POLICY "Usuarios autenticados pueden editar anulables"
  ON anulables FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================
COMMENT ON TABLE vuelos IS 'Tabla principal para gestión de vuelos pagados';
COMMENT ON TABLE vuelos_adjuntos IS 'Almacena referencias a archivos adjuntos (comprobantes y pasaportes)';
COMMENT ON TABLE anulables IS 'Gestión de casos de anulación de vuelos';

COMMENT ON COLUMN vuelos.tipo_vuelo IS 'Tipo de vuelo: MIGRACION, TURISMO, NEGOCIOS, OTRO';
COMMENT ON COLUMN vuelos.requiere_anulable IS 'Indica si el vuelo debe crear un caso en anulables';
COMMENT ON COLUMN vuelos.monto_fee IS 'Fee calculado: venta - sabre - expedia - emision';
COMMENT ON COLUMN vuelos_adjuntos.tipo_adjunto IS 'Tipo: COMPROBANTE_PAGO o PASAPORTE';
COMMENT ON COLUMN anulables.estado_anulacion IS 'Estado: PENDIENTE, ANULADO, NO_ANULADO';
