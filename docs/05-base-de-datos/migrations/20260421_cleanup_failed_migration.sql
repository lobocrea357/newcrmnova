-- Script: Limpieza de migración fallida del script viejo
-- Date: 2026-04-21
-- Purpose: Eliminar cualquier remanente del script anterior que falló
-- Safe to run: Este script es idempotente y seguro de ejecutar múltiples veces

-- Paso 1: Eliminar constraint parcial si existe (del script viejo)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'vuelos_autorizado_por_fkey'
        AND table_name = 'vuelos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vuelos DROP CONSTRAINT IF EXISTS vuelos_autorizado_por_fkey;
        RAISE NOTICE '✅ Constraint vuelos_autorizado_por_fkey eliminado';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint vuelos_autorizado_por_fkey no existe (nada que limpiar)';
    END IF;
END $$;

-- Paso 2: Eliminar policies RLS solo si las tablas existen
DO $$
BEGIN
    -- Eliminar policies de deudas_proveedores si la tabla existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'deudas_proveedores' 
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admin can view all deudas" ON public.deudas_proveedores';
        EXECUTE 'DROP POLICY IF EXISTS "Admin can insert deudas" ON public.deudas_proveedores';
        EXECUTE 'DROP POLICY IF EXISTS "Admin can update deudas" ON public.deudas_proveedores';
        RAISE NOTICE '✅ Policies de deudas_proveedores eliminadas';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla deudas_proveedores no existe (omitiendo limpieza de policies)';
    END IF;

    -- Eliminar policies de pagos_deudas si la tabla existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pagos_deudas' 
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admin can view all pagos" ON public.pagos_deudas';
        EXECUTE 'DROP POLICY IF EXISTS "Admin can insert pagos" ON public.pagos_deudas';
        RAISE NOTICE '✅ Policies de pagos_deudas eliminadas';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla pagos_deudas no existe (omitiendo limpieza de policies)';
    END IF;
END $$;

-- Paso 3: Eliminar tablas (esto es seguro con IF EXISTS)
DROP TABLE IF EXISTS public.pagos_deudas CASCADE;
DROP TABLE IF EXISTS public.deudas_proveedores CASCADE;

-- Paso 4: Eliminar índices (esto es seguro con IF EXISTS)
DROP INDEX IF EXISTS public.idx_deudas_proveedores_vuelo;
DROP INDEX IF EXISTS public.idx_deudas_proveedores_estado;
DROP INDEX IF EXISTS public.idx_deudas_proveedores_proveedor;
DROP INDEX IF EXISTS public.idx_deudas_proveedores_vencimiento;
DROP INDEX IF EXISTS public.idx_pagos_deudas_deuda;
DROP INDEX IF EXISTS public.idx_pagos_deudas_fecha;

DO $$
BEGIN
    RAISE NOTICE '✅ Limpieza completada exitosamente';
END $$;
