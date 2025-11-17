-- ============================================
-- POLÍTICAS RLS PARA USUARIOS POR NOMBRE DE BOT
-- ============================================
-- Este script configura RLS para que cada usuario vea solo sus bots
-- basándose en el sufijo del session_name (después del último _)
-- ============================================

-- 1. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can view their assigned bots" ON bots;
DROP POLICY IF EXISTS "Admins can view all bots" ON bots;
DROP POLICY IF EXISTS "Authenticated users can view bots" ON bots;
DROP POLICY IF EXISTS "Enable all for service role" ON bots;
DROP POLICY IF EXISTS "Users can view bots based on role" ON bots;
DROP POLICY IF EXISTS "Users can view their bots" ON bots;
DROP POLICY IF EXISTS "Users can update their bots" ON bots;
DROP POLICY IF EXISTS "Users can insert their bots" ON bots;
DROP POLICY IF EXISTS "Users can delete their bots" ON bots;

DROP POLICY IF EXISTS "Users can view contacts of their bots" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;
DROP POLICY IF EXISTS "Enable all for service role" ON contacts;
DROP POLICY IF EXISTS "Users can manage contacts of their bots" ON contacts;

DROP POLICY IF EXISTS "Users can view chats of their bots" ON chats;
DROP POLICY IF EXISTS "Authenticated users can view chats" ON chats;
DROP POLICY IF EXISTS "Enable all for service role" ON chats;
DROP POLICY IF EXISTS "Users can manage chats of their bots" ON chats;

DROP POLICY IF EXISTS "Users can view messages of their chats" ON messages;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON messages;
DROP POLICY IF EXISTS "Enable all for service role" ON messages;
DROP POLICY IF EXISTS "Users can view messages of their bots" ON messages;
DROP POLICY IF EXISTS "Users can manage messages of their bots" ON messages;

DROP POLICY IF EXISTS "Authenticated users can view media_files" ON media_files;
DROP POLICY IF EXISTS "Enable all for service role" ON media_files;
DROP POLICY IF EXISTS "Users can view media of their bots" ON media_files;
DROP POLICY IF EXISTS "Users can manage media of their bots" ON media_files;

DROP POLICY IF EXISTS "Authenticated users can view workers" ON workers;
DROP POLICY IF EXISTS "Enable all for service role" ON workers;
DROP POLICY IF EXISTS "Admin can manage workers" ON workers;

