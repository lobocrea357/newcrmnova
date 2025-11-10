# 🚀 Pasos Siguientes para Configurar el Dashboard

## ✅ Estado Actual

Ya tienes:
- ✅ Tabla `workers` creada en Supabase
- ✅ Vista `worker_statistics` creada
- ✅ Dashboard actualizado con nueva interfaz
- ✅ Código de Supabase actualizado

## 📋 Pasos a Seguir

### 1️⃣ Verificar y Actualizar el Schema

Ejecuta este script en Supabase SQL Editor para verificar que todo esté correcto:

**Archivo:** `verify-and-update-schema.sql`

Este script:
- ✅ Verifica si la columna `worker_id` existe en la tabla `bots`
- ✅ La agrega si no existe
- ✅ Crea/actualiza las vistas necesarias
- ✅ Muestra un resumen de tus datos actuales

### 2️⃣ Insertar Datos de Ejemplo (Opcional)

Si quieres probar el sistema con datos de ejemplo:

**Archivo:** `insert-sample-data.sql`

Este script:
- Crea 3 workers de ejemplo
- Asigna los primeros 3 bots a estos workers
- Muestra las asignaciones

### 3️⃣ Ejecutar el Dashboard

```bash
cd dashboard
npm run dev
```

Abre: http://localhost:3000

### 4️⃣ Iniciar Sesión

Usa las credenciales de Supabase Auth que ya tienes configuradas.

## 🎯 Resultado Esperado

Deberías ver:

```
Dashboard CRM WhatsApp
├── Estadísticas
│   ├── Workers: X
│   ├── Total Bots: X
│   ├── Conversaciones: X
│   └── Bots Activos: X
│
└── Estructura Organizacional
    ├── Worker 1 (expandible)
    │   ├── Bot A (expandible)
    │   │   ├── Conversación 1
    │   │   ├── Conversación 2
    │   │   └── Conversación 3
    │   └── Bot B (expandible)
    │       └── Conversación 4
    │
    ├── Worker 2 (expandible)
    │   └── Bot C (expandible)
    │
    └── Bots sin asignar (expandible)
        └── Bot D (expandible)
```

## 🔍 Verificación Rápida

### En Supabase SQL Editor:

```sql
-- Ver todos los workers
SELECT * FROM workers;

-- Ver bots con sus workers
SELECT 
    b.session_name,
    b.status,
    w.name as worker_name
FROM bots b
LEFT JOIN workers w ON b.worker_id = w.id;

-- Ver estadísticas
SELECT * FROM worker_statistics;
```

## 🐛 Solución de Problemas

### Problema: "No hay datos"
**Solución:** 
- Verifica que tienes bots en la tabla `bots`
- Verifica que tienes chats en la tabla `chats`
- Ejecuta `insert-sample-data.sql` para crear datos de prueba

### Problema: "Error fetching workers"
**Solución:**
- Verifica que la vista `worker_statistics` existe
- Verifica las políticas RLS (deben estar en "Unrestricted" para desarrollo)

### Problema: "Error fetching conversations"
**Solución:**
- Verifica que la tabla `chats` tiene datos
- Verifica que los `bot_id` en `chats` coinciden con los IDs en `bots`

## 📊 Asignar Workers Manualmente

Si prefieres asignar workers manualmente a bots específicos:

```sql
-- Obtener IDs de workers
SELECT id, name, email FROM workers;

-- Obtener IDs de bots
SELECT id, session_name, phone_number FROM bots;

-- Asignar un bot a un worker
UPDATE bots 
SET worker_id = 'UUID_DEL_WORKER'
WHERE id = 'UUID_DEL_BOT';

-- Ejemplo:
UPDATE bots 
SET worker_id = (SELECT id FROM workers WHERE email = 'juan@example.com')
WHERE session_name = 'bot_viajes_nova';
```

## 🎨 Personalización

### Cambiar Colores o Estilos

Edita: `dashboard/src/app/dashboard/page.js`

### Agregar Más Campos a Workers

1. Agrega columnas a la tabla `workers` en Supabase
2. Actualiza la vista `worker_statistics`
3. Actualiza el dashboard para mostrar los nuevos campos

## 📝 Notas Importantes

- Los bots **pueden existir sin worker asignado** (se mostrarán en "Bots sin asignar")
- Las conversaciones se cargan **solo cuando expandes un bot** (lazy loading)
- Las estadísticas se actualizan **automáticamente** gracias a las vistas SQL
- El dashboard **maneja errores gracefully** - no se romperá si faltan datos

## ✨ Próximas Mejoras Sugeridas

1. **Filtros:** Agregar filtros por worker, estado, fecha
2. **Búsqueda:** Buscar conversaciones por nombre o teléfono
3. **Exportación:** Exportar reportes por worker
4. **Notificaciones:** Alertas de nuevos mensajes
5. **Asignación:** Interfaz para asignar/reasignar bots a workers

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa la consola del navegador (F12)
2. Revisa los logs de Supabase
3. Verifica que las tablas tienen datos
4. Verifica las políticas RLS
