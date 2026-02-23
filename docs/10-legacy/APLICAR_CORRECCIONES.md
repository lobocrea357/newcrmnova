# 🔧 Guía para Aplicar Correcciones

## 📋 Resumen de Problemas Corregidos

1. ✅ **Procesamiento de imágenes** - Mejorada extracción de mediaUrl
2. ✅ **Transcripción de audios** - Corregido parámetro faltante
3. ✅ **Visualización de chats** - SQL para mostrar números
4. ✅ **Mejoras de UI** - Vistas actualizadas

## 🚀 Pasos para Aplicar las Correcciones

### Paso 1: Aplicar Correcciones SQL en Supabase

1. **Abre Supabase Dashboard**
2. **Ve a SQL Editor**
3. **Ejecuta el archivo**: `FIX_CHATS_Y_VISTAS.sql`

Este script:
- ✅ Actualiza la vista `recent_conversations` para mostrar números
- ✅ Crea vista `messages_detailed` con información completa
- ✅ Crea vista `bot_statistics` con estadísticas mejoradas
- ✅ Crea vista `contacts_detailed` con nombres o números
- ✅ Agrega índices para mejor performance

### Paso 2: Verificar Bucket de Supabase Storage

1. **Ve a Supabase Dashboard → Storage**
2. **Verifica que existe el bucket `whatsapp`**
3. **Si no existe, créalo**:
   ```sql
   -- Crear bucket
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('whatsapp', 'whatsapp', true);
   ```

4. **Configura políticas públicas**:
   ```sql
   -- Permitir lectura pública
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'whatsapp');

   -- Permitir subida desde service role
   CREATE POLICY "Service Role Upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'whatsapp');
   ```

### Paso 3: Reiniciar Servicios Docker

```bash
# Reiniciar Express para aplicar cambios en el código
docker-compose restart express

# Ver logs para verificar
docker-compose logs -f express
```

### Paso 4: Probar el Sistema

#### Probar Imágenes:

1. Envía una imagen a tu bot de WhatsApp
2. Verifica en los logs:
   ```bash
   docker-compose logs -f express | grep "MULTIMEDIA"
   ```
3. Deberías ver:
   ```
   📎 ========== PROCESANDO MULTIMEDIA ==========
   Tipo: image
   Media URL: http://waha:3000/api/files/...
   📥 Descargando multimedia desde WAHA...
   ✅ Descargado: XXX bytes
   📤 Subiendo a Supabase Storage...
   ✅ Archivo subido exitosamente
   💾 Guardando referencia en BD...
   ✅ Referencia guardada en media_files
   ```

#### Probar Audios:

1. Envía un audio a tu bot
2. Verifica en los logs:
   ```bash
   docker-compose logs -f express | grep -E "(Audio|Transcri)"
   ```
3. Deberías ver:
   ```
   🎤 Audio detectado, iniciando transcripción...
   🎤 Procesando audio para mensaje: xxx
   ✅ Audio transcrito: "texto del audio..."
   💾 Transcripción guardada en BD
   ```

#### Probar Visualización de Chats:

1. Ve al Dashboard: http://localhost:3001
2. Los chats sin nombre deberían mostrar el número de teléfono
3. Verifica en Supabase:
   ```sql
   SELECT 
       chat_name,
       contact_phone,
       last_message
   FROM recent_conversations
   LIMIT 10;
   ```

---

## 🔍 Verificación Detallada

### 1. Verificar Multimedia en Base de Datos

```sql
-- Ver últimos mensajes con multimedia
SELECT 
    m.id,
    m.body,
    m.type,
    m.has_media,
    m.created_at,
    mf.file_url,
    mf.mimetype,
    mf.file_size
FROM messages m
LEFT JOIN media_files mf ON m.id = mf.message_id
WHERE m.has_media = true
ORDER BY m.created_at DESC
LIMIT 10;
```

### 2. Verificar Transcripciones

```sql
-- Ver mensajes con transcripción
SELECT 
    id,
    from_number,
    type,
    metadata->>'transcription' as transcription,
    metadata->>'transcribed_at' as transcribed_at,
    created_at
FROM messages
WHERE metadata->>'transcription' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Verificar Chats sin Nombre

```sql
-- Ver chats que ahora muestran número
SELECT 
    chat_name,
    contact_phone,
    is_group,
    last_message_time
