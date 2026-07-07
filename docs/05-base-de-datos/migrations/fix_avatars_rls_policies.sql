-- =====================================================
-- FIX POLÍTICAS RLS PARA BUCKET AVATARS
-- Permitir que usuarios suban y actualicen sus propios avatares
-- =====================================================

-- 1. Eliminar políticas existentes del bucket avatars (si existen)
DROP POLICY IF EXISTS "Usuarios pueden ver avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su avatar" ON storage.objects;

-- 2. Política: Permitir a CUALQUIERA ver avatares (público)
CREATE POLICY "Avatares públicos - lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Política: Permitir a usuarios autenticados subir SU PROPIO avatar
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Política: Permitir a usuarios autenticados actualizar SU PROPIO avatar
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política: Permitir a usuarios autenticados eliminar SU PROPIO avatar
CREATE POLICY "Usuarios pueden eliminar su avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar todas las políticas del bucket avatars
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 
-- 1. Los avatares se guardan con la estructura: avatars/{user_id}/avatar-{timestamp}.{ext}
-- 2. La función storage.foldername(name) extrae el user_id del path
-- 3. auth.uid() retorna el ID del usuario autenticado
-- 4. Cualquiera puede VER avatares (público)
-- 5. Solo el dueño puede SUBIR/ACTUALIZAR/ELIMINAR su avatar
-- 
-- EJEMPLO DE PATH VÁLIDO: avatars/550e8400-e29b-41d4-a716-446655440000/avatar-1234567890.jpg
--                                  ↑ user_id debe coincidir con auth.uid()
-- =====================================================
