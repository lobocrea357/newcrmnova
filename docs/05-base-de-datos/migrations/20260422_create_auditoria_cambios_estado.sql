-- Tabla para auditar cambios de estado de vuelos
CREATE TABLE IF NOT EXISTS public.auditoria_cambios_estado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_tipo VARCHAR(50) NOT NULL,  -- 'vuelo', 'deuda', etc.
  entidad_id UUID NOT NULL,             -- ID de la entidad que cambió
  campo_cambiado VARCHAR(100) NOT NULL, -- 'estado', 'estado_emision', etc.
  valor_anterior VARCHAR(100),
  valor_nuevo VARCHAR(100) NOT NULL,
  usuario_id UUID REFERENCES public.profiles(id),
  usuario_nombre VARCHAR(255),
  razon_cambio TEXT,                   -- Motivo del cambio
  ip_address INET,
  fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_auditoria_entidad ON public.auditoria_cambios_estado(entidad_tipo, entidad_id);
CREATE INDEX idx_auditoria_fecha ON public.auditoria_cambios_estado(fecha_cambio DESC);
CREATE INDEX idx_auditoria_usuario ON public.auditoria_cambios_estado(usuario_id);

-- Comentario de tabla
COMMENT ON TABLE public.auditoria_cambios_estado IS 'Auditoría de cambios de estado en entidades del sistema';
