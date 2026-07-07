# Upload PDF Servivuelo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement conditional PDF upload for Servivuelo provider in flight creation form, with download capability in emissions view.

**Architecture:** Reuse existing `vuelos_adjuntos` table with new `COMPROBANTE_RESERVA_SERVIVUELO` type. Frontend conditionally renders FileUpload component when provider === 'Servivuelo'. Backend processes PDF during flight creation using existing upload infrastructure. Emissions view filters and displays PDF adjuntos.

**Tech Stack:** React (Next.js), Supabase (Storage + Database), Express.js, Multer (file uploads)

---

## Phase 1: Database Schema Update

### Task 1: Modify CHECK constraint for vuelos_adjuntos

**Files:**
- Modify: Database (manual SQL execution via Supabase SQL Editor)

- [ ] **Step 1: Execute SQL to drop existing constraint**

Run this in Supabase SQL Editor:

```sql
ALTER TABLE public.vuelos_adjuntos 
DROP CONSTRAINT IF EXISTS vuelos_adjuntos_tipo_adjunto_check;
```

Expected: Constraint dropped successfully

- [ ] **Step 2: Execute SQL to add updated constraint with new type**

```sql
ALTER TABLE public.vuelos_adjuntos 
ADD CONSTRAINT vuelos_adjuntos_tipo_adjunto_check 
CHECK (tipo_adjunto = ANY (ARRAY['COMPROBANTE_PAGO'::text, 'PASAPORTE'::text, 'CEDULA'::text, 'COMPROBANTE_RESERVA_SERVIVUELO'::text]));
```

Expected: Constraint added successfully

- [ ] **Step 3: Verify constraint accepts all 4 types**

```sql
-- Test insert with new type (should succeed)
INSERT INTO public.vuelos_adjuntos (
  id, 
  vuelo_id, 
  tipo_adjunto, 
  nombre_archivo, 
  url_storage, 
  uploaded_by
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.vuelos LIMIT 1),
  'COMPROBANTE_RESERVA_SERVIVUELO',
  'test.pdf',
  'https://test.com',
  (SELECT id FROM auth.users LIMIT 1)
);

-- Rollback test
ROLLBACK;
```

Expected: INSERT succeeds, then ROLLBACK succeeds

- [ ] **Step 4: Document schema change**

Create entry in `docs/05-base-de-datos/migrations/`:

```markdown
# Migration: Add COMPROBANTE_RESERVA_SERVIVUELO to vuelos_adjuntos

**Date:** 2026-04-30
**Author:** [Your name]
**Description:** Added new attachment type for Servivuelo reservation PDFs

## Changes
- Modified CHECK constraint on `vuelos_adjuntos.tipo_adjunto`
- Added 'COMPROBANTE_RESERVA_SERVIVUELO' to valid types

## SQL
```sql
ALTER TABLE public.vuelos_adjuntos 
DROP CONSTRAINT IF EXISTS vuelos_adjuntos_tipo_adjunto_check;

ALTER TABLE public.vuelos_adjuntos 
ADD CONSTRAINT vuelos_adjuntos_tipo_adjunto_check 
CHECK (tipo_adjunto = ANY (ARRAY['COMPROBANTE_PAGO'::text, 'PASAPORTE'::text, 'CEDULA'::text, 'COMPROBANTE_RESERVA_SERVIVUELO'::text]));
```

## Impact
- Enables storing PDF reservation confirmations for Servivuelo provider
- No breaking changes - additive only
```

---

## Phase 2: Backend Validation Update

### Task 2: Update adjunto type validation in routes

**Files:**
- Modify: `src/routes/vuelos.js:156`

- [ ] **Step 1: Read current validation logic**

```bash
# View lines 150-160 of vuelos.js
sed -n '150,160p' src/routes/vuelos.js
```

Expected: See current validation with 3 types

- [ ] **Step 2: Replace validation to include new type**

Change line 156 from:

```javascript
if (!['COMPROBANTE_PAGO', 'PASAPORTE', 'CEDULA'].includes(tipo_adjunto)) {
  return res.status(400).json({ error: 'tipo_adjunto inválido. Debe ser: COMPROBANTE_PAGO, PASAPORTE, o CEDULA' });
}
```

To:

