# 🎯 PROPUESTA DE REFACTORIZACIÓN: Sistema de Cálculos del Cotizador

**Fecha:** 27 de abril, 2026  
**Basado en:** AUDITORIA_COTIZADOR_CALCULOS.md  
**Objetivo:** Centralizar, simplificar y hacer mantenible la lógica de cálculos

---

## 📊 RESUMEN DE PROBLEMAS A RESOLVER

| Problema | Severidad | Archivos Afectados | Impacto |
|----------|-----------|-------------------|---------|
| Duplicación de cálculo de totales | 🔴 ALTA | 5 archivos | Bugs, inconsistencias |
| Configuración duplicada de pasajeros | 🟡 MEDIA | 2 archivos | Mantenibilidad |
| Lógica de negocio en UI | 🔴 ALTA | CotizadorForm.jsx | No reutilizable |
| Falta de helpers específicos | 🟡 MEDIA | 3 ubicaciones | Code smell |
| parseFloat() repetido 30+ veces | 🟠 MEDIA | 5 archivos | Fragilidad |

---

## 🏗️ ARQUITECTURA PROPUESTA

### **Estructura de Carpetas Nueva**

```
src/lib/cotizador/
├── calculations/           # ⭐ NUEVA CARPETA
│   ├── passengerCalculations.js    # Cálculos de pasajeros
│   ├── conversionCalculations.js   # Conversiones y tasas
│   ├── feeCalculations.js          # Fees y recargos
│   └── index.js                    # Barrel export
│
├── validators/             # ⭐ NUEVA CARPETA
│   ├── passengerValidators.js
│   ├── quotationValidators.js
│   └── index.js
│
├── formatters/             # ⭐ NUEVA CARPETA
│   ├── currencyFormatters.js
│   ├── numberFormatters.js
│   └── index.js
│
├── config/                 # RENOMBRAR/CONSOLIDAR
│   ├── currencies.js       # (antes monedasConfig.js)
│   ├── payments.js         # (antes paymentConfig.js)
│   ├── passengers.js       # (consolidar passengerConfig.js)
│   ├── airlines.js         # ⭐ NUEVO
│   └── index.js
│
├── services/               # MANTENER
│   ├── tasasService.js     # (renombrar tasasHelpers.js)
│   └── conversionService.js # (renombrar conversorInteligente.js)
│
└── constants/              # ⭐ NUEVA CARPETA
    ├── fees.js
    ├── taxes.js
    └── index.js
```

---

## 📦 NUEVOS HELPERS PROPUESTOS

### **1. passengerCalculations.js**

```javascript
/**
 * Módulo centralizado para cálculos relacionados con pasajeros
 * Centraliza TODA la lógica de cálculo de pasajeros en un solo lugar
 */

/**
 * Calcular total de un pasajero individual
 * @param {Object} pasajero - { precioPantalla, feeEmision, feeAgencia }
 * @returns {number} - Total del pasajero
 */
export function calcularTotalPasajero(pasajero) {
  const precio = parseFloat(pasajero.precioPantalla || 0)
  const emision = parseFloat(pasajero.feeEmision || 0)
  const agencia = parseFloat(pasajero.feeAgencia || 0)
  
  return precio + emision + agencia
}

/**
 * Calcular total de una categoría de pasajeros
 * @param {Array} pasajeros - Array de pasajeros de una categoría
 * @returns {Object} - { total, cantidad, desglose }
 */
export function calcularTotalCategoria(pasajeros) {
  if (!Array.isArray(pasajeros) || pasajeros.length === 0) {
    return { total: 0, cantidad: 0, desglose: { precio: 0, fees: 0 } }
  }

  return pasajeros.reduce((acc, pasajero) => {
    const precio = parseFloat(pasajero.precioPantalla || 0)
    const emision = parseFloat(pasajero.feeEmision || 0)
    const agencia = parseFloat(pasajero.feeAgencia || 0)
    const total = precio + emision + agencia

    return {
      total: acc.total + total,
      cantidad: acc.cantidad + 1,
      desglose: {
        precio: acc.desglose.precio + precio,
        fees: acc.desglose.fees + emision + agencia
      }
    }
  }, { total: 0, cantidad: 0, desglose: { precio: 0, fees: 0 } })
}

/**
 * Calcular gran total de todos los pasajeros
 * @param {Object} pasajeros - { adultos: [], niños: [], infantes: [] }
 * @returns {number} - Total general
 */
export function calcularGranTotal(pasajeros) {
  if (!pasajeros || typeof pasajeros !== 'object') {
    return 0
  }

  return Object.values(pasajeros).reduce((total, categoria) => {
    if (!Array.isArray(categoria)) return total
    return total + calcularTotalCategoria(categoria).total
  }, 0)
}

/**
 * Calcular desglose completo por categoría
 * @param {Object} pasajeros - { adultos: [], niños: [], infantes: [] }
 * @returns {Object} - Desglose detallado por categoría
 */
export function calcularDesgloseCompleto(pasajeros) {
  const categorias = ['adultos', 'niños', 'infantes']
  const desglose = {}

  categorias.forEach(cat => {
    desglose[cat] = calcularTotalCategoria(pasajeros[cat] || [])
  })

  desglose.granTotal = calcularGranTotal(pasajeros)
  desglose.cantidadTotal = Object.values(desglose)
    .filter(d => d.cantidad !== undefined)
    .reduce((sum, d) => sum + d.cantidad, 0)

  return desglose
}

/**
 * Validar si hay al menos un pasajero
 * @param {Object} pasajeros
 * @returns {boolean}
 */
export function tienePasajeros(pasajeros) {
  if (!pasajeros || typeof pasajeros !== 'object') {
    return false
  }

  return Object.values(pasajeros).some(categoria => 
    Array.isArray(categoria) && categoria.length > 0
  )
}
```

