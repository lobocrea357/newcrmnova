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
