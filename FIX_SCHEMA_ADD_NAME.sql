-- ============================================
-- FIX: Agregar columna 'name' a la tabla bots
-- ============================================
-- Este script corrige la incompatibilidad entre
-- el schema y el backend Express
-- ============================================

-- Agregar columna 'name' a la tabla bots
ALTER TABLE bots 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Actualizar registros existentes para que name = session_name
UPDATE bots 
SET name = session_name 
WHERE name IS NULL;

-- Crear índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_bots_name ON bots(name);

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bots'
AND column_name = 'name';

SELECT '✅ Columna name agregada exitosamente a la tabla bots' as status;
