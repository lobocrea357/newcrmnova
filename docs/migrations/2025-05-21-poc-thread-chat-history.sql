-- ============================================================================
-- Migración: Tabla de Historial de Cambios de Bot en Threads PoC
-- Fecha: 2025-05-21
-- Propósito: Permitir tracking completo de reasignaciones de bot sin afectar performance
-- 
-- ARQUITECTURA:
-- - poc_thread_chats: Mantiene solo el estado ACTUAL (1 registro por chat)
-- - poc_thread_chat_history: Mantiene el HISTORIAL COMPLETO (N registros por chat)
-- 
-- BENEFICIOS:
-- - Consultas frecuentes (lista de threads) usan tabla pequeña (poc_thread_chats)
-- - Timeline detallado usa tabla de historial (poc_thread_chat_history)
-- - Separación de caliente/frío optimiza performance a escala masiva
-- ============================================================================

-- Tabla de historial de cambios de bot
-- Esta tabla almacena TODOS los registros de asignación de bot a un chat
-- Permitiendo reconstruir el timeline completo de reasignaciones
CREATE TABLE IF NOT EXISTS public.poc_thread_chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  chat_id uuid NOT NULL,
  bot_name text NOT NULL,
  started_at timestamp without time zone NOT NULL,
  ended_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT poc_thread_chat_history_thread_id_fkey 
    FOREIGN KEY (thread_id) REFERENCES public.poc_customer_threads(id) ON DELETE CASCADE
);

-- Índice para consultas por thread_id (timeline de un thread específico)
-- Este es el índice más usado para obtener el historial completo de un thread
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_thread_id_idx 
  ON public.poc_thread_chat_history(thread_id);

-- Índice para consultas por chat_id (historial de un chat específico)
-- Útil para ver todos los bots que atendieron un chat específico
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_chat_id_idx 
  ON public.poc_thread_chat_history(chat_id);

-- Índice compuesto para ordenar cronológicamente por thread
-- Optimiza queries que necesitan el historial ordenado por fecha
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_thread_started_idx 
  ON public.poc_thread_chat_history(thread_id, started_at);

-- Índice para consultas de bot específico
-- Útil para análisis de performance por bot
CREATE INDEX IF NOT EXISTS poc_thread_chat_history_bot_name_idx 
  ON public.poc_thread_chat_history(bot_name);

-- Comentarios para documentación
COMMENT ON TABLE public.poc_thread_chat_history IS 
  'Historial completo de asignaciones de bot a chats. Cada cambio de bot crea un nuevo registro con started_at y ended_at. La tabla poc_thread_chats mantiene solo el estado actual activo.';

COMMENT ON COLUMN public.poc_thread_chat_history.thread_id IS 
  'ID del thread al que pertenece este chat (FK a poc_customer_threads)';

COMMENT ON COLUMN public.poc_thread_chat_history.chat_id IS 
  'ID del chat (UUID de la tabla chats)';

COMMENT ON COLUMN public.poc_thread_chat_history.bot_name IS 
  'Nombre del bot que atendió este chat (session_name de la tabla bots)';

COMMENT ON COLUMN public.poc_thread_chat_history.started_at IS 
  'Timestamp cuando este bot empezó a atender el chat';

COMMENT ON COLUMN public.poc_thread_chat_history.ended_at IS 
  'Timestamp cuando este bot dejó de atender el chat (NULL si es el bot actual activo)';

COMMENT ON COLUMN public.poc_thread_chat_history.created_at IS 
  'Timestamp cuando se creó este registro de historial (para auditoría)';

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar estos queries para verificar que la migración fue exitosa
-- ============================================================================

-- Verificar que la tabla existe
-- SELECT * FROM information_schema.tables 
-- WHERE table_name = 'poc_thread_chat_history';

-- Verificar los índices creados
-- SELECT * FROM pg_indexes 
-- WHERE tablename = 'poc_thread_chat_history';

-- Verificar la estructura de la tabla
-- \d public.poc_thread_chat_history

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
-- 
-- 1. Esta migración NO modifica la tabla poc_thread_chats existente
--    - Mantiene compatibilidad total con el código actual
--    - El código backend se actualizará para escribir en ambas tablas
-- 
-- 2. Los datos existentes NO se migran automáticamente
--    - Los nuevos cambios de bot se escribirán en ambas tablas
--    - Para migrar datos históricos, ejecutar un script separado
-- 
-- 3. Performance esperado:
--    - Lista de threads: Scan de tabla pequeña (poc_thread_chats)
--    - Timeline: JOIN entre ambas tablas (aceptable para uso ocasional)
--    - Escritura: Insert en 2 tablas (rápido, no bloqueante)
-- 
-- 4. Mantenimiento futuro:
--    - Archivar registros antiguos de historial si crece demasiado
--    - Considerar particionamiento por fecha si supera 10M registros
--    - Monitorear tamaño de tabla y performance de queries
-- 
-- ============================================================================
