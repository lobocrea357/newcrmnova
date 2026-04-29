# 🔍 AUDITORÍA COMPLETA: Lógica de Cálculos del Cotizador

**Fecha:** 27 de abril, 2026  
**Auditor:** AI Code Review  
**Objetivo:** Identificar toda la lógica de cálculos, helpers, duplicaciones y código espagueti

---

## 📋 RESUMEN EJECUTIVO

### ✅ Archivos Identificados (Total: 15)

#### **Helpers de Cálculo** (6 archivos)
1. `src/lib/cotizador/conversorInteligente.js` - Conversión de monedas + recargos + impuestos
2. `src/lib/cotizador/tasasHelpers.js` - CRUD de tasas de conversión
3. `src/lib/cotizador/monedasConfig.js` - Configuración estática de monedas
4. `src/lib/cotizador/paymentConfig.js` - Métodos de pago y datos bancarios
5. `src/lib/cotizador/passengerConfig.js` - Configuración de tipos de pasajero
6. `src/services/cotizador/cotizacionService.js` - Lógica de negocio (validación + cálculo base)

#### **Componentes con Lógica de Cálculo** (5 archivos)
7. `src/components/cotizador/CotizadorForm.jsx` - **COMPONENTE PRINCIPAL** (1522 líneas)
8. `src/components/cotizador/ResumenCotizacionSticky.jsx` - Desglose visual
9. `src/components/cotizador/pasajeros/PasajerosManager.jsx` - Gestión de pasajeros
10. `src/components/cotizador/resultados/PdfContent.jsx` - Exportación PDF
11. `src/components/cotizador/TasasManager.jsx` - Administración de tasas

#### **Hooks** (4 archivos)
12. `src/hooks/cotizador/useMonedas.js` - Estado de monedas y tasas
13. `src/hooks/cotizador/useVueloInfo.js` - Estado del vuelo
14. `src/hooks/cotizador/useEscalas.js` - Estado de escalas
15. `src/hooks/cotizador/useEquipaje.js` - Estado de equipaje

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **DUPLICACIÓN MASIVA DE LÓGICA DE CÁLCULO**

#### **Cálculo de Total por Pasajero** (5 ubicaciones duplicadas):

**Ubicación 1:** `CotizadorForm.jsx:569-579`
```javascript
const calcularTotalPasajeros = () => {
  let total = 0
  Object.values(pasajeros).forEach(categoriaPasajeros => {
    total += categoriaPasajeros.reduce((sum, pasajero) => {
      return sum + parseFloat(pasajero.precioPantalla || 0) +
        parseFloat(pasajero.feeEmision || 0) +
        parseFloat(pasajero.feeAgencia || 0)
    }, 0)
  })
  return total
}
```

**Ubicación 2:** `PasajerosManager.jsx:164-174`
```javascript
const calcularGranTotal = () => {
  let granTotal = 0
  Object.values(pasajeros).forEach(categoriaPasajeros => {
    granTotal += categoriaPasajeros.reduce((sum, pasajero) => {
      return sum + parseFloat(pasajero.precioPantalla || 0) +
        parseFloat(pasajero.feeEmision || 0) +
        parseFloat(pasajero.feeAgencia || 0)
    }, 0)
  })
  return granTotal
}
```

**Ubicación 3:** `PasajerosManager.jsx:148-161` (cálculo por categoría)
```javascript
const calcularTotalesCategoria = (categoriaPasajeros) => {
  return categoriaPasajeros.reduce((totales, pasajero) => {
    const subtotal = parseFloat(pasajero.precioPantalla || 0) +
      parseFloat(pasajero.feeEmision || 0) +
      parseFloat(pasajero.feeAgencia || 0)
    // ...
  }, { cantidad: 0, subtotal: 0, precioBase: 0, totalFees: 0 })
}
```

**Ubicación 4:** `ResumenCotizacionSticky.jsx:155-158`
```javascript
const precioPantalla = parseFloat(pasajero.precioPantalla || 0)
const feeEmision = parseFloat(pasajero.feeEmision || 0)
const feeAgencia = parseFloat(pasajero.feeAgencia || 0)
const totalBoleto = precioPantalla + feeEmision + feeAgencia
```

