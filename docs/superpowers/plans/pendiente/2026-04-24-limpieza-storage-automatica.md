# Limpieza Automática de Storage - Archivos Antiguos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un sistema automatizado de limpieza de archivos antiguos en Supabase Storage usando Edge Functions + pg_cron para eliminar archivos creados antes de enero 2025.

**Architecture:** Edge Function (Deno/TypeScript) que lista archivos de un bucket, filtra por fecha de creación usando el schema storage.objects, elimina archivos antiguos vía API de Storage, y se ejecuta automáticamente cada domingo a las 3 AM vía pg_cron + pg_net.

**Tech Stack:** Supabase Edge Functions (Deno), pg_cron, pg_net, Supabase Storage API, TypeScript

---

## FASE 1: Configuración de Extensiones y Secretos

### Task 1: Habilitar extensiones pg_cron y pg_net

**Files:**
- Modify: Ejecutar SQL en Supabase Dashboard o via CLI

- [ ] **Step 1: Habilitar extensión pg_cron**

```sql
-- Ejecutar en SQL Editor de Supabase Dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

Expected: Extensión creada sin errores

- [ ] **Step 2: Habilitar extensión pg_net**

```sql
-- Ejecutar en SQL Editor de Supabase Dashboard
CREATE EXTENSION IF NOT EXISTS pg_net;
```

Expected: Extensión creada sin errores

- [ ] **Step 3: Verificar extensiones habilitadas**

```sql
SELECT extname FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

Expected: Ambas extensiones listadas

- [ ] **Step 4: Commit cambios (si se usa migration)**

```bash
git add docs/05-base-de-datos/migraciones/
git commit -m "feat: habilitar extensiones pg_cron y pg_net para limpieza automatizada"
```

### Task 2: Almacenar secretos en Supabase Vault

**Files:**
- Modify: Ejecutar SQL en Supabase Dashboard

- [ ] **Step 1: Obtener PROJECT_URL y SERVICE_ROLE_KEY**

- Ir a Settings > API en Supabase Dashboard
- Copiar Project URL
- Copiar service_role key (NUNCA usar anon key para operaciones admin)

- [ ] **Step 2: Almacenar PROJECT_URL en Vault**

```sql
-- Reemplazar con tu project URL real
SELECT vault.create_secret('https://tu-project-ref.supabase.co', 'project_url');
```

Expected: Secret creado exitosamente

- [ ] **Step 3: Almacenar SERVICE_ROLE_KEY en Vault**

```sql
-- Reemplazar con tu service_role key real
SELECT vault.create_secret('tu-service-role-key-aqui', 'service_role_key');
```

Expected: Secret creado exitosamente

- [ ] **Step 4: Verificar secretos almacenados**

```sql
SELECT name, created_at FROM vault.secrets;
```

Expected: Ambos secretos listados

- [ ] **Step 5: Documentar credenciales en archivo local (NO COMMIT)**

```bash
# Crear archivo .env.local (agregar a .gitignore)
echo "SUPABASE_PROJECT_URL=https://tu-project-ref.supabase.co" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui" >> .env.local
```

---

## FASE 2: Creación de Edge Function

### Task 3: Crear estructura de Edge Function

**Files:**
- Create: `supabase/functions/cleanup-old-storage/index.ts`
- Create: `supabase/functions/cleanup-old-storage/deno.json`

- [ ] **Step 1: Crear directorio de función**

```bash
mkdir -p supabase/functions/cleanup-old-storage
```

Expected: Directorio creado

- [ ] **Step 2: Crear archivo deno.json con permisos**

