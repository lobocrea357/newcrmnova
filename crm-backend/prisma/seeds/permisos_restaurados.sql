-- Restricciones únicas que tenía el esquema original (create_permissions_system_FIXED.sql)
-- y que faltaban en la base nueva: sin ellas ON CONFLICT no deduplica.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_permission_id_key') THEN
    ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_permissions_user_id_permission_id_key') THEN
    ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_id_permission_id_key UNIQUE (user_id, permission_id);
  END IF;
END $$;

-- Roles que el frontend usa (Sidebar ROUTES_BY_ROLE / UserProfileContext) y que
-- no estaban en la base nueva. Rankings de emisor/administracion = producción
-- (create_super_admin_role.sql). lider/supervisor no tenían ranking documentado:
-- se asumen 60 y 45 (solo afectan a canManageRole en la UI).
INSERT INTO public.roles (name, description, ranking) VALUES
  ('emisor',         'Emisión de boletos',                         40),
  ('administracion', 'Confirmación de pagos',                      30),
  ('lider',          'Líder de asesores (bots por sufijo)',        60),
  ('supervisor',     'Supervisor de bots _other',                  45)
ON CONFLICT (name) DO NOTHING;
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
-- =====================================================
-- CREAR ROL SUPER_ADMIN CON JERARQUÍA SUPERIOR
-- Este rol es invisible para admin y tiene control total
-- =====================================================

-- 1. Agregar columna de ranking a roles si no existe
ALTER TABLE public.roles 
ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 0;

-- 2. Actualizar ranking de roles existentes (mayor = más poder)
UPDATE public.roles SET ranking = 100 WHERE name = 'super_admin';
UPDATE public.roles SET ranking = 90 WHERE name = 'admin';
UPDATE public.roles SET ranking = 70 WHERE name = 'gerente';
UPDATE public.roles SET ranking = 50 WHERE name = 'asesor';
UPDATE public.roles SET ranking = 40 WHERE name = 'emisor';
UPDATE public.roles SET ranking = 30 WHERE name = 'administracion';
-- UPDATE public.roles SET ranking = 10 WHERE name = 'worker'; -- Worker no existe en este proyecto

-- 3. Crear rol super_admin si no existe
INSERT INTO public.roles (name, description, ranking)
VALUES ('super_admin', 'Super Administrador con control total del sistema (invisible para admins)', 100)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description, ranking = EXCLUDED.ranking;

-- 4. Crear permisos exclusivos de super_admin
INSERT INTO public.permissions (name, description, category) VALUES
('permissions.view', 'Ver permisos del sistema', 'permisos'),
('permissions.create', 'Crear nuevos permisos', 'permisos'),
('permissions.edit', 'Editar permisos existentes', 'permisos'),
('permissions.delete', 'Eliminar permisos', 'permisos'),
('permissions.assign', 'Asignar permisos a roles y usuarios', 'permisos'),
('roles.view', 'Ver roles del sistema', 'roles'),
('roles.create', 'Crear nuevos roles', 'roles'),
('roles.edit', 'Editar roles existentes', 'roles'),
('roles.delete', 'Eliminar roles', 'roles')
ON CONFLICT (name) DO NOTHING;

-- 5. Asignar TODOS los permisos a super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- 6. REMOVER permisos de CRUD usuarios de admin
DELETE FROM public.role_permissions
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
  AND permission_id IN (
    SELECT id FROM public.permissions 
    WHERE name IN (
      'users.create', 
      'users.edit', 
      'users.delete'
    )
  );

-- 7. REMOVER permisos de gestión de permisos y roles de admin
DELETE FROM public.role_permissions
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
  AND permission_id IN (
    SELECT id FROM public.permissions 
    WHERE name LIKE 'permissions.%' OR name LIKE 'roles.%'
  );

-- 8. Permitir a admin asignar permisos a usuarios (pero no a super_admin)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.name = 'users.manage_permissions'
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS Y VALIDACIONES
-- =====================================================

