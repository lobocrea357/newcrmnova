# 🚀 PLAN DE REFACTORIZACIÓN - COTIZADOR
**Fecha:** 1 de Marzo 2026  
**Objetivo:** Transformar 2223 líneas de código espagueti en arquitectura limpia y mantenible

---

## 🎯 PRIORIDADES (definidas por usuario)

1. ⭐⭐⭐⭐⭐ **Claridad del código** - Que sea fácil de entender
2. ⭐⭐⭐⭐ **Reducir líneas** - Componente más pequeño
3. ⭐⭐⭐⭐ **Evitar bugs** - No romper funcionalidad existente
4. ⭐ **Extensibilidad** - Agregar monedas/métodos (bajo)
5. ⚪ **Rendimiento** - No es prioridad

---

## 📚 CLARIFICACIONES - "FUENTE DE VERDAD"

### Sistema de Monedas ACLARADO ✅

**Flujo correcto de cotización:**
```
1. Precio de pantalla (aerolínea): SIEMPRE en USD o EUR
2. Se suma: precio_pantalla + fee_emision + fee_agencia
3. Cliente paga en: Cualquier moneda registrada en DB
4. Sistema convierte: (total en USD/EUR) → moneda_cliente
```

**Variables y su propósito REAL:**

| Variable | Propósito | Ejemplo |
|----------|-----------|---------|
| `monedaBaseSeleccionada` | Moneda del precio de pantalla | USD, EUR |
| `monedaCotizacionSeleccionada` | Moneda en la que paga el cliente | VES, COP, etc. |
| `monedaPrecio` | **DUPLICADO** de monedaBaseSeleccionada | (sincroniza en línea 606) |
| `monedaCotizacion` | **DUPLICADO** de monedaCotizacionSeleccionada | (sincroniza en línea 610) |
| `moneda` ⚠️ | **LEGACY pero USADO** - Detección automática por método de pago | VES cuando método = "Pago móvil" |
| `monedaOrigen` ⚠️ | **LEGACY pero USADO** - Para reconversión VES (USD→VES) | USD |

**Estados Legacy que NO SE PUEDEN ELIMINAR:**
- `moneda` → Usado en líneas 544, 557, 591, 696, 2186
- `monedaOrigen` → Usado en líneas 560-562, 572, 578, 2189

**Propósito:** Sistema de VES requiere mostrar "USD → VES" con tasa específica (líneas 2186-2195)

### Tasas de Conversión - Duplicación Confirmada ❌

**Problema:** Se cargan 2 veces de forma diferente

```javascript
// useEffect línea 270 - Usando tasasHelpers
const tasasData = await obtenerTasasConversion() 
setTasasDB(tasasData) // Array de objetos con relaciones

// useEffect línea 489 - Query directa a Supabase
const tasasMap = { USD: { VES: 36.5 }, ... }
setTasasDb(tasasMap) // Map para acceso rápido
```

**Decisión:** Usar SOLO arrays de objetos (preferencia del usuario)

### Vista Individual vs Múltiple

**Lógica compartida:**
- ✅ Métodos de pago
- ✅ Selección de monedas (GLOBAL en múltiple)
- ✅ Cálculo de conversión

**Diferencia crítica:**
- Vista Individual: `impuesto_COP = (total_final) * 19%`
- Vista Múltiple: `impuesto_COP = (boleto1 * 19%) + (boleto2 * 19%) + ...`
  - El impuesto se aplica POR BOLETO, no al total

**Equipaje:**
- Vista Individual: 3 checkboxes globales
- Vista Múltiple: cada pasajero tiene sus 3 checkboxes
- **Esto está correcto** - No unificar

---

## 📋 PLAN DE REFACTORIZACIÓN POR FASES

### **FASE 1: Extracción de PDF (INDEPENDIENTE)** 
⏱️ Tiempo: 1-2 horas | 🎯 Riesgo: BAJO | 📉 Reducción: ~600 líneas

**Objetivo:** Separar generación de PDF del componente principal

