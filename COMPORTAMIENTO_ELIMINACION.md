# 🗑️ Comportamiento de Eliminación en Cascada

## 📋 Resumen

El schema está configurado para que cuando elimines un **worker** o **bot**, se eliminen automáticamente todos los datos relacionados.

---

## 🔄 Eliminación de WORKER

### ¿Qué pasa cuando eliminas un worker?

```sql
DELETE FROM workers WHERE id = 'worker-uuid';
```

### ✅ Se Elimina Automáticamente (CASCADE):
- ❌ **Nada** - Los workers NO tienen eliminación en cascada

### ⚠️ Se Pone en NULL (SET NULL):
- 🔄 **profiles.worker_id** → Se pone en `NULL`
  - El usuario sigue existiendo pero sin worker asignado
  - Puede seguir haciendo login
  - Si es worker, no verá ningún bot (porque no tiene worker_id)

- 🔄 **bots.worker_id** → Se pone en `NULL`
  - Los bots quedan sin asignar
  - Admin puede verlos en "Bots sin asignar"
  - Puedes reasignarlos a otro worker

### 📝 Ejemplo:
```sql
-- Eliminar worker "Moises"
DELETE FROM workers WHERE email = 'Moisesnova923@gmail.com';

-- Resultado:
-- ✅ Worker eliminado
-- 🔄 Profile de Moisesnova923@gmail.com tiene worker_id = NULL
-- 🔄 Bots que tenían ese worker ahora tienen worker_id = NULL
-- ✅ Todos los chats, mensajes, contactos siguen existiendo
```

---

## 🔄 Eliminación de BOT

### ¿Qué pasa cuando eliminas un bot?

```sql
DELETE FROM bots WHERE session_name = 'default';
```

### ✅ Se Elimina Automáticamente (CASCADE):
- ❌ **contacts** - Todos los contactos de ese bot
- ❌ **chats** - Todas las conversaciones de ese bot
- ❌ **messages** - Todos los mensajes de ese bot
- ❌ **media_files** - Todos los archivos multimedia de ese bot
- ❌ **webhook_events** - Todos los eventos de ese bot
- ❌ **tags** - Todas las etiquetas de ese bot

### ⚠️ NO se Elimina:
- ✅ **workers** - El worker sigue existiendo
- ✅ **profiles** - Los perfiles siguen existiendo

### 📝 Ejemplo:
```sql
-- Eliminar bot "default"
DELETE FROM bots WHERE session_name = 'default';

-- Resultado:
-- ❌ Bot "default" eliminado
-- ❌ Todos los contactos del bot eliminados
-- ❌ Todos los chats del bot eliminados
-- ❌ Todos los mensajes del bot eliminados
-- ❌ Todos los archivos multimedia eliminados
-- ✅ Worker "Moises" sigue existiendo
-- ✅ Usuario Moisesnova923@gmail.com puede seguir haciendo login
```

---

## 🔄 Eliminación de CHAT

### ¿Qué pasa cuando eliminas un chat?

```sql
DELETE FROM chats WHERE id = 'chat-uuid';
```

### ✅ Se Elimina Automáticamente (CASCADE):
- ❌ **messages** - Todos los mensajes de ese chat

### ⚠️ Se Pone en NULL (SET NULL):
- 🔄 **messages.contact_id** → Si el contacto se elimina

### ⚠️ NO se Elimina:
- ✅ **bot** - El bot sigue existiendo
- ✅ **contact** - El contacto sigue existiendo (solo se desvincula)

---

## 🔄 Eliminación de CONTACT

### ¿Qué pasa cuando eliminas un contacto?

```sql
DELETE FROM contacts WHERE id = 'contact-uuid';
```

### ⚠️ Se Pone en NULL (SET NULL):
- 🔄 **chats.contact_id** → Se pone en `NULL`
- 🔄 **messages.contact_id** → Se pone en `NULL`

### ✅ Se Elimina Automáticamente (CASCADE):
- ❌ **contact_tags** - Relaciones con etiquetas
- ❌ **contact_notes** - Notas del contacto

### ⚠️ NO se Elimina:
- ✅ **chats** - Los chats siguen existiendo (sin contacto vinculado)
- ✅ **messages** - Los mensajes siguen existiendo (sin contacto vinculado)

---

## 🔄 Eliminación de MESSAGE

### ¿Qué pasa cuando eliminas un mensaje?

```sql
DELETE FROM messages WHERE id = 'message-uuid';
```

### ✅ Se Elimina Automáticamente (CASCADE):
- ❌ **media_files** - Archivos multimedia de ese mensaje

