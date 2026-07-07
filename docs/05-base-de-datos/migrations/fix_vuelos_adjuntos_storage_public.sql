-- ========================================
-- MIGRATION: Configurar bucket vuelos-adjuntos como público
-- Fecha: 2026-03-15
-- Descripción: Permite acceso público a las imágenes de comprobantes y pasaportes
-- ========================================

-- 1. Actualizar bucket para ser público
UPDATE storage.buckets
SET public = true
WHERE id = 'vuelos-adjuntos';

-- 2. Crear policy para permitir lectura pública de archivos
CREATE POLICY "Public read access for vuelos-adjuntos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vuelos-adjuntos');

-- 3. Crear policy para permitir subida autenticada
CREATE POLICY "Authenticated users can upload to vuelos-adjuntos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vuelos-adjuntos');

-- 4. Crear policy para permitir actualización autenticada
CREATE POLICY "Authenticated users can update vuelos-adjuntos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'vuelos-adjuntos')
WITH CHECK (bucket_id = 'vuelos-adjuntos');

-- 5. Crear policy para permitir eliminación autenticada
CREATE POLICY "Authenticated users can delete from vuelos-adjuntos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vuelos-adjuntos');

-- ========================================
-- FIN DE MIGRATION
-- ========================================