```json
{
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

Expected: Archivo deno.json creado

- [ ] **Step 3: Commit estructura base**

```bash
git add supabase/functions/cleanup-old-storage/
git commit -m "feat: crear estructura base de Edge Function cleanup-old-storage"
```

### Task 4: Implementar Edge Function con lógica de limpieza

**Files:**
- Create: `supabase/functions/cleanup-old-storage/index.ts`

- [ ] **Step 1: Escribir Edge Function completa**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface CleanupRequest {
  bucket: string
  cutoffDate?: string // Formato ISO: "2025-01-01"
  dryRun?: boolean // Si true, solo lista archivos sin eliminar
}

interface CleanupResponse {
  success: boolean
  message: string
  filesToDelete?: string[]
  deletedCount?: number
  error?: string
}

serve(async (req) => {
  try {
    // 1. Validar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parsear y validar request body
    const { bucket, cutoffDate, dryRun = false }: CleanupRequest = await req.json()

    if (!bucket) {
      return new Response(
        JSON.stringify({ error: 'bucket is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Obtener credenciales desde environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Crear cliente Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 5. Definir fecha de corte (por defecto: 31 de enero 2025)
    const cutoff = new Date(cutoffDate || '2025-01-31T23:59:59Z')
    
    console.log(`[Cleanup] Bucket: ${bucket}, Cutoff: ${cutoff.toISOString()}, DryRun: ${dryRun}`)

    // 6. Listar todos los archivos del bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucket)
      .list('', { sortBy: { column: 'created_at', order: 'asc' } })

    if (listError) {
      console.error('[Cleanup] Error listing files:', listError)
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!files || files.length === 0) {
      const response: CleanupResponse = {
        success: true,
        message: 'No files found in bucket'
      }
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 7. Filtrar archivos por fecha de creación
    const oldFiles = files.filter(file => {
      const createdAt = new Date(file.created_at)
      return createdAt < cutoff
    })

    console.log(`[Cleanup] Total files: ${files.length}, Old files: ${oldFiles.length}`)

    if (oldFiles.length === 0) {
      const response: CleanupResponse = {
        success: true,
        message: 'No files older than cutoff date found'
      }
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 8. Si es dry run, retornar lista sin eliminar
    if (dryRun) {
      const response: CleanupResponse = {
        success: true,
        message: `Dry run: ${oldFiles.length} files would be deleted`,
        filesToDelete: oldFiles.map(f => f.name)
      }
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 9. Eliminar archivos en lotes (máximo 100 por llamada)
    const batchSize = 100
    let totalDeleted = 0
    const errors: string[] = []

    for (let i = 0; i < oldFiles.length; i += batchSize) {
      const batch = oldFiles.slice(i, i + batchSize)
      const paths = batch.map(f => f.name)

      const { error: deleteError } = await supabase
        .storage
        .from(bucket)
        .remove(paths)

      if (deleteError) {
        console.error(`[Cleanup] Error deleting batch ${i / batchSize}:`, deleteError)
        errors.push(`Batch ${i / batchSize}: ${deleteError.message}`)
      } else {
        totalDeleted += batch.length
        console.log(`[Cleanup] Deleted batch ${i / batchSize}: ${batch.length} files`)
      }
    }

    // 10. Retornar resultado
    const response: CleanupResponse = {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Successfully deleted ${totalDeleted} files`
        : `Deleted ${totalDeleted} files with ${errors.length} errors`,
      deletedCount: totalDeleted,
      error: errors.length > 0 ? errors.join('; ') : undefined
    }

    return new Response(
      JSON.stringify(response),
      { status: errors.length === 0 ? 200 : 207, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Cleanup] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

Expected: Archivo index.ts creado con lógica completa

- [ ] **Step 2: Commit Edge Function**

```bash
git add supabase/functions/cleanup-old-storage/index.ts
git commit -m "feat: implementar lógica de limpieza en Edge Function"
```

---

## FASE 3: Despliegue y Testing

### Task 5: Desplegar Edge Function

**Files:**
- No files modified (deployment action)

- [ ] **Step 1: Login en Supabase CLI**

```bash
npx supabase login
```

Expected: Login exitoso

- [ ] **Step 2: Link al proyecto (si no está linkado)**

```bash
npx supabase link --project-ref tu-project-ref
```

Expected: Proyecto linkado

- [ ] **Step 3: Desplegar Edge Function**

```bash
npx supabase functions deploy cleanup-old-storage
```

Expected: Función desplegada exitosamente con URL mostrada

- [ ] **Step 4: Configurar environment variables para la función**

```bash
npx supabase secrets set SUPABASE_URL=https://tu-project-ref.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

Expected: Secrets configurados

### Task 6: Testing manual con dry run

**Files:**
- No files modified (testing action)

- [ ] **Step 1: Ejecutar test con dry run (sin eliminar)**

```bash
curl -X POST \
  'https://tu-project-ref.supabase.co/functions/v1/cleanup-old-storage' \
  -H 'Authorization: Bearer tu-service-role-key-aqui' \
  -H 'Content-Type: application/json' \
  -d '{
    "bucket": "nombre-de-tu-bucket",
    "cutoffDate": "2025-01-31T23:59:59Z",
    "dryRun": true
  }'
