-- =====================================================
-- TABLA: tasas_monedas
-- Descripción: Almacena las tasas de cambio dinámicas
-- =====================================================

-- Eliminar tabla de cotizaciones si existe (requisito antiguo)
DROP TABLE IF EXISTS public.cotizaciones_guardadas CASCADE;

-- Crear tabla de tasas de cambio
CREATE TABLE IF NOT EXISTS public.tasas_monedas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moneda_codigo TEXT UNIQUE NOT NULL, -- e.g., 'USD', 'VES', 'EUR'
    moneda_nombre TEXT NOT NULL,        -- e.g., 'Dólares (USD)'
    simbolo TEXT NOT NULL DEFAULT '$',  
    tasa_conversion DECIMAL(12, 4) NOT NULL DEFAULT 1.0, -- Valor respecto a la moneda base (USD)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.tasas_monedas ENABLE ROW LEVEL SECURITY;

-- Política: TODOS pueden LEER las tasas (incluso usuarios públicos/anon)
CREATE POLICY "Public read access for exchange rates"
    ON public.tasas_monedas
    FOR SELECT
    USING (true);

-- Política: Solo usuarios AUTENTICADOS pueden ACTUALIZAR las tasas
CREATE POLICY "Authenticated users can update exchange rates"
    ON public.tasas_monedas
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Solo usuarios AUTENTICADOS pueden ELIMINAR tasas
CREATE POLICY "Authenticated users can delete exchange rates"
    ON public.tasas_monedas
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Trigger para updated_by automático
CREATE OR REPLACE FUNCTION update_tasas_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasas_user
    BEFORE UPDATE OR INSERT ON public.tasas_monedas
    FOR EACH ROW
    EXECUTE FUNCTION update_tasas_user();
    
-- Insertar datos iniciales si no existen
INSERT INTO public.tasas_monedas (moneda_codigo, moneda_nombre, simbolo, tasa_conversion)
VALUES 
    ('USD', 'Dólares (USD)', '$', 1.00),
    ('VES', 'Bolívares (VES)', 'Bs.', 65.00), -- Ejemplo, se actualizará
    ('USDT', 'USDT', '₮', 1.00),
    ('EUR', 'Euros (EUR)', '€', 0.92),
    ('COP', 'Pesos Colombianos (COP)', '$', 4300.00)
ON CONFLICT (moneda_codigo) DO NOTHING;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_tasas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasas_at
    BEFORE UPDATE ON public.tasas_monedas
    FOR EACH ROW
    EXECUTE FUNCTION update_tasas_updated_at();

COMMENT ON TABLE public.tasas_monedas IS 'Almacena las tasas de cambio actualizables para el cotizador';
COMMENT ON COLUMN public.tasas_monedas.tasa_conversion IS 'Tasa de cambio actual';
