# 📸 Configuración de Multimedia y Transcripción

## 🎯 Nuevas Funcionalidades

El sistema ahora puede:
- ✅ **Descargar imágenes/videos** de WAHA
- ✅ **Subirlos a Supabase Storage** (bucket `whatsapp`)
- ✅ **Transcribir audios** con OpenAI Whisper
- ✅ **Mostrar multimedia** desde URLs públicas de Supabase

## 📋 Paso 1: Crear Bucket en Supabase

### 1.1 Ir a Storage en Supabase

1. Abre tu proyecto en https://supabase.com
2. Ve a **Storage** en el menú lateral
3. Haz clic en **New bucket**

### 1.2 Configurar el Bucket

- **Name:** `whatsapp`
- **Public bucket:** ✅ **SÍ** (para poder acceder a las URLs públicas)
- **File size limit:** 50 MB (o el que prefieras)
- **Allowed MIME types:** Dejar vacío (permite todos)

### 1.3 Crear Carpetas (Opcional)

El sistema creará automáticamente estas carpetas:
- `images/` - Imágenes
- `videos/` - Videos
- `audios/` - Audios y notas de voz
- `documents/` - Documentos
- `media/` - Otros archivos

## 🔑 Paso 2: Configurar OpenAI API Key

### 2.1 Obtener API Key de OpenAI

1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Cópiala (solo se muestra una vez)

### 2.2 Agregar al archivo `.env`

Abre el archivo `.env` y reemplaza:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Por tu API key real:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Nota:** Si no configuras la API key, el sistema funcionará pero NO transcribirá audios.

## 🚀 Paso 3: Reconstruir y Reiniciar

```powershell
# Detener servicios
docker-compose down

# Reconstruir con nuevas dependencias
docker-compose build --no-cache

# Levantar servicios
docker-compose up -d
```

## ✅ Paso 4: Verificar que Funciona

### 4.1 Enviar una imagen por WhatsApp

Envía una imagen a tu bot de WhatsApp.

### 4.2 Ver logs

```powershell
docker-compose logs express -f
```

Deberías ver:
```
📎 Multimedia procesada: images/xxxxx
✅ Mensaje guardado: ABC123
```

### 4.3 Verificar en Supabase Storage

1. Ve a Supabase → Storage → whatsapp
2. Deberías ver la imagen en la carpeta `images/`

### 4.4 Enviar un audio

Envía una nota de voz por WhatsApp.

Deberías ver en los logs:
```
🎤 Audio detectado, iniciando transcripción...
🎤 Procesando audio para mensaje: xxxxx
✅ Audio transcrito: "texto del audio..."
```

## 📡 Endpoints de Multimedia

### Obtener imágenes de un bot

```powershell
$botId = "UUID-DE-TU-BOT"
Invoke-RestMethod -Uri "http://localhost:4000/api/media/images/$botId?limit=20"
```

### Obtener videos de un bot

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/media/videos/$botId?limit=20"
```

### Obtener audios de un bot

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/media/audios/$botId?limit=20"
```

### Obtener transcripciones

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/media/transcriptions/$botId?limit=20"
```

### Obtener multimedia de un mensaje específico

```powershell
$messageId = "UUID-DEL-MENSAJE"
Invoke-RestMethod -Uri "http://localhost:4000/api/media/message/$messageId"
```

### Forzar transcripción de un audio

```powershell
$body = @{
    audioUrl = "http://waha:3000/api/files/xxxxx"
    botId = "UUID-DEL-BOT"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/media/transcribe/MESSAGE-ID" -Method POST -Body $body -ContentType "application/json"
```

## 🔍 Estructura de Respuesta

### Multimedia

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bot_id": "uuid",
      "message_id": "uuid",
      "file_url": "https://xxx.supabase.co/storage/v1/object/public/whatsapp/images/xxxxx.jpg",
      "file_name": "xxxxx.jpg",
      "mimetype": "image/jpeg",
      "file_size": 123456,
      "created_at": "2025-11-08T...",
      "metadata": {
        "original_url": "http://waha:3000/...",
        "folder": "images",
        "uploaded_at": "2025-11-08T..."
      }
    }
  ]
}
```

### Transcripciones

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "message_id": "msg_123",
      "from_number": "5491112345678",
      "timestamp": "2025-11-08T...",
      "transcription": {
        "text": "Hola, este es un mensaje de audio",
        "language": "es",
        "duration": null,
        "transcribed_at": "2025-11-08T..."
      },
      "content": "[Audio] Hola, este es un mensaje de audio"
    }
  ]
}
```

## 🎨 Mostrar Multimedia en tu Dashboard

### Ejemplo con HTML/JavaScript

```html
<!-- Mostrar imágenes -->
<div id="images"></div>

