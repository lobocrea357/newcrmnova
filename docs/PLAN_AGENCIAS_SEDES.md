# Plan de Implementación: Sistema de Agencias y Sedes

## 📋 Resumen Ejecutivo

Implementar un sistema de gestión de agencias y sedes que permita:
- Gestionar múltiples agencias (Nova, Nova Flash, Nova Colombia, Apolo)
- Gestionar sedes/oficinas (Parral, Torre Seguro Los Andes)
- Asociar usuarios a agencias (un usuario puede pertenecer a **múltiples** agencias)
- Asociar usuarios a sedes (un usuario solo puede estar en **una** sede)

---

## 🗄️ Fase 1: Estructura de Base de Datos

### Tabla: `agencias`
```sql
CREATE TABLE agencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(20) NOT NULL UNIQUE,  -- 'nova', 'nova_flash', 'nova_colombia', 'apolo'
    descripcion TEXT,
    logo_url TEXT,
    color_primario VARCHAR(7),  -- Hex color para UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO agencias (nombre, codigo, descripcion, color_primario) VALUES
('Nova', 'nova', 'Agencia principal Nova', '#6366f1'),
('Nova Flash', 'nova_flash', 'Agencia Nova Flash', '#8b5cf6'),
('Nova Colombia', 'nova_colombia', 'Agencia Nova Colombia', '#f59e0b'),
('Apolo', 'apolo', 'Agencia Apolo', '#ef4444');
```

### Tabla: `sedes`
```sql
CREATE TABLE sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(50) NOT NULL UNIQUE,  -- 'parral', 'torre_seguro_andes'
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Venezuela',
    telefono VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO sedes (nombre, codigo, ciudad, direccion) VALUES
('Oficina del Parral', 'parral', 'Valencia', 'Centro Comercial El Parral'),
('Torre Seguro Los Andes', 'torre_seguro_andes', 'Valencia', 'Torre Seguro Los Andes');
```

### Tabla: `usuario_agencias` (Relación N:M)
```sql
CREATE TABLE usuario_agencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agencia_id UUID NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,  -- Agencia principal del usuario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    UNIQUE(user_id, agencia_id)
);

-- Índices para performance
CREATE INDEX idx_usuario_agencias_user ON usuario_agencias(user_id);
CREATE INDEX idx_usuario_agencias_agencia ON usuario_agencias(agencia_id);
```

### Tabla: `usuario_sede` (Relación 1:1 desde usuario)
```sql
-- Opción A: Agregar columna a profiles
ALTER TABLE profiles ADD COLUMN sede_id UUID REFERENCES sedes(id);
CREATE INDEX idx_profiles_sede ON profiles(sede_id);

-- O Opción B: Tabla separada (más flexible)
CREATE TABLE usuario_sede (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);
```

### Permisos necesarios
```sql
-- Agregar permisos para gestión de agencias y sedes
INSERT INTO permissions (name, description, category) VALUES
('agencias.view', 'Ver listado de agencias', 'agencias'),
('agencias.create', 'Crear nuevas agencias', 'agencias'),
('agencias.edit', 'Editar agencias existentes', 'agencias'),
('agencias.delete', 'Eliminar agencias', 'agencias'),
('agencias.assign_users', 'Asignar usuarios a agencias', 'agencias'),
('sedes.view', 'Ver listado de sedes', 'sedes'),
('sedes.create', 'Crear nuevas sedes', 'sedes'),
('sedes.edit', 'Editar sedes existentes', 'sedes'),
('sedes.delete', 'Eliminar sedes', 'sedes'),
('sedes.assign_users', 'Asignar usuarios a sedes', 'sedes');

-- Asignar permisos al rol admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' AND p.category IN ('agencias', 'sedes');
```

---

## 🔧 Fase 2: Backend (Express API)

### Archivos a crear:

#### `src/services/agenciasService.js`
```javascript
// CRUD completo para agencias
// - getAgencias()
// - getAgenciaById(id)
// - createAgencia(data)
// - updateAgencia(id, data)
// - deleteAgencia(id)
// - getAgenciasByUserId(userId)
// - assignUserToAgencia(userId, agenciaId, isPrimary)
// - removeUserFromAgencia(userId, agenciaId)
// - getUsersByAgencia(agenciaId)
```

#### `src/services/sedesService.js`
```javascript
// CRUD completo para sedes
// - getSedes()
// - getSedeById(id)
// - createSede(data)
// - updateSede(id, data)
// - deleteSede(id)
// - assignUserToSede(userId, sedeId)
// - getUsersBySede(sedeId)
```

