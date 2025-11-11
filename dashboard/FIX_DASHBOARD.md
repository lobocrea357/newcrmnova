# 🔧 Solución: Dashboard no muestra Workers ni Bots

## Problema
El dashboard no está mostrando workers ni bots debido a políticas RLS (Row Level Security) restrictivas en Supabase.

## ✅ Solución Rápida

### Opción 1: Ejecutar SQL en Supabase (RECOMENDADO)

1. **Ir a Supabase Dashboard**:
   - Abrir: https://supabase.com/dashboard
   - Seleccionar proyecto: `cfklyrpftknzhpkzqeme`

2. **Ir a SQL Editor**:
   - Click en "SQL Editor" en el menú lateral

3. **Ejecutar el siguiente SQL**:

```sql
-- Eliminar políticas restrictivas
DROP POLICY IF EXISTS "Users can view their assigned bots" ON bots;
DROP POLICY IF EXISTS "Admins can view all bots" ON bots;
DROP POLICY IF EXISTS "Users can view chats of their bots" ON chats;
DROP POLICY IF EXISTS "Users can view messages of their chats" ON messages;
DROP POLICY IF EXISTS "Enable all for service role" ON bots;
DROP POLICY IF EXISTS "Enable all for service role" ON contacts;
DROP POLICY IF EXISTS "Enable all for service role" ON chats;
DROP POLICY IF EXISTS "Enable all for service role" ON messages;
DROP POLICY IF EXISTS "Enable all for service role" ON workers;

-- Crear políticas permisivas
CREATE POLICY "Authenticated users can view workers"
ON workers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view bots"
ON bots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view contacts"
ON contacts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view chats"
ON chats FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view messages"
ON messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view media_files"
ON media_files FOR SELECT TO authenticated USING (true);
```

4. **Click en "Run"** para ejecutar

5. **Recargar el Dashboard** en http://localhost:3000

---

### Opción 2: Deshabilitar RLS Temporalmente (SOLO DESARROLLO)

Si necesitas una solución temporal para desarrollo:

```sql
-- ADVERTENCIA: Solo para desarrollo local
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE bots DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_files DISABLE ROW LEVEL SECURITY;
```

**⚠️ IMPORTANTE**: NO usar en producción. Esto expone todos los datos.

---

## 🔍 Verificar que funcionó

Después de ejecutar el SQL:

1. **Abrir consola del navegador** (F12)
2. **Recargar el dashboard**
3. **Buscar en consola**:
   - `👷 Workers obtenidos: X` (debe mostrar número > 0)
   - `📊 Bots obtenidos desde Supabase: X` (debe mostrar número > 0)

## 📊 Verificar datos en Supabase

Ejecutar este SQL para ver si hay datos:

```sql
-- Ver workers
SELECT id, name, email FROM workers;

-- Ver bots
SELECT id, session_name, phone_number, status, worker_id FROM bots;

-- Ver chats
SELECT id, chat_id, bot_id FROM chats LIMIT 10;
```

## 🐛 Si aún no funciona

### 1. Verificar autenticación
```javascript
// En consola del navegador
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

### 2. Verificar permisos de usuario
```sql
-- En Supabase SQL Editor
SELECT 
    p.email,
    p.full_name,
    r.name as role,
    p.is_active
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.email = 'TU_EMAIL_AQUI';
```

### 3. Crear datos de prueba si no existen

```sql
-- Crear worker de prueba
INSERT INTO workers (name, email, status)
VALUES ('Worker Test', 'test@example.com', 'active')
ON CONFLICT (email) DO NOTHING;

-- Crear bot de prueba
INSERT INTO bots (session_name, phone_number, status)
VALUES ('test-bot', '+1234567890', 'working')
ON CONFLICT (session_name) DO NOTHING;
```

## 📝 Notas

- Las políticas RLS son importantes para seguridad en producción
- Para desarrollo, usar políticas permisivas está bien
- Después puedes implementar políticas más restrictivas basadas en roles
- El archivo `fix-rls-policies.sql` contiene el script completo

## 🔗 Enlaces

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentación RLS](https://supabase.com/docs/guides/auth/row-level-security)
