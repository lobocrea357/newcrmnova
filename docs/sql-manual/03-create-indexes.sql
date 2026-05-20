-- ============================================================================
-- Sistema de Eventos POC - Índices Optimizados
-- Archivo: 03-create-indexes.sql
-- Propósito: Optimizar queries con índices para performance
-- ============================================================================

-- ============================================================================
-- ÍNDICES PARA poc_thread_events
-- ============================================================================

-- Índice 1: Búsquedas por thread + orden cronológico (timeline)
-- Este es el índice más crítico para el timeline enriquecido
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_thread_occurred
ON poc_thread_events(thread_id, occurred_at DESC);

-- Índice 2: Búsquedas de ventas (event_type filtrado)
-- Optimiza queries que buscan solo ventas
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_sales
ON poc_thread_events(thread_id, event_type)
WHERE event_type IN ('SALE_CONFIRMED', 'SALE_CANCELLED');

-- Índice 3: Búsquedas por tipo de evento
-- Optimiza filtros por tipo de evento específico
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_event_type
ON poc_thread_events(event_type, occurred_at DESC);

-- Índice 4: Búsquedas por creador (auditoría)
-- Optimiza queries de auditoría por usuario
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_created_by
ON poc_thread_events(created_by, created_at DESC)
WHERE created_by IS NOT NULL;

-- Índice 5: Búsquedas de hitos (milestones)
-- Optimiza queries que filtran solo eventos destacados
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_milestones
ON poc_thread_events(thread_id, occurred_at DESC)
WHERE is_milestone = TRUE;

-- Índice 6: Búsquedas por vuelo relacionado
-- Optimiza joins con tabla vuelos
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_vuelo_id
ON poc_thread_events(related_vuelo_id)
WHERE related_vuelo_id IS NOT NULL;

-- Índice 7: Búsquedas por cotización relacionada
-- Optimiza joins con tabla cotizaciones
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_cotizacion_id
ON poc_thread_events(related_cotizacion_id)
WHERE related_cotizacion_id IS NOT NULL;

-- ============================================================================
-- ÍNDICES PARA poc_thread_status
-- ============================================================================

-- Índice 1: Búsquedas por estado actual
-- Optimiza filtros por estado en listas de threads
CREATE INDEX IF NOT EXISTS idx_poc_thread_status_current_status
ON poc_thread_status(current_status);

-- Índice 2: Threads con ventas (filtrado)
-- Optimiza queries que buscan solo threads con ventas
CREATE INDEX IF NOT EXISTS idx_poc_thread_status_sales
ON poc_thread_status(total_sales DESC)
WHERE total_sales > 0;

-- Índice 3: Última actividad (para ordenamiento)
-- Optimiza ordenamiento por última actividad en dashboards
CREATE INDEX IF NOT EXISTS idx_poc_thread_status_last_activity
ON poc_thread_status(last_activity_at DESC);

-- Índice 4: Threads en post-venta
-- Optimiza queries de seguimiento post-venta
CREATE INDEX IF NOT EXISTS idx_poc_thread_status_post_venta
ON poc_thread_status(thread_id, last_sale_at DESC)
WHERE current_status = 'POST_VENTA';

-- Índice 5: Primer contacto (para análisis de tiempo de respuesta)
-- Optimiza análisis de tiempo desde primer contacto
CREATE INDEX IF NOT EXISTS idx_poc_thread_status_first_contact
ON poc_thread_status(first_contact_at DESC);

-- ============================================================================
-- ÍNDICES GIN para JSONB (búsquedas en event_data)
-- ============================================================================

-- Índice GIN para búsquedas en event_data
-- Permite búsquedas eficientes dentro del JSONB
CREATE INDEX IF NOT EXISTS idx_poc_thread_events_event_data_gin
ON poc_thread_events USING GIN (event_data);

-- ============================================================================
-- COMENTARIOS DE ÍNDICES
-- ============================================================================

COMMENT ON INDEX idx_poc_thread_events_thread_occurred IS 'Índice crítico para timeline enriquecido: thread_id + orden cronológico';
COMMENT ON INDEX idx_poc_thread_events_sales IS 'Índice para búsquedas de ventas: filtrado por event_type';
COMMENT ON INDEX idx_poc_thread_events_event_type IS 'Índice para filtros por tipo de evento específico';
COMMENT ON INDEX idx_poc_thread_events_created_by IS 'Índice para auditoría: eventos por creador';
COMMENT ON INDEX idx_poc_thread_events_milestones IS 'Índice para hitos destacados: is_milestone = TRUE';
COMMENT ON INDEX idx_poc_thread_events_vuelo_id IS 'Índice para joins con tabla vuelos';
COMMENT ON INDEX idx_poc_thread_events_cotizacion_id IS 'Índice para joins con tabla cotizaciones';
COMMENT ON INDEX idx_poc_thread_status_current_status IS 'Índice para filtros por estado actual';
COMMENT ON INDEX idx_poc_thread_status_sales IS 'Índice para threads con ventas: total_sales > 0';
COMMENT ON INDEX idx_poc_thread_status_last_activity IS 'Índice para ordenamiento por última actividad';
COMMENT ON INDEX idx_poc_thread_status_post_venta IS 'Índice para seguimiento post-venta';
COMMENT ON INDEX idx_poc_thread_status_first_contact IS 'Índice para análisis de tiempo de respuesta';
COMMENT ON INDEX idx_poc_thread_events_event_data_gin IS 'Índice GIN para búsquedas en JSONB event_data';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Success. No rows returned
-- ============================================================================
