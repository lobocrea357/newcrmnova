# 🔍 AUDITORÍA COMPLETA DEL COTIZADOR
**Fecha:** 1 de Marzo 2026  
**Estado:** EN PROGRESO

---

## 📁 ARCHIVOS IDENTIFICADOS

### Componentes (`/components/cotizador/`)
- ✅ `CotizadorForm.jsx` (2223 líneas) - **COMPONENTE PRINCIPAL**
- ✅ `PasajerosManager.jsx` (564 líneas) - Manejo de múltiples pasajeros
- ✅ `TasasManager.jsx` - Admin de tasas de conversión
- ✅ `MonedasManager.jsx` - Admin de monedas
- ✅ `HistorialTasas.jsx` - Historial de cambios en tasas
- ✅ `CotizadorTutorial.jsx` - Tutorial
- ✅ `HeroTutorial.jsx` - Hero section tutorial

### Librerías (`/lib/`)
- ✅ `conversorInteligente.js` (206 líneas) - Sistema de conversión de monedas
- ✅ `tasasHelpers.js` (341 líneas) - Helpers para monedas y tasas desde Supabase

---

## 🔬 ANÁLISIS DE IMPORTS

### CotizadorForm.jsx importa:
```javascript
// De conversorInteligente.js:
import {
  calcularConversionInteligente,    // ✅ SE USA (línea 669)
  getMonedasCotizacion,              // ❌ NO SE USA (importado pero sobrescrito)
  getMonedasBase,                    // ❌ NO SE USA (importado pero sobrescrito)
  getMonedaInfo,                     // ❌ NO SE USA
  esMonedaBase                       // ❌ NO SE USA
} from '@/lib/conversorInteligente'

// De tasasHelpers.js:
import { 
  obtenerMonedas,                    // ✅ SE USA (línea 275)
  obtenerTasasConversion             // ✅ SE USA (línea 276)
} from '@/lib/tasasHelpers'
```

### Otros componentes:
- **TasasManager.jsx** → usa `obtenerMonedas, obtenerTasasConversion, crearConversion, actualizarTasa, eliminarConversion`
- **MonedasManager.jsx** → usa `obtenerMonedas, crearMoneda, actualizarMoneda, eliminarMoneda`
- **HistorialTasas.jsx** → usa `obtenerHistorialTasas`

---

## 🚨 PROBLEMAS DETECTADOS

### 1. **DUPLICACIÓN CRÍTICA - Funciones de Monedas**

#### En `conversorInteligente.js` (líneas 163-176):
```javascript
export function getMonedasCotizacion() {
  return [
    { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$', base: true },
    { value: 'EUR', label: 'Euros (EUR)', symbol: '€', base: true },
    { value: 'VES', label: 'Bolívares (VES)', symbol: 'Bs.', base: false },
    // ... 7 monedas más HARDCODED
  ]
}
```
**📌 Estado:** HARDCODED (estático)

#### En `CotizadorForm.jsx` (líneas 425-442):
```javascript
const getMonedasDisponibles = () => {
  if (loadingMonedas || monedasDB.length === 0) {
    // Fallback a monedas hardcoded
    return [
      { value: 'USD', label: 'Dólares (USD)', symbol: '$' },
      { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
    ]
  }
  return monedasDB.map(moneda => ({
    value: moneda.codigo,
    label: `${moneda.nombre} (${moneda.codigo})`,
    symbol: moneda.simbolo
  }))
}
```
**📌 Estado:** DINÁMICO desde DB

#### En `CotizadorForm.jsx` (líneas 451-453):
```javascript
const getMonedasCotizacion = () => {
  return getMonedasDisponibles()  // Llama a la función local, NO a la importada
}
```
**📌 Estado:** SOBRESCRIBE la función importada

### ⚠️ **CONCLUSIÓN:** 
- Se importa `getMonedasCotizacion` de `conversorInteligente` pero NUNCA se usa
- Se crea una función local con EL MISMO NOMBRE que sobrescribe la importada
- Hay 2 fuentes de verdad para monedas: hardcoded vs DB

---

### 2. **IMPORTS NO USADOS**

