# FileUpload Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar FileUpload.jsx en VueloFormNuevo.jsx y VueloFormEditar.jsx para reemplazar la implementación actual de upload de archivos con drag & drop real, validación centralizada y UI mejorada.

**Architecture:** Modificar FileUpload.jsx para soportar modo individual (pasaportes) y modo array (comprobantes), luego reemplazar las implementaciones actuales en ambos formularios manteniendo la integración con extracción IA y estados existentes.

**Tech Stack:** React hooks, TypeScript/JavaScript, Tailwind CSS, validación de archivos, drag & drop API, integración con extracción de documentos mediante IA.

---

## File Structure

**Files to modify:**
- `dashboard/src/components/vuelos/FileUpload.jsx` - Agregar soporte para singleFile mode
- `dashboard/src/components/vuelos/VueloFormNuevo.jsx` - Reemplazar 2 secciones de upload
- `dashboard/src/components/vuelos/VueloFormEditar.jsx` - Reemplazar 2 secciones de upload

**Files to reference:**
- `dashboard/src/components/vuelos/VueloForm.jsx` - Implementación legacy a eliminar
- `dashboard/src/app/api/extract-cedula/route.js` - Endpoint de extracción IA
- `dashboard/src/lib/utils/documentHelpers.js` - Utilidades de documentos

---

## Task 1: Enhanced FileUpload Component

**Files:**
- Modify: `dashboard/src/components/vuelos/FileUpload.jsx`

- [ ] **Step 1: Add singleFile prop support**

```javascript
// Add to props destructuring (line 5)
export default function FileUpload({ 
  tipo, 
  onFilesChange, 
  maxFiles = 5,
  maxSizeMB = 10,
  unlimited = false,
  singleFile = false // NEW: Support individual files
}) {
```

- [ ] **Step 2: Modify handleFiles for single file mode**

```javascript
// Replace handleFiles function (lines 28-51)
const handleFiles = useCallback((newFiles) => {
  setError('')
  const fileArray = Array.from(newFiles)

  // Single file mode - only accept first file
  if (singleFile) {
    const file = fileArray[0]
    if (!file) return
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setFiles([file])
    onFilesChange(file) // Pass individual file, not array
    return
  }

  // Array mode - existing logic
  if (!unlimited && files.length + fileArray.length > maxFiles) {
    setError(`Máximo ${maxFiles} archivos permitidos`)
    return
  }

  const validFiles = []
  for (const file of fileArray) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    validFiles.push(file)
  }

  const updatedFiles = [...files, ...validFiles]
  setFiles(updatedFiles)
  onFilesChange(updatedFiles)
}, [files, maxFiles, onFilesChange, singleFile, unlimited])
```

- [ ] **Step 3: Update file display for single file mode**

```javascript
// Modify files display section (lines 145-176)
{files.length > 0 && (
  <div className="space-y-2">
    <p className="text-sm font-medium text-gray-700">
      {singleFile 
        ? 'Archivo seleccionado' 
        : `Archivos seleccionados (${files.length}${unlimited ? '' : `/${maxFiles}`})`
      }
    </p>
    {files.map((file, index) => (
      <div
        key={index}
        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getFileIcon(file)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeFile(index)}
          className="ml-3 p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 4: Update input for single file mode**

```javascript
// Modify input attributes (lines 117-124)
<input
  type="file"
  id={`file-upload-${tipo}`}
  className="hidden"
  multiple={!singleFile} // Single mode: no multiple
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={handleChange}
/>
```

- [ ] **Step 5: Test FileUpload component**

```bash
# Run development server
npm run dev

# Navigate to vuelos forms and test:
# 1. Single file mode (should accept only 1 file)
# 2. Array mode (should accept multiple files)
# 3. Drag & drop functionality
# 4. File validation (type and size)
```

- [ ] **Step 6: Commit FileUpload changes**

```bash
git add dashboard/src/components/vuelos/FileUpload.jsx
git commit -m "feat: add singleFile mode to FileUpload component"
```

---

## Task 2: VueloFormNuevo Integration

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx`

- [ ] **Step 1: Import FileUpload component**