---

### **2. feeCalculations.js**

```javascript
/**
 * Módulo para cálculos de fees y recargos
 */

import { AIRLINES, FEES } from '../constants'

/**
 * Calcular fee de emisión según aerolínea
 * @param {string} aerolinea - Nombre de la aerolínea
 * @returns {number} - Fee de emisión
 */
export function calcularFeeEmision(aerolinea) {
  if (!aerolinea || typeof aerolinea !== 'string') {
    return FEES.EMISION_DEFAULT
  }

  const aerolineaNormalizada = aerolinea.toLowerCase().trim()
  
  // Estelar tiene fee especial
  if (aerolineaNormalizada.includes('estelar')) {
    return FEES.EMISION_ESTELAR
  }

  return FEES.EMISION_DEFAULT
}

/**
 * Calcular recargo por método de pago
 * @param {number} baseConvertida - Monto base en moneda de cotización
 * @param {string} metodoPago - Método de pago
 * @param {number} tasaConversion - Tasa de conversión (para métodos con fee fijo)
 * @returns {Object} - { monto, porcentaje, descripcion }
 */
export function calcularRecargoPago(baseConvertida, metodoPago, tasaConversion = 1) {
  const recargos = {
    'Scalapay': {
      porcentaje: 0.113,
      fijo: 0,
      descripcion: '+11.3% Scalapay'
    },
    'Arcadia Service': {
      porcentaje: 0.056,
      fijo: 10, // USD
      descripcion: '+5.6% + $10 USD Arcadia Service'
    },
    'Depósitos en dólares (BNC USD)': {
      porcentaje: 0.045,
      fijo: 0,
      descripcion: '+4.5% Depósito en dólares'
    },
    'Tarjeta de Crédito (USD)': {
      porcentaje: 0.05,
      fijo: 0,
      descripcion: '+5% Tarjeta de Crédito'
    },
    'Chase Bank Nova': {
      porcentaje: 0.05,
      fijo: 0,
      descripcion: '+5% Chase Bank'
    },
    'Chase Bank Apolo': {
      porcentaje: 0.05,
      fijo: 0,
      descripcion: '+5% Chase Bank'
    }
  }

  const config = recargos[metodoPago]
  
  if (!config) {
    return { monto: 0, porcentaje: 0, descripcion: '' }
  }

  const montoPorcentaje = baseConvertida * config.porcentaje
  const montoFijo = config.fijo * tasaConversion
  const montoTotal = montoPorcentaje + montoFijo

  return {
    monto: montoTotal,
    porcentaje: config.porcentaje * 100,
    descripcion: config.descripcion
  }
}

/**
 * Calcular impuesto 4x1000 (solo para COP)
 * @param {number} monto - Monto sobre el cual aplicar el impuesto
 * @param {string} moneda - Código de moneda
 * @returns {number} - Monto del impuesto
 */
export function calcularImpuesto4x1000(monto, moneda) {
  if (moneda !== 'COP') {
    return 0
  }

  // 4x1000 = 0.4% redondeado al peso más cercano
  return Math.round(monto * 0.004)
}
```

---

### **3. currencyFormatters.js**

