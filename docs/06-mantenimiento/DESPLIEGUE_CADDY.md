# 🚀 Despliegue Completo con Caddy - Un Solo Comando

## 🎯 Arquitectura con Caddy

```
Internet
    ↓
Caddy (Puerto 80/443) - HTTPS Automático
    ↓
    ├─→ waha.novapolointranet.xyz → localhost:3000 (WAHA)
    ├─→ api.novapolointranet.xyz → localhost:4000 (Express)
    └─→ crm.novapolointranet.xyz → localhost:3001 (Dashboard)
```

## ✅ Ventajas de Usar Caddy

- ✅ **HTTPS Automático** - Certificados SSL gratis con Let's Encrypt
- ✅ **Configuración Simple** - Archivo Caddyfile fácil de leer
- ✅ **Renovación Automática** - Certificados se renuevan solos
- ✅ **HTTP/2 por Defecto** - Mejor rendimiento
- ✅ **WebSocket Support** - Para QR en tiempo real

---

## 🚀 Despliegue con Un Solo Comando

### Paso 1: Conectar al VPS

```bash
ssh usuario@tu-vps-ip
```

### Paso 2: Clonar Repositorio

```bash
git clone https://github.com/tu-usuario/crmnovabots.git
cd crmnovabots
```

### Paso 3: Configurar DNS

**IMPORTANTE**: Antes de ejecutar el script, configura tus DNS:

```
Tipo    Nombre    Valor
A       waha      TU-IP-VPS
A       api       TU-IP-VPS
A       crm       TU-IP-VPS
A       @         TU-IP-VPS
```

### Paso 4: Configurar .env

```bash
nano .env
```

**Variables críticas**:

```env
# WAHA
WAHA_API_KEY=genera_clave_aleatoria_aqui
WAHA_DASHBOARD_PASSWORD=password_seguro
WAHA_BASE_URL=https://waha.novapolointranet.xyz

# Supabase
SUPABASE_URL=https://cfklyrpftknzhpkzqeme.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_STORAGE_BUCKET=whatsapp

# Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://cfklyrpftknzhpkzqeme.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (opcional)
OPENAI_API_KEY=sk-proj-xxx
```

### Paso 5: Ejecutar Despliegue

```bash
chmod +x deploy-caddy.sh
./deploy-caddy.sh
```

**¡ESO ES TODO!** 🎉

El script automáticamente:
1. ✅ Instala Docker (si no está)
2. ✅ Instala Docker Compose (si no está)
3. ✅ Instala Caddy (si no está)
4. ✅ Configura firewall (puertos 80, 443, 22)
5. ✅ Valida variables de entorno
6. ✅ Configura Caddy con HTTPS automático
7. ✅ Construye imágenes Docker
8. ✅ Inicia todos los servicios
9. ✅ Verifica estado de salud

---

## 📋 Estructura de Archivos

```
crmnovabots/
├── Caddyfile                 # Configuración de Caddy
├── docker-compose.yml        # Servicios Docker
├── deploy-caddy.sh          # Script de despliegue
├── .env                     # Variables de entorno
├── src/                     # Backend Express
├── dashboard/               # Frontend Next.js
└── docs/                    # Documentación
```

---

## 🔍 Verificación Post-Despliegue

### 1. Verificar Servicios Docker

```bash
docker-compose ps
```

**Debe mostrar**:
```
NAME            STATUS
waha            Up (healthy)
crm-express     Up (healthy)
crm-dashboard   Up (healthy)
```

### 2. Verificar Caddy

```bash
sudo systemctl status caddy
```

**Debe mostrar**: `active (running)`

### 3. Verificar Certificados SSL

```bash
sudo caddy list-modules | grep tls
```

### 4. Probar URLs

En tu navegador:
- `https://waha.novapolointranet.xyz` → WAHA Dashboard
- `https://api.novapolointranet.xyz/health` → Express API
- `https://crm.novapolointranet.xyz` → Dashboard CRM

**Nota**: La primera vez puede tardar 1-2 minutos en obtener los certificados SSL.

---

## 📊 Comandos Útiles

### Docker

```bash
# Ver todos los logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f express

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose down

# Ver uso de recursos
docker stats
```

### Caddy

```bash
# Ver logs de Caddy
sudo journalctl -u caddy -f

# Reiniciar Caddy
sudo systemctl restart caddy

# Recargar configuración (sin downtime)
sudo systemctl reload caddy

# Validar Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

# Ver certificados
sudo caddy list-modules
```

---

## 🔧 Configuración Avanzada de Caddy

### Caddyfile Completo