#### `src/routes/agencias.js`
```javascript
// Rutas:
// GET    /api/agencias           - Listar agencias
// GET    /api/agencias/:id       - Obtener agencia por ID
// POST   /api/agencias           - Crear agencia
// PUT    /api/agencias/:id       - Actualizar agencia
// DELETE /api/agencias/:id       - Eliminar agencia
// GET    /api/agencias/:id/users - Usuarios de una agencia
// POST   /api/agencias/:id/users - Asignar usuario a agencia
// DELETE /api/agencias/:id/users/:userId - Quitar usuario de agencia
```

#### `src/routes/sedes.js`
```javascript
// Rutas:
// GET    /api/sedes              - Listar sedes
// GET    /api/sedes/:id          - Obtener sede por ID
// POST   /api/sedes              - Crear sede
// PUT    /api/sedes/:id          - Actualizar sede
// DELETE /api/sedes/:id          - Eliminar sede
// GET    /api/sedes/:id/users    - Usuarios de una sede
// POST   /api/sedes/:id/users    - Asignar usuario a sede
```

---

## 🎨 Fase 3: Frontend (Dashboard)

### Nuevos componentes:

#### `dashboard/src/components/agencias/AgenciasManager.jsx`
- Lista de agencias con CRUD
- Formulario de creación/edición
- Gestión de usuarios por agencia

#### `dashboard/src/components/sedes/SedesManager.jsx`
- Lista de sedes con CRUD
- Formulario de creación/edición
- Gestión de usuarios por sede

#### `dashboard/src/components/users/UserAgenciasTab.jsx`
- Tab dentro de gestión de usuarios
- Asignar/quitar agencias a usuarios
- Marcar agencia principal

#### `dashboard/src/components/users/UserSedesTab.jsx`
- Tab dentro de gestión de usuarios
- Asignar sede a usuario (una sola)

### Modificaciones a archivos existentes:

#### `dashboard/src/app/(crm)/configuracion/usuarios/page.js`
Agregar nuevos tabs:
```javascript
const tabs = [
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'permisos', label: 'Permisos', icon: Key },
  { id: 'permisos-rol', label: 'Permisos por Rol', icon: Settings },
  { id: 'permisos-especiales', label: 'Permisos Especiales', icon: UserCog },
  { id: 'equipos', label: 'Equipos', icon: Users2 },
  // NUEVOS TABS:
  { id: 'agencias', label: 'Agencias', icon: Building2 },
  { id: 'sedes', label: 'Sedes', icon: MapPin },
]
```

#### `dashboard/src/contexts/UserProfileContext.js`
Agregar al perfil:
```javascript
// En fetchUserProfile, agregar:
// - agencias: array de agencias del usuario
// - sede: objeto con la sede del usuario
// - agenciaPrimaria: agencia principal del usuario
```

---

## 📱 Fase 4: Integración con Cotizador

### Lógica Zelle condicional (ya existente, mejorar):
```javascript
// En CotizadorForm.jsx, usar agencia del usuario:
const { agenciaPrimaria } = useUserProfile()

const getDatosZelle = () => {
  if (agenciaPrimaria?.codigo === 'apolo') {
    return DATOS_PAGO_ZELLE_APOLO
  }
  return DATOS_PAGO_ZELLE_NOVA
}
```

---

## 🧪 Fase 5: Testing y QA

1. **Unit tests** para services de agencias y sedes
2. **Integration tests** para API endpoints
3. **E2E tests** para flujos de UI:
   - Crear agencia
   - Asignar usuario a agencia
   - Cambiar sede de usuario
   - Verificar que cotizador use agencia correcta

---

## 📅 Cronograma Sugerido

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1 | Base de datos (tablas + permisos) | 1-2 horas |
| 2 | Backend Express (services + routes) | 3-4 horas |
| 3 | Frontend (componentes + tabs) | 4-6 horas |
| 4 | Integración cotizador | 1-2 horas |
| 5 | Testing y QA | 2-3 horas |

**Total estimado: 11-17 horas**

---

## ⚠️ Consideraciones Importantes

1. **Migración de datos**: Si ya hay usuarios con agencias asignadas de alguna forma, crear script de migración.

2. **Permisos**: Solo `super_admin` y `admin` pueden gestionar agencias y sedes.

3. **UI/UX**: Los tabs de agencias y sedes deben seguir el mismo estilo visual que los existentes.

4. **Validaciones**:
   - No permitir eliminar agencia si tiene usuarios asignados
   - No permitir eliminar sede si tiene usuarios asignados
   - Un usuario DEBE tener al menos una agencia (o manejar el caso de usuario sin agencia)

5. **Auditoría**: Registrar quién y cuándo asigna/quita usuarios de agencias/sedes.

---

## 🚀 Próximos Pasos

1. ✅ Aprobar este plan
2. ⏳ Crear migración SQL para tablas
3. ⏳ Implementar backend
4. ⏳ Implementar frontend
5. ⏳ Testing
6. ⏳ Deploy a producción
