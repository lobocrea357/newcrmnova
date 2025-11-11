# 🚀 Despliegue Completo en VPS - Un Solo Comando

## 📋 Checklist Pre-Despliegue

### ✅ Requisitos del VPS

- [ ] **Sistema Operativo**: Ubuntu 20.04+ o Debian 11+
- [ ] **RAM**: Mínimo 4 GB (Recomendado 8 GB)
- [ ] **CPU**: Mínimo 2 cores
- [ ] **Disco**: Mínimo 20 GB SSD
- [ ] **Puertos abiertos**: 3000, 3001, 4000
- [ ] **Docker instalado**: v20.10+
- [ ] **Docker Compose instalado**: v2.0+

### ✅ Requisitos de Supabase

- [ ] Proyecto creado en Supabase
- [ ] Schema ejecutado (`FIX_VISTAS_COMPLETO.sql`)
- [ ] Bucket `whatsapp` creado en Storage
- [ ] Políticas RLS configuradas
- [ ] Credenciales copiadas (URL, Service Role Key, Anon Key)

### ✅ Archivos Necesarios

- [ ] `.env` configurado con todas las variables
- [ ] `docker-compose.yml` actualizado
- [ ] `deploy.sh` con permisos de ejecución
- [ ] Credenciales de Docker (si usas WAHA Plus)

---

## 🎯 Despliegue con Un Solo Comando

### Paso 1: Conectar al VPS

```bash
ssh usuario@tu-vps-ip
```

### Paso 2: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/crmnovabots.git
cd crmnovabots
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env
```

**Variables críticas a configurar**:

```env
# WAHA
WAHA_API_KEY=genera_una_clave_aleatoria_aqui
WAHA_DASHBOARD_PASSWORD=tu_password_seguro
WAHA_BASE_URL=http://tu-ip-publica:3000

# Supabase (Backend)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# OpenAI (Opcional)
OPENAI_API_KEY=sk-proj-xxx
```

### Paso 4: Ejecutar Script de Despliegue

```bash
# Dar permisos de ejecución
chmod +x deploy.sh

# Ejecutar despliegue
./deploy.sh
```

**¡ESO ES TODO!** El script automáticamente:
1. ✅ Verifica requisitos (Docker, Docker Compose)
2. ✅ Valida variables de entorno
3. ✅ Hace login en Docker (si es necesario)
4. ✅ Detiene servicios existentes
5. ✅ Construye las imágenes
6. ✅ Inicia todos los servicios
7. ✅ Verifica el estado de salud
8. ✅ Muestra URLs de acceso

---

## 🔍 Verificación Post-Despliegue

### 1. Verificar Servicios Corriendo

```bash
docker-compose ps
```

**Deberías ver**:
```
NAME            STATUS
waha            Up (healthy)
crm-express     Up (healthy)
crm-dashboard   Up (healthy)
```

### 2. Verificar Logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo errores
docker-compose logs | grep -i error
```

### 3. Probar URLs

```bash
# WAHA
curl http://localhost:3000/api/server/status

# Express
curl http://localhost:4000/health

# Dashboard
curl http://localhost:3001
```

### 4. Verificar Conectividad Externa

Desde tu navegador:
- `http://TU-IP-VPS:3000` - WAHA Dashboard
- `http://TU-IP-VPS:4000/health` - Express API
- `http://TU-IP-VPS:3001` - Dashboard CRM

---

## 🔧 Configuración de Firewall

### Ubuntu/Debian con UFW

```bash
# Permitir puertos necesarios
sudo ufw allow 3000/tcp  # WAHA
sudo ufw allow 4000/tcp  # Express
sudo ufw allow 3001/tcp  # Dashboard
sudo ufw allow 22/tcp    # SSH

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

### Google Cloud Platform

```bash
# Crear regla de firewall
gcloud compute firewall-rules create allow-crm-ports \
  --allow tcp:3000,tcp:3001,tcp:4000 \
  --source-ranges 0.0.0.0/0 \
  --description "Puertos para CRM WhatsApp"