```

Expected: Response con lista de archivos que serían eliminados

- [ ] **Step 2: Verificar response**

```json
{
  "success": true,
  "message": "Dry run: X files would be deleted",
  "filesToDelete": ["file1.jpg", "file2.pdf", ...]
}
```

Expected: Response correcta con lista de archivos

- [ ] **Step 3: Revisar logs en Supabase Dashboard**

- Ir a Edge Functions > cleanup-old-storage > Logs
- Verificar que no haya errores

Expected: Logs sin errores críticos

### Task 7: Testing real con dataset pequeño

**Files:**
- No files modified (testing action)

- [ ] **Step 1: Crear bucket de prueba (si no existe)**

```bash
# O crear via Dashboard
```

Expected: Bucket de prueba creado

- [ ] **Step 2: Subir archivos de prueba antiguos**

```bash
# Subir algunos archivos manualmente via Dashboard o CLI
```

Expected: Archivos subidos

- [ ] **Step 3: Ejecutar cleanup real en bucket de prueba**

```bash
curl -X POST \
  'https://tu-project-ref.supabase.co/functions/v1/cleanup-old-storage' \
  -H 'Authorization: Bearer tu-service-role-key-aqui' \
  -H 'Content-Type: application/json' \
  -d '{
    "bucket": "bucket-prueba",
    "cutoffDate": "2025-01-31T23:59:59Z",
    "dryRun": false
  }'
```

Expected: Response indicando archivos eliminados

- [ ] **Step 4: Verificar que archivos fueron eliminados**

```bash
# Listar archivos del bucket via Dashboard
```

Expected: Archivos antiguos eliminados, archivos recientes intactos

---

## FASE 4: Programación Automática con pg_cron

### Task 8: Crear función SQL para invocar Edge Function

**Files:**
- Create: `docs/05-base-de-datos/migraciones/2026-04-24-cleanup-storage-function.sql`

- [ ] **Step 1: Crear archivo de migración SQL**

```sql
-- Función para invocar Edge Function de cleanup
CREATE OR REPLACE FUNCTION invoke_storage_cleanup()
RETURNS void AS $$
DECLARE
  project_url text;
  service_role_key text;
  request_id text;
BEGIN
  -- Obtener secretos desde Vault
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  -- Validar que secretos existan
  IF project_url IS NULL OR service_role_key IS NULL THEN
    RAISE EXCEPTION 'Secretos project_url o service_role_key no encontrados en Vault';
  END IF;

  -- Invocar Edge Function via pg_net
  SELECT request_id INTO request_id
  FROM net.http_post(
    url := project_url || '/functions/v1/cleanup-old-storage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'bucket', 'nombre-de-tu-bucket',
      'cutoffDate', '2025-01-31T23:59:59Z',
      'dryRun', false
    )
  );

  RAISE NOTICE 'Storage cleanup invoked with request_id: %', request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Expected: Archivo SQL creado