**Archivos a crear:**
- `components/cotizador/pdf/PdfGenerator.jsx`
- `components/cotizador/pdf/PdfIndividual.jsx`
- `components/cotizador/pdf/PdfMultiple.jsx`
- `components/cotizador/pdf/pdfHelpers.js`

**Qué mover:**
```javascript
// Función handleExportarPdf (líneas ~1550-2000)
// JSX de pdfContentRef (líneas ~1670-1970)
// Lógica de html2canvas + jsPDF
```

**Resultado:**
```javascript
// En CotizadorForm.jsx
import { PdfGenerator } from './pdf/PdfGenerator'

<PdfGenerator
  vistaCotizacion={vistaCotizacion}
  datos={datosCotizacion}
  ref={pdfRef}
/>
```

**Beneficios:**
- CotizadorForm: 2223 → ~1600 líneas (-600)
- PDF separado y reutilizable
- Más fácil de mantener y probar

---

### **FASE 2: Extracción de Constantes**
⏱️ Tiempo: 1 hora | 🎯 Riesgo: BAJO | 📉 Reducción: ~200 líneas

**2.1. Crear `lib/cotizador/paymentConfig.js`**

```javascript
/**
 * Configuración de métodos de pago y datos bancarios
 */

export const AGENCY_CONFIG = {
  name: 'Viajes Nova',
  logoUrl: '/logo-morado.png'
}

export const PAYMENT_METHODS = {
  SCALAPAY: 'Scalapay',
  BNC_USD: 'Depósitos en dólares (BNC USD)',
  BINANCE: 'Binance (USDT)',
  ARCADIA: 'Arcadia Service',
  ZELLE: 'Zelle',
  BANCACOLOMBIA: 'Bancacolombia',
  // ... resto
}

export const PAYMENT_DATA = {
  [PAYMENT_METHODS.SCALAPAY]: {
    titulo: 'Pago con Scalapay',
    descripcion: 'Financiamiento en cuotas...',
    detalles: [...]
  },
  // ... resto (líneas 22-180)
}

export const PAYMENT_DATA_ZELLE_APOLO = {
  titulo: 'Transferencia vía Zelle',
  descripcion: 'Transferencia en USD por Zelle.',
  detalles: [
    'Titular: A&D Finance Group LLC',
    'Correo: grupoapoloviajes@gmail.com',
    'Concepto: Indicar nombre del cliente y número de cotización.'
  ]
}

export const METHODS_BY_CURRENCY = {
  USD: [
    PAYMENT_METHODS.BNC_USD,
    PAYMENT_METHODS.ZELLE,
    PAYMENT_METHODS.BANESCO_PANAMA,
    PAYMENT_METHODS.CHASE,
    PAYMENT_METHODS.ARCADIA
  ],
  EUR: [
    PAYMENT_METHODS.CUENTA_EUROS,
    PAYMENT_METHODS.DEPOSITO_EUROPA,
    PAYMENT_METHODS.BIZUM,
    PAYMENT_METHODS.SCALAPAY
  ],
  VES: [
    PAYMENT_METHODS.BNC_VES,
    PAYMENT_METHODS.PAGO_MOVIL
  ],
  COP: [
    PAYMENT_METHODS.BANCACOLOMBIA,
    PAYMENT_METHODS.DAVIVIENDA,
    PAYMENT_METHODS.DEPOSITO_COLOMBIA
  ],
  USDT: [PAYMENT_METHODS.BINANCE],
  FLEXIBLE: [PAYMENT_METHODS.DEPOSITO_VENEZUELA]
}

export const ALL_PAYMENT_METHODS = Object.values(PAYMENT_METHODS)

/**
 * Obtener datos de pago según método y agencia
 */
export function getPaymentData(metodo, agencia) {
  // Zelle condicional por agencia
  if (metodo === PAYMENT_METHODS.ZELLE) {
    return agencia === 'apolo' 
      ? PAYMENT_DATA_ZELLE_APOLO 
      : PAYMENT_DATA[PAYMENT_METHODS.ZELLE]
  }
  return PAYMENT_DATA[metodo] || null
}
```

