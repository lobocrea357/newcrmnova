-- ========================================
-- MIGRATION: Eliminar columnas obsoletas de tabla vuelos
-- Fecha: 2026-03-15
-- Descripción: Elimina columnas del sistema antiguo que ya no se usan
--              con el nuevo sistema de cotizaciones integrado
-- ========================================

-- IMPORTANTE: Hacer backup antes de ejecutar
-- pg_dump -U postgres -d tu_db -t vuelos > backup_vuelos_20260315.sql

-- 1. Eliminar columnas de montos antiguos (ya no se usan)
ALTER TABLE public.vuelos 
DROP COLUMN IF EXISTS monto_sabre;

ALTER TABLE public.vuelos 
DROP COLUMN IF EXISTS monto_expedia;

ALTER TABLE public.vuelos 
DROP COLUMN IF EXISTS monto_emision;

ALTER TABLE public.vuelos 
DROP COLUMN IF EXISTS monto_fee;

-- NOTA: aerolinea_codigo y requiere_anulable se mantienen para uso futuro

-- ========================================
-- VERIFICACIÓN: Confirmar que las columnas fueron eliminadas
-- ========================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'vuelos' 
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- ========================================
-- FIN DE MIGRATION
-- ========================================
