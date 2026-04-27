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
