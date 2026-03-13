# 📋 RESUMEN COMPLETO: Análisis, Bug y Refactorización del Cotizador

**Fecha:** 3 de marzo de 2026  
**Estado:** Análisis completo + Bug identificado + Plan de acción

---

## 🐛 BUG CRÍTICO: Selects de Moneda en Vista Múltiple

### **Estado actual:**
✅ Props pasadas correctamente a PasajerosManager (líneas 870-876 y 1337-1343)  
✅ Callbacks implementados en PasajerosManager  
❌ **Los selects NO cambian el valor visualmente**

### **Causa raíz identificada:**

**En PasajerosManager.jsx líneas 321-333:**
```javascript
<select
  value={monedaPrecio}  // ← Valor controlado por prop
  onChange={(e) => {
    const nuevaMoneda = e.target.value
    // 1. Notifica al padre ✅
    if (onMonedaPrecioChange) {
      onMonedaPrecioChange(nuevaMoneda)
    }
    // 2. Actualiza pasajeros locales ⚠️ ESTO CAUSA RE-RENDER
    Object.keys(pasajeros).forEach(categoria => {
      pasajeros[categoria].forEach(pasajero => {
        actualizarPasajero(categoria, pasajero.id, 'monedaPrecio', nuevaMoneda)
      })
    })
  }}
```

**Problema:** El estado local `pasajeros` se actualiza DESPUÉS de notificar al padre, causando un re-render que puede resetear el valor del select antes de que React lo actualice visualmente.

### **Comparación con vista individual (que SÍ funciona):**

**En CotizadorForm líneas 789-790:**
```javascript
<select
  value={monedaBaseSeleccionada}
  onChange={(e) => setMonedaBaseSeleccionada(e.target.value)}
  // ← Actualización directa, sin lógica adicional
/>
```

**Diferencia clave:** Vista individual actualiza el estado directamente sin efectos secundarios.

### **Solución propuesta:**

```javascript
// PasajerosManager.jsx - Simplificar onChange
<select
  value={monedaPrecio}
  onChange={(e) => {
    const nuevaMoneda = e.target.value
    
    // 1. PRIMERO: Actualizar pasajeros locales
    Object.keys(pasajeros).forEach(categoria => {
      pasajeros[categoria].forEach(pasajero => {
        actualizarPasajero(categoria, pasajero.id, 'monedaPrecio', nuevaMoneda)
      })
    })
    
    // 2. DESPUÉS: Notificar al padre (esto causa re-render del padre)
    if (onMonedaPrecioChange) {
      onMonedaPrecioChange(nuevaMoneda)
    }
  }}
/>
```

**O mejor aún (sin lógica en onChange):**

```javascript
// Mover lógica de actualización de pasajeros a un useEffect
useEffect(() => {
  // Cuando cambia monedaPrecio desde el padre, actualizar pasajeros
  Object.keys(pasajeros).forEach(categoria => {
    pasajeros[categoria].forEach(pasajero => {
      if (pasajero.monedaPrecio !== monedaPrecio) {
        actualizarPasajero(categoria, pasajero.id, 'monedaPrecio', monedaPrecio)
      }
    })
  })
}, [monedaPrecio])

// Select simplificado
<select
  value={monedaPrecio}
  onChange={(e) => {
    if (onMonedaPrecioChange) {
      onMonedaPrecioChange(e.target.value)
    }
  }}
/>
```

---

## 📊 COMPARACIÓN: tasasHelpers.js vs conversorInteligente.js

### **Resumen ejecutivo:**

| Aspecto | tasasHelpers.js | conversorInteligente.js |
|---------|----------------|-------------------------|
| **Responsabilidad** | ✅ Acceso a datos (Supabase) | ✅ Lógica de negocio + ❌ Helpers de UI |
| **Arquitectura** | ✅ Correcta (DAL) | ⚠️ Mixta |
| **Funciones totales** | 10 | 6 |
| **Funciones usadas en cotizador** | 2 | 1 |
| **Funciones NO usadas** | - | 4 |

### **Funciones NO usadas en CotizadorForm:**

1. ❌ `getMonedasCotizacion()` - Se redefine localmente
2. ❌ `getMonedasBase()` - Se usa array hardcoded
3. ❌ `getMonedaInfo()` - No se usa (debería usarse para símbolos)
4. ❌ `esMonedaBase()` - No se usa (debería usarse para validación)

### **Descubrimiento crítico:**

**`calcularConversionInteligente()` recibe estados LEGACY:**