```javascript
// Add to imports (line 3)
import { Plane, Users, Calendar, DollarSign, FileText, Upload, X, Copy, CheckCircle, AlertCircle, Sparkles, Loader2, MapPin, Clock } from 'lucide-react'
import { toastSuccess, toastError, toastInfo } from '@/helpers/toasts'
import { METHODS_BY_CURRENCY } from '@/lib/cotizador/paymentConfig'
import AerolineaAutocomplete from '@/components/cotizador/AerolineaAutocomplete'
import FileUpload from '@/components/vuelos/FileUpload' // NEW IMPORT
```

- [ ] **Step 2: Modify handlePasaporteUpload for FileUpload**

```javascript
// Replace handlePasaporteUpload function (lines 174-192)
const handlePasaporteUpload = (index, file) => {
  if (!file) return

  // FileUpload already validates, just handle the file
  handlePasajeroChange(index, 'pasaporte_file', file)
  toastSuccess(`Pasaporte cargado: ${file.name}`)
}
```

- [ ] **Step 3: Modify handleComprobanteUpload for FileUpload**

```javascript
// Replace handleComprobanteUpload function (lines 372-398)
const handleComprobanteUpload = (files) => {
  // FileUpload already validates files and returns array
  const validFiles = Array.isArray(files) ? files : [files]
  
  setComprobantes(prev => [...prev, ...validFiles])
  toastSuccess(`${validFiles.length} comprobante(s) agregado(s)`)
}
```

- [ ] **Step 4: Replace passport upload UI**

```javascript
// Replace passport upload section (lines 1367-1384)
{/* Upload Pasaporte/Cédula */}
<div className="md:col-span-3">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    {pasajero.tipo_documento === 'PASAPORTE' ? 'Pasaporte (Foto/PDF)' : 'Cédula (Foto/PDF)'}
  </label>
  <FileUpload
    tipo="PASAPORTE"
    onFilesChange={(file) => handlePasaporteUpload(index, file)}
    maxFiles={1}
    singleFile={true}
    maxSizeMB={10}
  />
  
  {/* Existing file display and AI extraction button */}
  {pasajero.pasaporte_file && (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">{pasajero.pasaporte_file.name}</span>
        </div>
        <button
          type="button"
          onClick={() => removePasaporte(index)}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Botón de Extracción Automática con IA - Para pasaportes y cédulas */}
      {pasajero.pasaporte_file.type.startsWith('image/') && (
        <button
          type="button"
          onClick={() => extractDocumentData(index)}
          disabled={extractingPassport[index]}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${pasajero.tipo_documento === 'CEDULA'
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
          }`}
        >
          {extractingPassport[index] ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extrayendo datos...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Extraer datos con IA
            </>
          )}
        </button>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 5: Replace comprobante upload UI**

```javascript
// Replace comprobante upload section (lines 1554-1564)
<div className="space-y-4">
  <FileUpload
    tipo="COMPROBANTE_PAGO"
    onFilesChange={handleComprobanteUpload}
    maxFiles={10}
    unlimited={formData.metodo_pago?.includes('Depósito oficina') || formData.metodo_pago?.includes('efectivo')}
    maxSizeMB={10}
  />

  {comprobantes.length > 0 && (
    <div className="space-y-2">
      {comprobantes.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700">{file.name}</span>
          <button
            type="button"
            onClick={() => removeComprobante(index)}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 6: Test VueloFormNuevo integration**

```bash
# Navigate to /ventas/vuelos/nuevo
# Test:
# 1. Upload individual passport files
# 2. Upload multiple comprobante files
# 3. Drag & drop functionality
# 4. AI extraction integration
# 5. Form submission with files
```

- [ ] **Step 7: Commit VueloFormNuevo changes**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat: integrate FileUpload in VueloFormNuevo"
```

---

