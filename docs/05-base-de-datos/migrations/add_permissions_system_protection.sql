-- Add system protection flag to permissions
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Mark essential permissions as system permissions
UPDATE permissions SET is_system = true WHERE name IN (
  'usuarios.ver',
  'usuarios.editar', 
  'usuarios.eliminar',
  'usuarios.crear',
  'roles.ver',
  'roles.editar',
  'roles.eliminar',
  'roles.crear',
  'permisos.ver',
  'permisos.editar',
  'permisos.eliminar',
  'permisos.crear',
  'equipos.ver',
  'equipos.editar',
  'equipos.eliminar',
  'equipos.crear',
  'agencias.ver',
  'agencias.editar',
  'agencias.eliminar',
  'agencias.crear',
  'sedes.ver',
  'sedes.editar',
  'sedes.eliminar',
  'sedes.crear'
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_permissions_is_system ON permissions(is_system);