**Ubicación 5:** `PdfContent.jsx:295-297`
```javascript
const totalBoleto = parseFloat(pasajero.precioPantalla || 0) +
  parseFloat(pasajero.feeEmision || 0) +
  parseFloat(pasajero.feeAgencia || 0)
```

**🔴 IMPACTO:** Si la fórmula de cálculo cambia, hay que modificar **5 archivos diferentes**.

---

### 2. **DUPLICACIÓN DE CONFIGURACIÓN DE PASAJEROS**

#### **Definición duplicada en 2 ubicaciones:**

**Ubicación 1:** `passengerConfig.js:5-27`
```javascript
export const PASSENGER_CATEGORIES = {
  adultos: {
    nombre: 'Adultos',
    color: 'blue',
    descripcion: 'Pasajeros mayores de 12 años',
    precioDefault: 500,
    feeEmisionDefault: 50
  },
  // ...
}
```

**Ubicación 2:** `PasajerosManager.jsx:9-34`
```javascript
const CATEGORIAS_PASAJEROS = {
  adultos: {
    nombre: 'Adultos',
    color: 'blue',
    icono: Users,
    descripcion: 'Pasajeros mayores de 12 años',
    precioDefault: 500,
    feeEmisionDefault: 50
  },
  // ...
}
```

**🔴 IMPACTO:** Configuración NO centralizada. Si cambian los precios default, hay que actualizar 2 lugares.

---

### 3. **LÓGICA DE NEGOCIO EN COMPONENTES UI**

#### **Problema:** `CotizadorForm.jsx` tiene 3 responsabilidades mezcladas:

1. **Renderizado UI** (formularios, inputs, botones)
2. **Lógica de cálculo** (líneas 569-641)
3. **Persistencia de datos** (líneas 706-868)

**Ejemplo de cálculo dentro del componente:**
```javascript
// CotizadorForm.jsx:586-641
const calcularCotizacion = async () => {
  const base = calcularTotalPasajeros()
  const precio = base
  const emision = 0
  const agencia = 0

  try {
    const resultado = await calcularConversionInteligente({
      base,
      monedaBase: monedaBaseSeleccionada,
      monedaCotizacion: monedaCotizacionSeleccionada,
      metodoPago
    })
    // 50+ líneas más de lógica...
  }
}
```

**🔴 IMPACTO:** Imposible reutilizar esta lógica en otros componentes sin duplicar código.

---

### 4. **FALTA DE HELPERS ESPECÍFICOS**

#### **Cálculos que NO tienen helper dedicado:**

1. **Cálculo de Fee de Emisión según Aerolínea**
   - Actualmente en: `PasajerosManager.jsx:65-71`
   - Lógica: `if (aerolinea.includes('estelar')) return '10' else return '15'`
   - ❌ No existe: `calcularFeeEmisionPorAerolinea(aerolinea)`

2. **Formateo de Montos**
   - Duplicado en 2 lugares:
     - `CotizadorForm.jsx:686-692`
     - `cotizacionService.js:71-77`
   - ❌ No existe helper centralizado

3. **Validación de Pasajeros**
   - Lógica inline en: `CotizadorForm.jsx:582-584`
   - ❌ No existe: `validarPasajeros(pasajeros)`

---

## 📊 FLUJO COMPLETO DE CÁLCULOS (Paso a Paso)

### **PASO 1: Usuario agrega pasajeros**
```
PasajerosManager.agregarPasajero()
  ├─> Genera pasajero con defaults
  ├─> calcularFeeEmision() → '10' o '15'
  └─> onChange(nuevosPasajeros)
```

### **PASO 2: Usuario modifica precios/fees**
```
PasajerosManager.actualizarPasajero(campo, valor)
  └─> onChange actualiza estado en CotizadorForm
```

### **PASO 3: CotizadorForm detecta cambios (useEffect)**
```
useEffect [pasajeros, monedas, metodoPago]
  ├─> tienePasajerosConfigurados() → verifica si hay pasajeros
  ├─> setTimeout(300ms) → debounce
  └─> calcularCotizacion()
```

