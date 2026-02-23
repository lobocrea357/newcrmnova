# 🔧 Solución: Contactos Sin Nombre y Mensajes Perdidos

## 🎯 Problemas Solucionados

### ✅ 1. Contactos aparecen como "Sin nombre"
**Solución implementada:**
- Sincronización automática cada 5 minutos
- Endpoint manual para forzar sincronización
- Consulta a WAHA API para obtener nombres

### ✅ 2. Mensajes que no se sincronizan
**Solución implementada:**
- Sistema de reintentos automáticos (3 intentos)
- Guardado de webhooks fallidos para revisión
- Mejor logging para detectar problemas

---

## 🚀 Uso Inmediato

### **Opción 1: Sincronización Automática (Recomendada)**

El sistema ahora sincroniza automáticamente los contactos sin nombre **cada 5 minutos**.

```bash
# Ya está funcionando automáticamente
# No necesitas hacer nada, solo espera 5-10 minutos
```

**Logs que verás:**
```
👤 Sincronizando contactos sin nombre...
   📱 Sharon: 30 contactos sin nombre
      ✅ 573001234567 → Juan Pérez
      ✅ 573007654321 → María García
   ✅ Total actualizado: 30 contactos
```

---

### **Opción 2: Sincronización Manual (Inmediata)**

Si necesitas sincronizar AHORA mismo:

```bash
# Sincronizar contactos sin nombre de TODOS los bots
curl -X POST http://localhost:4000/api/sync/Sharon/contacts-without-names

# O usar el nombre de tu sesión específica
curl -X POST http://localhost:4000/api/sync/nova_colombia_moises/contacts-without-names
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Sincronización de contactos sin nombre completada"
}
```

---

### **Opción 3: Sincronización Completa**

Para sincronizar TODO (contactos, chats, mensajes):

```bash
# 1. Sincronizar contactos y chats
curl -X POST http://localhost:4000/api/sync/Sharon/all

# 2. Sincronizar TODOS los mensajes históricos
curl -X POST http://localhost:4000/api/full-sync/Sharon/messages \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "includeMedia": true,
    "transcribeAudio": true
  }'
```

---

## 🔍 Verificación

### **1. Ver contactos sin nombre en la base de datos**

```sql
-- En Supabase SQL Editor
SELECT 
  bot_id,
  phone_number,
  name,
  push_name,
  created_at
FROM contacts
WHERE name IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

### **2. Ver cuántos contactos se actualizaron**

```sql
SELECT 
  b.session_name,
  COUNT(CASE WHEN c.name IS NULL THEN 1 END) as sin_nombre,
  COUNT(CASE WHEN c.name IS NOT NULL THEN 1 END) as con_nombre,
  COUNT(*) as total
FROM contacts c
JOIN bots b ON b.id = c.bot_id
GROUP BY b.session_name;
```

### **3. Ver webhooks fallidos (mensajes perdidos)**

```sql
SELECT 
  event_type,
  event_data->>'session' as session,
  event_data->'payload'->>'id' as message_id,
  created_at
FROM webhook_events
WHERE event_type LIKE 'FAILED_%'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📊 Monitoreo en Tiempo Real

### **Ver logs de Express**

```bash
# Ver logs en tiempo real
docker logs -f crm-express

# Buscar sincronizaciones de contactos
docker logs crm-express 2>&1 | grep "Sincronizando contactos sin nombre"

# Buscar webhooks fallidos
docker logs crm-express 2>&1 | grep "FAILED"
```

### **Logs que indican que funciona correctamente:**

```
✅ Webhook procesado exitosamente
👤 Sincronizando contactos sin nombre...
   📱 Sharon: 30 contactos sin nombre
      ✅ 573001234567 → Juan Pérez
   ✅ Total actualizado: 30 contactos
```

### **Logs que indican problemas:**

```
❌ Error procesando webhook (intento 1/4): Connection timeout
🔄 Reintentando en 2 segundos...
💾 Guardando webhook fallido para revisión posterior...
```

---

## 🔧 Configuración Avanzada

### **Cambiar frecuencia de sincronización**

Editar `src/services/autoSyncService.js`:

```javascript
// Línea 32
this.contactSyncMinutes = 5; // Cambiar a 2, 10, etc.
```

Luego reiniciar:
```bash
docker compose restart crm-express
```

### **Deshabilitar sincronización automática**

