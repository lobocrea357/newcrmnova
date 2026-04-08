# Plan de Implementación: Mejoras UX del Cotizador

**Fecha:** 6 de Abril, 2026  
**Objetivo:** Mejorar la experiencia de usuario del cotizador manteniendo **100% de la lógica actual**  
**Alcance:** Solo cambios visuales y de organización de UI

---

## 🎯 Principios de Implementación

### ✅ LO QUE SE VA A CAMBIAR
- Diseño visual y estética
- Organización y jerarquía de elementos
- Espaciado, colores y tipografía
- Posición y agrupación de campos
- Feedback visual y micro-interacciones
- Layout y estructura de columnas

### ❌ LO QUE NO SE VA A TOCAR
- **Lógica de cálculo** (calcularCotizacion, calcularConversionInteligente)
- **Validaciones** (todas las validaciones existentes)
- **Hooks personalizados** (useVueloInfo, useEscalas, useEquipaje, useMonedas)
- **Sistema de guardado** (handleGuardarCotizacion, autoguardado en localStorage)
- **Gestión de estado** (todos los useState, useEffect)
- **Componente PdfContent** (ni diseño ni lógica)
- **Función de exportación PDF** (exportarCotizacionPDF)
- **Sistema de pasajeros** (PasajerosManager - solo ajustes visuales menores)
- **Integración con Supabase**
- **Sistema de monedas y tasas**

---

## 📋 Fases de Implementación

### **FASE 1: Reestructuración del Layout Principal**
**Duración estimada:** 1-2 horas  
**Riesgo:** Bajo

#### Cambios específicos:

1. **Modificar el grid principal** (línea 858)
   ```jsx
   // ANTES:
   <div className="grid lg:grid-cols-2 gap-8">
   
   // DESPUÉS:
   <div className="grid lg:grid-cols-[1fr_400px] gap-6 max-w-7xl mx-auto">
   ```
   - **Razón:** Panel derecho más estrecho y fijo para mejor legibilidad
   - **Impacto:** Solo visual, no afecta funcionalidad

2. **Reorganizar orden de secciones** (líneas 860-1310)
   ```
   ORDEN ACTUAL:
   1. Selector de Agencia
   2. Nombre del Cliente
   3. Pasajeros (con monedas dentro)
   4. Método de Pago
   5. Tipo de Vuelo
   
   ORDEN PROPUESTO:
   1. Selector de Agencia (mantener)
   2. Nombre del Cliente (mantener)
   3. Tipo de Vuelo (mover arriba)
   4. Origen/Destino (extraer de Tipo de Vuelo)
   5. Monedas (extraer de PasajerosManager)
   6. Pasajeros
   7. Método de Pago
   ```
   - **Razón:** Flujo lógico más natural
   - **Impacto:** Solo reordenamiento de JSX, misma funcionalidad

3. **Extraer selectores de moneda** (actualmente en PasajerosManager)
   - Crear nueva sección visual antes de Pasajeros
   - Mantener exactamente los mismos props y callbacks
   - No modificar la lógica de `useMonedas`

#### Archivos a modificar:
- `CotizadorForm.jsx` (solo JSX y clases CSS)

#### Validaciones a preservar:
- ✅ Validación de moneda antes de método de pago
- ✅ Actualización automática de tasa de cambio
- ✅ Filtrado de métodos de pago por moneda

---

### **FASE 2: Componente de Resumen Sticky Mejorado**
**Duración estimada:** 1 hora  
**Riesgo:** Muy Bajo

#### Cambios específicos:

1. **Crear nuevo componente `ResumenCotizacionSticky.jsx`**
   - Extraer el bloque de total actual (líneas 1556-1577)
   - Agregar card compacto siempre visible en la parte superior
   - Mantener el desglose detallado debajo (colapsable)

2. **Estructura propuesta:**
   ```jsx
   <div className="sticky top-6 space-y-4">
     {/* Card de Total Compacto - NUEVO */}
     <TotalCard 
       total={total}
       simbolo={simboloMoneda}
       moneda={monedaCotizacionSeleccionada}
       pasajerosCount={totalPasajeros}
       onExportar={handleExportarPdf}
       onGuardar={handleGuardarCotizacion}
       exportingPdf={exportingPdf}
       savingCotizacion={savingCotizacion}
       isAuthenticated={isAuthenticated}
       disabled={!tienePasajerosConfigurados()}
     />
     
     {/* Desglose Detallado - EXISTENTE (solo mejoras visuales) */}
     <DesglosePasajeros ... />
   </div>
   ```

