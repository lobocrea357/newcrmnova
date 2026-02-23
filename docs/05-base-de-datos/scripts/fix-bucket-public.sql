-- ============================================
-- HACER EL BUCKET PÚBLICO
-- ============================================

-- PASO 1: Actualizar el bucket para que sea público
UPDATE storage.buckets
SET public = true
WHERE name = 'whatsapp';

-- PASO 2: Verificar que se actualizó
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name = 'whatsapp';

-- PASO 3: Verificar archivos existentes
SELECT 
    id,
    name,
    bucket_id,
    created_at
FROM storage.objects
WHERE bucket_id = 'whatsapp'
ORDER BY created_at DESC
LIMIT 10;

-- NOTA: Después de hacer el bucket público, las URLs existentes
-- deberían funcionar automáticamente sin necesidad de resubir los archivos