❌ **De conversorInteligente.js (NO SE USAN):**
- `getMonedasBase` - Importado línea 13, NUNCA usado
- `getMonedaInfo` - Importado línea 14, NUNCA usado
- `esMonedaBase` - Importado línea 15, NUNCA usado

**Impacto:** Incrementa bundle size innecesariamente

---

### 3. **CONSTANTES GIGANTES EN COMPONENTE**

#### `DATOS_PAGO_POR_METODO` (líneas 22-180)
- **158 líneas** de configuración de métodos de pago
- Incluye: Scalapay, BNC USD, Binance, Arcadia, Zelle, Bancacolombia, etc.
- **Debería estar en:** `lib/paymentConfig.js`

#### `DATOS_PAGO_ZELLE_APOLO` (líneas 182-190)
- Configuración alternativa para Zelle Apolo
- **Debería estar en:** `lib/paymentConfig.js`

#### `AGENCY_NAME` y `AGENCY_LOGO_URL` (líneas 19-20)
- Constantes de agencia
- **Debería estar en:** `config/agency.js` o similar

---

### 4. **ESTADOS REDUNDANTES/CONFUSOS**

```javascript
// Líneas 204-219 - Sistema de monedas CONFUSO
const [monedaPrecio, setMonedaPrecio] = useState('USD')           // ¿Qué es esto?
const [monedaCotizacion, setMonedaCotizacion] = useState('USD')   // ¿Qué es esto?
const [moneda, setMoneda] = useState('')                          // Legacy
const [monedaOrigen, setMonedaOrigen] = useState('USD')           // Legacy
const [monedaBaseSeleccionada, setMonedaBaseSeleccionada] = useState('USD')           // ¿Otra?
const [monedaCotizacionSeleccionada, setMonedaCotizacionSeleccionada] = useState('') // ¿Otra?
```

**📌 PROBLEMA:** 6 estados diferentes para manejar monedas
- `monedaPrecio` vs `monedaBaseSeleccionada` → ¿Son lo mismo?
- `monedaCotizacion` vs `monedaCotizacionSeleccionada` → ¿Son lo mismo?
- `moneda` y `monedaOrigen` marcados como "legacy" pero AÚN EN USO

---

### 5. **ESTADOS DE EQUIPAJE**

```javascript
// Líneas 251-253 - SOLO para vista individual
const [equipajeCompleto, setEquipajeCompleto] = useState(false)
const [equipajeMediano, setEquipajeMediano] = useState(false)
const [equipajeLigero, setEquipajeLigero] = useState(false)
```

Pero en `PasajerosManager.jsx` cada pasajero tiene:
```javascript
equipajeCompleto: true,
equipajeMediano: false,
equipajeLigero: false,
```

**📌 PROBLEMA:** Lógica de equipaje duplicada entre vista individual y múltiple

---

## 🎯 FUNCIONALIDADES QUE SÍ SE USAN

### De `conversorInteligente.js`:
✅ `calcularConversionInteligente` - Usado en línea 669 para cálculos

### De `tasasHelpers.js`:
✅ `obtenerMonedas` - Cargar monedas desde DB
✅ `obtenerTasasConversion` - Cargar tasas desde DB
✅ `crearConversion` - En TasasManager
✅ `actualizarTasa` - En TasasManager
✅ `eliminarConversion` - En TasasManager
✅ `crearMoneda` - En MonedasManager
✅ `actualizarMoneda` - En MonedasManager
✅ `eliminarMoneda` - En MonedasManager
✅ `obtenerHistorialTasas` - En HistorialTasas

---

## 🎯 FUNCIONALIDADES QUE NO SE USAN

### De `conversorInteligente.js`:
❌ `obtenerTasaConversion` - Función pública que nadie llama
❌ `getMonedasCotizacion` - Sobrescrita localmente
❌ `getMonedasBase` - Nunca usada
❌ `esMonedaBase` - Nunca usada
❌ `getMonedaInfo` - Nunca usada

### De `tasasHelpers.js`:
❌ `obtenerTasa` - Solo usada INTERNAMENTE por conversorInteligente, no expuesta
✅ Todas las demás SÍ se usan en managers

