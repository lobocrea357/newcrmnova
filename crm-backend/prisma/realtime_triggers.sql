-- Fase 4 — Realtime nativo (sin Supabase)
-- Triggers que publican cambios de fila por NOTIFY en el canal 'crm_realtime'.
-- El servicio PgListener de NestJS escucha ese canal y reenvía por WebSocket.
--
-- Tablas con realtime (según el frontend): vuelos, notificaciones, messages,
-- media_files, conversation_evaluations.

CREATE OR REPLACE FUNCTION crm_realtime_notify() RETURNS trigger AS $$
DECLARE
  rec json;
  oldrec json;
  payload json;
BEGIN
  rec    := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END;
  oldrec := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END;

  payload := json_build_object(
    'table',     TG_TABLE_NAME,
    'schema',    TG_TABLE_SCHEMA,
    'eventType', TG_OP,
    'new',       rec,
    'old',       oldrec
  );

  -- pg_notify tiene un límite de 8000 bytes. Si el payload es mayor, enviamos
  -- una versión mínima con el id para que el cliente recargue la fila.
  IF octet_length(payload::text) > 7900 THEN
    payload := json_build_object(
      'table',     TG_TABLE_NAME,
      'schema',    TG_TABLE_SCHEMA,
      'eventType', TG_OP,
      'new',       CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE json_build_object('id', NEW.id) END,
      'old',       CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE json_build_object('id', OLD.id) END,
      'truncated', true
    );
  END IF;

  PERFORM pg_notify('crm_realtime', payload::text);
  RETURN NULL; -- AFTER trigger, el valor de retorno se ignora
END;
$$ LANGUAGE plpgsql;

-- Helper idempotente: recrea el trigger en una tabla.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'vuelos',
    'notificaciones',
    'messages',
    'media_files',
    'conversation_evaluations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS crm_realtime_%1$s ON public.%1$I;', t);
    EXECUTE format(
      'CREATE TRIGGER crm_realtime_%1$s
         AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION crm_realtime_notify();', t);
  END LOOP;
END $$;
