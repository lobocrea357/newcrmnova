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