3. **Mantener exactamente:**
   - Todas las props actuales
   - Todas las funciones de callback
   - Todas las validaciones de botones
   - Toda la lógica de estados (loading, disabled)

#### Archivos a crear:
- `dashboard/src/components/cotizador/ResumenCotizacionSticky.jsx` (nuevo)

#### Archivos a modificar:
- `CotizadorForm.jsx` (importar y usar el nuevo componente)

#### Validaciones a preservar:
- ✅ Botones deshabilitados cuando no hay pasajeros
- ✅ Estados de loading (exportingPdf, savingCotizacion)
- ✅ Validación de agencia antes de exportar PDF
- ✅ Validación de autenticación para guardar

---

### **FASE 3: Mejoras Visuales de Secciones**
**Duración estimada:** 2 horas  
**Riesgo:** Muy Bajo

#### Cambios específicos:

1. **Eliminar CollapsibleSection innecesarias**
   - Método de Pago (líneas 962-1027): Convertir a sección normal
   - Tipo de Vuelo (líneas 1030-1308): Mantener contenido, mejorar diseño
   - **Razón:** Reducir clics innecesarios, información siempre visible

2. **Mejorar diseño de botones de Tipo de Vuelo** (líneas 1035-1099)
   ```jsx
   // Mantener toda la lógica onClick
   // Solo mejorar clases CSS para mejor jerarquía visual
   ```

3. **Crear sección de Monedas independiente**
   ```jsx
   <div className="mb-6 pb-6 border-b border-slate-100">
     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
       CONFIGURACIÓN DE MONEDAS
     </label>
     <div className="grid grid-cols-2 gap-4">
       {/* Select de Moneda Base */}
       {/* Select de Moneda Cotización */}
     </div>
     {/* Indicador de tasa de cambio */}
   </div>
   ```

4. **Mejorar feedback visual de cálculo**
   - Agregar indicador sutil cuando se está calculando
   - Animación suave en el total cuando cambia
   - No modificar el useEffect de cálculo automático (líneas 564-582)

#### Archivos a modificar:
- `CotizadorForm.jsx` (clases CSS y estructura JSX)

#### Validaciones a preservar:
- ✅ Cálculo automático con debounce de 300ms
- ✅ Validación de pasajeros configurados antes de calcular
- ✅ Limpieza de detalles de vuelo al cambiar tipo
- ✅ Todas las validaciones de campos requeridos

---

### **FASE 4: Sistema de Colores por Agencia**
**Duración estimada:** 1 hora  
**Riesgo:** Muy Bajo

#### Cambios específicos:

1. **Crear archivo de configuración de temas**
   ```javascript
   // dashboard/src/lib/cotizador/agencyThemes.js
   export const AGENCY_THEMES = {
     nova: {
       primary: 'indigo-600',
       primaryHover: 'indigo-700',
       gradient: 'from-indigo-600 to-blue-700',
       light: 'indigo-50',
       border: 'indigo-200'
     },
     colombia: {
       primary: 'blue-600',
       primaryHover: 'blue-700',
       gradient: 'from-blue-600 to-cyan-700',
       light: 'blue-50',
       border: 'blue-200'
     },
     apolo: {
       primary: 'amber-500',
       primaryHover: 'amber-600',
       gradient: 'from-amber-500 to-orange-600',
       light: 'amber-50',
       border: 'amber-200'
     }
   }
   ```

2. **Aplicar tema dinámicamente**
   ```jsx
   const theme = AGENCY_THEMES[agencia] || AGENCY_THEMES.nova
   
   // Usar en clases CSS
   className={`bg-${theme.primary} hover:bg-${theme.primaryHover}`}
   ```

3. **Aplicar solo en elementos visuales:**
   - Botones de acción
   - Card de total
   - Bordes y acentos
   - **NO aplicar en:** Lógica, validaciones, cálculos

