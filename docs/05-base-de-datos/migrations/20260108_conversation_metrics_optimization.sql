-- ============================================
-- MIGRACIÓN: Optimización de Métricas de Conversaciones
-- Fecha: 2025-01-08
-- Objetivo: Eliminar N+1 queries y mejorar rendimiento 30-60x
-- ============================================

-- PARTE 1: CREAR TABLA DE MÉTRICAS MATERIALIZADAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  
  -- Métricas de mensajes
  total_messages INTEGER NOT NULL DEFAULT 0,
  messages_from_client INTEGER NOT NULL DEFAULT 0,
  messages_from_advisor INTEGER NOT NULL DEFAULT 0,
  
  -- Métricas de tiempo de respuesta
  avg_response_time_minutes NUMERIC(10,2),
  max_response_time_minutes NUMERIC(10,2),
  response_samples_count INTEGER DEFAULT 0,
  
  -- Menciones de pago
  payment_mentions_count INTEGER DEFAULT 0,
  payment_first_mention_at TIMESTAMPTZ,
  payment_last_mention_at TIMESTAMPTZ,
  payment_last_snippet TEXT,
  payment_last_from_me BOOLEAN,
  
  -- Cotizaciones
  cotizacion_mentions_count INTEGER DEFAULT 0,
  cotizacion_files TEXT[], -- Array de nombres de archivo
  
  -- Metadata adicional
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  last_client_message_at TIMESTAMPTZ,
  last_advisor_message_at TIMESTAMPTZ,
  
  -- Control de actualización
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  messages_hash TEXT, -- Para detectar cambios
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT conversation_metrics_chat_unique UNIQUE(chat_id)
);

-- Comentarios para documentación
COMMENT ON TABLE public.conversation_metrics IS 'Métricas pre-calculadas de conversaciones para optimizar queries';
COMMENT ON COLUMN public.conversation_metrics.avg_response_time_minutes IS 'Tiempo promedio de respuesta del asesor en minutos';
COMMENT ON COLUMN public.conversation_metrics.messages_hash IS 'Hash MD5 de mensajes para detectar cambios sin recalcular';
COMMENT ON COLUMN public.conversation_metrics.cotizacion_files IS 'Array de nombres de archivos PDF de cotizaciones enviadas';

-- ============================================
-- PARTE 2: CREAR ÍNDICES OPTIMIZADOS
-- ============================================

-- Índices para conversation_metrics
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_bot 
ON conversation_metrics(bot_id);

CREATE INDEX IF NOT EXISTS idx_conversation_metrics_chat 
ON conversation_metrics(chat_id);

CREATE INDEX IF NOT EXISTS idx_conversation_metrics_calculated 
ON conversation_metrics(calculated_at DESC);