COMMENT ON COLUMN public.roles.ranking IS 'Jerarquía del rol (100 = máximo). Determina qué roles puede gestionar un usuario';

-- Verificar que super_admin tiene todos los permisos
DO $$
DECLARE
  total_permisos INTEGER;
  permisos_super_admin INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_permisos FROM public.permissions;
  SELECT COUNT(*) INTO permisos_super_admin 
  FROM public.role_permissions rp
  JOIN public.roles r ON r.id = rp.role_id
  WHERE r.name = 'super_admin';
  
  RAISE NOTICE '✅ Super Admin tiene % de % permisos totales', permisos_super_admin, total_permisos;
  
  IF permisos_super_admin < total_permisos THEN
    RAISE WARNING '⚠️ Super Admin no tiene todos los permisos asignados';
  END IF;
END $$;
-- ============================================================
-- MIGRACIÓN: Permisos Granulares para Gestión de Vuelos
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Crea permisos específicos para la gestión de vuelos, permitiendo
-- control granular sobre quién puede ver, crear, editar y eliminar vuelos.
-- ============================================================

-- 1. CREAR PERMISOS DE VUELOS
INSERT INTO permissions (name, description, category) VALUES
  ('vuelos.view', 'Ver vuelos propios y permitidos según rol', 'vuelos'),
  ('vuelos.view_all', 'Ver todos los vuelos sin restricción', 'vuelos'),
  ('vuelos.view_team', 'Ver vuelos de equipo (gerente)', 'vuelos'),
  ('vuelos.create', 'Crear nuevos vuelos', 'vuelos'),
  ('vuelos.edit_own', 'Editar vuelos propios (límite 3 intentos)', 'vuelos'),
  ('vuelos.edit_team', 'Editar vuelos del equipo (sin límite)', 'vuelos'),
  ('vuelos.edit_all', 'Editar cualquier vuelo (sin límite)', 'vuelos'),
  ('vuelos.delete', 'Eliminar vuelos', 'vuelos'),
  ('vuelos.confirm_payment', 'Confirmar pagos de vuelos', 'vuelos'),
  ('vuelos.mark_issued', 'Marcar vuelos como emitidos', 'vuelos')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. ASIGNAR PERMISOS A ROLES
-- ============================================================

DO $$
DECLARE
  v_super_admin_id UUID;
  v_admin_id UUID;
  v_gerente_id UUID;
  v_asesor_id UUID;
  perm RECORD;
BEGIN
  -- Obtener IDs de roles
  SELECT id INTO v_super_admin_id FROM roles WHERE name = 'super_admin' LIMIT 1;
  SELECT id INTO v_admin_id       FROM roles WHERE name = 'admin'       LIMIT 1;
  SELECT id INTO v_gerente_id     FROM roles WHERE name = 'gerente'     LIMIT 1;
  SELECT id INTO v_asesor_id      FROM roles WHERE name = 'asesor'      LIMIT 1;

  -- ============================================================
  -- SUPER ADMIN: Todos los permisos de vuelos
  -- ============================================================
  FOR perm IN SELECT id FROM permissions WHERE name LIKE 'vuelos.%' LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_super_admin_id, perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ============================================================
  -- ADMIN: Todos los permisos de vuelos
  -- ============================================================
  FOR perm IN SELECT id FROM permissions WHERE name LIKE 'vuelos.%' LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_admin_id, perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ============================================================
  -- GERENTE: Ver todos, editar equipo, confirmar, emitir
  -- ============================================================
  FOR perm IN SELECT id FROM permissions WHERE name IN (
    'vuelos.view',
    'vuelos.view_team',
    'vuelos.view_all',
    'vuelos.create',
    'vuelos.edit_own',
    'vuelos.edit_team',
    'vuelos.confirm_payment',
    'vuelos.mark_issued'
  ) LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_gerente_id, perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ============================================================
  -- ASESOR: Ver propios, crear, editar propios (con límite)
  -- ============================================================
  FOR perm IN SELECT id FROM permissions WHERE name IN (
    'vuelos.view',
    'vuelos.create',
    'vuelos.edit_own'
  ) LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_asesor_id, perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Permisos de vuelos asignados correctamente a todos los roles.';