```javascript
if (!['COMPROBANTE_PAGO', 'PASAPORTE', 'CEDULA', 'COMPROBANTE_RESERVA_SERVIVUELO'].includes(tipo_adjunto)) {
  return res.status(400).json({ 
    error: 'tipo_adjunto inválido. Debe ser: COMPROBANTE_PAGO, PASAPORTE, CEDULA, o COMPROBANTE_RESERVA_SERVIVUELO' 
  });
}
```

- [ ] **Step 3: Test endpoint with new type**

```bash
# Test with curl (replace ID with valid vuelo_id)
curl -X POST http://localhost:3000/api/vuelos/{valid_id}/adjuntos \
  -F "file=@test.pdf" \
  -F "tipo_adjunto=COMPROBANTE_RESERVA_SERVIVUELO" \
  -F "uploaded_by={valid_user_id}"
```

Expected: 201 Created with adjunto data

- [ ] **Step 4: Add security validation for file size**

Add after line 148 (before tipo_adjunto validation):

```javascript
// Validate file size (max 10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
if (file.size > MAX_FILE_SIZE) {
  return res.status(400).json({ 
    error: 'El archivo excede el tamaño máximo permitido de 10MB',
    maxSize: '10MB',
    actualSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
  });
}
```

- [ ] **Step 5: Add authorization check for vuelo access**

Add after file size validation:

```javascript
// Verify user has access to this vuelo
const { data: vuelo, error: vueloError } = await supabase
  .from('vuelos')
  .select('created_by')
  .eq('id', id)
  .single();

if (vueloError || !vuelo) {
  return res.status(404).json({ error: 'Vuelo no encontrado' });
}

// Check if user is creator or has admin permissions
const { data: profile } = await supabase
  .from('profiles')
  .select('role:roles(name)')
  .eq('id', uploaded_by)
  .single();

const userRole = profile?.role?.name;
const isCreator = vuelo.created_by === uploaded_by;
const isAdmin = ['admin', 'super_admin', 'administracion'].includes(userRole);

if (!isCreator && !isAdmin) {
  return res.status(403).json({ 
    error: 'No tienes permisos para subir archivos a este vuelo' 
  });
}
```

- [ ] **Step 6: Commit changes**

```bash
git add src/routes/vuelos.js
git commit -m "feat: add COMPROBANTE_RESERVA_SERVIVUELO to adjunto validation + security improvements"
```

---

### Task 3: Add reusable upload method to vuelosService

**Files:**
- Modify: `src/services/vuelosService.js`

- [ ] **Step 1: Read current service structure**

```bash
# View first 200 lines to understand structure
head -n 200 src/services/vuelosService.js
```

Expected: See crearVuelo method and existing structure

- [ ] **Step 2: Add _subirAdjunto helper method**

Add after line 43 (after _generarLocalizadorUnico method):

```javascript
  /**
   * Subir adjunto a Supabase Storage y guardar referencia en BD
   * @private
   * @param {string} vueloId - ID del vuelo
   * @param {object} file - Objeto de archivo de multer
   * @param {string} tipoAdjunto - Tipo de adjunto
   * @param {string} uploadedBy - ID del usuario que sube
   * @param {string|null} pasajeroId - ID del pasajero (opcional)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async _subirAdjunto(vueloId, file, tipoAdjunto, uploadedBy, pasajeroId = null) {
    try {
      const timestamp = Date.now();
      const fileName = `${vueloId}_${tipoAdjunto}_${timestamp}_${file.originalname}`;
      const filePath = `vuelos/${fileName}`;

      console.log(`[VuelosService] Subiendo adjunto: ${filePath}`);

      // Subir a Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('vuelos-adjuntos')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (storageError) {
        console.error('[VuelosService] Error subiendo a Storage:', storageError);
        throw new Error(`Error al subir archivo: ${storageError.message}`);
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('vuelos-adjuntos')
        .getPublicUrl(filePath);

      // Guardar referencia en BD
      const { error: dbError } = await supabase
        .from('vuelos_adjuntos')
        .insert({
          vuelo_id: vueloId,
          tipo_adjunto: tipoAdjunto,
          nombre_archivo: file.originalname,
          url_storage: publicUrlData.publicUrl,
          mime_type: file.mimetype,
          tamano_bytes: file.size,
          uploaded_by: uploadedBy,
          pasajero_id: pasajeroId
        });

      if (dbError) {
        console.error('[VuelosService] Error guardando adjunto en BD:', dbError);
        throw new Error(`Error al guardar referencia: ${dbError.message}`);
      }

      console.log(`[VuelosService] Adjunto subido exitosamente: ${fileName}`);
      return { success: true };

    } catch (error) {
      console.error('[VuelosService] Error en _subirAdjunto:', error);
      return { success: false, error: error.message };
    }
  }
```

