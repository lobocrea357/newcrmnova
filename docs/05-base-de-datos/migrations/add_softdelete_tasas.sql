-- =====================================================
-- SOFT DELETE PARA SISTEMA DE TASAS
-- Implementa eliminación lógica para tasas y monedas
-- =====================================================

-- 1. Agregar campos de soft delete a tasas_conversion (si no existen)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasas_conversion' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.tasas_conversion 
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN deleted_by UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- 2. Agregar campos de soft delete a monedas (si no existen)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'monedas' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.monedas 
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN deleted_by UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- 3. Modificar columna activa para que sea NOT NULL (mejor práctica)
ALTER TABLE public.tasas_conversion 
ALTER COLUMN activa SET DEFAULT true,
ALTER COLUMN activa SET NOT NULL;

ALTER TABLE public.monedas 
ALTER COLUMN activa SET DEFAULT true,
ALTER COLUMN activa SET NOT NULL;

-- 4. Agregar tipo de operación en historial
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasas_historial' AND column_name = 'tipo_operacion') THEN
    ALTER TABLE public.tasas_historial 
    ADD COLUMN tipo_operacion VARCHAR(20) DEFAULT 'update' CHECK (tipo_operacion IN ('create', 'update', 'delete'));
  END IF;
END $$;

-- 5. Crear índices para optimizar búsquedas de soft delete
CREATE INDEX IF NOT EXISTS idx_tasas_conversion_deleted ON public.tasas_conversion(deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_monedas_deleted ON public.monedas(deleted_at) 
WHERE deleted_at IS NULL;

-- =====================================================
-- VISTA PARA TASAS ACTIVAS (sin eliminar)
-- =====================================================

CREATE OR REPLACE VIEW public.tasas_conversion_active AS
SELECT * FROM public.tasas_conversion
WHERE deleted_at IS NULL AND activa = true;

CREATE OR REPLACE VIEW public.monedas_active AS
SELECT * FROM public.monedas
WHERE deleted_at IS NULL AND activa = true;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN public.tasas_conversion.deleted_at IS 'Fecha de eliminación lógica (soft delete)';
COMMENT ON COLUMN public.tasas_conversion.deleted_by IS 'Usuario que eliminó la tasa';
COMMENT ON COLUMN public.monedas.deleted_at IS 'Fecha de eliminación lógica (soft delete)';
COMMENT ON COLUMN public.monedas.deleted_by IS 'Usuario que eliminó la moneda';
COMMENT ON COLUMN public.tasas_historial.tipo_operacion IS 'Tipo de operación: create, update, delete';
