# Instrucciones de Migración - Workers

## 📋 Resumen

Esta migración agrega la tabla `workers` a la base de datos de Supabase y actualiza el dashboard para mostrar la jerarquía completa: Workers → Bots → Conversaciones.

## 🗄️ Cambios en la Base de Datos

### Nueva Tabla: `workers`

La tabla `workers` almacena información de los trabajadores/agentes que gestionan los bots:

- `id` - UUID único
- `name` - Nombre del trabajador
- `email` - Email único del trabajador
- `phone_number` - Teléfono (opcional)
- `role` - Rol (por defecto: 'agent')
- `status` - Estado (por defecto: 'active')
- `avatar_url` - URL del avatar (opcional)
- Timestamps y metadata

### Modificación: Tabla `bots`

Se agrega la columna `worker_id` para asociar cada bot con un worker.

### Nuevas Vistas

1. **`worker_statistics`** - Estadísticas agregadas por worker
2. **`bots_with_worker`** - Bots con información del worker asignado

## 🚀 Pasos para Aplicar la Migración

### 1. Aplicar el Script SQL

Ejecuta el archivo `supabase-workers-migration.sql` en tu base de datos de Supabase:

**Opción A: Desde el Dashboard de Supabase**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Copia y pega el contenido de `supabase-workers-migration.sql`
5. Haz clic en "Run"

**Opción B: Desde la CLI de Supabase**
```bash
supabase db push
```

### 2. Crear Workers de Ejemplo (Opcional)

Para probar el sistema, puedes crear algunos workers de ejemplo:

```sql
-- Insertar workers de ejemplo
INSERT INTO workers (name, email, role, status) VALUES
('Juan Pérez', 'juan@example.com', 'agent', 'active'),
('María García', 'maria@example.com', 'supervisor', 'active'),
('Carlos López', 'carlos@example.com', 'agent', 'active');

-- Asignar bots a workers (actualiza los IDs según tus datos)
UPDATE bots 
SET worker_id = (SELECT id FROM workers WHERE email = 'juan@example.com' LIMIT 1)
WHERE session_name = 'bot1';

UPDATE bots 
SET worker_id = (SELECT id FROM workers WHERE email = 'maria@example.com' LIMIT 1)
WHERE session_name = 'bot2';
```

### 3. Verificar la Migración

Verifica que las tablas y vistas se crearon correctamente:

```sql
-- Verificar tabla workers
SELECT * FROM workers;

-- Verificar vista de estadísticas
SELECT * FROM worker_statistics;

-- Verificar bots con workers
SELECT * FROM bots_with_worker;
```

## 🎨 Cambios en el Dashboard

### Actualizaciones Realizadas

1. **Supabase Library (`src/lib/supabase.js`)**
   - Actualizado para usar tabla `chats` en lugar de `conversations`
   - Agregadas funciones para obtener workers
   - Agregadas funciones para obtener bots por worker
   - Actualizadas funciones de descarga de conversaciones

2. **Dashboard Principal (`src/app/dashboard/page.js`)**
   - Nueva interfaz jerárquica: Workers → Bots → Conversaciones
   - Estadísticas actualizadas con conteo de workers
   - Vista expandible/colapsable para navegar la jerarquía
   - Sección para bots sin worker asignado

3. **Variables de Entorno (`.env.local`)**
   - Agregadas credenciales de Supabase para Next.js

## 🏃 Ejecutar el Dashboard

```bash
cd dashboard
npm install
npm run dev
```

El dashboard estará disponible en http://localhost:3000

## 📊 Estructura de Datos

```
Workers
  ├── Worker 1
  │   ├── Bot A
  │   │   ├── Conversación 1
  │   │   ├── Conversación 2
  │   │   └── Conversación 3
  │   └── Bot B
  │       └── Conversación 4
  ├── Worker 2
  │   └── Bot C
  └── Worker 3

Bots sin asignar
  └── Bot D
      └── Conversación 5
```

## 🔐 Autenticación

El dashboard requiere autenticación con Supabase. Asegúrate de:

1. Tener usuarios creados en Supabase Auth
2. Las políticas RLS están configuradas correctamente
3. El usuario tiene permisos para leer las tablas necesarias

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que `.env.local` existe en la carpeta `dashboard`
- Verifica que las variables comienzan con `NEXT_PUBLIC_`

### Error: "relation 'workers' does not exist"
- Ejecuta el script de migración `supabase-workers-migration.sql`

### No se muestran datos en el dashboard
- Verifica que hay datos en las tablas `workers`, `bots`, y `chats`
- Revisa la consola del navegador para errores
- Verifica que el usuario está autenticado correctamente

## 📝 Notas Adicionales

- Los bots pueden existir sin worker asignado (worker_id = NULL)
- La vista `worker_statistics` se actualiza automáticamente
- Las políticas RLS permiten acceso completo con service_role
- Se mantiene compatibilidad con el esquema anterior

## 🔄 Rollback (Si es necesario)

Si necesitas revertir los cambios:

```sql
-- Eliminar columna worker_id de bots
ALTER TABLE bots DROP COLUMN IF EXISTS worker_id;

-- Eliminar vistas
DROP VIEW IF EXISTS worker_statistics;
DROP VIEW IF EXISTS bots_with_worker;

-- Eliminar tabla workers
DROP TABLE IF EXISTS workers CASCADE;
```

## ✅ Checklist de Implementación

- [ ] Ejecutar script de migración SQL
- [ ] Verificar que las tablas se crearon correctamente
- [ ] Crear workers de ejemplo (opcional)
- [ ] Asignar bots a workers (opcional)
- [ ] Instalar dependencias del dashboard (`npm install`)
- [ ] Verificar variables de entorno (`.env.local`)
- [ ] Ejecutar dashboard (`npm run dev`)
- [ ] Probar login
- [ ] Verificar que se muestran workers, bots y conversaciones
- [ ] Probar navegación jerárquica (expandir/colapsar)

## 📞 Soporte

Si encuentras problemas durante la migración, revisa:
1. Logs de Supabase
2. Consola del navegador
3. Logs del servidor Next.js
