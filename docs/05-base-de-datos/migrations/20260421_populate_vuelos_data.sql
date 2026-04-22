-- Script: Poblar datos iniciales para vuelos existentes
-- Date: 2026-04-21
-- Purpose: Marcar vuelos de Servivuelo y Chase como CONTADO con cuentas originales
-- Ejecutar DESPUÉS de la migración 20260421_add_control_emisiones_fields.sql

-- Marcar vuelos de Servivuelo como CONTADO
UPDATE public.vuelos 
SET forma_emision = 'CONTADO',
    cuenta_emision_original = 
      CASE 
        WHEN proveedor ILIKE '%servivuelo%' THEN 'SERVIVUELO_1'
        WHEN proveedor ILIKE '%chase%' THEN 'CHASE_NOVA'
        ELSE NULL
      END
WHERE proveedor ILIKE '%servivuelo%' OR proveedor ILIKE '%chase%';

-- Verificar actualización
SELECT COUNT(*), forma_emision 
FROM public.vuelos 
WHERE forma_emision IS NOT NULL
GROUP BY forma_emision;