```javascript
/**
 * Módulo para formateo de monedas y números
 */

/**
 * Formatear monto con separadores de miles
 * @param {number} valor - Valor a formatear
 * @param {number} decimales - Cantidad de decimales (default: 2)
 * @returns {string} - Valor formateado
 */
export function formatearMonto(valor, decimales = 2) {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0.00'
  }

  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor)
}

/**
 * Formatear monto con símbolo de moneda
 * @param {number} valor - Valor a formatear
 * @param {string} simbolo - Símbolo de moneda
 * @returns {string} - Valor formateado con símbolo
 */
export function formatearMontoConSimbolo(valor, simbolo = '$') {
  return `${simbolo}${formatearMonto(valor)}`
}

/**
 * Parsear valor de input a número
 * @param {any} valor - Valor a parsear
 * @param {number} defaultValue - Valor por defecto si falla el parsing
 * @returns {number} - Número parseado
 */
export function parsearNumero(valor, defaultValue = 0) {
  const parsed = parseFloat(valor)
  return isNaN(parsed) ? defaultValue : parsed
}
```

---

### **4. constants/fees.js**

```javascript
/**
 * Constantes de fees y recargos
 */

export const FEES = {
  EMISION_DEFAULT: 15,
  EMISION_ESTELAR: 10,
  AGENCIA_DEFAULT: 30
}

export const RECARGOS = {
  SCALAPAY: 0.113,        // 11.3%
  ARCADIA_PORCENTAJE: 0.056,  // 5.6%
  ARCADIA_FIJO: 10,       // $10 USD
  DEPOSITO_USD: 0.045,    // 4.5%
  TARJETA_CREDITO: 0.05,  // 5%
  CHASE_BANK: 0.05        // 5%
}

export const IMPUESTOS = {
  COLOMBIA_4X1000: 0.004  // 0.4%
}
```

---

## 🔄 PLAN DE MIGRACIÓN SEGURO

### **FASE 1: Crear Nuevos Helpers (Sin Romper Nada)**

**Duración:** 2-3 horas  
**Riesgo:** ⚪ NINGUNO (solo agrega código nuevo)

**Acciones:**
1. ✅ Crear carpeta `src/lib/cotizador/calculations/`
2. ✅ Crear `passengerCalculations.js` con funciones puras
3. ✅ Crear `feeCalculations.js` con funciones puras
4. ✅ Crear `formatters/currencyFormatters.js`
5. ✅ Crear `constants/fees.js`
6. ✅ Crear tests unitarios para CADA función

**Tests Obligatorios:**
```javascript
// passengerCalculations.test.js
describe('calcularTotalPasajero', () => {
  test('calcula correctamente con todos los valores', () => {
    const pasajero = { precioPantalla: 500, feeEmision: 15, feeAgencia: 30 }
    expect(calcularTotalPasajero(pasajero)).toBe(545)
  })

  test('maneja valores null/undefined', () => {
    const pasajero = { precioPantalla: 500 }
    expect(calcularTotalPasajero(pasajero)).toBe(500)
  })

  test('parsea strings correctamente', () => {
    const pasajero = { precioPantalla: '500', feeEmision: '15', feeAgencia: '30' }
    expect(calcularTotalPasajero(pasajero)).toBe(545)
  })
})
```

---

### **FASE 2: Migrar PasajerosManager.jsx (Componente Aislado)**

**Duración:** 1-2 horas  
**Riesgo:** 🟢 BAJO (componente hijo, fácil de revertir)

**Acciones:**
1. ✅ Importar helpers en `PasajerosManager.jsx`
2. ✅ Reemplazar `calcularGranTotal()` con helper
3. ✅ Reemplazar `calcularTotalesCategoria()` con helper
4. ✅ Eliminar funciones locales duplicadas
5. ✅ Testing manual exhaustivo
6. ✅ Comparar output antes/después

**Ejemplo de Migración:**
```javascript
// ANTES
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

// DESPUÉS
import { calcularGranTotal } from '@/lib/cotizador/calculations'

// Usar directamente la función importada
const total = calcularGranTotal(pasajeros)
```

**Validación:**
```javascript
// Agregar console.log temporal para comparar
const totalAntiguo = calcularGranTotalOLD(pasajeros)
const totalNuevo = calcularGranTotal(pasajeros)

if (totalAntiguo !== totalNuevo) {
  console.error('❌ MISMATCH:', { totalAntiguo, totalNuevo })
} else {
  console.log('✅ MATCH:', totalNuevo)
}
```

---

### **FASE 3: Migrar ResumenCotizacionSticky.jsx**

