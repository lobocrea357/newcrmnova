# 🚀 Guía de Instalación Completa - CRM WhatsApp

## 📋 Orden de Ejecución

Sigue estos pasos **EN ORDEN** para configurar la base de datos desde cero.

---

## ✅ PASO 1: Limpiar y Crear Schema

### 1.1 Ir a Supabase Dashboard
```
https://supabase.com/dashboard
Proyecto: cfklyrpftknzhpkzqeme
```

### 1.2 Abrir SQL Editor
- Click en **"SQL Editor"** en el menú lateral
- Click en **"New Query"**

### 1.3 Ejecutar Script de Schema
- Abrir el archivo: `SCHEMA_COMPLETO_LIMPIO.sql`
- Copiar TODO el contenido
- Pegar en el SQL Editor
- Click en **"Run"** (o presionar `Ctrl + Enter`)

### 1.4 Verificar Resultado
Deberías ver al final:
```
✅ SCHEMA CREADO EXITOSAMENTE
Total de tablas creadas: 12
Roles disponibles: admin, worker, viewer
```

---

## ✅ PASO 2: Crear Usuarios en Supabase Auth

### 2.1 Ir a Authentication
- Click en **"Authentication"** en el menú lateral
- Click en **"Users"**

### 2.2 Crear Usuario Admin
- Click en **"Add User"** (o "Invite User")
- **Email**: `admin@novapolointranet.xyz`
- **Password**: (elige una contraseña segura)
- **Auto Confirm User**: ✅ Activar
- Click en **"Create User"** o **"Send Invitation"**

### 2.3 Crear Usuario Worker (Moises)
- Click en **"Add User"** nuevamente
- **Email**: `Moisesnova923@gmail.com`
- **Password**: (elige una contraseña segura)
- **Auto Confirm User**: ✅ Activar
- Click en **"Create User"**

### 2.4 Verificar Usuarios Creados
Deberías ver 2 usuarios en la lista:
- ✅ admin@novapolointranet.xyz
- ✅ Moisesnova923@gmail.com

---

## ✅ PASO 3: Insertar Perfiles de Usuarios

### 3.1 Volver a SQL Editor
- Click en **"SQL Editor"**
- Click en **"New Query"**

### 3.2 Ejecutar Script de Datos
- Abrir el archivo: `INSERTAR_USUARIOS_Y_DATOS.sql`
- Copiar TODO el contenido
- Pegar en el SQL Editor
- Click en **"Run"**

### 3.3 Verificar Resultado
Deberías ver:
```
=== ROLES ===
admin, worker, viewer

=== PERFILES ===
admin@novapolointranet.xyz - Administrador - admin
Moisesnova923@gmail.com - Moises - worker
```

**⚠️ NOTA**: Los workers y bots NO se crean aquí, se crean desde WAHA Dashboard

---

## ✅ PASO 4: Crear Workers y Bots desde WAHA

### 4.1 Acceder a WAHA Dashboard
```
http://localhost:3000/dashboard  (WAHA Dashboard, no el CRM)
```

### 4.2 Crear Worker (si WAHA lo soporta)
- Ir a sección de Workers/Agents
- Crear worker con email: `Moisesnova923@gmail.com`
- Esto creará automáticamente el worker en la base de datos

### 4.3 Crear Bot/Sesión
- Ir a "Sessions"
- Click en "Add Session"
- **Session Name**: `default`
- **Engine**: `NOWEB`
- Click en "Start"
- Escanear código QR con WhatsApp

### 4.4 Asignar Worker al Perfil
Después de crear el worker en WAHA:
- Abrir SQL Editor en Supabase
- Ejecutar el archivo: `ASIGNAR_WORKER_A_PERFIL.sql`
- Esto vincula el worker con el perfil del usuario

---

## ✅ PASO 5: Verificar Dashboard CRM

### 5.1 Iniciar Dashboard CRM (si no está corriendo)
```bash
cd dashboard
npm run dev
```

### 5.2 Abrir en Navegador
```
http://localhost:3000  (Dashboard CRM, no WAHA)
```

### 5.3 Hacer Login como Admin
- **Email**: `admin@novapolointranet.xyz`
- **Password**: (la que configuraste)
- Click en **"Iniciar Sesión"**

### 5.4 Verificar que se Muestran los Datos
Deberías ver:
- ✅ **Workers**: Los que creaste en WAHA
- ✅ **Bots**: Las sesiones que iniciaste en WAHA
- ✅ **Conversaciones**: Aparecerán cuando recibas mensajes

### 5.5 Hacer Login como Worker
- Cerrar sesión
- **Email**: `Moisesnova923@gmail.com`
- **Password**: (la que configuraste)
- Deberías ver **SOLO** el bot "default" (su bot asignado)

