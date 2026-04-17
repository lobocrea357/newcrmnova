-- Habilitar permisos de lectura para usuarios autenticados en tablas críticas
-- Esto corrige el error de "Ventas Concretadas" vacías o con error {}

DO $$
BEGIN
    -- 1. Asegurar que el rol authenticated pueda leer chats
    -- (Ajusta la política si ya existe una similar)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chats' AND policyname = 'Permitir lectura de chats a usuarios autenticados'
    ) THEN
        CREATE POLICY "Permitir lectura de chats a usuarios autenticados" 
        ON public.chats 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;

    -- 2. Asegurar que el rol authenticated pueda leer bots (necesario para el join)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bots' AND policyname = 'Permitir lectura de bots a usuarios autenticados'
    ) THEN
        CREATE POLICY "Permitir lectura de bots a usuarios autenticados" 
        ON public.bots 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;

    -- 3. Habilitar RLS si no estaba habilitado
    ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE '✅ Políticas de lectura para Auditoría configuradas.';
END $$;
