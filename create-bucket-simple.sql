-- ============================================
-- CREAR BUCKET DE SUPABASE (SIMPLIFICADO)
-- ============================================

-- PASO 1: Verificar si el bucket existe
SELECT 
    id,
    name,
    public
FROM storage.buckets
WHERE name = 'whatsapp';

-- PASO 2: Si no existe, crear el bucket
-- EJECUTA ESTO SOLO SI EL PASO 1 NO DEVUELVE RESULTADOS:
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
    'whatsapp',
    'whatsapp',
    true,
    52428800
)
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Verificar archivos en el bucket
SELECT 
    id,
    name,
    bucket_id,
    created_at
FROM storage.objects
WHERE bucket_id = 'whatsapp'
ORDER BY created_at DESC
LIMIT 10;