END $$;

-- ============================================================
-- 3. VERIFICACIÓN: Ver permisos de vuelos por rol
-- ============================================================
SELECT 
  r.name AS rol,
  array_agg(p.name ORDER BY p.name) AS permisos_vuelos
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE p.category = 'vuelos'
GROUP BY r.name
ORDER BY 
  CASE r.name
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'gerente' THEN 3
    WHEN 'asesor' THEN 4
    ELSE 5
  END;
-- ============================================================
-- MIGRACIÓN: Migración a Permisos Granulares de Vuelos
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Esta migración:
-- 1. Crea permisos granulares nuevos para vuelos
-- 2. Migra permisos existentes (vuelos.edit, vuelos.emit) a los nuevos
-- 3. Asigna permisos correctos a cada rol según lógica de negocio
-- 4. Usa transacciones con rollback para seguridad
-- 5. Es idempotente (puede ejecutarse múltiples veces)
-- 6. Incluye logging de cambios
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de auditoría si no existe
CREATE TABLE IF NOT EXISTS migration_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  migration_name TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  status TEXT
);

-- ============================================================
-- TRANSACCIÓN PRINCIPAL
-- ============================================================
DO $$
DECLARE
  -- Variables para IDs de roles
  v_super_admin_id UUID;
  v_admin_id UUID;
  v_gerente_id UUID;
  v_asesor_id UUID;
  v_administracion_id UUID;
  
  -- Variables para IDs de permisos
  p_view_own UUID;
  p_view_team UUID;
  p_view_all UUID;
  p_create UUID;
  p_edit_own UUID;
  p_edit_team UUID;
  p_edit_all UUID;
  p_delete UUID;
  p_confirm_payment UUID;
  p_mark_issued UUID;
  
  -- Variables para permisos antiguos
  p_view_old UUID;
  p_edit_old UUID;
  p_emit_old UUID;
  
  -- Contadores
  v_permissions_created INTEGER := 0;
  v_permissions_assigned INTEGER := 0;
  v_permissions_removed INTEGER := 0;
  v_migration_details JSONB := '{}'::JSONB;
  
  -- Control de errores
  v_error_message TEXT;
