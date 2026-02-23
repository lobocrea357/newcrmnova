# ⚙️ Configuración de WAHA para Capturar Todos los Mensajes

## 🔍 Problema Identificado

Si solo ves mensajes entrantes y no los salientes, es porque WAHA necesita configuración adicional para capturar **todos** los eventos.

## ✅ Configuración Necesaria

### 1. Variables de Entorno en `.env`

Asegúrate de tener estas variables configuradas:

```env
# Eventos que WAHA debe enviar al webhook
WHATSAPP_HOOK_EVENTS=message,message.any,message.ack,session.status

# O para capturar TODOS los eventos:
WHATSAPP_HOOK_EVENTS=*

# URL del webhook (debe apuntar a tu Express)
WHATSAPP_HOOK_URL=http://express:4000/webhooks/waha
```

### 2. Configurar la Sesión en WAHA

Cuando crees o actualices una sesión en WAHA, debes configurar los webhooks correctamente.

#### Opción A: Via API de WAHA

```bash
# Crear/actualizar sesión con webhooks
curl -X POST http://localhost:3000/api/sessions/default \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: TU_WAHA_API_KEY" \
  -d '{
    "name": "default",
    "config": {
      "webhooks": [
        {
          "url": "http://express:4000/webhooks/waha",
          "events": ["message", "message.any", "message.ack", "session.status"],
          "hmac": null,
          "retries": 2,
          "customHeaders": []
        }
      ]
    }
  }'
```

#### Opción B: Via Dashboard de WAHA

1. Abre http://localhost:3000/dashboard
2. Ve a tu sesión (ej: "default")
3. En "Webhooks", configura:
   - **URL:** `http://express:4000/webhooks/waha`
   - **Events:** Selecciona:
     - ✅ `message` - Mensajes entrantes
     - ✅ `message.any` - TODOS los mensajes (incluye salientes)
     - ✅ `message.ack` - Confirmaciones de lectura
     - ✅ `session.status` - Estado de la sesión

## 🎯 Eventos Importantes

### `message.any` ⭐ **CRÍTICO**

Este evento captura **TODOS** los mensajes, tanto entrantes como salientes.

```json
{
  "event": "message.any",
  "session": "default",
  "payload": {
    "id": "...",
    "from": "584121234567@c.us",
    "to": "584129876543@c.us",
    "fromMe": true,  // ← Indica si es mensaje saliente
    "body": "Hola, ¿cómo estás?",
    "type": "chat",
    "timestamp": 1699564800
  }
}
```

### `message`

Solo captura mensajes **entrantes**.

### `message.ack`

Captura cambios en el estado de entrega:
- `1` - Enviado
- `2` - Entregado
- `3` - Leído

## 🔧 Verificar Configuración Actual

### 1. Ver configuración de la sesión

```bash
curl http://localhost:3000/api/sessions/default \
  -H "X-Api-Key: TU_WAHA_API_KEY"
```

Busca la sección `webhooks` en la respuesta.

### 2. Ver logs de WAHA

```bash
docker-compose logs -f waha
```

Deberías ver líneas como:
```
[WAHA] Sending webhook: message.any to http://express:4000/webhooks/waha
[WAHA] Webhook response: 200 OK
```

### 3. Ver logs de Express

```bash
docker-compose logs -f express
```

Deberías ver:
```
Procesando evento: message.any
✅ Mensaje guardado: ...
```

## 🐛 Solución de Problemas

### Problema 1: Solo veo mensajes entrantes

**Causa:** WAHA no está enviando eventos `message.any`

**Solución:**
1. Actualiza la configuración de webhooks de la sesión
2. Asegúrate de incluir `message.any` en los eventos
3. Reinicia la sesión en WAHA

### Problema 2: Mensajes sin contenido (body vacío)

**Causa:** Algunos mensajes solo tienen multimedia sin texto

**Solución:** El sistema ya maneja esto mostrando `[tipo]` cuando no hay body. Verifica que:
1. Los archivos multimedia se estén guardando en `media_files`
2. La URL de media esté accesible

### Problema 3: Audios no se transcriben

**Causas posibles:**
1. El servicio de transcripción no está configurado
2. No hay API key de transcripción
3. El archivo de audio no es accesible

**Solución:**

Verifica en `.env`:
```env
# Si usas OpenAI Whisper
OPENAI_API_KEY=tu_api_key

# O si usas otro servicio
TRANSCRIPTION_SERVICE=whisper
TRANSCRIPTION_API_KEY=tu_api_key
```

## 📊 Verificar en la Base de Datos

Ejecuta `debug-messages.sql` para ver:

```sql
-- Ver mensajes salientes
SELECT * FROM messages WHERE from_me = true ORDER BY timestamp DESC LIMIT 10;

-- Ver transcripciones
SELECT 
    message_id,
    body,
    metadata->>'transcription' as transcription
FROM messages 
WHERE type IN ('audio', 'ptt')
ORDER BY timestamp DESC;
```

## ✅ Checklist de Configuración

- [ ] Variable `WHATSAPP_HOOK_EVENTS` incluye `message.any`
- [ ] Webhook configurado en la sesión de WAHA
- [ ] Sesión reiniciada después de cambiar configuración
- [ ] Logs de WAHA muestran envío de webhooks
- [ ] Logs de Express muestran recepción de eventos
- [ ] Base de datos tiene mensajes con `from_me = true`
- [ ] Archivos multimedia se guardan en `media_files`
- [ ] Transcripciones se guardan en `metadata`

## 🚀 Script de Configuración Rápida

Crea un archivo `configure-waha.sh`:

```bash
#!/bin/bash

API_KEY="TU_WAHA_API_KEY"
SESSION="default"
WEBHOOK_URL="http://express:4000/webhooks/waha"

echo "Configurando webhooks para sesión: $SESSION"

curl -X PATCH "http://localhost:3000/api/sessions/$SESSION" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -d "{
    \"config\": {
      \"webhooks\": [
        {
          \"url\": \"$WEBHOOK_URL\",
          \"events\": [\"message\", \"message.any\", \"message.ack\", \"session.status\"],
          \"retries\": 2
        }
      ]
    }
  }"

echo "\n✅ Configuración actualizada"
echo "Reinicia la sesión para aplicar cambios"
```

Ejecuta:
```bash
chmod +x configure-waha.sh
./configure-waha.sh
```

## 📝 Notas Importantes

1. **`message.any` es esencial** para capturar mensajes salientes
2. **Reinicia la sesión** después de cambiar la configuración de webhooks
3. **Verifica los logs** para confirmar que los webhooks se están enviando
4. **La transcripción es asíncrona** - puede tardar unos segundos
5. **Los mensajes multimedia** necesitan que WAHA tenga acceso a la URL de descarga

## 🔗 Referencias

- [WAHA Webhooks Documentation](https://waha.devlike.pro/docs/how-to/webhooks/)
- [WAHA Events](https://waha.devlike.pro/docs/how-to/webhooks/#events)
- [WAHA Sessions API](https://waha.devlike.pro/docs/how-to/sessions/)
