# 🔄 Guía de Sincronización de Datos

## ⚠️ IMPORTANTE - Lee esto primero

Esta función de sincronización es **100% SEGURA** y:
- ✅ **NO duplica** contactos, chats ni mensajes
- ✅ **Solo actualiza** campos que están NULL o vacíos
- ✅ **Respeta** los datos existentes
- ✅ **Es idempotente** (puedes ejecutarla múltiples veces sin problemas)
- ✅ **No modifica** mensajes existentes

---

## 🎯 ¿Para qué sirve?

Esta sincronización te permite **"reparar"** los datos de bots que fueron creados ANTES de implementar las correcciones. Específicamente:

### Campos que se actualizan en CONTACTOS:
- `name` ← Si está NULL, obtiene el nombre desde WAHA
- `push_name` ← Si está NULL, obtiene el nombre desde WAHA
- `profile_picture_url` ← Si está NULL, obtiene la foto de perfil desde WAHA
- `is_business` ← Actualiza si es cuenta de negocio
- `is_enterprise` ← Actualiza si es cuenta empresarial

### Campos que se actualizan en CHATS:
- `name` ← Si está NULL, obtiene el nombre del chat
- `contact_name` ← Si está NULL o desactualizado
- `chat_id` ← Si está NULL, lo llena con el formato correcto
- `contact_id` ← Si está NULL, lo vincula con el contacto correcto
- `last_message` ← Actualiza con el último mensaje desde WAHA
- `last_message_at` ← Timestamp del último mensaje
- `last_message_time` ← Timestamp del último mensaje
- `archived`, `pinned`, `muted` ← Sincroniza estados desde WAHA

### Campos que se actualizan en BOT:
- `phone_number` ← Solo si es "pending", lo actualiza con el número real

---

## 📡 Endpoints Disponibles

### 1. Sincronizar Solo Contactos
```bash
POST http://localhost:4000/api/sync/{sessionName}/contacts
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/sync/jose_nova_venezuela_josni/contacts
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización de contactos completada",
  "data": {
    "total": 50,
    "updated": 30,
    "skipped": 18,
    "errors": 2
  }
}
```

---

### 2. Sincronizar Solo Chats
```bash
POST http://localhost:4000/api/sync/{sessionName}/chats
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/sync/jose_nova_venezuela_josni/chats
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización de chats completada",
  "data": {
    "total": 45,
    "updated": 40,
    "skipped": 5,
    "errors": 0
  }
}
```

---

### 3. Sincronización Completa (RECOMENDADO) ⭐
```bash
POST http://localhost:4000/api/sync/{sessionName}/all
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/sync/jose_nova_venezuela_josni/all
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización completa terminada",
  "data": {
    "bot": {
      "updated": true,
      "phoneNumber": "584244252248"
    },
    "contacts": {
      "total": 50,
      "updated": 30,
      "skipped": 18,
      "errors": 2
    },
    "chats": {
      "total": 45,
      "updated": 40,
      "skipped": 5,
      "errors": 0
    }
  }
}
```

---

## 🚀 Cómo usar desde el Frontend

### Opción 1: Con Fetch API

```javascript
async function syncBot(sessionName) {
  try {
    const response = await fetch(`http://localhost:4000/api/sync/${sessionName}/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sincronización completada:', result.data);
      alert(`Bot sincronizado:\n- Contactos: ${result.data.contacts.updated} actualizados\n- Chats: ${result.data.chats.updated} actualizados`);
    } else {
      console.error('❌ Error:', result.error);
      alert('Error en la sincronización');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de red');
  }
}

// Uso:
syncBot('jose_nova_venezuela_josni');
```

---

### Opción 2: Con Axios

```javascript
import axios from 'axios';

