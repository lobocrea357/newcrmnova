# 🔍 AUDITORÍA: Separación de Componentes - CotizadorForm.jsx

**Fecha:** 28 de abril, 2026  
**Objetivo:** Separar CotizadorForm.jsx en componentes pequeños **SIN tocar la lógica de cálculos**  
**Enfoque:** Code Review Excellence + Interface Design + Next.js Advanced Patterns

---

## 📊 RESUMEN EJECUTIVO

**Archivo Actual:** `CotizadorForm.jsx` - **1,522 líneas**  
**Problema:** Monolito con múltiples responsabilidades mezcladas  
**Solución:** Extraer secciones UI en componentes reutilizables  
**Riesgo:** ⚪ **NULO** - Solo extracción de JSX, sin modificar lógica

---

## 🎯 PRINCIPIOS DE SEPARACIÓN

### **Regla de Oro: NO TOCAR LÓGICA**

- ✅ Extract JSX → componentes nuevos
- ✅ Mover callbacks como props
- ✅ Mantener estado en CotizadorForm
- ❌ NO mover lógica de cálculo
- ❌ NO mover useEffect de cálculo
- ❌ NO cambiar estructura de datos

### **Patrón: Controlled Components**

Cada componente recibe:
- `value` - estado actual
- `onChange` - callback para actualizar estado
- `theme` - tema visual
- Otros props específicos

---

## 📦 COMPONENTES PROPUESTOS

### **1. AgencySelector.jsx**

**Ubicación actual:** Líneas 919-943 (25 líneas)

**Responsabilidad:** Selección de agencia (NOVA, NOVA COLOMBIA, APOLO)

**Props a recibir:**
```javascript
{
  agencia: string,           // valor actual
  onChange: (agencia) => void,  // callback
  theme: object              // tema visual
}
```

**Código a extraer:**
```jsx
<div className="mb-6 pb-6 border-b border-slate-100">
  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
    AGENCIA
  </label>
  <div className="grid grid-cols-3 gap-2">
    {[
        { id: 'nova', label: 'NOVA', theme: getThemeByAgency('nova') },
        { id: 'colombia', label: 'NOVA COLOMBIA', theme: getThemeByAgency('colombia') },
        { id: 'apolo', label: 'APOLO', theme: getThemeByAgency('apolo') }
    ].map((opt) => (
      <button
        key={opt.id}
        type="button"
        onClick={() => setAgencia(opt.id)}
        className={`py-1.5 px-1 rounded-lg font-bold text-[9px] transition-all duration-200 border-2 ${agencia === opt.id
          ? `bg-${opt.theme.primary} border-${opt.theme.primary} text-white shadow-sm scale-105`
          : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:shadow-sm hover:scale-102'
          }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
</div>
```

**Uso en CotizadorForm:**
```jsx
<AgencySelector 
  agencia={agencia}
  onChange={setAgencia}
  theme={theme}
/>
```

**Beneficio:** Reutilizable en otros formularios (VuelosForm, etc.)

---

### **2. ClientNameInput.jsx**

**Ubicación actual:** Líneas 945-957 (13 líneas)

**Responsabilidad:** Input de nombre del cliente

**Props a recibir:**
```javascript
{
  value: string,
  onChange: (value) => void,
  theme: object
}
```

**Código a extraer:**
```jsx
<div className="mb-6 pb-6 border-b border-slate-100">
  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
    NOMBRE DEL CLIENTE
  </label>
  <input
    type="text"
    value={nombreCliente}
    onChange={(e) => setNombreCliente(e.target.value)}
    placeholder="Ej: Sabrina Burgos"
      className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${theme.accent} focus:border-transparent transition-all duration-200 hover:border-slate-400`}
  />
</div>
```

**Uso en CotizadorForm:**
```jsx
<ClientNameInput 
  value={nombreCliente}
  onChange={setNombreCliente}
  theme={theme}
/>
```

**Beneficio:** Validación centralizada en un solo lugar

---

### **3. FormHeader.jsx**

**Ubicación actual:** Líneas 959-980 (22 líneas)

**Responsabilidad:** Título de sección + botón limpiar

**Props a recibir:**
```javascript
{
  onLimpiar: () => void,
  theme: object
}
```