FROM recent_conversations
WHERE contact_phone IS NOT NULL
ORDER BY last_message_time DESC
LIMIT 10;
```

### 4. Verificar Storage de Supabase

```sql
-- Ver archivos subidos
SELECT 
    name,
    bucket_id,
    created_at,
    metadata->>'size' as size,
    metadata->>'mimetype' as mimetype
FROM storage.objects
WHERE bucket_id = 'whatsapp'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Problema: Imágenes no se procesan

**Síntomas**:
- No aparece "PROCESANDO MULTIMEDIA" en logs
- No se guardan en `media_files`

**Solución**:
1. Verificar que `hasMedia` sea `true` en el webhook
2. Verificar que `mediaUrl` esté presente
3. Ver logs completos:
   ```bash
   docker-compose logs -f express | grep -A 20 "PROCESANDO MENSAJE"
   ```

### Problema: Audios no se transcriben

**Síntomas**:
- No aparece "Audio detectado" en logs
- No se guarda transcripción

**Solución**:
1. Verificar `OPENAI_API_KEY` en `.env`:
   ```bash
   docker-compose exec express env | grep OPENAI
   ```
2. Si no está configurada:
   ```bash
   # Editar .env
   OPENAI_API_KEY=sk-proj-...
   
   # Reiniciar
   docker-compose restart express
   ```

### Problema: Chats siguen sin mostrar número

**Síntomas**:
- Chats aparecen vacíos o con "null"

**Solución**:
1. Verificar que ejecutaste `FIX_CHATS_Y_VISTAS.sql`
2. Verificar la vista:
   ```sql
   SELECT * FROM recent_conversations LIMIT 5;
   ```
3. Si no funciona, recrear la vista manualmente

### Problema: Error al subir a Supabase Storage

**Síntomas**:
- Error: "Bucket not found"
- Error: "Permission denied"

**Solución**:
1. Verificar que el bucket existe:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'whatsapp';
   ```
2. Verificar políticas:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'whatsapp';
   ```
3. Recrear bucket y políticas si es necesario

---

## 📊 Checklist Final

Después de aplicar todas las correcciones, verifica:

### Backend
- [ ] Logs muestran "PROCESANDO MULTIMEDIA" para imágenes
- [ ] Logs muestran "Audio detectado" para audios
- [ ] No hay errores en los logs
- [ ] Servicios están "healthy": `docker-compose ps`

### Base de Datos
- [ ] Vista `recent_conversations` muestra números
- [ ] Tabla `media_files` tiene registros
- [ ] Tabla `messages` tiene transcripciones en metadata
- [ ] Bucket `whatsapp` tiene archivos

### Dashboard
- [ ] Chats muestran nombre o número
- [ ] Imágenes se visualizan correctamente
- [ ] Audios muestran transcripción
- [ ] UI es clara y usable

### Storage
- [ ] Bucket `whatsapp` existe
- [ ] Carpetas `images/`, `audios/`, `videos/`, `documents/` tienen archivos
- [ ] URLs públicas son accesibles
- [ ] Políticas RLS permiten lectura pública

---

## 🎯 Resultado Esperado

Después de aplicar todas las correcciones:

1. **Imágenes**: Se procesan, suben a Supabase Storage y se muestran en el dashboard
2. **Audios**: Se procesan, suben a Storage y se transcriben automáticamente
3. **Chats**: Muestran el nombre del contacto o su número de teléfono
4. **Dashboard**: UI clara con toda la información visible

---

## 📞 Siguiente Paso

Una vez aplicadas las correcciones:

```bash
# 1. Reiniciar servicios
docker-compose restart

# 2. Ver logs en tiempo real
docker-compose logs -f

# 3. Probar enviando:
#    - Una imagen
#    - Un audio
#    - Un mensaje de texto

# 4. Verificar en el dashboard que todo se ve correctamente
```

---

**¡Listo!** Tu sistema ahora debería procesar correctamente imágenes, transcribir audios y mostrar los chats de forma clara. 🎉