**2.2. Crear `lib/cotizador/passengerConfig.js`**

```javascript
/**
 * Configuración de tipos de pasajeros
 */

export const PASSENGER_TYPES = {
  ADULT: 'adulto',
  CHILD: 'niño',
  INFANT: 'infante'
}

export const PASSENGER_CATEGORIES = {
  adultos: {
    nombre: 'Adultos',
    singular: 'Adulto',
    icon: '👤',
    precioDefault: 0,
    feeEmisionDefault: 15
  },
  niños: {
    nombre: 'Niños',
    singular: 'Niño', 
    icon: '👶',
    precioDefault: 0,
    feeEmisionDefault: 15
  },
  infantes: {
    nombre: 'Infantes',
    singular: 'Infante',
    icon: '🍼',
    precioDefault: 0,
    feeEmisionDefault: 15
  }
}

export const LUGGAGE_OPTIONS = {
  FULL: {
    key: 'equipajeCompleto',
    label: 'Equipaje completo',
    description: '23 Kg + 8 Kg + artículo personal'
  },
  MEDIUM: {
    key: 'equipajeMediano',
    label: 'Equipaje mediano',
    description: '23 Kg + artículo personal'
  },
  LIGHT: {
    key: 'equipajeLigero',
    label: 'Equipaje ligero',
    description: '10 Kg + artículo personal'
  }
}
```

**Resultado:**
- CotizadorForm: 1600 → ~1400 líneas (-200)
- Constantes centralizadas y reutilizables
- Fácil de modificar sin tocar componente

---

### **FASE 3: Unificación de Sistema de Monedas**
⏱️ Tiempo: 2-3 horas | 🎯 Riesgo: MEDIO | 📉 Reducción: ~150 líneas

**Objetivo:** Eliminar duplicación de lógica de monedas y tasas

**3.1. Crear `lib/cotizador/currencyManager.js`**

```javascript
/**
 * Manager unificado de monedas y tasas
 * Reemplaza lógica duplicada en CotizadorForm
 */

import { obtenerMonedas, obtenerTasasConversion } from '@/lib/tasasHelpers'

// Monedas que pueden ser "precio de pantalla"
export const BASE_CURRENCIES = ['USD', 'EUR']

// Fallback cuando DB no disponible
const FALLBACK_CURRENCIES = [
  { value: 'USD', label: 'Dólares (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
]

/**
 * Hook para cargar monedas y tasas desde DB
 */
export function useCurrencyData() {
  const [currencies, setCurrencies] = useState([])
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [currenciesData, ratesData] = await Promise.all([
        obtenerMonedas(),
        obtenerTasasConversion()
      ])
      
      setCurrencies(currenciesData)
      setRates(ratesData)
      setError(null)
    } catch (err) {
      console.error('Error cargando datos de monedas:', err)
      setError(err)
      // Usar fallback
      setCurrencies(FALLBACK_CURRENCIES)
    } finally {
      setLoading(false)
    }
  }

  // Formatear para selects
  const getFormattedCurrencies = () => {
    if (loading || currencies.length === 0) {
      return FALLBACK_CURRENCIES
    }
    return currencies.map(c => ({
      value: c.codigo,
      label: `${c.nombre} (${c.codigo})`,
      symbol: c.simbolo
    }))
  }

  // Obtener monedas base (solo USD y EUR)
  const getBaseCurrencies = () => {
    const formatted = getFormattedCurrencies()
    return formatted.filter(c => BASE_CURRENCIES.includes(c.value))
  }

  // Obtener todas las monedas para cotización
  const getQuoteCurrencies = () => {
    return getFormattedCurrencies()
  }

  // Buscar tasa de conversión (dirección o inversa)
  const getRate = (from, to) => {
    if (from === to) return 1.0

    // Buscar tasa directa
    const directRate = rates.find(
      r => r.moneda_origen?.codigo === from && 
           r.moneda_destino?.codigo === to
    )
    if (directRate) return directRate.tasa

    // Buscar tasa inversa
    const inverseRate = rates.find(
      r => r.moneda_origen?.codigo === to && 
           r.moneda_destino?.codigo === from
    )
    if (inverseRate) return 1.0 / inverseRate.tasa

    console.warn(`No se encontró tasa para ${from} → ${to}`)
    return 1.0
  }

  return {
    currencies,
    rates,
    loading,
    error,
    getFormattedCurrencies,
    getBaseCurrencies,
    getQuoteCurrencies,
    getRate,
    reload: loadData
  }
}
```

