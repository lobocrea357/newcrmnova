-- Migration: Crear tablas para control de deudas con proveedores
-- Date: 2026-04-21

-- Tabla de deudas con proveedores
CREATE TABLE IF NOT EXISTS public.deudas_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuelo_id UUID NOT NULL REFERENCES public.vuelos(id) ON DELETE CASCADE,
  proveedor VARCHAR(50) NOT NULL,
  cuenta_emision VARCHAR(50) NOT NULL,
  monto_deuda NUMERIC(10, 2) NOT NULL CHECK (monto_deuda >= 0),
  moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' 
    CHECK (estado IN ('PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO_TOTAL')),
  saldo_pendiente NUMERIC(10, 2) NOT NULL CHECK (saldo_pendiente >= 0),
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deudas_estado ON public.deudas_proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_deudas_proveedor ON public.deudas_proveedores(proveedor);
CREATE INDEX IF NOT EXISTS idx_deudas_vuelo ON public.deudas_proveedores(vuelo_id);
CREATE INDEX IF NOT EXISTS idx_deudas_fecha_vencimiento ON public.deudas_proveedores(fecha_vencimiento);

-- Comentarios
COMMENT ON TABLE public.deudas_proveedores IS 'Control de deudas generadas por emisiones a crédito';
COMMENT ON COLUMN public.deudas_proveedores.saldo_pendiente IS 'Monto que falta por pagar después de pagos parciales';

-- Tabla de pagos de deudas
CREATE TABLE IF NOT EXISTS public.pagos_deudas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deuda_id UUID NOT NULL REFERENCES public.deudas_proveedores(id) ON DELETE CASCADE,
  monto_pagado NUMERIC(10, 2) NOT NULL CHECK (monto_pagado > 0),
  moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(100),
  comprobante_url TEXT,
  fecha_pago DATE NOT NULL,
  registrado_por UUID NOT NULL REFERENCES public.profiles(id),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagos_deuda ON public.pagos_deudas(deuda_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos_deudas(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_registrado_por ON public.pagos_deudas(registrado_por);

-- Comentarios
COMMENT ON TABLE public.pagos_deudas IS 'Registro de pagos realizados a proveedores';

-- Habilitar Realtime para que Johan vea autorizaciones en tiempo real (solo si no está ya habilitado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'vuelos'
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.vuelos;
        RAISE NOTICE '✅ Realtime habilitado para tabla vuelos';
    ELSE
        RAISE NOTICE 'ℹ️ Realtime ya está habilitado para tabla vuelos';
    END IF;
END $$;
