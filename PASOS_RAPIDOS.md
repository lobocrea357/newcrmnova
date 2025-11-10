# ⚡ Guía Rápida: Setup de Roles y Permisos

## 🎯 Objetivo
- **Admin** ve todos los bots
- **Moises** solo ve el bot "default" (su worker)

## 📋 Pasos (5 minutos)

### 1️⃣ Invitar Usuarios en Supabase

**Ve a:** Supabase Dashboard → Authentication → Users → "Invite user"

**Invita a:**
- ✉️ `admin@novapolointranet.xyz`
- ✉️ `Moisesnova923@gmail.com`

Espera a que acepten la invitación y creen sus contraseñas.

---

### 2️⃣ Ejecutar Script SQL

**Ve a:** Supabase Dashboard → SQL Editor → "New query"

**Copia y pega TODO el contenido de:** `SETUP_COMPLETO.sql`

**Click en:** "Run" (▶️)

**Resultado esperado:**
```
✅ Roles creados (admin, worker, viewer)
✅ Worker "Moises" creado
✅ Bot "default" asignado a Moises
✅ Perfiles de usuarios creados
✅ Permisos configurados
```

---

### 3️⃣ Verificar Resultados

El script muestra automáticamente:

**PERFILES DE USUARIOS:**
| email | full_name | role | worker_name |
|-------|-----------|------|-------------|
| admin@novapolointranet.xyz | Administrador | admin | NULL |
| Moisesnova923@gmail.com | Moises | worker | Moises |

**BOTS Y WORKERS:**
| session_name | worker_name | worker_email |
|--------------|-------------|--------------|
| default | Moises | Moisesnova923@gmail.com |

**PERMISOS:**
| usuario | session_name | worker_name | puede_ver |
|---------|--------------|-------------|-----------|
| Admin | default | Moises | **true** |
| Moises | default | Moises | **true** |

---

### 4️⃣ Probar Login

**Como Admin:**
1. Login con `admin@novapolointranet.xyz`
2. Debe ver TODOS los bots (incluido "default")

**Como Moises:**
1. Login con `Moisesnova923@gmail.com`
2. Debe ver SOLO el bot "default"

---

## ✅ Checklist

- [ ] Usuarios invitados en Supabase Auth
- [ ] Script `SETUP_COMPLETO.sql` ejecutado sin errores
- [ ] Tabla `roles` tiene 3 roles (admin, worker, viewer)
- [ ] Tabla `profiles` tiene 2 usuarios
- [ ] Tabla `workers` tiene worker "Moises"
- [ ] Bot "default" tiene `worker_id` asignado
- [ ] RLS habilitado en `bots`, `chats`, `messages`
- [ ] Admin puede ver todos los bots
- [ ] Moises solo ve bot "default"

---

## 🐛 Problemas Comunes

### "No se encontró el usuario en auth.users"
**Solución:** Los usuarios deben aceptar la invitación primero.

### "Moises no puede ver el bot"
**Solución:** Verificar que:
```sql
-- El bot tiene worker_id
SELECT session_name, worker_id FROM bots WHERE session_name = 'default';

-- El perfil tiene worker_id
SELECT email, worker_id FROM profiles WHERE email = 'Moisesnova923@gmail.com';

-- Ambos worker_id deben ser iguales
```

### "Admin no puede ver nada"
**Solución:** Verificar que el rol es 'admin':
```sql
SELECT 
    p.email,
    r.name as role
FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE p.email = 'admin@novapolointranet.xyz';
```

### "Error en políticas RLS"
**Solución:** Deshabilitar temporalmente:
```sql
ALTER TABLE bots DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

Luego re-ejecutar el script completo.

---

## 🔄 Agregar Más Usuarios

Para agregar un nuevo worker:

```sql
-- 1. Crear worker
INSERT INTO workers (name, email, is_active)
VALUES ('Nombre Worker', 'email@example.com', true);

-- 2. Invitar usuario en Supabase Auth

-- 3. Crear perfil
INSERT INTO profiles (id, email, full_name, role_id, worker_id, is_active)
SELECT 
    au.id,
    au.email,
    'Nombre Completo',
    r.id,
    w.id,
    true
FROM auth.users au
CROSS JOIN roles r
LEFT JOIN workers w ON w.email = 'email@example.com'
WHERE au.email = 'email@example.com'
  AND r.name = 'worker';

-- 4. Asignar bots al worker
UPDATE bots
SET worker_id = (SELECT id FROM workers WHERE email = 'email@example.com')
WHERE session_name IN ('bot1', 'bot2');
```

---

## 📞 Soporte

Si algo no funciona:
1. Verifica los logs de Supabase
2. Ejecuta las queries de verificación
3. Revisa que los usuarios aceptaron la invitación

---

**¡Sistema listo en 5 minutos!** ⚡🔐
