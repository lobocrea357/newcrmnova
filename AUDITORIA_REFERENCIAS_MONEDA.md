# 🔍 AUDITORÍA COMPLETA: Referencias a `moneda` y `monedaOrigen`

**Fecha:** 1 de marzo de 2026  
**Objetivo:** Identificar TODAS las referencias a los valores derivados `moneda` y `monedaOrigen` antes de su eliminación completa (Opción B)

---

## 📊 RESUMEN EJECUTIVO

### **Archivos analizados**
- ✅ `CotizadorForm.jsx` → **7 referencias encontradas**
- ✅ `PdfContent.jsx` → **0 referencias** (usa `monedaCotizacion` como prop)
- ✅ `PasajerosManager.jsx` → **0 referencias** (usa `monedaPrecio` y `monedaCotizacion`)
- ✅ `TasasManager.jsx` → **0 referencias legacy** (usa variables locales)
- ✅ `MonedasManager.jsx` → **0 referencias legacy** (usa variables locales)
- ✅ `/lib/cotizador/*.js` → **0 referencias**
- ✅ Otros componentes del cotizador → **0 referencias**

### **Total de cambios necesarios: 7 ubicaciones en CotizadorForm.jsx**

---

## 📁 DETALLE POR ARCHIVO

### **1. CotizadorForm.jsx** - 7 referencias

#### **A. DECLARACIÓN (líneas 74-76)**

**Ubicación:** Líneas 74-76

```javascript
// Valores derivados (para compatibilidad con lógica VES)
const moneda = monedaCotizacionSeleccionada
const monedaOrigen = monedaBaseSeleccionada
```

**Acción:**
```diff
- // Valores derivados (para compatibilidad con lógica VES)
- const moneda = monedaCotizacionSeleccionada
- const monedaOrigen = monedaBaseSeleccionada
```

**Riesgo:** ❌ **NINGUNO** - Simplemente eliminar las 3 líneas

---

#### **B. CÁLCULO DE SÍMBOLO (línea 535)**

**Ubicación:** Línea 535

```javascript
const monedaSeleccionada = getMonedasDisponibles().find(m => m.value === moneda)
const simboloMoneda = monedaSeleccionada?.symbol || '$'
```

**Acción:**
```diff
- const monedaSeleccionada = getMonedasDisponibles().find(m => m.value === moneda)
+ const monedaSeleccionada = getMonedasDisponibles().find(m => m.value === monedaCotizacionSeleccionada)
  const simboloMoneda = monedaSeleccionada?.symbol || '$'
```

**Riesgo:** ⚠️ **BAJO** - Cambio mecánico simple

**Impacto:** `simboloMoneda` se usa en 2 lugares:
- Línea 1428: `{simboloMoneda} {formatearMonto(desglose.totalPrevio)}`
- Línea 1438: `{simboloMoneda} {formatearMonto(desglose.impuestoGobierno)}`
- Línea 1474: `{simboloMoneda} {formatearMonto(total)}`

---

#### **C. UI - SUBTOTAL (línea 1426)**

**Ubicación:** Línea 1426

```javascript
<span className="text-slate-500">Subtotal ({moneda})</span>
```

**Acción:**
```diff
- <span className="text-slate-500">Subtotal ({moneda})</span>
+ <span className="text-slate-500">Subtotal ({monedaCotizacionSeleccionada})</span>
```

**Riesgo:** ❌ **NINGUNO** - Solo cambio visual en UI

**Contexto:** Dentro de condicional `{desglose.recargoDescripcion && (`

---

#### **D. CONDICIONAL COP (línea 1434)**

**Ubicación:** Línea 1434

```javascript
{moneda === 'COP' && desglose.impuestoGobierno > 0 && (
  <div className="flex justify-between items-center pt-2 text-sm">
    <span className="text-slate-500">Impuesto gobierno (4 COP por cada 1000)</span>
    <span className="font-medium text-slate-600">
      {simboloMoneda} {formatearMonto(desglose.impuestoGobierno)}
    </span>
  </div>
)}
```

