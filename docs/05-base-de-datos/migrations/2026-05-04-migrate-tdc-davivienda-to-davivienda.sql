-- ============================================
-- Migración: TDC Davivienda → Davivienda
-- Fecha: 2026-05-04
-- Descripción: Migrar todas las cotizaciones y vuelos 
--              con método de pago "TDC Davivienda" a "Davivienda"
-- ============================================

-- ============================================
-- PASO 1: VERIFICACIÓN PREVIA
-- ============================================

-- Verificar cuántas cotizaciones serán migradas
SELECT 
    'Cotizaciones con TDC Davivienda' as tipo,
    COUNT(*) as cantidad_a_migrar
FROM cotizaciones
WHERE metodo_pago = 'TDC Davivienda';

-- Verificar cuántos vuelos serán migrados
SELECT 
    'Vuelos con TDC Davivienda' as tipo,
    COUNT(*) as cantidad_a_migrar
FROM vuelos
WHERE metodo_pago = 'TDC Davivienda';

-- ============================================
-- PASO 2: MIGRACIÓN (TRANSACCIÓN ATÓMICA)
-- ============================================

BEGIN;

-- Actualizar cotizaciones: TDC Davivienda → Davivienda
UPDATE cotizaciones
SET metodo_pago = 'Davivienda',
    updated_at = NOW()
WHERE metodo_pago = 'TDC Davivienda';

-- Actualizar vuelos: TDC Davivienda → Davivienda
UPDATE vuelos
SET metodo_pago = 'Davivienda',
    updated_at = NOW()
WHERE metodo_pago = 'TDC Davivienda';

-- Verificar resultado de la migración
SELECT 
    'Cotizaciones migradas exitosamente' as resultado,
    COUNT(*) as cantidad
FROM cotizaciones
WHERE metodo_pago = 'Davivienda';

SELECT 
    'Vuelos migrados exitosamente' as resultado,
    COUNT(*) as cantidad
FROM vuelos
WHERE metodo_pago = 'Davivienda';

-- Verificar que no queden registros con "TDC Davivienda"
SELECT 
    'Cotizaciones pendientes (error si > 0)' as verificacion,
    COUNT(*) as cantidad
FROM cotizaciones
WHERE metodo_pago = 'TDC Davivienda';

SELECT 
    'Vuelos pendientes (error si > 0)' as verificacion,
    COUNT(*) as cantidad
FROM vuelos
WHERE metodo_pago = 'TDC Davivienda';

COMMIT;

-- ============================================
-- PASO 3: VERIFICACIÓN FINAL
-- ============================================

-- Verificar estado final de cotizaciones
SELECT 
    metodo_pago,
    COUNT(*) as total
FROM cotizaciones
WHERE metodo_pago IN ('Davivienda', 'TDC Davivienda')
GROUP BY metodo_pago
ORDER BY metodo_pago;

-- Verificar estado final de vuelos
SELECT 
    metodo_pago,
    COUNT(*) as total
FROM vuelos
WHERE metodo_pago IN ('Davivienda', 'TDC Davivienda')
GROUP BY metodo_pago
ORDER BY metodo_pago;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Esta migración es irreversible. Si necesitas revertir,
--    ejecuta el SQL inverso (Davivienda → TDC Davivienda)
-- 2. La migración actualiza automáticamente updated_at en ambos registros
-- 3. Si hay algún error, la transacción se revertirá automáticamente
-- 4. Después de ejecutar esta migración, "TDC Davivienda" ya no existirá
--    en la configuración de paymentConfig.js
-- ============================================

-- ============================================
-- SQL INVERSO (POR SI NECESITAS REVERTIR)
-- ============================================
-- Descomenta y ejecuta este bloque SOLO si necesitas revertir
-- la migración:

/*
BEGIN;

UPDATE cotizaciones
SET metodo_pago = 'TDC Davivienda',
    updated_at = NOW()
WHERE metodo_pago = 'Davivienda';

UPDATE vuelos
SET metodo_pago = 'TDC Davivienda',
    updated_at = NOW()
WHERE metodo_pago = 'Davivienda';

COMMIT;
*/
