-- ========================================================
-- SCRIPT DE ACTUALIZACIÓN QUIRÚRGICA: AUDITORÍA PREMIUM
-- OBJETIVO: Añadir solo columnas faltantes sin dañar esquema actual.
-- ========================================================

DO $$ 
BEGIN
    -- 1. Campos para conversation_evaluations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'lead_respondio') THEN
        ALTER TABLE public.conversation_evaluations ADD COLUMN lead_respondio BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'preguntas_negociacion') THEN
        ALTER TABLE public.conversation_evaluations ADD COLUMN preguntas_negociacion BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'numero_telefono') THEN
        ALTER TABLE public.conversation_evaluations ADD COLUMN numero_telefono TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_evaluations' AND column_name = 'calidad_cotizacion') THEN
        ALTER TABLE public.conversation_evaluations ADD COLUMN calidad_cotizacion BOOLEAN DEFAULT FALSE;
    END IF;

    -- 2. Campos para resúmenes en performance_analyses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'lead_respondio_count') THEN
        ALTER TABLE public.performance_analyses ADD COLUMN lead_respondio_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'preguntas_negociacion_count') THEN
        ALTER TABLE public.performance_analyses ADD COLUMN preguntas_negociacion_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'calidad_cotizacion_count') THEN
        ALTER TABLE public.performance_analyses ADD COLUMN calidad_cotizacion_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'seguimiento_efectivo_count') THEN
        ALTER TABLE public.performance_analyses ADD COLUMN seguimiento_efectivo_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'objeciones_superadas_count') THEN
        ALTER TABLE public.performance_analyses ADD COLUMN objeciones_superadas_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_analyses' AND column_name = 'venta_confirmada_count') THEN
        ALTER TABLE public.performance_analyses ADD COLUMN venta_confirmada_count INTEGER DEFAULT 0;
    END IF;

    RAISE NOTICE '✅ Actualización de esquema completada sin conflictos.';
END $$;
