# Funcionalidades Pendientes - Reproducción y Visualización de Media

**Fecha de creación:** 18 de Mayo, 2026  
**Estado:** Pendiente de implementación  
**Prioridad:** Media (después de implementar sistema de eventos)

---

## 📋 Resumen

Este documento describe las funcionalidades relacionadas con la reproducción y visualización de contenido multimedia en el timeline de conversaciones que quedan **pendientes de implementar**. Estas funcionalidades se posponen para concentrar esfuerzos en la implementación del **Sistema de Eventos (Enfoque 2)**.

---

## 🎯 Funcionalidades Pendientes

### 1. Reproducción de Audios (Notas de Voz)

**Descripción:**  
Permitir la reproducción de notas de voz directamente desde el timeline de conversaciones, similar al módulo actual de conversaciones.

**Requerimientos:**
- Componente reproductor de audio con controles (play/pause, progreso, velocidad)
- Visualización de waveform (forma de onda) del audio
- Mostrar duración total del audio
- Soporte para formatos: OGG, MP3, AAC
- Indicador de audio "ya reproducido" vs "sin reproducir"

**Datos necesarios en BD:**
```sql
-- Agregar a tabla messages (si no existe)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_data JSONB;

-- Estructura esperada:
{
  "media_url": "https://storage.supabase.co/...",
  "media_type": "audio/ogg",
  "duration_seconds": 45,
  "file_size_bytes": 123456,
  "waveform": [0.2, 0.5, 0.8, 0.3, ...], -- Array de amplitudes para visualización
  "transcription": "Texto opcional transcrito del audio" -- Futuro: integración con Whisper API
}
```

**Componente UI sugerido:**
```jsx
<AudioPlayer 
  src={message.media_data.media_url}
  duration={message.media_data.duration_seconds}
  waveform={message.media_data.waveform}
  onPlaybackComplete={() => markAsPlayed(message.id)}
/>
```

**Dependencias:**
- Librería recomendada: `wavesurfer.js` o `react-h5-audio-player`
- Storage configurado en Supabase para servir archivos media
- Endpoint API para obtener URL firmada si los archivos son privados

---

### 2. Visualización de Imágenes

**Descripción:**  
Mostrar imágenes enviadas en la conversación con opción de ampliar/zoom y descarga.

**Requerimientos:**
- Miniaturas (thumbnails) en el timeline
- Modal/lightbox para ver imagen completa
- Opción de descarga de imagen original
- Indicador de carga progresiva (lazy loading)
- Soporte para formatos: JPG, PNG, WEBP, GIF

**Datos necesarios en BD:**
```sql
-- media_data structure para imágenes:
{
  "media_url": "https://storage.supabase.co/original.jpg",
  "thumbnail_url": "https://storage.supabase.co/thumb.jpg",
  "media_type": "image/jpeg",
  "file_size_bytes": 456789,
  "dimensions": {
    "width": 1920,
    "height": 1080
  }
}
```

**Componente UI sugerido:**
```jsx
<ImageViewer 
  src={message.media_data.media_url}
  thumbnail={message.media_data.thumbnail_url}
  alt={message.caption || 'Imagen enviada'}
/>
```

**Dependencias:**
- Librería recomendada: `react-image-lightbox` o `yet-another-react-lightbox`
- Generación de thumbnails (puede hacerse en backend o con transform de Supabase Storage)

---

### 3. Reproducción de Videos

**Descripción:**  
Reproducir videos enviados en la conversación con controles estándar.

**Requerimientos:**
- Player de video con controles nativos
- Preview/poster (frame inicial del video)
- Soporte para formatos: MP4, WEBM, MOV
- Opción de descarga del video original
- Indicador de tamaño de archivo antes de reproducir

**Datos necesarios en BD:**
```sql
-- media_data structure para videos:
{
  "media_url": "https://storage.supabase.co/video.mp4",
  "poster_url": "https://storage.supabase.co/poster.jpg",
  "media_type": "video/mp4",
  "file_size_bytes": 5234567,
  "duration_seconds": 120,
  "dimensions": {
    "width": 1280,
    "height": 720
  }
}
```

**Componente UI sugerido:**
```jsx
<VideoPlayer 
  src={message.media_data.media_url}
  poster={message.media_data.poster_url}
  duration={message.media_data.duration_seconds}
/>
```

**Dependencias:**
- Elemento `<video>` nativo de HTML5 o librería como `video.js`
- FFmpeg o similar para generación de poster frame (backend)

---

### 4. Visualización de Documentos/Archivos

**Descripción:**  
Mostrar documentos adjuntos (PDF, DOC, XLS, etc.) con opción de descarga y preview cuando sea posible.

**Requerimientos:**
- Card con información del archivo (nombre, tamaño, tipo)
- Icono según tipo de archivo
- Botón de descarga
- Preview inline para PDFs (opcional)
- Indicador de descarga en progreso

**Datos necesarios en BD:**
```sql
-- media_data structure para documentos:
{
  "media_url": "https://storage.supabase.co/documento.pdf",
  "media_type": "application/pdf",
  "file_name": "Cotización_Miami_Cliente123.pdf",
  "file_size_bytes": 234567,
  "preview_available": true
}
```