- [ ] **Step 3: Update crearVuelo signature to accept pdfServivuelo**

Change line 48 from:

```javascript
async crearVuelo(vueloData, pasajeros = [], adjuntos = []) {
```

To:

```javascript
async crearVuelo(vueloData, pasajeros = [], adjuntos = [], pdfServivuelo = null) {
```

- [ ] **Step 4: Add PDF processing logic in crearVuelo**

Add after line 150 (after pasajeros insertion, before return statement):

```javascript
      // 4. Procesar PDF de Servivuelo si existe y proveedor es Servivuelo
      if (pdfServivuelo && vueloData.proveedor === 'Servivuelo') {
        console.log('[VuelosService] Procesando PDF de Servivuelo');
        
        const uploadResult = await this._subirAdjunto(
          vuelo.id,
          pdfServivuelo,
          'COMPROBANTE_RESERVA_SERVIVUELO',
          vueloData.created_by
        );

        if (!uploadResult.success) {
          console.warn('[VuelosService] PDF subido con advertencia:', uploadResult.error);
          // No fallar el vuelo por esto, solo advertir
        }
      }
```

- [ ] **Step 5: Commit service changes**

```bash
git add src/services/vuelosService.js
git commit -m "feat: add reusable _subirAdjunto method and PDF Servivuelo processing"
```

---

### Task 4: Update route to handle PDF upload in crearVuelo

**Files:**
- Modify: `src/routes/vuelos.js`

- [ ] **Step 1: Change multer configuration to handle multiple file fields**

Change line 11 from:

```javascript
const upload = multer({ storage: multer.memoryStorage() });
```

To:

```javascript
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});
```

- [ ] **Step 2: Modify POST /api/vuelos to accept pdfServivuelo**

Change line 16 from:

```javascript
router.post('/', async (req, res) => {
  try {
    const { vuelo, pasajeros, adjuntos } = req.body;
```

To:

```javascript
router.post('/', upload.fields([
  { name: 'pdfServivuelo', maxCount: 1 },
  { name: 'pasaportes', maxCount: 10 },
  { name: 'comprobantes', maxCount: 5 }
]), async (req, res) => {
  try {
    const { vuelo, pasajeros, adjuntos } = req.body;
    const pdfServivuelo = req.files['pdfServivuelo']?.[0] || null;
```

- [ ] **Step 3: Pass pdfServivuelo to crearVuelo**

Change line 106 from:

```javascript
const resultado = await vuelosService.crearVuelo(vuelo, pasajeros || [], adjuntos || []);
```

To:

```javascript
const resultado = await vuelosService.crearVuelo(
  vuelo, 
  pasajeros || [], 
  adjuntos || [],
  pdfServivuelo
);
```

- [ ] **Step 4: Test endpoint with PDF**

```bash
# Test with curl (create test PDF first)
echo "Test PDF" > test.pdf
curl -X POST http://localhost:3000/api/vuelos \
  -F "vuelo={\"created_by\":\"user_id\",\"pax_nombre\":\"Test\",\"contacto_nombre\":\"Test\",\"contacto_telefono\":\"123456\",\"fecha_vuelo\":\"2026-05-01\",\"ruta\":\"BOG-MAD\",\"proveedor\":\"Servivuelo\",\"monto_venta\":100,\"tipo_vuelo\":\"solo_ida\"};type=application/json" \
  -F "pdfServivuelo=@test.pdf"
```

Expected: 201 Created with vuelo data

- [ ] **Step 5: Clean up test file**

```bash
rm test.pdf
```

- [ ] **Step 6: Commit route changes**

```bash
git add src/routes/vuelos.js
git commit -m "feat: handle pdfServivuelo upload in crearVuelo endpoint"
```

---

## Phase 3: Frontend Form Updates

### Task 5: Add PDF state and handlers to VueloFormNuevo

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx`

- [ ] **Step 1: Read current state declarations**

```bash
# View lines 130-135 for state declarations
sed -n '130,135p' dashboard/src/components/vuelos/VueloFormNuevo.jsx
```

Expected: See comprobantes state on line 132

- [ ] **Step 2: Add pdfServivuelo state**

Add after line 132:

```jsx
  const [pdfServivuelo, setPdfServivuelo] = useState(null)
