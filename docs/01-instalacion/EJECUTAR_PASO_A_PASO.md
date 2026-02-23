# 🚀 Ejecutar Scripts Paso a Paso

## 📋 PASO 1: Ejecutar Schema en Supabase

### 1.1 Abrir Supabase Dashboard
1. Abre tu navegador
2. Ve a: **https://supabase.com/dashboard**
3. Selecciona el proyecto: **cfklyrpftknzhpkzqeme**

### 1.2 Abrir SQL Editor
1. En el menú lateral izquierdo, click en **"SQL Editor"**
2. Click en **"New Query"** (botón verde arriba a la derecha)

### 1.3 Copiar el Script
1. Abre el archivo: `SCHEMA_COMPLETO_LIMPIO.sql`
2. Presiona `Ctrl + A` para seleccionar todo
3. Presiona `Ctrl + C` para copiar

**O ejecuta este comando en PowerShell:**
```powershell
Get-Content "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots\SCHEMA_COMPLETO_LIMPIO.sql" | Set-Clipboard
Write-Host "✅ Script copiado al portapapeles!" -ForegroundColor Green
```

### 1.4 Pegar y Ejecutar
1. En el SQL Editor de Supabase, presiona `Ctrl + V` para pegar
2. Click en **"Run"** (o presiona `Ctrl + Enter`)
3. Espera a que termine (puede tomar 10-30 segundos)

### 1.5 Verificar Resultado
Deberías ver al final:
```
✅ SCHEMA CREADO EXITOSAMENTE
Total de tablas creadas: 12
Roles disponibles: admin, worker, viewer
```

Si ves errores, cópialos y dímelos.

---

## 📋 PASO 2: Crear Usuarios en Supabase Auth

### 2.1 Ir a Authentication
1. En Supabase Dashboard, click en **"Authentication"** (menú lateral)
2. Click en **"Users"**

### 2.2 Crear Usuario Admin
1. Click en **"Add User"** (botón verde)
2. Completa:
   - **Email**: `admin@novapolointranet.xyz`
   - **Password**: (elige una contraseña, ejemplo: `Admin123!`)
   - **Auto Confirm User**: ✅ Marcar esta casilla
3. Click en **"Create User"**

### 2.3 Crear Usuario Worker (Moises)
1. Click en **"Add User"** nuevamente
2. Completa:
   - **Email**: `Moisesnova923@gmail.com`
   - **Password**: (elige una contraseña, ejemplo: `Moises123!`)
   - **Auto Confirm User**: ✅ Marcar esta casilla
3. Click en **"Create User"**

### 2.4 Verificar
Deberías ver 2 usuarios en la lista:
- ✅ admin@novapolointranet.xyz
- ✅ Moisesnova923@gmail.com

---

## 📋 PASO 3: Crear Perfiles de Usuarios

### 3.1 Volver a SQL Editor
1. Click en **"SQL Editor"** (menú lateral)
2. Click en **"New Query"**

### 3.2 Copiar el Script
1. Abre el archivo: `INSERTAR_USUARIOS_Y_DATOS.sql`
2. Presiona `Ctrl + A` para seleccionar todo
3. Presiona `Ctrl + C` para copiar

**O ejecuta este comando en PowerShell:**
```powershell
Get-Content "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots\INSERTAR_USUARIOS_Y_DATOS.sql" | Set-Clipboard
Write-Host "✅ Script copiado al portapapeles!" -ForegroundColor Green
```

### 3.3 Pegar y Ejecutar
1. En el SQL Editor, presiona `Ctrl + V` para pegar
2. Click en **"Run"**
3. Espera a que termine

### 3.4 Verificar Resultado
Deberías ver:
```
=== ROLES ===
admin, worker, viewer

=== PERFILES ===
admin@novapolointranet.xyz - Administrador - admin
Moisesnova923@gmail.com - Moises - worker
```

---

## 📋 PASO 4: Verificar Dashboard CRM

### 4.1 Verificar que el Dashboard está corriendo
En tu terminal/PowerShell:
```powershell
cd "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots\dashboard"
npm run dev
```

### 4.2 Abrir en Navegador
1. Abre tu navegador
2. Ve a: **http://localhost:3000**

### 4.3 Hacer Login como Admin
1. **Email**: `admin@novapolointranet.xyz`
2. **Password**: (la que configuraste en el paso 2.2)
3. Click en **"Iniciar Sesión"**

### 4.4 ¿Qué deberías ver?
- ✅ Dashboard carga correctamente
- ⚠️ **0 Workers** (normal, se crean desde WAHA)
- ⚠️ **0 Bots** (normal, se crean desde WAHA)
- ✅ **0 Conversaciones** (normal, aún no hay datos)

---

## 📋 PASO 5: Crear Workers y Bots desde WAHA (Opcional)

### 5.1 Verificar Backend Express
```powershell
cd "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots"
npm start
```

### 5.2 Acceder a WAHA
1. Abre: **http://localhost:3000/dashboard** (WAHA Dashboard)
2. O el puerto donde esté corriendo WAHA

### 5.3 Crear Sesión/Bot
1. Click en "Add Session" o "New Session"
2. **Session Name**: `default`
3. **Engine**: `NOWEB`
4. Click en "Start"
5. Escanea el código QR con WhatsApp

### 5.4 Verificar en CRM Dashboard
1. Vuelve a: **http://localhost:3000** (CRM Dashboard)
2. Recarga la página (`F5`)
3. Deberías ver el bot "default" en la lista

---

## 📋 PASO 6: Asignar Worker a Perfil (Si creaste workers)

### 6.1 Verificar Workers Creados
En Supabase SQL Editor:
```sql
SELECT id, name, email FROM workers;
```

### 6.2 Asignar Worker al Usuario
1. Abre el archivo: `ASIGNAR_WORKER_A_PERFIL.sql`
2. Modifica el email del worker si es necesario
3. Copia y pega en SQL Editor
4. Click en **"Run"**

---

## ✅ Checklist Final

- [ ] Schema ejecutado sin errores
- [ ] 2 usuarios creados (admin y worker)
- [ ] 2 perfiles creados
- [ ] Dashboard CRM carga correctamente
- [ ] Login como admin funciona
- [ ] Login como worker funciona

---

## 🐛 Si algo sale mal

### Error: "relation does not exist"
**Solución**: Ejecuta primero `SCHEMA_COMPLETO_LIMPIO.sql`

### Error: "duplicate key value"
**Solución**: Los usuarios ya existen, continúa con el siguiente paso

### Error: "permission denied"
**Solución**: Verifica que ejecutaste el schema completo

### No se muestran workers ni bots
**Solución**: Normal, se crean desde WAHA. Ejecuta el backend y WAHA.

---

## 💡 Comandos Útiles de PowerShell

### Copiar Schema al Portapapeles
```powershell
Get-Content "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots\SCHEMA_COMPLETO_LIMPIO.sql" | Set-Clipboard
Write-Host "✅ Copiado!" -ForegroundColor Green
```

### Copiar Script de Usuarios al Portapapeles
```powershell
Get-Content "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots\INSERTAR_USUARIOS_Y_DATOS.sql" | Set-Clipboard
Write-Host "✅ Copiado!" -ForegroundColor Green
```

### Iniciar Dashboard
```powershell
cd "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots\dashboard"
npm run dev
```

### Iniciar Backend
```powershell
cd "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots"
npm start
```

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún error:
1. Copia el mensaje de error completo
2. Dime en qué paso estás
3. Te ayudaré a solucionarlo

¡Vamos paso a paso! 🚀
