# Solución: Error "Could not find the table 'public.conversation_evaluations'"

## Problema

La tabla `conversation_evaluations` **SÍ EXISTE** en la base de datos (confirmado con 43 columnas), pero Supabase PostgREST muestra el error:

```
Could not find the table 'public.conversation_evaluations' in the schema cache
```

## Causa

El **schema cache de PostgREST** no se ha actualizado después de crear/modificar la tabla.

## Solución Rápida

### Opción 1: Recargar Schema Cache (Recomendado)

En Supabase Dashboard:

1. Ve a **Settings** → **API**
2. Busca la sección **"Schema Cache"** o **"PostgREST"**
3. Click en **"Reload schema cache"** o **"Restart PostgREST"**

### Opción 2: SQL Command

Ejecuta este comando en SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

### Opción 3: Esperar

El cache se actualiza automáticamente cada pocos minutos, pero puede tardar hasta 10 minutos.

### Opción 4: Verificar y Recrear Políticas RLS

Ejecuta el script `DIAGNOSE_RLS_PERMISSIONS.sql` que:
1. Verifica políticas RLS actuales
2. Recrea políticas si es necesario
3. Confirma acceso a la tabla

## Verificación

Después de recargar el cache, verifica con:

```sql
-- Debe retornar la tabla
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'conversation_evaluations';

-- Debe retornar 43 columnas
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'conversation_evaluations';
```

## Si el Problema Persiste

1. **Verifica variables de entorno**:
   ```env
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

2. **Reinicia el servidor Next.js**:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

3. **Verifica permisos RLS**:
   - Ejecuta `DIAGNOSE_RLS_PERMISSIONS.sql`
   - Asegúrate de que las políticas permitan acceso a `authenticated` y `service_role`

4. **Verifica en Supabase Dashboard**:
   - Table Editor → conversation_evaluations
   - Debe aparecer la tabla con datos

## Próximos Pasos

Una vez resuelto el cache:

1. ✅ La tabla existe y tiene todas las columnas
2. ✅ El código ya usa el nombre correcto (`conversation_evaluations`)
3. ✅ Las APIs están actualizadas
4. 🔄 Solo falta refrescar el cache de PostgREST

Después de esto, el sistema debería funcionar correctamente.