<script>
fetch('http://localhost:4000/api/media/images/BOT-ID?limit=10')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('images');
    data.data.forEach(media => {
      const img = document.createElement('img');
      img.src = media.file_url;
      img.style.width = '200px';
      img.style.margin = '10px';
      container.appendChild(img);
    });
  });
</script>
```

### Ejemplo con React

```jsx
import { useEffect, useState } from 'react';

function MediaGallery({ botId }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:4000/api/media/images/${botId}?limit=20`)
      .then(res => res.json())
      .then(data => setImages(data.data));
  }, [botId]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map(media => (
        <img 
          key={media.id} 
          src={media.file_url} 
          alt={media.file_name}
          className="w-full h-48 object-cover rounded"
        />
      ))}
    </div>
  );
}
```

## 📊 Consultas SQL Útiles

### Ver todos los archivos multimedia

```sql
SELECT * FROM media_files ORDER BY created_at DESC LIMIT 50;
```

### Ver mensajes con transcripción

```sql
SELECT 
  id,
  message_id,
  from_number,
  content,
  metadata->'transcription'->>'text' as transcription,
  timestamp
FROM messages
WHERE metadata->'transcription' IS NOT NULL
ORDER BY timestamp DESC;
```

### Contar archivos por tipo

```sql
SELECT 
  CASE 
    WHEN mimetype LIKE 'image/%' THEN 'Imágenes'
    WHEN mimetype LIKE 'video/%' THEN 'Videos'
    WHEN mimetype LIKE 'audio/%' THEN 'Audios'
    ELSE 'Otros'
  END as tipo,
  COUNT(*) as total,
  SUM(file_size) as tamaño_total
FROM media_files
GROUP BY tipo;
```

### Ver espacio usado por bot

```sql
SELECT 
  b.name as bot_name,
  COUNT(m.id) as archivos,
  SUM(m.file_size) as bytes_totales,
  ROUND(SUM(m.file_size) / 1024.0 / 1024.0, 2) as mb_totales
FROM bots b
LEFT JOIN media_files m ON b.id = m.bot_id
GROUP BY b.id, b.name
ORDER BY bytes_totales DESC;
```

## ⚠️ Consideraciones

### Límites de OpenAI Whisper

- **Tamaño máximo:** 25 MB por archivo
- **Formatos soportados:** mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
- **Costo:** ~$0.006 por minuto de audio

### Límites de Supabase Storage

- **Plan gratuito:** 1 GB de almacenamiento
- **Ancho de banda:** 2 GB/mes (gratuito)
- **Tamaño máximo de archivo:** 50 MB (configurable)

### Optimizaciones Recomendadas

1. **Comprimir imágenes** antes de subir (opcional)
2. **Limpiar archivos viejos** periódicamente
3. **Usar CDN** para servir archivos (Supabase ya lo hace)
4. **Cachear transcripciones** para no re-transcribir

## 🔒 Seguridad

### Hacer el bucket privado (opcional)

Si quieres que solo usuarios autenticados accedan:

1. Ve a Supabase → Storage → whatsapp → Settings
2. Desmarca **Public bucket**
3. Crea políticas RLS para controlar acceso

### Ejemplo de política RLS

```sql
-- Permitir lectura solo a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'whatsapp');
```

## 🎉 ¡Listo!

Ahora tu CRM puede:
- 📸 Guardar todas las imágenes recibidas
- 🎥 Guardar todos los videos recibidos
- 🎤 Transcribir automáticamente todos los audios
- 🔍 Buscar por transcripciones
- 📊 Mostrar galerías de multimedia
- 💾 Almacenar todo en Supabase de forma organizada

---

**Próximos pasos sugeridos:**
1. Crear un dashboard web para visualizar multimedia
2. Agregar búsqueda por transcripciones
3. Implementar compresión de imágenes
4. Agregar análisis de sentimiento en transcripciones
