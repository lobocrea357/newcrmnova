# 👷 API de Workers

## 📋 Descripción

La API de Workers permite sincronizar trabajadores/agentes desde WAHA (o cualquier otro sistema) a Supabase y asignar bots a workers específicos.

## 🔗 Endpoints

### 1. Sincronizar Workers

**POST** `/api/workers/sync`

Sincroniza una lista de workers a la base de datos.

**Body:**
```json
{
  "workers": [
    {
      "name": "Moisés",
      "email": "moises@example.com",
      "role": "agent",
      "status": "active",
      "phone_number": "+584121234567",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "supervisor",
      "status": "active"
    }
  ]
}
```

**Respuesta:**
```json
{
  "message": "Workers sincronizados",
  "success": true,
  "results": [
    {
      "worker": "Moisés",
      "success": true,
      "data": { ... }
    },
    {
      "worker": "Juan Pérez",
      "success": true,
      "data": { ... }
    }
  ]
}
```

### 2. Asignar Bot a Worker

**POST** `/api/workers/assign-bot`

Asigna un bot específico a un worker.

**Body (opción 1 - por botId):**
```json
{
  "botId": "325d4e63-7336-4514-b244-3c3e116bb961",
  "workerEmail": "moises@example.com"
}
```

**Body (opción 2 - por sessionName):**
```json
{
  "sessionName": "default",
  "workerEmail": "moises@example.com"
}
```

**Respuesta:**
```json
{
  "message": "Bot asignado al worker exitosamente",
  "success": true,
  "data": { ... }
}
```

### 3. Obtener Todos los Workers

**GET** `/api/workers`

Obtiene la lista de todos los workers.

**Respuesta:**
```json
{
  "workers": [
    {
      "id": "uuid",
      "name": "Moisés",
      "email": "moises@example.com",
      "role": "agent",
      "status": "active",
      "phone_number": "+584121234567",
      "created_at": "2025-11-09T...",
      "updated_at": "2025-11-09T..."
    }
  ],
  "total": 1
}
```

### 4. Obtener Worker por Email

**GET** `/api/workers/:email`

Obtiene un worker específico por su email.

**Ejemplo:** `/api/workers/moises@example.com`

**Respuesta:**
```json
{
  "id": "uuid",
  "name": "Moisés",
  "email": "moises@example.com",
  "role": "agent",
  "status": "active",
  "phone_number": "+584121234567",
  "created_at": "2025-11-09T...",
  "updated_at": "2025-11-09T..."
}
```

## 🚀 Ejemplos de Uso

### Ejemplo 1: Sincronizar Workers desde WAHA

Si tienes workers configurados en WAHA, puedes sincronizarlos así:

```bash
curl -X POST http://localhost:4000/api/workers/sync \
  -H "Content-Type: application/json" \
  -d '{
    "workers": [
      {
        "name": "Moisés",
        "email": "moises@example.com",
        "role": "agent",
        "status": "active"
      }
    ]
  }'
```

### Ejemplo 2: Asignar Bot "default" a Moisés

```bash
curl -X POST http://localhost:4000/api/workers/assign-bot \
  -H "Content-Type: application/json" \
  -d '{
    "sessionName": "default",
    "workerEmail": "moises@example.com"
  }'
```

### Ejemplo 3: Ver Todos los Workers

```bash
curl http://localhost:4000/api/workers
```

## 🔄 Flujo de Trabajo Recomendado

### 1. Primera Configuración

```bash
# 1. Sincronizar workers
POST /api/workers/sync
{
  "workers": [
    { "name": "Moisés", "email": "moises@example.com", "role": "agent", "status": "active" },
    { "name": "Juan", "email": "juan@example.com", "role": "agent", "status": "active" }
  ]
}

# 2. Asignar bots a workers
POST /api/workers/assign-bot
{
  "sessionName": "bot1",
  "workerEmail": "moises@example.com"
}

POST /api/workers/assign-bot
{
  "sessionName": "bot2",
  "workerEmail": "juan@example.com"
}
```

### 2. Verificar en el Dashboard

Después de sincronizar y asignar, abre el dashboard:
- URL: http://localhost:3001
- Verás la estructura: Workers → Bots → Conversaciones

## 📝 Integración con WAHA

Si quieres leer los workers directamente desde WAHA, puedes:

### Opción A: Usar la API de Servidores de WAHA

Si WAHA tiene una API para listar servidores/workers:

```javascript
// En tu código
const wahaWorkers = await fetch('http://localhost:3000/api/servers')
  .then(res => res.json())

// Transformar y sincronizar
const workers = wahaWorkers.map(w => ({
  name: w.name,
  email: w.email || `${w.name}@worker.local`,
  role: 'agent',
  status: w.status
}))

await fetch('http://localhost:4000/api/workers/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workers })
})
```

### Opción B: Configuración Manual

Crea un archivo `workers-config.json`:

```json
{
  "workers": [
    {
      "name": "Moisés",
      "email": "moises@example.com",
      "role": "agent",
      "status": "active"
    }
  ]
}
```

Luego sincroniza:

```bash
curl -X POST http://localhost:4000/api/workers/sync \
  -H "Content-Type: application/json" \
  -d @workers-config.json
```

## 🔐 Seguridad

**Importante:** En producción, deberías:

1. Agregar autenticación a estos endpoints
2. Validar que solo usuarios autorizados puedan sincronizar workers
3. Usar HTTPS

Ejemplo con autenticación:

```javascript
// En workers.js
router.post('/sync', authenticateUser, async (req, res) => {
  // ... código
})
```

## 📊 Verificación

Después de sincronizar, verifica en Supabase SQL Editor:

```sql
-- Ver todos los workers
SELECT * FROM workers;

-- Ver bots con sus workers
SELECT 
  b.session_name,
  b.status,
  w.name as worker_name,
  w.email as worker_email
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;
```

## 🐛 Troubleshooting

### Workers no aparecen en el dashboard

1. Verifica que se sincronizaron correctamente:
   ```bash
   curl http://localhost:4000/api/workers
   ```

2. Verifica en Supabase:
   ```sql
   SELECT * FROM workers;
   ```

3. Reconstruye el dashboard:
   ```bash
   docker-compose up -d --build dashboard
   ```

### Bot no se asigna al worker

1. Verifica que el worker existe:
   ```bash
   curl http://localhost:4000/api/workers/moises@example.com
   ```

2. Verifica el nombre de sesión del bot:
   ```bash
   curl http://localhost:4000/api/bots
   ```

3. Intenta asignar de nuevo con los datos correctos

## ✨ Próximas Mejoras

- [ ] Auto-sincronización periódica desde WAHA
- [ ] Webhook para notificar cambios en workers
- [ ] Interfaz en el dashboard para gestionar workers
- [ ] Estadísticas por worker
- [ ] Reasignación de bots entre workers

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del contenedor Express: `docker-compose logs -f express`
2. Verifica la consola del navegador (F12)
3. Revisa los datos en Supabase SQL Editor