```javascript
// CotizadorForm línea 481-490
const resultado = await calcularConversionInteligente({
  base,
  monedaBase: monedaPrecio,        // ← Estado LEGACY
  monedaCotizacion: monedaCotizacion,  // ← Estado LEGACY
  metodoPago,
  tasasDb
})
```

**Debería ser:**
```javascript
const resultado = await calcularConversionInteligente({
  base,
  monedaBase: monedaBaseSeleccionada,      // ← Estado UNIFICADO
  monedaCotizacion: monedaCotizacionSeleccionada,  // ← Estado UNIFICADO
  metodoPago,
  tasasDb
})
```

**Esto significa que `monedaPrecio` y `monedaCotizacion` NO pueden eliminarse hasta hacer esta corrección.**

### **Oportunidades de mejora:**

#### **1. Símbolos de moneda hardcoded (líneas 539-548):**

**ANTES:**
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

**DESPUÉS:**
```javascript
const simboloMoneda = getMonedaInfo(monedaCotizacionSeleccionada)?.symbol || '$'
```

**Reducción:** 10 líneas → 1 línea

---

## 🎯 JUSTIFICACIÓN DE REFACTORIZACIÓN

### **Hooks propuestos:**

| Hook | Estados reducidos | Beneficio principal | Prioridad |
|------|-------------------|---------------------|-----------|
| `useVueloInfo` | 9 → 1 | Agrupación lógica | 🔴 ALTA |
| `useEscalas` | 6 → 1 | Escalabilidad | 🟡 MEDIA |
| `useEquipaje` | 3 → 1 | Extensibilidad | 🟢 BAJA |
| `useMonedas` | 8 → 1 | Centralización | 🟡 MEDIA |

**Total:** 26 estados → 4 estados (reducción del 85%)

### **Servicios propuestos:**

| Servicio | Líneas extraídas | Beneficio principal | Prioridad |
|----------|------------------|---------------------|-----------|
| `cotizacionService.js` | ~80 | Lógica testeable | 🔴 ALTA |
| `pdfService.js` | ~65 | Separación técnica | 🔴 ALTA |

**Total:** ~145 líneas extraídas del componente

### **Componentes propuestos:**

| Componente | Líneas extraídas | Responsabilidad | Prioridad |
|------------|------------------|-----------------|-----------|
| `FormularioVueloInfo` | ~150 | Info básica vuelo | 🟡 MEDIA |
| `FormularioEscalas` | ~50 | Escalas dinámicas | 🟢 BAJA |
| `FormularioEquipaje` | ~40 | Selección equipaje | 🟢 BAJA |
| `FormularioPrecios` | ~100 | Precios/fees/monedas | 🔴 ALTA |
| `ResultadosCotizacion` | ~80 | Desglose/total | 🟡 MEDIA |

**Total:** ~420 líneas extraídas del componente

---

## 📁 ORGANIZACIÓN DE CARPETAS PROPUESTA

```
dashboard/src/
│
├── components/cotizador/
│   ├── CotizadorForm.jsx                    # Principal (400-600 líneas)
│   │
│   ├── formularios/                         # Subformularios
│   │   ├── FormularioVueloInfo.jsx
│   │   ├── FormularioEscalas.jsx
│   │   ├── FormularioEquipaje.jsx
│   │   ├── FormularioPrecios.jsx
│   │   └── FormularioMetodoPago.jsx
│   │
│   ├── resultados/                          # Visualización
│   │   ├── ResultadosCotizacion.jsx
│   │   └── PdfContent.jsx
│   │
│   └── pasajeros/                           # Gestión pasajeros
│       ├── PasajerosManager.jsx
│       └── PasajeroCard.jsx
│
├── hooks/cotizador/                         # Custom hooks
│   ├── useVueloInfo.js
│   ├── useEscalas.js
│   ├── useEquipaje.js
│   └── useMonedas.js
│
├── services/cotizador/                      # Lógica de negocio
│   ├── cotizacionService.js
│   └── pdfService.js
│
└── lib/cotizador/                           # Configuración
    ├── conversorInteligente.js              # SOLO lógica conversión
    ├── tasasHelpers.js                      # Acceso a datos
    ├── monedasConfig.js                     # Config monedas (NUEVO)
    ├── paymentConfig.js
    └── passengerConfig.js
```

### **Justificación:**

- **`formularios/`**: Cada formulario = 1 responsabilidad, testeable independientemente
- **`resultados/`**: Separación clara vista/lógica
- **`pasajeros/`**: Módulo autocontenido para múltiples pasajeros
- **`hooks/`**: Reducción drástica de estados en componentes
- **`services/`**: Lógica pura testeable sin React
- **`lib/`**: Fuente única de verdad para configuración

---