---

---

## 📊 CONTEO DE ESTADOS Y HOOKS

### Estados (useState) en CotizadorForm.jsx:
**Total: 43 estados** 🚨

**Grupo 1: Vista y Navegación (2)**
- `vistaCotizacion` - 'individual' o 'multiple'
- `primerVez` - Control de SweetAlert inicial

**Grupo 2: Tipo de Pasajero (1)**
- `tipoPasajeroIndividual` - 'adulto', 'niño', 'infante'

**Grupo 3: Precios y Fees (3)**
- `precioBase`
- `feeEmision`
- `feeAgencia`

**Grupo 4: Sistema de Monedas - CAOS TOTAL (12 estados para monedas!) 🚨**
- `monedaPrecio` ← Sistema nuevo
- `monedaCotizacion` ← Sistema nuevo
- `moneda` ← Legacy
- `monedaOrigen` ← Legacy
- `monedaBaseSeleccionada` ← Sistema nuevo (¿duplicado de monedaPrecio?)
- `monedaCotizacionSeleccionada` ← Sistema nuevo (¿duplicado de monedaCotizacion?)
- `monedasDB` ← Datos desde DB
- `tasasDB` ← Tasas desde DB
- `tasasDb` ← ¿DUPLICADO de tasasDB? (diferente capitalización)
- `loadingMonedas` ← Loading de DB
- `loadingTasas` ← ¿DUPLICADO de loadingMonedas?
- `tasaCambio` ← Tasa actual

**Grupo 5: Conversión y Resultados (3)**
- `resultadoConversion` - Objeto del resultado
- `total` - Total calculado
- `desglose` - Desglose de montos

**Grupo 6: Método de Pago (1)**
- `metodoPago`

**Grupo 7: Datos del Vuelo (6)**
- `fechaSalida`
- `horaSalida`
- `horaLlegada`
- `origen`
- `destino`
- `aerolinea`

**Grupo 8: Tipo de Vuelo (3)**
- `idaVuelta`
- `finesMigratorios`
- `soloIda`

**Grupo 9: Fines Migratorios (3)**
- `fechaSalidaMigratorio`
- `horaSalidaMigratorio`
- `horaLlegadaMigratorio`

**Grupo 10: Regreso (3)**
- `fechaRegreso`
- `horaSalidaRegreso`
- `horaLlegadaRegreso`

**Grupo 11: Escalas (6)**
- `haceEscala`
- `ciudadEscala1`
- `tiempoEscala1`
- `haceSegundaEscala`
- `ciudadEscala2`
- `tiempoEscala2`

**Grupo 12: Equipaje (3)**
- `equipajeCompleto`
- `equipajeMediano`
- `equipajeLigero`

**Grupo 13: Pasajeros (1)**
- `pasajeros` - Objeto con adultos/niños/infantes

**Grupo 14: Agencia (1)**
- `agencia` - 'nova', 'colombia', 'apolo'

**Grupo 15: PDF (1)**
- `exportingPdf`

### useEffect Hooks: **9 useEffects** 🚨

1. **Línea 270** - Cargar monedas y tasas desde DB
2. **Línea 290** - SweetAlert inicial
3. **Línea 479** - Limpiar método pago si no disponible
4. **Línea 489** - Cargar tasas al iniciar
5. **Línea 542** - Detección automática de moneda por método pago
6. **Línea 590** - Actualizar tasa para VES
7. **Línea 597** - Actualizar tasa para no-VES
8. **Línea 605** - Sincronizar monedaPrecio con monedaBaseSeleccionada
9. **Línea 609** - Sincronizar monedaCotizacion con monedaCotizacionSeleccionada
10. **Línea 614** - Recalcular con debounce

**⚠️ PROBLEMA:** Múltiples useEffects interdependientes = **Spaghetti de efectos secundarios**

---

## 🔥 DUPLICACIONES CRÍTICAS DETECTADAS

### 1. Sistema de Tasas DUPLICADO

**fetchTasas() en CotizadorForm (líneas 493-529):**
```javascript
const fetchTasas = async () => {
  const { data } = await supabase.from('tasas_conversion').select(...)
  // Crea tasasMap local
  setTasasDb(tasasMap)
}
```

