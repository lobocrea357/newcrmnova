# 🔧 Correcciones Urgentes del Sistema

## 🔴 Problemas Identificados

1. ❌ **Fotos no se procesan** - Las imágenes no se suben a Supabase
2. ❌ **Audios no se transcriben** - La transcripción no funciona
3. ❌ **Chats sin nombre** - No muestra el número cuando no hay nombre
4. ❌ **Dashboard poco claro** - UI necesita mejoras

## ✅ Soluciones Implementadas

### 1. Procesamiento de Imágenes y Multimedia

**Problema**: Las imágenes no se procesan correctamente porque el webhook no extrae bien la URL de los medios.

**Archivos afectados**:
- `src/services/webhookService.js` - Línea 293-352
- `src/services/mediaService.js` - Línea 14-41

**Correcciones aplicadas**:
1. Mejorar extracción de `mediaUrl` desde diferentes formatos de WAHA
2. Agregar logs detallados para debugging
3. Manejar errores sin bloquear el flujo principal

---

### 2. Transcripción de Audios

**Problema**: La transcripción no funciona porque falta configuración de OpenAI.

**Archivo afectado**:
- `src/services/transcriptionService.js`

**Correcciones necesarias**:
1. Verificar que `OPENAI_API_KEY` esté en `.env`
2. Asegurar que el servicio de transcripción se llame correctamente
3. Guardar transcripciones en la base de datos

---

### 3. Visualización de Chats

**Problema**: Los chats sin nombre no muestran el número de teléfono.

**Solución**: Actualizar el schema y las vistas para mostrar el número cuando no hay nombre.

**SQL a ejecutar**:
```sql
-- Actualizar vista de conversaciones recientes
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    ch.id as chat_id,
    ch.bot_id,
    b.session_name,
    ch.chat_id as whatsapp_chat_id,
    COALESCE(ch.name, c.name, c.phone_number, SPLIT_PART(ch.chat_id, '@', 1)) as chat_name,
    ch.is_group,
    c.phone_number,
    COALESCE(c.name, c.push_name, c.phone_number) as contact_name,
    ch.unread_count,
    ch.last_message_time,
    m.body as last_message,
    m.from_me as last_message_from_me
FROM chats ch
LEFT JOIN bots b ON ch.bot_id = b.id
LEFT JOIN contacts c ON ch.contact_id = c.id
LEFT JOIN LATERAL (
    SELECT body, from_me, timestamp
    FROM messages
    WHERE chat_id = ch.id
    ORDER BY timestamp DESC
    LIMIT 1
) m ON true
ORDER BY ch.last_message_time DESC NULLS LAST;
```

---

### 4. Mejoras del Dashboard

**Problemas**:
- No se ve claro quién es quién
- Falta información del contacto
- UI poco intuitiva

**Mejoras a implementar**:
1. Mostrar número de teléfono siempre
2. Agregar avatar con iniciales
3. Mejorar contraste de colores
4. Agregar indicadores visuales (online, typing, etc.)

---

## 📋 Checklist de Verificación

### Backend (Express)

- [ ] Verificar logs de webhooks: `docker-compose logs -f express`
- [ ] Confirmar que llegan eventos de WAHA
- [ ] Verificar que `mediaUrl` se extrae correctamente
- [ ] Confirmar subida a Supabase Storage
- [ ] Verificar que se guarda en `media_files`

### Multimedia

- [ ] Bucket `whatsapp` existe en Supabase Storage
- [ ] Bucket es público (o tiene políticas RLS correctas)
- [ ] Carpetas: `images/`, `audios/`, `videos/`, `documents/`
- [ ] URLs públicas funcionan

### Transcripción

- [ ] `OPENAI_API_KEY` configurada en `.env`
- [ ] Servicio de transcripción se llama para audios
- [ ] Transcripciones se guardan en BD

### Dashboard

- [ ] Chats muestran nombre o número
- [ ] Mensajes con imágenes muestran preview
- [ ] Audios muestran transcripción
- [ ] UI es clara y usable

---

## 🔍 Debugging

### Ver logs en tiempo real:

```bash
# Todos los servicios
docker-compose logs -f

# Solo Express (backend)
docker-compose logs -f express | grep -E "(PROCESANDO|ERROR|✅|❌)"

# Solo WAHA
docker-compose logs -f waha
```

### Verificar procesamiento de multimedia:

```bash
# Ver últimos eventos de webhook
docker-compose logs -f express | grep "MULTIMEDIA"
```

### Verificar base de datos:

