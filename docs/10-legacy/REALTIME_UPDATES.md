# ⚡ Real-Time Updates - Mensajes en Vivo

## ✅ Implementación

### 1. **Supabase Realtime**

Se implementó suscripción en tiempo real usando **Supabase Realtime** para escuchar cambios en la tabla `messages`.

### 2. **ChatView Component**

**Archivo:** `dashboard/src/components/ChatView.js`

**Funcionalidad:**
- ✅ Se suscribe a cambios en mensajes del chat actual
- ✅ Detecta nuevos mensajes (INSERT)
- ✅ Detecta actualizaciones (UPDATE) - útil para transcripciones
- ✅ Detecta eliminaciones (DELETE)
- ✅ Auto-scroll al final cuando llegan mensajes nuevos
- ✅ Se desuscribe automáticamente al cerrar el chat

**Código:**
```javascript
useEffect(() => {
  loadConversation()
  
  // Suscribirse a cambios en mensajes de este chat
  const channel = supabase
    .channel(`chat-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        handleMessageChange(payload)
      }
    )
    .subscribe()

  // Cleanup: desuscribirse al desmontar
  return () => {
    supabase.removeChannel(channel)
  }
}, [chatId])
```

### 3. **Eventos Detectados**

#### INSERT (Nuevo Mensaje)
```javascript
{
  eventType: 'INSERT',
  new: { /* datos del nuevo mensaje */ },
  old: null
}
```
**Acción:** Recarga toda la conversación para obtener `media_files`

#### UPDATE (Mensaje Actualizado)
```javascript
{
  eventType: 'UPDATE',
  new: { /* datos actualizados */ },
  old: { /* datos anteriores */ }
}
```
**Acción:** Recarga la conversación (útil cuando se agrega transcripción)

#### DELETE (Mensaje Eliminado)
```javascript
{
  eventType: 'DELETE',
  new: null,
  old: { /* datos del mensaje eliminado */ }
}
```
**Acción:** Recarga la conversación

## 🎯 Flujo Completo

### Mensaje Entrante
```
1. WhatsApp → WAHA → Webhook → Express
2. Express guarda mensaje en Supabase
3. Supabase Realtime notifica al dashboard
4. Dashboard recarga mensajes automáticamente
5. Nuevo mensaje aparece en pantalla
6. Auto-scroll al final
```

### Mensaje Saliente
```
1. WhatsApp (enviado desde el teléfono)
2. WAHA detecta mensaje saliente
3. Webhook → Express → Supabase
4. Realtime notifica al dashboard
5. Mensaje aparece automáticamente
```

### Transcripción de Audio
```
1. Audio llega → Se guarda mensaje sin transcripción
2. Dashboard muestra "Transcribiendo audio..."
3. OpenAI procesa audio (5-10 segundos)
4. Express actualiza mensaje con transcripción
5. Realtime notifica UPDATE
6. Dashboard recarga y muestra transcripción
```

## 🧪 Cómo Probar

### 1. Habilitar Realtime en Supabase

**Ejecuta en Supabase SQL Editor:** `enable-realtime.sql`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 2. Abrir Dashboard

```
http://localhost:3001
```

### 3. Abrir Consola del Navegador (F12)

Deberías ver:
```
🔔 Suscribiéndose a mensajes del chat: 917ae1e1-8061-4b6b-bc85-29f5c3d3bd82
```

### 4. Enviar Mensaje desde WhatsApp

**Desde otro teléfono o desde el mismo:**
- Envía un mensaje de texto
- Envía una imagen
- Envía un audio

### 5. Observar en Dashboard

**Sin recargar la página (F5):**
- ✅ El mensaje debe aparecer automáticamente
- ✅ Auto-scroll al final
- ✅ En consola verás:
  ```
  📨 Cambio detectado en mensajes: { eventType: 'INSERT', ... }
  ✨ Nuevo mensaje detectado, recargando...
  ```

### 6. Probar Transcripción

1. Envía un audio
2. Verás primero: "Transcribiendo audio..."
3. Espera 5-10 segundos
4. **Sin recargar**, verás:
   ```
   📨 Cambio detectado en mensajes: { eventType: 'UPDATE', ... }
   🔄 Mensaje actualizado, recargando...
   ```
5. La transcripción aparece automáticamente

## 🔍 Debugging

### Verificar Suscripción

**En consola del navegador:**
```javascript
// Deberías ver logs de suscripción
🔔 Suscribiéndose a mensajes del chat: ...
```

### Verificar Eventos

**Cuando llega un mensaje:**
```javascript
📨 Cambio detectado en mensajes: {
  eventType: 'INSERT',
  new: { id: '...', body: '...', ... }
}
✨ Nuevo mensaje detectado, recargando...
```

### Si No Funciona

1. **Verificar que Realtime esté habilitado:**
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename = 'messages';
   ```

2. **Verificar en Supabase Dashboard:**
   - Database → Replication
   - Debe estar habilitado para la tabla `messages`

3. **Verificar logs del navegador:**
   - ¿Hay errores de WebSocket?
   - ¿Se está suscribiendo correctamente?

4. **Verificar que el chat esté abierto:**
   - Solo funciona cuando estás viendo el chat
   - Se desuscribe al cerrar el chat

## ⚙️ Configuración de Supabase

### Habilitar Realtime (Una vez)

**Opción 1: SQL Editor**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**Opción 2: Supabase Dashboard**
1. Ve a Database → Replication
2. Busca la tabla `messages`
3. Habilita "Realtime"
4. Guarda cambios

### Verificar Estado
```sql
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'messages';
```

## 📊 Rendimiento

### Optimizaciones Implementadas

1. **Filtro por Chat:**
   - Solo escucha mensajes del chat actual
   - No escucha todos los mensajes de la BD

2. **Cleanup Automático:**
   - Se desuscribe al cerrar el chat
   - Evita memory leaks

3. **Loading State:**
   - Muestra loading solo en la primera carga
   - Updates en tiempo real no muestran loading

### Consideraciones

- **Conexión WebSocket:** Supabase usa WebSocket para Realtime
- **Límites:** Plan gratuito tiene límites de conexiones simultáneas
- **Latencia:** Típicamente < 100ms para eventos locales

## 🎨 UX Mejorada

### Antes
- ❌ Necesitabas recargar (F5) para ver nuevos mensajes
- ❌ No sabías cuándo llegaban mensajes
- ❌ Transcripciones no aparecían automáticamente

### Ahora
- ✅ Mensajes aparecen instantáneamente
- ✅ Auto-scroll al final
- ✅ Transcripciones se actualizan solas
- ✅ Experiencia similar a WhatsApp Web

## 🚀 Mejoras Futuras

- [ ] Indicador de "escribiendo..." (typing indicator)
- [ ] Notificaciones de escritorio cuando llegan mensajes
- [ ] Badge con contador de mensajes no leídos
- [ ] Sonido al recibir mensaje
- [ ] Vibración en móvil
- [ ] Marcar mensajes como leídos automáticamente
- [ ] Sincronización de estado de lectura
- [ ] Optimistic updates (mostrar mensaje antes de confirmar)

## 📝 Notas Importantes

1. **Requiere Supabase Realtime habilitado** en la tabla `messages`
2. **Solo funciona cuando el chat está abierto** (por diseño)
3. **Se desuscribe automáticamente** al cerrar el chat
4. **Recarga toda la conversación** en cada cambio (para obtener `media_files`)
5. **Auto-scroll** solo si ya estabas al final (UX mejorada)

---

**Sistema de mensajería en tiempo real completamente funcional** ⚡
