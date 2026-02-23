# 🖼️ Prueba de Imágenes - Guía Completa

## ✅ Problema Identificado y Corregido

**Problema:** WAHA envía las imágenes en formato `payload.media.url` pero el código buscaba `payload.mediaUrl`

**Solución:** Actualizado `webhookService.js` para extraer correctamente:
```javascript
const mediaUrl = payload.mediaUrl || payload.media?.url;
const messageType = payload.type || (payload._data?.message?.imageMessage ? 'image' : ...);
```

## 🧪 Pasos para Probar

### 1. Verificar que Express está corriendo

```bash
docker-compose ps
```

Debe mostrar:
```
crm-express    Up (healthy)
```

### 2. Crear Bucket en Supabase (SI NO EXISTE)

Ejecuta en Supabase SQL Editor: `create-bucket-simple.sql`

```sql
-- Verificar si existe
SELECT * FROM storage.buckets WHERE name = 'whatsapp';

-- Si no existe, crear
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('whatsapp', 'whatsapp', true, 52428800)
ON CONFLICT (id) DO NOTHING;
```

### 3. Configurar Políticas en Supabase Dashboard

Ve a: **Storage → whaha → Policies**

Crea estas políticas:

**Política 1: Lectura Pública**
- Policy name: `Public Access`
- Allowed operation: `SELECT`
- Policy definition: `true`

**Política 2: Inserción Autenticada**
- Policy name: `Authenticated Upload`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition: `true`

### 4. Enviar Imagen de Prueba

1. Abre WhatsApp
2. Envía una imagen al bot (584122330928)
3. Espera 5-10 segundos

### 5. Verificar en Logs

```bash
docker-compose logs -f express
```

**Debes ver:**
```
📨 ========== PROCESANDO MENSAJE ==========
Evento: message.any
Type: image
HasMedia: true

📎 ========== PROCESANDO MULTIMEDIA ==========
Tipo: image
Media URL: http://localhost:3000/api/files/default/...
Mimetype: image/jpeg

📥 Descargando desde WAHA: http://localhost:3000/...
✅ Descargado: 47655 bytes, tipo: image/jpeg

📁 Carpeta destino: images

📤 Subiendo a Supabase Storage: images/1762732248_...
   Tamaño: 47655 bytes
   Tipo: image/jpeg
✅ Archivo subido exitosamente
   URL: https://xxx.supabase.co/storage/v1/object/public/whatsapp/images/...

💾 Guardando referencia en BD...
✅ Referencia guardada en media_files (ID: xxx)

✅ ========== MULTIMEDIA PROCESADA ==========
```

### 6. Verificar en Base de Datos

Ejecuta `check-images.sql`:

```sql
-- Ver archivos multimedia
SELECT 
    mf.file_name,
    mf.mimetype,
    mf.file_url,
    m.type
FROM media_files mf
LEFT JOIN messages m ON mf.message_id = m.id
ORDER BY mf.created_at DESC
LIMIT 5;
```

**Debes ver:**
- `file_url`: URL completa de Supabase Storage
- `mimetype`: image/jpeg
- `type`: image

### 7. Verificar en Supabase Storage

1. Ve a Supabase Dashboard
2. Storage → whatsapp → images
3. Debes ver el archivo subido
4. Haz clic para ver la imagen

### 8. Verificar en Dashboard

1. Abre: http://localhost:3001
2. Login
3. Navega al chat
4. **La imagen debe mostrarse**

## 🔍 Diagnóstico de Problemas

### Problema: Logs muestran "undefined"

**Causa:** Formato incorrecto de WAHA  
**Solución:** Ya corregido en el código

### Problema: Error "bucket does not exist"

**Causa:** Bucket no creado  
**Solución:** Ejecutar `create-bucket-simple.sql`

### Problema: Error 403 al cargar imagen

**Causa:** Políticas de Storage no configuradas  
**Solución:** Configurar políticas en Supabase Dashboard

### Problema: Imagen no aparece en dashboard

**Causa 1:** `file_url` no guardado  
**Solución:** Verificar en BD con `check-images.sql`

**Causa 2:** CORS o permisos  
**Solución:** Verificar que el bucket sea público

### Problema: Error al descargar desde WAHA

**Causa:** WAHA_API_KEY incorrecta  
**Solución:** Verificar en `.env`:
```
WAHA_API_KEY=a317ec51b40e4ab597fa767f7bb13e1c
```

## 📊 Formato de Datos

### Webhook de WAHA (Imagen)
```json
{
  "event": "message.any",
  "payload": {
    "id": "true_584244551933@c.us_ABC123",
    "from": "584244551933@c.us",
    "fromMe": true,
    "hasMedia": true,
    "media": {
      "url": "http://localhost:3000/api/files/default/ABC123.jpeg",
      "mimetype": "image/jpeg"
    },
    "_data": {
      "message": {
        "imageMessage": {
          "url": "https://mmg.whatsapp.net/...",
          "mimetype": "image/jpeg",
          "height": 1280,
          "width": 960
        }
      }
    }
  }
}
```

### Tabla messages
```sql
{
  "id": "uuid",
  "message_id": "true_584244551933@c.us_ABC123",
  "type": "image",
  "has_media": true,
  "media_mimetype": "image/jpeg",
  "from_me": true
}
```

### Tabla media_files
```sql
{
  "id": "uuid",
  "message_id": "uuid (FK)",
  "file_url": "https://xxx.supabase.co/storage/v1/object/public/whatsapp/images/1762732248_ABC123.jpeg",
  "file_name": "1762732248_ABC123.jpeg",
  "mimetype": "image/jpeg",
  "file_size": 47655
}
```

## ✅ Checklist de Verificación

- [ ] Express corriendo (docker-compose ps)
- [ ] Bucket 'whatsapp' existe en Supabase
- [ ] Políticas de Storage configuradas
- [ ] WAHA_API_KEY correcta en .env
- [ ] Imagen enviada desde WhatsApp
- [ ] Logs muestran "MULTIMEDIA PROCESADA"
- [ ] Archivo visible en Supabase Storage
- [ ] Registro en tabla media_files
- [ ] Imagen se muestra en dashboard

## 🎯 Resultado Esperado

Después de enviar una imagen:

1. ✅ Se procesa el webhook
2. ✅ Se descarga desde WAHA
3. ✅ Se sube a Supabase Storage
4. ✅ Se guarda referencia en BD
5. ✅ Se muestra en el dashboard

## 📞 Si Aún No Funciona

1. Ejecuta:
```bash
docker-compose logs -f express | Select-String "MULTIMEDIA"
```

2. Envía otra imagen

3. Copia los logs completos y revisa:
   - ¿Dice "PROCESANDO MULTIMEDIA"?
   - ¿Muestra la URL correcta?
   - ¿Hay algún error?

4. Verifica en Supabase:
```sql
SELECT * FROM media_files ORDER BY created_at DESC LIMIT 1;
```

5. Si `file_url` está vacío o NULL, hay un problema en la subida
6. Si `file_url` existe pero la imagen no carga, es problema de permisos

---

**¡Las imágenes deberían funcionar ahora!** 🎉
