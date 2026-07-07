-- Migration: Soporte para Cédula de Identidad
-- Date: 2026-04-13
-- Description: Agregar soporte para C.I. en vuelos_pasajeros y expandir enum en vuelos_adjuntos
-- Author: Cascade AI
-- Version: 1.0

-- ============================================
-- 1. Agregar nuevos campos a vuelos_pasajeros
-- ============================================

-- Agregar columna para tipo de documento
ALTER TABLE vuelos_pasajeros 
ADD COLUMN tipo_documento VARCHAR(10) CHECK (tipo_documento IN ('PASAPORTE', 'CEDULA'));

-- Agregar columna para número de cédula
ALTER TABLE vuelos_pasajeros 
ADD COLUMN numero_cedula TEXT;

-- Agregar columna para país de emisión de cédula
ALTER TABLE vuelos_pasajeros 
ADD COLUMN pais_emision_cedula VARCHAR(50);

-- ============================================
-- 2. Expandir enum en vuelos_adjuntos para soportar cédulas
-- ============================================

-- Primero eliminar el constraint existente
ALTER TABLE vuelos_adjuntos DROP CONSTRAINT IF EXISTS vuelos_adjuntos_tipo_adjunto_check;

-- Luego agregar el nuevo constraint con CEDULA incluido
ALTER TABLE vuelos_adjuntos 
ADD CONSTRAINT vuelos_adjuntos_tipo_adjunto_check 
CHECK (tipo_adjunto IN ('COMPROBANTE_PAGO', 'PASAPORTE', 'CEDULA'));

-- ============================================
-- 3. Migración de datos existentes
-- ============================================

-- Marcar todos los registros existentes como PASAPORTE por defecto
-- Solo si tienen número de pasaporte y no tienen tipo_documento asignado
UPDATE vuelos_pasajeros 
SET tipo_documento = 'PASAPORTE' 
WHERE tipo_documento IS NULL 
  AND numero_pasaporte IS NOT NULL 
  AND numero_pasaporte <> '';

-- ============================================
-- 4. Crear índices para optimización
-- ============================================

-- Índice para búsquedas por tipo de documento
CREATE INDEX idx_vuelos_pasajeros_tipo_documento ON vuelos_pasajeros(tipo_documento);

-- Índice para búsquedas por tipo de adjunto
CREATE INDEX idx_vuelos_adjuntos_tipo_adjunto ON vuelos_adjuntos(tipo_adjunto);

-- Índice compuesto para búsquedas de C.I. (opcional, para performance)
CREATE INDEX idx_vuelos_pasajeros_cedula ON vuelos_pasajeros(numero_cedula) WHERE numero_cedula IS NOT NULL;

-- ============================================
-- 5. Verificación de la migración
-- ============================================

-- Consulta para verificar que los nuevos campos existen
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vuelos_pasajeros' 
    AND column_name IN ('tipo_documento', 'numero_cedula', 'pais_emision_cedula')
ORDER BY column_name;

-- Consulta para verificar el constraint en vuelos_adjuntos
SELECT 
    conname, 
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'vuelos_adjuntos'::regclass 
    AND conname = 'vuelos_adjuntos_tipo_adjunto_check';

-- Consulta para verificar datos migrados
SELECT 
    COUNT(*) as total_pasajeros,
    COUNT(CASE WHEN tipo_documento = 'PASAPORTE' THEN 1 END) as con_pasaporte,
    COUNT(CASE WHEN tipo_documento = 'CEDULA' THEN 1 END) as con_cedula,
    COUNT(CASE WHEN tipo_documento IS NULL THEN 1 END) as sin_tipo_documento
FROM vuelos_pasajeros;

-- ============================================
-- 6. Rollback Script (en caso de necesitar revertir)
-- ============================================

/*
-- Para revertir esta migración, ejecutar:

-- Eliminar índices
DROP INDEX IF EXISTS idx_vuelos_pasajeros_tipo_documento;
DROP INDEX IF EXISTS idx_vuelos_adjuntos_tipo_adjunto;
DROP INDEX IF EXISTS idx_vuelos_pasajeros_cedula;

-- Eliminar constraint de vuelos_adjuntos
ALTER TABLE vuelos_adjuntos DROP CONSTRAINT vuelos_adjuntos_tipo_adjunto_check;

-- Restaurar constraint original
ALTER TABLE vuelos_adjuntos 
ADD CONSTRAINT vuelos_adjuntos_tipo_adjunto_check 
CHECK (tipo_adjunto IN ('COMPROBANTE_PAGO', 'PASAPORTE'));

-- Eliminar columnas de vuelos_pasajeros
ALTER TABLE vuelos_pasajeros DROP COLUMN IF EXISTS tipo_documento;
ALTER TABLE vuelos_pasajeros DROP COLUMN IF EXISTS numero_cedula;
ALTER TABLE vuelos_pasajeros DROP COLUMN IF EXISTS pais_emision_cedula;

*/

-- ============================================
-- 7. Notas importantes
-- ============================================

/*
NOTAS PARA EL EQUIPO DE DESARROLLO:

1. CAMBIOS REALIZADOS:
   - Se agregaron 3 nuevas columnas a vuelos_pasajeros
   - Se expandió el enum en vuelos_adjuntos
   - Se migraron datos existentes a PASAPORTE por defecto
   - Se crearon índices para optimizar consultas

2. COMPATIBILIDAD:
   - Esta migración es segura y no romperá funcionalidad existente
   - Los registros existentes mantendrán su comportamiento
   - Las aplicaciones existentes seguirán funcionando

3. PERFORMANCE:
   - Los índices agregados mejorarán las consultas por tipo de documento
   - No se espera impacto negativo en el rendimiento

4. SIGUIENTES PASOS:
   - Actualizar backend para manejar los nuevos campos
   - Actualizar frontend para permitir selección de tipo de documento
   - Agregar validaciones correspondientes

5. PRUEBAS RECOMENDADAS:
   - Verificar que los vuelos existentes aún funcionen
   - Probar creación de vuelos con C.I.
   - Probar cambio de tipo de documento en edición
   - Verificar performance de consultas

*/
