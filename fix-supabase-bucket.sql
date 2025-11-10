-- ============================================
-- CREAR Y CONFIGURAR BUCKET DE SUPABASE
-- ============================================

-- PASO 1: Verificar si el bucket existe
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'whatsapp';

-- PASO 2: Si no existe, crear el bucket
-- EJECUTA ESTO SI EL PASO 1 NO DEVUELVE RESULTADOS:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'whatsapp',
    'whatsapp',
    true,
    52428800, -- 50MB
    ARRAY['image/*', 'video/*', 'audio/*', 'application/*']
)
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- PASO 4: Crear política de lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'whatsapp' );

-- PASO 5: Crear política de inserción para usuarios autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'whatsapp' );

-- PASO 6: Crear política de actualización
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'whatsapp' );

-- PASO 7: Crear política de eliminación
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'whatsapp' );

-- PASO 8: Verificar políticas creadas
SELECT 
    id,
    name,
    bucket_id,
    definition
FROM storage.policies
WHERE bucket_id = 'whatsapp';

-- PASO 9: Verificar archivos en el bucket
SELECT 
    id,
    name,
    bucket_id,
    created_at,
    metadata->>'size' as size,
    metadata->>'mimetype' as mimetype
FROM storage.objects
WHERE bucket_id = 'whatsapp'
ORDER BY created_at DESC
LIMIT 10;