### **PASO 4: Calcular base (suma todos los pasajeros)**
```
CotizadorForm.calcularTotalPasajeros()
  ├─> Itera Object.values(pasajeros)
  ├─> Para cada categoría (adultos, niños, infantes):
  │   └─> reduce((sum, p) => sum + parseFloat(p.precioPantalla) 
  │                              + parseFloat(p.feeEmision)
  │                              + parseFloat(p.feeAgencia))
  └─> Retorna: total base en USD/EUR
```

### **PASO 5: Conversión inteligente**
```
calcularConversionInteligente({ base, monedaBase, monedaCotizacion, metodoPago })
  ├─> PASO 5.1: Obtener tasa
  │   └─> obtenerTasaConversion(monedaBase, monedaCotizacion)
  │       └─> tasasHelpers.obtenerTasa(codigoOrigen, codigoDestino)
  │           ├─> Consulta Supabase: tasas_conversion
  │           ├─> Busca tasa directa (USD→COP)
  │           ├─> Si no existe, busca inversa (COP→USD) y calcula 1/tasa
  │           └─> Retorna: tasa (ej: 4300.00)
  │
  ├─> PASO 5.2: Convertir base
  │   └─> baseConvertida = base * tasaConversion
  │       Ejemplo: 500 USD * 4300 = 2,150,000 COP
  │
  ├─> PASO 5.3: Aplicar recargos por método de pago
  │   ├─> Scalapay: baseConvertida * 0.113 (11.3%)
  │   ├─> Arcadia: baseConvertida * 0.056 + (10 USD * tasa)
  │   ├─> Depósitos USD: baseConvertida * 0.045 (4.5%)
  │   ├─> Tarjeta Crédito: baseConvertida * 0.05 (5%)
  │   └─> montoConvertido = baseConvertida + recargos
  │
  ├─> PASO 5.4: Aplicar impuestos SOLO para COP
  │   └─> if (monedaCotizacion === 'COP'):
  │       ├─> impuestos = Math.round(montoConvertido * 0.004)
  │       └─> montoConvertido += impuestos
  │
  └─> PASO 5.6: Retornar resultado
      └─> { baseOriginal, baseConvertida, tasaConversion, 
            impuestos, recargos, total, desglose[], ... }
```

### **PASO 6: Actualizar UI**
```
CotizadorForm.calcularCotizacion() (continuación)
  ├─> setResultadoConversion(resultado)
  ├─> setTotal(resultado.total)
  ├─> setTasaCambio(resultado.tasaConversion.toString())
  └─> setDesglose({ /* formato legacy para compatibilidad */ })
```

### **PASO 7: Renderizar ResumenCotizacionSticky**
```
ResumenCotizacionSticky
  ├─> Muestra total formateado
  ├─> Desglose expandible por categoría:
  │   └─> Para cada pasajero:
  │       └─> Recalcula: parseFloat(precioPantalla) + feeEmision + feeAgencia
  └─> Muestra tasa de cambio y recargos
```

---

## 🧩 MAPA DE DEPENDENCIAS

```
CotizadorForm.jsx (COMPONENTE RAÍZ)
  │
  ├──> HOOKS
  │    ├─> useMonedas.js
  │    │   └─> tasasHelpers.js (obtenerMonedas, obtenerTasasConversion)
  │    ├─> useVueloInfo.js
  │    ├─> useEscalas.js
  │    └─> useEquipaje.js
  │
  ├──> HELPERS DE CÁLCULO
  │    ├─> conversorInteligente.js
  │    │   └─> tasasHelpers.js (obtenerTasa)
  │    └─> cotizacionService.js
  │        └─> conversorInteligente.js
  │
  ├──> CONFIGURACIÓN
  │    ├─> monedasConfig.js
  │    ├─> paymentConfig.js
  │    └─> agencyThemes.js
  │
  └──> COMPONENTES HIJOS
       ├─> PasajerosManager.jsx
       │   ├─> passengerConfig.js (⚠️ duplicado)
       │   └─> Lógica de cálculo inline (⚠️ duplicada)
       │
       ├─> ResumenCotizacionSticky.jsx
       │   └─> Lógica de cálculo inline (⚠️ duplicada)
       │
       └─> PdfContent.jsx
           └─> Lógica de cálculo inline (⚠️ duplicada)
```