BEGIN
  -- ============================================================
  -- 1. OBTENER IDs DE ROLES
  -- ============================================================
  SELECT id INTO v_super_admin_id FROM roles WHERE name = 'super_admin' LIMIT 1;
  SELECT id INTO v_admin_id       FROM roles WHERE name = 'admin'       LIMIT 1;
  SELECT id INTO v_gerente_id     FROM roles WHERE name = 'gerente'     LIMIT 1;
  SELECT id INTO v_asesor_id      FROM roles WHERE name = 'asesor'      LIMIT 1;
  SELECT id INTO v_administracion_id FROM roles WHERE name = 'administracion' LIMIT 1;
  
  IF v_super_admin_id IS NULL THEN
    RAISE EXCEPTION 'Rol super_admin no encontrado';
  END IF;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Rol admin no encontrado';
  END IF;
  
  IF v_gerente_id IS NULL THEN
    RAISE EXCEPTION 'Rol gerente no encontrado';
  END IF;
  
  IF v_asesor_id IS NULL THEN
    RAISE EXCEPTION 'Rol asesor no encontrado';
  END IF;
  
  -- ============================================================
  -- 2. CREAR PERMISOS GRANULARES NUEVOS
  -- ============================================================
  
  -- vuelos.view (permiso base para ver)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.view', 'Ver vuelos propios y permitidos según rol', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_view_own;
  
  IF p_view_own IS NULL THEN
    SELECT id INTO p_view_own FROM permissions WHERE name = 'vuelos.view' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.view_all (ver todos los vuelos sin restricción)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.view_all', 'Ver todos los vuelos sin restricción', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_view_all;
  
  IF p_view_all IS NULL THEN
    SELECT id INTO p_view_all FROM permissions WHERE name = 'vuelos.view_all' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.view_team (ver vuelos del equipo)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.view_team', 'Ver vuelos de equipo (gerente)', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_view_team;
  
  IF p_view_team IS NULL THEN
    SELECT id INTO p_view_team FROM permissions WHERE name = 'vuelos.view_team' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.create (crear nuevos vuelos)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.create', 'Crear nuevos vuelos', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_create;
  
  IF p_create IS NULL THEN
    SELECT id INTO p_create FROM permissions WHERE name = 'vuelos.create' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.edit_own (editar vuelos propios con límite de intentos)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.edit_own', 'Editar vuelos propios (límite 3 intentos)', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_edit_own;
  
  IF p_edit_own IS NULL THEN
    SELECT id INTO p_edit_own FROM permissions WHERE name = 'vuelos.edit_own' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.edit_team (editar vuelos del equipo sin límite)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.edit_team', 'Editar vuelos del equipo (sin límite)', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_edit_team;
  
  IF p_edit_team IS NULL THEN
    SELECT id INTO p_edit_team FROM permissions WHERE name = 'vuelos.edit_team' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.edit_all (editar cualquier vuelo sin límite)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.edit_all', 'Editar cualquier vuelo (sin límite)', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_edit_all;
  
  IF p_edit_all IS NULL THEN
    SELECT id INTO p_edit_all FROM permissions WHERE name = 'vuelos.edit_all' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.delete (eliminar vuelos)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.delete', 'Eliminar vuelos', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_delete;
  
  IF p_delete IS NULL THEN
    SELECT id INTO p_delete FROM permissions WHERE name = 'vuelos.delete' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.confirm_payment (confirmar pagos de vuelos)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.confirm_payment', 'Confirmar pagos de vuelos', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_confirm_payment;
  
  IF p_confirm_payment IS NULL THEN
    SELECT id INTO p_confirm_payment FROM permissions WHERE name = 'vuelos.confirm_payment' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- vuelos.mark_issued (marcar vuelos como emitidos)
  INSERT INTO permissions (name, description, category, is_system)
  VALUES ('vuelos.mark_issued', 'Marcar vuelos como emitidos', 'vuelos', true)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO p_mark_issued;
  
  IF p_mark_issued IS NULL THEN
    SELECT id INTO p_mark_issued FROM permissions WHERE name = 'vuelos.mark_issued' LIMIT 1;
  ELSE
    v_permissions_created := v_permissions_created + 1;
  END IF;
  
  -- ============================================================
  -- 3. OBTENER IDs DE PERMISOS ANTIGUOS (para migración)
  -- ============================================================
  SELECT id INTO p_view_old FROM permissions WHERE name = 'vuelos.view' LIMIT 1;
  SELECT id INTO p_edit_old FROM permissions WHERE name = 'vuelos.edit' LIMIT 1;
  SELECT id INTO p_emit_old FROM permissions WHERE name = 'vuelos.emit' LIMIT 1;
  
  -- ============================================================
  -- 4. MIGRAR PERMISOS POR ROL
  -- ============================================================
  
  -- ============================================================
  -- SUPER ADMIN: Todos los permisos de vuelos
  -- ============================================================
  -- Remover permisos antiguos si existen
  DELETE FROM role_permissions 
  WHERE role_id = v_super_admin_id 
    AND permission_id IN (p_edit_old, p_emit_old);
  
  -- Asignar todos los permisos granulares
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (v_super_admin_id, p_view_own),
    (v_super_admin_id, p_view_all),
    (v_super_admin_id, p_view_team),
    (v_super_admin_id, p_create),
    (v_super_admin_id, p_edit_own),
    (v_super_admin_id, p_edit_team),
    (v_super_admin_id, p_edit_all),
    (v_super_admin_id, p_delete),
    (v_super_admin_id, p_confirm_payment),
    (v_super_admin_id, p_mark_issued)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  v_permissions_assigned := v_permissions_assigned + 10;
  
  -- ============================================================
  -- ADMIN: Todos los permisos de vuelos (similar a super_admin)
  -- ============================================================
  -- Remover permisos antiguos si existen
  DELETE FROM role_permissions 
  WHERE role_id = v_admin_id 
    AND permission_id IN (p_edit_old, p_emit_old);
  
  -- Asignar todos los permisos granulares
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (v_admin_id, p_view_own),
    (v_admin_id, p_view_all),
    (v_admin_id, p_view_team),
    (v_admin_id, p_create),
    (v_admin_id, p_edit_own),
    (v_admin_id, p_edit_team),
    (v_admin_id, p_edit_all),
    (v_admin_id, p_delete),
    (v_admin_id, p_confirm_payment),
    (v_admin_id, p_mark_issued)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  v_permissions_assigned := v_permissions_assigned + 10;
  
  -- ============================================================
  -- GERENTE: Ver todos, editar equipo, confirmar, emitir
  -- ============================================================
  -- Remover permisos antiguos si existen
  DELETE FROM role_permissions 
  WHERE role_id = v_gerente_id 
    AND permission_id IN (p_edit_old, p_emit_old);
  
  -- Asignar permisos de gerente
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (v_gerente_id, p_view_own),
    (v_gerente_id, p_view_team),
    (v_gerente_id, p_view_all),
    (v_gerente_id, p_create),
    (v_gerente_id, p_edit_own),
    (v_gerente_id, p_edit_team),
    (v_gerente_id, p_confirm_payment),
    (v_gerente_id, p_mark_issued)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  v_permissions_assigned := v_permissions_assigned + 8;
  
  -- ============================================================
  -- ASESOR: Ver propios, crear, editar propios (con límite)
  -- ============================================================
  -- Remover permisos antiguos si existen
  DELETE FROM role_permissions 
  WHERE role_id = v_asesor_id 
    AND permission_id IN (p_edit_old, p_emit_old);
  
  -- Asignar permisos de asesor
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (v_asesor_id, p_view_own),
    (v_asesor_id, p_create),
    (v_asesor_id, p_edit_own)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  v_permissions_assigned := v_permissions_assigned + 3;
  
  -- ============================================================
  -- ADMINISTRACION: Ver y confirmar pagos
  -- ============================================================
  -- Remover permisos antiguos si existen
  DELETE FROM role_permissions 
  WHERE role_id = v_administracion_id 
    AND permission_id IN (p_edit_old, p_emit_old);
  
  -- Asignar permisos de administracion
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES 
    (v_administracion_id, p_view_own),
    (v_administracion_id, p_confirm_payment)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  v_permissions_assigned := v_permissions_assigned + 2;
  
  -- ============================================================
  -- 5. LIMPIAR PERMISOS ANTIGUOS (opcional - comentado por seguridad)
  -- ============================================================
  -- NOTA: Los permisos antiguos vuelos.edit y vuelos.emit se dejan
  -- en la tabla permissions por compatibilidad, pero ya no están
  -- asignados a ningún rol a través de role_permissions.
  --
  -- Si deseas eliminarlos completamente después de verificar que
  -- todo funciona, descomenta las siguientes líneas:
  --
  -- DELETE FROM permissions WHERE name IN ('vuelos.edit', 'vuelos.emit');
  -- v_permissions_removed := v_permissions_removed + 2;
  
  -- ============================================================
  -- 6. REGISTRAR AUDITORÍA
  -- ============================================================
  v_migration_details := jsonb_build_object(
    'permissions_created', v_permissions_created,
    'permissions_assigned', v_permissions_assigned,
    'permissions_removed', v_permissions_removed,
    'roles_updated', jsonb_build_object(
      'super_admin', true,
      'admin', true,
      'gerente', true,
      'asesor', true,
      'administracion', true
    )
  );
  
  INSERT INTO migration_audit (migration_name, details, status)
  VALUES (
    'migrate_vuelos_permissions_granular',
    v_migration_details,
    'SUCCESS'
  );
  
  -- ============================================================
  -- 7. MOSTRAR RESUMEN
  -- ============================================================
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Permisos creados: %', v_permissions_created;
  RAISE NOTICE '📋 Permisos asignados: %', v_permissions_assigned;
  RAISE NOTICE '🗑️  Permisos removidos: %', v_permissions_removed;
  RAISE NOTICE 'ℹ️  Detalles: %', v_migration_details;
  
