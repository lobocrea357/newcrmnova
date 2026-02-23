-- ============================================
-- FIX: Políticas RLS para Dashboard
-- ============================================
-- Este script arregla las políticas RLS para que el dashboard funcione correctamente
-- ============================================

-- 1. Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Users can view their assigned bots" ON bots;
DROP POLICY IF EXISTS "Admins can view all bots" ON bots;
DROP POLICY IF EXISTS "Users can view chats of their bots" ON chats;
DROP POLICY IF EXISTS "Users can view messages of their chats" ON messages;
DROP POLICY IF EXISTS "Enable all for service role" ON bots;
DROP POLICY IF EXISTS "Enable all for service role" ON contacts;
DROP POLICY IF EXISTS "Enable all for service role" ON chats;
DROP POLICY IF EXISTS "Enable all for service role" ON messages;
DROP POLICY IF EXISTS "Enable all for service role" ON workers;

-- 2. Crear políticas permisivas para usuarios autenticados
-- Política para WORKERS: Todos los usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view workers"
ON workers FOR SELECT
TO authenticated
USING (true);

-- Política para BOTS: Todos los usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view bots"
ON bots FOR SELECT
TO authenticated
USING (true);

-- Política para CONTACTS: Todos los usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view contacts"
ON contacts FOR SELECT
TO authenticated
USING (true);

-- Política para CHATS: Todos los usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view chats"
ON chats FOR SELECT
TO authenticated
USING (true);

-- Política para MESSAGES: Todos los usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view messages"
ON messages FOR SELECT
TO authenticated
USING (true);

-- Política para MEDIA_FILES: Todos los usuarios autenticados pueden ver
CREATE POLICY "Authenticated users can view media_files"
ON media_files FOR SELECT
TO authenticated
USING (true);

-- 3. Verificar que RLS esté habilitado
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- 4. Verificación
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('workers', 'bots', 'contacts', 'chats', 'messages', 'media_files')
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Todos los usuarios autenticados podrán ver todos los datos
-- Las políticas restrictivas por rol se pueden agregar después si es necesario
-- ============================================