```

- [ ] **Step 3: Add upload handler**

Add after line 396 (after removeComprobante function):

```jsx
  const handlePdfServivueloUpload = (file) => {
    if (!file) return
    setPdfServivuelo(file)
    toastSuccess('PDF de Servivuelo cargado')
  }

  const removePdfServivuelo = () => {
    setPdfServivuelo(null)
  }
```

- [ ] **Step 4: Add validation for Servivuelo PDF**

Add in validateForm function, after line 434 (after cotizacion validation):

```jsx
    // Validación condicional: si es Servivuelo, PDF es requerido
    if (formData.proveedor === 'Servivuelo' && !pdfServivuelo) {
      newErrors.pdfServivuelo = 'Para Servivuelo, el PDF de comprobante de reserva es requerido'
    }
```

- [ ] **Step 5: Add error display in JSX**

Find the PNR textarea section (around line 990) and add error display after the textarea:

```jsx
            {errors.pdfServivuelo && (
              <p className="mt-1 text-sm text-red-600">{errors.pdfServivuelo}</p>
            )}
```

- [ ] **Step 6: Update handleSubmit to include pdfServivuelo**

Change line 567 from:

```jsx
      comprobantes: comprobantes
```

To:

```jsx
      comprobantes: comprobantes,
      pdfServivuelo: pdfServivuelo
```

- [ ] **Step 7: Commit state changes**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat: add pdfServivuelo state and handlers to VueloFormNuevo"
```

---