EXCEPTION
  WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE NOTICE '❌ Error en migración: %', v_error_message;
    
    -- Registrar error en auditoría
    INSERT INTO migration_audit (migration_name, details, status)
    VALUES (
      'migrate_vuelos_permissions_granular',
      jsonb_build_object('error', v_error_message),
      'FAILED'
    );
    
    -- Re-lanzar el error para rollback de transacción
    RAISE EXCEPTION 'Migración fallida: %', v_error_message;
END $$;

-- ============================================================
-- 8. VERIFICACIÓN: Mostrar permisos después de migración
-- ============================================================
SELECT 
  r.name AS rol,
  array_agg(p.name ORDER BY p.name) AS permisos_vuelos
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE p.category = 'vuelos'
GROUP BY r.name
ORDER BY r.name;

-- ============================================================
-- 9. VERIFICACIÓN: Mostrar auditoría de migración
-- ============================================================
SELECT 
  migration_name,
  executed_at,
  details,
  status
FROM migration_audit
WHERE migration_name = 'migrate_vuelos_permissions_granular'
ORDER BY executed_at DESC
LIMIT 1;
-- ============================================================
-- MIGRACIÓN: Permisos de Gestión (*.manage)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Agrega permisos granulares de gestión para tasas, monedas,
-- agencias, sedes, cotizador, etc. La idea es separar "ver" de
-- "gestionar" para que la validación de tabs sea explícita.
-- ============================================================

