# 🚀 Guía Rápida de Instalación y Uso

## Opción A: Docker Compose (Más Fácil) 🐳

### Paso 1: Configurar Base de Datos en Supabase

1. Ve a [Supabase](https://supabase.com) y abre tu proyecto
2. Ve a **SQL Editor** en el menú lateral
3. Copia todo el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor y haz clic en **Run**
5. Verifica que aparezca el mensaje de éxito

### Paso 2: Levantar Todo con Docker Compose

```powershell
# Opción 1: Usar el script de inicio
.\start.ps1

# Opción 2: Comando directo
docker-compose up -d
```

**¡Listo!** 🎉 Todo está corriendo:
- WAHA en http://localhost:3000
- Express API en http://localhost:4000

📖 **Ver guía completa de Docker:** [DOCKER-GUIDE.md](./DOCKER-GUIDE.md)

---

## Opción B: Instalación Manual

### Paso 1: Configurar Base de Datos en Supabase

1. Ve a [Supabase](https://supabase.com) y abre tu proyecto
2. Ve a **SQL Editor** en el menú lateral
3. Copia todo el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor y haz clic en **Run**
5. Verifica que aparezca el mensaje de éxito

## Paso 2: Instalar Dependencias de Node.js

```powershell
npm install
```

## Paso 3: Reiniciar WAHA con la nueva configuración

El archivo `.env` ya está configurado con los webhooks. Reinicia el contenedor:

```powershell
# Detener el contenedor actual
docker stop waha
docker rm waha

# Iniciar con la nueva configuración
docker run -d --name waha -p 3000:3000 --env-file .env -v "${PWD}\.waha:/app/.waha" devlikeapro/waha
```

## Paso 4: Iniciar el Servidor Express

```powershell
npm start
```

O en modo desarrollo (con auto-reload):

```powershell
npm run dev
```

Verás algo como:

```
🚀 Servidor corriendo en http://localhost:4000
📊 Dashboard API: http://localhost:4000/api/dashboard/stats
🔗 Webhook URL: http://localhost:4000/webhooks/waha

⚡ Configuración:
   - WAHA URL: http://localhost:3000
   - Supabase URL: https://cfklyrpftknzhpkzqeme.supabase.co

✅ Listo para recibir webhooks de WAHA
```

## Paso 5: Crear una Sesión de WhatsApp

### Opción A: Usando el Dashboard de WAHA

1. Abre http://localhost:3000/dashboard
2. Usuario: `admin`
3. Contraseña: `d7e6ad050069420ba581fb2c42f164a6`
4. Crea una nueva sesión
5. Escanea el código QR con WhatsApp

### Opción B: Usando la API

```powershell
# Crear sesión
Invoke-RestMethod -Uri "http://localhost:4000/api/bots/mi-bot/start" -Method POST -ContentType "application/json"

# Obtener QR (se abrirá en el navegador)
Start-Process "http://localhost:4000/api/bots/mi-bot/qr"
```

## Paso 6: Verificar que Todo Funciona

### Ver estadísticas del dashboard

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/dashboard/stats"
```

### Ver bots activos

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/bots"
```

### Sincronizar bots con WAHA

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/bots/sync" -Method POST
```

## Paso 7: Enviar un Mensaje de Prueba

```powershell
$body = @{
    session = "mi-bot"
    chatId = "5491112345678@c.us"  # Reemplaza con un número real
    text = "¡Hola! Este es un mensaje de prueba desde el CRM"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/messages/send" -Method POST -Body $body -ContentType "application/json"
```

## 📊 Endpoints Útiles para el Dashboard

### Estadísticas Generales
```
GET http://localhost:4000/api/dashboard/stats
```

### Conversaciones Recientes
```
GET http://localhost:4000/api/chats/recent?limit=50
```

### Mensajes por Hora (últimas 24 horas)
```
GET http://localhost:4000/api/dashboard/messages-by-hour?hours=24
```

### Top Contactos Más Activos
```
GET http://localhost:4000/api/dashboard/top-contacts?botId=UUID&limit=10
```

### Actividad Reciente
```
GET http://localhost:4000/api/dashboard/activity?limit=20
```

### Buscar Mensajes
```
GET http://localhost:4000/api/messages/search?botId=UUID&query=texto
```

### Buscar Contactos
```
GET http://localhost:4000/api/contacts/search?botId=UUID&query=nombre
```

## 🔍 Verificar que los Webhooks Funcionan

1. Envía un mensaje a tu número de WhatsApp conectado
2. Verifica en los logs del servidor Express que se recibió el webhook
3. Consulta la base de datos en Supabase para ver el mensaje guardado

```powershell
# Ver logs del servidor Express (si usas npm run dev)
# Los logs aparecerán en la consola

# Ver logs de WAHA
docker logs waha --tail 50
```

## 🗄️ Consultas SQL Útiles en Supabase

### Ver todos los bots
```sql
SELECT * FROM bots ORDER BY created_at DESC;
```

### Ver mensajes recientes
```sql
SELECT * FROM messages_detailed ORDER BY timestamp DESC LIMIT 50;
```

### Ver conversaciones recientes
```sql
SELECT * FROM recent_conversations LIMIT 20;
```

### Ver estadísticas por bot
```sql
SELECT * FROM bot_statistics;
```

### Contar mensajes por tipo
```sql
SELECT type, COUNT(*) as total 
FROM messages 
GROUP BY type 
ORDER BY total DESC;
```

## ⚠️ Solución de Problemas

### El webhook no recibe eventos

1. Verifica que WAHA esté corriendo: `docker ps`
2. Verifica los logs de WAHA: `docker logs waha`
3. Verifica que el servidor Express esté corriendo en el puerto 4000
4. Prueba el webhook manualmente:

```powershell
$testEvent = @{
    event = "message"
    session = "test"
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

1. Verifica que las credenciales en `.env` sean correctas
2. Asegúrate de usar `SUPABASE_SERVICE_ROLE_KEY` no `SUPABASE_ANON_KEY`
3. Verifica que las tablas existan en Supabase

### WAHA no se conecta

1. Reinicia el contenedor:
```powershell
docker restart waha
```

2. Si persiste, elimina y recrea:
```powershell
docker stop waha
docker rm waha
docker run -d --name waha -p 3000:3000 --env-file .env -v "${PWD}\.waha:/app/.waha" devlikeapro/waha
```

## 📱 Próximos Pasos

1. **Crear un Dashboard Web**: Usa React, Vue o Next.js para crear una interfaz visual
2. **Agregar Autenticación**: Protege los endpoints con JWT o similar
3. **Implementar Respuestas Automáticas**: Crea lógica de chatbot
4. **Agregar Notificaciones**: Usa WebSockets para notificaciones en tiempo real
5. **Exportar Datos**: Crea endpoints para exportar conversaciones a CSV/PDF

## 🎯 Estructura del Proyecto

```
crmnovabots/
├── .env                      # Configuración (WAHA + Supabase)
├── package.json              # Dependencias
├── supabase-schema.sql       # Schema de la base de datos
├── README.md                 # Documentación completa
├── GUIA-RAPIDA.md           # Esta guía
└── src/
    ├── index.js              # Servidor Express principal
    ├── config/
    │   ├── supabase.js       # Cliente de Supabase
    │   └── waha.js           # Cliente de WAHA
    ├── services/
    │   ├── botService.js     # Lógica de bots
    │   ├── contactService.js # Lógica de contactos
    │   ├── chatService.js    # Lógica de chats
    │   ├── messageService.js # Lógica de mensajes
    │   └── webhookService.js # Procesamiento de webhooks
    └── routes/
        ├── webhooks.js       # Endpoint para webhooks
        ├── bots.js           # Endpoints de bots
        ├── messages.js       # Endpoints de mensajes
        ├── contacts.js       # Endpoints de contactos
        ├── chats.js          # Endpoints de chats
        └── dashboard.js      # Endpoints del dashboard
```

## 💡 Tips

- Usa `npm run dev` durante el desarrollo para auto-reload
- Revisa los logs regularmente para detectar errores
- Haz backups regulares de tu base de datos en Supabase
- Usa variables de entorno para configuración sensible
- Documenta cualquier cambio que hagas al código

¡Listo! Ahora tienes un CRM completo para WhatsApp funcionando. 🎉
