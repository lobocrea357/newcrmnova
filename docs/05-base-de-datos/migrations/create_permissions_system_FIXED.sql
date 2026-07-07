-- =====================================================
-- SISTEMA DE PERMISOS GRANULAR - VERSIÓN CORREGIDA
-- Solo asigna permisos a roles que EXISTEN en la BD
-- =====================================================

-- 1. Tabla de permisos disponibles en el sistema
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Permisos asignados a ROLES
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 3. Permisos asignados a USUARIOS ESPECÍFICOS
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON public.user_permissions(permission_id);

-- =====================================================
-- INSERTAR PERMISOS PREDEFINIDOS
-- =====================================================

INSERT INTO public.permissions (name, description, category) VALUES
-- TASAS
('tasas.view', 'Ver tasas de conversión', 'tasas'),
('tasas.create', 'Crear nuevas tasas de conversión', 'tasas'),
('tasas.edit', 'Editar tasas existentes', 'tasas'),
('tasas.delete', 'Eliminar tasas de conversión', 'tasas'),
('tasas.history', 'Ver historial de cambios de tasas', 'tasas'),

-- MONEDAS
('monedas.view', 'Ver monedas', 'monedas'),
('monedas.create', 'Crear nuevas monedas', 'monedas'),
('monedas.edit', 'Editar monedas existentes', 'monedas'),
('monedas.delete', 'Eliminar monedas', 'monedas'),

-- USUARIOS
('users.view', 'Ver lista de usuarios', 'usuarios'),
('users.create', 'Crear nuevos usuarios', 'usuarios'),
('users.edit', 'Editar usuarios existentes', 'usuarios'),
('users.delete', 'Eliminar/desactivar usuarios', 'usuarios'),
('users.manage_permissions', 'Gestionar permisos de usuarios', 'usuarios'),

-- EQUIPOS
('equipos.view', 'Ver equipos', 'equipos'),
('equipos.create', 'Crear nuevos equipos', 'equipos'),
('equipos.edit', 'Editar equipos existentes', 'equipos'),
('equipos.delete', 'Eliminar equipos', 'equipos'),
('equipos.assign', 'Asignar usuarios a equipos', 'equipos'),

-- COTIZACIONES
('cotizaciones.view', 'Ver cotizaciones', 'cotizaciones'),
('cotizaciones.create', 'Crear cotizaciones', 'cotizaciones'),
('cotizaciones.edit', 'Editar cotizaciones', 'cotizaciones'),
('cotizaciones.delete', 'Eliminar cotizaciones', 'cotizaciones'),
('cotizaciones.export', 'Exportar cotizaciones a PDF', 'cotizaciones'),

-- VUELOS
('vuelos.view', 'Ver vuelos', 'vuelos'),
('vuelos.create', 'Crear vuelos', 'vuelos'),
('vuelos.edit', 'Editar vuelos', 'vuelos'),
('vuelos.delete', 'Eliminar vuelos', 'vuelos'),
('vuelos.confirm_payment', 'Confirmar pagos de vuelos', 'vuelos'),
('vuelos.emit', 'Emitir vuelos', 'vuelos'),

-- ANÁLISIS
('analisis.view', 'Ver análisis de rendimiento', 'analisis'),
('analisis.create', 'Crear análisis de rendimiento', 'analisis'),
('analisis.export', 'Exportar reportes de análisis', 'analisis')

ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- ASIGNAR PERMISOS SOLO A ROLES QUE EXISTEN
-- =====================================================

-- ADMIN: Todos los permisos (si existe)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- WORKER: Permisos básicos (si existe)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'worker'
  AND p.name IN (
    'cotizaciones.view', 'cotizaciones.create',
    'vuelos.view', 'vuelos.create',
    'tasas.view', 'monedas.view'
  )
ON CONFLICT DO NOTHING;

-- GERENTE: Permisos de gestión (si existe)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('gerente', 'manager')
  AND p.name IN (
    'tasas.view', 'tasas.edit',
    'monedas.view',
    'users.view',
    'equipos.view', 'equipos.edit', 'equipos.assign',
    'cotizaciones.view', 'cotizaciones.create', 'cotizaciones.edit', 'cotizaciones.export',
    'vuelos.view', 'vuelos.create', 'vuelos.edit', 'vuelos.confirm_payment', 'vuelos.emit',
    'analisis.view', 'analisis.create', 'analisis.export'
  )
ON CONFLICT DO NOTHING;

-- ASESOR: Permisos básicos (si existe)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'asesor'
  AND p.name IN (
    'tasas.view',
    'monedas.view',
    'cotizaciones.view', 'cotizaciones.create', 'cotizaciones.export',
    'vuelos.view', 'vuelos.create'
  )
ON CONFLICT DO NOTHING;

-- EMISOR: Permisos de emisión (si existe)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'emisor'
  AND p.name IN (
    'vuelos.view', 'vuelos.edit', 'vuelos.emit',
    'cotizaciones.view'
  )
ON CONFLICT DO NOTHING;

-- ADMINISTRACION: Permisos de confirmación (si existe)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'administracion'
  AND p.name IN (
    'vuelos.view', 'vuelos.confirm_payment',
    'cotizaciones.view'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.permissions IS 'Catálogo de permisos disponibles en el sistema';
COMMENT ON TABLE public.role_permissions IS 'Permisos asignados a roles (aplican a todos los usuarios del rol)';
COMMENT ON TABLE public.user_permissions IS 'Permisos específicos de usuarios (override de permisos del rol)';
COMMENT ON COLUMN public.user_permissions.granted IS 'true = dar permiso extra, false = quitar permiso del rol';
COMMENT ON COLUMN public.user_permissions.reason IS 'Justificación del permiso especial';