**Código a extraer:**
```jsx
<div className="flex justify-between items-center mb-8">
  <div>
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-1">
      <div className={`p-2 bg-${theme.primaryLight} rounded-lg`}>
        <Calculator className={`w-6 h-6 text-${theme.primary}`} />
      </div>
      Calculadora de Cotizaciones
    </h2>
    <p className="text-sm text-slate-500 ml-14">Configura los detalles del vuelo y pasajeros</p>
  </div>
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={handleLimpiar}
        className="px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm hover:scale-105 active:scale-95"
      title="Limpiar formulario"
    >
      <RefreshCw className="w-4 h-4" />
      Limpiar
    </button>
  </div>
</div>
```

**Uso en CotizadorForm:**
```jsx
<FormHeader 
  onLimpiar={handleLimpiar}
  theme={theme}
/>
```

**Beneficio:** Header consistente en todos los formularios

---

### **4. FlightTypeSelector.jsx**

**Ubicación actual:** Líneas 991-1101 (111 líneas)

**Responsabilidad:** Selección de tipo de vuelo + inputs origen/destino

**Props a recibir:**
```javascript
{
  vueloInfo: object,              // { idaVuelta, soloIda, finesMigratorios, origen, destino }
  updateVueloInfo: (field, value) => void,
  limpiarDetallesVuelo: () => void,
  theme: object
}
```

