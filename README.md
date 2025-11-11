# 🤖 CRM WhatsApp - Sistema Completo con WAHA Plus

Sistema CRM profesional para gestionar múltiples bots de WhatsApp usando **WAHA Plus**, **Express** y **Next.js**, con almacenamiento en **Supabase**.

## 🏗️ Arquitectura del Sistema

```
WAHA Plus (Puerto 3000)
    ↓ Crea Workers/Bots
    ↓ Envía Webhooks
    ↓
Express API (Puerto 4000)
    ↓ Utiliza endpoints de WAHA
    ↓ Almacena en Supabase
    ↓
Supabase (Base de Datos)
    ↑ Consulta directa
    ↑
Dashboard Next.js (Puerto 3001)
```

### 📦 Componentes

1. **WAHA Plus** - Permite crear workers y bots de WhatsApp
2. **Express API** - Utiliza endpoints de WAHA para alimentar la base de datos
3. **Supabase** - Almacena y organiza toda la base de datos
4. **Dashboard** - Consume y visualiza toda la base de datos

> 📖 **Ver documentación completa**: [ARQUITECTURA.md](./ARQUITECTURA.md)

## 🚀 Características

- ✅ **Múltiples Workers/Bots** - Gestiona varios números de WhatsApp
- ✅ **Almacenamiento Completo** - Mensajes, contactos, chats y multimedia
- ✅ **Webhooks en Tiempo Real** - Recibe eventos instantáneamente
- ✅ **API REST Completa** - Integración fácil con otros sistemas
- ✅ **Dashboard Moderno** - Interfaz intuitiva con Next.js
- ✅ **Búsqueda Avanzada** - Encuentra mensajes y contactos rápidamente
- ✅ **Envío de Multimedia** - Texto, imágenes, audios, videos
- ✅ **Engine NOWEB** - Mejor rendimiento y estabilidad
- ✅ **Despliegue con Docker** - Un solo comando para iniciar todo

## 📋 Requisitos

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Cuenta de Supabase** (gratis en supabase.com)
- **VPS** (opcional, para producción)

## 🔧 Instalación Rápida

### 🚀 Despliegue en VPS (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd crmnovabots

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus credenciales de Supabase

# 3. Ejecutar script de despliegue
chmod +x deploy-vps.sh
./deploy-vps.sh
```

El script automáticamente:
- ✅ Verifica requisitos (Docker, Docker Compose)
- ✅ Valida variables de entorno
- ✅ Construye las imágenes
- ✅ Inicia todos los servicios
- ✅ Verifica el estado de salud

### 🐳 Despliegue Manual con Docker Compose

```bash
# 1. Configurar variables de entorno
cp .env.example .env
nano .env

# 2. Configurar base de datos en Supabase
# Ejecutar SCHEMA_COMPLETO_LIMPIO.sql en Supabase SQL Editor

# 3. Iniciar todos los servicios
docker-compose up -d

# 4. Ver logs
docker-compose logs -f
```

✅ **¡Listo!** Todos los servicios estarán corriendo.

---

### 💻 Instalación para Desarrollo Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos en Supabase

1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Ejecuta el contenido del archivo `supabase-schema.sql`
4. Verifica que todas las tablas se hayan creado correctamente

### 3. Configurar variables de entorno

El archivo `.env` ya está configurado con:

```env
# WAHA
WAHA_API_KEY=a317ec51b40e4ab597fa767f7bb13e1c
WAHA_BASE_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://cfklyrpftknzhpkzqeme.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Iniciar WAHA (Docker)

```bash
docker run -d --name waha -p 3000:3000 --env-file .env -v "${PWD}\.waha:/app/.waha" devlikeapro/waha
```

### 5. Iniciar el servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:4000`

## 📡 Configurar Webhook en WAHA

Para que WAHA envíe eventos a tu servidor, necesitas configurar el webhook:

### Opción 1: Agregar al archivo .env

```env
WHATSAPP_HOOK_URL=http://localhost:4000/webhooks/waha
WHATSAPP_HOOK_EVENTS=session.status,message,message.ack,message.reaction
```

### Opción 2: Configurar por API

```bash
curl -X POST http://localhost:3000/api/sessions/default/settings \
  -H "X-Api-Key: a317ec51b40e4ab597fa767f7bb13e1c" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": [{
      "url": "http://localhost:4000/webhooks/waha",
      "events": ["session.status", "message", "message.ack", "message.reaction"]
    }]
  }'
```

## 🔌 API Endpoints

### Bots

- `GET /api/bots` - Listar todos los bots
- `POST /api/bots/sync` - Sincronizar bots con WAHA
- `POST /api/bots/:sessionName/start` - Iniciar sesión
- `POST /api/bots/:sessionName/stop` - Detener sesión
- `GET /api/bots/:sessionName/qr` - Obtener código QR
- `DELETE /api/bots/:sessionName` - Eliminar sesión

### Mensajes

- `GET /api/messages/bot/:botId` - Mensajes de un bot
- `GET /api/messages/chat/:chatId` - Mensajes de un chat
- `GET /api/messages/search?botId=X&query=texto` - Buscar mensajes
- `GET /api/messages/stats/:botId` - Estadísticas de mensajes
- `POST /api/messages/send` - Enviar mensaje

### Contactos

- `GET /api/contacts/bot/:botId` - Contactos de un bot
- `GET /api/contacts/search?botId=X&query=nombre` - Buscar contactos

### Chats

- `GET /api/chats/bot/:botId` - Chats de un bot
- `GET /api/chats/recent?botId=X&limit=50` - Conversaciones recientes

