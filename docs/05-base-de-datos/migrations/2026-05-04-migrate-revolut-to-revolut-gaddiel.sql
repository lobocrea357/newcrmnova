-- ============================================
-- Migración: Revolut → Revolut Gaddiel
-- Fecha: 2026-05-04
-- Descripción: Migrar todas las cotizaciones y vuelos 
--              con método de pago "Revolut" a "Revolut Gaddiel"
-- ============================================

-- ============================================
-- PASO 1: VERIFICACIÓN PREVIA
-- ============================================

-- Verificar cuántas cotizaciones serán migradas
SELECT 
    'Cotizaciones con Revolut' as tipo,
    COUNT(*) as cantidad_a_migrar
FROM cotizaciones
WHERE metodo_pago = 'Revolut';

-- Verificar cuántos vuelos serán migrados
SELECT 
    'Vuelos con Revolut' as tipo,
    COUNT(*) as cantidad_a_migrar
FROM vuelos
WHERE metodo_pago = 'Revolut';

-- ============================================
-- PASO 2: MIGRACIÓN (TRANSACCIÓN ATÓMICA)
-- ============================================

BEGIN;

-- Actualizar cotizaciones: Revolut → Revolut Gaddiel
UPDATE cotizaciones
SET metodo_pago = 'Revolut Gaddiel',
    updated_at = NOW()
WHERE metodo_pago = 'Revolut';

-- Actualizar vuelos: Revolut → Revolut Gaddiel
UPDATE vuelos
SET metodo_pago = 'Revolut Gaddiel',
    updated_at = NOW()
WHERE metodo_pago = 'Revolut';

-- Verificar resultado de la migración
SELECT 
    'Cotizaciones migradas exitosamente' as resultado,
    COUNT(*) as cantidad
FROM cotizaciones
WHERE metodo_pago = 'Revolut Gaddiel';

SELECT 
    'Vuelos migrados exitosamente' as resultado,
    COUNT(*) as cantidad
FROM vuelos
WHERE metodo_pago = 'Revolut Gaddiel';

-- Verificar que no queden registros con "Revolut"
SELECT 
    'Cotizaciones pendientes (error si > 0)' as verificacion,
    COUNT(*) as cantidad
FROM cotizaciones
WHERE metodo_pago = 'Revolut';

SELECT 
    'Vuelos pendientes (error si > 0)' as verificacion,
    COUNT(*) as cantidad
FROM vuelos
WHERE metodo_pago = 'Revolut';

COMMIT;

-- ============================================
-- PASO 3: VERIFICACIÓN FINAL
-- ============================================

-- Verificar estado final de cotizaciones
SELECT 
    metodo_pago,
    COUNT(*) as total
FROM cotizaciones
WHERE metodo_pago IN ('Revolut', 'Revolut Gaddiel', 'Revolut Grupo Travel')
GROUP BY metodo_pago
ORDER BY metodo_pago;

-- Verificar estado final de vuelos
SELECT 
    metodo_pago,
    COUNT(*) as total
FROM vuelos
WHERE metodo_pago IN ('Revolut', 'Revolut Gaddiel', 'Revolut Grupo Travel')
GROUP BY metodo_pago
ORDER BY metodo_pago;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Esta migración es irreversible. Si necesitas revertir,
--    ejecuta el SQL inverso (Revolut Gaddiel → Revolut)
-- 2. La migración actualiza automáticamente updated_at en ambos registros
-- 3. Si hay algún error, la transacción se revertirá automáticamente
-- 4. Después de ejecutar esta migración, puedes eliminar "Revolut"
--    de la configuración de paymentConfig.js si lo deseas
-- ============================================

-- ============================================
-- SQL INVERSO (POR SI NECESITAS REVERTIR)
-- ============================================
-- Descomenta y ejecuta este bloque SOLO si necesitas revertir
-- la migración:

/*
BEGIN;

UPDATE cotizaciones
SET metodo_pago = 'Revolut',
    updated_at = NOW()
WHERE metodo_pago = 'Revolut Gaddiel';

UPDATE vuelos
SET metodo_pago = 'Revolut',
    updated_at = NOW()
WHERE metodo_pago = 'Revolut Gaddiel';

COMMIT;
*/
