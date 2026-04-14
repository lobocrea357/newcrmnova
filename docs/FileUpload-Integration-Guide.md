# FileUpload Integration Guide

## Overview

El componente `FileUpload` proporciona una solución unificada para uploads de archivos con drag & drop, validación centralizada y UX mejorada. Soporta dos modos de operación:

- **Single File Mode**: Para archivos individuales (pasaportes/cédulas)
- **Array Mode**: Para múltiples archivos (comprobantes de pago)

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

**Características:**
- Acepta solo un archivo
- `onFilesChange` recibe el archivo individual (no array)
- Input HTML sin atributo `multiple`
- Texto: "Archivo seleccionado"

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

**Características:**
- Acepta múltiples archivos
- `onFilesChange` recibe array de archivos
- Input HTML con atributo `multiple`
- Texto: "Archivos seleccionados (3/10)"

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tipo` | string | - | Tipo de archivos (COMPROBANTE_PAGO, PASAPORTE) |
| `onFilesChange` | function | - | Callback: `(file) => void` o `(files) => void` |
| `maxFiles` | number | 5 | Máximo de archivos permitidos |
| `maxSizeMB` | number | 10 | Tamaño máximo por archivo en MB |
| `unlimited` | boolean | false | Si true, no hay límite de archivos |
| `singleFile` | boolean | false | Si true, modo de archivo individual |

## Features

### Drag & Drop Support
- Visual feedback durante drag operations
- Bordes cambian de color al arrastrar
- Soporte para múltiples archivos simultáneos

### File Validation
- **Tipos permitidos**: PDF, JPG, PNG
- **Tamaño máximo**: Configurable por prop (default 10MB)
- **Validación temprana**: Antes de procesar archivos
- **Mensajes de error claros**: En español

### UI/UX Features
- **Feedback visual**: Estados hover, drag active, error
- **Iconos dinámicos**: Según tipo de archivo
- **Formato tamaño**: Bytes, KB, MB automático
- **Botón remover**: Para cada archivo subido

## Integration Patterns

### Form Integration

```jsx
const MyForm = () => {
  const [passportFile, setPassportFile] = useState(null)
  const [comprobantes, setComprobantes] = useState([])

  const handlePassportUpload = (file) => {
    setPassportFile(file)
    toastSuccess(`Pasaporte cargado: ${file.name}`)
  }

  const handleComprobanteUpload = (files) => {
    setComprobantes(prev => [...prev, ...files])
    toastSuccess(`${files.length} comprobante(s) agregado(s)`)
  }

  return (
    <form>
      <FileUpload
        tipo="PASAPORTE"
        onFilesChange={handlePassportUpload}
        singleFile={true}
        maxFiles={1}
      />
      
      <FileUpload
        tipo="COMPROBANTE_PAGO"
        onFilesChange={handleComprobanteUpload}
        maxFiles={10}
      />
    </form>
  )
}
```

### AI Extraction Integration

```jsx
// Mantener funcionalidad de extracción IA existente
{passportFile && passportFile.type.startsWith('image/') && (
  <button onClick={() => extractDocumentData()}>
    Extraer datos con IA
  </button>
)}
```

## Migration from Legacy Upload

### Before (Legacy)
```jsx
<label className="border-dashed border-gray-300 rounded-lg p-4">
  <Upload className="w-5 h-5" />
  <span>Subir archivo</span>
  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) => handleUpload(e.target.files[0])}
    className="hidden"
  />
</label>
```

### After (FileUpload)
```jsx
<FileUpload
  tipo="PASAPORTE"
  onFilesChange={handleUpload}
  singleFile={true}
  maxFiles={1}
  maxSizeMB={10}
/>
```

## Benefits

### For Developers
- **Centralized validation**: No need to repeat file validation logic
- **Consistent UI**: Same upload experience across all forms
- **Type safety**: Clear props and callbacks
- **Easy testing**: Isolated component with defined behavior

### For Users
- **Drag & drop**: Modern upload experience
- **Visual feedback**: Clear status indicators
- **Error handling**: User-friendly error messages
- **File management**: Easy to add/remove files

## Best Practices

1. **Use singleFile mode** for individual documents (passports, IDs)
2. **Use array mode** for multiple documents (receipts, proofs)
3. **Set appropriate limits** based on use case
4. **Handle callbacks properly** according to mode
5. **Preserve AI extraction** when integrating with existing systems

## Troubleshooting

### Common Issues

**Q: FileUpload no muestra archivos**
- Check `onFilesChange` callback implementation
- Verify props configuration (singleFile vs array mode)

**Q: Drag & drop no funciona**
- Verify browser supports File API
- Check for conflicting drag event handlers

**Q: Validación no funciona**
- Check file types and sizes
- Verify `maxSizeMB` and `maxFiles` props

**Q: Error en consola**
- Check callback function signatures
- Verify proper import of component

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support

## Future Enhancements

- Upload progress indicators
- Image thumbnails preview
- Cloud storage integration
- Batch processing optimization
- Advanced file type detection
