# 📊 COMPARACIÓN: tasasHelpers.js vs conversorInteligente.js

**Fecha:** 3 de marzo de 2026  
**Objetivo:** Analizar coherencia, funciones duplicadas/no usadas y oportunidades de refactorización

---

## 🔍 ANÁLISIS DE RESPONSABILIDADES

### **tasasHelpers.js - CAPA DE DATOS**

**Responsabilidad:** Interactuar con Supabase para obtener/crear/actualizar monedas y tasas

**Funciones:**
1. ✅ `obtenerMonedas()` - Obtiene monedas activas de DB
2. ✅ `obtenerTasasConversion()` - Obtiene tasas con join de monedas
3. ✅ `obtenerTasa(origen, destino)` - Obtiene tasa específica entre 2 monedas
4. ✅ `crearConversion()` - Crea nueva tasa (usa API backend)
5. ✅ `actualizarTasa()` - Actualiza tasa existente (usa API backend)
6. ✅ `eliminarConversion()` - Elimina tasa (usa API backend)
7. ✅ `obtenerHistorialTasas()` - Obtiene historial de cambios
8. ✅ `crearMoneda()` - Crea nueva moneda (usa API backend)
9. ✅ `actualizarMoneda()` - Actualiza moneda (usa API backend)
10. ✅ `eliminarMoneda()` - Elimina moneda (usa API backend)

**Arquitectura:** ✅ CORRECTA - Capa de acceso a datos (DAL)

---

### **conversorInteligente.js - CAPA DE LÓGICA DE NEGOCIO**

**Responsabilidad:** Aplicar reglas de conversión, recargos e impuestos

**Funciones:**
1. ✅ `obtenerTasaConversion(origen, destino)` - Wrapper de `obtenerTasa()` con logs
2. ✅ `calcularConversionInteligente({...})` - **FUNCIÓN PRINCIPAL** - Aplica toda la lógica
3. ❌ `getMonedasCotizacion()` - **NO USADO EN COTIZADOR** (se redefine localmente)
4. ❌ `getMonedasBase()` - **NO USADO EN COTIZADOR**
5. ❌ `esMonedaBase(codigo)` - **NO USADO**
6. ❌ `getMonedaInfo(codigo)` - **NO USADO**

**Arquitectura:** ⚠️ MIXTO - Tiene lógica de negocio (✅) + funciones helper de UI (❌ deberían estar en otro archivo)

---

## 🔴 PROBLEMA 1: DUPLICACIÓN DE FUNCIONES

### **`getMonedasCotizacion()` - DUPLICADA**

#### **En conversorInteligente.js (líneas 163-176):**
```javascript
export function getMonedasCotizacion() {
  return [
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
}
```

#### **En CotizadorForm.jsx (líneas 254-256 + 226-246):**
```javascript
// Línea 254: Redefinición local
const getMonedasCotizacion = () => {
  return getMonedasDisponibles() // Llama a otra función local
}

// Líneas 226-246: Monedas hardcoded
const getMonedasDisponibles = () => {
  return [
    { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euros (EUR)', symbol: '€' },
    { value: 'VES', label: 'Bolívares (VES)', symbol: 'Bs.' },
    { value: 'COP', label: 'Pesos Colombianos (COP)', symbol: '$' },
    { value: 'USDT', label: 'USDT (Tether)', symbol: '₮' },
    { value: 'GBP', label: 'Libras Esterlinas (GBP)', symbol: '£' },
    { value: 'CAD', label: 'Dólares Canadienses (CAD)', symbol: 'C$' },
    { value: 'AUD', label: 'Dólares Australianos (AUD)', symbol: 'A$' },
    { value: 'JPY', label: 'Yenes Japoneses (JPY)', symbol: '¥' },
    { value: 'CHF', label: 'Francos Suizos (CHF)', symbol: 'Fr' }
  ]
}
```