- [ ] **Step 2: Ejecutar migración en Supabase**

```bash
# Ejecutar via SQL Editor o Supabase CLI
```

Expected: Función creada sin errores

- [ ] **Step 3: Commit migración**

```bash
git add docs/05-base-de-datos/migraciones/2026-04-24-cleanup-storage-function.sql
git commit -m "feat: crear función SQL para invocar Edge Function de cleanup"
```

### Task 9: Programar cron job para ejecución semanal

**Files:**
- Create: `docs/05-base-de-datos/migraciones/2026-04-24-cleanup-storage-cron.sql`

- [ ] **Step 1: Crear archivo de migración para cron job**

```sql
-- Programar cleanup cada domingo a las 3:00 AM GMT
SELECT cron.schedule(
  'storage-cleanup-weekly',
  '0 3 * * 0', -- Domingo a las 3:00 AM (cron syntax)
  'SELECT invoke_storage_cleanup();'
);

-- Verificar que el job fue programado
SELECT * FROM cron.job;
```

Expected: Archivo SQL creado

- [ ] **Step 2: Ejecutar migración en Supabase**

```bash
# Ejecutar via SQL Editor
```

Expected: Cron job programado exitosamente

- [ ] **Step 3: Verificar cron job activo**

```sql
SELECT * FROM cron.job WHERE jobname = 'storage-cleanup-weekly';
```

Expected: Job listado con schedule correcto

- [ ] **Step 4: Commit migración**

```bash
git add docs/05-base-de-datos/migraciones/2026-04-24-cleanup-storage-cron.sql
git commit -m "feat: programar cron job semanal para limpieza de storage"
```

### Task 10: Test de ejecución manual del cron job

**Files:**
- No files modified (testing action)

- [ ] **Step 1: Ejecutar función manualmente**

```sql
SELECT invoke_storage_cleanup();
```

Expected: Función ejecutada sin errores, request_id mostrado

- [ ] **Step 2: Verificar logs de Edge Function**

- Ir a Edge Functions > cleanup-old-storage > Logs
- Verificar ejecución exitosa

Expected: Logs muestran archivos eliminados

- [ ] **Step 3: Verificar historial de cron jobs**

```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'storage-cleanup-weekly' 
ORDER BY start_time DESC 
LIMIT 5;
```

Expected: Historial de ejecuciones mostrado

---

## FASE 5: Documentación y Monitoreo

### Task 11: Crear documentación de uso

**Files:**
- Create: `docs/05-base-de-datos/limpieza-storage-automatica.md`

- [ ] **Step 1: Crear documentación completa**

```markdown
# Limpieza Automática de Storage

## Descripción

Sistema automatizado para eliminar archivos antiguos de Supabase Storage usando Edge Functions + pg_cron.

## Configuración

### Extensiones Requeridas
- pg_cron: Para programación de tareas
- pg_net: Para invocación HTTP de Edge Functions

### Secretos en Vault
- `project_url`: URL del proyecto Supabase
- `service_role_key`: Service role key para operaciones admin

### Edge Function
- Nombre: `cleanup-old-storage`
- Endpoint: `/functions/v1/cleanup-old-storage`
- Método: POST

## Uso Manual

### Ejecutar con dry run (sin eliminar)
```bash
curl -X POST \
  'https://project-ref.supabase.co/functions/v1/cleanup-old-storage' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "bucket": "nombre-bucket",
    "cutoffDate": "2025-01-31T23:59:59Z",
    "dryRun": true
  }'
```

### Ejecutar limpieza real
```bash
curl -X POST \
  'https://project-ref.supabase.co/functions/v1/cleanup-old-storage' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "bucket": "nombre-bucket",
    "cutoffDate": "2025-01-31T23:59:59Z",
    "dryRun": false
  }'
