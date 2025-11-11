-- ============================================
-- CORRECCIÓN: Agregar columna 'name' a tabla chats
-- ============================================
-- Ejecutar ANTES de FIX_CHATS_Y_VISTAS.sql
-- ============================================

-- Verificar si la columna existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'name'
    ) THEN
        -- Agregar columna name si no existe
        ALTER TABLE chats ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Columna name agregada a tabla chats';
    ELSE
        RAISE NOTICE 'Columna name ya existe en tabla chats';
    END IF;
END $$;

-- Actualizar chats existentes con nombre del contacto
UPDATE chats ch
SET name = c.name
FROM contacts c
WHERE ch.contact_id = c.id
AND ch.name IS NULL
AND c.name IS NOT NULL;

-- Crear índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_chats_name ON chats(name);

-- Verificar resultado
SELECT 
    'Columna name en chats' as tabla,
    COUNT(*) as total_chats,
    COUNT(name) as chats_con_nombre,
    COUNT(*) - COUNT(name) as chats_sin_nombre
FROM chats;

SELECT '✅ Columna name agregada exitosamente a tabla chats' as status;