**Problema:** Lista duplicada y diferente (conversor tiene `base: true/false`, cotizador no).

**Solución propuesta:**
1. Eliminar `getMonedasCotizacion()` de `conversorInteligente.js`
2. Crear nuevo archivo: `lib/cotizador/monedasConfig.js` con ambas funciones
3. Importar desde el nuevo archivo en ambos lugares

---

## 🔴 PROBLEMA 2: FUNCIONES NO USADAS

### **`getMonedasBase()` - NO USADO**

**Ubicación:** conversorInteligente.js líneas 182-187

```javascript
export function getMonedasBase() {
  return MONEDAS_BASE.map(codigo => {
    const moneda = getMonedasCotizacion().find(m => m.value === codigo)
    return moneda
  })
}
```

**Uso en CotizadorForm:** ❌ NINGUNO

**En su lugar se usa:**
```javascript
// CotizadorForm líneas 252-255
const monedasBase = [
  { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
]
```

**Solución:** Eliminar hardcoded de CotizadorForm y usar `getMonedasBase()` de conversorInteligente.

---

### **`esMonedaBase()` - NO USADO**

**Ubicación:** conversorInteligente.js líneas 194-196

```javascript
export function esMonedaBase(codigo) {
  return MONEDAS_BASE.includes(codigo)
}
```

**Uso en CotizadorForm:** ❌ NINGUNO

**Oportunidad:** Podría usarse para validar monedaBaseSeleccionada

```javascript
// Validación propuesta
if (!esMonedaBase(monedaBaseSeleccionada)) {
  toastError('Solo USD o EUR son monedas base válidas')
  return
}
```

---

### **`getMonedaInfo()` - NO USADO**

**Ubicación:** conversorInteligente.js líneas 203-205

```javascript
export function getMonedaInfo(codigo) {
  return getMonedasCotizacion().find(m => m.value === codigo) || null
}
```

**Uso en CotizadorForm:** ❌ NINGUNO

**Oportunidad:** Podría reemplazar lógica manual de símbolos

**Actualmente en CotizadorForm (líneas 539-548):**
```javascript
let simboloMoneda = '$'
if (monedaCotizacionSeleccionada === 'EUR') simboloMoneda = '€'
else if (monedaCotizacionSeleccionada === 'VES') simboloMoneda = 'Bs.'
else if (monedaCotizacionSeleccionada === 'COP') simboloMoneda = '$'
else if (monedaCotizacionSeleccionada === 'GBP') simboloMoneda = '£'
else if (monedaCotizacionSeleccionada === 'USDT') simboloMoneda = '₮'
else if (monedaCotizacionSeleccionada === 'CAD') simboloMoneda = 'C$'
else if (monedaCotizacionSeleccionada === 'AUD') simboloMoneda = 'A$'
else if (monedaCotizacionSeleccionada === 'JPY') simboloMoneda = '¥'
else if (monedaCotizacionSeleccionada === 'CHF') simboloMoneda = 'Fr'
```

**Podría ser reemplazado por:**
```javascript
const monedaInfo = getMonedaInfo(monedaCotizacionSeleccionada)
const simboloMoneda = monedaInfo?.symbol || '$'
```

**Reducción:** 10 líneas → 2 líneas

---

## ✅ FUNCIONES QUE SÍ SE USAN CORRECTAMENTE

### **`calcularConversionInteligente()` - ✅ USADO**

**Ubicación en conversorInteligente:** líneas 46-157

**Uso en CotizadorForm:** línea 481-490

```javascript
const resultado = await calcularConversionInteligente({
  base,
  monedaBase: monedaPrecio,
  monedaCotizacion: monedaCotizacion,
  metodoPago,
  tasasDb
})
```

**⚠️ PROBLEMA DETECTADO:**
- La función espera `monedaBase` y `monedaCotizacion`
- Pero recibe `monedaPrecio` y `monedaCotizacion` (estados legacy que deberían eliminarse)
- Debería recibir `monedaBaseSeleccionada` y `monedaCotizacionSeleccionada`

