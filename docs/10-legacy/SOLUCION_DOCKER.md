# 🐳 Solución: Problemas con Docker

## 🔴 Problemas Encontrados

### 1. Docker Desktop no está corriendo
```
Error: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

### 2. Imagen WAHA Plus no disponible
```
Error: pull access denied for devlikeapro/waha-plus
```

## ✅ Soluciones

### Paso 1: Iniciar Docker Desktop

1. **Abre Docker Desktop manualmente**:
   - Busca "Docker Desktop" en el menú de inicio de Windows
   - Haz clic para abrir
   - Espera a que el ícono de Docker en la bandeja del sistema muestre "Docker Desktop is running"

2. **Verifica que Docker esté corriendo**:
```powershell
docker --version
docker ps
```

Si ves la versión de Docker y una lista vacía (o con contenedores), Docker está funcionando.

---

### Paso 2: Usar la Imagen Correcta de WAHA

He actualizado el `docker-compose.yml` para usar la imagen pública de WAHA:

**Antes** (requiere licencia):
```yaml
image: devlikeapro/waha-plus:noweb
```

**Ahora** (gratis y público):
```yaml
image: devlikeapro/waha:latest
```

### Diferencias entre WAHA y WAHA Plus:

| Característica | WAHA (Gratis) | WAHA Plus (Comercial) |
|----------------|---------------|----------------------|
| Sesiones simultáneas | 1 sesión | Ilimitadas |
| Costo | Gratis | Requiere licencia |
| Funcionalidad | Completa | Completa + extras |
| Imagen Docker | `devlikeapro/waha:latest` | `devlikeapro/waha-plus` |

> 💡 **Para este proyecto, WAHA gratis es suficiente**. Si necesitas múltiples sesiones, puedes levantar múltiples instancias de WAHA.

---

## 🚀 Iniciar el Sistema

### Opción 1: Comando Simple

```powershell
# Asegúrate de que Docker Desktop esté corriendo primero
docker-compose up -d
```

### Opción 2: Ver logs en tiempo real

```powershell
docker-compose up
```

(Presiona Ctrl+C para detener)

---

## 🔍 Verificar que Todo Funciona

### 1. Ver estado de los contenedores:
```powershell
docker-compose ps
```

Deberías ver algo como:
```
NAME            STATUS          PORTS
waha            Up (healthy)    0.0.0.0:3000->3000/tcp
crm-express     Up (healthy)    0.0.0.0:4000->4000/tcp
crm-dashboard   Up (healthy)    0.0.0.0:3001->3000/tcp
```

### 2. Ver logs:
```powershell
# Todos los servicios
docker-compose logs -f

# Solo WAHA
docker-compose logs -f waha

# Solo Express
docker-compose logs -f express

# Solo Dashboard
docker-compose logs -f dashboard
```

### 3. Probar las URLs:

- **WAHA**: http://localhost:3000
- **Express API**: http://localhost:4000/health
- **Dashboard**: http://localhost:3001

---

## 🛠️ Comandos Útiles

### Detener servicios:
```powershell
docker-compose down
```

### Reiniciar servicios:
```powershell
docker-compose restart
```

### Reconstruir imágenes:
```powershell
docker-compose build --no-cache
docker-compose up -d
```

### Limpiar todo (cuidado, elimina volúmenes):
```powershell
docker-compose down -v
```

### Ver logs de un servicio específico:
```powershell
docker-compose logs -f waha
```

---

## 🔧 Si WAHA Plus es Necesario

Si realmente necesitas WAHA Plus (múltiples sesiones), tienes dos opciones:

### Opción 1: Comprar Licencia

1. Ve a https://waha.devlike.pro/
2. Compra una licencia WAHA Plus
3. Actualiza el `.env`:
```env
WAHA_PLUS_VERSION=plus
WAHA_PLUS_LICENSE_KEY=tu_licencia_aqui
```
4. Actualiza `docker-compose.yml`:
```yaml
image: devlikeapro/waha-plus:latest
```

### Opción 2: Múltiples Instancias de WAHA Gratis

Puedes levantar múltiples contenedores de WAHA gratis en diferentes puertos:

```yaml
services:
  waha1:
    image: devlikeapro/waha:latest
    ports:
      - "3000:3000"
  
  waha2:
    image: devlikeapro/waha:latest
    ports:
      - "3001:3000"
  
  waha3:
    image: devlikeapro/waha:latest
    ports:
      - "3002:3000"
```

---

## ✅ Checklist de Verificación

- [ ] Docker Desktop está instalado
- [ ] Docker Desktop está corriendo (ícono verde en la bandeja)
- [ ] `docker --version` funciona
- [ ] `docker ps` funciona
- [ ] Archivo `.env` está configurado
- [ ] `docker-compose.yml` usa `devlikeapro/waha:latest`
- [ ] Ejecutar `docker-compose up -d`
- [ ] Verificar con `docker-compose ps`
- [ ] Acceder a http://localhost:3000

---

## 🆘 Problemas Comunes

### "Cannot connect to Docker daemon"
**Solución**: Inicia Docker Desktop y espera a que esté completamente arrancado.

### "Port already in use"
**Solución**: Otro servicio está usando el puerto. Detén el servicio o cambia el puerto en `docker-compose.yml`.

### "Image not found"
**Solución**: Verifica que estés usando `devlikeapro/waha:latest` (sin `-plus`).

### Contenedor se detiene inmediatamente
**Solución**: Revisa los logs con `docker-compose logs waha` para ver el error.

---

## 📞 Siguiente Paso

Una vez que Docker Desktop esté corriendo, ejecuta:

```powershell
docker-compose up -d
```

Y verifica que todo funcione con:

```powershell
docker-compose ps
docker-compose logs -f
```

¡Listo! 🎉
