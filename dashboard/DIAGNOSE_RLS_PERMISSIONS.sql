-- ============================================
-- DIAGNÓSTICO: Verificar permisos y políticas RLS
-- ============================================

-- 1. Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'conversation_evaluations';

-- 2. Ver todas las políticas RLS de la tabla
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
WHERE tablename = 'conversation_evaluations';

-- 3. Probar acceso directo (esto debería funcionar)
SELECT COUNT(*) as total_evaluations 
FROM conversation_evaluations;

-- 4. Verificar si hay evaluaciones existentes
SELECT 
    ce.id,
    ce.chat_id,
    ce.performance_analysis_id,
    ce.score,
    ce.percentage,
    ce.created_at
FROM conversation_evaluations ce
ORDER BY ce.created_at DESC
LIMIT 5;

-- 5. Verificar relación con performance_analyses
SELECT 
    pa.id as analysis_id,
    pa.analysis_name,
    COUNT(ce.id) as evaluations_count
FROM performance_analyses pa
LEFT JOIN conversation_evaluations ce ON ce.performance_analysis_id = pa.id
GROUP BY pa.id, pa.analysis_name
ORDER BY pa.created_at DESC
LIMIT 10;

-- 6. Si no hay políticas, crearlas
DO $$
BEGIN
    -- Eliminar políticas existentes si hay conflicto
    DROP POLICY IF EXISTS "Allow authenticated users to read evaluations" ON conversation_evaluations;
    DROP POLICY IF EXISTS "Allow authenticated users to insert evaluations" ON conversation_evaluations;
    DROP POLICY IF EXISTS "Allow authenticated users to update evaluations" ON conversation_evaluations;
    DROP POLICY IF EXISTS "Allow authenticated users to delete evaluations" ON conversation_evaluations;
    DROP POLICY IF EXISTS "Allow service role full access to evaluations" ON conversation_evaluations;
    
    -- Crear políticas permisivas
    CREATE POLICY "Enable read access for authenticated users"
        ON conversation_evaluations
        FOR SELECT
        TO authenticated
        USING (true);
    
    CREATE POLICY "Enable insert for authenticated users"
        ON conversation_evaluations
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    
    CREATE POLICY "Enable update for authenticated users"
        ON conversation_evaluations
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    
    CREATE POLICY "Enable delete for authenticated users"
        ON conversation_evaluations
        FOR DELETE
        TO authenticated
        USING (true);
    
    -- Política para service_role (bypass RLS)
    CREATE POLICY "Enable all for service_role"
        ON conversation_evaluations
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    
    RAISE NOTICE '✅ Políticas RLS recreadas exitosamente';
END $$;

-- 7. Verificar que las políticas se crearon
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'conversation_evaluations';