**Duración:** 1 hora  
**Riesgo:** 🟢 BAJO (componente de presentación)

**Acciones:**
1. ✅ Importar `calcularTotalPasajero` y `formatearMonto`
2. ✅ Reemplazar cálculos inline
3. ✅ Testing visual
4. ✅ Comparar renderizado antes/después

---

### **FASE 4: Migrar CotizadorForm.jsx (CRÍTICO)**

**Duración:** 3-4 horas  
**Riesgo:** 🟡 MEDIO (componente principal)

**Estrategia: Branch Feature Separado**

**Acciones:**
1. ✅ Crear branch `refactor/cotizador-calculations`
2. ✅ Importar todos los helpers
3. ✅ Reemplazar `calcularTotalPasajeros()` local
4. ✅ Reemplazar `formatearMonto()` local
5. ✅ Testing exhaustivo con TODAS las monedas
6. ✅ Testing exhaustivo con TODOS los métodos de pago
7. ✅ Testing con cotizaciones existentes (edición)
8. ✅ Comparar PDFs generados antes/después
9. ✅ Testing de regresión con cotizaciones guardadas

**Checklist de Testing:**
- [ ] Cotización USD → USD (sin conversión)
- [ ] Cotización USD → COP (con impuesto 4x1000)
- [ ] Cotización EUR → COP
- [ ] Método Scalapay (+11.3%)
- [ ] Método Arcadia (+5.6% + $10)
- [ ] Método Tarjeta Crédito (+5%)
- [ ] Método sin recargo
- [ ] Edición de cotización existente
- [ ] Guardar cotización nueva
- [ ] Exportar PDF
- [ ] Draft recovery
- [ ] Múltiples pasajeros (adultos + niños + infantes)

---

### **FASE 5: Migrar PdfContent.jsx**

**Duración:** 30 minutos  
**Riesgo:** 🟢 BAJO (solo lectura)

**Acciones:**
1. ✅ Importar helpers
2. ✅ Reemplazar cálculos inline
3. ✅ Generar PDFs de prueba
4. ✅ Comparar PDFs antes/después (visual y datos)

---

### **FASE 6: Consolidar Configuración**

**Duración:** 1-2 horas  
**Riesgo:** 🟢 BAJO (solo reorganización)

**Acciones:**
1. ✅ Eliminar `CATEGORIAS_PASAJEROS` duplicado en `PasajerosManager.jsx`
2. ✅ Usar solo `passengerConfig.js` (renombrado a `config/passengers.js`)
3. ✅ Consolidar todas las constantes de fees
4. ✅ Actualizar imports en todos los archivos

---

### **FASE 7: Refactorizar conversorInteligente.js**

**Duración:** 2 horas  
**Riesgo:** 🟡 MEDIO (función crítica)

**Acciones:**
1. ✅ Extraer `calcularRecargoPago()` a `feeCalculations.js`
2. ✅ Extraer `calcularImpuesto4x1000()` a `feeCalculations.js`
3. ✅ Simplificar `calcularConversionInteligente()`
4. ✅ Tests unitarios exhaustivos

**Ejemplo:**
```javascript
// ANTES (conversorInteligente.js líneas 68-86)
if (metodoPago === 'Scalapay') {
  recargos = baseConvertida * 0.113
  descripcionRecargos = `+11.3% Scalapay`
  montoConvertido = baseConvertida + recargos
} else if (metodoPago === 'Arcadia Service') {
  const porcentaje = baseConvertida * 0.056
  const fijo = 10
  recargos = porcentaje + (fijo * tasaConversion)
  descripcionRecargos = `+5.6% + $10USD Arcadia Service`
  montoConvertido = baseConvertida + recargos
}
// ... más condiciones

// DESPUÉS
import { calcularRecargoPago } from '../calculations/feeCalculations'

const { monto, descripcion } = calcularRecargoPago(
  baseConvertida, 
  metodoPago, 
  tasaConversion
)
recargos = monto
descripcionRecargos = descripcion
montoConvertido = baseConvertida + recargos
```

---

## 🧪 ESTRATEGIA DE TESTING

### **Tests Unitarios (Obligatorios)**

