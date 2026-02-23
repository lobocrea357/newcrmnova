# 🔧 Solución de Problemas - Mensajes Salientes y Transcripciones

## 🎯 Problemas Identificados

1. ✅ **Solo se ven mensajes entrantes** - No aparecen los mensajes que envía el bot
2. ✅ **Mensajes sin contenido** - Aparecen como "(Sin contenido)"
3. ✅ **Audios no se transcriben** - No aparece la transcripción

## 🔍 Diagnóstico

### Paso 1: Ejecutar Script de Debug

```bash
# En Supabase SQL Editor, ejecuta:
```
```sql
-- Ver archivo: debug-messages.sql
```

Esto te mostrará:
- Cuántos mensajes entrantes vs salientes tienes
- Cuántos mensajes tienen body vacío
- Si hay archivos multimedia guardados
- Si hay transcripciones en metadata

### Paso 2: Verificar Configuración de WAHA

```bash
# Ver configuración actual
curl http://localhost:3000/api/sessions/default \
  -H "X-Api-Key: TU_WAHA_API_KEY" | jq '.config.webhooks'
```

Deberías ver algo como:
```json
{
  "webhooks": [
    {
      "url": "http://express:4000/webhooks/waha",
      "events": ["message", "message.any", "message.ack", "session.status"]
    }
  ]
}
```

**⚠️ IMPORTANTE:** Si no ves `message.any` en los eventos, ese es el problema.

## ✅ Soluciones

### Solución 1: Configurar Eventos de WAHA

#### Opción A: Via Dashboard de WAHA

1. Abre http://localhost:3000/dashboard
2. Inicia sesión (usuario: admin, contraseña: la de tu `.env`)
3. Ve a tu sesión (ej: "default")
4. En la sección "Webhooks":
   - **URL:** `http://express:4000/webhooks/waha`
   - **Events:** Marca estas opciones:
     - ✅ `message` - Mensajes entrantes
     - ✅ `message.any` - **TODOS los mensajes** ⭐
     - ✅ `message.ack` - Confirmaciones
     - ✅ `session.status` - Estado
5. Guarda cambios
6. **Reinicia la sesión** (Stop → Start)

#### Opción B: Via API

```bash
curl -X PATCH http://localhost:3000/api/sessions/default \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: TU_WAHA_API_KEY" \
  -d '{
    "config": {
      "webhooks": [
        {
          "url": "http://express:4000/webhooks/waha",
          "events": ["message", "message.any", "message.ack", "session.status"],
          "retries": 2
        }
      ]
    }
  }'
```

#### Opción C: Variables de Entorno (Recomendado)

Edita `.env`:
```env
# Cambiar de:
WHATSAPP_HOOK_EVENTS=message,session.status

# A:
WHATSAPP_HOOK_EVENTS=message,message.any,message.ack,session.status

# O simplemente:
WHATSAPP_HOOK_EVENTS=*
```

Luego reinicia los contenedores:
```bash
docker-compose down
docker-compose up -d
```

### Solución 2: Reconstruir Express con Cambios

El código ya está actualizado para manejar `message.any`. Solo necesitas reconstruir:

```bash
docker-compose up -d --build express
```

### Solución 3: Configurar Transcripción de Audios

#### Si usas OpenAI Whisper:

Agrega en `.env`:
```env
OPENAI_API_KEY=sk-...tu_api_key
TRANSCRIPTION_SERVICE=openai
```

#### Si usas otro servicio:

Verifica que el servicio de transcripción esté configurado en `transcriptionService.js`.

## 🧪 Pruebas

### Prueba 1: Enviar Mensaje de Prueba

```bash
# Edita test-send-message.sh con tu número
chmod +x test-send-message.sh
./test-send-message.sh
```

### Prueba 2: Verificar en Logs

```bash
# Ver logs de Express
docker-compose logs -f express

# Deberías ver:
# 📨 Procesando mensaje [message.any]: { fromMe: true, ... }
# ✅ Mensaje guardado: ...
```

### Prueba 3: Verificar en Base de Datos