**3.2. Refactorizar CotizadorForm para usar currencyManager**

```javascript
// ANTES (líneas 210-267):
const [monedasDB, setMonedasDB] = useState([])
const [tasasDB, setTasasDB] = useState([])
const [loadingMonedas, setLoadingMonedas] = useState(true)
const [tasasDb, setTasasDb] = useState({})
const [loadingTasas, setLoadingTasas] = useState(true)
// ... useEffects duplicados

// DESPUÉS:
import { useCurrencyData } from '@/lib/cotizador/currencyManager'

const {
  loading: loadingMonedas,
  getBaseCurrencies,
  getQuoteCurrencies,
  getRate
} = useCurrencyData()

const monedasBase = getBaseCurrencies()
const monedasCotizacion = getQuoteCurrencies()
```

**3.3. Eliminar imports no usados de conversorInteligente**

```javascript
// ELIMINAR:
import { getMonedasCotizacion, getMonedasBase, getMonedaInfo, esMonedaBase }

// MANTENER solo:
import { calcularConversionInteligente } from '@/lib/conversorInteligente'
```

**3.4. Simplificar estados de monedas**

```javascript
// ELIMINAR estos estados duplicados:
const [monedaPrecio, setMonedaPrecio] = useState('USD')
const [monedaCotizacion, setMonedaCotizacion] = useState('USD')

// ELIMINAR useEffects de sincronización (líneas 605-611):
useEffect(() => {
  setMonedaPrecio(monedaBaseSeleccionada)
}, [monedaBaseSeleccionada])

// MANTENER solo:
const [monedaBaseSeleccionada, setMonedaBaseSeleccionada] = useState('USD')
const [monedaCotizacionSeleccionada, setMonedaCotizacionSeleccionada] = useState('')

// MANTENER estados legacy (NECESARIOS para VES):
const [moneda, setMoneda] = useState('') // Detección automática por método
const [monedaOrigen, setMonedaOrigen] = useState('USD') // Para USD→VES
```

**3.5. Eliminar fetchTasas duplicado**

```javascript
// ELIMINAR useEffect líneas 489-529
// ELIMINAR función fetchTasas()
// ELIMINAR estado tasasDb

// TODO se maneja con useCurrencyData()
```

**Resultado:**
- CotizadorForm: 1400 → ~1250 líneas (-150)
- Un solo punto de verdad para monedas
- Lógica de tasas unificada
- Más fácil de debuggear

---

### **FASE 4: Extracción de Hooks Personalizados**
⏱️ Tiempo: 2 horas | 🎯 Riesgo: BAJO | 📉 Reducción: ~100 líneas

**4.1. Crear `hooks/useCotizacion.js`**

```javascript
/**
 * Hook para lógica de cálculo de cotización
 */
export function useCotizacion({ 
  monedaBase, 
  monedaCotizacion, 
  metodoPago 
}) {
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calcular = async (precioBase, feeEmision, feeAgencia) => {
    const base = precioBase + feeEmision + feeAgencia
    
    try {
      setLoading(true)
      const result = await calcularConversionInteligente({
        base,
        monedaBase,
        monedaCotizacion,
        metodoPago
      })
      setResultado(result)
      setError(null)
      return result
    } catch (err) {
      setError(err)
      console.error('Error calculando cotización:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { resultado, loading, error, calcular }
}
```

**4.2. Crear `hooks/usePaymentMethod.js`**