---

## 🚨 CÓDIGO ESPAGUETI DETECTADO

### **1. CotizadorForm.jsx es un Monolito**

**Métricas:**
- **Líneas:** 1,522
- **Estados locales:** 28
- **useEffect:** 6+
- **Funciones:** 15+
- **Responsabilidades:** 5 (UI + Cálculo + Validación + Persistencia + Draft)

**Problemas:**
- Viola el Principio de Responsabilidad Única (SRP)
- Difícil de testear
- Difícil de mantener
- Imposible de reutilizar lógica

### **2. parseFloat() Repetido 30+ Veces**

**Patrón encontrado en 5 archivos:**
```javascript
parseFloat(pasajero.precioPantalla || 0) +
parseFloat(pasajero.feeEmision || 0) +
parseFloat(pasajero.feeAgencia || 0)
```

**Riesgo:** Si cambia el tipo de dato o la lógica de parsing, hay que actualizar 30+ ubicaciones.

### **3. Validaciones Inconsistentes**

**Ubicación 1:** `cotizacionService.js:6-16`
```javascript
if (!precioBase || precioBase <= 0) errores.push(...)
if (!feeEmision) errores.push(...)  // ⚠️ No valida <= 0
if (!feeAgencia || feeAgencia <= 0) errores.push(...)
```

**Ubicación 2:** `CotizadorForm.jsx:708-719` (validaciones diferentes)
```javascript
if (!nombreCliente.trim()) return
if (!vueloInfo.origen || !vueloInfo.destino) return
// ⚠️ No valida los mismos campos
```

---

## ⚠️ RIESGOS ACTUALES

### **Alto Riesgo:**
1. **Bugs por duplicación:** Cambiar la fórmula de cálculo requiere modificar 5 archivos
2. **Inconsistencias:** Diferentes componentes pueden calcular totales de forma distinta
3. **Difícil debugging:** Lógica distribuida en múltiples archivos sin centralización

### **Medio Riesgo:**
1. **Performance:** Múltiples recálculos en cada render (no memoizados)
2. **Falta de tests:** Sin tests unitarios para validar cálculos
3. **Magic numbers:** Recargos hardcodeados (11.3%, 5.6%, etc.)

### **Bajo Riesgo:**
1. **Nomenclatura:** Mezcla de español/inglés
2. **Formato de código:** Inconsistencias de estilo

---

## ✅ BUENAS PRÁCTICAS ENCONTRADAS

1. **conversorInteligente.js** está bien estructurado:
   - ✅ Función pura
   - ✅ Documentación clara
   - ✅ Manejo de errores
   - ✅ Logs descriptivos

2. **tasasHelpers.js** centraliza bien el acceso a BD:
   - ✅ Abstracción de Supabase
   - ✅ Manejo de tasas directas/inversas
   - ✅ Funciones específicas por operación

3. **Hooks personalizados** reducen estados:
   - ✅ `useMonedas` centraliza 8+ estados
   - ✅ `useVueloInfo` centraliza 9 estados
   - ✅ Buen uso de custom hooks

---

## 📝 NOTAS IMPORTANTES

### **Métodos de Pago con Recargos:**
1. **Scalapay:** +11.3% sobre base convertida
2. **Arcadia Service:** +5.6% + $10 USD fijo
3. **Depósitos en dólares (BNC USD):** +4.5%
4. **Tarjeta de Crédito (USD):** +5%
5. **Chase Bank:** +5% (mencionado en memoria, pero NO en código actual ⚠️)

### **Impuestos:**
- **COP:** 4x1000 (0.4%) aplicado DESPUÉS de recargos
- **Otras monedas:** Sin impuestos

### **Fee de Emisión:**
- **Estelar:** $10
- **Otras aerolíneas:** $15
- **Default:** $15

---

## 🎯 SIGUIENTE PASO

Ver documento de **PROPUESTA DE REFACTORIZACIÓN** con arquitectura mejorada y plan de migración seguro.
