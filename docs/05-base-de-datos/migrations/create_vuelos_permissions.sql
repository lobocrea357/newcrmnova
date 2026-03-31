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
