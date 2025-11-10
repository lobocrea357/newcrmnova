# 🔧 Solución: Mensajes Salientes No Se Guardaban

## 🔍 Problema Identificado

Los mensajes salientes (`fromMe: true`) no se estaban guardando en la base de datos.

### Diagnóstico Realizado

1. **Ejecutamos `debug-messages-fixed.sql`** y encontramos:
   - ✅ Mensajes entrantes: 8 mensajes
   - ❌ Mensajes salientes: 0 mensajes

2. **Revisamos los logs de Express** y encontramos:
   ```
   📨 Procesando mensaje [message.any]: {
     fromMe: true,  ← Evento recibido ✅
     to: undefined  ← Campo 'to' undefined ❌
   }
   
   Error: null value in column "phone_number" of relation "contacts" 
   violates not-null constraint
   ```

## 🎯 Causa Raíz

En `src/services/webhookService.js`, la lógica para extraer el número de contacto era:

```javascript
// ❌ CÓDIGO ANTERIOR (INCORRECTO)
const contactNumber = payload.fromMe ? toNumber : fromNumber;
```

**Problema:** Para mensajes salientes, `payload.to` es `undefined`, entonces `toNumber` es `undefined`, y no se puede crear el contacto.

## ✅ Solución Implementada

Corregimos la lógica en `webhookService.js`:

```javascript
// ✅ CÓDIGO NUEVO (CORRECTO)
// Para mensajes salientes (fromMe=true), el contacto es 'from'
// Para mensajes entrantes (fromMe=false), el contacto también es 'from'
const contactNumber = fromNumber;

// Validar que tengamos un número de contacto
if (!contactNumber) {
  console.error('❌ No se pudo extraer número de contacto del mensaje');
  throw new Error('No contact number found in message');
}
```

**Explicación:**
- En WhatsApp, `from` siempre es el número del contacto (la otra persona)
- Para mensajes entrantes: `from` = contacto que envía
- Para mensajes salientes: `from` = contacto que recibe
- El campo `to` no siempre está presente en los webhooks de WAHA

## 🔄 Cambios Realizados

### 1. Configuración de Webhooks en WAHA
```bash
# Ejecutado: configure-waha-webhooks.ps1
✅ Webhooks configurados con evento 'message.any'
✅ Sesión reiniciada
```

### 2. Código Actualizado
**Archivo:** `src/services/webhookService.js`
- Líneas 156-180: Lógica de extracción de contacto corregida
- Agregada validación de `contactNumber`
- Simplificada lógica de `chatId`

### 3. Servicio Reconstruido
```bash
docker-compose up -d --build express
```

## 🧪 Pruebas a Realizar

### 1. Enviar Mensaje de Prueba
- Envía un mensaje desde WhatsApp al bot
- Responde desde WhatsApp

### 2. Verificar en Logs
```bash
docker-compose logs -f express
```

Deberías ver:
```
📨 Procesando mensaje [message.any]: { fromMe: false, ... }
✅ Mensaje guardado: ...

📨 Procesando mensaje [message.any]: { fromMe: true, ... }
✅ Mensaje guardado: ...
```

### 3. Verificar en Base de Datos
Ejecuta `debug-messages-fixed.sql` en Supabase:

```sql
-- Contar mensajes por tipo
SELECT 
    from_me,
    CASE WHEN from_me THEN 'Salientes' ELSE 'Entrantes' END as tipo,
    COUNT(*) as total
FROM messages
GROUP BY from_me;
```

**Resultado esperado:**
| from_me | tipo       | total |
|---------|------------|-------|
| false   | Entrantes  | X     |
| true    | Salientes  | Y     | ← **NUEVO** ✅

### 4. Verificar en Dashboard
Abre http://localhost:3001 y verifica:
- Mensajes en **gris** = Entrantes
- Mensajes en **verde** = Salientes ← **NUEVO** ✅

## 📋 Checklist de Verificación

- [x] Webhooks configurados con `message.any`
- [x] Código corregido en `webhookService.js`
- [x] Servicio Express reconstruido
- [ ] Mensaje de prueba enviado
- [ ] Logs verificados sin errores
- [ ] Base de datos muestra mensajes salientes
- [ ] Dashboard muestra mensajes salientes en verde

## 🎉 Resultado Esperado

Después de estos cambios:

1. **Mensajes entrantes** (del contacto):
   - ✅ Se guardan con `from_me = false`
   - ✅ Aparecen en gris en el dashboard

2. **Mensajes salientes** (del bot):
   - ✅ Se guardan con `from_me = true`
   - ✅ Aparecen en verde en el dashboard

3. **Multimedia**:
   - ✅ Imágenes, videos, audios se guardan en `media_files`
   - ✅ Audios se transcriben automáticamente (si OpenAI está configurado)

## 🐛 Si Aún Hay Problemas

1. **Verifica que Express se reconstruyó:**
   ```bash
   docker-compose ps
   # Debe mostrar "Up X minutes" para express
   ```

2. **Verifica los logs en tiempo real:**
   ```bash
   docker-compose logs -f express | Select-String "📨"
   ```

3. **Reinicia todos los servicios:**
   ```bash
   docker-compose restart
   ```

4. **Ejecuta el script de prueba:**
   ```bash
   powershell -ExecutionPolicy Bypass -File test-system.ps1
   ```

## 📞 Resumen

**Problema:** Mensajes salientes no se guardaban por campo `to` undefined.

**Solución:** Usar siempre `from` como número de contacto, ya que representa al contacto en ambos casos (entrantes y salientes).

**Estado:** ✅ Corregido y listo para probar.
