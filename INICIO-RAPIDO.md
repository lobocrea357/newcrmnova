# ⚡ Guía de Inicio Rápido

Esta guía te llevará desde cero hasta tener tu CRM WhatsApp funcionando en menos de 10 minutos.

## 📋 Antes de Empezar

Asegúrate de tener:
- ✅ Docker y Docker Compose instalados
- ✅ Una cuenta de Supabase (gratis en [supabase.com](https://supabase.com))
- ✅ Un número de WhatsApp para conectar

## 🚀 Paso 1: Configurar Supabase (5 minutos)

### 1.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que el proyecto esté listo (2-3 minutos)

### 1.2 Ejecutar el Schema

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Abre el archivo `SCHEMA_COMPLETO_LIMPIO.sql` de este repositorio
3. Copia todo el contenido
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **Run** (▶️)
6. Verifica que todas las tablas se hayan creado correctamente

### 1.3 Obtener Credenciales

1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - `URL` (Project URL)
   - `anon public` (Anon Key)
   - `service_role` (Service Role Key) ⚠️ **Mantén esto secreto**

## 🔧 Paso 2: Configurar el Proyecto (2 minutos)

### 2.1 Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd crmnovabots
```

### 2.2 Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env
nano .env  # o usa tu editor favorito
```

### 2.3 Completar el .env

Edita el archivo `.env` con tus credenciales:

```env
# ============================================
# WAHA PLUS - Seguridad
# ============================================
WAHA_API_KEY=tu_clave_secreta_aqui  # Genera una clave aleatoria
WAHA_DASHBOARD_PASSWORD=tu_password_seguro

# ============================================
# WAHA PLUS - Configuración General
# ============================================
WAHA_BASE_URL=http://localhost:3000  # Cambiar en producción

# ============================================
# SUPABASE - Base de Datos
# ============================================
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# ============================================
# SUPABASE - Frontend (Dashboard)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

> 💡 **Tip**: Para generar una API Key segura:
> ```bash
> openssl rand -hex 32
> ```

## 🐳 Paso 3: Iniciar el Sistema (3 minutos)

### Opción A: Script Automático (Recomendado)

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

El script hará todo automáticamente y te mostrará el estado de cada servicio.

### Opción B: Manual

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

### Verificar que Todo Funciona

```bash
# Ver estado de los servicios
docker-compose ps

# Deberías ver algo como:
# NAME            STATUS          PORTS
# waha            Up (healthy)    0.0.0.0:3000->3000/tcp
# crm-express     Up (healthy)    0.0.0.0:4000->4000/tcp
# crm-dashboard   Up (healthy)    0.0.0.0:3001->3000/tcp
```

## 📱 Paso 4: Conectar WhatsApp (2 minutos)

### 4.1 Acceder a WAHA Dashboard

1. Abre tu navegador en: `http://localhost:3000`
2. Inicia sesión con:
   - Usuario: `admin`
   - Contraseña: (la que configuraste en `.env`)

### 4.2 Crear un Worker

1. En WAHA Dashboard, ve a **Sessions**
2. Haz clic en **Add Session** o **New Session**
3. Configura el worker:
   - **Name**: `mi-bot` (o el nombre que prefieras)
   - **Engine**: `NOWEB` (recomendado)
4. Haz clic en **Start**

### 4.3 Escanear el Código QR

1. Se generará un código QR
2. Abre WhatsApp en tu teléfono
3. Ve a **Configuración** → **Dispositivos vinculados**
4. Escanea el código QR
5. ¡Listo! Tu bot está conectado

## 🎉 Paso 5: Usar el Dashboard (1 minuto)

### 5.1 Acceder al Dashboard CRM

1. Abre tu navegador en: `http://localhost:3001`
2. Crea tu cuenta de usuario o inicia sesión

### 5.2 Explorar el Dashboard

El dashboard te permite:
- 📨 Ver todos los mensajes recibidos
- 👥 Gestionar contactos
- 💬 Ver conversaciones
- 📊 Ver estadísticas
- ✉️ Enviar mensajes

### 5.3 Enviar tu Primer Mensaje

1. Ve a la sección de **Chats** o **Mensajes**
2. Selecciona un contacto o chat
3. Escribe tu mensaje
4. ¡Envía!

## ✅ Verificación Final

Prueba que todo funciona correctamente:

### 1. Enviar un Mensaje de Prueba

Envía un mensaje a tu número de WhatsApp conectado desde otro teléfono.

### 2. Verificar en el Dashboard

El mensaje debería aparecer automáticamente en el Dashboard CRM.

### 3. Responder desde el Dashboard

Responde al mensaje desde el Dashboard y verifica que llegue a WhatsApp.

## 🎯 Próximos Pasos

Ahora que tu CRM está funcionando, puedes:

1. **Crear más workers** para gestionar múltiples números
2. **Configurar webhooks personalizados** para integraciones
3. **Explorar la API REST** en `http://localhost:4000`
4. **Personalizar el Dashboard** según tus necesidades
5. **Configurar usuarios y roles** para tu equipo

## 📚 Documentación Adicional

- 📖 [ARQUITECTURA.md](./ARQUITECTURA.md) - Entiende cómo funciona el sistema
- 🔧 [README.md](./README.md) - Documentación completa
- 🐳 [DOCKER-GUIDE.md](./DOCKER-GUIDE.md) - Guía avanzada de Docker
- 🚀 [DEPLOY_VPS.md](./DEPLOY_VPS.md) - Despliegue en producción

## 🆘 Problemas Comunes

### El servicio no inicia

```bash
# Ver logs detallados
docker-compose logs waha
docker-compose logs express
docker-compose logs dashboard

# Reiniciar un servicio
docker-compose restart waha
```

### No aparecen los mensajes en el Dashboard

1. Verifica que el webhook esté configurado correctamente
2. Revisa los logs de Express: `docker-compose logs -f express`
3. Verifica la conexión a Supabase

### Error de conexión a Supabase

1. Verifica las credenciales en `.env`
2. Asegúrate de usar `SERVICE_ROLE_KEY` (no `ANON_KEY`)
3. Verifica que las tablas existan en Supabase

### El código QR no aparece

1. Verifica que WAHA esté corriendo: `docker-compose ps waha`
2. Revisa los logs: `docker-compose logs -f waha`
3. Intenta reiniciar el servicio: `docker-compose restart waha`

## 🛠️ Comandos Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar todos los servicios
docker-compose restart

# Detener todos los servicios
docker-compose down

# Iniciar nuevamente
docker-compose up -d
```

## 💡 Tips y Trucos

1. **Usa nombres descriptivos** para tus workers (ej: `ventas-bot`, `soporte-bot`)
2. **Configura backups automáticos** de Supabase
3. **Monitorea los logs** regularmente para detectar problemas
4. **Actualiza regularmente** las imágenes de Docker
5. **Usa HTTPS en producción** con un reverse proxy (nginx, traefik)

---

¡Felicidades! 🎉 Tu CRM WhatsApp está listo para usar.

Si tienes problemas, revisa la documentación completa o abre un issue en el repositorio.
