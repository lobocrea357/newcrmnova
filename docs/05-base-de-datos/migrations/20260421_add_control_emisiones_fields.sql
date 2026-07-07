-- Migration: Agregar campos de control de emisiones a tabla vuelos
-- Date: 2026-04-21
-- Author: Sistema

-- Agregar columnas de forma de emisión y cuenta
ALTER TABLE public.vuelos
ADD COLUMN IF NOT EXISTS forma_emision VARCHAR(10) CHECK (forma_emision IN ('CONTADO', 'CREDITO')),
ADD COLUMN IF NOT EXISTS cuenta_emision_original VARCHAR(50),
ADD COLUMN IF NOT EXISTS cuenta_emision_asignada VARCHAR(50);

-- Agregar columnas de control de autorización
ALTER TABLE public.vuelos
ADD COLUMN IF NOT EXISTS autorizado_emision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS autorizado_por UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS fecha_autorizacion_emision TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observaciones_emision TEXT;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_vuelos_autorizado_emision ON public.vuelos(autorizado_emision);
CREATE INDEX IF NOT EXISTS idx_vuelos_forma_emision ON public.vuelos(forma_emision);
CREATE INDEX IF NOT EXISTS idx_vuelos_cuenta_asignada ON public.vuelos(cuenta_emision_asignada);

-- Agregar foreign key para autorizado_por (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'vuelos_autorizado_por_fkey'
        AND table_name = 'vuelos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vuelos
        ADD CONSTRAINT vuelos_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES public.profiles(id);
        RAISE NOTICE '✅ Constraint vuelos_autorizado_por_fkey creado';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint vuelos_autorizado_por_fkey ya existe';
    END IF;
END $$;

-- Comentarios de documentación
COMMENT ON COLUMN public.vuelos.forma_emision IS 'CONTADO o CREDITO - forma de pago al proveedor';
COMMENT ON COLUMN public.vuelos.cuenta_emision_asignada IS 'Cuenta específica donde se emitirá (SERVIVUELO_1, CHASE_NOVA, etc)';
COMMENT ON COLUMN public.vuelos.autorizado_emision IS 'True cuando administración autoriza la emisión';