```

## Programación Automática

### Cron Job
- Nombre: `storage-cleanup-weekly`
- Schedule: Domingo a las 3:00 AM GMT
- Función SQL: `invoke_storage_cleanup()`

### Modificar Schedule
```sql
-- Desactivar job actual
SELECT cron.unschedule('storage-cleanup-weekly');

-- Programar con nuevo schedule
SELECT cron.schedule(
  'storage-cleanup-weekly',
  '0 2 * * 1', -- Lunes a las 2:00 AM
  'SELECT invoke_storage_cleanup();'
);
```

## Monitoreo

### Ver Logs de Edge Function
1. Ir a Supabase Dashboard
2. Edge Functions > cleanup-old-storage > Logs

### Ver Historial de Cron Jobs
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'storage-cleanup-weekly' 
ORDER BY start_time DESC 
LIMIT 10;
```

### Ver Última Ejecución
```sql
SELECT 
  jobname,
  schedule,
  last_run,
  next_run,
  status
FROM cron.job 
WHERE jobname = 'storage-cleanup-weekly';
```

## Troubleshooting

### Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
- Verificar que los secretos estén configurados en Vault
- Verificar que las environment variables estén seteadas en la Edge Function

### Error: Secretos no encontrados en Vault
```sql
-- Verificar secretos existentes
SELECT name FROM vault.secrets;

-- Re-crear si es necesario
SELECT vault.create_secret('https://project-ref.supabase.co', 'project_url');
SELECT vault.create_secret('service-role-key', 'service_role_key');
```

### Error: Bucket not found
- Verificar que el nombre del bucket sea correcto
- Verificar que el bucket exista en Storage

### Archivos no se eliminan
- Verificar que la fecha de corte sea correcta
- Ejecutar con dryRun primero para verificar qué archivos serían eliminados
- Revisar logs de Edge Function para errores específicos

## Seguridad

⚠️ **IMPORTANTE**: 
- NUNCA exponer el service_role_key en el cliente
- Usar siempre Vault para almacenar credenciales sensibles
- La Edge Function debe usar service_role_key para operaciones admin
- Limitar acceso a la Edge Function vía RLS si es necesario

## Parámetros de Configuración

### cutoffDate
Fecha límite para eliminar archivos. Formato ISO 8601.
- Por defecto: `2025-01-31T23:59:59Z` (31 de enero 2025)
- Para cambiar: Modificar el parámetro en la invocación o en la función SQL

### bucket
Nombre del bucket de Storage a limpiar.
- Debe existir previamente
- El usuario de service role debe tener permisos

### dryRun
Modo de prueba sin eliminar archivos.
- `true`: Solo lista archivos que serían eliminados
- `false`: Elimina archivos realmente
```

Expected: Documentación creada

- [ ] **Step 2: Commit documentación**

```bash
git add docs/05-base-de-datos/limpieza-storage-automatica.md
git commit -m "docs: agregar documentación de limpieza automática de storage"
```

### Task 12: Crear alertas de monitoreo (opcional)

**Files:**
- Create: `docs/05-base-de-datos/migraciones/2026-04-24-cleanup-monitoring.sql`

- [ ] **Step 1: Crear tabla para log de ejecuciones**

```sql
-- Tabla para historial de limpiezas
CREATE TABLE IF NOT EXISTS storage_cleanup_log (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bucket TEXT NOT NULL,
  cutoff_date TIMESTAMP WITH TIME ZONE NOT NULL,
  files_scanned INTEGER,
  files_deleted INTEGER,
  errors TEXT,
  execution_time_seconds INTEGER,
  status TEXT -- 'success', 'partial', 'error'
);

-- Índice para consultas rápidas
CREATE INDEX idx_storage_cleanup_log_executed_at ON storage_cleanup_log(executed_at DESC);
```

Expected: Tabla creada

- [ ] **Step 2: Modificar Edge Function para registrar log**

```typescript
// Agregar después de eliminar archivos (paso 9 del Task 4)

