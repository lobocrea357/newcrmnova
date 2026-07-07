-- ============================================
-- MIGRACIÓN: Optimización de Conversaciones
-- Fecha: 2026-05-10
-- Propósito: Crear tabla conversation_metrics y optimizar queries
-- ============================================

-- ============================================
-- TABLA: conversation_metrics
-- Propósito: Almacenar métricas precalculadas de conversaciones
-- Actualización: Trigger automático al insertar/actualizar mensajes
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversation_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  
  -- Contadores básicos
  total_messages integer NOT NULL DEFAULT 0,
  incoming_messages integer NOT NULL DEFAULT 0,
  outgoing_messages integer NOT NULL DEFAULT 0,
  
  -- Métricas de respuesta
  avg_response_time_minutes numeric,
  max_response_time_minutes numeric,
  response_samples integer DEFAULT 0,
  
  -- Menciones de métodos de pago
  payment_mentions_count integer DEFAULT 0,
  payment_first_mention_at timestamp with time zone,
  payment_last_mention_at timestamp with time zone,
  payment_last_from_me boolean,
  
  -- Cotizaciones PDF
  cotizacion_mentions_count integer DEFAULT 0,
  cotizacion_files jsonb DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT conversation_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_metrics_chat_id_unique UNIQUE (chat_id)
);

-- Índices para performance
CREATE INDEX idx_conv_metrics_chat_id ON public.conversation_metrics(chat_id);
CREATE INDEX idx_conv_metrics_avg_response ON public.conversation_metrics(avg_response_time_minutes) 
  WHERE avg_response_time_minutes IS NOT NULL;
CREATE INDEX idx_conv_metrics_payment_count ON public.conversation_metrics(payment_mentions_count) 
  WHERE payment_mentions_count > 0;
CREATE INDEX idx_conv_metrics_cotizacion_count ON public.conversation_metrics(cotizacion_mentions_count) 
  WHERE cotizacion_mentions_count > 0;

-- Comentarios
COMMENT ON TABLE public.conversation_metrics IS 'Métricas precalculadas de conversaciones para optimizar queries';
COMMENT ON COLUMN public.conversation_metrics.avg_response_time_minutes IS 'Tiempo promedio de respuesta del bot en minutos';
COMMENT ON COLUMN public.conversation_metrics.payment_mentions_count IS 'Cantidad de veces que se mencionaron métodos de pago';
COMMENT ON COLUMN public.conversation_metrics.cotizacion_mentions_count IS 'Cantidad de PDFs de cotización enviados';

-- ============================================
-- ÍNDICES CRÍTICOS PARA MENSAJES
-- ============================================

-- Índice compuesto para queries por chat ordenados por tiempo
CREATE INDEX IF NOT EXISTS idx_messages_chat_timestamp 
  ON public.messages(chat_id, timestamp DESC);

-- Índice para calcular tiempos de respuesta (filtrar por from_me)
CREATE INDEX IF NOT EXISTS idx_messages_chat_fromme_timestamp 
  ON public.messages(chat_id, from_me, timestamp);

-- NOTA: Índice en body omitido debido a límite de tamaño de PostgreSQL (8191 bytes)
-- Los mensajes de WhatsApp exceden este límite, por lo que no se puede indexar directamente

-- ============================================
-- ÍNDICES PARA CHATS
-- ============================================

-- Índice compuesto para queries principales de conversaciones
CREATE INDEX IF NOT EXISTS idx_chats_bot_lastmsg 
  ON public.chats(bot_id, last_message_time DESC NULLS LAST) 
  WHERE is_group = false 
  AND chat_id NOT ILIKE '%status%' 
  AND chat_id NOT ILIKE '%@broadcast%'
  AND chat_id NOT ILIKE '%@g.us';

-- Índice para contar conversaciones por bot
CREATE INDEX IF NOT EXISTS idx_chats_bot_isgroup 
  ON public.chats(bot_id, is_group);