**Corrección necesaria:**
```diff
const resultado = await calcularConversionInteligente({
  base,
- monedaBase: monedaPrecio,
- monedaCotizacion: monedaCotizacion,
+ monedaBase: monedaBaseSeleccionada,
+ monedaCotizacion: monedaCotizacionSeleccionada,
  metodoPago,
  tasasDb
})
```

**Esto confirma que `monedaPrecio` y `monedaCotizacion` todavía se usan y NO pueden eliminarse sin esta corrección.**

---

### **`obtenerTasa()` - ✅ USADO INDIRECTAMENTE**

**Ubicación:** tasasHelpers.js líneas 55-118

**Uso:** Llamado por `obtenerTasaConversion()` en conversorInteligente.js línea 27

**Flujo:**
```
CotizadorForm 
  → calcularConversionInteligente() 
    → obtenerTasaConversion() 
      → obtenerTasa() [Supabase]
```

---

## 🎯 COHERENCIA ENTRE ARCHIVOS

### ✅ **COHERENCIA CORRECTA:**

1. **Separación de responsabilidades:**
   - `tasasHelpers.js` = Acceso a datos (Supabase)
   - `conversorInteligente.js` = Lógica de negocio (cálculos)

2. **Flujo de datos:**
   ```
   Supabase DB 
     ↓ (tasasHelpers)
   Tasas y Monedas
     ↓ (conversorInteligente)
   Conversión con recargos/impuestos
     ↓ (CotizadorForm)
   UI
   ```

### ❌ **INCOHERENCIAS DETECTADAS:**

1. **Funciones helper de UI en conversorInteligente:**
   - `getMonedasCotizacion()`, `getMonedasBase()`, `getMonedaInfo()`, `esMonedaBase()`
   - **Deberían estar en:** `lib/cotizador/monedasConfig.js`

2. **Listas hardcoded duplicadas:**
   - conversorInteligente.js tiene lista completa
   - CotizadorForm.jsx tiene su propia lista
   - **Solución:** Fuente única de verdad

3. **Estados legacy aún usados:**
   - `monedaPrecio` y `monedaCotizacion` se pasan a `calcularConversionInteligente()`
   - **Solución:** Actualizar llamada para usar estados unificados

---

## 💡 PLAN DE REFACTORIZACIÓN COHERENTE

### **PASO 1: Crear monedasConfig.js (nuevo archivo)**

```javascript
// lib/cotizador/monedasConfig.js

/**
 * Configuración centralizada de monedas
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

export function getMonedasCotizacion() {
  return MONEDAS_DISPONIBLES
}

export function getMonedasBase() {
  return MONEDAS_DISPONIBLES.filter(m => m.base)
}

export function getMonedaInfo(codigo) {
  return MONEDAS_DISPONIBLES.find(m => m.value === codigo) || null
}

export function esMonedaBase(codigo) {
  return MONEDAS_BASE.includes(codigo)
}

export function getSimboloMoneda(codigo) {
  const moneda = getMonedaInfo(codigo)
  return moneda?.symbol || '$'
}
```

---

### **PASO 2: Limpiar conversorInteligente.js**

```diff
// lib/cotizador/conversorInteligente.js

import { obtenerTasa } from './tasasHelpers'
+ import { getMonedaInfo } from './monedasConfig'

- // Monedas base para precios
- const MONEDAS_BASE = ['USD', 'EUR']

// ... mantener solo:
// - obtenerTasaConversion()
// - calcularConversionInteligente()

- /**
-  * Obtener lista de monedas disponibles para cotización
-  */
- export function getMonedasCotizacion() { ... }

- export function getMonedasBase() { ... }

- export function esMonedaBase(codigo) { ... }

- export function getMonedaInfo(codigo) { ... }
```

---

