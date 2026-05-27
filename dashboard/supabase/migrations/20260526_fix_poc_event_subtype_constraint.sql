-- Migración: Fix constraint chk_event_subtype para permitir AUTO_DETECTED_HISTORICAL
-- Fecha: 2026-05-26
-- Descripción: Agrega 'AUTO_DETECTED_HISTORICAL' como valor permitido en event_subtype
-- Root Cause: Sincronización histórica de ventas fallaba por constraint violation

-- =====================================================
-- PASO 1: Eliminar constraint existente
-- =====================================================
ALTER TABLE poc_thread_events 
DROP CONSTRAINT IF EXISTS chk_event_subtype;

-- =====================================================
-- PASO 2: Crear nuevo constraint con valores actualizados
-- =====================================================
ALTER TABLE poc_thread_events 
ADD CONSTRAINT chk_event_subtype 
CHECK (event_subtype IS NULL OR event_subtype IN (
    'AUTO_DETECTED',
    'AUTO_DETECTED_HISTORICAL',
    'MANUAL_MARK'
));

-- =====================================================
-- COMENTARIO: Nuevos valores permitidos
-- =====================================================
COMMENT ON CONSTRAINT chk_event_subtype ON poc_thread_events IS 
'Valores permitidos: NULL, AUTO_DETECTED (detectado en tiempo real), AUTO_DETECTED_HISTORICAL (detectado en sincronización histórica), MANUAL_MARK (marcado manualmente por usuario)';
