# 🐳 Dashboard en Docker

## 📋 Resumen

El dashboard ahora se ejecuta como un servicio adicional en Docker Compose junto con WAHA y Express.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    WAHA      │  │   Express    │  │  Dashboard   │ │
│  │   Port 3000  │  │   Port 4000  │  │  Port 3001   │ │
│  │              │  │              │  │              │ │
│  │  WhatsApp    │→→│  API + Bot   │  │  Next.js UI  │ │
│  │  HTTP API    │  │  Logic       │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ↓                  ↓                  ↓         │
│         └──────────────────┴──────────────────┘         │
│                      Supabase                           │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

Asegúrate de que tu archivo `.env` tenga estas variables:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# WAHA
WAHA_API_KEY=tu_api_key
# ... resto de variables WAHA
```

### 2. Iniciar Todos los Servicios

**Opción A: Script PowerShell (Recomendado)**
```powershell
.\start.ps1
```

**Opción B: Docker Compose Manual**
```bash
docker-compose up -d --build
```

### 3. Acceder a los Servicios

Una vez iniciados, tendrás acceso a:

- **🌐 WAHA Dashboard:** http://localhost:3000/dashboard
- **📡 WAHA API/Swagger:** http://localhost:3000/swagger
- **🚀 Express API:** http://localhost:4000
- **📊 CRM Dashboard:** http://localhost:3001 ⭐ **NUEVO**

## 🔐 Login en el Dashboard

El dashboard usa **Supabase Auth** para autenticación.

### Crear un Usuario

Si aún no tienes un usuario, créalo en Supabase:

**Opción A: Desde Supabase Dashboard**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Authentication" → "Users"
4. Haz clic en "Add user"
5. Ingresa email y contraseña

**Opción B: Desde SQL**
```sql
-- En Supabase SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('tu_contraseña', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

### Iniciar Sesión

1. Abre http://localhost:3001
2. Ingresa tu email y contraseña de Supabase
3. ¡Listo! Verás el dashboard con workers, bots y conversaciones

## 📊 Estructura del Dashboard

```
Dashboard CRM WhatsApp
├── Estadísticas
│   ├── Workers: Total de trabajadores
│   ├── Total Bots: Todos los bots
│   ├── Conversaciones: Total de chats
│   └── Bots Activos: Bots en estado "working"
│
└── Estructura Organizacional (Expandible)
    ├── Worker 1
    │   ├── Bot A
    │   │   ├── Conversación 1
    │   │   ├── Conversación 2
    │   │   └── Conversación 3
    │   └── Bot B
    │       └── Conversación 4
    │
    └── Bots sin asignar
        └── Bot C
```

## 🛠️ Comandos Útiles

### Ver Logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo el dashboard
docker-compose logs -f dashboard

# Solo WAHA
docker-compose logs -f waha

# Solo Express
docker-compose logs -f express
```

### Reiniciar Servicios

```bash
# Reiniciar todo
docker-compose restart

# Reiniciar solo el dashboard
docker-compose restart dashboard
```

### Reconstruir el Dashboard

Si haces cambios en el código del dashboard:

```bash
# Reconstruir y reiniciar
docker-compose up -d --build dashboard

# O reconstruir todo
docker-compose up -d --build
```

### Detener Servicios

```bash
# Detener todo
docker-compose stop

# Detener solo el dashboard
docker-compose stop dashboard

# Detener y eliminar contenedores
docker-compose down
```

### Ver Estado

```bash
docker-compose ps
```

## 🔧 Configuración Avanzada

### Cambiar Puerto del Dashboard

Edita `docker-compose.yml`:

```yaml
dashboard:
  ports:
    - "8080:3000"  # Cambia 8080 por el puerto que quieras
```

### Variables de Entorno Adicionales

Puedes agregar más variables en `docker-compose.yml`:

```yaml
dashboard:
  environment:
    - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
    - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    - NEXT_PUBLIC_API_URL=http://express:4000  # Ejemplo
```

## 🐛 Solución de Problemas

### Dashboard no inicia

```bash
# Ver logs del dashboard
docker-compose logs dashboard

# Verificar que el contenedor está corriendo
docker-compose ps dashboard

# Reconstruir desde cero
docker-compose down
docker-compose up -d --build
```

### Error de conexión a Supabase

1. Verifica que las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` están en `.env`
2. Verifica que son correctas en Supabase Dashboard
3. Reinicia el dashboard: `docker-compose restart dashboard`

### No se muestran datos

1. Verifica que ejecutaste las migraciones SQL en Supabase
2. Verifica que tienes datos en las tablas `workers`, `bots`, `chats`
3. Verifica las políticas RLS en Supabase

### Puerto 3001 ya está en uso

Cambia el puerto en `docker-compose.yml`:
```yaml
dashboard:
  ports:
    - "3002:3000"  # Usa otro puerto
```

## 📦 Volúmenes y Persistencia

El dashboard **no necesita volúmenes** porque:
- Los datos están en Supabase
- Es una aplicación stateless
- Se reconstruye rápidamente

## 🔄 Actualizar el Dashboard

Cuando hagas cambios en el código:

```bash
# 1. Detener el dashboard
docker-compose stop dashboard

# 2. Reconstruir
docker-compose build dashboard

# 3. Iniciar
docker-compose up -d dashboard

# O todo en uno:
docker-compose up -d --build dashboard
```

## 🌐 Acceso desde Otros Dispositivos

Para acceder al dashboard desde otros dispositivos en tu red local:

1. Encuentra tu IP local:
   ```powershell
   ipconfig
   ```

2. Accede desde otro dispositivo:
   ```
   http://TU_IP:3001
   ```

## 📝 Notas Importantes

- El dashboard se ejecuta en **modo producción** dentro de Docker
- Las variables de entorno se pasan desde el archivo `.env`
- El dashboard se comunica con Supabase directamente (no pasa por Express)
- Los logs se pueden ver con `docker-compose logs -f dashboard`

## ✨ Próximos Pasos

1. **Ejecuta las migraciones SQL** (si no lo has hecho)
2. **Crea workers de ejemplo** con `insert-sample-data.sql`
3. **Inicia los servicios** con `.\start.ps1`
4. **Accede al dashboard** en http://localhost:3001
5. **Inicia sesión** con tus credenciales de Supabase

¡Disfruta tu nuevo dashboard! 🎉
