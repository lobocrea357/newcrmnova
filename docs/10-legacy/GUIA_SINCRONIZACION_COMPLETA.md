# 🚀 Guía de Sincronización Completa - CRM WhatsApp

## 📋 Descripción

Sistema completo de sincronización entre **WAHA → Express → Supabase → Dashboard** que garantiza que TODOS los datos estén disponibles y actualizados.

---

## ✨ Características Implementadas

### 1. **Extracción Automática de Datos de Contacto** ✅
- Verifica automáticamente si un contacto tiene datos completos (nombre, foto de perfil)
- Si faltan datos, consulta la API de WAHA para obtenerlos
- Actualiza la base de datos con la información completa

### 2. **Sincronización de Mensajes (Entrantes y Salientes)** ✅
- Captura mensajes entrantes via webhooks en tiempo real
- Sincroniza mensajes históricos (entrantes y salientes) desde WAHA
- Evita duplicados verificando `message_id`

### 3. **Soporte Completo de Multimedia** ✅
- **Imágenes**: Se descargan y suben a Supabase Storage
- **Videos**: Se procesan y almacenan
- **Audios**: Se transcriben automáticamente con Whisper (OpenAI)
- **Documentos**: Se guardan con metadata completa

### 4. **Visualización en Dashboard** ✅
- Muestra todos los chats con información completa
- Incluye fotos de perfil de contactos
- Muestra archivos multimedia en conversaciones
- Transcripciones de audios visibles

---

## 🔧 Endpoints Disponibles

### **Sincronización Completa de Mensajes**

#### 1. Sincronizar TODOS los mensajes de una sesión
```bash
POST /api/full-sync/:session/messages
```

**Body (opcional):**
```json
{
  "limit": 100,           // Mensajes por chat (default: 100)
  "includeMedia": true,   // Descargar multimedia (default: true)
  "transcribeAudio": true // Transcribir audios (default: true)
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/full-sync/nova_colombia_moises/messages \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 200,
    "includeMedia": true,
    "transcribeAudio": true
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización completa exitosa",
  "data": {
    "chats": 45,
    "messages": 1250,
    "media": 320,
    "errors": 0
  }
}
```

---

#### 2. Sincronizar un chat específico
```bash
POST /api/full-sync/:session/chat/:chatId
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/full-sync/nova_colombia_moises/chat/573001234567@c.us \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

---

### **Sincronización de Contactos y Chats**

#### 3. Sincronizar contactos (actualizar nombres y fotos)
```bash
POST /api/sync/:session/contacts
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/sync/nova_colombia_moises/contacts
```

---

#### 4. Sincronizar chats (actualizar metadata)
```bash
POST /api/sync/:session/chats
```

---

#### 5. Sincronización completa (bot + contactos + chats)
```bash
POST /api/sync/:session/all
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/sync/nova_colombia_moises/all
```

---

### **Obtener Mensajes con Multimedia**

#### 6. Obtener mensajes de un chat con archivos multimedia
```bash
GET /api/messages/chat/:chatId?includeMedia=true
```

**Ejemplo:**
```bash
curl http://localhost:4000/api/messages/chat/abc123-def456?includeMedia=true&limit=50
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "content": "Mira esta foto",
      "from_me": false,
      "has_media": true,
      "timestamp": "2025-01-18T10:30:00Z",
      "media_files": [
        {
          "id": "media-uuid",
          "file_url": "https://supabase.co/storage/v1/object/public/whatsapp/image.jpg",
          "mimetype": "image/jpeg",
          "file_size": 245678
        }
      ]
    }
  ]
}
```

---

## 🎯 Flujo de Trabajo Recomendado

### **Configuración Inicial**

1. **Conectar bot en WAHA**
   - Ir a `http://localhost:3000`
   - Crear sesión (ej: `nova_colombia_moises`)
   - Escanear código QR
   - Esperar estado `WORKING`

2. **Sincronización inicial completa**
   ```bash
   # Sincronizar contactos y chats
   curl -X POST http://localhost:4000/api/sync/nova_colombia_moises/all
   
   # Sincronizar TODOS los mensajes históricos
   curl -X POST http://localhost:4000/api/full-sync/nova_colombia_moises/messages \
     -H "Content-Type: application/json" \
     -d '{"limit": 200, "includeMedia": true, "transcribeAudio": true}'
   ```

3. **Verificar en Dashboard**
   - Ir a `http://localhost:3001/dashboard`
   - Seleccionar el bot
   - Ver conversaciones con datos completos

---

### **Operación Continua**

#### **Automático (Webhooks)** ✅
- Los mensajes nuevos se capturan automáticamente
- Los contactos se actualizan si faltan datos
- Los medios se procesan en tiempo real

#### **Manual (Sincronización periódica)**
```bash
# Actualizar contactos sin nombre/foto cada semana
curl -X POST http://localhost:4000/api/sync/nova_colombia_moises/contacts

# Sincronizar mensajes recientes cada día
curl -X POST http://localhost:4000/api/full-sync/nova_colombia_moises/messages \
  -d '{"limit": 50}'
```