// Registrar log en base de datos
const { error: logError } = await supabase
  .from('storage_cleanup_log')
  .insert({
    bucket: bucket,
    cutoff_date: cutoff.toISOString(),
    files_scanned: files.length,
    files_deleted: totalDeleted,
    errors: errors.length > 0 ? errors.join('; ') : null,
    execution_time_seconds: Math.floor((Date.now() - startTime) / 1000),
    status: errors.length === 0 ? 'success' : (totalDeleted > 0 ? 'partial' : 'error')
  })

if (logError) {
  console.error('[Cleanup] Error logging execution:', logError)
}
```

Expected: Edge Function modificada con logging

- [ ] **Step 3: Commit cambios de monitoreo**

```bash
git add docs/05-base-de-datos/migraciones/2026-04-24-cleanup-monitoring.sql
git add supabase/functions/cleanup-old-storage/index.ts
git commit -m "feat: agregar sistema de logging para ejecuciones de cleanup"
```

---

## FASE 6: Validación Final

### Task 13: Validación completa del sistema

**Files:**
- No files modified (validation action)

- [ ] **Step 1: Ejecutar test final con dry run**

```bash
curl -X POST \
  'https://tu-project-ref.supabase.co/functions/v1/cleanup-old-storage' \
  -H 'Authorization: Bearer tu-service-role-key-aqui' \
  -H 'Content-Type: application/json' \
  -d '{
    "bucket": "nombre-de-tu-bucket",
    "cutoffDate": "2025-01-31T23:59:59Z",
    "dryRun": true
  }'
```

Expected: Response exitosa con lista de archivos

- [ ] **Step 2: Verificar que cron job está activo**

```sql
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'storage-cleanup-weekly';
```

Expected: Job activo con schedule correcto

- [ ] **Step 3: Verificar que secretos están en Vault**

```sql
SELECT name, created_at FROM vault.secrets;
```

Expected: Ambos secretos presentes

- [ ] **Step 4: Verificar logs de última ejecución manual**

```sql
SELECT * FROM storage_cleanup_log 
ORDER BY executed_at DESC 
LIMIT 1;
```

Expected: Log de ejecución presente

- [ ] **Step 5: Verificar documentación completa**

```bash
cat docs/05-base-de-datos/limpieza-storage-automatica.md
```

Expected: Documentación completa y actualizada

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "feat: completar implementación de limpieza automática de storage"
```

---

## Checklist de Validación

Antes de considerar la implementación completa:

- [ ] Extensiones pg_cron y pg_net habilitadas
- [ ] Secretos almacenados en Vault (project_url, service_role_key)
- [ ] Edge Function desplegada y funcional
- [ ] Environment variables configuradas en Edge Function
- [ ] Test con dry run exitoso
- [ ] Test real en bucket de prueba exitoso
- [ ] Función SQL invoke_storage_cleanup() creada
- [ ] Cron job programado y activo
- [ ] Test manual de cron job exitoso
- [ ] Documentación completa creada
- [ ] Sistema de logging implementado (opcional)
- [ ] Validación final completada

---

## Notas Importantes

1. **Fecha de Corte**: El sistema está configurado para eliminar archivos creados antes del 31 de enero 2025. Ajustar según necesidad.

2. **Schedule**: Por defecto se ejecuta domingos a las 3:00 AM GMT. Ajustar según necesidad.

3. **Bucket**: Reemplazar "nombre-de-tu-bucket" con el nombre real del bucket en todas las configuraciones.

4. **Seguridad**: NUNCA exponer service_role_key en código cliente. Usar siempre Vault.

5. **Testing**: Siempre ejecutar con dryRun=true antes de eliminar archivos reales.

6. **Monitoreo**: Revisar logs regularmente para asegurar que el sistema funciona correctamente.

7. **Backup**: Considerar hacer backup de archivos importantes antes de ejecutar la primera limpieza.
