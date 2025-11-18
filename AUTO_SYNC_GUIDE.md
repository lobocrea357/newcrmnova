# 🔄 Sistema de Auto-Sincronización Periódica

## 📝 Resumen

Este sistema ejecuta sincronizaciones automáticas periódicas para mantener los datos de Supabase sincronizados con WAHA, incluso si se eliminan (truncan) las tablas o si hay datos faltantes.

### Problema que Resuelve

**Antes**: Si truncabas las tablas de `bots`, `contacts` o `chats`, los datos solo se recreaban cuando llegaba un **nuevo mensaje via webhook**. Los chats/contactos sin mensajes recientes NO se recuperaban.

**Ahora**: El sistema verifica periódicamente WAHA y sincroniza automáticamente:
- ✅ Bots activos en WAHA → Supabase
- ✅ Contactos de cada bot → Supabase  
- ✅ Chats de cada bot → Supabase

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│         EXPRESS (Al iniciar)                │
│  autoSyncService.start()                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      Ciclo cada X minutos (default: 30)     │
│                                             │
│  1. syncBots()                              │
│     - GET /api/sessions?all=true from WAHA │
│     - Crea/actualiza bots en Supabase      │
│     - Identifica bots activos (WORKING)    │
│                                             │
│  2. syncBotsData() [si AUTO_SYNC_FULL=true]│
│     - Para cada bot WORKING:               │
│       → syncService.syncAll()              │
│       → Actualiza contactos y chats        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ⚙️ Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```bash
# Auto-Sincronización
AUTO_SYNC_ENABLED=true                  # true|false (default: true)
AUTO_SYNC_INTERVAL_MINUTES=30           # Minutos entre sincronizaciones (default: 30)
AUTO_SYNC_FULL_SYNC=false               # true=bots+contacts+chats, false=solo bots (default: false)
```

### Configuración Recomendada

#### Para Desarrollo:
```bash
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=60           # Cada hora
AUTO_SYNC_FULL_SYNC=true                # Sincronización completa
```

#### Para Producción:
```bash
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=30           # Cada 30 minutos
AUTO_SYNC_FULL_SYNC=true                # Sincronización completa
```

#### Para Desactivar (si solo quieres webhooks):
```bash
AUTO_SYNC_ENABLED=false
```

---

## 🚀 Uso

### Inicio Automático

El servicio se inicia automáticamente cuando arranques Express:

```bash
npm start
```

Verás en los logs:

```
🚀 Servidor corriendo en http://localhost:4000
...
✅ Listo para recibir webhooks de WAHA

🔄 Auto-Sincronización INICIADA
   ⏱️  Intervalo: cada 30 minutos
   🔍 Modo: BÁSICA (solo bots)
```

### Primera Sincronización

La primera sincronización se ejecuta **5 segundos después** de iniciar Express (para dar tiempo a que todo se inicialice).

Luego se repite cada X minutos según configuración.

---

## 📡 Endpoints de Control

### 1. Ver Estado del Servicio

```bash
GET /api/auto-sync/status
```

**Response**:
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

### 2. Iniciar Servicio (si está detenido)

```bash
POST /api/auto-sync/start
```

**Response**:
```json
{
  "success": true,
  "message": "Auto-sincronización iniciada",
  "data": { ... }
}
```

### 3. Detener Servicio

```bash
POST /api/auto-sync/stop
```

**Response**:
```json
{
  "success": true,
  "message": "Auto-sincronización detenida"
}
```

### 4. Forzar Sincronización Inmediata

```bash
POST /api/auto-sync/force
```

**Response**:
```json
{
  "success": true,
  "message": "Sincronización forzada iniciada. Revisa los logs para ver el progreso."
}
```

---

## 📊 Logs de Ejemplo

### Sincronización Básica (solo bots)

```
============================================================
🔄 CICLO DE AUTO-SINCRONIZACIÓN
⏰ 18/11/2024 01:30:00
============================================================

📱 Paso 1: Sincronizando bots desde WAHA...
   ✅ Bots: 3 activos en WAHA, 3 sincronizados

ℹ️  Paso 2: Omitido (AUTO_SYNC_FULL_SYNC=false)

✅ Ciclo completado en 1.25s
============================================================
```