---

## 📊 Estructura de Datos en Supabase

### **Tabla: contacts**
```sql
- id (uuid)
- bot_id (uuid)
- phone_number (text) ✅
- name (text) ✅ Extraído de WAHA
- push_name (text) ✅
- profile_picture_url (text) ✅ URL de Supabase Storage
- is_business (boolean)
- is_enterprise (boolean)
- created_at, updated_at
```

### **Tabla: chats**
```sql
- id (uuid)
- bot_id (uuid)
- contact_id (uuid)
- chat_id (text) ✅ ID completo con @c.us
- contact_number (text)
- contact_name (text)
- last_message (text)
- last_message_at (timestamp)
- is_group (boolean)
- unread_count (integer)
```

### **Tabla: messages**
```sql
- id (uuid)
- bot_id (uuid)
- chat_id (uuid)
- contact_id (uuid)
- message_id (text) ✅ ID único de WAHA
- from_number (text)
- to_number (text)
- content (text)
- body (text)
- from_me (boolean) ✅ true = saliente, false = entrante
- has_media (boolean)
- type (text) ✅ text, image, video, audio, document
- timestamp (timestamp)
- ack (integer) ✅ Estado de entrega
```

### **Tabla: media_files**
```sql
- id (uuid)
- bot_id (uuid)
- message_id (uuid)
- file_url (text) ✅ URL pública de Supabase Storage
- file_name (text)
- mimetype (text)
- file_size (bigint)
- thumbnail_url (text)
- metadata (jsonb) ✅ Incluye transcripción de audios
```

---

## 🔍 Verificación de Datos

### **Verificar contactos sin datos**
```sql
SELECT 
  phone_number,
  name,
  profile_picture_url
FROM contacts
WHERE bot_id = 'tu-bot-id'
  AND (name IS NULL OR profile_picture_url IS NULL);
```

### **Verificar mensajes con multimedia**
```sql
SELECT 
  m.id,
  m.content,
  m.has_media,
  m.type,
  COUNT(mf.id) as media_count
FROM messages m
LEFT JOIN media_files mf ON mf.message_id = m.id
WHERE m.bot_id = 'tu-bot-id'
  AND m.has_media = true
GROUP BY m.id;
```

### **Verificar transcripciones de audio**
```sql
SELECT 
  m.id,
  m.timestamp,
  mf.mimetype,
  mf.metadata->>'transcription' as transcription
FROM messages m
JOIN media_files mf ON mf.message_id = m.id
WHERE m.type IN ('audio', 'ptt', 'voice')
  AND mf.metadata->>'transcription' IS NOT NULL;
```

---

## 🚨 Solución de Problemas

### **Problema: Contactos sin nombre**
**Solución:**
```bash
curl -X POST http://localhost:4000/api/sync/SESSION_NAME/contacts
```

### **Problema: Mensajes salientes no aparecen**
**Solución:**
```bash
# Sincronizar todos los mensajes
curl -X POST http://localhost:4000/api/full-sync/SESSION_NAME/messages
```

### **Problema: Multimedia no se muestra**
**Verificar:**
1. Variable `WAHA_API_KEY` configurada en `.env`
2. Bucket `whatsapp` existe en Supabase Storage
3. Políticas RLS permiten lectura pública

**Resincronizar:**
```bash
curl -X POST http://localhost:4000/api/full-sync/SESSION_NAME/messages \
  -d '{"includeMedia": true}'
```

### **Problema: Audios sin transcripción**
**Verificar:**
1. Variable `OPENAI_API_KEY` configurada en `.env`
2. Créditos disponibles en OpenAI

**Forzar transcripción:**
```bash
curl -X POST http://localhost:4000/api/full-sync/SESSION_NAME/messages \
  -d '{"transcribeAudio": true, "limit": 10}'
```

---

## 📈 Mejores Prácticas

1. **Sincronización inicial**: Ejecutar `full-sync` al conectar un bot nuevo
2. **Mantenimiento semanal**: Ejecutar `sync/contacts` para actualizar datos
3. **Monitoreo**: Revisar logs de Express para detectar errores
4. **Backup**: Exportar datos de Supabase regularmente
5. **Limpieza**: Eliminar archivos multimedia antiguos (>6 meses)

---

## 🎉 Resultado Final

Con esta implementación, el sistema garantiza:

✅ **Contactos completos**: Nombres y fotos de perfil actualizados  
✅ **Mensajes bidireccionales**: Entrantes y salientes sincronizados  
✅ **Multimedia funcional**: Imágenes, videos, audios con transcripción  
✅ **Dashboard actualizado**: Visualización completa de conversaciones  
✅ **RLS configurado**: Seguridad y permisos correctos  

---

## 📞 Soporte

Para problemas o dudas:
1. Revisar logs de Express: `docker logs crmnovabots-express-1`
2. Revisar logs de WAHA: `docker logs crmnovabots-waha-1`
3. Verificar estado de servicios: `docker ps`