## Task 3: VueloFormEditar Integration

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormEditar.jsx`

- [ ] **Step 1: Import FileUpload component**

```javascript
// Add to imports (line 3)
import { Plane, Users, DollarSign, FileText, Upload, X, CheckCircle, AlertCircle, Sparkles, Loader2, MapPin, Clock, Edit3, History } from 'lucide-react'
import { toastSuccess, toastError, toastInfo } from '@/helpers/toasts'
import Swal from 'sweetalert2'
import { TIPOS_VUELO, PROVEEDORES, SEXOS, TIPOS_DOCUMENTO, PAISES_CEDULA } from '@/lib/constants/vuelosConstants'
import { formatCedulaByCountry } from '@/lib/utils/documentHelpers'
import FileUpload from '@/components/vuelos/FileUpload' // NEW IMPORT
```

- [ ] **Step 2: Modify handlePasaporteUpload for FileUpload**

```javascript
// Replace handlePasaporteUpload function (lines 106-130)
const handlePasaporteUpload = (index, file) => {
  if (!file) return

  // FileUpload already validates, just handle the file
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  if (!validTypes.includes(file.type)) {
    toastError('Solo se permiten imágenes (JPG, PNG) o PDF')
    return
  }

  handlePasajeroChange(index, 'pasaporte_file_nuevo', file)
  toastSuccess(`Nuevo pasaporte cargado: ${file.name}`)
}
```

- [ ] **Step 3: Modify handleComprobanteUpload for FileUpload**

```javascript
// Replace handleComprobanteUpload function (lines 232-250)
const handleComprobanteUpload = (files) => {
  // FileUpload already validates files and returns array
  const validFiles = Array.isArray(files) ? files : [files]
  
  if (comprobantesNuevos.length + validFiles.length > 10) {
    toastError('Máximo 10 comprobantes permitidos')
    return
  }

  setComprobantesNuevos(prev => [...prev, ...validFiles])
  toastSuccess(`${validFiles.length} comprobante(s) agregado(s)`)
}
```

- [ ] **Step 4: Replace new passport upload UI**

```javascript
// Replace new passport upload section (lines 902-914)
{/* Nuevo documento */}
<div className="md:col-span-3">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Cambiar {pasajero.tipo_documento === 'PASAPORTE' ? 'Pasaporte' : 'Cédula'} (opcional)
  </label>
  <FileUpload
    tipo="PASAPORTE"
    onFilesChange={(file) => handlePasaporteUpload(index, file)}
    maxFiles={1}
    singleFile={true}
    maxSizeMB={10}
  />
  
  {/* Existing new file display and AI extraction */}
  {pasajero.pasaporte_file_nuevo && (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">{pasajero.pasaporte_file_nuevo.name}</span>
        </div>
        <button
          type="button"
          onClick={() => removePasaporteNuevo(index)}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Extracción IA para pasaportes y cédulas */}
      {pasajero.pasaporte_file_nuevo.type.startsWith('image/') && (
        <button
          type="button"
          onClick={() => extractDocumentData(index)}
          disabled={extractingPassport[index]}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-all disabled:opacity-50 ${pasajero.tipo_documento === 'CEDULA'
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
          }`}
        >
          {extractingPassport[index] ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extrayendo datos...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Extraer datos con IA
            </>
          )}
        </button>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 5: Replace new comprobante upload UI**

```javascript
// Replace new comprobante upload section (lines 972-982)
<div className="space-y-4">
  <FileUpload
    tipo="COMPROBANTE_PAGO"
    onFilesChange={handleComprobanteUpload}
    maxFiles={10}
    maxSizeMB={10}
  />

  {comprobantesNuevos.length > 0 && (
    <div className="space-y-2">
      {comprobantesNuevos.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700">{file.name}</span>
          <button
            type="button"
            onClick={() => removeComprobanteNuevo(index)}
            className="text-red-600 hover:text-red-700"
        >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 6: Test VueloFormEditar integration**

```bash
# Navigate to /ventas/vuelos/[id]/editar
# Test:
# 1. Upload new passport files
# 2. Upload new comprobante files
# 3. Drag & drop functionality
# 4. AI extraction integration
# 5. Form submission with new files
```

- [ ] **Step 7: Commit VueloFormEditar changes**

```bash
git add dashboard/src/components/vuelos/VueloFormEditar.jsx
git commit -m "feat: integrate FileUpload in VueloFormEditar"
```

---

## Task 4: Final Testing and Cleanup

**Files:**
- Test: All modified components
- Verify: No broken functionality

- [ ] **Step 1: Comprehensive testing**

```bash
# Test all scenarios:
# 1. VueloFormNuevo - Create new flight with files
# 2. VueloFormEditar - Edit existing flight with new files
# 3. Drag & drop in both forms
# 4. File validation (type, size, limits)
# 5. AI extraction integration
# 6. Form submission with files
# 7. Error handling
```

- [ ] **Step 2: Verify no legacy code remains**

```bash
# Search for any remaining references to old upload implementations
grep -r "handleComprobanteUpload.*e\.target\.files" dashboard/src/components/vuelos/
grep -r "onChange.*e\.target\.files.*accept" dashboard/src/components/vuelos/

# Should return no results
```

- [ ] **Step 3: Performance check**

```bash
# Test with large files (5-10MB)
# Test with multiple files
# Verify drag & drop responsiveness
# Check memory usage during upload
```

- [ ] **Step 4: Cross-browser compatibility**

```bash
# Test in Chrome, Firefox, Safari, Edge
# Verify drag & drop works in all browsers
# Check file validation consistency
```

- [ ] **Step 5: Final integration commit**

```bash
git add .
git commit -m "feat: complete FileUpload integration - replace legacy upload implementations

BREAKING CHANGE:
- Replaced custom upload UI with FileUpload component
- Added drag & drop functionality
- Centralized file validation
- Improved error handling and user feedback

Features:
- Single file mode for passports
- Array mode for comprobantes
- Configurable file limits and sizes
- Visual feedback during drag operations
- Consistent UI across all upload areas"
```

---

## Task 5: Documentation and Validation

**Files:**
- Create: Documentation updates
- Validate: Integration completeness

- [ ] **Step 1: Update component documentation**

```javascript
// Add JSDoc comments to FileUpload.jsx
/**
 * FileUpload component - Handles file uploads with drag & drop support
 * 
 * @param {string} tipo - Type of files being uploaded (COMPROBANTE_PAGO, PASAPORTE)
 * @param {Function} onFilesChange - Callback when files change (file|array)
 * @param {number} maxFiles - Maximum number of files allowed
 * @param {number} maxSizeMB - Maximum file size in MB
 * @param {boolean} unlimited - If true, no file limit enforced
 * @param {boolean} singleFile - If true, only accepts single file and calls onFilesChange(file)
 */
```

- [ ] **Step 2: Create integration guide**

```markdown
# FileUpload Integration Guide

## Usage Examples

### Single File Mode (Passports)
```jsx
<FileUpload
  tipo="PASAPORTE"
  onFilesChange={(file) => handlePasaporteUpload(index, file)}
  maxFiles={1}
  singleFile={true}
  maxSizeMB={10}
/>
```

### Array Mode (Comprobantes)
```jsx
<FileUpload
  tipo="COMPROBANTE_PAGO"
  onFilesChange={handleComprobanteUpload}
  maxFiles={10}
  unlimited={isEfectivoPayment}
  maxSizeMB={10}
/>
```

## Features
- Drag & drop support
- File type validation (PDF, JPG, PNG)
- File size validation
- Visual feedback
- Error handling
- Configurable limits
```

- [ ] **Step 3: Validate no regressions**

```bash
# Run existing test suite
npm test

# Check for console errors
# Verify all form submissions work
# Confirm file uploads reach backend correctly
```

- [ ] **Step 4: Final documentation commit**

```bash
git add docs/
git commit -m "docs: add FileUpload integration guide and documentation"
```

---

## Implementation Notes

### Critical Success Factors

1. **Backward Compatibility**: All existing functionality preserved
2. **AI Integration**: Extraction features work seamlessly with new FileUpload
3. **State Management**: Existing state structures maintained
4. **Validation**: File validation centralized and consistent
5. **UX Improvement**: Drag & drop provides better user experience

### Risk Mitigation

- **File Size Limits**: Enforced at component level
- **Type Validation**: Prevents invalid file uploads
- **Error Handling**: Clear user feedback for all error cases
- **Memory Management**: Efficient file handling without memory leaks
- **Browser Compatibility**: Cross-browser drag & drop support

### Performance Considerations

- **Lazy Loading**: Files only processed when needed
- **Validation Efficiency**: Early validation prevents unnecessary processing
- **UI Responsiveness**: Non-blocking file operations
- **Memory Optimization**: Proper cleanup of file references

### Future Enhancements

- **Progress Indicators**: Upload progress for large files
- **Preview Generation**: Image thumbnails for visual files
- **Batch Processing**: Optimized handling of multiple files
- **Cloud Integration**: Direct cloud storage uploads