-- 2. Crear función para obtener el sufijo del bot (nombre del usuario)
CREATE OR REPLACE FUNCTION get_bot_owner_suffix(session_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Extrae la parte después del último guion bajo
    -- Ejemplo: sharon_colombia_endry -> endry
    RETURN LOWER(SUBSTRING(session_name FROM '_([^_]+)$'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Crear función para verificar si un usuario puede ver un bot
CREATE OR REPLACE FUNCTION can_user_view_bot(user_id UUID, bot_session_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    bot_suffix TEXT;
BEGIN
    -- Obtener el email del usuario
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    -- Si no hay usuario, denegar acceso
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Admin puede ver todo
    IF user_email = 'admin@novapolointranet.xyz' THEN
        RETURN true;
    END IF;
    
    -- Obtener el sufijo del bot
    bot_suffix := get_bot_owner_suffix(bot_session_name);
    
    -- Verificar según el email del usuario
    CASE user_email
        WHEN 'iajosni012@gmail.com' THEN
            -- Endry puede ver bots que terminen en _endry
            RETURN bot_suffix = 'endry';
        WHEN 'moisesnova923@gmail.com' THEN
            -- Moises puede ver bots que terminen en _moises
            RETURN bot_suffix = 'moises';
        WHEN 'rafaelvuelos.nova@gmail.com' THEN
            -- Jesus puede ver bots que terminen en _jesus
            RETURN bot_suffix = 'jesus';
        ELSE
            -- Otros usuarios no tienen acceso
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Habilitar RLS en todas las tablas
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas para BOTS
CREATE POLICY "Users can view their bots"
ON bots FOR SELECT
TO authenticated
USING (can_user_view_bot(auth.uid(), session_name));

CREATE POLICY "Users can update their bots"
ON bots FOR UPDATE
TO authenticated
USING (can_user_view_bot(auth.uid(), session_name));

CREATE POLICY "Users can insert their bots"
ON bots FOR INSERT
TO authenticated
WITH CHECK (can_user_view_bot(auth.uid(), session_name));

CREATE POLICY "Users can delete their bots"
ON bots FOR DELETE
TO authenticated
USING (can_user_view_bot(auth.uid(), session_name));

-- 6. Crear políticas para CONTACTS (basadas en el bot)
CREATE POLICY "Users can view contacts of their bots"
ON contacts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = contacts.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

CREATE POLICY "Users can manage contacts of their bots"
ON contacts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = contacts.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

-- 7. Crear políticas para CHATS (basadas en el bot)
CREATE POLICY "Users can view chats of their bots"
ON chats FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = chats.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

CREATE POLICY "Users can manage chats of their bots"
ON chats FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = chats.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

-- 8. Crear políticas para MESSAGES (basadas en el bot)
CREATE POLICY "Users can view messages of their bots"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = messages.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

CREATE POLICY "Users can manage messages of their bots"
ON messages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = messages.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

-- 9. Crear políticas para MEDIA_FILES (basadas en el bot)
CREATE POLICY "Users can view media of their bots"
ON media_files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = media_files.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

CREATE POLICY "Users can manage media of their bots"
ON media_files FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bots
        WHERE bots.id = media_files.bot_id
        AND can_user_view_bot(auth.uid(), bots.session_name)
    )
);

-- 10. Crear políticas para WORKERS (todos pueden ver)
CREATE POLICY "Authenticated users can view workers"
ON workers FOR SELECT
TO authenticated
USING (true);

-- Solo admin puede modificar workers
CREATE POLICY "Admin can manage workers"
ON workers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND email = 'admin@novapolointranet.xyz'
    )
);

-- 11. Verificación de políticas
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
AND tablename IN ('bots', 'contacts', 'chats', 'messages', 'media_files', 'workers')
ORDER BY tablename, policyname;

-- 12. Prueba de la función (comentado, descomentar para probar)
/*
-- Probar con diferentes session_names
SELECT 
    'sharon_colombia_endry' as session_name,
    get_bot_owner_suffix('sharon_colombia_endry') as owner_suffix,
    can_user_view_bot('aaf12d76-f545-473f-894f-6e0ebbc43018'::uuid, 'sharon_colombia_endry') as endry_can_view,
    can_user_view_bot('55116a56-2bdb-4e37-bd01-a4deda3bce93'::uuid, 'sharon_colombia_endry') as moises_can_view,
    can_user_view_bot('98769606-ce02-49a8-9da4-742ec14d6d44'::uuid, 'sharon_colombia_endry') as admin_can_view;

SELECT 
    'abrahama_apolo_moises' as session_name,
    get_bot_owner_suffix('abrahama_apolo_moises') as owner_suffix,
    can_user_view_bot('aaf12d76-f545-473f-894f-6e0ebbc43018'::uuid, 'abrahama_apolo_moises') as endry_can_view,
    can_user_view_bot('55116a56-2bdb-4e37-bd01-a4deda3bce93'::uuid, 'abrahama_apolo_moises') as moises_can_view,
    can_user_view_bot('98769606-ce02-49a8-9da4-742ec14d6d44'::uuid, 'abrahama_apolo_moises') as admin_can_view;

SELECT 
    'alfredo_nova_jesus' as session_name,
    get_bot_owner_suffix('alfredo_nova_jesus') as owner_suffix,
    can_user_view_bot('7637609f-64b2-46dd-8a6a-c7827444cf46'::uuid, 'alfredo_nova_jesus') as jesus_can_view,
    can_user_view_bot('55116a56-2bdb-4e37-bd01-a4deda3bce93'::uuid, 'alfredo_nova_jesus') as moises_can_view,
    can_user_view_bot('98769606-ce02-49a8-9da4-742ec14d6d44'::uuid, 'alfredo_nova_jesus') as admin_can_view;
*/