```javascript
/**
 * Hook para manejo de métodos de pago
 */
import { METHODS_BY_CURRENCY } from '@/lib/cotizador/paymentConfig'

export function usePaymentMethod(monedaCotizacion) {
  const [metodoPago, setMetodoPago] = useState('')

  // Métodos disponibles según moneda seleccionada
  const metodosDisponibles = monedaCotizacion 
    ? (METHODS_BY_CURRENCY[monedaCotizacion] || [])
    : []

  // Limpiar método si ya no está disponible
  useEffect(() => {
    if (metodoPago && !metodosDisponibles.includes(metodoPago)) {
      setMetodoPago('')
    }
  }, [monedaCotizacion])

  // Detectar moneda según método de pago
  const detectarMonedaPorMetodo = (metodo) => {
    for (const [moneda, metodos] of Object.entries(METHODS_BY_CURRENCY)) {
      if (metodos.includes(metodo)) {
        return moneda
      }
    }
    return null
  }

  return {
    metodoPago,
    setMetodoPago,
    metodosDisponibles,
    detectarMonedaPorMetodo
  }
}
```

**Resultado:**
- CotizadorForm: 1250 → ~1150 líneas (-100)
- Hooks reutilizables
- Lógica separada de UI

---

### **FASE 5: Limpieza Final y Documentación**
⏱️ Tiempo: 1-2 horas | 🎯 Riesgo: BAJO

**5.1. Agregar JSDoc a funciones críticas**

```javascript
/**
 * Calcula el total de todos los pasajeros configurados
 * @returns {number} Total sumando precioPantalla + feeEmision + feeAgencia de todos
 */
const calcularTotalPasajeros = () => {
  // ...
}
```

**5.2. Organizar imports**

```javascript
// React
import { useState, useEffect, useRef } from 'react'

// Librerías externas
import { Calculator, DollarSign, ... } from 'lucide-react'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

// Componentes
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import PasajerosManager from './PasajerosManager'
import { PdfGenerator } from './pdf/PdfGenerator'

// Hooks
import { useCurrencyData } from '@/lib/cotizador/currencyManager'
import { useCotizacion } from '@/hooks/useCotizacion'

// Helpers
import { calcularConversionInteligente } from '@/lib/conversorInteligente'
import { confirmAlert } from '@/helpers/sweetAlerts'

// Configuración
import {
  PAYMENT_DATA,
  METHODS_BY_CURRENCY,
  getPaymentData
} from '@/lib/cotizador/paymentConfig'
```

**5.3. Comentar secciones del componente**

```javascript
export default function CotizadorForm({ isAuthenticated = false }) {
  // ============================================
  // ESTADO - Vista y Navegación
  // ============================================
  const [vistaCotizacion, setVistaCotizacion] = useState('individual')
  
  // ============================================
  // ESTADO - Sistema de Monedas
  // ============================================
  const { loading, getBaseCurrencies, ... } = useCurrencyData()
  
  // ============================================
  // ESTADO - Precios y Fees
  // ============================================
  const [precioBase, setPrecioBase] = useState('')
  
  // ... etc
}
```

**5.4. Crear README para desarrolladores**

`components/cotizador/README.md`:

```markdown
# Cotizador - Documentación

## Estructura de Archivos

- `CotizadorForm.jsx` - Componente principal (~1000 líneas)
- `PasajerosManager.jsx` - Gestión de múltiples pasajeros
- `pdf/` - Generación de PDFs
- `../../lib/cotizador/` - Lógica de negocio
- `../../hooks/` - Hooks reutilizables

## Flujo de Cotización

### Vista Individual
1. Usuario selecciona moneda base (USD/EUR)
2. Ingresa precio, fee emisión, fee agencia
3. Selecciona moneda de cotización
4. Sistema calcula conversión + recargos

### Vista Múltiple
1. Usuario selecciona monedas globales
2. Agrega pasajeros con sus precios
3. Sistema calcula cada boleto
4. **Importante:** Impuesto COP se aplica POR BOLETO

## Estados Legacy

⚠️ **NO ELIMINAR:**
- `moneda` - Usada para detección automática VES
- `monedaOrigen` - Usada para mostrar USD→VES

Estas variables son necesarias para el flujo especial de Bolívares.
```

