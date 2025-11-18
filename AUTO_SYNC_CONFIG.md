# ⚙️ Configuración de Auto-Sincronización

## Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env`:

```bash
# === CONFIGURACIÓN EXISTENTE (No modificar) ===
PORT=4000
WAHA_BASE_URL=http://waha:3000
WAHA_API_KEY=tu_api_key
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# === NUEVA CONFIGURACIÓN: AUTO-SINCRONIZACIÓN ===

# Habilitar/deshabilitar auto-sincronización
# true = activo, false = desactivado
# Default: true
AUTO_SYNC_ENABLED=true

# Intervalo entre sincronizaciones (en minutos)
# Recomendado: 30-60 minutos
# Default: 30
AUTO_SYNC_INTERVAL_MINUTES=30

# Tipo de sincronización
# true = sincroniza bots + contactos + chats (completa)
# false = sincroniza solo bots (básica, más rápida)
# Default: false
AUTO_SYNC_FULL_SYNC=true
```

---

## 📋 Configuraciones Recomendadas por Escenario

### 🧪 Desarrollo / Testing
```bash
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=60      # Cada hora (menos frecuente)
AUTO_SYNC_FULL_SYNC=true           # Sincronización completa
```
**Razón**: En desarrollo quieres probar todas las funciones pero sin saturar con sincronizaciones muy frecuentes.

---

### 🚀 Producción - Pocos Bots (1-5 bots)
```bash
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=30      # Cada 30 minutos
AUTO_SYNC_FULL_SYNC=true           # Sincronización completa
```
**Razón**: Con pocos bots, puedes permitirte sincronizaciones completas frecuentes.

---

### 🚀 Producción - Muchos Bots (6-20 bots)
```bash
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=60      # Cada hora
AUTO_SYNC_FULL_SYNC=true           # Sincronización completa
```
**Razón**: Más bots = más tiempo de sincronización. Aumentar intervalo previene sobrecargas.

---

### 🚀 Producción - Alta Escala (20+ bots)
```bash
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=120     # Cada 2 horas
AUTO_SYNC_FULL_SYNC=false          # Solo bots (no contactos/chats)
```
**Razón**: Con muchos bots, la sincronización completa puede tardar minutos. Mejor hacerla menos frecuente o solo sincronizar bots.

---

### ⏸️ Solo Webhooks (Sin auto-sync)
```bash
AUTO_SYNC_ENABLED=false
AUTO_SYNC_INTERVAL_MINUTES=30      # (ignorado si está deshabilitado)
AUTO_SYNC_FULL_SYNC=false          # (ignorado si está deshabilitado)
```
**Razón**: Si solo quieres usar webhooks en tiempo real y no necesitas recuperación automática de datos.

---

## 🔄 Cómo Aplicar los Cambios

### 1. Editar `.env`
```bash
nano .env
# o
code .env
```

### 2. Agregar/Modificar Variables
Copia las 3 variables de AUTO_SYNC y ajusta según tu caso.

### 3. Reiniciar Express
```bash
# Detener Express (Ctrl+C)
# Reiniciar
npm start
```

### 4. Verificar en los Logs
Deberías ver:
```
🔄 Auto-Sincronización INICIADA
   ⏱️  Intervalo: cada 30 minutos
   🔍 Modo: COMPLETA (bots + contactos + chats)
```

O si está deshabilitado:
```
⏸️  Auto-sincronización DESHABILITADA (AUTO_SYNC_ENABLED=false)
```

---

## 🧪 Testing de la Configuración

### Verificar Estado Actual
```bash
curl http://localhost:4000/api/auto-sync/status
```

**Response esperado**:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "isRunning": true,
    "syncInProgress": false,
    "intervalMinutes": 30,
    "fullSync": true,
    "lastSyncTime": "2024-11-18T05:30:00.000Z",
    "nextSyncIn": 1200,
    "message": "Auto-sincronización activa"
  }
}
```

### Forzar Sincronización de Prueba
```bash
curl -X POST http://localhost:4000/api/auto-sync/force
```

Luego revisa los logs de Express para ver el progreso:
```
============================================================
🔄 CICLO DE AUTO-SINCRONIZACIÓN
⏰ 18/11/2024 01:30:00
============================================================
...
```

---

## ⚠️ Notas Importantes

### 1. Variables NO Obligatorias
Si no agregas las variables de AUTO_SYNC, el sistema usa los valores por defecto:
- `AUTO_SYNC_ENABLED=true`
- `AUTO_SYNC_INTERVAL_MINUTES=30`
- `AUTO_SYNC_FULL_SYNC=false`

### 2. Cambios Requieren Reinicio
Los cambios en `.env` solo se aplican al reiniciar Express.

### 3. Docker
Si usas Docker, asegúrate de:
- Agregar las variables en `docker-compose.yml` bajo el servicio `express`:
```yaml
services:
  express:
    environment:
      - AUTO_SYNC_ENABLED=true
      - AUTO_SYNC_INTERVAL_MINUTES=30
      - AUTO_SYNC_FULL_SYNC=true
```

O mejor, usa el archivo `.env` con `env_file`:
```yaml
services:
  express:
    env_file:
      - .env
```

---

## 📊 Monitoreo

### Ver Cuándo Será la Próxima Sincronización
```bash
curl http://localhost:4000/api/auto-sync/status | grep nextSyncIn
```

**Resultado**: `"nextSyncIn": 1200` (segundos = 20 minutos)

### Ver Última Sincronización
```bash
curl http://localhost:4000/api/auto-sync/status | grep lastSyncTime
```

**Resultado**: `"lastSyncTime": "2024-11-18T05:30:00.000Z"`

---

## 🔧 Troubleshooting

### Problema: "Auto-sincronización DESHABILITADA"

**Solución**:
```bash
# En .env
AUTO_SYNC_ENABLED=true

# Reiniciar Express
npm restart
```

### Problema: Sincronizaciones Muy Frecuentes

**Solución**:
```bash
# Aumentar intervalo en .env
AUTO_SYNC_INTERVAL_MINUTES=60  # o más

# Reiniciar Express
```

### Problema: Sincronizaciones Muy Lentas

**Solución**:
```bash
# Desactivar sincronización completa en .env
AUTO_SYNC_FULL_SYNC=false

# O aumentar intervalo
AUTO_SYNC_INTERVAL_MINUTES=120

# Reiniciar Express
```

---

## 📝 Ejemplo Completo de `.env`

```bash
# Puerto
PORT=4000

# WAHA Configuration
WAHA_BASE_URL=http://waha:3000
WAHA_API_KEY=a317ec51b40e4ab597fa767f7bb13e1c

# Supabase Configuration
SUPABASE_URL=https://xyzabcdefg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auto-Sincronización (NUEVO)
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=30
AUTO_SYNC_FULL_SYNC=true
```

---

**Última actualización**: 18 Nov 2024  
**Versión**: 1.0.0
