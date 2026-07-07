-- =====================================================
-- ASIGNAR ROL SUPER_ADMIN A USUARIO ESPECÍFICO
-- Usuario: admin@novapolointranet.xyz
-- =====================================================

-- IMPORTANTE: Ejecutar DESPUÉS de create_super_admin_role.sql

-- 1. Verificar que el rol super_admin existe
DO $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO super_admin_count 
  FROM public.roles 
  WHERE name = 'super_admin';
  
  IF super_admin_count = 0 THEN
    RAISE EXCEPTION 'El rol super_admin no existe. Ejecuta primero create_super_admin_role.sql';
  END IF;
  
  RAISE NOTICE '✅ Rol super_admin encontrado';
END $$;

-- 2. Actualizar usuario admin@novapolointranet.xyz a super_admin
UPDATE public.profiles
SET 
  role_id = (SELECT id FROM public.roles WHERE name = 'super_admin'),
  updated_at = NOW()
WHERE email = 'admin@novapolointranet.xyz';

-- 3. Verificar el cambio
DO $$
DECLARE
  user_role_name VARCHAR;
  user_role_ranking INTEGER;
BEGIN
  SELECT r.name, r.ranking 
  INTO user_role_name, user_role_ranking
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.email = 'admin@novapolointranet.xyz';
  
  IF user_role_name IS NULL THEN
    RAISE WARNING '⚠️ Usuario admin@novapolointranet.xyz no encontrado';
  ELSIF user_role_name = 'super_admin' THEN
    RAISE NOTICE '✅ Usuario actualizado correctamente a super_admin (ranking: %)', user_role_ranking;
  ELSE
    RAISE WARNING '⚠️ Usuario tiene rol: % (esperaba super_admin)', user_role_name;
  END IF;
END $$;

-- 4. Mostrar información del usuario actualizado
SELECT 
  p.id,
  p.email,
  p.full_name,
  r.name as rol,
  r.ranking,
  p.is_active,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = p.role_id
WHERE p.email = 'admin@novapolointranet.xyz';

-- 5. Contar permisos efectivos del super_admin
SELECT 
  'Permisos del rol super_admin' as descripcion,
  COUNT(rp.id) as total_permisos
FROM public.role_permissions rp
JOIN public.roles r ON r.id = rp.role_id
WHERE r.name = 'super_admin';

-- =====================================================
-- RESULTADO ESPERADO:
-- Usuario: admin@novapolointranet.xyz
-- Rol anterior: admin (ranking 90)
-- Rol nuevo: super_admin (ranking 100)
-- Permisos: TODOS (sin restricciones)
-- =====================================================