### Sincronización Completa (bots + contactos + chats)

```
============================================================
🔄 CICLO DE AUTO-SINCRONIZACIÓN
⏰ 18/11/2024 01:30:00
============================================================

📱 Paso 1: Sincronizando bots desde WAHA...
   ✅ Bots: 3 activos en WAHA, 3 sincronizados

📊 Paso 2: Sincronización completa de contactos y chats...
   🔄 Sincronizando bot1_session...
      📞 15 contactos, 💬 10 chats
   🔄 Sincronizando bot2_session...
      📞 8 contactos, 💬 5 chats
   🔄 Sincronizando bot3_session...
      📞 22 contactos, 💬 18 chats
   ✅ Sincronizados: 45 contactos, 33 chats

✅ Ciclo completado en 12.45s
============================================================
```

---

## 🔍 Casos de Uso

### Caso 1: Truncar Tabla de Bots

**Situación**: Eliminas todos los registros de `bots` en Supabase.

```sql
TRUNCATE TABLE bots CASCADE;
```

**¿Qué pasa?**
1. **Con AUTO_SYNC**: En el próximo ciclo (máximo 30 min), todos los bots activos en WAHA se recrean automáticamente
2. **Sin AUTO_SYNC**: Los bots solo se recrean cuando llegue un mensaje nuevo

**Recomendación**: Forzar sincronización inmediata:
```bash
curl -X POST http://localhost:4000/api/auto-sync/force
```

---

### Caso 2: Truncar Tabla de Contacts

**Situación**: Eliminas todos los contactos.

```sql
TRUNCATE TABLE contacts CASCADE;
```

**¿Qué pasa?**
1. **Con AUTO_SYNC_FULL_SYNC=true**: En el próximo ciclo, se sincronizan todos los contactos de bots activos
2. **Con AUTO_SYNC_FULL_SYNC=false**: Los contactos solo se recrean via webhooks (cuando lleguen mensajes)

---

### Caso 3: Truncar Tabla de Chats

**Situación**: Eliminas todos los chats.

```sql
TRUNCATE TABLE chats CASCADE;
```

**¿Qué pasa?**
1. **Con AUTO_SYNC_FULL_SYNC=true**: En el próximo ciclo, se sincronizan todos los chats de bots activos
2. **Con AUTO_SYNC_FULL_SYNC=false**: Los chats solo se recrean via webhooks

---

### Caso 4: Bot Nuevo Conectado en WAHA

**Situación**: Conectas un bot nuevo en WAHA escaneando QR.

**¿Qué pasa?**
1. **Con AUTO_SYNC**: En el próximo ciclo (máximo 30 min), el bot aparece automáticamente en Supabase
2. **Con AUTO_SYNC_FULL_SYNC=true**: También se sincronizan sus contactos y chats inmediatamente

---

## 🔧 Troubleshooting

### Problema: El servicio no se inicia

**Síntomas**: No ves logs de auto-sincronización al iniciar Express.

**Causa**: `AUTO_SYNC_ENABLED=false` en `.env`

**Solución**:
```bash
# En .env
AUTO_SYNC_ENABLED=true
```

---

### Problema: Sincronización muy lenta

**Síntomas**: Cada ciclo tarda 5+ minutos.

**Causa**: Muchos bots/contactos/chats para sincronizar.

**Solución**:
1. Aumentar intervalo:
   ```bash
   AUTO_SYNC_INTERVAL_MINUTES=60  # Cada hora en lugar de cada 30 min
   ```

2. O desactivar sincronización completa:
   ```bash
   AUTO_SYNC_FULL_SYNC=false  # Solo sincroniza bots, no contactos/chats
   ```

---

### Problema: Datos no se sincronizan

**Síntomas**: Truncas una tabla pero los datos no vuelven.

