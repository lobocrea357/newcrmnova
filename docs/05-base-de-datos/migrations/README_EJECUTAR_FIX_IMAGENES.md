# FIX: Imágenes de Vuelos no se Renderizan

## Problema Identificado
Las imágenes de comprobantes y pasaportes NO se muestran en:
- Modal de confirmación de pagos
- VueloDetail (detalle de vuelo)

**Causa raíz:** El bucket `vuelos-adjuntos` NO está configurado como público y NO tiene RLS policies.

---

## Solución

### Paso 1: Ejecutar Migration en Supabase
1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Copiar contenido de: `fix_vuelos_adjuntos_storage_public.sql`
3. Ejecutar el script completo
4. Verificar que no haya errores

### Paso 2: Verificar Bucket
1. Ir a **Storage** → **vuelos-adjuntos**
2. Verificar que el bucket aparezca como **Public** ✅
3. Si no aparece, ejecutar manualmente:
   ```sql
   UPDATE storage.buckets
   SET public = true
   WHERE id = 'vuelos-adjuntos';
   ```

### Paso 3: Verificar Policies
1. Ir a **Storage** → **Policies**
2. Debe haber 4 policies para `vuelos-adjuntos`:
   - ✅ Public read access
   - ✅ Authenticated upload
   - ✅ Authenticated update
   - ✅ Authenticated delete

### Paso 4: Probar URL Directa
1. Tomar una URL de `vuelos_adjuntos.url_storage`
2. Abrirla en el navegador
3. Debe mostrar la imagen SIN requerir autenticación

---

## Qué hace el script

```sql
-- Hace el bucket PÚBLICO
UPDATE storage.buckets SET public = true WHERE id = 'vuelos-adjuntos';

-- Permite lectura pública (cualquier persona puede ver las imágenes)
CREATE POLICY "Public read access for vuelos-adjuntos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vuelos-adjuntos');

-- Permite subida solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload..."
```

---

## Por qué funciona en Conversaciones pero NO en Vuelos

**Conversaciones:**
- Su bucket tiene RLS policies configuradas ✅
- `MessageBubble.js` usa `file_url` directamente

**Vuelos (antes del fix):**
- Bucket NO público ❌
- Sin RLS policies ❌
- Las URLs devuelven 403 Forbidden

**Vuelos (después del fix):**
- Bucket público ✅
- RLS policies correctas ✅
- Las URLs funcionan igual que en conversaciones ✅

---

## Verificación Final

Después de ejecutar el script, las imágenes deben renderizarse en:
1. `/admin/confirmar-pagos` (modal de confirmación)
2. `/ventas/vuelos/[id]` (detalle de vuelo)

Sin necesidad de cambiar código frontend.