**obtenerTasasConversion() en tasasHelpers.js:**
```javascript
export async function obtenerTasasConversion() {
  const { data: tasas } = await supabase.from('tasas_conversion').select(...)
  // Devuelve array de tasas con monedas
  return tasas.map(...)
}
```

**📌 PROBLEMA:** Dos formas diferentes de cargar las mismas tasas
- Una crea un Map (tasasDb)
- Otra devuelve un array (tasasDB)
- Se cargan 2 veces en useEffects diferentes (líneas 270 y 489)

### 2. Estados de Moneda REDUNDANTES

```javascript
// ¿Cuál es la verdad?
monedaPrecio              // Sistema nuevo
monedaBaseSeleccionada    // Sistema nuevo ¿duplicado?

monedaCotizacion          // Sistema nuevo
monedaCotizacionSeleccionada  // Sistema nuevo ¿duplicado?

// Hay useEffects que sincronizan uno con otro (líneas 605-611)
useEffect(() => {
  setMonedaPrecio(monedaBaseSeleccionada)
}, [monedaBaseSeleccionada])
```

**📌 DIAGNÓSTICO:** Sistema de migración mal hecho. Intentaron migrar de un sistema a otro pero dejaron ambos funcionando.

### 3. Funciones de Monedas SOBRESCRITAS

**Importadas pero NO usadas:**
```javascript
import { getMonedasCotizacion, getMonedasBase } from '@/lib/conversorInteligente'
```

**Sobrescritas localmente:**
```javascript
const getMonedasCotizacion = () => {
  return getMonedasDisponibles()  // Función local diferente
}

const monedasBase = [...]  // Constante local, no función
```

**📌 RESULTADO:** El import es inútil, confunde el código

---

## 🎯 CONSTANTES QUE DEBEN EXTRAERSE

### Archivo propuesto: `lib/paymentConfig.js`

#### Constantes a mover:
1. **DATOS_PAGO_POR_METODO** (158 líneas, 22-180)
2. **DATOS_PAGO_ZELLE_APOLO** (8 líneas, 182-190)
3. **metodosPorMoneda** (30 líneas, 393-422)
4. **Lista completa de métodos** (líneas 370-390)

**Total a extraer:** ~196 líneas de configuración

#### Estructura propuesta:
```javascript
// lib/paymentConfig.js
export const AGENCY_CONFIG = {
  name: 'Viajes Nova',
  logoUrl: '/logo-morado.png'
}

export const PAYMENT_METHODS = {
  SCALAPAY: 'Scalapay',
  BNC_USD: 'Depósitos en dólares (BNC USD)',
  // ... todos los métodos
}

export const PAYMENT_DATA = {
  [PAYMENT_METHODS.SCALAPAY]: {
    titulo: '...',
    descripcion: '...',
    detalles: [...]
  },
  // ... resto
}

export const PAYMENT_DATA_ZELLE_APOLO = { ... }

export const METHODS_BY_CURRENCY = {
  USD: [...],
  EUR: [...],
  VES: [...],
  COP: [...],
  USDT: [...],
  FLEXIBLE: [...]
}

export const ALL_PAYMENT_METHODS = [...]
```

**Beneficios:**
- ✅ Reduce CotizadorForm de 2223 → ~2027 líneas (-196)
- ✅ Centraliza configuración de pagos
- ✅ Facilita agregar/modificar métodos
- ✅ Permite reutilizar en otros componentes

---

### Archivo propuesto: `lib/currencyConfig.js`

#### Lógica a centralizar:
1. **getMonedasDisponibles** (función local líneas 425-442)
2. **getMonedasConTasas** (función local líneas 456-471)
3. **monedasBase** (constante líneas 445-448)
4. Unificar con funciones de `conversorInteligente.js`

**Problema actual:** 3 archivos manejan monedas:
- `conversorInteligente.js` - Funciones hardcoded
- `tasasHelpers.js` - Queries a DB
- `CotizadorForm.jsx` - Funciones híbridas