**Acción:**
```diff
- {moneda === 'COP' && desglose.impuestoGobierno > 0 && (
+ {monedaCotizacionSeleccionada === 'COP' && desglose.impuestoGobierno > 0 && (
```

**Riesgo:** ⚠️ **BAJO** - Condicional simple

**Testing:** Verificar que el impuesto se muestra cuando se selecciona PSE (COP)

---

#### **E. CONDICIONAL VES (línea 1481)**

**Ubicación:** Línea 1481

```javascript
{moneda === 'VES' && (
  <div className="mt-2 p-2 bg-white/10 rounded-lg">
    <p className="text-xs opacity-90">
      <span className="font-semibold">Reconversión:</span> {monedaOrigen} → VES
    </p>
    <p className="text-xs opacity-80 mt-1">
      Tasa: 1 {monedaOrigen} = {tasaCambio} Bs
    </p>
  </div>
)}
```

**Acción:**
```diff
- {moneda === 'VES' && (
+ {monedaCotizacionSeleccionada === 'VES' && (
    <div className="mt-2 p-2 bg-white/10 rounded-lg">
      <p className="text-xs opacity-90">
-       <span className="font-semibold">Reconversión:</span> {monedaOrigen} → VES
+       <span className="font-semibold">Reconversión:</span> {monedaBaseSeleccionada} → VES
      </p>
      <p className="text-xs opacity-80 mt-1">
-       Tasa: 1 {monedaOrigen} = {tasaCambio} Bs
+       Tasa: 1 {monedaBaseSeleccionada} = {tasaCambio} Bs
      </p>
    </div>
  )}
```

**Riesgo:** ⚠️ **MEDIO** - **CRÍTICO PARA VES**

**Testing requerido:**
1. Seleccionar "Pago Móvil" → verificar se muestra "Reconversión: USD → VES"
2. Cambiar moneda base a EUR → verificar se muestra "Reconversión: EUR → VES"
3. Verificar tasa se muestra correctamente

---

### **2. PdfContent.jsx** - 0 referencias ✅

**Análisis:**
- Recibe `monedaCotizacion` como **prop** (línea 43)
- NO usa `moneda` ni `monedaOrigen` legacy
- **No requiere cambios**

**Props recibidas:**
```javascript
const PdfContent = forwardRef({
  // ...
  monedaCotizacion, // ← Ya usa el nombre correcto
  metodoPago
}, ref)
```

---

### **3. PasajerosManager.jsx** - 0 referencias ✅

**Análisis:**
- Recibe `monedaPrecio` y `monedaCotizacion` como **props** (líneas 48-49)
- NO usa `moneda` ni `monedaOrigen` legacy
- **No requiere cambios**

**Props recibidas:**
```javascript
export default function PasajerosManager({
  value = {},
  onChange,
  readonly = false,
  monedaPrecio = 'USD',      // ← Ya migrado
  monedaCotizacion = 'USD',  // ← Ya migrado
  monedasBase = [],
  monedasCotizacion = [],
  loadingMonedas = false
})
```

---

### **4. TasasManager.jsx** - 0 referencias legacy ✅

**Análisis:**
- Usa variables locales llamadas `moneda`, pero **NO son los estados legacy**
- Contexto: Manejo de monedas en base de datos (CRUD)
- **No requiere cambios**

**Ejemplos de uso (variables locales):**
```javascript
// Línea 121: Variable en validación
if (newConversion.monedaOrigenId === newConversion.monedaDestinoId) {
  toast.error('No puedes crear una conversión de una moneda a sí misma')
}

// Línea 235: Texto en option
<option value="">De: Seleccionar moneda</option>
```

---

### **5. MonedasManager.jsx** - 0 referencias legacy ✅

**Análisis:**
- Usa variables locales llamadas `moneda` en mapeos `.map(moneda => ...)`
- Contexto: CRUD de monedas en base de datos
- **No requiere cambios**