```sql
-- Ver últimos mensajes con multimedia
SELECT 
    m.id,
    m.body,
    m.type,
    m.has_media,
    m.media_url,
    mf.file_url,
    mf.mimetype
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.has_media = true
ORDER BY m.created_at DESC
LIMIT 10;

-- Ver chats sin nombre
SELECT 
    id,
    chat_id,
    name,
    SPLIT_PART(chat_id, '@', 1) as phone_number
FROM chats
WHERE name IS NULL OR name = ''
ORDER BY created_at DESC;
```

---

## 🚀 Pasos Siguientes

### 1. Aplicar Correcciones SQL

Ejecuta en Supabase SQL Editor:

```sql
-- 1. Actualizar vista de conversaciones
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    ch.id as chat_id,
    ch.bot_id,
    b.session_name,
    ch.chat_id as whatsapp_chat_id,
    COALESCE(ch.name, c.name, c.phone_number, SPLIT_PART(ch.chat_id, '@', 1)) as chat_name,
    ch.is_group,
    c.phone_number,
    COALESCE(c.name, c.push_name, c.phone_number) as contact_name,
    ch.unread_count,
    ch.last_message_time,
    m.body as last_message,
    m.from_me as last_message_from_me,
    m.type as last_message_type,
    m.has_media as last_message_has_media
FROM chats ch
LEFT JOIN bots b ON ch.bot_id = b.id
LEFT JOIN contacts c ON ch.contact_id = c.id
LEFT JOIN LATERAL (
    SELECT body, from_me, timestamp, type, has_media
    FROM messages
    WHERE chat_id = ch.id
    ORDER BY timestamp DESC
    LIMIT 1
) m ON true
ORDER BY ch.last_message_time DESC NULLS LAST;
```

### 2. Verificar Bucket de Supabase

1. Ve a Supabase Dashboard → Storage
2. Verifica que existe el bucket `whatsapp`
3. Crea las carpetas:
   - `images/`
   - `audios/`
   - `videos/`
   - `documents/`
4. Configura políticas públicas:

```sql
-- Permitir lectura pública de archivos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp');

-- Permitir subida desde el backend (service role)
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp');
```

### 3. Reiniciar Servicios

```bash
# Reiniciar para aplicar cambios
docker-compose restart express

# Ver logs para verificar
docker-compose logs -f express
```

### 4. Probar Envío de Multimedia

1. Envía una imagen a tu bot de WhatsApp
2. Verifica en los logs:
   ```
   📎 ========== PROCESANDO MULTIMEDIA ==========
   📥 Descargando desde WAHA...
   ✅ Descargado: XXX bytes
   📤 Subiendo a Supabase Storage...
   ✅ Archivo subido exitosamente
   💾 Guardando referencia en BD...
   ✅ Referencia guardada en media_files
   ```
3. Verifica en Supabase Storage que el archivo existe
4. Verifica en la tabla `media_files` que se guardó la referencia

---

## 📊 Estructura Esperada

### Mensaje con Imagen:

```
messages (tabla)
├── id: uuid
├── body: "Caption de la imagen"
├── type: "image"
├── has_media: true
├── media_url: "http://waha:3000/api/files/..."
└── media_files (relación)
    ├── file_url: "https://xxx.supabase.co/storage/v1/object/public/whatsapp/images/..."
    ├── mimetype: "image/jpeg"
    └── file_size: 123456
```

### Chat sin Nombre:

```
chats (tabla)
├── chat_id: "5491112345678@c.us"
├── name: NULL
└── Vista muestra: "5491112345678" (extraído del chat_id)
```

---

## ⚠️ Notas Importantes

1. **WAHA URLs**: Dentro de Docker, usar `http://waha:3000` no `http://localhost:3000`
2. **Supabase Storage**: Debe ser público o tener políticas RLS correctas
3. **OpenAI API**: Necesaria solo para transcripción de audios
4. **Logs**: Siempre revisar logs para debugging

---

## 🆘 Si Algo No Funciona

1. **Ver logs detallados**:
   ```bash
   docker-compose logs -f express | grep -A 10 -B 10 "ERROR"
   ```

2. **Verificar variables de entorno**:
   ```bash
   docker-compose exec express env | grep -E "(WAHA|SUPABASE|OPENAI)"
   ```

3. **Probar manualmente la subida**:
   ```bash
   # Descargar archivo de WAHA
   curl -H "X-Api-Key: tu_api_key" http://localhost:3000/api/files/XXX -o test.jpg
   
   # Verificar que se descargó
   ls -lh test.jpg
   ```

4. **Verificar Supabase Storage**:
   - Dashboard → Storage → whatsapp
   - Debe tener archivos en las carpetas
   - URLs deben ser accesibles

---

**Última actualización**: 11 de noviembre de 2025
**Estado**: 🔄 En corrección