### **PASO 3: Actualizar CotizadorForm.jsx**

```diff
// CotizadorForm.jsx

- import {
-   calcularConversionInteligente,
-   getMonedasCotizacion,
-   getMonedasBase,
-   getMonedaInfo,
-   esMonedaBase
- } from '@/lib/cotizador/conversorInteligente'

+ import { calcularConversionInteligente } from '@/lib/cotizador/conversorInteligente'
+ import {
+   getMonedasCotizacion,
+   getMonedasBase,
+   getMonedaInfo,
+   getSimboloMoneda
+ } from '@/lib/cotizador/monedasConfig'

// Eliminar listas hardcoded
- const monedasBase = [
-   { value: 'USD', label: 'Dólares Americanos (USD)', symbol: '$' },
-   { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
- ]

- const getMonedasDisponibles = () => { ... }

- const getMonedasCotizacion = () => { ... }

// Usar funciones importadas
+ const monedasBase = getMonedasBase()

// Simplificar obtención de símbolo
- let simboloMoneda = '$'
- if (monedaCotizacionSeleccionada === 'EUR') simboloMoneda = '€'
- // ... 8 líneas más
+ const simboloMoneda = getSimboloMoneda(monedaCotizacionSeleccionada)

// Actualizar llamada a calcularConversionInteligente
const resultado = await calcularConversionInteligente({
  base,
- monedaBase: monedaPrecio,
- monedaCotizacion: monedaCotizacion,
+ monedaBase: monedaBaseSeleccionada,
+ monedaCotizacion: monedaCotizacionSeleccionada,
  metodoPago,
  tasasDb
})
```

---

### **PASO 4: Eliminar estados legacy (ahora sí es seguro)**

```diff
- const [monedaPrecio, setMonedaPrecio] = useState('USD')
- const [monedaCotizacion, setMonedaCotizacion] = useState('USD')
```

**Porque ya no se usan en ningún lugar después del PASO 3.**

---

## 📈 BENEFICIOS DE LA REFACTORIZACIÓN

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Archivos** | 2 (tasasHelpers, conversorInteligente) | 3 (tasasHelpers, conversorInteligente, monedasConfig) |
| **Listas duplicadas** | 2 (conversor + cotizador) | 1 (monedasConfig) |
| **Líneas en CotizadorForm** | ~40 de listas/helpers | ~5 imports |
| **Estados legacy** | 2 (monedaPrecio, monedaCotizacion) | 0 |
| **Coherencia** | ⚠️ Mixto | ✅ Clara |
| **Mantenibilidad** | ❌ Difícil (3 lugares) | ✅ Fácil (1 lugar) |

---

## 🎯 RESUMEN EJECUTIVO

### **✅ Lo que está bien:**
1. Separación tasasHelpers (datos) vs conversorInteligente (lógica)
2. `calcularConversionInteligente()` bien implementada
3. Flujo de datos coherente

### **❌ Lo que está mal:**
1. Funciones helper de UI en conversorInteligente (deberían estar en monedasConfig)
2. Listas de monedas duplicadas y hardcoded
3. 4 funciones importadas pero NO usadas
4. Estados legacy todavía se usan en `calcularConversionInteligente()`
5. 10 líneas de if/else para obtener símbolo (debería ser 1 línea)

### **🔧 Acción inmediata requerida:**
1. **PRIMERO:** Actualizar llamada a `calcularConversionInteligente()` para usar estados unificados
2. **SEGUNDO:** Crear `monedasConfig.js` y mover funciones helper
3. **TERCERO:** Eliminar imports no usados y listas hardcoded
4. **CUARTO:** Eliminar estados legacy (ahora sí es seguro)

### **⏱️ Tiempo estimado:**
- PASO 1: 15 minutos
- PASO 2: 10 minutos
- PASO 3: 20 minutos
- PASO 4: 5 minutos
- **TOTAL: 50 minutos**
