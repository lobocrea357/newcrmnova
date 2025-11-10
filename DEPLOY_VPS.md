# 🚀 Guía de Despliegue en VPS Ubuntu

## 📋 Requisitos Previos

- VPS con Ubuntu 20.04 o superior
- Acceso SSH al VPS
- Dominio apuntando al VPS (opcional pero recomendado)
- Credenciales de Supabase
- OpenAI API Key

---

## 🛠️ Paso 1: Preparar el VPS

```bash
# Conectar al VPS
ssh root@tu-vps-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar instalación
docker --version
docker compose version

# Instalar Git
apt install git -y
```

---

## 📦 Paso 2: Clonar el Repositorio

```bash
# Crear directorio para el proyecto
mkdir -p /opt/crmnovabots
cd /opt/crmnovabots

# Clonar repositorio
git clone https://github.com/lobocrea357/newcrmnova.git .

# Verificar archivos
ls -la
```

---

## 🔐 Paso 3: Configurar Variables de Entorno

```bash
# Crear archivo .env desde .env.example
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

**Contenido del `.env`:**
```env
# WAHA
WAHA_API_KEY=genera_una_clave_segura_aqui
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=tu_password_muy_seguro

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_STORAGE_BUCKET=whatsapp

# OpenAI
OPENAI_API_KEY=sk-proj-tu-api-key-de-openai

# Express
PORT=4000
NODE_ENV=production

# Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

**Guardar:** `Ctrl + X`, luego `Y`, luego `Enter`

---

## 🚀 Paso 4: Levantar los Servicios

```bash
# Construir y levantar todos los servicios
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Verificar que todos los servicios están corriendo
docker compose ps
```

**Resultado esperado:**
```
NAME            STATUS          PORTS
waha            Up              0.0.0.0:3000->3000/tcp
crm-express     Up              0.0.0.0:4000->4000/tcp
crm-dashboard   Up              0.0.0.0:3001->3001/tcp
```

---

## 🌐 Paso 5: Configurar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
apt install nginx -y

# Crear configuración del sitio
nano /etc/nginx/sites-available/crm
```

**Contenido de `/etc/nginx/sites-available/crm`:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Aumentar tamaño máximo de archivos (para multimedia)
    client_max_body_size 50M;

    # Dashboard (Frontend)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Express
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhooks
    location /webhooks {
        proxy_pass http://localhost:4000/webhooks;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WAHA API (opcional, solo si necesitas acceso externo)
    location /waha {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # Autenticación básica
        auth_basic "WAHA API";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
```

```bash
# Habilitar el sitio
ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/

# Probar configuración
nginx -t

# Recargar Nginx
systemctl reload nginx
```

---

## 🔒 Paso 6: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones en pantalla
# Elegir: Redirect HTTP to HTTPS (opción 2)
```

**Renovación automática ya está configurada por Certbot**

---

## 🔥 Paso 7: Configurar Firewall

```bash
# Habilitar firewall
ufw enable

# Permitir SSH
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Verificar reglas
ufw status
```

**NO abrir los puertos 3000, 3001, 4000 directamente. Nginx hace de proxy.**

---

## 📊 Paso 8: Configurar Supabase

En Supabase Dashboard, ejecuta:

```sql
-- 1. Ejecutar SETUP_COMPLETO.sql
-- (Copia y pega el contenido completo)

-- 2. Invitar usuarios
-- Authentication → Users → Invite user
-- - admin@novapolointranet.xyz
-- - Moisesnova923@gmail.com

-- 3. Verificar que todo funciona
SELECT * FROM roles;
SELECT * FROM profiles;
SELECT * FROM workers;
SELECT * FROM bots;
```

---

## ✅ Paso 9: Verificar Funcionamiento

### Acceder al Dashboard
```
https://tu-dominio.com
```

### Verificar Servicios
```bash
# Ver logs
docker compose logs -f express
docker compose logs -f dashboard
docker compose logs -f waha

# Ver estado
docker compose ps

# Ver uso de recursos
docker stats
```

### Probar WhatsApp
1. Accede a WAHA: `https://tu-dominio.com/waha`
2. Escanea QR con WhatsApp
3. Envía un mensaje de prueba
4. Verifica que aparece en el dashboard

---

## 🔄 Paso 10: Actualizar el Código

```bash
cd /opt/crmnovabots

# Descargar últimos cambios
git pull

# Reconstruir servicios
docker compose up -d --build

# Ver logs
docker compose logs -f
```

---

## 💾 Backup Automático

```bash
# Crear script de backup
nano /root/backup-crm.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"

mkdir -p $BACKUP_DIR

# Backup de WAHA (sesiones de WhatsApp)
docker compose -f /opt/crmnovabots/docker-compose.yml exec -T waha tar czf - /app/.waha > $BACKUP_DIR/waha_$DATE.tar.gz

# Mantener solo últimos 7 backups
find $BACKUP_DIR -name "waha_*.tar.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/waha_$DATE.tar.gz"
```

```bash
# Dar permisos de ejecución
chmod +x /root/backup-crm.sh

# Agregar a crontab (diario a las 3am)
crontab -e

# Agregar esta línea:
0 3 * * * /root/backup-crm.sh >> /var/log/crm-backup.log 2>&1
```

---

## 🐛 Troubleshooting

### Servicios no inician
```bash
# Ver logs detallados
docker compose logs express
docker compose logs dashboard
docker compose logs waha

# Verificar .env
cat .env

# Reiniciar servicios
docker compose restart
```

### Error de conexión a Supabase
```bash
# Verificar variables de entorno
docker compose exec express printenv | grep SUPABASE

# Probar conexión
docker compose exec express node -e "console.log(process.env.SUPABASE_URL)"
```

### WhatsApp no conecta
```bash
# Ver logs de WAHA
docker compose logs -f waha

# Reiniciar WAHA
docker compose restart waha

# Eliminar sesión y reconectar
docker compose exec waha rm -rf /app/.waha/sessions/default
docker compose restart waha
```

### Nginx error 502
```bash
# Verificar que los servicios están corriendo
docker compose ps

# Ver logs de Nginx
tail -f /var/log/nginx/error.log

# Reiniciar Nginx
systemctl restart nginx
```

---

## 📞 Comandos Útiles

```bash
# Ver todos los logs
docker compose logs -f

# Reiniciar un servicio específico
docker compose restart express

# Detener todo
docker compose down

# Limpiar imágenes antiguas
docker system prune -a

# Ver uso de disco
df -h

# Ver uso de memoria
free -h

# Monitorear recursos
htop
```

---

## 🎯 URLs Finales

- **Dashboard:** `https://tu-dominio.com`
- **API Express:** `https://tu-dominio.com/api`
- **Webhooks:** `https://tu-dominio.com/webhooks/waha`
- **WAHA:** `https://tu-dominio.com/waha` (protegido)

---

## ✅ Checklist de Despliegue

- [ ] VPS con Ubuntu configurado
- [ ] Docker y Docker Compose instalados
- [ ] Repositorio clonado
- [ ] `.env` creado con credenciales correctas
- [ ] Servicios corriendo (`docker compose ps`)
- [ ] Nginx instalado y configurado
- [ ] Dominio apuntando al VPS
- [ ] SSL configurado con Let's Encrypt
- [ ] Firewall configurado
- [ ] Supabase configurado (SETUP_COMPLETO.sql ejecutado)
- [ ] Usuarios invitados en Supabase
- [ ] WhatsApp conectado
- [ ] Dashboard accesible
- [ ] Backup automático configurado

---

**¡Tu CRM de WhatsApp está listo en producción!** 🎉🚀
