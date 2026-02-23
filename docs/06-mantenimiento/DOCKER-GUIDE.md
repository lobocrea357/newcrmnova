# 🐳 Guía de Docker Compose

Esta guía te muestra cómo levantar todo el sistema CRM WhatsApp con un solo comando usando Docker Compose.

## 📋 Requisitos Previos

1. **Docker Desktop** instalado y corriendo
2. **Archivo `.env`** configurado con tus credenciales de Supabase
3. **Base de datos en Supabase** creada con el schema (`docs/05-base-de-datos/esquemalocal.sql`)

## 🚀 Inicio Rápido

### 1. Verificar que Docker está corriendo

```powershell
docker --version
docker-compose --version
```

### 2. Configurar la base de datos en Supabase

Si aún no lo has hecho:

1. Ve a [Supabase](https://supabase.com) y abre tu proyecto
2. Ve a **SQL Editor**
3. Ejecuta el contenido de `docs/05-base-de-datos/esquemalocal.sql`

### 3. Levantar todos los servicios

```powershell
docker-compose up -d
```

Este comando:
- ✅ Descarga las imágenes necesarias (primera vez)
- ✅ Construye la imagen del servidor Express
- ✅ Levanta WAHA en el puerto 3000
- ✅ Levanta Express en el puerto 4000
- ✅ Configura la red entre los contenedores
- ✅ Configura los webhooks automáticamente

### 4. Verificar que todo está corriendo

```powershell
docker-compose ps
```

Deberías ver algo como:

```
NAME                IMAGE                    STATUS         PORTS
crm-express         crmnovabots-express     Up 30 seconds  0.0.0.0:4000->4000/tcp
waha                devlikeapro/waha        Up 45 seconds  0.0.0.0:3000->3000/tcp
```

### 5. Ver los logs

```powershell
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo de Express
docker-compose logs -f express

# Ver logs solo de WAHA
docker-compose logs -f waha
```

## 🔗 Acceder a los Servicios

### WAHA Dashboard
- **URL:** http://localhost:3000/dashboard
- **Usuario:** admin
- **Contraseña:** d7e6ad050069420ba581fb2c42f164a6

### WAHA Swagger API
- **URL:** http://localhost:3000/swagger

### Express API
- **URL:** http://localhost:4000
- **Health Check:** http://localhost:4000/health
- **Dashboard Stats:** http://localhost:4000/api/dashboard/stats

## 📊 Comandos Útiles

### Iniciar los servicios

```powershell
docker-compose up -d
```

### Detener los servicios

```powershell
docker-compose stop
```

### Detener y eliminar los contenedores

```powershell
docker-compose down
```

### Detener y eliminar contenedores + volúmenes (⚠️ borra datos de WAHA)

```powershell
docker-compose down -v
```

### Reiniciar un servicio específico

```powershell
# Reiniciar Express
docker-compose restart express

# Reiniciar WAHA
docker-compose restart waha
```

### Reconstruir las imágenes

```powershell
# Reconstruir todo
docker-compose build

# Reconstruir solo Express
docker-compose build express

# Reconstruir y levantar
docker-compose up -d --build
```

### Ver logs en tiempo real

```powershell
docker-compose logs -f
```

### Ejecutar comandos dentro de un contenedor

```powershell
# Entrar a Express
docker-compose exec express sh

# Entrar a WAHA
docker-compose exec waha sh
```

## 🔄 Actualizar el Código

Si haces cambios en el código de Express:

```powershell
# Detener, reconstruir y levantar
docker-compose up -d --build express
```

## 🗄️ Gestión de Volúmenes

Los datos de WAHA se guardan en volúmenes de Docker:

### Ver volúmenes

```powershell
docker volume ls | Select-String "crmnovabots"
```

### Hacer backup de un volumen

```powershell
# Backup de sesiones de WAHA
docker run --rm -v crmnovabots_waha_sessions:/data -v ${PWD}:/backup alpine tar czf /backup/waha_sessions_backup.tar.gz -C /data .
```

### Restaurar un volumen

```powershell
# Restaurar sesiones de WAHA
docker run --rm -v crmnovabots_waha_sessions:/data -v ${PWD}:/backup alpine tar xzf /backup/waha_sessions_backup.tar.gz -C /data
```

## 🔍 Troubleshooting

### Los contenedores no inician

```powershell
# Ver logs detallados
docker-compose logs

# Ver estado de los servicios
docker-compose ps -a
```

### Error de puerto en uso

Si el puerto 3000 o 4000 ya está en uso:

```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### Reconstruir desde cero

```powershell
# Detener todo
docker-compose down -v

# Limpiar imágenes antiguas
docker-compose build --no-cache

# Levantar de nuevo
docker-compose up -d
```

### Express no se conecta a WAHA

Verifica que ambos servicios estén en la misma red:

```powershell
docker network inspect crmnovabots_crm_network
```

### Webhooks no funcionan

1. Verifica que Express esté corriendo:
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/health"
```

2. Verifica los logs de WAHA:
```powershell
docker-compose logs waha | Select-String "webhook"
```

3. Prueba el webhook manualmente:
```powershell
$testEvent = @{
    event = "message"
    session = "test"
    payload = @{
        id = "test123"
        from = "5491112345678@c.us"
        to = "5491187654321@c.us"
        body = "Test message"
        fromMe = $false
        timestamp = [int](Get-Date -UFormat %s)
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4000/webhooks/waha" -Method POST -Body $testEvent -ContentType "application/json"
```

## 🌐 Desplegar en Producción

### Usando un servidor remoto

1. Copia los archivos al servidor:
```bash
scp -r . user@server:/path/to/app
```

2. En el servidor, configura las variables de entorno:
```bash
nano .env
```

3. Levanta los servicios:
```bash
docker-compose up -d
```

### Usando un dominio

Actualiza el archivo `.env`:

```env
WAHA_BASE_URL=https://waha.tudominio.com
WHATSAPP_HOOK_URL=https://api.tudominio.com/webhooks/waha
```

Y configura un reverse proxy (nginx, Caddy, Traefik) para manejar HTTPS.

## 📈 Monitoreo

### Ver uso de recursos

```powershell
docker stats
```

### Ver logs de errores

```powershell
docker-compose logs | Select-String "error" -CaseSensitive
```

### Health checks

```powershell
# WAHA
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Express
Invoke-RestMethod -Uri "http://localhost:4000/health"
```

## 🔐 Seguridad en Producción

1. **Cambia las contraseñas** en el archivo `.env`
2. **No expongas** los puertos directamente, usa un reverse proxy
3. **Habilita HTTPS** con Let's Encrypt
4. **Configura firewall** para permitir solo puertos necesarios
5. **Haz backups regulares** de los volúmenes y la base de datos
6. **Usa secrets** de Docker para credenciales sensibles

## 📦 Estructura de Servicios

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Docker Compose Network (crm_network)          │
│                                                 │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │              │         │                 │  │
│  │    WAHA      │────────▶│    Express      │  │
│  │  Port 3000   │ webhook │   Port 4000     │  │
│  │              │         │                 │  │
│  └──────┬───────┘         └────────┬────────┘  │
│         │                          │           │
│         │                          │           │
│    ┌────▼────┐                ┌───▼────┐      │
│    │ Volumes │                │Supabase│      │
│    │  .waha  │                │ (cloud)│      │
│    │sessions │                └────────┘      │
│    │ .media  │                                │
│    └─────────┘                                │
│                                               │
└───────────────────────────────────────────────┘
```

## 🎯 Próximos Pasos

1. ✅ Sistema funcionando con Docker Compose
2. 📱 Crear un dashboard web frontend
3. 🔐 Agregar autenticación JWT
4. 🤖 Implementar respuestas automáticas
5. 📊 Agregar más métricas y analytics
6. 🔔 Implementar notificaciones en tiempo real
7. 📤 Agregar exportación de datos

## 💡 Tips

- Usa `docker-compose up -d` para correr en background
- Usa `docker-compose logs -f` para ver logs en tiempo real
- Haz backups regulares de los volúmenes
- Monitorea el uso de recursos con `docker stats`
- Actualiza las imágenes regularmente con `docker-compose pull`

¡Listo! Ahora puedes levantar todo el sistema con un solo comando. 🎉
