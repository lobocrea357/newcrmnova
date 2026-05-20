-- ============================================================================
-- Sistema de Eventos POC - Creación de Tablas
-- Archivo: 01-create-events-tables.sql
-- Propósito: Crear tablas poc_thread_events y poc_thread_status
-- ============================================================================

-- ============================================================================
-- TABLA: poc_thread_events
-- Almacena TODOS los eventos importantes del timeline
-- ============================================================================
CREATE TABLE IF NOT EXISTS poc_thread_events (
    -- Identificador único
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con el thread de conversación (sin FK por ahora)
    thread_id UUID NOT NULL,
    
    -- Tipo y subtipo de evento
    event_type VARCHAR(50) NOT NULL,
    event_subtype VARCHAR(50),
    
    -- Timestamps
    occurred_at TIMESTAMPTZ NOT NULL, -- Momento REAL del evento
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Momento en que se registró
    
    -- Quién creó el evento (NULL si fue generado automáticamente)
    created_by UUID,
    
    -- Datos específicos del evento (JSONB flexible)
    event_data JSONB DEFAULT '{}'::jsonb,
    
    -- Notas adicionales
    notes TEXT,
    
    -- Relaciones opcionales con otras tablas (sin FKs por ahora)
    related_message_id UUID,
    related_vuelo_id UUID,
    related_cotizacion_id UUID,
    
    -- Flags
    is_milestone BOOLEAN DEFAULT FALSE, -- Si debe destacarse en timeline
    is_system_generated BOOLEAN DEFAULT FALSE -- Si fue automático
);

-- Comentarios de la tabla
COMMENT ON TABLE poc_thread_events IS 'Almacena todos los eventos importantes del timeline de conversaciones POC';
COMMENT ON COLUMN poc_thread_events.thread_id IS 'ID del thread de conversación';
COMMENT ON COLUMN poc_thread_events.event_type IS 'Tipo de evento: SALE_CONFIRMED, QUOTATION_SENT, etc.';
COMMENT ON COLUMN poc_thread_events.event_subtype IS 'Subtipo: AUTO_DETECTED, MANUAL_MARK';
COMMENT ON COLUMN poc_thread_events.occurred_at IS 'Momento real en que ocurrió el evento';
COMMENT ON COLUMN poc_thread_events.created_at IS 'Momento en que se registró en el sistema';
COMMENT ON COLUMN poc_thread_events.created_by IS 'Usuario que creó el evento (NULL si automático)';
COMMENT ON COLUMN poc_thread_events.event_data IS 'Datos específicos del evento en formato JSONB';
COMMENT ON COLUMN poc_thread_events.notes IS 'Notas adicionales del evento';
COMMENT ON COLUMN poc_thread_events.related_message_id IS 'Mensaje relacionado (opcional)';
COMMENT ON COLUMN poc_thread_events.related_vuelo_id IS 'Vuelo relacionado (opcional)';
COMMENT ON COLUMN poc_thread_events.related_cotizacion_id IS 'Cotización relacionada (opcional)';
COMMENT ON COLUMN poc_thread_events.is_milestone IS 'Si debe destacarse visualmente en el timeline';
COMMENT ON COLUMN poc_thread_events.is_system_generated IS 'Si fue generado automáticamente por el sistema';

-- ============================================================================
-- TABLA: poc_thread_status
-- Estado actual y métricas agregadas de cada lead
-- ============================================================================
CREATE TABLE IF NOT EXISTS poc_thread_status (
    -- ID del thread (PK, sin FK por ahora)
    thread_id UUID PRIMARY KEY,
    
    -- Estado actual
    current_status VARCHAR(50) NOT NULL DEFAULT 'NUEVO',
    status_since TIMESTAMPTZ DEFAULT NOW(),
    previous_status VARCHAR(50),
    
    -- Métricas de ventas
    total_sales INTEGER DEFAULT 0,
    total_sales_amount NUMERIC(12, 2) DEFAULT 0,
    first_sale_at TIMESTAMPTZ,
    last_sale_at TIMESTAMPTZ,
    
    -- Métricas de actividad
    first_contact_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    
    -- Timestamp de actualización
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios de la tabla
COMMENT ON TABLE poc_thread_status IS 'Estado actual y métricas agregadas de cada lead POC';
COMMENT ON COLUMN poc_thread_status.thread_id IS 'ID del thread de conversación';
COMMENT ON COLUMN poc_thread_status.current_status IS 'Estado actual: NUEVO, EN_NEGOCIACION, VENTA_CONCRETADA, POST_VENTA, PERDIDO';
COMMENT ON COLUMN poc_thread_status.status_since IS 'Desde cuándo está en este estado';
COMMENT ON COLUMN poc_thread_status.previous_status IS 'Estado anterior';
COMMENT ON COLUMN poc_thread_status.total_sales IS 'Cantidad total de ventas';
COMMENT ON COLUMN poc_thread_status.total_sales_amount IS 'Suma total de montos vendidos';
COMMENT ON COLUMN poc_thread_status.first_sale_at IS 'Fecha de la primera venta';
COMMENT ON COLUMN poc_thread_status.last_sale_at IS 'Fecha de la última venta';
COMMENT ON COLUMN poc_thread_status.first_contact_at IS 'Fecha del primer contacto';
COMMENT ON COLUMN poc_thread_status.last_activity_at IS 'Fecha de la última actividad';
COMMENT ON COLUMN poc_thread_status.updated_at IS 'Última actualización de métricas';

-- ============================================================================
-- CONSTRAINTS DE VALIDACIÓN
-- ============================================================================

-- Validar tipos de eventos permitidos
ALTER TABLE poc_thread_events 
ADD CONSTRAINT chk_event_type 
CHECK (event_type IN (
    'SALE_CONFIRMED',
    'SALE_CANCELLED',
    'QUOTATION_SENT',
    'QUOTATION_ACCEPTED',
    'MEETING_SCHEDULED',
    'CALL_MADE',
    'LEAD_LOST',
    'LEAD_REACTIVATED',
    'REASSIGNMENT',
    'NOTE_ADDED',
    'STATUS_CHANGED'
));

-- Validar subtipos de eventos permitidos
ALTER TABLE poc_thread_events 
ADD CONSTRAINT chk_event_subtype 
CHECK (event_subtype IS NULL OR event_subtype IN (
    'AUTO_DETECTED',
    'MANUAL_MARK'
));

-- Validar estados de lead permitidos
ALTER TABLE poc_thread_status 
ADD CONSTRAINT chk_current_status 
CHECK (current_status IN (
    'NUEVO',
    'EN_NEGOCIACION',
    'VENTA_CONCRETADA',
    'POST_VENTA',
    'PERDIDO'
));

-- Validar que total_sales no sea negativo
ALTER TABLE poc_thread_status 
ADD CONSTRAINT chk_total_sales_positive 
CHECK (total_sales >= 0);

-- Validar que total_sales_amount no sea negativo
ALTER TABLE poc_thread_status 
ADD CONSTRAINT chk_total_sales_amount_positive 
CHECK (total_sales_amount >= 0);

-- ============================================================================
-- ÍNDICES BÁSICOS (Índices adicionales en archivo 03)
-- ============================================================================

-- Índice para búsquedas por thread_id
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_thread_id 
ON poc_thread_events(thread_id);

-- Índice para orden cronológico
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_occurred_at 
ON poc_thread_events(occurred_at DESC);

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Success. No rows returned
-- ============================================================================
