-- ROLLBACK: Eliminar migración incorrecta de ventas a crédito (2026-04-22)
-- Fecha: 2026-04-23
-- Descripción: Este script elimina la migración incorrecta que causó conflictos

BEGIN;

-- ============================================
-- FASE 1: Eliminar vista de reporting
-- ============================================
DROP VIEW IF EXISTS vista_ventas_credito;

-- ============================================
-- FASE 2: Eliminar CHECK constraints
-- ============================================
ALTER TABLE public.vuelos 
DROP CONSTRAINT IF EXISTS chk_anticipo_no_mayor_total;

ALTER TABLE public.vuelos 
DROP CONSTRAINT IF EXISTS chk_monto_total_credito;

-- ============================================
-- FASE 3: Eliminar trigger
-- ============================================
DROP TRIGGER IF EXISTS trg_actualizar_saldo_pendiente ON public.vuelos;

-- ============================================
-- FASE 4: Eliminar función del trigger
-- ============================================
DROP FUNCTION IF EXISTS actualizar_saldo_pendiente_cliente();

-- ============================================
-- FASE 5: Eliminar índices
-- ============================================
DROP INDEX IF EXISTS idx_vuelos_credito_saldo;
DROP INDEX IF EXISTS idx_vuelos_monto_total;
DROP INDEX IF EXISTS idx_vuelos_forma_emision;
DROP INDEX IF EXISTS idx_vuelos_saldo_pendiente;

-- ============================================
-- FASE 6: Eliminar columnas agregadas
-- ============================================
ALTER TABLE public.vuelos 
DROP COLUMN IF EXISTS monto_total_venta;

ALTER TABLE public.vuelos 
DROP COLUMN IF EXISTS anticipo_cliente;

ALTER TABLE public.vuelos 
DROP COLUMN IF EXISTS saldo_pendiente_cliente;

-- ============================================
-- FASE 7: Restaurar comentarios (eliminar comentarios de la migración incorrecta)
-- ============================================
COMMENT ON COLUMN public.vuelos.monto_venta IS NULL;

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esta consulta para verificar que la tabla está limpia:
-- \d vuelos
-- Deberías NO ver las columnas: monto_total_venta, anticipo_cliente, saldo_pendiente_cliente