**Ejemplos de uso (variables locales):**
```javascript
// Línea 45-46: Actualización local
setMonedas(prev => prev.map(moneda =>
  moneda.id === id ? { ...moneda, [field]: value } : moneda
))

// Línea 78: Búsqueda local
const moneda = monedas.find(m => m.id === id)
```

---

### **6. /lib/cotizador/** - 0 referencias ✅

**Archivos analizados:**
- `paymentConfig.js` → No usa moneda/monedaOrigen
- `passengerConfig.js` → No usa moneda/monedaOrigen

**No requiere cambios**

---

## 🎯 PLAN DE IMPLEMENTACIÓN (OPCIÓN B)

### **Total de cambios: 7 ediciones en 1 archivo**

| # | Línea | Tipo | Cambio | Riesgo |
|---|-------|------|--------|--------|
| 1 | 74-76 | Eliminar | Valores derivados completos | ❌ Ninguno |
| 2 | 535 | Reemplazar | `moneda` → `monedaCotizacionSeleccionada` | ⚠️ Bajo |
| 3 | 1426 | Reemplazar | `{moneda}` → `{monedaCotizacionSeleccionada}` | ❌ Ninguno |
| 4 | 1434 | Reemplazar | `moneda === 'COP'` → `monedaCotizacionSeleccionada === 'COP'` | ⚠️ Bajo |
| 5 | 1481 | Reemplazar | `moneda === 'VES'` → `monedaCotizacionSeleccionada === 'VES'` | ⚠️ Medio |
| 6 | 1484 | Reemplazar | `{monedaOrigen}` → `{monedaBaseSeleccionada}` | ⚠️ Medio |
| 7 | 1487 | Reemplazar | `{monedaOrigen}` → `{monedaBaseSeleccionada}` | ⚠️ Medio |

---

## ✅ CASOS DE PRUEBA REQUERIDOS

### **Test 1: Símbolo de moneda**
```
1. Seleccionar USD → verificar símbolo $
2. Seleccionar EUR → verificar símbolo €
3. Seleccionar COP → verificar símbolo $
4. Seleccionar VES → verificar símbolo Bs
```

### **Test 2: Subtotal display**
```
1. Calcular cotización con recargos
2. Verificar se muestra "Subtotal (USD)" o "Subtotal (VES)", etc.
3. Verificar formato correcto del monto
```

### **Test 3: Impuesto Colombia (COP)**
```
1. Seleccionar método "PSE" → debe setear COP
2. Calcular cotización
3. Verificar se muestra sección "Impuesto gobierno (4 COP por cada 1000)"
4. Verificar cálculo correcto del impuesto
```

### **Test 4: Reconversión VES (CRÍTICO)**
```
1. Seleccionar "Pago Móvil" → debe setear VES
2. Moneda base USD:
   - Verificar muestra "Reconversión: USD → VES"
   - Verificar muestra "Tasa: 1 USD = X Bs"
3. Cambiar moneda base a EUR:
   - Verificar muestra "Reconversión: EUR → VES"
   - Verificar muestra "Tasa: 1 EUR = Y Bs"
4. Verificar tasa se actualiza dinámicamente
```

### **Test 5: Otros métodos (no VES)**
```
1. Seleccionar "Zelle" → USD
   - NO debe mostrar reconversión
   - Símbolo debe ser $
2. Seleccionar "Binance" → EUR
   - NO debe mostrar reconversión
   - Símbolo debe ser €
```