```caddy
# WAHA Dashboard
waha.novapolointranet.xyz {
    reverse_proxy localhost:3000
    
    # WebSocket support para QR en tiempo real
    @websockets {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websockets localhost:3000
    
    # Headers de seguridad
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000;"
    }
    
    # Logs
    log {
        output file /var/log/caddy/waha.log {
            roll_size 10mb
            roll_keep 5
        }
        format json
    }
}

# Express API
api.novapolointranet.xyz {
    reverse_proxy localhost:4000
    
    # CORS headers
    header {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
    
    # Logs
    log {
        output file /var/log/caddy/api.log {
            roll_size 10mb
            roll_keep 5
        }
        format json
    }
}

# Dashboard CRM
crm.novapolointranet.xyz {
    reverse_proxy localhost:3001
    
    # Headers para Next.js
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000;"
    }
    
    # Logs
    log {
        output file /var/log/caddy/crm.log {
            roll_size 10mb
            roll_keep 5
        }
        format json
    }
}

# Redirigir dominio principal
novapolointranet.xyz {
    redir https://crm.novapolointranet.xyz{uri} permanent
}

www.novapolointranet.xyz {
    redir https://crm.novapolointranet.xyz{uri} permanent
}
```

---

## 🔐 Seguridad

### Firewall (UFW)

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (redirige a HTTPS)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Ver estado
sudo ufw status
```

### Autenticación Básica (Opcional)

Para proteger WAHA Dashboard:

```caddy
waha.novapolointranet.xyz {
    basicauth {
        admin $2a$14$Zkx19XLiW6VYouLHR5NmfOFU0z2GTNmpkT/5qqR7hx7wNQIqGba
    }
    reverse_proxy localhost:3000
}
```

Generar hash de password:

```bash
caddy hash-password
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

# Reiniciar Caddy (si cambió Caddyfile)
sudo systemctl reload caddy
```

### Actualizar Solo un Servicio

```bash
# Reconstruir servicio específico
docker-compose build --no-cache express

# Reiniciar solo ese servicio
docker-compose up -d express
```

---

## 🆘 Troubleshooting

### Caddy no inicia

```bash
# Ver logs de error
sudo journalctl -u caddy -n 50

# Validar configuración
sudo caddy validate --config /etc/caddy/Caddyfile

# Verificar permisos
sudo chown -R caddy:caddy /var/log/caddy
```

### Certificados SSL no se obtienen

```bash
# Verificar DNS
dig waha.novapolointranet.xyz
dig api.novapolointranet.xyz
dig crm.novapolointranet.xyz

# Verificar firewall
sudo ufw status

# Ver logs de Caddy
sudo journalctl -u caddy -f
```

### Dashboard no carga

```bash
# Verificar servicio
docker-compose ps dashboard

# Ver logs
docker-compose logs -f dashboard

# Verificar variables de entorno
docker-compose exec dashboard env | grep NEXT_PUBLIC
```

### API no responde

```bash
# Verificar servicio
docker-compose ps express

# Ver logs
docker-compose logs -f express

# Probar directamente
curl http://localhost:4000/health
```

---

## 📈 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Docker (todos los servicios)
docker-compose logs -f

# Caddy
sudo journalctl -u caddy -f

# Específico de cada dominio
sudo tail -f /var/log/caddy/waha.log
sudo tail -f /var/log/caddy/api.log
sudo tail -f /var/log/caddy/crm.log
```

### Uso de Recursos

```bash
# Docker
docker stats

# Sistema
htop

# Espacio en disco
df -h
docker system df
```

---

## ✅ Checklist Final

Después del despliegue, verifica:

- [ ] DNS configurado correctamente
- [ ] Todos los servicios Docker están "Up (healthy)"
- [ ] Caddy está "active (running)"
- [ ] HTTPS funciona en todos los dominios
- [ ] Certificados SSL válidos
- [ ] WAHA Dashboard accesible
- [ ] Express API responde en `/health`
- [ ] Dashboard CRM carga correctamente
- [ ] Puedes crear un worker en WAHA
- [ ] QR se genera correctamente
- [ ] Mensajes se almacenan en Supabase
- [ ] Imágenes se procesan
- [ ] Logs no muestran errores críticos

---

## 🎉 ¡Listo para Producción!

Tu CRM WhatsApp está completamente desplegado con:

- ✅ HTTPS automático en todos los dominios
- ✅ Certificados SSL renovándose automáticamente
- ✅ Reverse proxy optimizado
- ✅ Logs centralizados
- ✅ Seguridad mejorada

**Comando para iniciar**: `./deploy-caddy.sh`
**URLs de acceso**:
- https://waha.novapolointranet.xyz
- https://api.novapolointranet.xyz
- https://crm.novapolointranet.xyz

---

**Última actualización**: 11 de noviembre de 2025
**Tiempo de despliegue**: ~5 minutos
**Dificultad**: ⭐ Fácil (automatizado)