**Causas Posibles**:
1. **Bot no está activo en WAHA**: Solo se sincronizan bots con estado `WORKING`
2. **AUTO_SYNC_FULL_SYNC=false**: Solo sincroniza bots, no contactos/chats
3. **Esperando próximo ciclo**: Verifica cuándo será con `/api/auto-sync/status`

**Solución**:
```bash
# Verificar estado
curl http://localhost:4000/api/auto-sync/status

# Forzar sincronización inmediata
curl -X POST http://localhost:4000/api/auto-sync/force

# Ver logs de Express para detalles
```

---

## 📈 Performance

### Tiempos Estimados

#### Sincronización Básica (solo bots):
- 1-3 bots: ~1-2 segundos
- 5-10 bots: ~3-5 segundos
- 20+ bots: ~8-12 segundos

#### Sincronización Completa (bots + contactos + chats):
- 1 bot con 50 contactos y 30 chats: ~5-8 segundos
- 3 bots con 150 contactos y 90 chats total: ~15-25 segundos
- 10 bots: ~60-120 segundos (1-2 minutos)

### Recomendaciones de Intervalo

```
Bots activos  | Contactos totales | Intervalo recomendado
------------- | ----------------- | ---------------------
1-3           | < 100             | 15 minutos
4-10          | 100-500           | 30 minutos (default)
11-20         | 500-1000          | 60 minutos
20+           | 1000+             | 120 minutos (2 horas)
```

---

## ⚠️ Consideraciones Importantes

### 1. Rate Limiting
El sistema incluye pausas entre requests para no saturar WAHA:
- 50-100ms entre contactos
- 30-50ms entre chats

### 2. Solo Actualiza Campos NULL
La sincronización completa solo actualiza campos que estén en NULL, NO sobrescribe datos existentes.

### 3. Solo Bots Activos
Solo se sincronizan contactos/chats de bots con estado `WORKING` en WAHA.

### 4. No Bloquea Express
La sincronización se ejecuta en segundo plano, no bloquea requests HTTP.

### 5. Idempotente
Puedes ejecutar la sincronización múltiples veces sin duplicar datos.

---

## 🔗 Integración con Webhooks

**Auto-Sincronización** y **Webhooks** trabajan juntos:

- **Webhooks**: Actualizaciones en tiempo real cuando llegan mensajes nuevos
- **Auto-Sync**: Recuperación de datos faltantes y sincronización de datos históricos

**Ejemplo**:
1. Truncas la tabla `contacts`
2. Auto-Sync sincroniza todos los contactos cada 30 minutos
3. Webhooks siguen creando/actualizando contactos en tiempo real al recibir mensajes

**Resultado**: Tienes lo mejor de ambos mundos 🎉

---

## 📝 Ejemplo Completo

### 1. Configurar `.env`

```bash
# Auto-Sincronización
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=30
AUTO_SYNC_FULL_SYNC=true
```

### 2. Iniciar Express

```bash
npm start
```

### 3. Verificar que está corriendo

```bash
curl http://localhost:4000/api/auto-sync/status
```

### 4. Truncar una tabla (para testing)

```sql
TRUNCATE TABLE contacts CASCADE;
```

### 5. Forzar sincronización inmediata

```bash
curl -X POST http://localhost:4000/api/auto-sync/force
```

### 6. Verificar en Supabase

```sql
SELECT COUNT(*) FROM contacts;
-- Debería mostrar los contactos recuperados desde WAHA
```

---

## ✅ Checklist de Implementación

- [x] Servicio `autoSyncService.js` creado
- [x] Rutas `/api/auto-sync/*` implementadas
- [x] Integración en `src/index.js`
- [x] Inicio automático al arrancar Express
- [x] Variables de entorno configurables
- [x] Logs informativos
- [x] Endpoints de control (status, start, stop, force)
- [x] Documentación completa
- [ ] Testing con bots reales (pendiente)
- [ ] Configurar intervalo óptimo para producción (pendiente)

---

**Autor**: Cascade AI  
**Fecha**: 18 Nov 2024  
**Versión**: 1.0.0  
**Estado**: ✅ Listo para Testing
