# 🏗️ Arquitectura del Sistema CRM WhatsApp

## 📋 Descripción General

Este sistema CRM está diseñado con una arquitectura de microservicios usando Docker, donde cada componente tiene una responsabilidad específica y se comunica con los demás de manera eficiente.

## 🎯 Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                              │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ Escanea QR                 │ Accede al Dashboard
             │                            │
             ▼                            ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│   WAHA PLUS (Puerto    │    │   DASHBOARD (Puerto 3001)    │
│        3000)           │    │      Next.js Frontend        │
│                        │    │                              │
│  - Crea Workers/Bots   │    │  - Consume Base de Datos     │
│  - Gestiona WhatsApp   │    │  - Visualiza Mensajes        │
│  - Genera QR Codes     │    │  - Gestiona Contactos        │
│  - Envía Webhooks      │    │  - Estadísticas              │
└───────────┬────────────┘    └──────────────┬───────────────┘
            │                                │
            │ Webhooks                       │ Queries
            │                                │
            ▼                                ▼
┌────────────────────────────────────────────────────────────┐
│           EXPRESS API (Puerto 4000)                        │
│                Backend del CRM                             │
│                                                            │
│  - Recibe Webhooks de WAHA                                │
│  - Utiliza Endpoints de WAHA                              │
│  - Procesa y Almacena Datos                               │
│  - API REST para el Dashboard                             │
└───────────────────────┬────────────────────────────────────┘
                        │
                        │ Almacena/Consulta
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│                    SUPABASE                                │
│              Base de Datos PostgreSQL                      │
│                                                            │
│  - Almacena TODO: Mensajes, Contactos, Chats, Workers    │
│  - Storage para Archivos Multimedia                       │
│  - Realtime para Actualizaciones en Vivo                  │
└────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

### 1️⃣ Creación de Workers/Bots

```
Usuario → WAHA Dashboard → Crea Worker → Express sincroniza → Supabase
```

**WAHA Plus** permite crear múltiples workers (sesiones de WhatsApp). Cada worker puede ser:
- Un bot diferente
- Una cuenta de WhatsApp diferente
- Un número de teléfono diferente

### 2️⃣ Recepción de Mensajes

```
WhatsApp → WAHA → Webhook → Express API → Supabase → Dashboard (Realtime)
```

1. **WhatsApp** envía mensaje al número conectado
2. **WAHA** recibe el mensaje y lo procesa
3. **WAHA** envía webhook a Express con los datos del mensaje
4. **Express** procesa el webhook y almacena en Supabase:
   - Mensaje en tabla `messages`
   - Contacto en tabla `contacts` (si no existe)
   - Chat en tabla `chats` (si no existe)
   - Archivos multimedia en Supabase Storage
5. **Dashboard** recibe actualización en tiempo real vía Supabase Realtime

### 3️⃣ Envío de Mensajes

```
Dashboard → Express API → WAHA API → WhatsApp
                ↓
            Supabase (almacena)
```

1. Usuario envía mensaje desde el **Dashboard**
2. **Express** recibe la petición
3. **Express** usa la API de **WAHA** para enviar el mensaje
4. **Express** almacena el mensaje en **Supabase**
5. **WAHA** envía el mensaje por **WhatsApp**
6. **WAHA** envía webhook de confirmación (ACK)

### 4️⃣ Consulta de Datos

```
Dashboard → Supabase (consulta directa)
```

El **Dashboard** consulta directamente a **Supabase** usando el cliente de JavaScript:
- Mensajes de un chat
- Lista de contactos
- Estadísticas
- Archivos multimedia

## 🐳 Arquitectura Docker

### Red Interna (`crm_network`)

Todos los servicios están en la misma red Docker, lo que permite:
- Comunicación entre contenedores por nombre (ej: `http://waha:3000`)
- Aislamiento de la red externa
- Mejor seguridad

### Volúmenes Persistentes