**Solución:** Un solo archivo con estrategia clara:
```javascript
// lib/currencyConfig.js
import { obtenerMonedas } from './tasasHelpers'

// Fallback cuando DB no disponible
const FALLBACK_CURRENCIES = [
  { value: 'USD', label: 'Dólares (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
]

// Monedas permitidas como base de precios
export const BASE_CURRENCIES = ['USD', 'EUR']

// Hook para obtener monedas dinámicamente
export function useCurrencies() {
  const [currencies, setCurrencies] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Lógica de carga
  }, [])
  
  return { currencies, loading }
}
```

---

## 🏗️ ARQUITECTURA ACTUAL - DIAGRAMA

```
┌─────────────────────────────────────────────────────┐
│         CotizadorForm.jsx (2223 líneas)             │
│  ┌─────────────────────────────────────────────┐   │
│  │  43 estados entrelazados                     │   │
│  │  9 useEffects interdependientes              │   │
│  │  196 líneas de constantes de config          │   │
│  │  500+ líneas de JSX para PDF                 │   │
│  │  Lógica de negocio mezclada con UI           │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Importa de:                                        │
│  ├─ conversorInteligente.js (pero sobrescribe)     │
│  ├─ tasasHelpers.js (duplica lógica)               │
│  └─ PasajerosManager.jsx                           │
└─────────────────────────────────────────────────────┘
         ↓              ↓               ↓
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │ tasas  │    │ monedas  │    │ métodos  │
    │ (DB)   │    │ (DB)     │    │ de pago  │
    └────────┘    └──────────┘    └──────────┘
      ↓ ↑            ↓ ↑              (config)
   Carga 2x       Carga 2x
   en useEffects  diferentes
   diferentes     formatos
```

---

## ⚠️ CÓDIGO LEGACY QUE SIGUE ACTIVO

Marcado como "legacy" pero **AÚN EN USO:**

```javascript
// Variables legacy (mantener para compatibilidad)
const [moneda, setMoneda] = useState('')              // ✅ USADO en líneas 544, 557
const [monedaOrigen, setMonedaOrigen] = useState('USD') // ✅ USADO en líneas 560-562
```

**📌 PROBLEMA:** Comentario dice "legacy" pero no pueden eliminarse porque el código depende de ellos.

---

## 🎯 RESUMEN EJECUTIVO

### ❌ PROBLEMAS PRINCIPALES:

1. **43 estados** en un solo componente → Imposible de mantener
2. **9 useEffects** interdependientes → Comportamiento impredecible
3. **Duplicación de lógica** de tasas y monedas
4. **Imports no usados** de conversorInteligente
5. **196 líneas de constantes** mezcladas con lógica
6. **Sistema de monedas confuso** (6 estados para lo mismo)
7. **Código "legacy" activo** contradice comentarios

### ✅ QUÉ SÍ FUNCIONA:

- `calcularConversionInteligente` de conversorInteligente.js
- `tasasHelpers.js` para CRUD de monedas/tasas
- Managers (TasasManager, MonedasManager) funcionan bien

### 🚀 FASE 1 - EXTRACCIÓN DE CONSTANTES

**Opción A: Extracción Conservadora (RECOMENDADA)**
```
1. Crear lib/paymentConfig.js
2. Mover DATOS_PAGO_* y metodosPorMoneda
3. Importar en CotizadorForm
4. Verificar que todo funciona igual
```
**Tiempo:** 30-45 minutos  
**Riesgo:** Bajo  
**Reducción:** ~200 líneas

**Opción B: Extracción Agresiva**
```
1. Hacer Opción A
2. Crear lib/currencyConfig.js
3. Unificar lógica de monedas
4. Eliminar duplicaciones
```
**Tiempo:** 2-3 horas  
**Riesgo:** Medio (puede romper cosas)  
**Reducción:** ~400 líneas

---

## 📋 SIGUIENTE PASO

**¿Qué prefieres que haga?**

**A)** Implementar Fase 1 - Opción A (extracción conservadora de constantes)  
**B)** Crear plan detallado para refactorización completa por fases  
**C)** Continuar auditando otros aspectos (lógica de PDF, validaciones, etc.)