---

## 🔍 Verificación de Permisos

### Admin debe ver:
- ✅ Todos los workers
- ✅ Todos los bots (incluyendo sin asignar)
- ✅ Todas las conversaciones
- ✅ Todos los mensajes

### Worker (Moises) debe ver:
- ✅ Solo su información de worker
- ✅ Solo sus bots asignados
- ✅ Solo conversaciones de sus bots
- ✅ Solo mensajes de sus bots

---

## 📊 Estructura de Tablas Creadas

```
roles                 → 3 roles (admin, worker, viewer)
workers               → Trabajadores/agentes
profiles              → Perfiles de usuarios (vincula auth.users con roles)
bots                  → Sesiones de WhatsApp (estructura WAHA)
contacts              → Contactos de WhatsApp
chats                 → Conversaciones
messages              → Mensajes (texto, multimedia, etc.)
media_files           → Archivos multimedia
webhook_events        → Eventos de webhooks WAHA
tags                  → Etiquetas para contactos
contact_tags          → Relación contactos-etiquetas
contact_notes         → Notas de contactos
```

---

## 🔐 Sistema de Permisos (RLS)

### Funciones Creadas:
- `is_admin()` - Verifica si el usuario es admin
- `get_user_worker_id()` - Obtiene el worker_id del usuario

### Políticas:
- **Admin**: Puede ver TODO (todas las tablas)
- **Worker**: Solo ve datos de sus bots asignados
- **Viewer**: Solo lectura (a implementar según necesidad)

---

## 🐛 Troubleshooting

### ❌ Error: "No se muestran workers ni bots"

**Causa**: Usuarios no tienen perfiles creados

**Solución**:
1. Verificar que los usuarios existen en `auth.users`
2. Ejecutar nuevamente `INSERTAR_USUARIOS_Y_DATOS.sql`
3. Verificar con:
```sql
SELECT * FROM profiles;
```

### ❌ Error: "relation does not exist"

**Causa**: Schema no se ejecutó correctamente

**Solución**:
1. Ejecutar primero `SCHEMA_COMPLETO_LIMPIO.sql`
2. Luego ejecutar `INSERTAR_USUARIOS_Y_DATOS.sql`

### ❌ Error: "permission denied"

**Causa**: Políticas RLS muy restrictivas

**Solución**:
1. Verificar que el usuario tiene un perfil:
```sql
SELECT * FROM profiles WHERE email = 'TU_EMAIL';
```
2. Verificar que el perfil tiene un rol asignado

### ❌ Worker no ve sus bots

**Causa**: Bot no está asignado al worker

**Solución**:
```sql
-- Asignar bot a worker
UPDATE bots 
SET worker_id = (SELECT id FROM workers WHERE email = 'Moisesnova923@gmail.com')
WHERE session_name = 'default';
```

---

## 📝 Próximos Pasos

Después de la instalación:

1. **Configurar WAHA**:
   - Iniciar sesión de WhatsApp
   - Configurar webhooks

2. **Probar el Sistema**:
   - Enviar mensajes de prueba
   - Verificar que aparecen en el dashboard

3. **Agregar más Workers** (opcional):
```sql
INSERT INTO workers (name, email, status)
VALUES ('Nuevo Worker', 'worker@example.com', 'active');
```

4. **Crear más Bots** (opcional):
```sql
INSERT INTO bots (session_name, status, worker_id)
VALUES ('nuevo-bot', 'STOPPED', (SELECT id FROM workers WHERE email = 'worker@example.com'));
```

---

## 📚 Archivos de Referencia

- `SCHEMA_COMPLETO_LIMPIO.sql` - Schema completo de la base de datos
- `INSERTAR_USUARIOS_Y_DATOS.sql` - Usuarios y datos iniciales
- `verify-data.sql` - Script de verificación
- `dashboard/FIX_DASHBOARD.md` - Solución de problemas comunes

---

## ✅ Checklist Final

- [ ] Schema ejecutado sin errores
- [ ] 2 usuarios creados en auth.users
- [ ] 2 perfiles creados (admin y worker)
- [ ] 1 worker creado (Moises)
- [ ] 1-2 bots creados
- [ ] Dashboard corriendo en localhost:3000
- [ ] Login como admin funciona
- [ ] Login como worker funciona
- [ ] Admin ve todos los datos
- [ ] Worker solo ve sus bots

---

## 🎉 ¡Listo!

Tu CRM WhatsApp está completamente configurado y listo para usar.

**Credenciales de Acceso**:
- **Admin**: admin@novapolointranet.xyz
- **Worker**: Moisesnova923@gmail.com

**Dashboard**: http://localhost:3000
