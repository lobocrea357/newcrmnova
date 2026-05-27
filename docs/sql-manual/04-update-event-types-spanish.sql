-- ============================================================================
-- Actualizar Tipos de Eventos a Español
-- Archivo: 04-update-event-types-spanish.sql
-- Propósito: Cambiar nombres de tipos de eventos de inglés a español
-- ============================================================================

-- ============================================================================
-- PASO 1: Eliminar constraint existente
-- ============================================================================
ALTER TABLE poc_thread_events 
DROP CONSTRAINT IF EXISTS chk_event_type;

-- ============================================================================
-- PASO 2: Actualizar datos existentes (si hay eventos creados)
-- IMPORTANTE: Debe ejecutarse ANTES de crear el nuevo constraint
-- ============================================================================
UPDATE poc_thread_events SET event_type = 'VENTA_CONFIRMADA' WHERE event_type = 'SALE_CONFIRMED';
UPDATE poc_thread_events SET event_type = 'VENTA_CANCELADA' WHERE event_type = 'SALE_CANCELLED';
UPDATE poc_thread_events SET event_type = 'COTIZACION_ENVIADA' WHERE event_type = 'QUOTATION_SENT';
UPDATE poc_thread_events SET event_type = 'COTIZACION_ACEPTADA' WHERE event_type = 'QUOTATION_ACCEPTED';
UPDATE poc_thread_events SET event_type = 'REUNION_AGENDADA' WHERE event_type = 'MEETING_SCHEDULED';
UPDATE poc_thread_events SET event_type = 'LLAMADA_REALIZADA' WHERE event_type = 'CALL_MADE';
UPDATE poc_thread_events SET event_type = 'LEAD_PERDIDO' WHERE event_type = 'LEAD_LOST';
UPDATE poc_thread_events SET event_type = 'LEAD_REACTIVADO' WHERE event_type = 'LEAD_REACTIVATED';
UPDATE poc_thread_events SET event_type = 'REASIGNACION' WHERE event_type = 'REASSIGNMENT';
UPDATE poc_thread_events SET event_type = 'NOTA_AGREGADA' WHERE event_type = 'NOTE_ADDED';
UPDATE poc_thread_events SET event_type = 'ESTADO_CAMBIADO' WHERE event_type = 'STATUS_CHANGED';

-- ============================================================================
-- PASO 3: Crear nuevo constraint con nombres en español
-- ============================================================================
ALTER TABLE poc_thread_events 
ADD CONSTRAINT chk_event_type 
CHECK (event_type IN (
    'VENTA_CONFIRMADA',
    'VENTA_CANCELADA',
    'COTIZACION_ENVIADA',
    'COTIZACION_ACEPTADA',
    'REUNION_AGENDADA',
    'LLAMADA_REALIZADA',
    'LEAD_PERDIDO',
    'LEAD_REACTIVADO',
    'REASIGNACION',
    'NOTA_AGREGADA',
    'ESTADO_CAMBIADO'
));

-- ============================================================================
-- PASO 4: Actualizar comentario de columna
-- ============================================================================
COMMENT ON COLUMN poc_thread_events.event_type IS 'Tipo de evento: VENTA_CONFIRMADA, COTIZACION_ENVIADA, etc.';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT DISTINCT event_type FROM poc_thread_events ORDER BY event_type;
