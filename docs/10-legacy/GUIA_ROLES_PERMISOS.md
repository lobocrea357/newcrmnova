# 🔐 Sistema de Roles y Permisos

## 📋 Resumen

Sistema completo de autenticación, roles y permisos para el CRM de WhatsApp, permitiendo que diferentes usuarios tengan acceso limitado según su rol.

## 👥 Usuarios a Crear

1. **Admin**: `admin@novapolointranet.xyz`
   - Rol: `admin`
   - Permisos: Acceso total a todos los bots y chats
   - Worker: Ninguno (puede ver todo)

2. **Moises**: `Moisesnova923@gmail.com`
   - Rol: `worker`
   - Permisos: Solo puede ver bots asignados a su worker
   - Worker: "Moises" (debe existir en la tabla `workers`)

## 🏗️ Estructura de Base de Datos

### Tablas Nuevas

#### `roles`
```sql
- id: UUID
- name: VARCHAR (admin, worker, viewer)
- description: TEXT
- permissions: JSONB
- created_at, updated_at
```

#### `profiles`
```sql
- id: UUID (FK → auth.users)
- email: VARCHAR
- full_name: VARCHAR
- role_id: UUID (FK → roles)
- worker_id: UUID (FK → workers)
- is_active: BOOLEAN
- created_at, updated_at
```

### Funciones

#### `get_user_role(user_id UUID)`
Retorna el nombre del rol de un usuario.

#### `can_user_view_bot(user_id UUID, bot_id UUID)`
Verifica si un usuario puede ver un bot específico.

### Políticas RLS (Row Level Security)

- **bots**: Solo se pueden ver los bots asignados al worker del usuario
- **chats**: Solo se pueden ver chats de bots permitidos
- **messages**: Solo se pueden ver mensajes de chats permitidos

## 🚀 Pasos de Implementación

### 1. Crear Usuarios en Supabase Auth

**Opción A: Desde Supabase Dashboard**
1. Ve a Authentication → Users
2. Click en "Invite user"
3. Ingresa el email
4. Envía invitación

**Opción B: Desde SQL (requiere Service Role Key)**
```sql
-- Esto se hace desde el backend o Supabase Dashboard
```

### 2. Ejecutar Scripts SQL

**Paso 1: Crear estructura de roles**
```bash
# Ejecutar en Supabase SQL Editor
create-roles-system.sql
```

**Paso 2: Verificar que existe el worker "Moises"**
```sql
SELECT * FROM workers WHERE name ILIKE '%moises%';
```

Si no existe, crear:
```sql
INSERT INTO workers (name, email, phone, is_active)
VALUES ('Moises', 'Moisesnova923@gmail.com', NULL, true);
```

**Paso 3: Crear perfiles de usuarios**
```bash
# Ejecutar en Supabase SQL Editor
create-users.sql
```

### 3. Actualizar Frontend

El frontend debe:
1. Obtener el perfil del usuario actual
2. Filtrar bots según permisos
3. Mostrar/ocultar opciones según rol

## 🧪 Pruebas

### Verificar Roles
```sql
SELECT * FROM roles ORDER BY name;
```

### Verificar Perfiles
```sql
SELECT 
    p.email,
    p.full_name,
    r.name as role,
    w.name as worker_name,
    p.is_active
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN workers w ON p.worker_id = w.id;
```

### Probar Permisos
```sql
-- Ver qué bots puede ver el admin
SELECT 
    b.session_name,
    w.name as worker_name,
    can_user_view_bot(
        (SELECT id FROM auth.users WHERE email = 'admin@novapolointranet.xyz'),
        b.id
    ) as can_view
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;

-- Ver qué bots puede ver Moises
SELECT 
    b.session_name,
    w.name as worker_name,
    can_user_view_bot(
        (SELECT id FROM auth.users WHERE email = 'Moisesnova923@gmail.com'),
        b.id
    ) as can_view
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;
```

## 📱 Integración con Frontend

### 1. Obtener Perfil del Usuario

```javascript
// dashboard/src/lib/supabase.js

export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles(*),
      worker:workers(*)
    `)
    .eq('id', user.id)
    .single()
  
  return profile
}

export async function getUserBots(userId) {
  // RLS se encarga de filtrar automáticamente
  const { data: bots } = await supabase
    .from('bots')
    .select(`
      *,
      worker:workers(*)
    `)
    .order('created_at', { ascending: false })
  
  return bots
}
```

### 2. Actualizar Dashboard

```javascript
// dashboard/src/app/dashboard/page.js

const [profile, setProfile] = useState(null)
const [bots, setBots] = useState([])

useEffect(() => {
  loadUserData()
}, [])

async function loadUserData() {
  const userProfile = await getUserProfile()
  setProfile(userProfile)
  
  const userBots = await getUserBots(userProfile.id)
  setBots(userBots)
}

// Mostrar nombre y rol del usuario
<div>
  <p>Bienvenido, {profile?.full_name}</p>
  <p>Rol: {profile?.role?.name}</p>
  {profile?.worker && (
    <p>Worker: {profile.worker.name}</p>
  )}
</div>
```

## 🔒 Seguridad

### RLS Habilitado
- ✅ `bots`: Solo bots asignados
- ✅ `chats`: Solo chats de bots permitidos
- ✅ `messages`: Solo mensajes de chats permitidos

### Funciones SECURITY DEFINER
- ✅ `get_user_role()`: Ejecuta con permisos elevados
- ✅ `can_user_view_bot()`: Ejecuta con permisos elevados

### Políticas
- Admin puede ver TODO
- Worker solo ve bots de su worker
- Viewer solo lectura (futuro)

## 📊 Roles y Permisos

### Admin
```json
{
  "all": true
}
```
- Ver todos los bots
- Ver todos los chats
- Ver todos los mensajes
- Gestionar usuarios (futuro)
- Gestionar workers (futuro)

### Worker
```json
{
  "view_own_bots": true,
  "manage_own_chats": true
}
```
- Ver solo bots de su worker
- Ver solo chats de sus bots
- Ver solo mensajes de sus chats
- Responder mensajes (futuro)

### Viewer (Futuro)
```json
{
  "view_only": true
}
```
- Solo lectura
- No puede responder
- No puede modificar

## 🎯 Próximos Pasos

1. ✅ Crear estructura de roles en BD
2. ✅ Crear perfiles de usuarios
3. ✅ Implementar RLS
4. ⏳ Actualizar frontend para mostrar perfil
5. ⏳ Filtrar bots según permisos
6. ⏳ Agregar gestión de usuarios en dashboard
7. ⏳ Implementar envío de mensajes con permisos

## 🐛 Troubleshooting

### Usuario no puede ver ningún bot
1. Verificar que el perfil existe: `SELECT * FROM profiles WHERE email = 'email@example.com'`
2. Verificar que tiene rol asignado
3. Verificar que el worker_id es correcto
4. Verificar que los bots tienen worker_id asignado

### Admin no puede ver todos los bots
1. Verificar que el rol es 'admin'
2. Verificar que las políticas RLS están activas
3. Verificar que la función `get_user_role()` funciona

### RLS bloquea todo
1. Deshabilitar temporalmente: `ALTER TABLE bots DISABLE ROW LEVEL SECURITY;`
2. Verificar políticas: `SELECT * FROM pg_policies WHERE tablename = 'bots';`
3. Re-habilitar: `ALTER TABLE bots ENABLE ROW LEVEL SECURITY;`

---

**Sistema de roles y permisos completo y funcional** 🔐✨
