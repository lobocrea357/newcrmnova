# Solución: Mensajes Salientes Faltantes

## 🎯 Problema

Los mensajes salientes (respuestas del bot) **NO se están guardando** en la base de datos porque WAHA no está enviando webhooks para mensajes con `fromMe = true`.

## 🔧 Solución en 3 Pasos

### Paso 1: Configurar Webhooks de WAHA

Ejecuta el script de configuración automática:

```bash
node src/scripts/configure-webhooks.js configure
```

**Comandos disponibles:**
- `configure [session]` - Configura webhooks para una sesión específica (default: 'default')
- `all` - Configura webhooks para TODAS las sesiones activas
- `check [session]` - Verifica la configuración actual
- `delete [session]` - Elimina webhooks de una sesión

**Ejemplo para configurar todas las sesiones:**
```bash
node src/scripts/configure-webhooks.js all
```

**Lo que hace este script:**
1. Verifica la configuración actual de webhooks
2. Configura el evento `message.any` (captura mensajes entrantes Y salientes)
3. Verifica que la configuración se aplicó correctamente

### Paso 2: Sincronizar Mensajes Históricos

Una vez configurados los webhooks, sincroniza los mensajes salientes que ya existen en WAHA pero no en la BD:

```bash
node sync-messages.js
```

**Lo que hace este script:**
1. Obtiene todos los chats de la base de datos
2. Para cada chat, consulta los mensajes en WAHA
3. Filtra solo mensajes salientes (`fromMe = true`)
4. Guarda en la BD los mensajes que no existen
5. Muestra un resumen de mensajes sincronizados

**Nota:** 
- Este proceso puede tardar varios minutos dependiendo de la cantidad de chats
- Es normal ver errores para chats que ya no existen en WAHA
- El script omitirá automáticamente mensajes que ya están en la BD

### Paso 3: Verificar Funcionamiento

#### 3.1 Enviar Mensaje de Prueba

1. Envía un mensaje desde el bot a cualquier contacto
2. Verifica los logs del servidor Node.js:
   ```
   🔔 Webhook recibido [message.any]:
   FromMe: true
   ```

#### 3.2 Verificar en Base de Datos

Ejecuta esta consulta SQL en Supabase:

```sql
-- Verificar mensajes salientes recientes
SELECT 
  from_me,
  COUNT(*) as total
FROM messages
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY from_me;
```

**Resultado esperado:**
```
| from_me | total |
| ------- | ----- |
| false   | X     |
| true    | Y     | ← Debe aparecer!
```

#### 3.3 Verificar en Dashboard

1. Abre el dashboard
2. Selecciona un bot
3. Abre un chat
4. **Deberías ver mensajes azules a la derecha** (mensajes del bot)

## 📋 Checklist de Verificación

- [ ] Servidor Node.js corriendo (`npm run dev`)
- [ ] Webhooks configurados con `message.any`
- [ ] Mensajes históricos sincronizados
- [ ] Mensaje de prueba enviado y recibido en webhook
- [ ] Mensaje de prueba aparece en BD con `from_me = true`
- [ ] Dashboard muestra mensajes salientes correctamente

## 🔍 Troubleshooting

### Problema: "Error: connect ECONNREFUSED"

**Causa:** WAHA no está corriendo o la URL es incorrecta.

**Solución:**
1. Verifica que WAHA esté corriendo: `http://localhost:3000`
2. Verifica la variable `WAHA_URL` en `.env`

### Problema: "Error: 401 Unauthorized"

**Causa:** API Key incorrecta o faltante.

**Solución:**
1. Verifica que `WAHA_API_KEY` esté en `.env`
2. Verifica que el API Key sea correcto en WAHA

### Problema: Webhooks configurados pero no llegan mensajes

**Causa:** Servidor Node.js no está corriendo o URL incorrecta.

**Solución:**
1. Verifica que el servidor esté corriendo: `npm run dev`
2. Verifica que `WEBHOOK_URL` en `.env` sea accesible desde WAHA
3. Si WAHA está en Docker, usa `host.docker.internal:4000` en lugar de `localhost:4000`

### Problema: Mensajes históricos no se sincronizan

**Causa:** Chat ID incorrecto o permisos insuficientes.

**Solución:**
1. Verifica los logs del script para ver errores específicos
2. Verifica que el bot tenga acceso a los chats en WAHA

## 📝 Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu `.env`:

```env
WAHA_URL=http://localhost:3000
WAHA_API_KEY=tu_api_key_aqui
WEBHOOK_URL=http://localhost:4000/webhooks/waha
```

## 🎉 Resultado Final

Después de completar estos pasos:

✅ **Mensajes nuevos**: Se guardarán automáticamente (entrantes Y salientes)  
✅ **Mensajes históricos**: Estarán sincronizados en la BD  
✅ **Dashboard**: Mostrará conversaciones completas con mensajes del bot  

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor Node.js
2. Ejecuta `node src/scripts/configure-webhooks.js check` para verificar configuración
3. Revisa la sección de Troubleshooting arriba
