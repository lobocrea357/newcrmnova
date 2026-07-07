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
