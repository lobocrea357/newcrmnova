-- Migration: Add COMPROBANTE_RESERVA_SERVIVUELO to vuelos_adjuntos
-- Date: 2026-04-30
-- Description: Added new attachment type for Servivuelo reservation PDFs

-- Step 1: Drop existing constraint
ALTER TABLE public.vuelos_adjuntos 
DROP CONSTRAINT IF EXISTS vuelos_adjuntos_tipo_adjunto_check;

-- Step 2: Add updated constraint with new type
ALTER TABLE public.vuelos_adjuntos 
ADD CONSTRAINT vuelos_adjuntos_tipo_adjunto_check 
CHECK (tipo_adjunto = ANY (ARRAY['COMPROBANTE_PAGO'::text, 'PASAPORTE'::text, 'CEDULA'::text, 'COMPROBANTE_RESERVA_SERVIVUELO'::text]));

-- Step 3: Verification (optional - can be run to test)
-- Uncomment to test:
-- INSERT INTO public.vuelos_adjuntos (
--   id, 
--   vuelo_id, 
--   tipo_adjunto, 
--   nombre_archivo, 
--   url_storage, 
--   uploaded_by
-- ) VALUES (
--   gen_random_uuid(),
--   (SELECT id FROM public.vuelos LIMIT 1),
--   'COMPROBANTE_RESERVA_SERVIVUELO',
--   'test.pdf',
--   'https://test.com',
--   (SELECT id FROM auth.users LIMIT 1)
-- );
-- ROLLBACK;

-- Impact:
-- - Enables storing PDF reservation confirmations for Servivuelo provider
-- - No breaking changes - additive only
-- - Backward compatible with existing attachment types