```yaml
waha_data:       # Configuración de WAHA
waha_sessions:   # Sesiones de WhatsApp (QR, auth)
waha_media:      # Archivos multimedia temporales
```

### Puertos Expuestos

```
3000  → WAHA Plus (Dashboard + API)
4000  → Express API (Backend)
3001  → Dashboard Next.js (Frontend)
```

## 📊 Base de Datos (Supabase)

### Tablas Principales

```
users           → Usuarios del sistema
profiles        → Perfiles de usuario con roles
workers         → Workers/Bots de WAHA
contacts        → Contactos de WhatsApp
chats           → Conversaciones
messages        → Mensajes (texto, imágenes, audios, etc.)
media_files     → Metadatos de archivos multimedia
webhook_events  → Log de eventos recibidos
tags            → Etiquetas para organizar
contact_tags    → Relación contactos-etiquetas
contact_notes   → Notas sobre contactos
```

### Storage

```
whatsapp/       → Bucket para archivos multimedia
  ├── images/   → Imágenes
  ├── audios/   → Audios y notas de voz
  ├── videos/   → Videos
  └── documents/→ Documentos
```

## 🔐 Seguridad

### Autenticación

- **WAHA**: API Key + Dashboard con usuario/contraseña
- **Express**: Usa Service Role Key de Supabase
- **Dashboard**: Autenticación de usuarios con Supabase Auth
- **Supabase**: Row Level Security (RLS) en todas las tablas

### Variables de Entorno

Las credenciales sensibles se manejan mediante variables de entorno:
- `WAHA_API_KEY`: Protege la API de WAHA
- `SUPABASE_SERVICE_ROLE_KEY`: Acceso completo a Supabase (solo backend)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Acceso limitado (solo frontend)

## 🚀 Despliegue en VPS

### Requisitos Mínimos

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 20 GB SSD
- **OS**: Ubuntu 20.04+ o Debian 11+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Comando de Inicio

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd crmnovabots

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus credenciales

# 3. Iniciar todos los servicios
docker-compose up -d

# 4. Ver logs
docker-compose logs -f
```

### Verificación

```bash
# Verificar que todos los servicios estén corriendo
docker-compose ps

# Debería mostrar:
# waha          - Up (healthy)
# crm-express   - Up (healthy)
# crm-dashboard - Up (healthy)
```

## 🔧 Mantenimiento

### Actualizar Servicios

```bash
# Detener servicios
docker-compose down

# Actualizar imágenes
docker-compose pull

# Reconstruir si hay cambios en código
docker-compose build

# Iniciar nuevamente
docker-compose up -d
```

### Backup

```bash
# Backup de volúmenes de WAHA
docker run --rm -v waha_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/waha_backup.tar.gz /data

# Backup de Supabase
# Se hace desde el panel de Supabase o usando pg_dump
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f waha
docker-compose logs -f express
docker-compose logs -f dashboard
```

## 📈 Escalabilidad

### Horizontal

- **WAHA**: Puede manejar múltiples workers en una sola instancia
- **Express**: Puede escalarse con múltiples réplicas detrás de un load balancer
- **Dashboard**: Puede escalarse con múltiples réplicas
- **Supabase**: Escala automáticamente según el plan

### Vertical

- Aumentar recursos del VPS según la carga
- Optimizar consultas a la base de datos
- Implementar caché (Redis) si es necesario

## 🎯 Ventajas de esta Arquitectura

1. **Separación de Responsabilidades**: Cada servicio tiene una función clara
2. **Escalabilidad**: Cada componente puede escalar independientemente
3. **Mantenibilidad**: Fácil de actualizar y mantener
4. **Portabilidad**: Funciona en cualquier servidor con Docker
5. **Resiliencia**: Si un servicio falla, los demás siguen funcionando
6. **Desarrollo**: Fácil de desarrollar y probar localmente

## 📚 Recursos Adicionales

- [Documentación WAHA](https://waha.devlike.pro/docs/)
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Docker](https://docs.docker.com/)
- [Documentación Next.js](https://nextjs.org/docs)
