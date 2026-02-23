# Configuración de Webhooks WAHA - Comandos Directos

## 🎯 Objetivo

Configurar WAHA para que envíe webhooks de **TODOS** los mensajes (entrantes Y salientes) usando el evento `message.any`.

## 📋 Opción 1: Usando cURL (Recomendado)

### 1. Verificar Configuración Actual

```bash
curl -X GET "http://localhost:3000/api/default/webhooks" \
  -H "X-Api-Key: YOUR_API_KEY_HERE"
```

### 2. Configurar Webhooks

```bash
curl -X POST "http://localhost:3000/api/default/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY_HERE" \
  -d '{
    "url": "http://localhost:4000/webhooks/waha",
    "events": ["message.any", "session.status", "message.ack"]
  }'
```

### 3. Verificar Nueva Configuración

```bash
curl -X GET "http://localhost:3000/api/default/webhooks" \
  -H "X-Api-Key: YOUR_API_KEY_HERE"
```

**Resultado esperado:**
```json
{
  "url": "http://localhost:4000/webhooks/waha",
  "events": ["message.any", "session.status", "message.ack"]
}
```

## 📋 Opción 2: Usando PowerShell

### 1. Verificar Configuración Actual

```powershell
$headers = @{
    "X-Api-Key" = "YOUR_API_KEY_HERE"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/default/webhooks" `
    -Method GET `
    -Headers $headers
```

### 2. Configurar Webhooks

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-Api-Key" = "YOUR_API_KEY_HERE"
}

$body = @{
    url = "http://localhost:4000/webhooks/waha"
    events = @("message.any", "session.status", "message.ack")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/default/webhooks" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

## 📋 Opción 3: Interfaz Web de WAHA

1. Abre `http://localhost:3000` en tu navegador
2. Ve a la sección de **Webhooks**
3. Configura:
   - **URL**: `http://localhost:4000/webhooks/waha`
   - **Events**: Selecciona `message.any`, `session.status`, `message.ack`
4. Guarda la configuración

## ⚠️ Notas Importantes

### Si WAHA está en Docker

Usa `host.docker.internal` en lugar de `localhost`:

```bash
curl -X POST "http://localhost:3000/api/default/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY_HERE" \
  -d '{
    "url": "http://host.docker.internal:4000/webhooks/waha",
    "events": ["message.any", "session.status", "message.ack"]
  }'
```

### Múltiples Sesiones

Si tienes múltiples sesiones (bots), reemplaza `default` con el nombre de la sesión:

```bash
curl -X POST "http://localhost:3000/api/TU_SESION/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY_HERE" \
  -d '{
    "url": "http://localhost:4000/webhooks/waha",
    "events": ["message.any", "session.status", "message.ack"]
  }'
```

## ✅ Verificación

Después de configurar, envía un mensaje de prueba desde el bot y verifica los logs del servidor Node.js:

```
🔔 Webhook recibido [message.any]:
   session: default
   event: message.any
   messageId: XXXXX
   FromMe: true  ← ¡Debe aparecer!
```

## 🔄 Eliminar Webhooks (si es necesario)

```bash
curl -X DELETE "http://localhost:3000/api/default/webhooks" \
  -H "X-Api-Key: YOUR_API_KEY_HERE"
```

## 📝 Variables a Reemplazar

- `YOUR_API_KEY_HERE` → Tu API Key de WAHA (está en el archivo `.env` como `WAHA_API_KEY`)
- `localhost:3000` → URL de WAHA (puede ser diferente)
- `localhost:4000` → URL del servidor Node.js (puede ser diferente)
- `default` → Nombre de tu sesión de WhatsApp

## 🎯 Próximo Paso

Una vez configurados los webhooks, ejecuta el script de sincronización para recuperar mensajes históricos:

```bash
cd "c:\Users\loboc\OneDrive\Documents\proyectos\VIAJES NOVA\crmnovabots"
node src/scripts/sync-outgoing-messages.js
```