### **Test 6: Generación de PDF**
```
1. Cotizar con VES
2. Generar PDF
3. Verificar información correcta en PDF
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Preparación**
- [ ] Revisar esta auditoría completa
- [ ] Confirmar todos los cambios con el usuario
- [ ] Crear backup o commit previo

### **Implementación (en orden)**
- [ ] 1. Eliminar líneas 74-76 (valores derivados)
- [ ] 2. Actualizar línea 535 (símbolo moneda)
- [ ] 3. Actualizar línea 1426 (subtotal UI)
- [ ] 4. Actualizar línea 1434 (condicional COP)
- [ ] 5. Actualizar línea 1481 (condicional VES)
- [ ] 6. Actualizar línea 1484 (reconversión texto 1)
- [ ] 7. Actualizar línea 1487 (reconversión texto 2)

### **Verificación**
- [ ] No hay errores de sintaxis
- [ ] No hay warnings en consola
- [ ] Test 1: Símbolo de moneda ✅
- [ ] Test 2: Subtotal display ✅
- [ ] Test 3: Impuesto Colombia ✅
- [ ] Test 4: Reconversión VES ✅
- [ ] Test 5: Otros métodos ✅
- [ ] Test 6: Generación PDF ✅

---

## 🔒 ANÁLISIS DE RIESGOS FINAL

### **Riesgo Global: BAJO-MEDIO ⚠️**

**Justificación:**
- ✅ **Solo 1 archivo afectado** (CotizadorForm.jsx)
- ✅ **7 cambios mecánicos simples** (reemplazos de nombres)
- ✅ **No afecta lógica de negocio** (solo nombres de variables)
- ⚠️ **Requiere testing exhaustivo de VES** (reconversión crítica)

### **Puntos críticos:**

1. **Reconversión VES (líneas 1481-1490)**
   - **Importancia:** Alta - Flujo especial de negocio
   - **Mitigación:** Testing manual exhaustivo

2. **Símbolo de moneda (línea 535)**
   - **Importancia:** Media - Afecta 3 lugares en UI
   - **Mitigación:** Verificar visualmente en todos los métodos

3. **Impuesto COP (línea 1434)**
   - **Importancia:** Media - Lógica fiscal
   - **Mitigación:** Test específico con PSE

---

## 💡 RECOMENDACIONES

### **Antes de proceder:**
1. ✅ Hacer commit del estado actual
2. ✅ Crear rama específica: `refactor/eliminar-moneda-legacy`
3. ✅ Tener un plan de rollback claro

### **Durante implementación:**
1. ✅ Hacer cambios en el orden especificado
2. ✅ Verificar sintaxis después de cada cambio
3. ✅ No saltar pasos del checklist

### **Después de implementación:**
1. ✅ Ejecutar TODOS los tests manuales
2. ✅ Verificar en navegador real (no solo sintaxis)
3. ✅ Generar PDF de prueba con VES

---

## 📊 COMPARACIÓN: OPCIÓN A vs OPCIÓN B

| Aspecto | Opción A (Valores Derivados) | Opción B (Eliminación Completa) |
|---------|------------------------------|----------------------------------|
| **Cambios totales** | 15 líneas | 22 líneas |
| **Archivos afectados** | 1 | 1 |
| **Riesgo** | Bajo | Bajo-Medio |
| **Limpieza código** | Media | Alta |
| **Mantenibilidad** | Media | Alta |
| **Testing requerido** | 15 min | 30-40 min |
| **Reversibilidad** | Fácil | Moderada |
| **Beneficio largo plazo** | Medio | Alto |

---

## ✅ CONCLUSIÓN

**¿Es seguro implementar Opción B?**

**SÍ ✅**, con las siguientes condiciones:

1. ✅ **Solo 1 archivo requiere cambios** (CotizadorForm.jsx)
2. ✅ **7 cambios mecánicos y directos** (no hay lógica compleja)
3. ✅ **Otros componentes ya migrados** (PdfContent, PasajerosManager)
4. ⚠️ **Requiere testing exhaustivo** (especialmente VES)

**Beneficios:**
- ✅ Código más limpio y consistente
- ✅ Elimina confusión sobre qué variable usar
- ✅ Mejor preparado para futuras modificaciones
- ✅ Nombres más descriptivos (`monedaCotizacionSeleccionada` vs `moneda`)

**Tiempo estimado:**
- Implementación: 15-20 minutos
- Testing: 30-40 minutos
- **Total: 45-60 minutos**

---

**🚦 ESTADO: LISTO PARA IMPLEMENTAR (pendiente aprobación del usuario)**
