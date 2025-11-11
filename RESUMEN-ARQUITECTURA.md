# 📋 Resumen de Arquitectura - CRM WhatsApp

## 🎯 Concepto Principal

```
WAHA Plus → Crea Workers/Bots
     ↓
Express → Usa API de WAHA y almacena en Supabase
     ↓
Supabase → Almacena TODO
     ↑
Dashboard → Consume y visualiza la base de datos
```

## 🔄 Flujo de Datos

### Recepción de Mensajes
```
WhatsApp → WAHA → Webhook → Express → Supabase → Dashboard (Realtime)
```

### Envío de Mensajes
```
Dashboard → Express → WAHA API → WhatsApp
```

## 🐳 Servicios Docker

| Servicio | Puerto | Función |
|----------|--------|---------|
| **WAHA Plus** | 3000 | Gestiona WhatsApp, crea workers/bots |
| **Express API** | 4000 | Backend, webhooks, almacena en Supabase |
| **Dashboard** | 3001 | Frontend Next.js, visualiza datos |

## 📊 Base de Datos (Supabase)

### Tablas Principales
- `workers` - Workers/Bots de WAHA
- `contacts` - Contactos de WhatsApp
- `chats` - Conversaciones
- `messages` - Mensajes (texto, imágenes, audios, etc.)
- `media_files` - Archivos multimedia
- `users` - Usuarios del sistema
- `profiles` - Perfiles con roles

### Storage
- `whatsapp/` - Bucket para archivos multimedia

## 🔑 Variables de Entorno Críticas

```env
# WAHA
WAHA_API_KEY=tu_clave_secreta

# Supabase (Backend)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## 🚀 Comandos Esenciales

```bash
# Iniciar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver estado
docker-compose ps

# Detener todo
docker-compose down
```

## ✅ Verificación Rápida

1. ✅ WAHA corriendo → `http://localhost:3000`
2. ✅ Express corriendo → `http://localhost:4000/health`
3. ✅ Dashboard corriendo → `http://localhost:3001`
4. ✅ Supabase configurado → Tablas creadas
5. ✅ Worker conectado → QR escaneado

## 🎯 Ventajas de esta Arquitectura

1. **WAHA Plus** - Permite múltiples workers/bots
2. **Express** - Centraliza toda la lógica de negocio
3. **Supabase** - Base de datos escalable y realtime
4. **Dashboard** - Interfaz moderna y responsive
5. **Docker** - Despliegue simple con un comando

## 📝 Responsabilidades

### WAHA Plus
- ✅ Crear y gestionar workers (sesiones de WhatsApp)
- ✅ Conectar con WhatsApp
- ✅ Recibir y enviar mensajes
- ✅ Generar códigos QR
- ✅ Enviar webhooks a Express

### Express API
- ✅ Recibir webhooks de WAHA
- ✅ Procesar eventos de WhatsApp
- ✅ Almacenar datos en Supabase
- ✅ Proporcionar API REST
- ✅ Gestionar archivos multimedia
- ✅ Sincronizar workers con la BD

### Supabase
- ✅ Almacenar todos los datos
- ✅ Gestionar usuarios y autenticación
- ✅ Almacenar archivos multimedia
- ✅ Proporcionar actualizaciones en tiempo real
- ✅ Row Level Security (RLS)

### Dashboard Next.js
- ✅ Visualizar mensajes y conversaciones
- ✅ Gestionar contactos
- ✅ Enviar mensajes
- ✅ Mostrar estadísticas
- ✅ Interfaz de usuario moderna

## 🔐 Seguridad

- WAHA protegido con API Key
- Express usa Service Role Key de Supabase
- Dashboard usa Anon Key (limitada)
- RLS habilitado en todas las tablas
- Autenticación de usuarios con Supabase Auth

## 📈 Escalabilidad

- **WAHA**: Múltiples workers en una instancia
- **Express**: Múltiples réplicas con load balancer
- **Dashboard**: Múltiples réplicas
- **Supabase**: Escala automáticamente

## 🎓 Conceptos Clave

1. **Worker** = Sesión de WhatsApp = Bot = Número conectado
2. **Webhook** = Notificación de WAHA a Express cuando hay eventos
3. **Service Role Key** = Acceso completo a Supabase (solo backend)
4. **Anon Key** = Acceso limitado a Supabase (frontend)
5. **Realtime** = Actualizaciones automáticas en el dashboard

---

**Todo corre desde un comando de Docker y funciona excelente en un VPS** 🚀
