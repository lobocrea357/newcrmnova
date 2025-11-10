# 📋 Resumen del Proyecto CRM WhatsApp Bot

## 🎯 ¿Qué es esto?

Un sistema CRM completo para gestionar múltiples bots de WhatsApp con:
- ✅ **WAHA** (WhatsApp HTTP API) con engine NOWEB
- ✅ **Express.js** como servidor API
- ✅ **Supabase** como base de datos PostgreSQL
- ✅ **Docker Compose** para levantar todo con un comando

## 📁 Archivos Creados

### Configuración Principal
- ✅ `.env` - Variables de entorno (ya configurado)
- ✅ `.env.example` - Plantilla de variables de entorno
- ✅ `package.json` - Dependencias de Node.js
- ✅ `.gitignore` - Archivos a ignorar en Git
- ✅ `.dockerignore` - Archivos a ignorar en Docker

### Docker
- ✅ `Dockerfile` - Imagen de Docker para Express
- ✅ `docker-compose.yml` - Orquestación de servicios
- ✅ `start.ps1` - Script para iniciar todo (Windows)
- ✅ `stop.ps1` - Script para detener todo (Windows)

### Base de Datos
- ✅ `supabase-schema.sql` - Schema completo de la base de datos con:
  - Tablas: bots, contacts, chats, messages, media_files, webhook_events, tags, etc.
  - Vistas: bot_statistics, recent_conversations, messages_detailed
  - Índices optimizados
  - Triggers automáticos
  - Row Level Security (RLS)

### Código Fuente (src/)

#### Configuración
- ✅ `src/config/supabase.js` - Cliente de Supabase
- ✅ `src/config/waha.js` - Cliente de WAHA

#### Servicios (Lógica de Negocio)
- ✅ `src/services/botService.js` - Gestión de bots/sesiones
- ✅ `src/services/contactService.js` - Gestión de contactos
- ✅ `src/services/chatService.js` - Gestión de chats/conversaciones
- ✅ `src/services/messageService.js` - Gestión de mensajes
- ✅ `src/services/webhookService.js` - Procesamiento de webhooks

#### Rutas (API Endpoints)
- ✅ `src/routes/webhooks.js` - Recepción de webhooks de WAHA
- ✅ `src/routes/bots.js` - CRUD de bots
- ✅ `src/routes/messages.js` - CRUD de mensajes
- ✅ `src/routes/contacts.js` - CRUD de contactos
- ✅ `src/routes/chats.js` - CRUD de chats
- ✅ `src/routes/dashboard.js` - Estadísticas y métricas

#### Principal
- ✅ `src/index.js` - Servidor Express principal

### Documentación
- ✅ `README.md` - Documentación completa del proyecto
- ✅ `GUIA-RAPIDA.md` - Guía de inicio rápido
- ✅ `DOCKER-GUIDE.md` - Guía completa de Docker
- ✅ `RESUMEN.md` - Este archivo

## 🚀 Inicio Rápido

### 1. Configurar Supabase

```sql
-- Ejecutar en Supabase SQL Editor
-- Copiar y pegar el contenido de supabase-schema.sql
```

### 2. Levantar Todo

```powershell
# Opción 1: Script automático
.\start.ps1

# Opción 2: Docker Compose directo
docker-compose up -d
```

### 3. Acceder a los Servicios

- **WAHA Dashboard:** http://localhost:3000/dashboard
  - Usuario: `admin`
  - Contraseña: (ver en `.env`)

- **Express API:** http://localhost:4000
  - Health: http://localhost:4000/health
  - Stats: http://localhost:4000/api/dashboard/stats

## 📊 API Endpoints Principales

### Bots
```
GET    /api/bots                    - Listar bots
POST   /api/bots/sync               - Sincronizar con WAHA
POST   /api/bots/:session/start     - Iniciar sesión
POST   /api/bots/:session/stop      - Detener sesión
GET    /api/bots/:session/qr        - Obtener QR
DELETE /api/bots/:session           - Eliminar sesión
```

### Mensajes
```
GET    /api/messages/bot/:botId              - Mensajes de un bot
GET    /api/messages/chat/:chatId            - Mensajes de un chat
GET    /api/messages/search?botId=X&query=Y  - Buscar mensajes
GET    /api/messages/stats/:botId            - Estadísticas
POST   /api/messages/send                    - Enviar mensaje
```

### Contactos
```
GET    /api/contacts/bot/:botId              - Contactos de un bot
GET    /api/contacts/search?botId=X&query=Y  - Buscar contactos
```

### Chats
```
GET    /api/chats/bot/:botId           - Chats de un bot
GET    /api/chats/recent?botId=X       - Conversaciones recientes
```

### Dashboard
```
GET    /api/dashboard/stats                  - Estadísticas generales
GET    /api/dashboard/activity               - Actividad reciente
GET    /api/dashboard/messages-by-hour       - Mensajes por hora
GET    /api/dashboard/top-contacts           - Contactos más activos
```