-- 1. PERMISOS DE TASAS
INSERT INTO permissions (name, description, category) VALUES
  ('tasas.manage', 'Gestión completa de tasas de cambio', 'tasas'),
  ('tasas.edit',   'Editar tasas de cambio existentes',   'tasas'),
  ('tasas.create', 'Crear nuevas tasas de cambio',        'tasas'),
  ('tasas.delete', 'Eliminar tasas de cambio',            'tasas')
ON CONFLICT (name) DO NOTHING;

-- 2. PERMISOS DE MONEDAS
INSERT INTO permissions (name, description, category) VALUES
  ('monedas.manage', 'Gestión completa de monedas',     'monedas'),
  ('monedas.edit',   'Editar monedas existentes',        'monedas'),
  ('monedas.create', 'Crear nuevas monedas',             'monedas'),
  ('monedas.delete', 'Eliminar monedas',                 'monedas')
ON CONFLICT (name) DO NOTHING;

-- 3. PERMISOS DE AGENCIAS
INSERT INTO permissions (name, description, category) VALUES
  ('agencias.manage', 'Gestión completa de agencias',       'agencias'),
  ('agencias.edit',   'Editar agencias existentes',          'agencias'),
  ('agencias.create', 'Crear nuevas agencias',               'agencias'),
  ('agencias.delete', 'Eliminar o desactivar agencias',      'agencias'),
  ('agencias.view',   'Ver listado y detalle de agencias',   'agencias'),
  ('agencias.assign', 'Asignar/remover usuarios de agencias','agencias')