```javascript
// calculations/passengerCalculations.test.js
describe('Passenger Calculations', () => {
  describe('calcularTotalPasajero', () => {
    test('suma correctamente precio + fees', () => {
      const pasajero = { precioPantalla: 500, feeEmision: 15, feeAgencia: 30 }
      expect(calcularTotalPasajero(pasajero)).toBe(545)
    })

    test('maneja valores faltantes', () => {
      expect(calcularTotalPasajero({})).toBe(0)
      expect(calcularTotalPasajero({ precioPantalla: 100 })).toBe(100)
    })

    test('parsea strings a números', () => {
      const pasajero = { precioPantalla: '500.50', feeEmision: '15', feeAgencia: '30' }
      expect(calcularTotalPasajero(pasajero)).toBe(545.5)
    })
  })

  describe('calcularGranTotal', () => {
    test('suma todas las categorías', () => {
      const pasajeros = {
        adultos: [
          { precioPantalla: 500, feeEmision: 15, feeAgencia: 30 },
          { precioPantalla: 500, feeEmision: 15, feeAgencia: 30 }
        ],
        niños: [
          { precioPantalla: 350, feeEmision: 15, feeAgencia: 30 }
        ],
        infantes: []
      }
      // (545 * 2) + 395 = 1485
      expect(calcularGranTotal(pasajeros)).toBe(1485)
    })

    test('maneja objeto vacío', () => {
      expect(calcularGranTotal({})).toBe(0)
    })

    test('maneja null/undefined', () => {
      expect(calcularGranTotal(null)).toBe(0)
      expect(calcularGranTotal(undefined)).toBe(0)
    })
  })
})

// calculations/feeCalculations.test.js
describe('Fee Calculations', () => {
  describe('calcularFeeEmision', () => {
    test('retorna 10 para Estelar', () => {
      expect(calcularFeeEmision('Estelar')).toBe(10)
      expect(calcularFeeEmision('estelar')).toBe(10)
      expect(calcularFeeEmision('ESTELAR')).toBe(10)
    })

    test('retorna 15 para otras aerolíneas', () => {
      expect(calcularFeeEmision('Avianca')).toBe(15)
      expect(calcularFeeEmision('Copa')).toBe(15)
      expect(calcularFeeEmision('')).toBe(15)
    })
  })

  describe('calcularRecargoPago', () => {
    test('calcula Scalapay correctamente (11.3%)', () => {
      const resultado = calcularRecargoPago(1000, 'Scalapay', 1)
      expect(resultado.monto).toBe(113)
      expect(resultado.porcentaje).toBe(11.3)
    })

    test('calcula Arcadia correctamente (5.6% + $10)', () => {
      const resultado = calcularRecargoPago(1000, 'Arcadia Service', 4000) // tasa COP
      // 1000 * 0.056 + (10 * 4000) = 56 + 40000 = 40056
      expect(resultado.monto).toBe(40056)
    })

    test('retorna 0 para métodos sin recargo', () => {
      const resultado = calcularRecargoPago(1000, 'Zelle', 1)
      expect(resultado.monto).toBe(0)
    })
  })

  describe('calcularImpuesto4x1000', () => {
    test('calcula 0.4% para COP', () => {
      expect(calcularImpuesto4x1000(1000000, 'COP')).toBe(4000)
    })

    test('retorna 0 para otras monedas', () => {
      expect(calcularImpuesto4x1000(1000, 'USD')).toBe(0)
      expect(calcularImpuesto4x1000(1000, 'EUR')).toBe(0)
    })

    test('redondea al entero más cercano', () => {
      expect(calcularImpuesto4x1000(1001, 'COP')).toBe(4) // 1001 * 0.004 = 4.004 → 4
      expect(calcularImpuesto4x1000(1500, 'COP')).toBe(6) // 1500 * 0.004 = 6
    })
  })
})
```

### **Tests de Integración (Recomendados)**

```javascript
// integration/cotizador.test.js
describe('Cotizador Flow', () => {
  test('calcula cotización completa USD → COP con Scalapay', async () => {
    const pasajeros = {
      adultos: [
        { precioPantalla: 500, feeEmision: 15, feeAgencia: 30 }
      ],
      niños: [],
      infantes: []
    }

    const base = calcularGranTotal(pasajeros) // 545 USD
    
    const resultado = await calcularConversionInteligente({
      base,
      monedaBase: 'USD',
      monedaCotizacion: 'COP',
      metodoPago: 'Scalapay'
    })

    // Validaciones
    expect(resultado.baseOriginal).toBe(545)
    expect(resultado.tasaConversion).toBeGreaterThan(0)
    expect(resultado.recargos).toBeGreaterThan(0) // 11.3%
    expect(resultado.impuestos).toBeGreaterThan(0) // 4x1000
    expect(resultado.total).toBeGreaterThan(resultado.baseConvertida)
  })
})
```

