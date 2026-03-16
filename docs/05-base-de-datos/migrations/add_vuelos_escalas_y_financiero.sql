-- ========================================
-- MIGRATION: Agregar campos de escalas e info financiera a tabla vuelos
-- Fecha: 2026-03-15
-- Descripción: Agrega campos para hora_llegada, escalas (hasta 2), 
--              moneda_precio, moneda_cotizacion, tasa_cambio, total_cotizacion
-- ========================================

-- 1. Agregar hora de llegada
ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS hora_llegada time without time zone;

-- 2. Agregar campos de escalas (primera escala)
ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS tiene_escala boolean DEFAULT false;

ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS escala_1_ciudad text;

ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS escala_1_duracion text;

-- 3. Agregar campos de escalas (segunda escala)
ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS tiene_segunda_escala boolean DEFAULT false;

ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS escala_2_ciudad text;

ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS escala_2_duracion text;

-- 4. Agregar campos de información financiera
ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS moneda_precio text;

ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS moneda_cotizacion text;

ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS tasa_cambio numeric;

ALTER TABLE public.vuelos 
ADD COLUMN IF NOT EXISTS total_cotizacion numeric;

-- 5. Actualizar CHECK constraint para tipo_vuelo con nuevos valores
ALTER TABLE public.vuelos 
DROP CONSTRAINT IF EXISTS vuelos_tipo_vuelo_check;

ALTER TABLE public.vuelos 
ADD CONSTRAINT vuelos_tipo_vuelo_check 
CHECK (tipo_vuelo = ANY (ARRAY['solo_ida'::text, 'ida_vuelta'::text, 'migratorio'::text]));

-- 6. Agregar comentarios descriptivos
COMMENT ON COLUMN public.vuelos.hora_llegada IS 'Hora de llegada del vuelo';
COMMENT ON COLUMN public.vuelos.tiene_escala IS 'Indica si el vuelo tiene al menos una escala';
COMMENT ON COLUMN public.vuelos.escala_1_ciudad IS 'Ciudad de la primera escala';
COMMENT ON COLUMN public.vuelos.escala_1_duracion IS 'Duración de la primera escala (ej: 2h 30min)';
COMMENT ON COLUMN public.vuelos.tiene_segunda_escala IS 'Indica si el vuelo tiene una segunda escala';
COMMENT ON COLUMN public.vuelos.escala_2_ciudad IS 'Ciudad de la segunda escala';
COMMENT ON COLUMN public.vuelos.escala_2_duracion IS 'Duración de la segunda escala';
COMMENT ON COLUMN public.vuelos.moneda_precio IS 'Moneda de los precios de pantalla (EUR o USD)';
COMMENT ON COLUMN public.vuelos.moneda_cotizacion IS 'Moneda en la que se cotizó el vuelo';
COMMENT ON COLUMN public.vuelos.tasa_cambio IS 'Tasa de cambio aplicada entre moneda_precio y moneda_cotizacion';
COMMENT ON COLUMN public.vuelos.total_cotizacion IS 'Subtotal de la cotización en moneda_precio antes de aplicar tasa';

-- ========================================
-- FIN DE MIGRATION
-- ========================================