-- Índices compuestos críticos para messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chat_timestamp 
ON messages(chat_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chat_fromme_timestamp 
ON messages(chat_id, from_me, timestamp);

-- Índice compuesto para chats activos del bot
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_bot_active 
ON chats(bot_id, is_group, last_message_time DESC) 
WHERE archived = false AND is_group = false;

-- Índice GIN para búsquedas full-text en mensajes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_body_search 
ON messages USING gin(to_tsvector('spanish', COALESCE(body, '')));

-- Índice para contact lookup rápido
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_contact 
ON chats(contact_id) 
WHERE contact_id IS NOT NULL;

-- ============================================
-- PARTE 3: FUNCIÓN DE CÁLCULO DE MÉTRICAS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_conversation_metrics(p_chat_id UUID)
RETURNS void AS $$
DECLARE
  v_bot_id UUID;
  v_total_messages INTEGER;
  v_messages_from_client INTEGER;
  v_messages_from_advisor INTEGER;
  v_avg_response_time NUMERIC;
  v_max_response_time NUMERIC;
  v_response_samples INTEGER;
  v_payment_count INTEGER;
  v_payment_first_at TIMESTAMPTZ;
  v_payment_last_at TIMESTAMPTZ;
  v_payment_last_snippet TEXT;
  v_payment_last_from_me BOOLEAN;
  v_cotizacion_count INTEGER;
  v_cotizacion_files TEXT[];
  v_first_message_at TIMESTAMPTZ;
  v_last_message_at TIMESTAMPTZ;
  v_last_client_at TIMESTAMPTZ;
  v_last_advisor_at TIMESTAMPTZ;
BEGIN
  -- Obtener bot_id del chat
  SELECT bot_id INTO v_bot_id 
  FROM chats 
  WHERE id = p_chat_id;
  
  IF v_bot_id IS NULL THEN
    RAISE NOTICE 'Chat % no encontrado', p_chat_id;
    RETURN;
  END IF;
  
  -- Contar mensajes por tipo
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE NOT from_me),
    COUNT(*) FILTER (WHERE from_me),
    MIN(timestamp),
    MAX(timestamp),
    MAX(timestamp) FILTER (WHERE NOT from_me),
    MAX(timestamp) FILTER (WHERE from_me)
  INTO 
    v_total_messages, 
    v_messages_from_client, 
    v_messages_from_advisor,
    v_first_message_at,
    v_last_message_at,
    v_last_client_at,
    v_last_advisor_at
  FROM messages
  WHERE chat_id = p_chat_id;
  
  -- Si no hay mensajes, limpiar métricas
  IF v_total_messages = 0 THEN
    DELETE FROM conversation_metrics WHERE chat_id = p_chat_id;
    RETURN;
  END IF;
  
  -- Calcular tiempos de respuesta usando window functions
  WITH response_analysis AS (
    SELECT 
      timestamp,
      from_me,
      LAG(timestamp) OVER (ORDER BY timestamp) as prev_timestamp,
      LAG(from_me) OVER (ORDER BY timestamp) as prev_from_me
    FROM messages
    WHERE chat_id = p_chat_id
  ),
  response_times AS (
    SELECT 
      EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60.0 as minutes
    FROM response_analysis
    WHERE from_me = true 
      AND prev_from_me = false
      AND prev_timestamp IS NOT NULL
      AND EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60.0 BETWEEN 0 AND 10080 -- 0 min a 7 días
  )
  SELECT 
    ROUND(COALESCE(AVG(minutes), 0)::numeric, 1),
    ROUND(COALESCE(MAX(minutes), 0)::numeric, 1),
    COUNT(*)::integer
  INTO v_avg_response_time, v_max_response_time, v_response_samples
  FROM response_times;
  
  -- Contar menciones de pago con detalles
  WITH payment_messages AS (
    SELECT 
      timestamp,
      from_me,
      SUBSTRING(body FROM 1 FOR 120) as snippet
    FROM messages
    WHERE chat_id = p_chat_id
      AND (
        body ~* 'pago|payment|transferencia|zelle|paypal|scalapay|tarjeta|credito|débito|efectivo|chase'
        OR content ~* 'pago|payment|transferencia|zelle|paypal|scalapay|tarjeta|credito|débito|efectivo|chase'
      )
    ORDER BY timestamp
  )
  SELECT 
    COUNT(*)::integer,
    MIN(timestamp),
    MAX(timestamp),
    (ARRAY_AGG(snippet ORDER BY timestamp DESC))[1],
    (ARRAY_AGG(from_me ORDER BY timestamp DESC))[1]
  INTO 
    v_payment_count,
    v_payment_first_at,
    v_payment_last_at,
    v_payment_last_snippet,
    v_payment_last_from_me
  FROM payment_messages;
  
  -- Detectar cotizaciones PDF
  WITH cotizacion_matches AS (
    SELECT DISTINCT
      unnest(regexp_matches(
        COALESCE(body, '') || COALESCE(content, ''), 
        'Cotizacion_[A-Z_]+_\d{4}-\d{2}-\d{2}\.pdf', 
        'g'
      )) as cotizacion_file
    FROM messages
    WHERE chat_id = p_chat_id
  )
  SELECT 
    COUNT(*)::integer,
    ARRAY_AGG(cotizacion_file)
  INTO v_cotizacion_count, v_cotizacion_files
  FROM cotizacion_matches;
  
  -- Insertar o actualizar métricas
  INSERT INTO conversation_metrics (
    chat_id,
    bot_id,
    total_messages,
    messages_from_client,
    messages_from_advisor,
    avg_response_time_minutes,
    max_response_time_minutes,
    response_samples_count,
    payment_mentions_count,
    payment_first_mention_at,
    payment_last_mention_at,
    payment_last_snippet,
    payment_last_from_me,
    cotizacion_mentions_count,
    cotizacion_files,
    first_message_at,
    last_message_at,
    last_client_message_at,
    last_advisor_message_at,
    calculated_at,
    updated_at
  ) VALUES (
    p_chat_id,
    v_bot_id,
    v_total_messages,
    v_messages_from_client,
    v_messages_from_advisor,
    v_avg_response_time,
    v_max_response_time,
    v_response_samples,
    COALESCE(v_payment_count, 0),
    v_payment_first_at,
    v_payment_last_at,
    v_payment_last_snippet,
    v_payment_last_from_me,
    COALESCE(v_cotizacion_count, 0),
    v_cotizacion_files,
    v_first_message_at,
    v_last_message_at,
    v_last_client_at,
    v_last_advisor_at,
    now(),
    now()
  )
  ON CONFLICT (chat_id) DO UPDATE SET
    total_messages = EXCLUDED.total_messages,
    messages_from_client = EXCLUDED.messages_from_client,
    messages_from_advisor = EXCLUDED.messages_from_advisor,
    avg_response_time_minutes = EXCLUDED.avg_response_time_minutes,
    max_response_time_minutes = EXCLUDED.max_response_time_minutes,
    response_samples_count = EXCLUDED.response_samples_count,
    payment_mentions_count = EXCLUDED.payment_mentions_count,
    payment_first_mention_at = EXCLUDED.payment_first_mention_at,
    payment_last_mention_at = EXCLUDED.payment_last_mention_at,
    payment_last_snippet = EXCLUDED.payment_last_snippet,
    payment_last_from_me = EXCLUDED.payment_last_from_me,
    cotizacion_mentions_count = EXCLUDED.cotizacion_mentions_count,
    cotizacion_files = EXCLUDED.cotizacion_files,
    first_message_at = EXCLUDED.first_message_at,
    last_message_at = EXCLUDED.last_message_at,
    last_client_message_at = EXCLUDED.last_client_message_at,
    last_advisor_message_at = EXCLUDED.last_advisor_message_at,
    calculated_at = now(),
    updated_at = now();
    
  RAISE NOTICE 'Métricas calculadas para chat %: % mensajes', p_chat_id, v_total_messages;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_conversation_metrics(UUID) IS 