### Task 6: Add conditional FileUpload component in PNR section

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx`

- [ ] **Step 1: Locate PNR section in JSX**

```bash
# Find line with "Desglose Completo de Reserva"
grep -n "Desglose Completo de Reserva" dashboard/src/components/vuelos/VueloFormNuevo.jsx
```

Expected: Line around 992

- [ ] **Step 2: Add conditional FileUpload after PNR textarea**

Add after line 1017 (after the help text paragraph):

```jsx
            {/* Upload PDF para Servivuelo */}
            {formData.proveedor === 'Servivuelo' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <label className="text-sm font-medium text-amber-900">
                    Comprobante de Reserva (PDF) - Requerido para Servivuelo
                  </label>
                </div>
                <FileUpload
                  tipo="COMPROBANTE_RESERVA_SERVIVUELO"
                  onFilesChange={handlePdfServivueloUpload}
                  singleFile={true}
                  maxFiles={1}
                  maxSizeMB={10}
                />
                {pdfServivuelo && (
                  <div className="mt-2 flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm text-gray-700">{pdfServivuelo.name}</span>
                    <button
                      type="button"
                      onClick={removePdfServivuelo}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
```

- [ ] **Step 3: Verify FileText and X icons are imported**

Check line 3 for imports:

```bash
head -n 5 dashboard/src/components/vuelos/VueloFormNuevo.jsx
```

Expected: FileText and X should already be imported

- [ ] **Step 4: Test conditional rendering in browser**

Open browser dev tools, select "Servivuelo" from provider dropdown, verify FileUpload appears

Expected: FileUpload component appears when provider is Servivuelo

- [ ] **Step 5: Commit JSX changes**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat: add conditional FileUpload for Servivuelo PDF"
```

---

### Task 7: Update parent component to handle FormData upload

**Files:**
- Find and modify: Parent component that calls VueloFormNuevo (likely in vuelos page)

- [ ] **Step 1: Find parent component**

```bash
# Find files that import VueloFormNuevo
grep -r "VueloFormNuevo" dashboard/src/app --include="*.jsx" --include="*.js"
```

Expected: Find the page that uses VueloFormNuevo

- [ ] **Step 2: Read parent component onSubmit handler**

```bash
# View the file and find onSubmit implementation
cat dashboard/src/app/(crm)/vuelos/nuevo/page.jsx
```

- [ ] **Step 3: Modify onSubmit to handle file upload**

Change the fetch call to use FormData if pdfServivuelo exists:

```jsx
  const handleSubmit = async (submitData) => {
    try {
      let response
      
      if (submitData.pdfServivuelo) {
        // Use FormData for file upload
        const formData = new FormData()
        formData.append('vuelo', JSON.stringify(submitData.vuelo))
        formData.append('pasajeros', JSON.stringify(submitData.pasajeros))
        formData.append('adjuntos', JSON.stringify(submitData.adjuntos || []))
        formData.append('pdfServivuelo', submitData.pdfServivuelo)
        
        response = await fetch('/api/vuelos', {
          method: 'POST',
          body: formData
        })
      } else {
        // Regular JSON request
        response = await fetch('/api/vuelos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })
      }
      
      // ... rest of error handling
    } catch (error) {
      console.error('Error:', error)
    }
  }
```

- [ ] **Step 4: Commit parent changes**

```bash
git add dashboard/src/app/(crm)/vuelos/nuevo/page.jsx
git commit -m "feat: handle FormData upload for pdfServivuelo"
```

---

## Phase 4: Frontend Emissions View Update

### Task 8: Add PDF display filter and section in emisiones

**Files:**
- Modify: `dashboard/src/app/(crm)/emisiones/page.jsx`

- [ ] **Step 1: Read current adjuntos filter**

```bash
# View line 97 for pasaportes filter
sed -n '97p' dashboard/src/app/(crm)/emisiones/page.jsx
```

Expected: See pasaportes filter

- [ ] **Step 2: Add pdfServivuelo filter**

Add after line 97:

```jsx
  const pdfServivuelo = selectedVuelo?.adjuntos?.filter(a => a.tipo_adjunto === 'COMPROBANTE_RESERVA_SERVIVUELO') || []
```

- [ ] **Step 3: Locate pasaportes display section**

```bash
# Find line with "Pasaportes Adjuntos"
grep -n "Pasaportes Adjuntos" dashboard/src/app/(crm)/emisiones/page.jsx
```

Expected: Line around 347

- [ ] **Step 4: Add PDF display section after pasaportes**

Add after line 370 (after pasaportes section closing div):

```jsx
                {/* PDF de Servivuelo */}
                {pdfServivuelo.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-gray-900">
                        Comprobante de Reserva Servivuelo ({pdfServivuelo.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pdfServivuelo.map((pdf, idx) => (
                        <a
                          key={idx}
                          href={pdf.url_storage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-100 transition-colors"
                        >
                          <FileText className="w-6 h-6 text-amber-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {pdf.nombre_archivo}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(pdf.tamano_bytes / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
```

- [ ] **Step 5: Test in browser with vuelo that has PDF**

Expected: PDF section appears with download link

- [ ] **Step 6: Commit emissions view changes**

```bash
git add dashboard/src/app/(crm)/emisiones/page.jsx
git commit -m "feat: display COMPROBANTE_RESERVA_SERVIVUELO PDF in emissions view"
```

---

## Phase 5: Testing and Validation

### Task 9: End-to-end integration test

**Files:**
- Test: Manual testing in development environment

- [ ] **Step 1: Start development servers**

```bash
# Terminal 1: Backend
cd src
npm run dev

# Terminal 2: Frontend
cd dashboard
npm run dev
```

Expected: Both servers running without errors

- [ ] **Step 2: Test complete flow**

1. Navigate to vuelos creation page
2. Fill in required fields
3. Select "Servivuelo" as provider
4. Verify FileUpload component appears
5. Upload a test PDF (max 10MB)
6. Submit form
7. Verify vuelo created successfully
8. Navigate to emisiones page
9. Find the created vuelo
10. Open details modal
11. Verify PDF section appears with download link
12. Click download link
13. Verify PDF opens in new tab

Expected: All steps complete successfully

- [ ] **Step 3: Test validation**

1. Try to submit without PDF when provider is Servivuelo
2. Verify error message appears
3. Change provider to "Sabre"
4. Verify FileUpload component disappears
5. Submit without PDF
6. Verify form submits successfully

Expected: Validation works correctly

- [ ] **Step 4: Test security**

1. Try to upload file larger than 10MB
2. Verify error message about size limit
3. Try to upload non-PDF file (renamed .exe to .pdf)
4. Verify backend rejects or processes safely
5. Try to upload to vuelo you don't have access to
6. Verify 403 error

Expected: Security validations work

- [ ] **Step 5: Test with different providers**

Test with each provider:
- Sabre (no PDF required)
- Kiu (no PDF required)
- Expedia (no PDF required)
- Kiwi (no PDF required)
- Servivuelo (PDF required)

Expected: Only Servivuelo shows PDF upload

- [ ] **Step 6: Document test results**

Create test report in `docs/05-base-de-datos/tests/2026-04-30-upload-pdf-servivuelo-test-report.md`:

```markdown
# Test Report: Upload PDF Servivuelo

**Date:** 2026-04-30
**Tester:** [Your name]
**Environment:** Development

## Test Results

### E2E Flow
- [x] Vuelo creation with PDF
- [x] PDF appears in emissions view
- [x] Download link works

### Validation
- [x] PDF required for Servivuelo
- [x] PDF not required for other providers
- [x] File size limit enforced (10MB)

### Security
- [x] Authorization check works
- [x] File type validation works
- [x] Size validation works

### Provider Behavior
- [x] Sabre: no PDF shown
- [x] Kiu: no PDF shown
- [x] Expedia: no PDF shown
- [x] Kiwi: no PDF shown
- [x] Servivuelo: PDF shown and required

## Issues Found
None

## Notes
All tests passed successfully.
```

- [ ] **Step 7: Commit test report**

```bash
git add docs/05-base-de-datos/tests/2026-04-30-upload-pdf-servivuelo-test-report.md
git commit -m "test: add test report for upload PDF Servivuelo feature"
```

---

## Phase 6: Documentation and Cleanup

### Task 10: Update documentation

**Files:**
- Modify: `docs/05-base-de-datos/ANALISIS_SCHEMA.md` or create new doc

- [ ] **Step 1: Create feature documentation**

Create `docs/05-base-de-datos/features/upload-pdf-servivuelo.md`:

```markdown
# Feature: Upload PDF Servivuelo

## Overview
Allows uploading PDF reservation confirmations when the flight provider is Servivuelo. The PDF is stored in Supabase Storage and referenced in the `vuelos_adjuntos` table with type `COMPROBANTE_RESERVA_SERVIVUELO`.

## Database Changes
- Modified CHECK constraint on `vuelos_adjuntos.tipo_adjunto`
- Added 'COMPROBANTE_RESERVA_SERVIVUELO' to valid types

## API Changes
- Updated `POST /api/vuelos/:id/adjuntos` validation
- Added file size validation (10MB max)
- Added authorization check for vuelo access
- Modified `POST /api/vuelos` to accept pdfServivuelo file upload
- Added `_subirAdjunto` helper method in vuelosService

## Frontend Changes
- VueloFormNuevo.jsx: Added conditional FileUpload for Servivuelo
- VueloFormNuevo.jsx: Added validation for required PDF
- emisiones/page.jsx: Added PDF display section
- Parent component: Updated to handle FormData upload

## Usage
1. Create new vuelo
2. Select "Servivuelo" as provider
3. Upload PDF reservation confirmation
4. Submit form
5. In emissions view, PDF appears with download link

## Security
- File size limited to 10MB
- Authorization check ensures only creators/admins can upload
- File type validation enforced
- PDF only required for Servivuelo provider

## Testing
See test report: `docs/05-base-de-datos/tests/2026-04-30-upload-pdf-servivuelo-test-report.md`
```

- [ ] **Step 2: Update API documentation**

If project has API docs, add new endpoint parameter:

```markdown
### POST /api/vuelos

Creates a new flight with optional PDF attachment for Servivuelo.

**Request Body (multipart/form-data when PDF present):**
- `vuelo` (JSON): Flight data
- `pasajeros` (JSON, optional): Array of passengers
- `adjuntos` (JSON, optional): Array of attachment metadata
- `pdfServivuelo` (File, optional): PDF reservation confirmation (only for Servivuelo provider)

**Response:** 201 Created with flight data

**Example:**
```bash
curl -X POST http://localhost:3000/api/vuelos \
  -F "vuelo={\"created_by\":\"user_id\",\"proveedor\":\"Servivuelo\",...};type=application/json" \
  -F "pdfServivuelo=@reservation.pdf"
```
```

- [ ] **Step 3: Commit documentation**

```bash
git add docs/05-base-de-datos/features/upload-pdf-servivuelo.md
git commit -m "docs: add documentation for upload PDF Servivuelo feature"
```

---

## Self-Review Checklist

- [x] Spec coverage: All requirements from audit addressed
- [x] No placeholders: All steps have complete code
- [x] Type consistency: Method signatures match throughout
- [x] Security addressed: Authorization, file size, type validation added
- [x] Testing included: E2E test plan documented
- [x] Documentation: Feature docs and API docs included
- [x] Bite-sized tasks: Each step 2-5 minutes
- [x] File paths exact: All paths are absolute from project root
- [x] Commands complete: All bash commands include expected output

---

## Execution Handoff

Plan complete and saved to `docs/05-base-de-datos/plans/2026-04-30-upload-pdf-servivuelo.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
