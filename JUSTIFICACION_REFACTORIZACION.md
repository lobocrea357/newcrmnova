# 🎯 JUSTIFICACIÓN COMPLETA DE REFACTORIZACIÓN

**Fecha:** 3 de marzo de 2026  
**Propósito:** Justificar CADA hook, servicio y componente propuesto con casos de uso reales

---

## 📋 ÍNDICE

1. [Justificación de Hooks](#justificación-de-hooks)
2. [Justificación de Servicios](#justificación-de-servicios)
3. [Justificación de Componentes](#justificación-de-componentes)
4. [Organización de Carpetas](#organización-de-carpetas)

---

## 🪝 JUSTIFICACIÓN DE HOOKS

### **Hook 1: `useVueloInfo` - ALTA PRIORIDAD**

#### **Problema actual:**
```javascript
// CotizadorForm.jsx - 9 estados separados
const [origen, setOrigen] = useState('')
const [destino, setDestino] = useState('')
const [aerolinea, setAerolinea] = useState('')
const [fechaSalida, setFechaSalida] = useState('')
const [horaSalida, setHoraSalida] = useState('')
const [horaLlegada, setHoraLlegada] = useState('')
const [idaVuelta, setIdaVuelta] = useState(false)
const [soloIda, setSoloIda] = useState(false)
const [finesMigratorios, setFinesMigratorios] = useState(false)
```

**Problemas:**
- 9 estados individuales para conceptos relacionados
- Difícil pasar todos a componentes hijos (9 props)
- Difícil validar datos completos
- Difícil resetear todos a la vez

#### **Solución propuesta:**
```javascript
// hooks/useVueloInfo.js
export const useVueloInfo = (inicial = {}) => {
  const [vueloInfo, setVueloInfo] = useState({
    origen: inicial.origen || '',
    destino: inicial.destino || '',
    aerolinea: inicial.aerolinea || '',
    fechaSalida: inicial.fechaSalida || '',
    horaSalida: inicial.horaSalida || '',
    horaLlegada: inicial.horaLlegada || '',
    idaVuelta: inicial.idaVuelta || false,
    soloIda: inicial.soloIda || false,
    finesMigratorios: inicial.finesMigratorios || false
  })

  const updateVueloInfo = (campo, valor) => {
    setVueloInfo(prev => ({ ...prev, [campo]: valor }))
  }

  const resetVueloInfo = () => {
    setVueloInfo({
      origen: '',
      destino: '',
      aerolinea: '',
      fechaSalida: '',
      horaSalida: '',
      horaLlegada: '',
      idaVuelta: false,
      soloIda: false,
      finesMigratorios: false
    })
  }

  const validarVueloInfo = () => {
    const errores = []
    if (!vueloInfo.origen) errores.push('Origen es requerido')
    if (!vueloInfo.destino) errores.push('Destino es requerido')
    if (!vueloInfo.fechaSalida) errores.push('Fecha de salida es requerida')
    return errores
  }

  return {
    vueloInfo,
    updateVueloInfo,
    resetVueloInfo,
    validarVueloInfo,
    setVueloInfo
  }
}
```

#### **Uso en CotizadorForm:**
```javascript
// ANTES: 9 estados + 9 setters
const [origen, setOrigen] = useState('')
const [destino, setDestino] = useState('')
// ... 7 más

// DESPUÉS: 1 hook
const { vueloInfo, updateVueloInfo, resetVueloInfo, validarVueloInfo } = useVueloInfo()

// Uso:
<input
  value={vueloInfo.origen}
  onChange={(e) => updateVueloInfo('origen', e.target.value)}
/>

// Reset completo:
resetVueloInfo()

// Validación:
const errores = validarVueloInfo()
if (errores.length > 0) {
  toastError(errores.join(', '))
  return
}
```

#### **Beneficios:**
✅ 9 estados → 1 estado  
✅ Reset en 1 línea vs 9 líneas  
✅ Validación centralizada  
✅ Fácil pasar a componentes (1 prop vs 9 props)  
✅ Reutilizable en otros formularios de vuelo  

**Reducción:** ~30 líneas de código  
**Tiempo implementación:** 30 minutos  

---

### **Hook 2: `useEscalas` - MEDIA PRIORIDAD**

#### **Problema actual:**
```javascript
// 6 estados para manejar máximo 2 escalas
const [haceEscala, setHaceEscala] = useState(false)
const [ciudadEscala1, setCiudadEscala1] = useState('')
const [tiempoEscala1, setTiempoEscala1] = useState('')
const [haceSegundaEscala, setHaceSegundaEscala] = useState(false)
const [ciudadEscala2, setCiudadEscala2] = useState('')
const [tiempoEscala2, setTiempoEscala2] = useState('')
```

**Problema:** Estructura rígida que no escala si se necesitan 3 escalas

#### **Solución propuesta:**
```javascript
// hooks/useEscalas.js
export const useEscalas = (maxEscalas = 2) => {
  const [escalas, setEscalas] = useState([])

  const agregarEscala = () => {
    if (escalas.length < maxEscalas) {
      setEscalas([...escalas, { ciudad: '', duracion: '' }])
    } else {
      toastWarning(`Máximo ${maxEscalas} escalas permitidas`)
    }
  }

  const eliminarEscala = (index) => {
    setEscalas(escalas.filter((_, i) => i !== index))
  }

  const actualizarEscala = (index, campo, valor) => {
    const nuevasEscalas = [...escalas]
    nuevasEscalas[index][campo] = valor
    setEscalas(nuevasEscalas)
  }

  const resetEscalas = () => {
    setEscalas([])
  }

  const tieneEscalas = escalas.length > 0

  return {
    escalas,
    agregarEscala,
    eliminarEscala,
    actualizarEscala,
    resetEscalas,
    tieneEscalas
  }
}
```

#### **Uso en CotizadorForm:**
```javascript
// ANTES: 6 estados + lógica hardcoded para 2 escalas
const [haceEscala, setHaceEscala] = useState(false)
// ... 5 más

// DESPUÉS: 1 hook
const { escalas, agregarEscala, actualizarEscala, eliminarEscala, tieneEscalas } = useEscalas(2)

// UI dinámica:
{escalas.map((escala, index) => (
  <div key={index}>
    <input
      value={escala.ciudad}
      onChange={(e) => actualizarEscala(index, 'ciudad', e.target.value)}
    />
    <input
      value={escala.duracion}
      onChange={(e) => actualizarEscala(index, 'duracion', e.target.value)}
    />
    <button onClick={() => eliminarEscala(index)}>Eliminar</button>
  </div>
))}

<button onClick={agregarEscala} disabled={escalas.length >= 2}>
  Agregar Escala
</button>
```

#### **Beneficios:**
✅ 6 estados → 1 estado  
✅ Escalable (fácil cambiar a 3+ escalas)  
✅ UI más simple y dinámica  
✅ Lógica de máximo centralizada  

**Reducción:** ~20 líneas de código  
**Tiempo implementación:** 25 minutos  

---

### **Hook 3: `useEquipaje` - BAJA PRIORIDAD**

#### **Problema actual:**
```javascript
// 3 estados booleanos para equipaje
const [equipajeCompleto, setEquipajeCompleto] = useState(false)
const [equipajeMediano, setEquipajeMediano] = useState(false)
const [equipajeLigero, setEquipajeLigero] = useState(false)
```

**Problema:** No es extensible, difícil saber qué equipaje está seleccionado

#### **Solución propuesta:**
```javascript
// hooks/useEquipaje.js
export const useEquipaje = () => {
  const [equipajeSeleccionado, setEquipajeSeleccionado] = useState([])

  const toggleEquipaje = (tipo) => {
    setEquipajeSeleccionado(prev =>
      prev.includes(tipo)
        ? prev.filter(e => e !== tipo)
        : [...prev, tipo]
    )
  }

  const tieneEquipaje = (tipo) => equipajeSeleccionado.includes(tipo)

  const resetEquipaje = () => {
    setEquipajeSeleccionado([])
  }

  return {
    equipajeSeleccionado,
    toggleEquipaje,
    tieneEquipaje,
    resetEquipaje
  }
}
```

#### **Uso en CotizadorForm:**
```javascript
// ANTES: 3 estados
const [equipajeCompleto, setEquipajeCompleto] = useState(false)
// ... 2 más

// DESPUÉS: 1 hook
const { equipajeSeleccionado, toggleEquipaje, tieneEquipaje } = useEquipaje()

// Uso:
<input
  type="checkbox"
  checked={tieneEquipaje('completo')}
  onChange={() => toggleEquipaje('completo')}
/>

// Pasar a PDF:
<PdfContent equipaje={equipajeSeleccionado} />
```

#### **Beneficios:**
✅ 3 estados → 1 estado  
✅ Más fácil de pasar como prop (array vs 3 booleans)  
✅ Fácil agregar nuevo tipo de equipaje  

**Reducción:** ~10 líneas de código  
**Tiempo implementación:** 15 minutos  

---

### **Hook 4: `useMonedas` - MEDIA PRIORIDAD**

#### **Problema actual:**
```javascript
// 8-10 estados relacionados con monedas
const [monedaBaseSeleccionada, setMonedaBaseSeleccionada] = useState('USD')
const [monedaCotizacionSeleccionada, setMonedaCotizacionSeleccionada] = useState('')
const [tasaCambio, setTasaCambio] = useState('1.0')
const [monedasDB, setMonedasDB] = useState([])
const [tasasDB, setTasasDB] = useState([])
const [loadingMonedas, setLoadingMonedas] = useState(true)
const [tasasDb, setTasasDb] = useState({})
const [loadingTasas, setLoadingTasas] = useState(true)
```

**Problema:** Estados dispersos, lógica de carga duplicada

#### **Solución propuesta:**
```javascript
// hooks/useMonedas.js
export const useMonedas = () => {
  const [estado, setEstado] = useState({
    monedaBase: 'USD',
    monedaCotizacion: '',
    tasaCambio: '1.0',
    monedasDB: [],
    tasasDB: {},
    loading: true,
    error: null
  })

  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setEstado(prev => ({ ...prev, loading: true }))
        
        const [monedas, tasas] = await Promise.all([
          obtenerMonedas(),
          obtenerTasasConversion()
        ])
        
        setEstado(prev => ({
          ...prev,
          monedasDB: monedas,
          tasasDB: tasas,
          loading: false
        }))
      } catch (error) {
        console.error('Error cargando monedas:', error)
        setEstado(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }))
      }
    }
    cargarDatos()
  }, [])

  const setMonedaBase = (moneda) => {
    setEstado(prev => ({ ...prev, monedaBase: moneda }))
  }

  const setMonedaCotizacion = (moneda) => {
    setEstado(prev => ({ ...prev, monedaCotizacion: moneda }))
  }

  const setTasaCambio = (tasa) => {
    setEstado(prev => ({ ...prev, tasaCambio: tasa }))
  }

  return {
    ...estado,
    setMonedaBase,
    setMonedaCotizacion,
    setTasaCambio
  }
}
```

#### **Beneficios:**
✅ 8 estados → 1 estado  
✅ Lógica de carga centralizada  
✅ Manejo de errores incluido  

**Reducción:** ~40 líneas de código  
**Tiempo implementación:** 35 minutos  

---

## 🛠️ JUSTIFICACIÓN DE SERVICIOS

### **Servicio 1: `cotizacionService.js` - ALTA PRIORIDAD**

#### **Problema actual:**

Lógica de negocio mezclada con UI en CotizadorForm:

```javascript
// CotizadorForm.jsx líneas 459-546 (87 líneas)
const calcularCotizacion = async () => {
  if (vistaCotizacion === 'individual') {
    // Validaciones
    if (!precioBase || !feeEmision || !feeAgencia) {
      toastError('Por favor completa todos los campos de precios')
      return
    }

    // Determinar base según vista de cotización
    let base, precio, emision, agencia

    if (vistaCotizacion === 'individual') {
      precio = parseFloat(precioBase) || 0
      emision = parseFloat(feeEmision) || 0
      agencia = parseFloat(feeAgencia) || 0
      base = precio + emision + agencia
    }

    // ... 70 líneas más de lógica
  }
}
```

**Problemas:**
- Lógica de negocio mezclada con UI
- Imposible testear sin renderizar componente
- No reutilizable
- Difícil de mantener

#### **Solución propuesta:**
```javascript
// services/cotizacionService.js

/**
 * Validar datos de cotización
 */
export function validarCotizacion({ precioBase, feeEmision, feeAgencia, monedaCotizacion, metodoPago }) {
  const errores = []
  
  if (!precioBase || precioBase <= 0) errores.push('Precio base es requerido')
  if (!feeEmision) errores.push('Fee de emisión es requerido')
  if (!feeAgencia || feeAgencia <= 0) errores.push('Fee de agencia es requerido')
  if (!monedaCotizacion) errores.push('Moneda de cotización es requerida')
  if (!metodoPago) errores.push('Método de pago es requerido')
  
  return errores
}

/**
 * Calcular base de cotización
 */
export function calcularBase({ precioBase, feeEmision, feeAgencia }) {
  const precio = parseFloat(precioBase) || 0
  const emision = parseFloat(feeEmision) || 0
  const agencia = parseFloat(feeAgencia) || 0
  
  return precio + emision + agencia
}

/**
 * Calcular cotización individual
 */
export async function calcularCotizacionIndividual({
  precioBase,
  feeEmision,
  feeAgencia,
  monedaBase,
  monedaCotizacion,
  metodoPago,
  tasasDb
}) {
  // Validar
  const errores = validarCotizacion({ precioBase, feeEmision, feeAgencia, monedaCotizacion, metodoPago })
  if (errores.length > 0) {
    throw new Error(errores.join(', '))
  }

  // Calcular base
  const base = calcularBase({ precioBase, feeEmision, feeAgencia })

  // Convertir
  const resultado = await calcularConversionInteligente({
    base,
    monedaBase,
    monedaCotizacion,
    metodoPago,
    tasasDb
  })

  return {
    ...resultado,
    totalFinal: resultado.total,
    precioBase: parseFloat(precioBase),
    feeEmision: parseFloat(feeEmision),
    feeAgencia: parseFloat(feeAgencia)
  }
}

/**
 * Formatear monto para display
 */
export function formatearMonto(valor) {
  if (!valor && valor !== 0) return '0.00'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor)
}

/**
 * Detectar moneda por método de pago
 */
export function detectarMonedaPorMetodo(metodo, metodosPorMoneda) {
  for (const [moneda, metodos] of Object.entries(metodosPorMoneda)) {
    if (metodos.includes(metodo)) {
      return moneda
    }
  }
  return null
}
```

#### **Uso en CotizadorForm:**
```javascript
// ANTES: 87 líneas de lógica en componente
const calcularCotizacion = async () => {
  // ... 87 líneas
}

// DESPUÉS: Llamada limpia
const calcularCotizacion = async () => {
  try {
    const resultado = await calcularCotizacionIndividual({
      precioBase,
      feeEmision,
      feeAgencia,
      monedaBase: monedaBaseSeleccionada,
      monedaCotizacion: monedaCotizacionSeleccionada,
      metodoPago,
      tasasDb
    })
    
    setTotal(resultado.totalFinal)
    setDesglose(resultado)
    toastSuccess('Cotización calculada')
    
  } catch (error) {
    toastError(error.message)
  }
}
```

#### **Beneficios:**
✅ Lógica separada de UI  
✅ Testeable con tests unitarios  
✅ Reutilizable en otros componentes  
✅ Más fácil de mantener  
✅ Validación centralizada  

**Reducción:** ~50 líneas en componente  
**Tiempo implementación:** 1 hora  

---

### **Servicio 2: `pdfService.js` - ALTA PRIORIDAD**

#### **Problema actual:**

```javascript
// CotizadorForm.jsx líneas 554-619 (65 líneas)
const handleExportarPdf = async () => {
  try {
    setExportingPdf(true)
    
    if (!pdfContentRef.current) {
      toastError('No se encontró el contenido para exportar')
      return
    }

    const element = pdfContentRef.current
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      windowHeight: element.scrollHeight
    })

    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')
    
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= 297

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
    }

    const nombreArchivo = `Cotizacion_${origen}_${destino}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(nombreArchivo)

    toastSuccess('PDF exportado correctamente')
  } catch (error) {
    console.error('Error exportando PDF:', error)
    toastError('Error al exportar PDF')
  } finally {
    setExportingPdf(false)
  }
}
```

**Problemas:**
- Lógica técnica en componente UI
- Difícil de testear
- No reutilizable
- Dependencias directas de html2canvas y jsPDF

#### **Solución propuesta:**
```javascript
// services/pdfService.js
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

/**
 * Configuración por defecto para html2canvas
 */
const CANVAS_CONFIG = {
  scale: 2,
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  windowWidth: 1200
}

/**
 * Generar PDF desde un elemento DOM
 */
export async function generarPdfDesdeElemento(elemento, opciones = {}) {
  if (!elemento) {
    throw new Error('Elemento DOM no proporcionado')
  }

  // Configuración personalizable
  const canvasConfig = {
    ...CANVAS_CONFIG,
    windowHeight: elemento.scrollHeight,
    ...opciones.canvasConfig
  }

  // Generar canvas
  const canvas = await html2canvas(elemento, canvasConfig)

  // Dimensiones del PDF
  const imgWidth = 210 // A4 width en mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/png')

  // Crear PDF
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Manejar páginas múltiples
  let heightLeft = imgHeight
  let position = 0
  const pageHeight = 297 // A4 height en mm

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  return pdf
}

/**
 * Generar nombre de archivo para cotización
 */
export function generarNombrePDF({ origen, destino, fecha = new Date() }) {
  const fechaStr = fecha.toISOString().split('T')[0]
  const origenStr = origen?.replace(/\s+/g, '_') || 'SinOrigen'
  const destinoStr = destino?.replace(/\s+/g, '_') || 'SinDestino'
  
  return `Cotizacion_${origenStr}_${destinoStr}_${fechaStr}.pdf`
}

/**
 * Exportar cotización como PDF
 */
export async function exportarCotizacionPDF(elemento, { origen, destino }) {
  const pdf = await generarPdfDesdeElemento(elemento)
  const nombreArchivo = generarNombrePDF({ origen, destino })
  pdf.save(nombreArchivo)
  
  return nombreArchivo
}
```

#### **Uso en CotizadorForm:**
```javascript
// ANTES: 65 líneas
const handleExportarPdf = async () => {
  // ... 65 líneas
}

// DESPUÉS: 15 líneas
import { exportarCotizacionPDF } from '@/services/pdfService'

const handleExportarPdf = async () => {
  try {
    setExportingPdf(true)
    
    const nombreArchivo = await exportarCotizacionPDF(
      pdfContentRef.current,
      { origen, destino }
    )
    
    toastSuccess(`PDF exportado: ${nombreArchivo}`)
    
  } catch (error) {
    console.error('Error exportando PDF:', error)
    toastError('Error al exportar PDF')
  } finally {
    setExportingPdf(false)
  }
}
```

#### **Beneficios:**
✅ Lógica técnica separada  
✅ Testeable  
✅ Reutilizable (otros documentos)  
✅ Configuración centralizada  

**Reducción:** ~50 líneas en componente  
**Tiempo implementación:** 45 minutos  

---

## 🧩 JUSTIFICACIÓN DE COMPONENTES

### **Componente 1: `FormularioVueloInfo.jsx` - MEDIA PRIORIDAD**

#### **Problema actual:**

160+ líneas de JSX para origen/destino/fechas/horas mezcladas en CotizadorForm

#### **Responsabilidad propuesta:**
Manejar SOLO la información básica del vuelo (origen, destino, fechas, horarios, aerolínea)

#### **Props:**
```javascript
<FormularioVueloInfo
  vueloInfo={vueloInfo}
  onChange={updateVueloInfo}
  readonly={false}
/>
```

#### **Beneficio:**
- Componente más pequeño y enfocado
- Reutilizable en otros formularios de vuelo
- Testing independiente

**Reducción:** ~150 líneas del componente principal  
**Tiempo:** 1 hora  

---

### **Componente 2: `FormularioEscalas.jsx` - BAJA PRIORIDAD**

#### **Responsabilidad:**
Manejar escalas dinámicamente (agregar/editar/eliminar)

#### **Props:**
```javascript
<FormularioEscalas
  escalas={escalas}
  onAgregar={agregarEscala}
  onActualizar={actualizarEscala}
  onEliminar={eliminarEscala}
  maxEscalas={2}
/>
```

**Reducción:** ~50 líneas  
**Tiempo:** 30 minutos  

---

### **Componente 3: `FormularioEquipaje.jsx` - BAJA PRIORIDAD**

#### **Responsabilidad:**
Manejar selección de equipaje con checkboxes

#### **Props:**
```javascript
<FormularioEquipaje
  equipajeSeleccionado={equipajeSeleccionado}
  onToggle={toggleEquipaje}
/>
```

**Reducción:** ~40 líneas  
**Tiempo:** 25 minutos  

---

### **Componente 4: `FormularioPrecios.jsx` - ALTA PRIORIDAD**

#### **Responsabilidad:**
Manejar precios, fees y monedas (vista individual)

#### **Props:**
```javascript
<FormularioPrecios
  precioBase={precioBase}
  feeEmision={feeEmision}
  feeAgencia={feeAgencia}
  monedaBase={monedaBase}
  monedaCotizacion={monedaCotizacion}
  onPrecioChange={setPrecioBase}
  onFeeEmisionChange={setFeeEmision}
  onFeeAgenciaChange={setFeeAgencia}
  onMonedaBaseChange={setMonedaBase}
  onMonedaCotizacionChange={setMonedaCotizacion}
/>
```

**Reducción:** ~100 líneas  
**Tiempo:** 1 hora  

---

### **Componente 5: `ResultadosCotizacion.jsx` - MEDIA PRIORIDAD**

#### **Responsabilidad:**
Mostrar desglose y total de cotización

#### **Props:**
```javascript
<ResultadosCotizacion
  desglose={desglose}
  total={total}
  moneda={monedaCotizacion}
  onExportar={handleExportarPdf}
  exportando={exportingPdf}
/>
```

**Reducción:** ~80 líneas  
**Tiempo:** 45 minutos  

---

## 📁 ORGANIZACIÓN DE CARPETAS

### **Estructura actual:**
```
dashboard/src/components/cotizador/
├── CotizadorForm.jsx (1,520 líneas)
├── PasajerosManager.jsx
├── PdfContent.jsx
└── (sin organización)
```

**Problemas:**
- Todo en una carpeta plana
- No hay separación por responsabilidad
- Difícil encontrar archivos

---

### **Estructura propuesta:**

```
dashboard/src/
├── components/
│   └── cotizador/
│       ├── CotizadorForm.jsx                  # Componente principal (400-600 líneas)
│       │
│       ├── formularios/                       # Subformularios
│       │   ├── FormularioVueloInfo.jsx        # Origen, destino, fechas
│       │   ├── FormularioEscalas.jsx          # Escalas dinámicas
│       │   ├── FormularioEquipaje.jsx         # Selección de equipaje
│       │   ├── FormularioPrecios.jsx          # Precios, fees, monedas
│       │   └── FormularioMetodoPago.jsx       # Método de pago
│       │
│       ├── resultados/                        # Visualización de resultados
│       │   ├── ResultadosCotizacion.jsx       # Desglose y total
│       │   └── PdfContent.jsx                 # Contenido para PDF
│       │
│       ├── pasajeros/                         # Gestión de pasajeros
│       │   ├── PasajerosManager.jsx           # Manager principal
│       │   └── PasajeroCard.jsx               # Tarjeta individual
│       │
│       └── ui/                                # Componentes UI compartidos
│           └── CollapsibleSection.jsx         # Mover aquí
│
├── hooks/                                     # Custom hooks
│   └── cotizador/
│       ├── useVueloInfo.js                    # Hook de info de vuelo
│       ├── useEscalas.js                      # Hook de escalas
│       ├── useEquipaje.js                     # Hook de equipaje
│       └── useMonedas.js                      # Hook de monedas
│
├── services/                                  # Lógica de negocio
│   └── cotizador/
│       ├── cotizacionService.js               # Cálculos y validaciones
│       └── pdfService.js                      # Generación de PDF
│
└── lib/                                       # Utilidades y configuración
    └── cotizador/
        ├── conversorInteligente.js            # Conversión de monedas (SOLO lógica)
        ├── tasasHelpers.js                    # Acceso a datos de tasas
        ├── monedasConfig.js                   # Configuración de monedas (NUEVO)
        ├── paymentConfig.js                   # Configuración de pagos
        └── passengerConfig.js                 # Configuración de pasajeros
```

---

### **Justificación de cada carpeta:**

#### **`formularios/`**
**Propósito:** Subformularios independientes y reutilizables  
**Contenido:** Cada formulario maneja UNA sección específica  
**Beneficio:** Testing independiente, reutilización

#### **`resultados/`**
**Propósito:** Visualización de resultados y PDF  
**Contenido:** Componentes que SOLO muestran datos  
**Beneficio:** Separación clara vista/lógica

#### **`pasajeros/`**
**Propósito:** Todo lo relacionado con gestión de pasajeros múltiples  
**Contenido:** Manager y componentes de pasajeros  
**Beneficio:** Módulo autocontenido

#### **`hooks/cotizador/`**
**Propósito:** Custom hooks específicos del cotizador  
**Contenido:** Lógica de estado reutilizable  
**Beneficio:** Reducción de estados en componentes

#### **`services/cotizador/`**
**Propósito:** Lógica de negocio pura (testeable)  
**Contenido:** Funciones sin dependencias de React  
**Beneficio:** Testeable, reutilizable, mantenible

#### **`lib/cotizador/`**
**Propósito:** Configuración y utilidades  
**Contenido:** Constantes, helpers, configuración  
**Beneficio:** Fuente única de verdad

---

### **Nomenclatura propuesta:**

#### **Archivos:**
- Componentes: `PascalCase.jsx` (ej: `FormularioVueloInfo.jsx`)
- Hooks: `camelCase.js` con prefijo `use` (ej: `useVueloInfo.js`)
- Servicios: `camelCase.js` con sufijo `Service` (ej: `cotizacionService.js`)
- Config: `camelCase.js` con sufijo `Config` (ej: `monedasConfig.js`)

#### **Carpetas:**
- `kebab-case` o `camelCase` consistente
- Nombres descriptivos y cortos

---

## 📊 IMPACTO TOTAL DE LA REFACTORIZACIÓN

| Aspecto | Actual | Después |
|---------|--------|---------|
| **Archivos totales** | 3 | 18-20 |
| **Líneas en CotizadorForm** | 1,520 | 400-600 |
| **Estados en CotizadorForm** | 37 | 5-8 |
| **Hooks personalizados** | 0 | 4 |
| **Servicios** | 0 | 2 |
| **Componentes** | 3 | 10-12 |
| **Testeable** | ❌ Muy difícil | ✅ Fácil |
| **Mantenibilidad** | ❌ Baja | ✅ Alta |
| **Reutilización** | ❌ Casi nula | ✅ Alta |
| **Onboarding** | ❌ Difícil (1 archivo gigante) | ✅ Fácil (archivos pequeños) |

---

## ⏱️ TIEMPO TOTAL ESTIMADO

### **Implementación completa:**

| Fase | Componente | Tiempo |
|------|------------|--------|
| **Hooks** | useVueloInfo | 30 min |
| | useEscalas | 25 min |
| | useEquipaje | 15 min |
| | useMonedas | 35 min |
| **Servicios** | cotizacionService | 1h |
| | pdfService | 45 min |
| **Componentes** | FormularioVueloInfo | 1h |
| | FormularioEscalas | 30 min |
| | FormularioEquipaje | 25 min |
| | FormularioPrecios | 1h |
| | ResultadosCotizacion | 45 min |
| **Config** | monedasConfig | 15 min |
| **Testing** | Pruebas completas | 2h |
| **Total** | | **9h 25 min** |

**Dividido en sprints:**
- Sprint 1 (3h): Hooks + monedasConfig
- Sprint 2 (2h): Servicios
- Sprint 3 (3h): Componentes
- Sprint 4 (2h): Testing y ajustes

---

## 🎯 CONCLUSIÓN

Cada hook, servicio y componente propuesto tiene:

✅ **Justificación clara** basada en problemas reales  
✅ **Beneficios medibles** (reducción de líneas, estados)  
✅ **Tiempo estimado** realista  
✅ **Casos de uso** concretos  

**ROI:** ~10 horas de inversión → Reducción de 60% complejidad + Testing + Mantenibilidad
