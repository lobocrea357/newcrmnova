# 🎯 PLAN DE EJECUCIÓN DETALLADO - REFACTORIZACIÓN COMPLETA

**Fecha:** 3 de marzo de 2026  
**Objetivo:** Implementar TODO a la primera sin errores  
**Tiempo estimado:** 10-12 horas

---

## 📋 ÍNDICE DE FASES

1. [Preparación: Estructura de carpetas](#fase-0-preparación)
2. [Fase 1: monedasConfig.js](#fase-1-monedasconfig)
3. [Fase 2: Hooks](#fase-2-hooks)
4. [Fase 3: Servicios](#fase-3-servicios)
5. [Fase 4: Componentes](#fase-4-componentes)
6. [Fase 5: Actualizar CotizadorForm](#fase-5-actualizar-cotizadorform)
7. [Fase 6: Bug fix selects](#fase-6-bug-fix-selects)
8. [Fase 7: Limpieza final](#fase-7-limpieza-final)
9. [Fase 8: Testing](#fase-8-testing)

---

## FASE 0: PREPARACIÓN (5 minutos)

### **Paso 0.1: Crear estructura de carpetas**

```bash
# Crear carpetas para hooks
mkdir dashboard/src/hooks
mkdir dashboard/src/hooks/cotizador

# Crear carpetas para servicios
mkdir dashboard/src/services
mkdir dashboard/src/services/cotizador

# Crear subcarpetas en componentes/cotizador
mkdir dashboard/src/components/cotizador/formularios
mkdir dashboard/src/components/cotizador/resultados
mkdir dashboard/src/components/cotizador/pasajeros
```

### **Paso 0.2: Mover componentes existentes**

```bash
# Mover PasajerosManager a su carpeta
mv dashboard/src/components/cotizador/PasajerosManager.jsx dashboard/src/components/cotizador/pasajeros/

# Mover PdfContent a su carpeta
mv dashboard/src/components/cotizador/PdfContent.jsx dashboard/src/components/cotizador/resultados/
```

**Nota:** Después de mover, actualizar imports en CotizadorForm.jsx

---

## FASE 1: monedasConfig.js (20 minutos)

### **Paso 1.1: Crear archivo monedasConfig.js**

**Archivo:** `dashboard/src/lib/cotizador/monedasConfig.js`

**Contenido completo:**
```javascript
/**
 * Configuración centralizada de monedas
 * Fuente única de verdad para todas las monedas del sistema
 */

const MONEDAS_BASE = ['USD', 'EUR']

const MONEDAS_DISPONIBLES = [
  { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$', base: true },
  { value: 'EUR', label: 'Euros (EUR)', symbol: '€', base: true },
  { value: 'VES', label: 'Bolívares (VES)', symbol: 'Bs.', base: false },
  { value: 'COP', label: 'Pesos Colombianos (COP)', symbol: '$', base: false },
  { value: 'USDT', label: 'USDT (Tether)', symbol: '₮', base: false },
  { value: 'GBP', label: 'Libras Esterlinas (GBP)', symbol: '£', base: false },
  { value: 'CAD', label: 'Dólares Canadienses (CAD)', symbol: 'C$', base: false },
  { value: 'AUD', label: 'Dólares Australianos (AUD)', symbol: 'A$', base: false },
  { value: 'JPY', label: 'Yenes Japoneses (JPY)', symbol: '¥', base: false },
  { value: 'CHF', label: 'Francos Suizos (CHF)', symbol: 'Fr', base: false }
]

/**
 * Obtener todas las monedas disponibles para cotización
 */
export function getMonedasCotizacion() {
  return MONEDAS_DISPONIBLES
}

/**
 * Obtener solo monedas base (USD, EUR)
 */
export function getMonedasBase() {
  return MONEDAS_DISPONIBLES.filter(m => m.base)
}

/**
 * Obtener información de una moneda por código
 * @param {string} codigo - Código de la moneda (ej: 'USD', 'EUR')
 * @returns {object|null} - Objeto con info de la moneda o null
 */
export function getMonedaInfo(codigo) {
  return MONEDAS_DISPONIBLES.find(m => m.value === codigo) || null
}

/**
 * Verificar si una moneda es base (USD o EUR)
 * @param {string} codigo - Código de la moneda
 * @returns {boolean}
 */
export function esMonedaBase(codigo) {
  return MONEDAS_BASE.includes(codigo)
}

/**
 * Obtener símbolo de una moneda
 * @param {string} codigo - Código de la moneda
 * @returns {string} - Símbolo de la moneda o '$' por defecto
 */
export function getSimboloMoneda(codigo) {
  const moneda = getMonedaInfo(codigo)
  return moneda?.symbol || '$'
}
```

### **Paso 1.2: Actualizar conversorInteligente.js**

**Archivo:** `dashboard/src/lib/cotizador/conversorInteligente.js`

**Acción:** ELIMINAR funciones helper (líneas 163-205)

**Mantener solo:**
- `obtenerTasaConversion()`
- `calcularConversionInteligente()`

**Agregar import:**
```javascript
import { getMonedaInfo } from './monedasConfig'
```

### **Paso 1.3: Actualizar CotizadorForm.jsx - Imports**

**Líneas 1-20 aprox:**

**ANTES:**
```javascript
import {
  calcularConversionInteligente,
  getMonedasCotizacion,
  getMonedasBase,
  getMonedaInfo,
  esMonedaBase
} from '@/lib/cotizador/conversorInteligente'
```

**DESPUÉS:**
```javascript
import { calcularConversionInteligente } from '@/lib/cotizador/conversorInteligente'
import {
  getMonedasCotizacion,
  getMonedasBase,
  getMonedaInfo,
  getSimboloMoneda
} from '@/lib/cotizador/monedasConfig'
```

### **Paso 1.4: Actualizar paths de componentes movidos**

**ANTES:**
```javascript
import PasajerosManager from './PasajerosManager'
import PdfContent from './PdfContent'
```

**DESPUÉS:**
```javascript
import PasajerosManager from './pasajeros/PasajerosManager'
import PdfContent from './resultados/PdfContent'
```

### **Paso 1.5: Eliminar funciones locales duplicadas**

**ELIMINAR líneas ~226-256:**
```javascript
// ELIMINAR ESTO:
const getMonedasDisponibles = () => { ... }
const getMonedasCotizacion = () => { ... }

// ELIMINAR ESTO:
const monedasBase = [
  { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
]
```

**REEMPLAZAR con:**
```javascript
const monedasBase = getMonedasBase()
```

### **Paso 1.6: Simplificar obtención de símbolos**

**ELIMINAR líneas ~539-548:**
```javascript
// ELIMINAR ESTO:
let simboloMoneda = '$'
if (monedaCotizacionSeleccionada === 'EUR') simboloMoneda = '€'
else if (monedaCotizacionSeleccionada === 'VES') simboloMoneda = 'Bs.'
// ... resto de ifs
```

**REEMPLAZAR con:**
```javascript
const simboloMoneda = getSimboloMoneda(monedaCotizacionSeleccionada)
```

---

## FASE 2: HOOKS (2 horas)

### **HOOK 1: useVueloInfo (30 min)**

#### **Paso 2.1: Crear archivo useVueloInfo.js**

**Archivo:** `dashboard/src/hooks/cotizador/useVueloInfo.js`

**Contenido:**
```javascript
import { useState } from 'react'

/**
 * Hook para manejar información del vuelo
 * Agrupa 9 estados relacionados en uno solo
 */
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

#### **Paso 2.2: Actualizar CotizadorForm - Reemplazar estados de vuelo**

**ELIMINAR (líneas ~60-75):**
```javascript
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

**AGREGAR import:**
```javascript
import { useVueloInfo } from '@/hooks/cotizador/useVueloInfo'
```

**AGREGAR en el componente:**
```javascript
const { vueloInfo, updateVueloInfo, resetVueloInfo } = useVueloInfo()
```

#### **Paso 2.3: Actualizar todos los usos de estados de vuelo**

**Buscar y reemplazar en TODA la UI:**

- `value={origen}` → `value={vueloInfo.origen}`
- `onChange={(e) => setOrigen(e.target.value)}` → `onChange={(e) => updateVueloInfo('origen', e.target.value)}`
- `value={destino}` → `value={vueloInfo.destino}`
- `onChange={(e) => setDestino(e.target.value)}` → `onChange={(e) => updateVueloInfo('destino', e.target.value)}`
- Y así para todos los demás campos

**Actualizar props a PdfContent:**
- `origen={origen}` → `origen={vueloInfo.origen}`
- `destino={destino}` → `destino={vueloInfo.destino}`
- etc.

---

### **HOOK 2: useEscalas (25 min)**

#### **Paso 2.4: Crear archivo useEscalas.js**

**Archivo:** `dashboard/src/hooks/cotizador/useEscalas.js`

**Contenido:**
```javascript
import { useState } from 'react'
import { toastWarning } from '@/helpers/sweetAlerts'

/**
 * Hook para manejar escalas dinámicas
 */
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

#### **Paso 2.5: Actualizar CotizadorForm - Reemplazar estados de escalas**

**ELIMINAR:**
```javascript
const [haceEscala, setHaceEscala] = useState(false)
const [ciudadEscala1, setCiudadEscala1] = useState('')
const [tiempoEscala1, setTiempoEscala1] = useState('')
const [haceSegundaEscala, setHaceSegundaEscala] = useState(false)
const [ciudadEscala2, setCiudadEscala2] = useState('')
const [tiempoEscala2, setTiempoEscala2] = useState('')
```

**AGREGAR:**
```javascript
import { useEscalas } from '@/hooks/cotizador/useEscalas'
const { escalas, agregarEscala, actualizarEscala, eliminarEscala, tieneEscalas } = useEscalas(2)
```

**Nota:** Actualizar UI de escalas después cuando creemos el componente FormularioEscalas.

---

### **HOOK 3: useEquipaje (15 min)**

#### **Paso 2.6: Crear archivo useEquipaje.js**

**Archivo:** `dashboard/src/hooks/cotizador/useEquipaje.js`

**Contenido:**
```javascript
import { useState } from 'react'

/**
 * Hook para manejar selección de equipaje
 */
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

#### **Paso 2.7: Actualizar CotizadorForm - Reemplazar estados de equipaje**

**ELIMINAR:**
```javascript
const [equipajeCompleto, setEquipajeCompleto] = useState(false)
const [equipajeMediano, setEquipajeMediano] = useState(false)
const [equipajeLigero, setEquipajeLigero] = useState(false)
```

**AGREGAR:**
```javascript
import { useEquipaje } from '@/hooks/cotizador/useEquipaje'
const { equipajeSeleccionado, toggleEquipaje, tieneEquipaje } = useEquipaje()
```

#### **Paso 2.8: Actualizar UI de checkboxes de equipaje**

**BUSCAR y REEMPLAZAR:**
- `checked={equipajeCompleto}` → `checked={tieneEquipaje('completo')}`
- `onChange={(e) => setEquipajeCompleto(e.target.checked)}` → `onChange={() => toggleEquipaje('completo')}`
- Igual para 'mediano' y 'ligero'

---

### **HOOK 4: useMonedas (35 min)**

#### **Paso 2.9: Crear archivo useMonedas.js**

**Archivo:** `dashboard/src/hooks/cotizador/useMonedas.js`

**Contenido:**
```javascript
import { useState, useEffect } from 'react'
import { obtenerMonedas, obtenerTasasConversion } from '@/lib/cotizador/tasasHelpers'

/**
 * Hook para manejar monedas y tasas
 * Centraliza carga y estado de monedas
 */
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
        
        // Procesar tasas en formato objeto anidado
        const tasasObj = {}
        tasas.forEach(tasa => {
          if (!tasasObj[tasa.moneda_origen]) {
            tasasObj[tasa.moneda_origen] = {}
          }
          tasasObj[tasa.moneda_origen][tasa.moneda_destino] = tasa.tasa
        })
        
        setEstado(prev => ({
          ...prev,
          monedasDB: monedas,
          tasasDB: tasasObj,
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

#### **Paso 2.10: Actualizar CotizadorForm - Reemplazar estados de monedas**

**ELIMINAR:**
```javascript
const [monedaBaseSeleccionada, setMonedaBaseSeleccionada] = useState('USD')
const [monedaCotizacionSeleccionada, setMonedaCotizacionSeleccionada] = useState('')
const [tasaCambio, setTasaCambio] = useState('1.0')
const [monedasDB, setMonedasDB] = useState([])
const [tasasDB, setTasasDB] = useState([])
const [loadingMonedas, setLoadingMonedas] = useState(true)
const [tasasDb, setTasasDb] = useState({})
const [loadingTasas, setLoadingTasas] = useState(true)
```

**AGREGAR:**
```javascript
import { useMonedas } from '@/hooks/cotizador/useMonedas'
const {
  monedaBase: monedaBaseSeleccionada,
  monedaCotizacion: monedaCotizacionSeleccionada,
  tasaCambio,
  monedasDB,
  tasasDB: tasasDb,
  loading: loadingMonedas,
  setMonedaBase: setMonedaBaseSeleccionada,
  setMonedaCotizacion: setMonedaCotizacionSeleccionada,
  setTasaCambio
} = useMonedas()
```

#### **Paso 2.11: ELIMINAR useEffect de carga de monedas**

**ELIMINAR todo el useEffect que carga monedas (líneas ~176-218 aprox):**
```javascript
// ELIMINAR ESTO:
useEffect(() => {
  const cargarMonedas = async () => {
    // ... todo el código de carga
  }
  cargarMonedas()
}, [])
```

**Ya no es necesario porque useMonedas lo hace automáticamente.**

---

## FASE 3: SERVICIOS (1.5 horas)

### **SERVICIO 1: cotizacionService.js (1 hora)**

#### **Paso 3.1: Crear archivo cotizacionService.js**

**Archivo:** `dashboard/src/services/cotizador/cotizacionService.js`

**Contenido:**
```javascript
import { calcularConversionInteligente } from '@/lib/cotizador/conversorInteligente'

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

#### **Paso 3.2: Actualizar CotizadorForm - Usar cotizacionService**

**ELIMINAR función calcularCotizacion completa (líneas ~459-546).**

**AGREGAR import:**
```javascript
import { calcularCotizacionIndividual } from '@/services/cotizador/cotizacionService'
```

**REEMPLAZAR con:**
```javascript
const calcularCotizacion = async () => {
  if (vistaCotizacion !== 'individual') return

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
    toastSuccess('Cotización calculada correctamente')
    
  } catch (error) {
    toastError(error.message)
  }
}
```

---

### **SERVICIO 2: pdfService.js (45 min)**

#### **Paso 3.3: Crear archivo pdfService.js**

**Archivo:** `dashboard/src/services/cotizador/pdfService.js`

**Contenido:**
```javascript
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

#### **Paso 3.4: Actualizar CotizadorForm - Usar pdfService**

**ELIMINAR función handleExportarPdf completa (líneas ~554-619).**

**AGREGAR import:**
```javascript
import { exportarCotizacionPDF } from '@/services/cotizador/pdfService'
```

**REEMPLAZAR con:**
```javascript
const handleExportarPdf = async () => {
  try {
    setExportingPdf(true)
    
    const nombreArchivo = await exportarCotizacionPDF(
      pdfContentRef.current,
      { 
        origen: vueloInfo.origen, 
        destino: vueloInfo.destino 
      }
    )
    
    toastSuccess(`PDF exportado: ${nombreArchivo}`)
    
  } catch (error) {
    console.error('Error exportando PDF:', error)
    toastError(error.message || 'Error al exportar PDF')
  } finally {
    setExportingPdf(false)
  }
}
```

---

## FASE 4: COMPONENTES (3 horas)

### **Componente 1: FormularioEscalas (30 min)**

#### **Paso 4.1: Crear archivo FormularioEscalas.jsx**

**Archivo:** `dashboard/src/components/cotizador/formularios/FormularioEscalas.jsx`

**Contenido:**
```javascript
import { Clock, MapPin, Plus, Trash2 } from 'lucide-react'

const FormularioEscalas = ({
  escalas = [],
  onAgregar,
  onActualizar,
  onEliminar,
  maxEscalas = 2,
  readonly = false
}) => {
  return (
    <div className="space-y-3">
      {escalas.map((escala, index) => (
        <div key={index} className="bg-white/50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Escala {index + 1}
            </h4>
            {!readonly && (
              <button
                type="button"
                onClick={() => onEliminar(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Ciudad de escala
              </label>
              <input
                type="text"
                value={escala.ciudad}
                onChange={(e) => onActualizar(index, 'ciudad', e.target.value)}
                placeholder="Ej: Panamá"
                disabled={readonly}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Clock className="w-3 h-3 inline mr-1" />
                Duración (horas)
              </label>
              <input
                type="text"
                value={escala.duracion}
                onChange={(e) => onActualizar(index, 'duracion', e.target.value)}
                placeholder="Ej: 2.5h"
                disabled={readonly}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      ))}
      
      {!readonly && escalas.length < maxEscalas && (
        <button
          type="button"
          onClick={onAgregar}
          className="w-full py-2 px-4 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar escala ({escalas.length}/{maxEscalas})
        </button>
      )}
    </div>
  )
}

export default FormularioEscalas
```

#### **Paso 4.2: Usar FormularioEscalas en CotizadorForm**

**BUSCAR la sección de escalas en CotizadorForm (líneas ~1100-1200 aprox).**

**REEMPLAZAR todo el JSX de escalas con:**
```javascript
import FormularioEscalas from './formularios/FormularioEscalas'

// En el JSX:
<CollapsibleSection title="Escalas" defaultOpen={false}>
  <FormularioEscalas
    escalas={escalas}
    onAgregar={agregarEscala}
    onActualizar={actualizarEscala}
    onEliminar={eliminarEscala}
    maxEscalas={2}
  />
</CollapsibleSection>
```

---

### **Componente 2: FormularioEquipaje (25 min)**

#### **Paso 4.3: Crear archivo FormularioEquipaje.jsx**

**Archivo:** `dashboard/src/components/cotizador/formularios/FormularioEquipaje.jsx`

**Contenido:**
```javascript
const TIPOS_EQUIPAJE = [
  {
    id: 'completo',
    nombre: 'Equipaje completo',
    descripcion: 'Maleta 23 Kg + Carry-on 8 Kg + Artículo personal'
  },
  {
    id: 'mediano',
    nombre: 'Equipaje mediano',
    descripcion: 'Maleta 23 Kg + Artículo personal'
  },
  {
    id: 'ligero',
    nombre: 'Equipaje ligero',
    descripcion: 'Maleta 10 Kg + Artículo personal'
  }
]

const FormularioEquipaje = ({
  equipajeSeleccionado = [],
  onToggle,
  readonly = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TIPOS_EQUIPAJE.map((tipo) => (
        <label
          key={tipo.id}
          className={`
            relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
            ${equipajeSeleccionado.includes(tipo.id)
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300'
            }
            ${readonly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            type="checkbox"
            checked={equipajeSeleccionado.includes(tipo.id)}
            onChange={() => onToggle(tipo.id)}
            disabled={readonly}
            className="mt-1 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <div className="ml-3">
            <p className="text-sm font-bold text-slate-700">{tipo.nombre}</p>
            <p className="text-[10px] text-slate-500">{tipo.descripcion}</p>
          </div>
        </label>
      ))}
    </div>
  )
}

export default FormularioEquipaje
```

#### **Paso 4.4: Usar FormularioEquipaje en CotizadorForm**

**REEMPLAZAR la sección de equipaje con:**
```javascript
import FormularioEquipaje from './formularios/FormularioEquipaje'

// En el JSX:
<CollapsibleSection title="Equipaje" defaultOpen={false}>
  <FormularioEquipaje
    equipajeSeleccionado={equipajeSeleccionado}
    onToggle={toggleEquipaje}
  />
</CollapsibleSection>
```

---

## FASE 5: ACTUALIZAR CotizadorForm (1 hora)

### **Paso 5.1: Consolidar todos los imports**

**Al inicio del archivo, organizar imports por categorías:**

```javascript
// React
import { useState, useRef, useEffect } from 'react'

// Componentes externos
import CollapsibleSection from './CollapsibleSection'

// Componentes locales
import PasajerosManager from './pasajeros/PasajerosManager'
import PdfContent from './resultados/PdfContent'
import FormularioEscalas from './formularios/FormularioEscalas'
import FormularioEquipaje from './formularios/FormularioEquipaje'

// Hooks
import { useVueloInfo } from '@/hooks/cotizador/useVueloInfo'
import { useEscalas } from '@/hooks/cotizador/useEscalas'
import { useEquipaje } from '@/hooks/cotizador/useEquipaje'
import { useMonedas } from '@/hooks/cotizador/useMonedas'

// Servicios
import { calcularCotizacionIndividual } from '@/services/cotizador/cotizacionService'
import { exportarCotizacionPDF } from '@/services/cotizador/pdfService'

// Lib
import { calcularConversionInteligente } from '@/lib/cotizador/conversorInteligente'
import {
  getMonedasCotizacion,
  getMonedasBase,
  getSimboloMoneda
} from '@/lib/cotizador/monedasConfig'

// Helpers
import { toastSuccess, toastError } from '@/helpers/sweetAlerts'

// Iconos
import { Plane, Users, FileText, DollarSign } from 'lucide-react'
```

### **Paso 5.2: Verificar que NO queden estados eliminados**

**Verificar que estos estados YA NO EXISTAN:**
- ❌ `origen, setOrigen`
- ❌ `destino, setDestino`
- ❌ `aerolinea, setAerolinea`
- ❌ `fechaSalida, setFechaSalida`
- ❌ `horaSalida, setHoraSalida`
- ❌ `horaLlegada, setHoraLlegada`
- ❌ `idaVuelta, setIdaVuelta`
- ❌ `soloIda, setSoloIda`
- ❌ `finesMigratorios, setFinesMigratorios`
- ❌ `haceEscala, setHaceEscala`
- ❌ `ciudadEscala1, setCiudadEscala1`
- ❌ `tiempoEscala1, setTiempoEscala1`
- ❌ `haceSegundaEscala, setHaceSegundaEscala`
- ❌ `ciudadEscala2, setCiudadEscala2`
- ❌ `tiempoEscala2, setTiempoEscala2`
- ❌ `equipajeCompleto, setEquipajeCompleto`
- ❌ `equipajeMediano, setEquipajeMediano`
- ❌ `equipajeLigero, setEquipajeLigero`
- ❌ `monedaBaseSeleccionada, setMonedaBaseSeleccionada` (ahora viene del hook)
- ❌ `monedaCotizacionSeleccionada, setMonedaCotizacionSeleccionada` (ahora viene del hook)
- ❌ `tasaCambio, setTasaCambio` (ahora viene del hook)
- ❌ `monedasDB, setMonedasDB` (ahora viene del hook)
- ❌ `loadingMonedas, setLoadingMonedas` (ahora viene del hook)

### **Paso 5.3: Verificar función de limpieza**

**Actualizar función `limpiarFormulario` (si existe):**

```javascript
const limpiarFormulario = () => {
  resetVueloInfo()
  resetEscalas()
  resetEquipaje()
  setPrecioBase('')
  setFeeEmision('')
  setFeeAgencia('')
  setMetodoPago('')
  setMonedaBaseSeleccionada('USD')
  setMonedaCotizacionSeleccionada('')
  setTotal(0)
  setDesglose(null)
  // ... otros resets necesarios
}
```

---

## FASE 6: BUG FIX SELECTS (20 minutos)

### **Paso 6.1: Actualizar PasajerosManager.jsx**

**Archivo:** `dashboard/src/components/cotizador/pasajeros/PasajerosManager.jsx`

**MODIFICAR el onChange del select de monedaPrecio (líneas ~321-333):**

**ANTES:**
```javascript
onChange={(e) => {
  const nuevaMoneda = e.target.value
  // Notificar al padre
  if (onMonedaPrecioChange) {
    onMonedaPrecioChange(nuevaMoneda)
  }
  // Actualizar todos los pasajeros
  Object.keys(pasajeros).forEach(categoria => {
    pasajeros[categoria].forEach(pasajero => {
      actualizarPasajero(categoria, pasajero.id, 'monedaPrecio', nuevaMoneda)
    })
  })
}}
```

**DESPUÉS:**
```javascript
onChange={(e) => {
  const nuevaMoneda = e.target.value
  // SOLO notificar al padre
  if (onMonedaPrecioChange) {
    onMonedaPrecioChange(nuevaMoneda)
  }
}}
```

**Agregar useEffect para actualizar pasajeros cuando cambia la prop:**

```javascript
// Agregar después de las declaraciones de estado
useEffect(() => {
  // Cuando cambia monedaPrecio desde el padre, actualizar todos los pasajeros
  Object.keys(pasajeros).forEach(categoria => {
    pasajeros[categoria].forEach(pasajero => {
      if (pasajero.monedaPrecio !== monedaPrecio) {
        actualizarPasajero(categoria, pasajero.id, 'monedaPrecio', monedaPrecio)
      }
    })
  })
}, [monedaPrecio])
```

**MISMO CAMBIO para monedaCotizacion (líneas ~360-372):**

**ANTES:**
```javascript
onChange={(e) => {
  const nuevaMoneda = e.target.value
  if (onMonedaCotizacionChange) {
    onMonedaCotizacionChange(nuevaMoneda)
  }
  Object.keys(pasajeros).forEach(categoria => {
    pasajeros[categoria].forEach(pasajero => {
      actualizarPasajero(categoria, pasajero.id, 'monedaCotizacion', nuevaMoneda)
    })
  })
}}
```

**DESPUÉS:**
```javascript
onChange={(e) => {
  const nuevaMoneda = e.target.value
  if (onMonedaCotizacionChange) {
    onMonedaCotizacionChange(nuevaMoneda)
  }
}}
```

**Agregar useEffect:**
```javascript
useEffect(() => {
  // Cuando cambia monedaCotizacion desde el padre, actualizar todos los pasajeros
  Object.keys(pasajeros).forEach(categoria => {
    pasajeros[categoria].forEach(pasajero => {
      if (pasajero.monedaCotizacion !== monedaCotizacion) {
        actualizarPasajero(categoria, pasajero.id, 'monedaCotizacion', monedaCotizacion)
      }
    })
  })
}, [monedaCotizacion])
```

---

## FASE 7: LIMPIEZA FINAL (30 minutos)

### **Paso 7.1: Eliminar estados LEGACY**

**Verificar en CotizadorForm que NO existan:**

```javascript
// ELIMINAR si aún existen:
const [monedaPrecio, setMonedaPrecio] = useState('USD')
const [monedaCotizacion, setMonedaCotizacion] = useState('USD')
```

### **Paso 7.2: Verificar todas las referencias a estados eliminados**

**Hacer búsqueda global en CotizadorForm:**
- Buscar: `origen` → debe ser `vueloInfo.origen`
- Buscar: `setOrigen` → debe ser `updateVueloInfo('origen', ...)`
- Buscar: `equipajeCompleto` → debe ser `tieneEquipaje('completo')`
- Buscar: `haceEscala` → debe ser `tieneEscalas` o `escalas.length > 0`

### **Paso 7.3: Actualizar props a PdfContent**

**Verificar que se pasen todas las props correctamente:**

```javascript
<PdfContent
  ref={pdfContentRef}
  agencia={agencia}
  vistaCotizacion={vistaCotizacion}
  tipoPasajeroIndividual={tipoPasajeroIndividual}
  origen={vueloInfo.origen}
  destino={vueloInfo.destino}
  idaVuelta={vueloInfo.idaVuelta}
  soloIda={vueloInfo.soloIda}
  finesMigratorios={vueloInfo.finesMigratorios}
  fechaSalida={vueloInfo.fechaSalida}
  horaSalida={vueloInfo.horaSalida}
  horaLlegada={vueloInfo.horaLlegada}
  aerolinea={vueloInfo.aerolinea}
  // ... resto de props
  escalas={escalas}
  equipaje={equipajeSeleccionado}
  // ... resto
/>
```

### **Paso 7.4: Actualizar PdfContent.jsx para recibir escalas y equipaje**

**En `dashboard/src/components/cotizador/resultados/PdfContent.jsx`:**

**Agregar en destructuring de props:**
```javascript
const PdfContent = forwardRef(({
  // ... props existentes
  escalas = [],
  equipaje = [],
  // ... resto
}, ref) => {
```

**Actualizar sección de escalas en el PDF:**
```javascript
{/* Escalas */}
{escalas.length > 0 && (
  <div>
    <p className="text-xs font-semibold text-gray-700 mb-1">Escalas:</p>
    {escalas.map((escala, index) => (
      <p key={index} className="text-xs text-gray-600">
        • {escala.ciudad} ({escala.duracion})
      </p>
    ))}
  </div>
)}
```

**Actualizar sección de equipaje:**
```javascript
{/* Equipaje */}
{equipaje.length > 0 && (
  <div>
    <p className="text-xs font-semibold text-gray-700 mb-1">Equipaje:</p>
    {equipaje.map((tipo) => (
      <p key={tipo} className="text-xs text-gray-600">
        • {tipo === 'completo' ? 'Equipaje completo (23 Kg + 8 Kg + personal)' :
           tipo === 'mediano' ? 'Equipaje mediano (23 Kg + personal)' :
           'Equipaje ligero (10 Kg + personal)'}
      </p>
    ))}
  </div>
)}
```

---

## FASE 8: TESTING (1 hora)

### **Paso 8.1: Testing de hooks**

**Probar cada hook individualmente:**

1. **useVueloInfo:**
   - ✅ Ingresar origen, destino
   - ✅ Cambiar fechas
   - ✅ Togglear idaVuelta/soloIda/finesMigratorios
   - ✅ Verificar que se actualiza el PDF

2. **useEscalas:**
   - ✅ Agregar escala
   - ✅ Editar ciudad y duración
   - ✅ Agregar segunda escala
   - ✅ Eliminar escala
   - ✅ Verificar límite de 2

3. **useEquipaje:**
   - ✅ Seleccionar equipaje completo
   - ✅ Seleccionar múltiples tipos
   - ✅ Deseleccionar
   - ✅ Verificar en PDF

4. **useMonedas:**
   - ✅ Verificar carga de monedas
   - ✅ Cambiar moneda base
   - ✅ Cambiar moneda cotización
   - ✅ Verificar tasas se cargan

### **Paso 8.2: Testing de servicios**

1. **cotizacionService:**
   - ✅ Cotizar con USD → USD
   - ✅ Cotizar con USD → VES (reconversión)
   - ✅ Cotizar con EUR → COP
   - ✅ Validar errores (campos vacíos)

2. **pdfService:**
   - ✅ Exportar PDF vista individual
   - ✅ Exportar PDF vista múltiple
   - ✅ Verificar nombre de archivo

### **Paso 8.3: Testing de componentes**

1. **FormularioEscalas:**
   - ✅ Agregar/editar/eliminar escalas
   - ✅ Verificar en PDF

2. **FormularioEquipaje:**
   - ✅ Seleccionar tipos
   - ✅ Verificar en PDF

### **Paso 8.4: Testing del bug fix**

**CRÍTICO:**
1. ✅ Ir a vista múltiple
2. ✅ Cambiar moneda base → verificar select se actualiza VISUALMENTE
3. ✅ Cambiar moneda cotización → verificar select se actualiza VISUALMENTE
4. ✅ Verificar que TODOS los pasajeros se actualizan
5. ✅ Calcular cotización
6. ✅ Exportar PDF

### **Paso 8.5: Testing del flujo VES**

**MUY CRÍTICO (no romper):**
1. ✅ Moneda base: USD
2. ✅ Moneda cotización: VES
3. ✅ Verificar tasa se actualiza
4. ✅ Verificar reconversión se muestra
5. ✅ Calcular cotización
6. ✅ Verificar monto en Bs
7. ✅ Exportar PDF con reconversión

---

## 📊 CHECKLIST FINAL

Antes de dar por terminada la refactorización:

### **Archivos creados:**
- [ ] `hooks/cotizador/useVueloInfo.js`
- [ ] `hooks/cotizador/useEscalas.js`
- [ ] `hooks/cotizador/useEquipaje.js`
- [ ] `hooks/cotizador/useMonedas.js`
- [ ] `services/cotizador/cotizacionService.js`
- [ ] `services/cotizador/pdfService.js`
- [ ] `lib/cotizador/monedasConfig.js`
- [ ] `components/cotizador/formularios/FormularioEscalas.jsx`
- [ ] `components/cotizador/formularios/FormularioEquipaje.jsx`

### **Archivos movidos:**
- [ ] `PasajerosManager.jsx` → `pasajeros/`
- [ ] `PdfContent.jsx` → `resultados/`

### **Archivos modificados:**
- [ ] `CotizadorForm.jsx` (reducido de 1,520 a ~600 líneas)
- [ ] `PasajerosManager.jsx` (bug fix selects)
- [ ] `PdfContent.jsx` (recibe escalas y equipaje)
- [ ] `conversorInteligente.js` (funciones helper eliminadas)

### **Estados eliminados:**
- [ ] 9 estados de vuelo → hook useVueloInfo
- [ ] 6 estados de escalas → hook useEscalas
- [ ] 3 estados de equipaje → hook useEquipaje
- [ ] 8 estados de monedas → hook useMonedas

### **Funcionalidades:**
- [ ] Cotización individual funciona
- [ ] Cotización múltiple funciona
- [ ] Cambio de monedas funciona
- [ ] Reconversión VES funciona
- [ ] Exportar PDF funciona
- [ ] Bug de selects RESUELTO

---

## 🎯 ORDEN DE EJECUCIÓN

**Ejecutar en este orden EXACTO:**

1. ✅ FASE 0: Preparación (5 min)
2. ✅ FASE 1: monedasConfig.js (20 min)
3. ✅ FASE 2: Hooks (2h)
4. ✅ FASE 3: Servicios (1.5h)
5. ✅ FASE 4: Componentes (3h - solo FormularioEscalas y FormularioEquipaje)
6. ✅ FASE 5: Actualizar CotizadorForm (1h)
7. ✅ FASE 6: Bug fix selects (20 min)
8. ✅ FASE 7: Limpieza final (30 min)
9. ✅ FASE 8: Testing (1h)

**TOTAL:** ~10 horas

---

## ⚠️ PRECAUCIONES

1. **NO eliminar estados LEGACY hasta FASE 7**
2. **NO mover archivos hasta verificar imports**
3. **SIEMPRE hacer cambios incrementales**
4. **PROBAR después de cada fase**
5. **NO saltar fases**
6. **MANTENER backup de CotizadorForm original**

---

**¿Proceder con FASE 0?**