-- ============================================
-- FUNCIÓN: calculate_conversation_metrics
-- Calcula todas las métricas de una conversación
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_conversation_metrics(p_chat_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_messages integer;
  v_incoming_messages integer;
  v_outgoing_messages integer;
  v_response_times numeric[];
  v_avg_response numeric;
  v_max_response numeric;
  v_payment_count integer;
  v_payment_first timestamp with time zone;
  v_payment_last timestamp with time zone;
  v_payment_last_fromme boolean;
  v_cotizacion_count integer;
  v_cotizacion_files jsonb;
BEGIN
  -- Contar mensajes
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE from_me = false),
    COUNT(*) FILTER (WHERE from_me = true)
  INTO v_total_messages, v_incoming_messages, v_outgoing_messages
  FROM public.messages
  WHERE chat_id = p_chat_id;

  -- Calcular tiempos de respuesta
  WITH response_pairs AS (
    SELECT 
      LAG(timestamp) OVER (ORDER BY timestamp) as client_time,
      timestamp as bot_time,
      from_me
    FROM public.messages
    WHERE chat_id = p_chat_id
    ORDER BY timestamp
  )
  SELECT 
    COALESCE(array_agg(EXTRACT(EPOCH FROM (bot_time - client_time)) / 60), ARRAY[]::numeric[])
  INTO v_response_times
  FROM response_pairs
  WHERE from_me = true 
    AND client_time IS NOT NULL
    AND EXTRACT(EPOCH FROM (bot_time - client_time)) / 60 BETWEEN 0 AND 10080; -- max 7 días

  v_avg_response := (SELECT AVG(x) FROM unnest(v_response_times) x);
  v_max_response := (SELECT MAX(x) FROM unnest(v_response_times) x);

  -- Analizar menciones de métodos de pago
  WITH payment_mentions AS (
    SELECT timestamp, from_me
    FROM public.messages
    WHERE chat_id = p_chat_id
      AND (
        body ILIKE '%pago%' OR body ILIKE '%pagos%' OR body ILIKE '%pagar%' OR
        body ILIKE '%metodo de pago%' OR body ILIKE '%tarjeta%' OR
        body ILIKE '%transferencia%' OR body ILIKE '%zelle%' OR
        body ILIKE '%pse%' OR body ILIKE '%deposito%' OR body ILIKE '%depósito%'
      )
    ORDER BY timestamp
  )
  SELECT 
    COUNT(*),
    MIN(timestamp),
    MAX(timestamp),
    (SELECT from_me FROM payment_mentions ORDER BY timestamp DESC LIMIT 1)
  INTO v_payment_count, v_payment_first, v_payment_last, v_payment_last_fromme
  FROM payment_mentions;

  -- Detectar PDFs de cotización (simplificado para evitar error de regexp_matches)
  SELECT 
    COUNT(*),
    '[]'::jsonb
  INTO v_cotizacion_count, v_cotizacion_files
  FROM public.messages
  WHERE chat_id = p_chat_id
    AND from_me = true
    AND body ~ 'Cotizacion_[A-Z_]+_\d{4}-\d{2}-\d{2}\.pdf';

  -- Insertar o actualizar métricas
  INSERT INTO public.conversation_metrics (
    chat_id,
    total_messages,
    incoming_messages,
    outgoing_messages,
    avg_response_time_minutes,
    max_response_time_minutes,
    response_samples,
    payment_mentions_count,
    payment_first_mention_at,
    payment_last_mention_at,
    payment_last_from_me,
    cotizacion_mentions_count,
    cotizacion_files,
    last_calculated_at
  ) VALUES (
    p_chat_id,
    v_total_messages,
    v_incoming_messages,
    v_outgoing_messages,
    v_avg_response,
    v_max_response,
    array_length(v_response_times, 1),
    COALESCE(v_payment_count, 0),
    v_payment_first,
    v_payment_last,
    v_payment_last_fromme,
    COALESCE(v_cotizacion_count, 0),
    COALESCE(v_cotizacion_files, '[]'::jsonb),
    now()
  )
  ON CONFLICT (chat_id) 
  DO UPDATE SET
    total_messages = EXCLUDED.total_messages,
    incoming_messages = EXCLUDED.incoming_messages,
    outgoing_messages = EXCLUDED.outgoing_messages,
    avg_response_time_minutes = EXCLUDED.avg_response_time_minutes,
    max_response_time_minutes = EXCLUDED.max_response_time_minutes,
    response_samples = EXCLUDED.response_samples,
    payment_mentions_count = EXCLUDED.payment_mentions_count,
    payment_first_mention_at = EXCLUDED.payment_first_mention_at,
    payment_last_mention_at = EXCLUDED.payment_last_mention_at,
    payment_last_from_me = EXCLUDED.payment_last_from_me,
    cotizacion_mentions_count = EXCLUDED.cotizacion_mentions_count,
    cotizacion_files = EXCLUDED.cotizacion_files,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