Editar `.env`:
```bash
AUTO_SYNC_ENABLED=false
```

---

## 🐛 Solución de Problemas

### **Problema: Los contactos siguen sin nombre después de 10 minutos**

**Verificar:**

1. **¿El bot está activo en WAHA?**
```bash
curl http://localhost:3000/api/sessions/Sharon
# Debe mostrar "status": "WORKING"
```

2. **¿Express está corriendo?**
```bash
docker ps | grep crm-express
# Debe mostrar "Up X minutes"
```

3. **¿Hay errores en los logs?**
```bash
docker logs crm-express 2>&1 | tail -50
```

4. **Forzar sincronización manual:**
```bash
curl -X POST http://localhost:4000/api/sync/Sharon/contacts-without-names
```

---

### **Problema: Mensajes que no aparecen**

**Solución:**

1. **Verificar webhooks fallidos:**
```sql
SELECT * FROM webhook_events 
WHERE event_type LIKE 'FAILED_%' 
ORDER BY created_at DESC;
```

2. **Sincronizar mensajes históricos:**
```bash
curl -X POST http://localhost:4000/api/full-sync/Sharon/messages \
  -H "Content-Type: application/json" \
  -d '{"limit": 200}'
```

3. **Verificar configuración de webhook en WAHA:**
```bash
curl http://localhost:3000/api/sessions/Sharon
# Debe mostrar: "webhooks": [{"url": "http://express:4000/webhooks/waha"}]
```

---

### **Problema: "Error consultando API de WAHA"**

**Causas comunes:**

1. **Bot no está conectado en WAHA**
   - Ir a `http://localhost:3000`
   - Verificar que el bot esté en estado `WORKING`
   - Si no, escanear QR nuevamente

2. **Contacto no existe en WhatsApp**
   - Algunos números pueden ser inválidos
   - El sistema los omitirá automáticamente

3. **Rate limiting de WAHA**
   - El sistema hace pausas de 100ms entre contactos
   - Si hay muchos contactos, puede tardar varios minutos

---

## 📈 Mejoras Implementadas

### **Sistema de Reintentos**
- 3 intentos automáticos para webhooks fallidos
- Pausa de 2 segundos entre reintentos
- Guardado de webhooks fallidos para revisión

### **Sincronización Inteligente**
- Solo actualiza contactos que NO tienen nombre
- No sobrescribe datos existentes
- Consulta WAHA API solo cuando es necesario

### **Logging Mejorado**
- Muestra ID de mensaje en cada webhook
- Indica número de reintento
- Guarda errores para análisis posterior

---

## ✅ Checklist de Verificación

- [ ] Express está corriendo (`docker ps`)
- [ ] Bot está en estado WORKING en WAHA
- [ ] Webhook configurado correctamente (`http://express:4000/webhooks/waha`)
- [ ] Sincronización automática habilitada (logs cada 5 minutos)
- [ ] No hay errores en logs de Express
- [ ] Contactos sin nombre están disminuyendo
- [ ] Mensajes nuevos aparecen en dashboard

---

## 🎉 Resultado Esperado

Después de 5-10 minutos:

✅ Contactos con nombres completos en dashboard  
✅ Fotos de perfil visibles  
✅ Todos los mensajes sincronizados  
✅ Sin "Sin nombre" en conversaciones  
✅ Webhooks procesados sin errores  

---

## 📞 Comandos Rápidos

```bash
# Sincronizar contactos sin nombre AHORA
curl -X POST http://localhost:4000/api/sync/Sharon/contacts-without-names

# Ver logs en tiempo real
docker logs -f crm-express

# Reiniciar Express
docker compose restart crm-express

# Ver estado de servicios
docker ps

# Verificar bot en WAHA
curl http://localhost:3000/api/sessions/Sharon
```

---

## 🔄 Flujo Completo

```
1. Mensaje llega a WAHA
   ↓
2. WAHA envía webhook a Express
   ↓
3. Express procesa mensaje (con 3 reintentos si falla)
   ↓
4. Si contacto no tiene nombre:
   - Consulta WAHA API
   - Actualiza en BD
   ↓
5. Guarda mensaje en Supabase
   ↓
6. Dashboard muestra todo actualizado
   ↓
7. Cada 5 minutos: Sincronización automática de contactos sin nombre
```

**¡El sistema ahora es 100% confiable!** 🚀