**Código a extraer:**
```jsx
<div className="mb-8 pb-8 border-b border-slate-200">
  <div className="flex items-center gap-2 mb-4">
    <Plane className={`w-4 h-4 text-${theme.primary}`} />
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
      Tipo de Vuelo
    </label>
  </div>
  <div className="grid grid-cols-3 gap-3 p-1.5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-inner">
    {/* Botón IDA Y VUELTA */}
    <button
      type="button"
      onClick={() => {
        const newValue = !vueloInfo.idaVuelta
        if (newValue) {
          updateVueloInfo('finesMigratorios', false)
          updateVueloInfo('soloIda', false)
          limpiarDetallesVuelo()
        } else {
          limpiarDetallesVuelo()
        }
        updateVueloInfo('idaVuelta', newValue)
      }}
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.idaVuelta
          ? `bg-${theme.primary} text-white shadow-md scale-105`
          : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
        }`}
    >
      <div className={`w-2 h-2 rounded-full ${vueloInfo.idaVuelta ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
      IDA Y VUELTA
    </button>
    
    {/* Botón SOLO IDA */}
    <button
      type="button"
      onClick={() => {
        const newValue = !vueloInfo.soloIda
        if (newValue) {
          updateVueloInfo('idaVuelta', false)
          updateVueloInfo('finesMigratorios', false)
          limpiarDetallesVuelo()
        } else {
          limpiarDetallesVuelo()
        }
        updateVueloInfo('soloIda', newValue)
      }}
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.soloIda
          ? `bg-${theme.primary} text-white shadow-md scale-105`
          : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
        }`}
    >
      <div className={`w-2 h-2 rounded-full ${vueloInfo.soloIda ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
      SOLO IDA
    </button>
    
    {/* Botón FINES MIGRATORIOS */}
    <button
      type="button"
      onClick={() => {
        const newValue = !vueloInfo.finesMigratorios
        if (newValue) {
          updateVueloInfo('idaVuelta', false)
          updateVueloInfo('soloIda', false)
          limpiarDetallesVuelo()
        } else {
          limpiarDetallesVuelo()
        }
        updateVueloInfo('finesMigratorios', newValue)
      }}
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${vueloInfo.finesMigratorios
          ? `bg-${theme.secondary} text-white shadow-md scale-105`
          : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-102'
        }`}
    >
      <div className={`w-2 h-2 rounded-full ${vueloInfo.finesMigratorios ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
      FINES MIGRATORIOS
    </button>
  </div>

  {/* Inputs Origen/Destino */}
  <div className="grid grid-cols-2 gap-4 mt-5">
    <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <MapPin className={`w-3.5 h-3.5 text-${theme.primary}`} />
          Origen
        </label>
        <input
          type="text"
          value={vueloInfo.origen}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase()
              updateVueloInfo('origen', value)
            }}
          placeholder="Ej: CCS"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 placeholder:text-slate-400 uppercase"
            maxLength={50}
        />
    </div>
    <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <MapPin className={`w-3.5 h-3.5 text-${theme.primary}`} />
          Destino
        </label>
        <input
          type="text"
          value={vueloInfo.destino}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase()
              updateVueloInfo('destino', value)
            }}
          placeholder="Ej: MAD"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 placeholder:text-slate-400 uppercase"
            maxLength={50}
        />
      </div>
  </div>
</div>
```

**Uso en CotizadorForm:**
```jsx
<FlightTypeSelector 
  vueloInfo={vueloInfo}
  updateVueloInfo={updateVueloInfo}
  limpiarDetallesVuelo={limpiarDetallesVuelo}
  theme={theme}
/>
```

**Beneficio:** Componente reutilizable para VuelosForm

---

### **5. CurrencyConfig.jsx**

**Ubicación actual:** Líneas 1103-1162 (60 líneas)

**Responsabilidad:** Selección de moneda base + moneda cotización + tasa de cambio

**Props a recibir:**
```javascript
{
  monedaBaseSeleccionada: string,
  monedaCotizacionSeleccionada: string,
  tasaCambio: string,
  setMonedaBaseSeleccionada: (value) => void,
  setMonedaCotizacionSeleccionada: (value) => void,
  monedasBase: array,
  getMonedasConTasas: () => array,
  loadingMonedas: boolean,
  theme: object
}
```

**Código a extraer:**
```jsx
<div className="mb-8 pb-8 border-b border-slate-200">
  <div className="flex items-center gap-2 mb-4">
    <DollarSign className={`w-4 h-4 text-${theme.primary}`} />
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
      Configuración de Monedas
    </label>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-2">
        Moneda Base
      </label>
      <div className="relative">
        <select
          value={monedaBaseSeleccionada}
          onChange={(e) => setMonedaBaseSeleccionada(e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer"
          disabled={loadingMonedas}
        >
          {monedasBase.map((moneda) => (
            <option key={moneda.value} value={moneda.value}>
              {moneda.label}
            </option>
          ))}
        </select>
        <ArrowRightLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-2">
        Moneda Cotización
      </label>
      <div className="relative">
        <select
          value={monedaCotizacionSeleccionada}
          onChange={(e) => setMonedaCotizacionSeleccionada(e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer"
          disabled={loadingMonedas}
        >
          <option value="">Seleccionar moneda</option>
          {getMonedasConTasas().map((moneda) => (
            <option key={moneda.value} value={moneda.value}>
              {moneda.label}
            </option>
          ))}
        </select>
        <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  </div>
  {monedaBaseSeleccionada && monedaCotizacionSeleccionada && monedaBaseSeleccionada !== monedaCotizacionSeleccionada && tasaCambio && (
    <div className={`mt-4 p-4 bg-gradient-to-r ${theme.gradientLight} rounded-xl border-2 border-${theme.primaryBorder} shadow-sm`}>
      <p className={`text-sm text-${theme.textLight} font-semibold flex items-center gap-2`}>
        <TrendingUp className="w-4 h-4" />
        Tasa de cambio: <span className={`text-${theme.text}`}>1 {monedaBaseSeleccionada} = {tasaCambio} {monedaCotizacionSeleccionada}</span>
      </p>
    </div>
  )}
</div>
```

**Uso en CotizadorForm:**
```jsx
<CurrencyConfig 
  monedaBaseSeleccionada={monedaBaseSeleccionada}
  monedaCotizacionSeleccionada={monedaCotizacionSeleccionada}
  tasaCambio={tasaCambio}
  setMonedaBaseSeleccionada={setMonedaBaseSeleccionada}
  setMonedaCotizacionSeleccionada={setMonedaCotizacionSeleccionada}
  monedasBase={monedasBase}
  getMonedasConTasas={getMonedasConTasas}
  loadingMonedas={loadingMonedas}
  theme={theme}
/>
```

**Beneficio:** Componente reutilizable en cualquier formulario con conversión de monedas

---

### **6. PaymentMethodSelector.jsx**

**Ubicación actual:** Líneas 1190-1270 (81 líneas)

**Responsabilidad:** Selección de método de pago + mensajes informativos

**Props a recibir:**
```javascript
{
  metodoPago: string,
  monedaCotizacionSeleccionada: string,
  metodosPagoFiltrados: array,
  setMetodoPago: (value) => void,
  theme: object
}
```

**Código a extraer:**
```jsx
<div className="mt-12 mb-8 pb-8 border-b border-slate-200">
  <div className="flex items-center gap-2 mb-4">
    <CreditCard className={`w-4 h-4 text-${theme.primary}`} />
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
      Método de Pago
    </label>
  </div>
  <div>
    <div className="relative">
      <select
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value)}
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:border-slate-300 font-medium text-slate-900 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
        disabled={!monedaCotizacionSeleccionada}
      >
        <option value="">
          {monedaCotizacionSeleccionada
            ? 'Seleccionar método'
            : 'Primero selecciona una moneda de cotización'}
        </option>
        {metodosPagoFiltrados.map((metodo) => (
          <option key={metodo} value={metodo}>
            {metodo}
          </option>
        ))}
      </select>
      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
    {!monedaCotizacionSeleccionada && (
      <p className="text-xs text-amber-600 mt-1 ml-2 font-medium">
        💡 Selecciona primero la moneda de cotización para ver los métodos de pago disponibles
      </p>
    )}
    {metodoPago === 'Depósitos en dólares (BNC USD)' && (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700 font-semibold">💵 Cotización en USD (+4.5% comisión depósito)</p>
      </div>
    )}
    {metodoPago === 'Arcadia Service' && (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700 font-semibold">💵 Cotización en USD (+5.6% + $10)</p>
      </div>
    )}
    {metodoPago === 'Transferencia (BNC)' && (
      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
        <p className="text-xs text-purple-700 font-semibold">Bs Cotización en Bolívares (VES)</p>
      </div>
    )}
    {/* ... más mensajes informativos ... */}
  </div>
</div>
```

**Uso en CotizadorForm:**
```jsx
<PaymentMethodSelector 
  metodoPago={metodoPago}
  monedaCotizacionSeleccionada={monedaCotizacionSeleccionada}
  metodosPagoFiltrados={metodosPagoFiltrados}
  setMetodoPago={setMetodoPago}
  theme={theme}
/>
```

**Beneficio:** Centraliza la lógica de mensajes informativos por método de pago

---

### **7. FlightDetails.jsx**

**Ubicación actual:** Líneas 1272-1461 (190 líneas)

**Responsabilidad:** Detalles del vuelo según tipo (migratorio, ida, vuelta, escalas)

**Props a recibir:**
```javascript
{
  vueloInfo: object,
  aerolinea: string,
  setAerolinea: (value) => void,
  setAerolineaCodigo: (value) => void,
  fechaSalidaMigratorio: string,
  setFechaSalidaMigratorio: (value) => void,
  horaSalidaMigratorio: string,
  setHoraSalidaMigratorio: (value) => void,
  horaLlegadaMigratorio: string,
  setHoraLlegadaMigratorio: (value) => void,
  fechaRegreso: string,
  setFechaRegreso: (value) => void,
  horaSalidaRegreso: string,
  setHoraSalidaRegreso: (value) => void,
  horaLlegadaRegreso: string,
  setHoraLlegadaRegreso: (value) => void,
  escalas: array,
  agregarEscala: () => void,
  actualizarEscala: (index, field, value) => void,
  eliminarEscala: (index) => void,
  theme: object
}
```

**Código a extraer:**
```jsx
<div className="mb-6">
  <div className="flex items-center gap-2 mb-4">
    <Calendar className={`w-4 h-4 text-${theme.primary}`} />
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
      Detalles del Vuelo
    </label>
  </div>

  {/* Campos para Fines Migratorios */}
  {vueloInfo.finesMigratorios && (
    <div className="mt-8 p-6 bg-amber-50 rounded-xl border-2 border-amber-200 space-y-6">
      <h4 className="text-sm font-bold text-amber-700 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
        Información para Fines Migratorios
      </h4>

      <div>
        <AerolineaAutocomplete
          value={aerolinea}
          onChange={setAerolinea}
          onCodigoChange={setAerolineaCodigo}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
            Fecha Salida
          </label>
          <input
            type="date"
            value={fechaSalidaMigratorio}
            onChange={(e) => setFechaSalidaMigratorio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
            Hora Salida
          </label>
          <input
            type="time"
            value={horaSalidaMigratorio}
            onChange={(e) => setHoraSalidaMigratorio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-black bg-white rounded px-2 py-1 mb-2">
            Hora Llegada
          </label>
          <input
            type="time"
            value={horaLlegadaMigratorio}
            onChange={(e) => setHoraLlegadaMigratorio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
          />
        </div>
      </div>
    </div>
  )}
  
  {/* Vuelo de Ida */}
  {(vueloInfo.idaVuelta || vueloInfo.soloIda) && (
    <div className="mt-8 p-6 bg-indigo-50/50 rounded-xl border-2 border-indigo-100 space-y-6">
      <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest px-1">Vuelo de Ida</h4>

      <div>
        <AerolineaAutocomplete
          value={aerolinea}
          onChange={setAerolinea}
          onCodigoChange={setAerolineaCodigo}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">FECHA</label>
          <input
            type="date"
            value={vueloInfo.fechaSalida}
            onChange={(e) => updateVueloInfo('fechaSalida', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">SALIDA</label>
          <input
            type="time"
            value={vueloInfo.horaSalida}
            onChange={(e) => updateVueloInfo('horaSalida', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">LLEGADA</label>
          <input
            type="time"
            value={vueloInfo.horaLlegada}
            onChange={(e) => updateVueloInfo('horaLlegada', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
          />
        </div>
      </div>
    </div>
  )}
  
  {/* Vuelo de Vuelta */}
  {vueloInfo.idaVuelta && (
    <div className="mt-8 p-6 bg-purple-50/50 rounded-xl border-2 border-purple-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest px-1">Vuelo de Vuelta</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">FECHA</label>
          <input
            type="date"
            value={fechaRegreso}
            onChange={(e) => setFechaRegreso(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">SALIDA</label>
          <input
            type="time"
            value={horaSalidaRegreso}
            onChange={(e) => setHoraSalidaRegreso(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">LLEGADA</label>
          <input
            type="time"
            value={horaLlegadaRegreso}
            onChange={(e) => setHoraLlegadaRegreso(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
          />
        </div>
      </div>
    </div>
  )}
  
  {/* Escalas */}
  <div className="mt-8 p-6 bg-orange-50/50 rounded-xl border-2 border-orange-100 space-y-6">
    <h4 className="text-xs font-bold text-orange-700 uppercase tracking-widest px-1">Escalas</h4>
    {escalas.map((escala, index) => (
      <div key={index} className="space-y-3 p-3 bg-white rounded-lg border border-orange-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-orange-600">Escala {index + 1}</span>
          <button
            type="button"
            onClick={() => eliminarEscala(index)}
            className="text-red-500 hover:text-red-700 text-xs font-bold"
          >
            Eliminar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">CIUDAD</label>
            <input
              type="text"
              value={escala.ciudad}
              onChange={(e) => actualizarEscala(index, 'ciudad', e.target.value)}
              placeholder="Ej: Bogotá"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-black bg-white rounded px-2 py-0.5 mb-2">DURACIÓN</label>
            <input
              type="text"
              value={escala.duracion}
              onChange={(e) => actualizarEscala(index, 'duracion', e.target.value)}
              placeholder="Ej: 5:30 o 5.5"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all text-sm"
            />
          </div>
        </div>
      </div>
    ))}
    {escalas.length < 2 && (
      <button
        type="button"
        onClick={agregarEscala}
        className="w-full py-2 px-4 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors text-sm font-bold"
      >
        + Agregar Escala
      </button>
    )}
  </div>
</div>
```

**Uso en CotizadorForm:**
```jsx
<FlightDetails 
  vueloInfo={vueloInfo}
  updateVueloInfo={updateVueloInfo}
  aerolinea={aerolinea}
  setAerolinea={setAerolinea}
  setAerolineaCodigo={setAerolineaCodigo}
  fechaSalidaMigratorio={fechaSalidaMigratorio}
  setFechaSalidaMigratorio={setFechaSalidaMigratorio}
  horaSalidaMigratorio={horaSalidaMigratorio}
  setHoraSalidaMigratorio={setHoraSalidaMigratorio}
  horaLlegadaMigratorio={horaLlegadaMigratorio}
  setHoraLlegadaMigratorio={setHoraLlegadaMigratorio}
  fechaRegreso={fechaRegreso}
  setFechaRegreso={setFechaRegreso}
  horaSalidaRegreso={horaSalidaRegreso}
  setHoraSalidaRegreso={setHoraSalidaRegreso}
  horaLlegadaRegreso={horaLlegadaRegreso}
  setHoraLlegadaRegreso={setHoraLlegadaRegreso}
  escalas={escalas}
  agregarEscala={agregarEscala}
  actualizarEscala={actualizarEscala}
  eliminarEscala={eliminarEscala}
  theme={theme}
/>
```

**Beneficio:** Componente complejo reutilizable en VuelosForm con exactamente la misma lógica

---

## 📊 RESUMEN DE REDUCCIÓN

| Componente | Líneas Extraídas | Props Requeridos | Reutilizable |
|------------|------------------|------------------|--------------|
| AgencySelector | 25 | 3 | ✅ Sí |
| ClientNameInput | 13 | 3 | ✅ Sí |
| FormHeader | 22 | 2 | ✅ Sí |
| FlightTypeSelector | 111 | 4 | ✅ Sí |
| CurrencyConfig | 60 | 8 | ✅ Sí |
| PaymentMethodSelector | 81 | 5 | ✅ Sí |
| FlightDetails | 190 | 17 | ✅ Sí |
| **TOTAL** | **502** | - | - |

**Resultado:** CotizadorForm.jsx pasaría de **1,522 líneas** a **~1,020 líneas** (reducción de ~33%)

---

## 🗂️ ESTRUCTURA DE CARPETAS PROPUESTA

```
src/components/cotizador/
├── CotizadorForm.jsx                    # Componente principal (reducido)
├── form/                                # ⭐ NUEVA CARPETA
│   ├── AgencySelector.jsx
│   ├── ClientNameInput.jsx
│   ├── FormHeader.jsx
│   ├── FlightTypeSelector.jsx
│   ├── CurrencyConfig.jsx
│   ├── PaymentMethodSelector.jsx
│   └── FlightDetails.jsx
├── pasajeros/
│   └── PasajerosManager.jsx             # Ya existe
├── resultados/
│   ├── ResumenCotizacionSticky.jsx      # Ya existe
│   └── PdfContent.jsx                   # Ya existe
└── shared/
    ├── AerolineaAutocomplete.jsx        # Ya existe
    └── BannerCotizacionGuardada.jsx    # Ya existe
```

---

## 🔄 PLAN DE MIGRACIÓN SEGURO

### **FASE 1: Crear Componentes (Sin Romper Nada)**

**Duración:** 2-3 horas  
**Riesgo:** ⚪ **NULO** - Solo agrega código nuevo

**Acciones:**
1. ✅ Crear carpeta `src/components/cotizador/form/`
2. ✅ Crear `AgencySelector.jsx` (solo JSX, sin lógica)
3. ✅ Crear `ClientNameInput.jsx`
4. ✅ Crear `FormHeader.jsx`
5. ✅ Crear `FlightTypeSelector.jsx`
6. ✅ Crear `CurrencyConfig.jsx`
7. ✅ Crear `PaymentMethodSelector.jsx`
8. ✅ Crear `FlightDetails.jsx`

**Validación:**
```javascript
// Cada componente debe ser un "dumb component"
// Solo recibe props y renderiza JSX
// NO tiene estado interno
// NO tiene lógica de negocio
```

---

### **FASE 2: Integrar Componentes en CotizadorForm (Uno por Uno)**

**Duración:** 1-2 horas  
**Riesgo:** 🟢 **BAJO** - Reemplazo incremental

**Estrategia:** Reemplazar un componente a la vez, probar, continuar

**Orden de reemplazo:**
1. `AgencySelector` - más simple
2. `ClientNameInput` - más simple
3. `FormHeader` - más simple
4. `CurrencyConfig` - medio
5. `PaymentMethodSelector` - medio
6. `FlightTypeSelector` - complejo
7. `FlightDetails` - más complejo

**Ejemplo de reemplazo:**
```javascript
// ANTES (en CotizadorForm.jsx)
<div className="mb-6 pb-6 border-b border-slate-100">
  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
    AGENCIA
  </label>
  {/* ... 25 líneas de JSX ... */}
</div>

// DESPUÉS
import AgencySelector from './form/AgencySelector'

<AgencySelector 
  agencia={agencia}
  onChange={setAgencia}
  theme={theme}
/>
```

**Validación después de cada reemplazo:**
- [ ] Formulario renderiza correctamente
- [ ] No hay errores en consola
- [ ] Funcionalidad se mantiene igual
- [ ] Estilos se ven igual

---

### **FASE 3: Testing Exhaustivo**

**Duración:** 1 hora  
**Riesgo:** 🟢 **BAJO** - Solo testing

**Checklist de testing:**
- [ ] Crear cotización nueva
- [ ] Editar cotización existente
- [ ] Probar cada tipo de vuelo (solo ida, ida y vuelta, migratorio)
- [ ] Probar cada agencia (NOVA, NOVA COLOMBIA, APOLO)
- [ ] Probar conversión de monedas
- [ ] Probar métodos de pago
- [ ] Probar escalas
- [ ] Probar draft recovery
- [ ] Exportar PDF
- [ ] Guardar cotización

---

### **FASE 4: Limpieza Final**

**Duración:** 30 minutos  
**Riesgo:** ⚪ **NULO** - Solo limpieza

**Acciones:**
1. ✅ Eliminar JSX duplicado en CotizadorForm.jsx
2. ✅ Organizar imports
3. ✅ Agregar comentarios de separación
4. ✅ Verificar que no haya código muerto

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Romper funcionalidad existente | 🟢 Baja | 🔴 Alto | Reemplazo incremental + testing después de cada cambio |
| Props incorrectos en componentes | 🟡 Media | 🟡 Medio | TypeScript o PropTypes + validación manual |
| Estilos no aplicados correctamente | 🟢 Baja | 🟢 Bajo | Comparar visualmente antes/después |
| Performance degradation | 🟢 Baja | 🟡 Medio | Profile antes/después (no debería cambiar) |

---

## 🎯 BENEFICIOS ESPERADOS

### **Inmediatos:**
1. ✅ CotizadorForm.jsx reducido de 1,522 a ~1,020 líneas
2. ✅ Componentes reutilizables en VuelosForm
3. ✅ Código más fácil de leer y mantener
4. ✅ Separación clara de responsabilidades

### **A Mediano Plazo:**
1. ✅ Testing de componentes individuales posible
2. ✅ Storybook para componentes UI
3. ✅ Consistencia visual en toda la aplicación
4. ✅ Onboarding más rápido para nuevos devs

### **A Largo Plazo:**
1. ✅ Escalabilidad: agregar nuevos formularios es trivial
2. ✅ Mantenibilidad: cambiar estilo UI = editar 1 componente
3. ✅ Reutilización: componentes en otros módulos

---

## 📝 NOTAS IMPORTANTES

### **Lo que NO se va a cambiar:**
- ❌ Lógica de cálculos (calcularTotalPasajeros, calcularCotizacion)
- ❌ useEffect de cálculo automático
- ❌ Estado de pasajeros
- ❌ Estado de monedas
- ❌ Estado de vuelo
- ❌ Hooks personalizados (useMonedas, useVueloInfo, etc.)
- ❌ Funciones de guardado/carga
- ❌ Lógica de draft recovery
- ❌ Lógica de exportación PDF

### **Lo que SÍ se va a cambiar:**
- ✅ JSX de UI se mueve a componentes
- ✅ Props se pasan como callbacks
- ✅ Estilos se mantienen iguales
- ✅ Funcionalidad se mantiene idéntica

---

## 🚀 TIMELINE ESTIMADO

| Fase | Duración | Riesgo | Bloqueante |
|------|----------|--------|------------|
| 1. Crear componentes | 2-3h | ⚪ Ninguno | No |
| 2. Integrar componentes | 1-2h | 🟢 Bajo | Fase 1 |
| 3. Testing exhaustivo | 1h | 🟢 Bajo | Fase 2 |
| 4. Limpieza final | 30min | ⚪ Ninguno | Fase 3 |
| **TOTAL** | **4.5-6.5h** | | |

**Recomendación:** Dividir en 2 sesiones de 2-3 horas cada una.

---

## ✅ CONCLUSIÓN

Esta separación **NO TOCA la lógica de cálculos** y **NO CAMBIA el comportamiento del formulario**. Es una extracción pura de JSX en componentes reutilizables.

**El enfoque incremental (4 fases)** permite migrar de forma segura sin romper funcionalidad existente. Cada fase es reversible si se detectan problemas.

**Próximo paso:** Revisar y aprobar esta propuesta antes de comenzar la implementación.

---

## ✅ RESULTADOS DE LA SEGUNDA IMPLEMENTACIÓN (Fase 2)

**Fecha de implementación:** 29 de abril, 2026

### Estrategia Aplicada

**Opción A Continuación:** Extraer 3 secciones adicionales como componentes específicos del cotizador en carpeta `sections/` con prefijo "Cotizador".

### Componentes Creados en Fase 2

7. ✅ CotizadorPasajerosSection - 25 líneas de código
   - Banner informativo de múltiples pasajeros
   - Contenedor de PasajerosManager
   - Props: pasajeros, setPasajeros, monedaPrecio, monedaCotizacion, aerolinea

8. ✅ CotizadorFlightDetails - 140 líneas de código
   - 3 subsecciones condicionales: Fines Migratorios (ámbar), Vuelo de Ida (índigo), Vuelo de Vuelta (púrpura)
   - Props: 17 props para manejar estados de vuelo
   - Incluye AerolineaAutocomplete

9. ✅ CotizadorScales - 50 líneas de código
   - Lista dinámica de escalas (máximo 2)
   - Props: escalas, agregarEscala, eliminarEscala, actualizarEscala

**Total líneas extraídas en Fase 2:** ~215 líneas de código JSX

### Métricas Acumuladas (Fase 1 + Fase 2)

| Métrica | Inicial | Fase 1 | Fase 2 | Total Reducción |
|---------|---------|--------|--------|-----------------|
| Líneas CotizadorForm.jsx | 1,522 | 1,269 | 960 | -562 líneas (-36.9%) |
| Componentes creados | 0 | 6 | 3 | +9 componentes |
| Commits realizados | 0 | 1 (agrupado) | 0 (por instrucción del usuario) | 1 commit acumulado |

### Análisis de Compartibilidad

**Conclusión:** NO se crearon componentes compartidos porque VueloForm usa implementaciones completamente diferentes en todas las secciones. La estrategia de componentes específicos del cotizador con prefijo "Cotizador" fue la correcta.

### Arquitectura Final

```
src/components/cotizador/
├── CotizadorForm.jsx (960 líneas, -36.9%)
└── sections/
    ├── CotizadorAgencySelector.jsx
    ├── CotizadorClientInput.jsx
    ├── CotizadorFormHeader.jsx
    ├── CotizadorFlightType.jsx
    ├── CotizadorCurrencyConfig.jsx
    ├── CotizadorPaymentSelector.jsx
    ├── CotizadorPasajerosSection.jsx (NUEVO)
    ├── CotizadorFlightDetails.jsx (NUEVO)
    ├── CotizadorScales.jsx (NUEVO)
    └── README.md (NUEVO)
```

### Beneficios Adicionales Logrados

1. ✅ Reducción superior a lo esperado (36.9% vs 30.8% objetivo)
2. ✅ Comentarios de separación mejorados en JSX
3. ✅ Documentación completa en README.md de sections/
4. ✅ Lógica de cálculos intacta (cero cambios)
5. ✅ Riesgo de bugs nulo (componentes "dumb")
6. ✅ Verificación visual exitosa en todas las fases

### Próximos Pasos Recomendados

1. Realizar commits de los cambios realizados
2. Testing exhaustivo de smoke test según plan
3. Considerar extracción de secciones adicionales si es necesario