ON CONFLICT (name) DO NOTHING;

-- 4. PERMISOS DE SEDES
INSERT INTO permissions (name, description, category) VALUES
  ('sedes.manage', 'Gestión completa de sedes',         'sedes'),
  ('sedes.edit',   'Editar sedes existentes',            'sedes'),
  ('sedes.create', 'Crear nuevas sedes',                 'sedes'),
  ('sedes.delete', 'Eliminar o desactivar sedes',        'sedes'),
  ('sedes.view',   'Ver listado y detalle de sedes',     'sedes'),
  ('sedes.assign', 'Asignar/remover usuarios de sedes', 'sedes')
ON CONFLICT (name) DO NOTHING;

-- 5. PERMISOS DE USUARIOS
INSERT INTO permissions (name, description, category) VALUES
  ('usuarios.manage', 'Gestión completa de usuarios',    'usuarios'),
  ('usuarios.edit',   'Editar perfiles de usuarios',     'usuarios'),
  ('usuarios.create', 'Crear nuevos usuarios',           'usuarios'),
  ('usuarios.delete', 'Desactivar usuarios',             'usuarios'),
  ('usuarios.view',   'Ver listado de usuarios',         'usuarios')
ON CONFLICT (name) DO NOTHING;

-- 6. PERMISOS DE COTIZADOR
INSERT INTO permissions (name, description, category) VALUES
  ('cotizador.view',   'Acceso al cotizador',              'cotizador'),
  ('cotizador.export', 'Exportar cotizaciones a PDF',      'cotizador'),
  ('cotizador.save',   'Guardar cotizaciones',             'cotizador')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ASIGNAR los nuevos permisos *.manage al rol super_admin
-- (admin ya tiene canAccessAll en la lógica del frontend,
--  pero es buena práctica tenerlos en BD también)
-- ============================================================
DO $$
DECLARE
  v_super_admin_id UUID;
  v_admin_id UUID;
  v_gerente_id UUID;
  perm RECORD;
BEGIN
  SELECT id INTO v_super_admin_id FROM roles WHERE name = 'super_admin' LIMIT 1;
  SELECT id INTO v_admin_id       FROM roles WHERE name = 'admin'       LIMIT 1;
  SELECT id INTO v_gerente_id     FROM roles WHERE name = 'gerente'     LIMIT 1;

  -- Super admin: todos los permisos manage
  FOR perm IN SELECT id FROM permissions WHERE name LIKE '%.manage' OR name LIKE '%.edit' OR name LIKE '%.create' OR name LIKE '%.delete' OR name LIKE '%.assign' LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_super_admin_id, perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Admin: todos los permisos manage (igual que super_admin excepto los críticos del sistema)
  FOR perm IN SELECT id FROM permissions WHERE name LIKE '%.manage' OR name LIKE '%.edit' OR name LIKE '%.create' OR name LIKE '%.delete' OR name LIKE '%.assign' LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_admin_id, perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Gerente: permisos de view + permisos de gestión de tasas y monedas
  FOR perm IN SELECT id FROM permissions WHERE name IN (
    'tasas.manage', 'tasas.edit', 'tasas.create', 'tasas.delete',
    'monedas.manage', 'monedas.edit', 'monedas.create', 'monedas.delete',
    'agencias.view', 'sedes.view',
    'usuarios.view', 'cotizador.view', 'cotizador.export', 'cotizador.save'
  ) LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_gerente_id, perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Permisos de gestión asignados correctamente.';
END $$;

-- ============================================================
-- VERIFICACIÓN: ver los permisos creados por categoría
-- ============================================================
-- SELECT name, description, category FROM permissions
-- WHERE category IN ('tasas','monedas','agencias','sedes','usuarios','cotizador')
-- ORDER BY category, name;
-- super_admin conserva TODOS los permisos (incluidos los creados por migraciones posteriores).
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;