**Componente UI sugerido:**
```jsx
<FileAttachment 
  url={message.media_data.media_url}
  fileName={message.media_data.file_name}
  fileSize={message.media_data.file_size_bytes}
  mimeType={message.media_data.media_type}
  allowPreview={message.media_data.preview_available}
/>
```

**Dependencias:**
- Librería recomendada para PDF preview: `react-pdf` o `@react-pdf-viewer/core`
- Iconos de tipos de archivo: `lucide-react` tiene iconos genéricos

---

## 🔄 Integración con WAHA Webhook

**Consideración importante:**  
Cuando WAHA envía un webhook de mensaje con media, necesitamos:

1. **Descargar el archivo** desde la URL temporal que proporciona WAHA
2. **Subir a Supabase Storage** para persistencia
3. **Generar thumbnails/posters** si aplica (imágenes, videos)
4. **Extraer metadata** (duración, dimensiones, etc.)
5. **Guardar en `messages.media_data`** con toda la información

**Flujo propuesto:**
```javascript
// En webhookService.handleMessage()
if (payload.hasMedia) {
  const mediaInfo = await processMediaFile({
    wahaUrl: payload.mediaUrl,
    mimeType: payload.mimetype,
    messageId: savedMessage.id
  });
  
  // Actualizar mensaje con media_data
  await updateMessageMedia(savedMessage.id, mediaInfo);
}
```

---

## 📊 Impacto en Base de Datos

### Cambios necesarios (cuando se implemente):

```sql
-- Asegurar que campo media_data existe
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_data JSONB DEFAULT NULL;

-- Índice para búsquedas por tipo de media
CREATE INDEX IF NOT EXISTS idx_messages_media_type 
ON messages ((media_data->>'media_type')) 
WHERE media_data IS NOT NULL;

-- Índice para búsquedas de mensajes con media
CREATE INDEX IF NOT EXISTS idx_messages_has_media_timestamp 
ON messages (has_media, timestamp DESC) 
WHERE has_media = true;
```

---

## 🎨 Consideraciones de UX/UI

### Principios de diseño:
1. **Lazy Loading:** No cargar todo el media de una vez, solo cuando sea visible
2. **Compresión:** Mostrar thumbnails/previews comprimidos, full quality solo al expandir
3. **Feedback visual:** Indicadores claros de carga, error, y éxito
4. **Accesibilidad:** Alt text para imágenes, transcripciones para audios
5. **Performance:** Limitar cantidad de media renderizado simultáneamente (virtualización)

### Estados a manejar:
- `loading` - Descargando media
- `ready` - Listo para reproducir/visualizar
- `playing` - En reproducción (audios/videos)
- `error` - Error al cargar
- `played` - Ya fue reproducido/visto (opcional)

---

## 🔐 Consideraciones de Seguridad

### Storage Supabase:
- **Bucket privado** para archivos de conversaciones
- **Signed URLs** con expiración (ej: 1 hora) para acceso temporal
- **RLS policies** en bucket para asegurar que solo usuarios autorizados accedan
- **Límites de tamaño** por tipo de archivo (evitar abuse)
- **Validación de MIME types** en backend antes de guardar

---

## 📅 Estimación de Implementación

**Cuando se implemente esta funcionalidad:**

| Funcionalidad | Complejidad | Tiempo Estimado |
|---------------|-------------|-----------------|
| Audios (notas de voz) | Media | 2-3 días |
| Imágenes | Baja | 1-2 días |
| Videos | Media | 2-3 días |
| Documentos/Archivos | Baja-Media | 1-2 días |
| Integración Webhook | Media | 2 días |
| **TOTAL** | - | **8-12 días** |

---

## ✅ Criterios de Aceptación (Futuro)

Cuando se implemente, debe cumplir:

- [ ] Audios se reproducen correctamente con controles funcionales
- [ ] Waveform se visualiza correctamente
- [ ] Imágenes se muestran como thumbnails y se pueden ampliar
- [ ] Videos tienen poster frame y se reproducen sin errores
- [ ] Documentos muestran información correcta y se pueden descargar
- [ ] Todo el media se carga con lazy loading
- [ ] URLs firmadas funcionan y expiran correctamente
- [ ] Performance del timeline no se degrada con muchos archivos media
- [ ] Funciona en móvil y desktop
- [ ] Tests E2E pasan para todos los tipos de media

---

## 📚 Referencias

- [WAHA Media API](https://waha.devlike.pro/docs/how-to/media/)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [React Audio Player Components](https://www.npmjs.com/package/react-h5-audio-player)
- [React Image Lightbox](https://www.npmjs.com/package/yet-another-react-lightbox)
- [Video.js Documentation](https://videojs.com/)

---

**Notas finales:**  
Esta funcionalidad es importante para la experiencia de usuario completa, pero no es bloqueante para el Sistema de Eventos. Se puede implementar en una fase posterior sin afectar la funcionalidad core del sistema de conversaciones.