### Webhooks
```
POST   /webhooks/waha                        - Recibir eventos de WAHA
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales

1. **bots** - Sesiones de WhatsApp
   - id, session_name, phone_number, status, engine, qr_code, metadata

2. **contacts** - Contactos de WhatsApp
   - id, bot_id, phone_number, name, push_name, profile_picture_url

3. **chats** - Conversaciones
   - id, bot_id, chat_id, contact_id, name, is_group, unread_count

4. **messages** - Mensajes
   - id, bot_id, chat_id, contact_id, message_id, body, type, timestamp, ack

5. **media_files** - Archivos multimedia
   - id, bot_id, message_id, file_url, mimetype, file_size

6. **webhook_events** - Eventos recibidos
   - id, bot_id, event_type, event_data, processed

7. **tags** - Etiquetas para organizar
   - id, bot_id, name, color

8. **contact_tags** - Relación contactos-etiquetas
   - contact_id, tag_id

9. **contact_notes** - Notas de contactos
   - id, contact_id, note, created_by

### Vistas Útiles

- **bot_statistics** - Estadísticas por bot
- **recent_conversations** - Conversaciones recientes con último mensaje
- **messages_detailed** - Mensajes con todos los detalles relacionados

## 🔄 Flujo de Datos

```
WhatsApp → WAHA → Webhook → Express → Supabase
                              ↓
                         Dashboard API
```

1. Usuario envía/recibe mensaje en WhatsApp
2. WAHA detecta el evento
3. WAHA envía webhook a Express (http://express:4000/webhooks/waha)
4. Express procesa el evento y guarda en Supabase
5. Dashboard puede consultar los datos vía API

## 🐳 Arquitectura Docker

```
┌─────────────────────────────────────┐
│  Docker Network (crm_network)       │
│                                     │
│  ┌──────────┐      ┌─────────────┐ │
│  │  WAHA    │─────▶│  Express    │ │
│  │  :3000   │webhook│  :4000      │ │
│  └────┬─────┘      └──────┬──────┘ │
│       │                   │         │
│  ┌────▼────┐         ┌───▼────┐   │
│  │Volumes  │         │Supabase│   │
│  │.waha    │         │(cloud) │   │
│  │sessions │         └────────┘   │
│  │.media   │                      │
│  └─────────┘                      │
└─────────────────────────────────────┘
```

## 📦 Dependencias

### Node.js
- express - Framework web
- @supabase/supabase-js - Cliente de Supabase
- axios - Cliente HTTP para WAHA
- cors - CORS middleware
- dotenv - Variables de entorno
- morgan - Logger HTTP
- body-parser - Parser de body

### Docker
- devlikeapro/waha:latest - WAHA
- node:18-alpine - Base para Express

## 🔐 Seguridad

- ✅ API Key para WAHA
- ✅ Service Role Key para Supabase
- ✅ Row Level Security (RLS) en tablas
- ✅ Validación de datos en endpoints
- ✅ CORS configurado
- ✅ Variables de entorno para secretos

## 📈 Características Implementadas

- ✅ Gestión de múltiples bots
- ✅ Almacenamiento de mensajes
- ✅ Gestión de contactos
- ✅ Gestión de chats/conversaciones
- ✅ Webhooks en tiempo real
- ✅ Búsqueda de mensajes y contactos
- ✅ Estadísticas y métricas
- ✅ Envío de mensajes (texto e imágenes)
- ✅ Tracking de ACK de mensajes
- ✅ Soporte para reacciones
- ✅ Organización con etiquetas
- ✅ Notas en contactos

## 🎯 Próximas Mejoras Sugeridas

1. **Frontend Dashboard**
   - React/Next.js con gráficos
   - Interfaz de chat en tiempo real
   - Gestión visual de contactos

2. **Autenticación**
   - JWT para proteger endpoints
   - Roles y permisos
   - Multi-usuario

3. **Chatbot**
   - Respuestas automáticas
   - Flujos de conversación
   - Integración con IA (OpenAI, etc.)

4. **Notificaciones**
   - WebSockets para tiempo real
   - Push notifications
   - Email alerts

5. **Analytics Avanzado**
   - Gráficos de tendencias
   - Reportes exportables
   - Métricas de rendimiento

6. **Integraciones**
   - CRM externos (HubSpot, Salesforce)
   - Email marketing
   - Zapier/Make

## 📝 Comandos Útiles

### Docker
```powershell
# Iniciar
docker-compose up -d

# Detener
docker-compose stop

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Estado
docker-compose ps

# Eliminar todo
docker-compose down -v
```

### Desarrollo
```powershell
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### Supabase
```sql
-- Ver bots
SELECT * FROM bots;

-- Ver mensajes recientes
SELECT * FROM messages_detailed LIMIT 50;

-- Ver estadísticas
SELECT * FROM bot_statistics;

-- Ver conversaciones recientes
SELECT * FROM recent_conversations LIMIT 20;
```

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica el estado: `docker-compose ps`
3. Consulta las guías:
   - [README.md](./README.md)
   - [DOCKER-GUIDE.md](./DOCKER-GUIDE.md)
   - [GUIA-RAPIDA.md](./GUIA-RAPIDA.md)

## 📄 Licencia

ISC

---

**¡Listo para usar!** 🎉

Todo el sistema está configurado y listo para levantar con un solo comando.