### Dashboard

- `GET /api/dashboard/stats?botId=X` - Estadísticas generales
- `GET /api/dashboard/activity?botId=X` - Actividad reciente
- `GET /api/dashboard/messages-by-hour?botId=X&hours=24` - Mensajes por hora
- `GET /api/dashboard/top-contacts?botId=X&limit=10` - Contactos más activos

### Webhooks

- `POST /webhooks/waha` - Recibir eventos de WAHA

## 📊 Estructura de la Base de Datos

### Tablas principales:

- **bots** - Sesiones de WhatsApp
- **contacts** - Contactos de WhatsApp
- **chats** - Conversaciones/Chats
- **messages** - Mensajes enviados y recibidos
- **media_files** - Archivos multimedia
- **webhook_events** - Eventos recibidos
- **tags** - Etiquetas para organizar
- **contact_tags** - Relación contactos-etiquetas
- **contact_notes** - Notas de contactos

### Vistas útiles:

- **bot_statistics** - Estadísticas por bot
- **recent_conversations** - Conversaciones recientes
- **messages_detailed** - Mensajes con detalles completos

## 🔐 Seguridad

- Las tablas tienen Row Level Security (RLS) habilitado
- Se usa el Service Role Key para operaciones del servidor
- Los webhooks deben configurarse en una red segura

## 📝 Uso Básico

### 1. Crear una sesión de WhatsApp

```bash
curl -X POST http://localhost:4000/api/bots/mi-bot/start \
  -H "Content-Type: application/json"
```

### 2. Obtener código QR

```bash
curl http://localhost:4000/api/bots/mi-bot/qr > qr.png
```

Escanea el QR con WhatsApp

### 3. Enviar un mensaje

```bash
curl -X POST http://localhost:4000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "session": "mi-bot",
    "chatId": "5491112345678@c.us",
    "text": "Hola desde el CRM!"
  }'
```

### 4. Ver estadísticas

```bash
curl http://localhost:4000/api/dashboard/stats
```

## 🐛 Troubleshooting

### Los mensajes no se guardan

1. Verifica que el webhook esté configurado correctamente
2. Revisa los logs del servidor: `docker logs waha`
3. Verifica la conexión a Supabase

### Error de conexión a Supabase

1. Verifica las credenciales en `.env`
2. Asegúrate de usar el `SERVICE_ROLE_KEY` no el `ANON_KEY`
3. Verifica que las tablas existan en Supabase

### WAHA no inicia

1. Verifica que el puerto 3000 esté disponible
2. Revisa los logs: `docker logs waha`
3. Asegúrate de que el archivo `.env` esté en el directorio correcto

## 🔄 Flujo de Trabajo

### Crear y Conectar un Bot

1. **Accede a WAHA Dashboard** → `http://localhost:3000`
2. **Crea un nuevo worker** (sesión de WhatsApp)
3. **Escanea el código QR** con tu WhatsApp
4. **El bot se sincroniza automáticamente** con la base de datos
5. **Accede al Dashboard CRM** → `http://localhost:3001`
6. **¡Empieza a gestionar tus conversaciones!**

### Recibir Mensajes

```
WhatsApp → WAHA → Webhook → Express → Supabase → Dashboard (Realtime)
```

Los mensajes se almacenan automáticamente y aparecen en tiempo real en el dashboard.

### Enviar Mensajes

```
Dashboard → Express API → WAHA API → WhatsApp
```

Envía mensajes desde el dashboard y se almacenan automáticamente en Supabase.

## 📊 Puertos y URLs

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| WAHA Plus | 3000 | http://localhost:3000 | Dashboard de WAHA, API, Swagger |
| Express API | 4000 | http://localhost:4000 | Backend del CRM, Webhooks |
| Dashboard | 3001 | http://localhost:3001 | Frontend Next.js |

## 🛠️ Comandos Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f waha
docker-compose logs -f express
docker-compose logs -f dashboard

# Reiniciar un servicio
docker-compose restart waha

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Actualizar servicios
docker-compose pull
docker-compose up -d
```

## 📚 Documentación Adicional

- 📖 [**ARQUITECTURA.md**](./ARQUITECTURA.md) - Arquitectura completa del sistema
- 🚀 [**DEPLOY_VPS.md**](./DEPLOY_VPS.md) - Guía de despliegue en VPS
- 🐳 [**DOCKER-GUIDE.md**](./DOCKER-GUIDE.md) - Guía de Docker
- ⚡ [**GUIA-RAPIDA.md**](./GUIA-RAPIDA.md) - Guía rápida de uso
- 🔧 [**TROUBLESHOOTING.md**](./TROUBLESHOOTING.md) - Solución de problemas
- 🌐 [WAHA Documentation](https://waha.devlike.pro/docs/)
- 💾 [Supabase Documentation](https://supabase.com/docs)

## 🎯 Características Avanzadas

- **Múltiples Workers**: Gestiona varios números de WhatsApp simultáneamente
- **Realtime Updates**: Actualizaciones en tiempo real con Supabase Realtime
- **Multimedia**: Soporte completo para imágenes, audios, videos y documentos
- **Búsqueda Avanzada**: Busca mensajes y contactos rápidamente
- **Etiquetas**: Organiza contactos con etiquetas personalizadas
- **Notas**: Agrega notas a tus contactos
- **Estadísticas**: Visualiza métricas y estadísticas de uso
- **Roles y Permisos**: Sistema de roles para múltiples usuarios

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## 📄 Licencia

ISC

---

**Desarrollado con ❤️ usando WAHA Plus, Express, Next.js y Supabase**
