-- =====================================================
-- MIGRACIÓN: Crear Storage Bucket para Vuelos
-- Fecha: 2026-02-18
-- Descripción: Crea el bucket de storage para adjuntos
--              de vuelos (comprobantes y pasaportes)
-- =====================================================

-- Crear bucket para adjuntos de vuelos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vuelos-adjuntos',
  'vuelos-adjuntos',
  false, -- Privado, requiere autenticación
  10485760, -- 10MB en bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS PARA STORAGE
-- =====================================================

-- Política: Usuarios autenticados pueden subir archivos
CREATE POLICY "Usuarios autenticados pueden subir adjuntos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vuelos-adjuntos'
);

-- Política: Usuarios autenticados pueden ver archivos
CREATE POLICY "Usuarios autenticados pueden ver adjuntos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vuelos-adjuntos'
);

-- Política: Usuarios autenticados pueden actualizar archivos
CREATE POLICY "Usuarios autenticados pueden actualizar adjuntos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vuelos-adjuntos'
)
WITH CHECK (
  bucket_id = 'vuelos-adjuntos'
);

-- Política: Usuarios autenticados pueden eliminar archivos
CREATE POLICY "Usuarios autenticados pueden eliminar adjuntos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vuelos-adjuntos'
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el bucket fue creado
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'vuelos-adjuntos'
  ) THEN
    RAISE NOTICE '✅ Bucket "vuelos-adjuntos" creado exitosamente';
  ELSE
    RAISE WARNING '⚠️ No se pudo crear el bucket "vuelos-adjuntos"';
  END IF;
END $$;