async function syncBot(sessionName) {
  try {
    const { data } = await axios.post(
      `http://localhost:4000/api/sync/${sessionName}/all`
    );

    console.log('✅ Sincronización completada:', data.data);
    return data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}
```

---

## 🎨 Ejemplo de Botón en el Frontend

```jsx
// React Component
function BotCard({ bot }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      const response = await fetch(
        `http://localhost:4000/api/sync/${bot.session_name}/all`,
        { method: 'POST' }
      );
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Sincronización completada:\n- ${result.data.contacts.updated} contactos actualizados\n- ${result.data.chats.updated} chats actualizados`);
      }
    } catch (error) {
      alert('❌ Error en la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bot-card">
      <h3>{bot.name}</h3>
      <p>{bot.phone_number}</p>
      
      <button 
        onClick={handleSync}
        disabled={syncing}
        className="sync-button"
      >
        {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar Datos'}
      </button>
    </div>
  );
}
```

---

## 📊 Lo que verás en los Logs

Cuando ejecutes la sincronización, verás logs como estos en la terminal de Express:

```
🔄 Iniciando sincronización de contactos: jose_nova_venezuela_josni
✅ Bot encontrado: Jose Nova Venezuela Josni (d116f9f9-9afa-4841-853a-f12785cad683)
📊 Contactos en BD: 50
📊 Contactos en WAHA: 48

   🔄 Actualizando 584244252248...
      ✅ José Román
   🔄 Actualizando 584125551234...
      ✅ María González
   ⏭️  584126669999 - Ya tiene datos completos
   ...

✅ Sincronización completada:
   Total: 50
   Actualizados: 30
   Omitidos: 18
   Errores: 2
```

---

## ⏱️ Tiempo de Ejecución

- **Contactos**: ~100ms por contacto (con pausa de 100ms entre cada uno)
- **Chats**: ~50ms por chat (con pausa de 50ms entre cada uno)
- **Total**: Para 50 contactos y 45 chats ≈ 7-10 segundos

---

## ❓ Preguntas Frecuentes

### ¿Puedo ejecutar la sincronización múltiples veces?
✅ **Sí**, es completamente seguro. Solo actualiza lo que está NULL.

### ¿Se duplicarán los contactos o mensajes?
❌ **No**, usa los métodos existentes que ya tienen protección contra duplicados.

### ¿Afecta los mensajes existentes?
❌ **No**, los mensajes NO se modifican, solo se consultan para obtener el último mensaje de cada chat.

### ¿Qué pasa si WAHA no responde?
⚠️ La sincronización continúa con los datos disponibles en la BD y reporta los errores.

### ¿Necesito detener el bot?
❌ **No**, la sincronización se puede hacer con el bot activo.

---

## 🔧 Troubleshooting

### Error: "Bot no encontrado"
- Verifica que el `session_name` sea correcto
- Asegúrate de que el bot existe en la tabla `bots`

### Error: "No se pudieron obtener contactos desde WAHA"
- Verifica que WAHA esté corriendo
- Verifica que el bot esté conectado en WAHA
- La sincronización continuará con los datos en BD

### Muchos contactos con "Sin datos disponibles en WAHA"
- Normal para contactos de newsletters o grupos
- WAHA no siempre tiene datos completos de todos los contactos

---

## 📝 Notas Importantes

1. **Primera vez**: Ejecuta `/all` para sincronizar todo
2. **Mantenimiento**: Ejecuta periódicamente (1 vez al día o cuando notes datos faltantes)
3. **Nuevos bots**: No necesitan sincronización, ya reciben datos correctos desde el inicio
4. **Bots viejos**: Requieren sincronización para "reparar" campos NULL

---

## 🎉 Resultado Final

Después de la sincronización, tus bots tendrán:
- ✅ Nombres de contactos completos
- ✅ Fotos de perfil
- ✅ Nombres de chats correctos
- ✅ Últimos mensajes visibles
- ✅ Números de teléfono correctos (en lugar de "pending")
- ✅ Metadatos enriquecidos (is_business, is_enterprise, etc.)

**¡Sin duplicados y sin perder datos! 🎊**