COMMENT ON FUNCTION public.calculate_conversation_metrics IS 'Calcula y almacena métricas precalculadas de una conversación';

-- ============================================
-- TRIGGER: Recalcular métricas al insertar/actualizar mensajes
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_recalculate_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalcular métricas para el chat afectado
  PERFORM public.calculate_conversation_metrics(
    COALESCE(NEW.chat_id, OLD.chat_id)
  );
  RETURN NEW;
END;
$$;

-- Trigger en INSERT de mensajes
DROP TRIGGER IF EXISTS messages_insert_recalc_metrics ON public.messages;
CREATE TRIGGER messages_insert_recalc_metrics
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_metrics();

-- Trigger en UPDATE de mensajes
DROP TRIGGER IF EXISTS messages_update_recalc_metrics ON public.messages;
CREATE TRIGGER messages_update_recalc_metrics
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  WHEN (OLD.body IS DISTINCT FROM NEW.body OR OLD.from_me IS DISTINCT FROM NEW.from_me)
  EXECUTE FUNCTION public.trigger_recalculate_metrics();

COMMENT ON FUNCTION public.trigger_recalculate_metrics IS 'Trigger para recalcular métricas al modificar mensajes';

-- ============================================
-- FUNCIÓN: populate_all_conversation_metrics
-- Calcula métricas para chats recientes (últimos 30 días)
-- ============================================

CREATE OR REPLACE FUNCTION public.populate_all_conversation_metrics()
RETURNS TABLE(processed_count integer, total_count integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total integer;
  v_processed integer := 0;
  v_chat_id uuid;
BEGIN
  -- Contar total de chats válidos recientes (últimos 30 días)
  SELECT COUNT(*) INTO v_total
  FROM public.chats
  WHERE is_group = false
    AND chat_id NOT ILIKE '%status%'
    AND chat_id NOT ILIKE '%@broadcast%'
    AND chat_id NOT ILIKE '%@g.us'
    AND last_message_time > NOW() - INTERVAL '30 days';

  -- Procesar cada chat reciente
  FOR v_chat_id IN 
    SELECT id 
    FROM public.chats
    WHERE is_group = false
      AND chat_id NOT ILIKE '%status%'
      AND chat_id NOT ILIKE '%@broadcast%'
      AND chat_id NOT ILIKE '%@g.us'
      AND last_message_time > NOW() - INTERVAL '30 days'
  LOOP
    PERFORM public.calculate_conversation_metrics(v_chat_id);
    v_processed := v_processed + 1;
    
    -- Log progreso cada 50 chats
    IF v_processed % 50 = 0 THEN
      RAISE NOTICE 'Procesados % de % chats recientes', v_processed, v_total;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_total;
END;
$$;

COMMENT ON FUNCTION public.populate_all_conversation_metrics IS 'Poblar métricas para chats recientes (últimos 30 días)';