---

## 🔄 Eliminación de USUARIO (auth.users)

### ¿Qué pasa cuando eliminas un usuario de Supabase Auth?

```sql
DELETE FROM auth.users WHERE id = 'user-uuid';
```

### ✅ Se Elimina Automáticamente (CASCADE):
- ❌ **profiles** - El perfil del usuario

### ⚠️ NO se Elimina:
- ✅ **workers** - El worker sigue existiendo
- ✅ **bots** - Los bots siguen existiendo
- ✅ Todos los demás datos

---

## 📊 Tabla Resumen

| Eliminas | Se Elimina (CASCADE) | Se Pone NULL (SET NULL) | NO se Afecta |
|----------|---------------------|------------------------|--------------|
| **worker** | Nada | profiles.worker_id, bots.worker_id | Todo lo demás |
| **bot** | contacts, chats, messages, media_files, webhook_events, tags | - | workers, profiles |
| **chat** | messages | - | bot, contact |
| **contact** | contact_tags, contact_notes | chats.contact_id, messages.contact_id | chats, messages |
| **message** | media_files | - | chat, bot |
| **auth.user** | profiles | - | workers, bots, todo lo demás |

---

## 🛡️ Protecciones Implementadas

### 1. Worker Eliminado
```sql
-- El perfil NO se elimina, solo se desvincula
profiles.worker_id → NULL (ON DELETE SET NULL)
```

### 2. Bot Eliminado
```sql
-- Todo lo relacionado se elimina
contacts → CASCADE
chats → CASCADE
messages → CASCADE
```

### 3. Contact Eliminado
```sql
-- Los chats y mensajes NO se eliminan, solo se desvinculan
chats.contact_id → NULL (ON DELETE SET NULL)
messages.contact_id → NULL (ON DELETE SET NULL)
```

---

## 💡 Casos de Uso

### Caso 1: Reasignar Bots de un Worker
```sql
-- 1. Cambiar worker_id de los bots antes de eliminar
UPDATE bots 
SET worker_id = 'nuevo-worker-id'
WHERE worker_id = 'worker-a-eliminar-id';

-- 2. Ahora puedes eliminar el worker
DELETE FROM workers WHERE id = 'worker-a-eliminar-id';
```

### Caso 2: Limpiar Datos de un Bot
```sql
-- Eliminar solo el bot (todo lo demás se elimina automáticamente)
DELETE FROM bots WHERE session_name = 'bot-viejo';
```

### Caso 3: Eliminar Usuario pero Mantener Worker
```sql
-- 1. El usuario se elimina de auth.users
-- 2. El perfil se elimina automáticamente
-- 3. El worker sigue existiendo
-- 4. Los bots del worker siguen existiendo
-- 5. Solo se pierde el acceso del usuario al dashboard
```

---

## ⚠️ ADVERTENCIAS

### ❌ NO Hacer:
```sql
-- NO elimines un bot si quieres mantener sus mensajes
DELETE FROM bots WHERE session_name = 'default';
-- Esto eliminará TODOS los mensajes, chats y contactos
```

### ✅ SÍ Hacer:
```sql
-- Si quieres "desactivar" un bot sin perder datos:
UPDATE bots 
SET status = 'STOPPED', worker_id = NULL
WHERE session_name = 'default';
```

---

## 🔍 Verificar Antes de Eliminar

### Antes de eliminar un worker:
```sql
-- Ver cuántos bots tiene asignados
SELECT COUNT(*) FROM bots WHERE worker_id = 'worker-id';

-- Ver qué bots tiene
SELECT session_name, phone_number, status 
FROM bots 
WHERE worker_id = 'worker-id';
```

### Antes de eliminar un bot:
```sql
-- Ver cuántos datos tiene
SELECT 
    (SELECT COUNT(*) FROM contacts WHERE bot_id = 'bot-id') as contactos,
    (SELECT COUNT(*) FROM chats WHERE bot_id = 'bot-id') as chats,
    (SELECT COUNT(*) FROM messages WHERE bot_id = 'bot-id') as mensajes;
```

---

## 📝 Resumen Final

1. **Workers**: Se pueden eliminar sin perder datos, solo se desvinculan
2. **Bots**: Al eliminar, se pierde TODO (mensajes, chats, contactos)
3. **Chats**: Al eliminar, se pierden los mensajes
4. **Contacts**: Al eliminar, NO se pierden chats ni mensajes
5. **Messages**: Al eliminar, se pierden archivos multimedia

**Recomendación**: En lugar de eliminar, considera desactivar o reasignar.