```

---

## 🌐 Configuración de Dominio (Opcional pero Recomendado)

### Con Nginx Reverse Proxy

1. **Instalar Nginx**:
```bash
sudo apt update
sudo apt install nginx
```

2. **Configurar sitios**:

```nginx
# /etc/nginx/sites-available/crm-whatsapp

# WAHA Dashboard
server {
    listen 80;
    server_name waha.tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Express API
server {
    listen 80;
    server_name api.tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Dashboard CRM
server {
    listen 80;
    server_name crm.tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Habilitar sitio**:
```bash
sudo ln -s /etc/nginx/sites-available/crm-whatsapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Configurar HTTPS con Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d waha.tu-dominio.com -d api.tu-dominio.com -d crm.tu-dominio.com
```

---

## 🔄 Actualización del Sistema

### Actualizar Código

```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull origin main

# Reconstruir e iniciar
docker-compose build --no-cache
docker-compose up -d
```

### Actualizar Solo un Servicio

```bash
# Reconstruir servicio específico
docker-compose build --no-cache express

# Reiniciar solo ese servicio
docker-compose up -d express
```

---

## 📊 Monitoreo

### Ver Uso de Recursos

```bash
# CPU y Memoria
docker stats

# Espacio en disco
df -h
docker system df
```

### Logs Persistentes

```bash
# Configurar log rotation
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

---

## 🆘 Troubleshooting

### Dashboard no carga

**Problema**: Dashboard muestra página en blanco o error

**Solución**:
```bash
# Verificar variables de entorno
docker-compose exec dashboard env | grep NEXT_PUBLIC

# Reconstruir dashboard
docker-compose build --no-cache dashboard
docker-compose up -d dashboard

# Ver logs
docker-compose logs -f dashboard
```

### Express no conecta con WAHA

**Problema**: Webhooks no llegan

**Solución**:
```bash
# Verificar red
docker network inspect crmnovabots_crm_network

# Verificar que WAHA_BASE_URL sea correcto
docker-compose exec express env | grep WAHA

# Debe ser: http://waha:3000 (nombre del servicio, no localhost)
```

### Supabase no conecta

**Problema**: Errores de autenticación

**Solución**:
```bash
# Verificar credenciales
docker-compose exec express env | grep SUPABASE

# Probar conexión
docker-compose exec express curl -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/
```

### Imágenes no se procesan

**Problema**: Fotos no aparecen

**Solución**:
1. Verificar bucket `whatsapp` en Supabase Storage
2. Verificar políticas RLS del bucket
3. Ver logs: `docker-compose logs -f express | grep MULTIMEDIA`

---

## 🔐 Seguridad

### Cambiar Credenciales por Defecto

```bash
# Generar API Key segura
openssl rand -hex 32

# Actualizar en .env
nano .env
```

### Configurar Fail2Ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Backups Automáticos

```bash
# Crear script de backup
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup de volúmenes Docker
docker run --rm -v waha_data:/data -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/waha_data_$DATE.tar.gz /data

# Backup de Supabase (usar pg_dump o API de Supabase)
```

---

## 📈 Optimización

### Para VPS con Recursos Limitados

```yaml
# docker-compose.yml
services:
  waha:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
  
  express:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
  
  dashboard:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## ✅ Checklist Final

Después del despliegue, verifica:

- [ ] Todos los servicios están "Up (healthy)"
- [ ] WAHA Dashboard accesible desde navegador
- [ ] Express API responde en `/health`
- [ ] Dashboard CRM carga correctamente
- [ ] Puedes crear un worker en WAHA
- [ ] QR se genera correctamente
- [ ] Mensajes se almacenan en Supabase
- [ ] Imágenes se procesan y suben a Storage
- [ ] Dashboard muestra conversaciones
- [ ] Logs no muestran errores críticos

---

## 🎉 ¡Listo para Producción!

Tu CRM WhatsApp está completamente desplegado y funcionando en tu VPS.

**Comando para iniciar**: `./deploy.sh`
**Comando para detener**: `docker-compose down`
**Comando para ver logs**: `docker-compose logs -f`

---

**Última actualización**: 11 de noviembre de 2025
