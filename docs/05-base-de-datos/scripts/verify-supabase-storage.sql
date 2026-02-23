-- ============================================
-- VERIFICAR CONFIGURACIÓN DE SUPABASE STORAGE
-- ============================================

-- 1. Verificar que el bucket existe
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'whatsapp';

-- 2. Verificar políticas de acceso del bucket
SELECT 
    id,
    name,
    bucket_id,
    definition
FROM storage.policies
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'whatsapp');

-- 3. Si el bucket no existe, crearlo
-- EJECUTAR SOLO SI EL BUCKET NO EXISTE:
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'whatsapp',
    'whatsapp',
    true,
    52428800, -- 50MB
    ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);
*/

-- 4. Crear política de lectura pública (si no existe)
-- EJECUTAR SOLO SI LA POLÍTICA NO EXISTE:
/*
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'whatsapp' );
*/

-- 5. Crear política de inserción para usuarios autenticados
-- EJECUTAR SOLO SI LA POLÍTICA NO EXISTE:
/*
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'whatsapp' );
*/

-- 6. Crear política de actualización para usuarios autenticados
-- EJECUTAR SOLO SI LA POLÍTICA NO EXISTE:
/*
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'whatsapp' );
*/

-- 7. Verificar archivos existentes en el bucket
SELECT 
    id,
    name,
    bucket_id,
    created_at,
    updated_at,
    last_accessed_at,
    metadata->>'size' as size,
    metadata->>'mimetype' as mimetype
FROM storage.objects
WHERE bucket_id = 'whatsapp'
ORDER BY created_at DESC
LIMIT 10;