```sql
-- Ver últimos 10 mensajes salientes
SELECT 
    message_id,
    from_me,
    from_number,
    to_number,
    body,
    type,
    timestamp
FROM messages 
WHERE from_me = true 
ORDER BY timestamp DESC 
LIMIT 10;
```

Si no hay resultados, el problema es la configuración de WAHA.

### Prueba 4: Verificar en Dashboard

1. Abre http://localhost:3001
2. Navega a una conversación
3. Deberías ver mensajes en verde (salientes) y gris (entrantes)

## 📊 Checklist de Verificación

### Configuración de WAHA
- [ ] Variable `WHATSAPP_HOOK_EVENTS` incluye `message.any` o `*`
- [ ] Webhook configurado en la sesión con evento `message.any`
- [ ] Sesión reiniciada después de cambiar configuración
- [ ] Logs de WAHA muestran: `Sending webhook: message.any`

### Configuración de Express
- [ ] Contenedor Express reconstruido con últimos cambios
- [ ] Logs de Express muestran: `📨 Procesando mensaje [message.any]`
- [ ] Logs muestran: `✅ Mensaje guardado`

### Base de Datos
- [ ] Tabla `messages` tiene registros con `from_me = true`
- [ ] Campo `body` no está vacío (o tiene caption/type)
- [ ] Tabla `media_files` tiene archivos multimedia
- [ ] Campo `metadata` tiene transcripciones (para audios)

### Dashboard
- [ ] Dashboard reconstruido con últimos cambios
- [ ] Se ven mensajes en verde (salientes) y gris (entrantes)
- [ ] Audios muestran reproductor
- [ ] Transcripciones aparecen debajo de audios

## 🚨 Errores Comunes

### Error 1: "Solo veo mensajes entrantes"

**Causa:** WAHA no está enviando eventos `message.any`

**Solución:**
1. Verifica `WHATSAPP_HOOK_EVENTS` en `.env`
2. Configura webhook en la sesión con `message.any`
3. Reinicia sesión en WAHA
4. Reinicia contenedores: `docker-compose restart`

### Error 2: "Mensajes aparecen como (Sin contenido)"

**Causa:** El campo `body` está vacío

**Solución:**
- Para mensajes de texto: Verifica que WAHA esté enviando el campo `body`
- Para multimedia: Es normal si solo tiene imagen/video sin caption
- El dashboard debería mostrar el tipo de media en su lugar

### Error 3: "Audios no se transcriben"

**Causa:** Servicio de transcripción no configurado

**Solución:**
1. Agrega `OPENAI_API_KEY` en `.env`
2. Verifica que `transcriptionService.js` esté funcionando
3. Revisa logs: `docker-compose logs -f express | grep transcripción`

### Error 4: "Webhook no se recibe"

**Causa:** URL del webhook incorrecta o Express no accesible

**Solución:**
1. Verifica que Express esté corriendo: `docker-compose ps`
2. Verifica la URL: debe ser `http://express:4000/webhooks/waha` (dentro de Docker)
3. Prueba manualmente:
   ```bash
   curl -X POST http://localhost:4000/webhooks/waha \
     -H "Content-Type: application/json" \
     -d '{"event":"test","session":"default","payload":{}}'
   ```

## 📞 Soporte Adicional

Si después de seguir estos pasos aún tienes problemas:

1. **Comparte los logs:**
   ```bash
   docker-compose logs express > express-logs.txt
   docker-compose logs waha > waha-logs.txt
   ```

2. **Comparte el resultado de debug-messages.sql**

3. **Comparte la configuración de la sesión:**
   ```bash
   curl http://localhost:3000/api/sessions/default \
     -H "X-Api-Key: TU_API_KEY" > session-config.json
   ```

## 🎯 Resumen Rápido

```bash
# 1. Actualizar .env
echo "WHATSAPP_HOOK_EVENTS=message,message.any,message.ack,session.status" >> .env

# 2. Reconstruir servicios
docker-compose down
docker-compose up -d --build

# 3. Configurar sesión en WAHA (via dashboard o API)
# Ver WAHA_CONFIGURATION.md

# 4. Enviar mensaje de prueba
./test-send-message.sh

# 5. Verificar en dashboard
# http://localhost:3001
```

¡Listo! Ahora deberías ver todos los mensajes correctamente. 🎉