## 🚀 PLAN DE ACCIÓN PRIORIZADO

### **🔴 URGENTE (Hacer HOY - 1h total):**

#### **1. Arreglar bug de selects (15 min)**
```javascript
// PasajerosManager.jsx
// Mover lógica a useEffect en lugar de onChange
```

#### **2. Crear monedasConfig.js (15 min)**
```javascript
// Centralizar todas las funciones de monedas
// Eliminar duplicación
```

#### **3. Actualizar calcularConversionInteligente (5 min)**
```diff
- monedaBase: monedaPrecio,
+ monedaBase: monedaBaseSeleccionada,
```

#### **4. Eliminar estados legacy (5 min)**
```diff
- const [monedaPrecio, setMonedaPrecio] = useState('USD')
- const [monedaCotizacion, setMonedaCotizacion] = useState('USD')
```

#### **5. Simplificar símbolos (5 min)**
```diff
- let simboloMoneda = '$'
- if (monedaCotizacionSeleccionada === 'EUR') ...
+ const simboloMoneda = getMonedaInfo(monedaCotizacionSeleccionada)?.symbol || '$'
```

#### **6. Eliminar imports no usados (5 min)**
```diff
- getMonedasBase,
- getMonedaInfo,
- esMonedaBase
```

---

### **🟠 ALTA PRIORIDAD (Esta semana - 4h total):**

#### **7. Crear cotizacionService.js (1h)**
- Extraer lógica de cálculo
- Validaciones centralizadas
- Funciones puras testables

#### **8. Crear pdfService.js (45 min)**
- Extraer lógica de PDF
- Separación técnica

#### **9. Hook useVueloInfo (30 min)**
- 9 estados → 1 estado
- Validación incluida

#### **10. Hook useMonedas (35 min)**
- 8 estados → 1 estado
- Carga centralizada

#### **11. Testing de cambios (1h)**
- Probar todos los flujos
- VES crítico

---

### **🟡 MEDIA PRIORIDAD (Próximas 2 semanas - 5h total):**

#### **12-15. Crear hooks restantes (1.5h)**
- useEscalas
- useEquipaje

#### **16-20. Extraer componentes (3.5h)**
- FormularioPrecios
- ResultadosCotizacion
- FormularioVueloInfo

---

## 📊 IMPACTO ESPERADO

### **Después de URGENTE (1h):**
- ✅ Bug de selects corregido
- ✅ Estados legacy eliminados (2 menos)
- ✅ Imports no usados eliminados (3 menos)
- ✅ Código más limpio (15 líneas menos)
- ✅ Fuente única de verdad para monedas

### **Después de ALTA PRIORIDAD (5h total):**
- ✅ Lógica testeable (2 servicios)
- ✅ 17 estados reducidos a 9
- ✅ 145 líneas extraídas del componente
- ✅ Separación clara responsabilidades

### **Después de MEDIA PRIORIDAD (10h total):**
- ✅ 26 estados reducidos a 4
- ✅ 565 líneas extraídas del componente
- ✅ 1,520 líneas → 600 líneas (60% reducción)
- ✅ Componente principal manejable

---

## ⚠️ PUNTOS CRÍTICOS

### **1. VES - Flujo de reconversión**
**Siempre probar:**
- Selección VES como moneda cotización
- Cambio de moneda base (USD ↔ EUR)
- Tasa de cambio actualizada correctamente
- Display correcto en PDF

### **2. Múltiples pasajeros**
**Probar después del fix:**
- Cambio de moneda base afecta TODOS los pasajeros
- Cambio de moneda cotización afecta TODOS los pasajeros
- Select muestra valor actualizado visualmente

### **3. Estados legacy**
**Solo eliminar DESPUÉS de:**
- Actualizar llamada a `calcularConversionInteligente()`
- Verificar que no hay otros usos
- Testing completo

---

## 🎯 CONCLUSIÓN

### **Estado actual:**
- 🐛 Bug identificado: onChange en PasajerosManager causa re-render
- ✅ Análisis completo de tasasHelpers vs conversorInteligente
- ✅ Justificación de CADA hook/servicio/componente
- ✅ Organización de carpetas propuesta

### **Próximos pasos:**
1. **HOY:** Arreglar bug + limpieza urgente (1h)
2. **Esta semana:** Servicios + hooks principales (4h)
3. **Próximas 2 semanas:** Hooks/componentes restantes (5h)

### **ROI:**
- **Inversión:** 10 horas total
- **Retorno:** 60% reducción complejidad + Testing + Mantenibilidad + Escalabilidad

**¿Procedo con los 6 cambios URGENTES (1 hora)?**
