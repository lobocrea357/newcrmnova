# CRM WhatsApp Bot con WAHA y Supabase

Sistema CRM completo para gestionar bots de WhatsApp usando WAHA (WhatsApp HTTP API) y Supabase como base de datos.

## 🚀 Características

- ✅ Gestión de múltiples bots/sesiones de WhatsApp
- ✅ Almacenamiento de mensajes, contactos y chats en Supabase
- ✅ Webhooks para recibir eventos en tiempo real
- ✅ API REST completa para integración
- ✅ Dashboard con estadísticas y métricas
- ✅ Búsqueda de mensajes y contactos
- ✅ Envío de mensajes de texto e imágenes
- ✅ Engine NOWEB para mejor rendimiento

## 📋 Requisitos

- Node.js 18+
- Docker (para WAHA)
- Cuenta de Supabase

## 🔧 Instalación

### Opción A: Docker Compose (Recomendado) 🐳

La forma más rápida de levantar todo el sistema:

```powershell
# 1. Configurar base de datos en Supabase (ejecutar supabase-schema.sql)
# 2. Levantar todos los servicios
docker-compose up -d
```

✅ **¡Listo!** WAHA y Express estarán corriendo automáticamente.

📖 **Ver guía completa:** [DOCKER-GUIDE.md](./DOCKER-GUIDE.md)

---

### Opción B: Instalación Manual

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

## 📚 Documentación Adicional

- [WAHA Documentation](https://waha.devlike.pro/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## 📄 Licencia

ISC