#### Archivos a crear:
- `dashboard/src/lib/cotizador/agencyThemes.js` (nuevo)

#### Archivos a modificar:
- `CotizadorForm.jsx` (importar y usar temas)

---

### **FASE 5: Micro-interacciones y Polish**
**Duración estimada:** 1 hora  
**Riesgo:** Muy Bajo

#### Cambios específicos:

1. **Agregar transiciones CSS suaves**
   ```css
   /* Solo agregar clases de transición */
   transition-all duration-200 ease-in-out
   ```

2. **Indicador de cálculo activo**
   ```jsx
   {isCalculating && (
     <div className="fixed bottom-4 right-4 bg-indigo-600 text-white 
                     px-4 py-2 rounded-full shadow-lg animate-pulse">
       Calculando...
     </div>
   )}
   ```
   - Usar el estado existente del debounce
   - No modificar la lógica de cálculo

3. **Animación sutil al cambiar total**
   ```jsx
   <motion.div
     key={total}
     initial={{ scale: 0.98 }}
     animate={{ scale: 1 }}
     transition={{ duration: 0.2 }}
   >
     {formatearMonto(total)}
   </motion.div>
   ```

4. **Mejorar estados de hover y focus**
   - Agregar clases CSS para mejor feedback
   - No modificar funcionalidad de inputs

#### Archivos a modificar:
- `CotizadorForm.jsx` (agregar clases CSS y componentes de animación)

#### Dependencias a agregar:
- `framer-motion` (solo si no está instalado)

---

## 🔍 Checklist de Validación Post-Implementación

Después de cada fase, validar que:

### Funcionalidad Crítica
- [ ] El cálculo automático sigue funcionando (debounce 300ms)
- [ ] Las validaciones de campos requeridos funcionan
- [ ] El guardado en Supabase funciona correctamente
- [ ] El autoguardado en localStorage funciona
- [ ] La exportación de PDF genera el mismo diseño
- [ ] La carga de cotización en modo edición funciona
- [ ] El sistema de monedas y tasas funciona
- [ ] Los métodos de pago se filtran correctamente por moneda

### Validaciones Específicas
- [ ] Validación: nombre de cliente requerido
- [ ] Validación: origen y destino requeridos
- [ ] Validación: al menos 1 pasajero configurado
- [ ] Validación: fecha de salida requerida
- [ ] Validación: agencia requerida para exportar PDF
- [ ] Validación: autenticación para guardar cotización

### Comportamientos
- [ ] Cambiar tipo de vuelo limpia detalles correctamente
- [ ] Cambiar método de pago actualiza moneda automáticamente
- [ ] Cambiar moneda base actualiza tasa para VES
- [ ] Agregar/eliminar pasajeros recalcula total
- [ ] El banner de cotización guardada aparece correctamente
- [ ] El botón "Limpiar" resetea todo el formulario

### Estados
- [ ] Loading states funcionan (exportingPdf, savingCotizacion)
- [ ] Disabled states funcionan correctamente
- [ ] El modo edición carga todos los datos
- [ ] El draft recovery funciona al recargar página

---

## 📦 Archivos que se van a Modificar

### Archivos Existentes (solo cambios visuales)
1. `dashboard/src/components/cotizador/CotizadorForm.jsx`
   - Reorganización de JSX
   - Actualización de clases CSS
   - Extracción de secciones a componentes

### Archivos Nuevos (componentes visuales)
1. `dashboard/src/components/cotizador/ResumenCotizacionSticky.jsx`
2. `dashboard/src/components/cotizador/SeccionMonedas.jsx`
3. `dashboard/src/lib/cotizador/agencyThemes.js`

### Archivos que NO se van a Tocar
- ❌ `dashboard/src/components/cotizador/resultados/PdfContent.jsx`
- ❌ `dashboard/src/services/cotizador/pdfService.js`
- ❌ `dashboard/src/services/cotizador/cotizacionService.js`
- ❌ `dashboard/src/lib/cotizador/conversorInteligente.js`
- ❌ `dashboard/src/lib/cotizador/monedasConfig.js`
- ❌ `dashboard/src/lib/cotizador/tasasHelpers.js`
- ❌ `dashboard/src/hooks/cotizador/*` (todos los hooks)

---