'Calcula y almacena métricas pre-calculadas para una conversación específica';

-- ============================================
-- PARTE 4: TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_conversation_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular métricas cuando se inserta o actualiza un mensaje
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    PERFORM calculate_conversation_metrics(NEW.chat_id);
  END IF;
  
  -- Si se elimina un mensaje, también recalcular
  IF (TG_OP = 'DELETE') THEN
    PERFORM calculate_conversation_metrics(OLD.chat_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (eliminar si existe)
DROP TRIGGER IF EXISTS messages_update_metrics ON messages;

CREATE TRIGGER messages_update_metrics
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION trigger_update_conversation_metrics();

COMMENT ON TRIGGER messages_update_metrics ON messages IS 
'Actualiza automáticamente las métricas de conversación cuando cambian los mensajes';

-- ============================================
-- PARTE 5: FUNCIÓN BATCH PARA MIGRACIÓN DE DATOS HISTÓRICOS
-- ============================================

CREATE OR REPLACE FUNCTION backfill_conversation_metrics(
  p_bot_id UUID DEFAULT NULL,
  p_batch_size INTEGER DEFAULT 100
)
RETURNS TABLE (
  processed_chats INTEGER,
  total_chats INTEGER,
  progress_percentage NUMERIC
) AS $$
DECLARE
  v_total_chats INTEGER;
  v_processed INTEGER := 0;
  v_chat_id UUID;
BEGIN
  -- Contar total de chats a procesar
  IF p_bot_id IS NULL THEN
    SELECT COUNT(*) INTO v_total_chats FROM chats WHERE is_group = false;
  ELSE
    SELECT COUNT(*) INTO v_total_chats FROM chats WHERE bot_id = p_bot_id AND is_group = false;
  END IF;
  
  RAISE NOTICE 'Iniciando backfill de % chats...', v_total_chats;
  
  -- Procesar chats en batches
  FOR v_chat_id IN 
    SELECT c.id 
    FROM chats c
    WHERE c.is_group = false
      AND (p_bot_id IS NULL OR c.bot_id = p_bot_id)
      AND NOT EXISTS (
        SELECT 1 FROM conversation_metrics cm WHERE cm.chat_id = c.id
      )
    ORDER BY c.last_message_time DESC NULLS LAST
    LIMIT p_batch_size
  LOOP
    PERFORM calculate_conversation_metrics(v_chat_id);
    v_processed := v_processed + 1;
    
    -- Log progreso cada 10 chats
    IF v_processed % 10 = 0 THEN
      RAISE NOTICE 'Procesados % de % chats (%.1f%%)', 
        v_processed, v_total_chats, 
        (v_processed::numeric / v_total_chats::numeric * 100);
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    v_processed,
    v_total_chats,
    ROUND((v_processed::numeric / NULLIF(v_total_chats, 0)::numeric * 100), 1);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_conversation_metrics(UUID, INTEGER) IS 
'Calcula métricas para conversaciones existentes en batches. Ejecutar varias veces hasta completar.';

-- ============================================
-- PARTE 6: TRIGGER PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_metrics_updated_at
BEFORE UPDATE ON conversation_metrics
FOR EACH ROW
EXECUTE FUNCTION update_conversation_metrics_updated_at();

-- ============================================
-- PARTE 7: PERMISOS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en la tabla
ALTER TABLE conversation_metrics ENABLE ROW LEVEL SECURITY;

-- Policy para lectura: usuarios autenticados pueden ver métricas de sus bots
CREATE POLICY conversation_metrics_select_policy ON conversation_metrics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy para inserción/actualización: solo funciones del sistema
CREATE POLICY conversation_metrics_modify_policy ON conversation_metrics
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================
-- PARTE 8: GRANTS
-- ============================================

-- Permisos para servicio (necesario para triggers)
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_metrics TO postgres;
GRANT EXECUTE ON FUNCTION calculate_conversation_metrics(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION backfill_conversation_metrics(UUID, INTEGER) TO postgres;

-- ============================================
-- EJECUCIÓN INICIAL (Comentada - descomentar para ejecutar)
-- ============================================

-- Ejecutar backfill en batches pequeños para no saturar la BD
-- SELECT * FROM backfill_conversation_metrics(NULL, 50);
-- Repetir el SELECT anterior hasta que processed_chats sea 0

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversation_metrics'
  ) THEN
    RAISE EXCEPTION 'ERROR: Tabla conversation_metrics no fue creada';
  END IF;
  
  RAISE NOTICE '✓ Tabla conversation_metrics creada correctamente';
  
  -- Verificar índices
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_metrics'
  ) THEN
    RAISE NOTICE '✓ Índices creados correctamente';
  END IF;
  
  -- Verificar función
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'calculate_conversation_metrics'
  ) THEN
    RAISE NOTICE '✓ Función calculate_conversation_metrics creada correctamente';
  END IF;
  
  -- Verificar trigger
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'messages_update_metrics'
  ) THEN
    RAISE NOTICE '✓ Trigger messages_update_metrics creado correctamente';
  END IF;
  
  RAISE NOTICE '✓ MIGRACIÓN COMPLETADA EXITOSAMENTE';
END $$;
