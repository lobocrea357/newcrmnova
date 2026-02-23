-- ============================================
-- VERIFICACIÓN Y CREACIÓN DE TABLA conversation_evaluations
-- ============================================

-- Verificar si la tabla existe
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_evaluations'
    ) THEN
        RAISE NOTICE '✅ La tabla conversation_evaluations YA EXISTE';
    ELSE
        RAISE NOTICE '❌ La tabla conversation_evaluations NO EXISTE - Se creará ahora';
    END IF;
END $$;

-- Mostrar columnas si existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_evaluations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Si no existe, mostrar mensaje
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_evaluations'
    ) THEN
        RAISE NOTICE '⚠️ ACCIÓN REQUERIDA: Ejecuta el archivo SALES_DATABASE_MIGRATION_COMPATIBLE.sql';
        RAISE NOTICE '   Este archivo contiene la definición completa de la tabla';
    END IF;
END $$;