## 🎨 Mockup Visual de Cambios

### Layout Actual vs. Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                         ANTES (Actual)                          │
├─────────────────────────────────┬───────────────────────────────┤
│ [Agencia]                       │                               │
│ [Nombre Cliente]                │   [Desglose largo]            │
│ [Pasajeros con scroll]          │   - Pasajero 1                │
│   └─ Monedas dentro             │   - Pasajero 2                │
│ [▼ Método de Pago]              │   - Subtotales                │
│ [▼ Tipo de Vuelo]               │   ...                         │
│   - Origen/Destino              │   [Total al final]            │
│   - Detalles                    │                               │
└─────────────────────────────────┴───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       DESPUÉS (Propuesto)                       │
├─────────────────────────────────┬───────────────────────────────┤
│ [Agencia]                       │ ┌───────────────────────────┐ │
│ [Nombre Cliente]                │ │ 💎 TOTAL: $X,XXX.XX      │ │
│                                 │ │ 3 pasajeros • USD → VES   │ │
│ [Tipo de Vuelo]                 │ │ [Exportar] [Guardar]      │ │
│   IDA Y VUELTA | SOLO IDA       │ └───────────────────────────┘ │
│                                 │                               │
│ [Origen] → [Destino]            │ ┌───────────────────────────┐ │
│                                 │ │ Desglose                  │ │
│ [Monedas]                       │ │ ─────────────────────────  │ │
│   USD → VES (Tasa: 45.2)        │ │ 3 Adultos      $1,500     │ │
│                                 │ │ 1 Niño         $  350     │ │
│ [Pasajeros]                     │ │ ─────────────────────────  │ │
│   [+ Adulto] [+ Niño]           │ │ Subtotal       $1,850     │ │
│   • Adulto 1 - $545             │ │ Conversión     ×45.2      │ │
│   • Adulto 2 - $545             │ │ Recargo 4.5%   $   83     │ │
│                                 │ │ ─────────────────────────  │ │
│ [Método de Pago]                │ │ TOTAL          Bs 87,434  │ │
│   [Seleccionar...]              │ └───────────────────────────┘ │
│                                 │                               │
│ [Detalles del Vuelo]            │                               │
│   - Fechas, horas               │                               │
│   - Escalas                     │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Romper cálculo automático
**Mitigación:** No tocar useEffect de cálculo (líneas 564-582)

### Riesgo 2: Romper validaciones
**Mitigación:** Solo mover JSX, mantener todas las funciones de validación

### Riesgo 3: Romper guardado
**Mitigación:** No modificar handleGuardarCotizacion ni estructura de datos

### Riesgo 4: Romper PDF
**Mitigación:** No tocar PdfContent ni exportarCotizacionPDF

### Riesgo 5: Romper modo edición
**Mitigación:** No modificar cargarCotizacionParaEditar ni mapeo de datos

---

## 📊 Estimación de Tiempo Total

| Fase | Duración | Riesgo |
|------|----------|--------|
| Fase 1: Layout | 1-2h | Bajo |
| Fase 2: Resumen Sticky | 1h | Muy Bajo |
| Fase 3: Mejoras Visuales | 2h | Muy Bajo |
| Fase 4: Temas por Agencia | 1h | Muy Bajo |
| Fase 5: Micro-interacciones | 1h | Muy Bajo |
| **Testing y Validación** | 1-2h | - |
| **TOTAL** | **7-9 horas** | **Bajo** |

---

## ✅ Criterios de Aceptación

1. ✅ Todas las validaciones actuales funcionan
2. ✅ El cálculo automático funciona igual
3. ✅ El guardado en Supabase funciona
4. ✅ El PDF se genera con el mismo diseño
5. ✅ El autoguardado en localStorage funciona
6. ✅ El modo edición carga correctamente
7. ✅ La UI es más clara y organizada
8. ✅ El flujo de usuario es más intuitivo
9. ✅ El resumen sticky siempre visible
10. ✅ Los temas por agencia funcionan

---

## 🚀 Siguiente Paso

**Espero tu validación de este plan antes de implementar.**

¿Hay alguna fase que quieras modificar, eliminar o agregar? ¿Alguna preocupación específica sobre mantener la funcionalidad actual?