---

## 📋 CHECKLIST ANTES DE MERGE

### **Pre-Merge Obligatorio:**

- [ ] Todos los tests unitarios pasan (100% coverage en helpers)
- [ ] Tests de integración pasan
- [ ] Testing manual completado (ver checklist Fase 4)
- [ ] No hay console.log/console.error de debug
- [ ] Documentación actualizada (JSDoc en todas las funciones)
- [ ] Code review aprobado por al menos 1 persona
- [ ] Branch actualizado con `main`
- [ ] No hay conflictos
- [ ] Build de producción exitoso
- [ ] Performance testing (no debe ser más lento)

### **Regresión Testing:**

- [ ] Cargar 10 cotizaciones existentes de la BD
- [ ] Editar c/u y verificar que los totales coinciden
- [ ] Generar PDF de c/u y comparar con PDFs anteriores
- [ ] Verificar que el draft recovery funciona
- [ ] Verificar que guardar cotización funciona
- [ ] Verificar cálculos en diferentes monedas

---

## 🚀 BENEFICIOS ESPERADOS

### **Inmediatos:**
1. ✅ **Eliminación de duplicación:** De 5 implementaciones a 1
2. ✅ **Testeable:** Funciones puras fáciles de testear
3. ✅ **Mantenible:** Cambiar fórmula = editar 1 archivo
4. ✅ **Consistencia:** Mismo cálculo en todos lados

### **A Mediano Plazo:**
1. ✅ **Reutilización:** Usar helpers en otros módulos (ej: VuelosForm)
2. ✅ **Confiabilidad:** Tests automatizan validación
3. ✅ **Onboarding:** Nuevos devs entienden el código más rápido
4. ✅ **Debugging:** Logs centralizados en helpers

### **A Largo Plazo:**
1. ✅ **Escalabilidad:** Agregar nuevas monedas/recargos es trivial
2. ✅ **Auditoría:** Trazabilidad completa de cálculos
3. ✅ **Calidad:** Menos bugs por inconsistencias

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Romper cálculos existentes | 🟡 Media | 🔴 Alto | Tests exhaustivos + validación manual |
| Performance degradation | 🟢 Baja | 🟡 Medio | Performance testing antes de merge |
| Regresión en PDFs | 🟡 Media | 🟡 Medio | Comparar PDFs pixel por pixel |
| Merge conflicts | 🟢 Baja | 🟢 Bajo | Branch feature + rebase frecuente |

---

## 🎯 TIMELINE ESTIMADO

| Fase | Duración | Riesgo | Bloqueante |
|------|----------|--------|------------|
| 1. Crear helpers | 2-3h | ⚪ Ninguno | No |
| 2. Migrar PasajerosManager | 1-2h | 🟢 Bajo | Fase 1 |
| 3. Migrar ResumenSticky | 1h | 🟢 Bajo | Fase 1 |
| 4. Migrar CotizadorForm | 3-4h | 🟡 Medio | Fases 1-3 |
| 5. Migrar PdfContent | 30min | 🟢 Bajo | Fase 1 |
| 6. Consolidar config | 1-2h | 🟢 Bajo | Fases 2-5 |
| 7. Refactor conversor | 2h | 🟡 Medio | Fase 1 |
| **TOTAL** | **11-14.5h** | | |

**Recomendación:** Dividir en 3 sprints de 4-5 horas c/u.

---

## 🔧 COMANDOS ÚTILES

```bash
# Crear branch feature
git checkout -b refactor/cotizador-calculations

# Instalar dependencias de testing (si no están)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Correr tests unitarios
npm test -- calculations

# Correr tests con coverage
npm test -- --coverage calculations

# Build de producción
npm run build

# Validar que no hay errores de lint
npm run lint
```

---

## 📞 CONTACTO PARA DUDAS

Si encuentras algún problema durante la migración:

1. Revisa el documento `AUDITORIA_COTIZADOR_CALCULOS.md`
2. Revisa los tests unitarios (tienen ejemplos de uso)
3. Consulta con el equipo antes de hacer cambios grandes

---

## ✅ CONCLUSIÓN

Esta refactorización **eliminará el código espagueti** actual y **centralizará toda la lógica** de cálculos en helpers reutilizables, testeables y mantenibles.

**El enfoque gradual (7 fases)** permite migrar de forma segura sin romper funcionalidad existente. Cada fase es reversible si se detectan problemas.

**Próximo paso:** Revisar y aprobar esta propuesta antes de comenzar la implementación.