---

## 📊 RESUMEN DE RESULTADOS ESPERADOS

### Reducción de Líneas

| Fase | Líneas Antes | Líneas Después | Reducción |
|------|--------------|----------------|-----------|
| Inicial | 2223 | 2223 | - |
| Fase 1 (PDF) | 2223 | ~1600 | -600 |
| Fase 2 (Constantes) | 1600 | ~1400 | -200 |
| Fase 3 (Monedas) | 1400 | ~1250 | -150 |
| Fase 4 (Hooks) | 1250 | ~1150 | -100 |
| **TOTAL** | **2223** | **~1150** | **-1073 (-48%)** |

### Mejoras en Arquitectura

✅ **43 estados → ~35 estados** (eliminando duplicados)  
✅ **9 useEffects → ~6 useEffects** (consolidados)  
✅ **1 archivo gigante → 15+ archivos organizados**  
✅ **0 documentación → README + JSDoc completo**  
✅ **Constantes mezcladas → Configuración centralizada**  
✅ **Lógica monolítica → Hooks reutilizables**  

### Archivos Creados

```
dashboard/src/
├── components/
│   └── cotizador/
│       ├── CotizadorForm.jsx (1150 líneas - antes 2223)
│       ├── PasajerosManager.jsx (sin cambios)
│       ├── pdf/
│       │   ├── PdfGenerator.jsx (nuevo)
│       │   ├── PdfIndividual.jsx (nuevo)
│       │   ├── PdfMultiple.jsx (nuevo)
│       │   └── pdfHelpers.js (nuevo)
│       └── README.md (nuevo)
├── lib/
│   └── cotizador/
│       ├── paymentConfig.js (nuevo)
│       ├── passengerConfig.js (nuevo)
│       └── currencyManager.js (nuevo)
└── hooks/
    ├── useCotizacion.js (nuevo)
    └── usePaymentMethod.js (nuevo)
```

---

## ⚠️ RIESGOS Y MITIGACIÓN

### Riesgo Alto
- **Fase 3 (Monedas)** - Muchas dependencias
  - **Mitigación:** Tests manuales exhaustivos, branch separado

### Riesgo Medio
- **Estados Legacy** - Miedo a romper funcionalidad
  - **Mitigación:** NO tocar `moneda` ni `monedaOrigen` (se usan para VES)

### Riesgo Bajo
- **Fases 1, 2, 4, 5** - Refactors seguros
  - **Mitigación:** Verificar imports, probar PDF

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Opción A: Segura (más lenta pero sin riesgos)
```
Fase 1 → probar → commit
Fase 2 → probar → commit
Fase 3 → probar → commit
Fase 4 → probar → commit
Fase 5 → commit final
```

### Opción B: Rápida (más eficiente)
```
Fase 1 + Fase 2 → probar → commit
Fase 3 → probar → commit (branch separado)
Fase 4 + Fase 5 → commit final
```

### Opción C: Conservadora (tu recomendación)
```
Solo Fase 1 + Fase 2 (extracciones seguras)
Dejar Fase 3-5 para después
```

---

## ✅ CRITERIOS DE ÉXITO

**Al finalizar la refactorización:**
- [ ] CotizadorForm tiene menos de 1200 líneas
- [ ] Todos los imports son usados (no hay imports fantasma)
- [ ] Funcionalidad existente NO se rompe
- [ ] PDF se genera igual que antes
- [ ] Conversión de monedas funciona igual
- [ ] Vista individual y múltiple funcionan
- [ ] Código tiene comentarios explicativos
- [ ] README documenta arquitectura

---

## 🚀 PRÓXIMO PASO

**¿Qué fase quieres que implemente primero?**

**A)** Fase 1 - Extracción de PDF (bajo riesgo, alta reducción)  
**B)** Fase 2 - Extracción de constantes (bajo riesgo, claridad)  
**C)** Fase 1 + Fase 2 juntas (enfoque eficiente)  
**D)** Revisar el plan antes (hacer ajustes)
