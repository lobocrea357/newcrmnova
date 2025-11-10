# 🎯 Pasos Finales para Activar el Sistema

## Paso 1: Ejecutar la Migración en Supabase ✅

1. Ve a tu proyecto en Supabase: https://supabase.com
2. Abre el **SQL Editor** (menú lateral izquierdo)
3. Copia TODO el contenido del archivo `supabase-migration.sql`
4. Pégalo en el editor
5. Haz clic en **Run** (o presiona Ctrl+Enter)
6. Espera a que termine (debería decir "Migración completada exitosamente")

**¿Qué hace esta migración?**
- ✅ Agrega columnas faltantes a tus tablas existentes (bots, chats, messages)
- ✅ Crea nuevas tablas necesarias (contacts, webhook_events, media_files, tags, etc.)
- ✅ Crea índices para optimizar consultas
- ✅ Crea vistas útiles para el dashboard
- ✅ Configura triggers automáticos
- ✅ **NO borra ningún dato existente**

## Paso 2: Verificar que los Servicios Están Corriendo

```powershell
docker-compose ps
```

Deberías ver:
```
NAME          STATUS
crm-express   Up (healthy)
waha          Up (healthy)
```

Si no están corriendo:
```powershell
docker-compose up -d
```

## Paso 3: Sincronizar Bots de WAHA con Supabase

### Opción A: Crear una sesión nueva en WAHA

1. Abre http://localhost:3000/dashboard
2. Usuario: `admin`
3. Contraseña: `d7e6ad050069420ba581fb2c42f164a6`
4. Crea una nueva sesión (por ejemplo: "bot-principal")
5. Escanea el código QR con WhatsApp

### Opción B: Usar la API para crear una sesión

```powershell
$body = @{
    name = "bot-principal"
    config = @{
        proxy = $null
        noweb = @{
            store = @{
                enabled = $true
                fullSync = $false
            }
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4000/api/bots/bot-principal/start" -Method POST -Body $body -ContentType "application/json"
```

## Paso 4: Sincronizar con Supabase

Una vez que tengas al menos una sesión activa en WAHA:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/bots/sync" -Method POST
```

Esto:
- ✅ Lee todas las sesiones de WAHA
- ✅ Las crea en Supabase (tabla `bots`)
- ✅ Actualiza su estado

## Paso 5: Verificar que se Guardó en Supabase

### Opción A: Desde la API

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/bots"
```

### Opción B: Desde Supabase

1. Ve a Supabase → Table Editor
2. Selecciona la tabla `bots`
3. Deberías ver tu(s) bot(s) listado(s)

## Paso 6: Enviar un Mensaje de Prueba

Una vez que tu bot esté conectado (QR escaneado):

```powershell
$mensaje = @{
    session = "bot-principal"
    chatId = "5491112345678@c.us"  # Reemplaza con un número real
    text = "¡Hola! Este es un mensaje de prueba desde el CRM"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/messages/send" -Method POST -Body $mensaje -ContentType "application/json"
```

## Paso 7: Verificar que los Mensajes se Guardan

### Recibir un mensaje

1. Envía un mensaje de WhatsApp a tu número conectado
2. El webhook debería procesarlo automáticamente
3. Verifica en Supabase:

```sql
-- En Supabase SQL Editor
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;
```

### Ver estadísticas

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/dashboard/stats"
```

## 🔍 Verificación Completa

### 1. Verificar Webhooks

```powershell
# Ver logs de Express
docker-compose logs express --tail 50

# Deberías ver líneas como:
# "Procesando evento: message"
# "Mensaje guardado: ABC123"
```

### 2. Verificar Tablas en Supabase

```sql
-- Bots
SELECT * FROM bots;

-- Contactos
SELECT * FROM contacts;

-- Chats
SELECT * FROM chats;

-- Mensajes
SELECT * FROM messages ORDER BY timestamp DESC LIMIT 20;

-- Eventos de webhook
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;

-- Estadísticas
SELECT * FROM bot_statistics;

-- Conversaciones recientes
SELECT * FROM recent_conversations LIMIT 10;
```

### 3. Verificar Endpoints de la API

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:4000/health"

# Bots
Invoke-RestMethod -Uri "http://localhost:4000/api/bots"

# Estadísticas
Invoke-RestMethod -Uri "http://localhost:4000/api/dashboard/stats"

# Conversaciones recientes
Invoke-RestMethod -Uri "http://localhost:4000/api/chats/recent?limit=10"
```

## 🎯 Flujo Completo de Datos

```
1. Usuario envía mensaje en WhatsApp
   ↓
2. WAHA detecta el mensaje
   ↓
3. WAHA envía webhook a Express (http://express:4000/webhooks/waha)
   ↓
4. Express procesa el evento:
   - Crea/actualiza bot
   - Crea/actualiza contacto
   - Crea/actualiza chat
   - Guarda mensaje
   ↓
5. Todo se guarda en Supabase
   ↓
6. Puedes consultar vía API o directamente en Supabase
```

## 📊 Consultas Útiles para el Dashboard

### Mensajes por hora (últimas 24 horas)

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/dashboard/messages-by-hour?hours=24"
```

### Top 10 contactos más activos

```powershell
$botId = "UUID-DE-TU-BOT"  # Obtener de /api/bots
Invoke-RestMethod -Uri "http://localhost:4000/api/dashboard/top-contacts?botId=$botId&limit=10"
```

### Buscar mensajes

```powershell
$botId = "UUID-DE-TU-BOT"
Invoke-RestMethod -Uri "http://localhost:4000/api/messages/search?botId=$botId&query=hola"
```

### Buscar contactos

```powershell
$botId = "UUID-DE-TU-BOT"
Invoke-RestMethod -Uri "http://localhost:4000/api/contacts/search?botId=$botId&query=juan"
```

## ⚠️ Troubleshooting

### Los mensajes no se guardan

1. **Verificar que los webhooks están configurados:**
```powershell
docker-compose logs waha | Select-String "webhook"
```

2. **Verificar logs de Express:**
```powershell
docker-compose logs express -f
```

3. **Probar webhook manualmente:**
```powershell
$testEvent = @{
    event = "message"
    session = "bot-principal"
    payload = @{
        id = "test123"
        from = "5491112345678@c.us"
        to = "5491187654321@c.us"
        body = "Test message"
        fromMe = $false
        timestamp = [int](Get-Date -UFormat %s)
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4000/webhooks/waha" -Method POST -Body $testEvent -ContentType "application/json"
```

### Error de conexión a Supabase

1. Verifica las credenciales en `.env`
2. Asegúrate de usar `SUPABASE_SERVICE_ROLE_KEY` (no `ANON_KEY`)
3. Verifica que la migración se ejecutó correctamente

### Los contenedores no inician

```powershell
# Ver logs detallados
docker-compose logs

# Reconstruir desde cero
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🎉 ¡Listo!

Una vez completados estos pasos:

✅ WAHA está corriendo y conectado
✅ Express está corriendo y conectado a Supabase
✅ Los webhooks están configurados
✅ Los mensajes se guardan automáticamente
✅ Puedes consultar todo vía API o Supabase

## 📱 Próximos Pasos Sugeridos

1. **Crear un Dashboard Web** con React/Next.js
2. **Agregar Autenticación** para proteger los endpoints
3. **Implementar Respuestas Automáticas** (chatbot)
4. **Agregar Notificaciones** en tiempo real con WebSockets
5. **Exportar Datos** a CSV/PDF para reportes

---

**¿Necesitas ayuda?** Revisa los logs con `docker-compose logs -f`
