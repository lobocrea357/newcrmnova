# Gestión de Crédito en Vuelos - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar gestión completa de ventas a crédito con pagos iniciales, diferenciando entre deuda del cliente y deuda con el proveedor.

**Architecture:** Sistema en 4 capas - Base de datos con triggers automáticos para cálculo de saldos, validaciones condicionales en API según forma de emisión, interfaz de usuario con feedback visual en tiempo real, y módulos de deudas actualizados para trabajar con la nueva estructura.

**Tech Stack:** PostgreSQL (triggers + constraints), Express.js (validaciones API), React (formularios condicionales), Supabase (ORM y tiempo real)

---

## Contexto del Problema

**Estado Actual:**
- Sistema captura `forma_emision` (CONTADO/CREDITO)
- Solo registra `monto_venta` genérico
- No diferencia entre costo base y precio de venta
- No rastrea pagos iniciales del cliente

**Estado Deseado:**
- Capturar costo base al proveedor (lo que debe la agencia)
- Capturar monto total de venta (lo que debe el cliente)
- Registrar pago inicial del cliente
- Calcular automáticamente saldo pendiente
- Integración con módulos de Control de Emisiones y Gestión de Deudas

**Ejemplo de Caso de Uso:**
```
Boleto en Sabre: $500 USD (costo_base_proveedor)
Precio al cliente: $600 USD (monto_total_venta)
Pago inicial: $200 USD (pago_inicial_cliente)
────────────────────────────────────────
Saldo cliente: $400 USD (calculado automáticamente)
Deuda proveedor: $500 USD (para tabla deudas_proveedores)
Ganancia agencia: $100 USD ($600 - $500)
```

---

## Arquitectura de la Solución

### Capa 1: Base de Datos
- 4 columnas nuevas en tabla `vuelos`
- Trigger automático para calcular `saldo_pendiente_cliente`
- Constraints para validar coherencia de montos
- Índices para consultas de deudas

### Capa 2: Backend API
- Validación condicional según `forma_emision`
- Sanitización de datos antes de insertar
- Actualización de servicio `emisionesService` para usar `costo_base_proveedor`

### Capa 3: Frontend
- Renderizado condicional de sección "Gestión de Crédito"
- Cálculos en vivo (saldo pendiente, deuda proveedor, ganancia)
- Validaciones cliente-side antes de enviar
- Feedback visual con colores semánticos

### Capa 4: Integración
- Módulo Control de Emisiones usa `costo_base_proveedor`
- Módulo Gestión de Deudas usa `saldo_pendiente_cliente`
- Vista de confirmación de pago muestra ambos montos

---

## FASE 1: Base de Datos

### Task 1.1: Crear Migración de Esquema

**Files:**
- Create: `docs/05-base-de-datos/migraciones/2026-04-23-credito-vuelos.sql`

- [ ] **Step 1: Crear archivo de migración**

```sql
-- Migración: Gestión de Crédito en Vuelos
-- Fecha: 2026-04-23
-- Descripción: Agregar campos para gestión de ventas a crédito con pagos iniciales

BEGIN;

-- Agregar columnas para gestión de crédito
ALTER TABLE vuelos 
  ADD COLUMN monto_total_venta numeric CHECK (monto_total_venta >= 0),
  ADD COLUMN pago_inicial_cliente numeric DEFAULT 0 CHECK (pago_inicial_cliente >= 0),
  ADD COLUMN saldo_pendiente_cliente numeric CHECK (saldo_pendiente_cliente >= 0),
  ADD COLUMN costo_base_proveedor numeric CHECK (costo_base_proveedor >= 0);

-- Comentarios para documentación
COMMENT ON COLUMN vuelos.monto_total_venta IS 'Precio total que debe pagar el cliente (incluye markup de la agencia)';
COMMENT ON COLUMN vuelos.pago_inicial_cliente IS 'Monto inicial que pagó el cliente al momento de la reserva';
COMMENT ON COLUMN vuelos.saldo_pendiente_cliente IS 'Saldo que aún debe el cliente (calculado automáticamente)';
COMMENT ON COLUMN vuelos.costo_base_proveedor IS 'Costo base del boleto que la agencia debe al proveedor (Sabre, Kiu, etc.)';

-- Índices para optimizar consultas de deudas
CREATE INDEX idx_vuelos_saldo_pendiente ON vuelos(saldo_pendiente_cliente) 
  WHERE saldo_pendiente_cliente > 0;
  
CREATE INDEX idx_vuelos_forma_emision ON vuelos(forma_emision)
  WHERE forma_emision IS NOT NULL;

COMMIT;
```

- [ ] **Step 2: Commit migración**

```bash
git add docs/05-base-de-datos/migraciones/2026-04-23-credito-vuelos.sql
git commit -m "feat(db): agregar campos para gestión de crédito en vuelos"
```

### Task 1.2: Crear Trigger para Cálculo Automático

**Files:**
- Create: `docs/05-base-de-datos/migraciones/2026-04-23-trigger-saldo-credito.sql`

- [ ] **Step 1: Crear función de trigger**

```sql
-- Función para calcular saldo pendiente automáticamente
CREATE OR REPLACE FUNCTION calcular_saldo_pendiente_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si es venta a crédito
  IF NEW.forma_emision = 'CREDITO' THEN
    NEW.saldo_pendiente_cliente := COALESCE(NEW.monto_total_venta, 0) 
                                   - COALESCE(NEW.pago_inicial_cliente, 0);
    
    -- Validar que el saldo no sea negativo
    IF NEW.saldo_pendiente_cliente < 0 THEN
      RAISE EXCEPTION 'El pago inicial (%) no puede ser mayor al monto total de venta (%)',
        NEW.pago_inicial_cliente, NEW.monto_total_venta;
    END IF;
  ELSE
    -- Si es CONTADO, saldo es 0
    NEW.saldo_pendiente_cliente := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta antes de INSERT o UPDATE
CREATE TRIGGER trigger_calcular_saldo_pendiente
  BEFORE INSERT OR UPDATE ON vuelos
  FOR EACH ROW
  EXECUTE FUNCTION calcular_saldo_pendiente_cliente();

COMMENT ON FUNCTION calcular_saldo_pendiente_cliente() IS 
  'Calcula automáticamente el saldo pendiente del cliente basado en monto total y pago inicial';
```

- [ ] **Step 2: Commit trigger**

```bash
git add docs/05-base-de-datos/migraciones/2026-04-23-trigger-saldo-credito.sql
git commit -m "feat(db): agregar trigger para cálculo automático de saldo pendiente"
```

### Task 1.3: Ejecutar Migraciones en Base de Datos

- [ ] **Step 1: Conectar a base de datos local**

```bash
psql -U postgres -d newcrmnova
```

- [ ] **Step 2: Ejecutar migración de columnas**

```bash
\i docs/05-base-de-datos/migraciones/2026-04-23-credito-vuelos.sql
```

Expected: `ALTER TABLE`, `COMMENT`, `CREATE INDEX` (4 operaciones exitosas)

- [ ] **Step 3: Ejecutar migración de trigger**

```bash
\i docs/05-base-de-datos/migraciones/2026-04-23-trigger-saldo-credito.sql
```

Expected: `CREATE FUNCTION`, `CREATE TRIGGER`, `COMMENT` (3 operaciones exitosas)

- [ ] **Step 4: Verificar estructura**

```sql
\d vuelos
```

Expected: Ver las 4 columnas nuevas (monto_total_venta, pago_inicial_cliente, saldo_pendiente_cliente, costo_base_proveedor)

- [ ] **Step 5: Probar trigger con datos de prueba**

```sql
-- Insertar vuelo a crédito de prueba
INSERT INTO vuelos (
  created_by, pax_nombre, contacto_nombre, contacto_telefono,
  fecha_vuelo, ruta, proveedor, tipo_vuelo,
  forma_emision, monto_total_venta, pago_inicial_cliente, costo_base_proveedor
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'FAMILIA TEST', 'Juan Perez', '+58412000000',
  '2026-05-01', 'CCS-MAD', 'Sabre', 'solo_ida',
  'CREDITO', 600, 200, 500
) RETURNING id, saldo_pendiente_cliente;
```

Expected: `saldo_pendiente_cliente` debe ser 400 (600 - 200)

- [ ] **Step 6: Limpiar datos de prueba**

```sql
DELETE FROM vuelos WHERE pax_nombre = 'FAMILIA TEST';
```

---

## FASE 2: Backend - Validaciones y Lógica

### Task 2.1: Actualizar Validaciones en API Route

**Files:**
- Modify: `src/routes/vuelos.js:16-90`

- [ ] **Step 1: Agregar validaciones condicionales después de línea 45**

```javascript
// Validación condicional: si es CREDITO, validar campos adicionales
if (vuelo.forma_emision === 'CREDITO') {
  // Validar que existan los campos requeridos para crédito
  const camposCredito = ['monto_total_venta', 'pago_inicial_cliente', 'costo_base_proveedor'];
  const faltantesCredito = camposCredito.filter(campo => 
    vuelo[campo] === undefined || vuelo[campo] === null || vuelo[campo] === ''
  );
  
  if (faltantesCredito.length > 0) {
    return res.status(400).json({
      error: 'Para ventas a crédito, se requieren campos adicionales',
      campos_faltantes: faltantesCredito,
      detalle: 'Debes especificar: monto total de venta, pago inicial del cliente, y costo base del proveedor'
    });
  }
  
  // Validar coherencia de montos
  const montoTotal = parseFloat(vuelo.monto_total_venta);
  const pagoInicial = parseFloat(vuelo.pago_inicial_cliente);
  const costoBase = parseFloat(vuelo.costo_base_proveedor);
  
  if (pagoInicial > montoTotal) {
    return res.status(400).json({
      error: 'El pago inicial no puede ser mayor al monto total de la venta',
      pago_inicial: pagoInicial,
      monto_total: montoTotal
    });
  }
  
  if (costoBase > montoTotal) {
    return res.status(400).json({
      error: 'El costo base del proveedor no puede ser mayor al precio de venta al cliente',
      costo_base: costoBase,
      monto_total: montoTotal,
      sugerencia: 'Revisa si ingresaste correctamente los montos. El precio al cliente debe ser mayor o igual al costo base.'
    });
  }
  
  if (pagoInicial < 0 || montoTotal < 0 || costoBase < 0) {
    return res.status(400).json({
      error: 'Los montos no pueden ser negativos'
    });
  }
}
```

- [ ] **Step 2: Commit validaciones**

```bash
git add src/routes/vuelos.js
git commit -m "feat(api): agregar validaciones para ventas a crédito"
```

### Task 2.2: Actualizar Servicio de Vuelos

**Files:**
- Modify: `src/services/vuelosService.js:48-188`

- [ ] **Step 1: Agregar validación en método crearVuelo (después de línea 52)**

```javascript
// Validar datos de crédito si aplica
if (datosSanitizados.forma_emision === 'CREDITO') {
  this._validarDatosCreditoCompleto(datosSanitizados);
}
```

- [ ] **Step 2: Agregar método de validación al final de la clase (antes de línea 823)**

```javascript
/**
 * Validar datos completos para ventas a crédito
 * @private
 * @param {Object} vueloData - Datos del vuelo
 * @throws {Error} - Error si la validación falla
 */
_validarDatosCreditoCompleto(vueloData) {
  const { monto_total_venta, pago_inicial_cliente, costo_base_proveedor } = vueloData;
  
  // Verificar que existan todos los campos
  if (!monto_total_venta || monto_total_venta <= 0) {
    throw new Error('Para ventas a crédito, el monto total de venta es requerido y debe ser mayor a 0');
  }
  
  if (pago_inicial_cliente === undefined || pago_inicial_cliente === null || pago_inicial_cliente < 0) {
    throw new Error('Para ventas a crédito, el pago inicial del cliente es requerido (puede ser 0)');
  }
  
  if (!costo_base_proveedor || costo_base_proveedor <= 0) {
    throw new Error('Para ventas a crédito, el costo base del proveedor es requerido y debe ser mayor a 0');
  }
  
  // Validar coherencia
  if (parseFloat(pago_inicial_cliente) > parseFloat(monto_total_venta)) {
    throw new Error(`El pago inicial ($${pago_inicial_cliente}) no puede ser mayor al monto total ($${monto_total_venta})`);
  }
  
  if (parseFloat(costo_base_proveedor) > parseFloat(monto_total_venta)) {
    throw new Error(`El costo base ($${costo_base_proveedor}) no puede ser mayor al precio de venta ($${monto_total_venta})`);
  }
  
  console.log('[VuelosService] Validación de crédito exitosa:', {
    monto_total_venta,
    pago_inicial_cliente,
    saldo_calculado: parseFloat(monto_total_venta) - parseFloat(pago_inicial_cliente),
    costo_base_proveedor
  });
}
```

- [ ] **Step 3: Commit servicio actualizado**

```bash
git add src/services/vuelosService.js
git commit -m "feat(service): agregar validación de datos de crédito en servicio"
```

---

## FASE 3: Frontend - Formulario y UX

### Task 3.1: Actualizar Estado del Formulario

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx:88-124`

- [ ] **Step 1: Agregar campos al estado inicial (línea 88)**

```javascript
const [formData, setFormData] = useState({
  pax_nombre: '',
  contacto_nombre: '',
  contacto_telefono: '',
  fecha_vuelo: '',
  ruta: '',
  horario: '',
  hora_llegada: '',
  fecha_regreso: '',
  hora_salida_regreso: '',
  hora_llegada_regreso: '',
  aerolinea_nombre: '',
  aerolinea_codigo: '',
  localizador: '',
  proveedor: '',
  monto_venta: '',
  metodo_pago: '',
  tipo_vuelo: 'ida_vuelta',
  pnr_desglose: '',
  observaciones: '',
  // Escalas
  tiene_escala: false,
  escala_1_ciudad: '',
  escala_1_duracion: '',
  tiene_segunda_escala: false,
  escala_2_ciudad: '',
  escala_2_duracion: '',
  // Info Financiera
  moneda_precio: '',
  moneda_cotizacion: '',
  tasa_cambio: '',
  total_cotizacion: '',
  // Información de Emisión
  forma_emision: 'CONTADO',
  cuenta_emision_asignada: '',
  // NUEVOS CAMPOS PARA CRÉDITO
  monto_total_venta: '',
  pago_inicial_cliente: '0',
  costo_base_proveedor: '',
  ...initialData
})
```

- [ ] **Step 2: Commit actualización de estado**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat(frontend): agregar campos de crédito al estado del formulario"
```

### Task 3.2: Agregar Sección de Gestión de Crédito

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx:810-904`

- [ ] **Step 1: Agregar renderizado condicional después de línea 887 (después del cierre de grid de forma_emision)**

```jsx
{/* Sección de Gestión de Crédito - Solo cuando forma_emision es CREDITO */}
{formData.forma_emision === 'CREDITO' && (
  <div className="md:col-span-2 mt-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-center gap-2 mb-4">
      <DollarSign className="w-6 h-6 text-amber-600" />
      <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
        Gestión de Crédito
      </h4>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Costo Base al Proveedor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Costo Base (Proveedor) *
          <span className="block text-xs font-normal text-gray-500 mt-1">
            Lo que debes al proveedor
          </span>
        </label>
        <input
          type="number"
          name="costo_base_proveedor"
          value={formData.costo_base_proveedor}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
          placeholder="500.00"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-orange-700 ${
            errors.costo_base_proveedor ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.costo_base_proveedor && (
          <p className="mt-1 text-sm text-red-600">{errors.costo_base_proveedor}</p>
        )}
        <p className="mt-1 text-xs text-gray-600">
          💰 Precio del boleto en Sabre, Kiu, etc.
        </p>
      </div>

      {/* Monto Total de Venta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monto Total de Venta *
          <span className="block text-xs font-normal text-gray-500 mt-1">
            Precio al cliente (con markup)
          </span>
        </label>
        <input
          type="number"
          name="monto_total_venta"
          value={formData.monto_total_venta}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
          placeholder="600.00"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-emerald-700 ${
            errors.monto_total_venta ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.monto_total_venta && (
          <p className="mt-1 text-sm text-red-600">{errors.monto_total_venta}</p>
        )}
        <p className="mt-1 text-xs text-gray-600">
          💵 Precio total que pagará el cliente
        </p>
      </div>

      {/* Pago Inicial del Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pago Inicial del Cliente *
          <span className="block text-xs font-normal text-gray-500 mt-1">
            Inicial que dio el cliente
          </span>
        </label>
        <input
          type="number"
          name="pago_inicial_cliente"
          value={formData.pago_inicial_cliente}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
          placeholder="200.00"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-blue-700 ${
            errors.pago_inicial_cliente ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.pago_inicial_cliente && (
          <p className="mt-1 text-sm text-red-600">{errors.pago_inicial_cliente}</p>
        )}
        <p className="mt-1 text-xs text-gray-600">
          💳 Inicial pagada al momento de reservar
        </p>
      </div>
    </div>

    {/* Resumen Visual de Cálculos */}
    {formData.monto_total_venta && formData.pago_inicial_cliente >= 0 && formData.costo_base_proveedor && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border-2 border-amber-300 shadow-sm">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-600 font-medium mb-1">Saldo Pendiente Cliente</p>
          <p className="text-2xl font-bold text-red-700">
            ${(parseFloat(formData.monto_total_venta || 0) - 
               parseFloat(formData.pago_inicial_cliente || 0)).toFixed(2)}
          </p>
          <p className="text-xs text-red-500 mt-1">Cliente te debe</p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-600 font-medium mb-1">Deuda con Proveedor</p>
          <p className="text-2xl font-bold text-orange-700">
            ${parseFloat(formData.costo_base_proveedor || 0).toFixed(2)}
          </p>
          <p className="text-xs text-orange-500 mt-1">Tú debes al proveedor</p>
        </div>
        
        <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium mb-1">Ganancia Proyectada</p>
          <p className="text-2xl font-bold text-emerald-700">
            ${(parseFloat(formData.monto_total_venta || 0) - 
               parseFloat(formData.costo_base_proveedor || 0)).toFixed(2)}
          </p>
          <p className="text-xs text-emerald-500 mt-1">Tu margen</p>
        </div>
      </div>
    )}

    {/* Advertencia Informativa */}
    <div className="flex items-start gap-3 p-4 bg-amber-100 border border-amber-300 rounded-lg">
      <AlertCircle className="w-6 h-6 text-amber-700 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-amber-900">
        <p className="font-semibold mb-2">ℹ️ Importante sobre ventas a crédito:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Cliente te debe:</strong> ${(parseFloat(formData.monto_total_venta || 0) - parseFloat(formData.pago_inicial_cliente || 0)).toFixed(2)} (saldo pendiente)</li>
          <li><strong>Tú debes al proveedor:</strong> ${parseFloat(formData.costo_base_proveedor || 0).toFixed(2)}</li>
          <li><strong>Tu ganancia:</strong> ${(parseFloat(formData.monto_total_venta || 0) - parseFloat(formData.costo_base_proveedor || 0)).toFixed(2)}</li>
          <li>El saldo se calculará automáticamente y aparecerá en Gestión de Deudas</li>
        </ul>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit sección de crédito**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat(frontend): agregar sección de gestión de crédito al formulario"
```

### Task 3.3: Actualizar Validaciones del Formulario

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx:394-439`

- [ ] **Step 1: Agregar validaciones de crédito en función validateForm (después de línea 430)**

```javascript
// Validaciones específicas para ventas a CREDITO
if (formData.forma_emision === 'CREDITO') {
  if (!formData.costo_base_proveedor || parseFloat(formData.costo_base_proveedor) <= 0) {
    newErrors.costo_base_proveedor = 'Para ventas a crédito, el costo base del proveedor es requerido';
  }
  
  if (!formData.monto_total_venta || parseFloat(formData.monto_total_venta) <= 0) {
    newErrors.monto_total_venta = 'Para ventas a crédito, el monto total de venta es requerido';
  }
  
  if (formData.pago_inicial_cliente === '' || formData.pago_inicial_cliente === null || parseFloat(formData.pago_inicial_cliente) < 0) {
    newErrors.pago_inicial_cliente = 'El pago inicial es requerido (puede ser 0)';
  }
  
  // Validar coherencia de montos
  const montoTotal = parseFloat(formData.monto_total_venta || 0);
  const pagoInicial = parseFloat(formData.pago_inicial_cliente || 0);
  const costoBase = parseFloat(formData.costo_base_proveedor || 0);
  
  if (pagoInicial > montoTotal) {
    newErrors.pago_inicial_cliente = 'El pago inicial no puede ser mayor al monto total de venta';
  }
  
  if (costoBase > montoTotal) {
    newErrors.costo_base_proveedor = 'El costo base no puede ser mayor al precio de venta';
  }
  
  // Validar que haya ganancia positiva
  if (montoTotal < costoBase) {
    newErrors.monto_total_venta = 'El precio de venta debe ser mayor o igual al costo base';
  }
}
```

- [ ] **Step 2: Commit validaciones**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat(frontend): agregar validaciones de crédito en formulario"
```

### Task 3.4: Actualizar Envío de Datos

**Files:**
- Modify: `dashboard/src/components/vuelos/VueloFormNuevo.jsx:441-530`

- [ ] **Step 1: Incluir campos de crédito en submitData (línea 477)**

```javascript
const submitData = {
  vuelo: {
    ...formData,
    monto_venta: montoVentaCalculado,
    cotizacion_id: cotizacion?.id || null,
    // Validar horas para evitar strings vacíos
    horario: formData.horario && formData.horario.trim() !== '' ? formData.horario : null,
    hora_llegada: formData.hora_llegada && formData.hora_llegada.trim() !== '' ? formData.hora_llegada : null,
    // Campos de vuelo de regreso (solo si es ida_vuelta)
    fecha_regreso: formData.tipo_vuelo === 'ida_vuelta' ? formData.fecha_regreso : null,
    hora_salida_regreso: formData.tipo_vuelo === 'ida_vuelta' && formData.hora_salida_regreso?.trim() ? formData.hora_salida_regreso : null,
    hora_llegada_regreso: formData.tipo_vuelo === 'ida_vuelta' && formData.hora_llegada_regreso?.trim() ? formData.hora_llegada_regreso : null,
    // Escalas
    tiene_escala: formData.tiene_escala,
    escala_1_ciudad: formData.escala_1_ciudad || null,
    escala_1_duracion: formData.escala_1_duracion || null,
    tiene_segunda_escala: formData.tiene_segunda_escala,
    escala_2_ciudad: formData.escala_2_ciudad || null,
    escala_2_duracion: formData.escala_2_duracion || null,
    // Info Financiera
    moneda_precio: formData.moneda_precio || null,
    moneda_cotizacion: formData.moneda_cotizacion || null,
    tasa_cambio: formData.tasa_cambio ? parseFloat(formData.tasa_cambio) : null,
    total_cotizacion: subtotalCalculado,
    // Información de Emisión
    forma_emision: formData.forma_emision || 'CONTADO',
    cuenta_emision_asignada: formData.cuenta_emision_asignada || null,
    // CAMPOS DE CRÉDITO (solo si es CREDITO)
    monto_total_venta: formData.forma_emision === 'CREDITO' ? parseFloat(formData.monto_total_venta) : null,
    pago_inicial_cliente: formData.forma_emision === 'CREDITO' ? parseFloat(formData.pago_inicial_cliente) : null,
    costo_base_proveedor: formData.forma_emision === 'CREDITO' ? parseFloat(formData.costo_base_proveedor) : null
  },
  pasajeros: pasajeros.map(p => ({
    // ... resto del mapeo de pasajeros
  })),
  pasaportes: pasajeros.map(p => p.pasaporte_file).filter(Boolean),
  comprobantes: comprobantes
}
```

- [ ] **Step 2: Commit actualización de envío**

```bash
git add dashboard/src/components/vuelos/VueloFormNuevo.jsx
git commit -m "feat(frontend): incluir campos de crédito en envío de datos"
```

---

## FASE 4: Testing y Validación

### Task 4.1: Test Manual de Flujo Completo

- [ ] **Step 1: Levantar servidor de desarrollo**

```bash
cd dashboard
npm run dev
```

Expected: Servidor corriendo en http://localhost:3000

- [ ] **Step 2: Navegar a formulario de nuevo vuelo**

URL: http://localhost:3000/vuelos/nuevo

- [ ] **Step 3: Probar flujo CONTADO (sin campos adicionales)**

1. Seleccionar cuenta: "SERVIVUELO_1"
2. Verificar que forma_emision se marque automáticamente como "CONTADO"
3. Verificar que NO aparezca sección "Gestión de Crédito"
4. Llenar campos básicos y enviar

Expected: Vuelo creado sin campos de crédito

- [ ] **Step 4: Probar flujo CREDITO (con campos adicionales)**

1. Seleccionar cuenta: "SABRE"
2. Marcar "Crédito" en forma de emisión
3. Verificar que APAREZCA sección "Gestión de Crédito"
4. Ingresar:
   - Costo Base: 500
   - Monto Total Venta: 600
   - Pago Inicial: 200
5. Verificar cálculos automáticos:
   - Saldo Cliente: $400.00
   - Deuda Proveedor: $500.00
   - Ganancia: $100.00
6. Enviar formulario

Expected: Vuelo creado con todos los campos de crédito

- [ ] **Step 5: Verificar en base de datos**

```sql
SELECT 
  id, pax_nombre, forma_emision,
  monto_total_venta, pago_inicial_cliente,
  saldo_pendiente_cliente, costo_base_proveedor
FROM vuelos 
WHERE forma_emision = 'CREDITO'
ORDER BY created_at DESC 
LIMIT 5;
```

Expected: Ver datos correctos con saldo_pendiente_cliente calculado

### Task 4.2: Test de Validaciones

- [ ] **Step 1: Probar validación de pago inicial mayor a monto total**

1. Forma emisión: CREDITO
2. Monto Total: 600
3. Pago Inicial: 700
4. Intentar enviar

Expected: Error "El pago inicial no puede ser mayor al monto total de venta"

- [ ] **Step 2: Probar validación de costo base mayor a precio venta**

1. Forma emisión: CREDITO
2. Costo Base: 700
3. Monto Total: 600
4. Intentar enviar

Expected: Error "El costo base no puede ser mayor al precio de venta"

- [ ] **Step 3: Probar validación de campos faltantes**

1. Forma emisión: CREDITO
2. Dejar vacío "Costo Base"
3. Intentar enviar

Expected: Error "Para ventas a crédito, el costo base del proveedor es requerido"

### Task 4.3: Test de Trigger de Base de Datos

- [ ] **Step 1: Test de cálculo automático**

```sql
INSERT INTO vuelos (
  created_by, pax_nombre, contacto_nombre, contacto_telefono,
  fecha_vuelo, ruta, proveedor, tipo_vuelo,
  forma_emision, monto_total_venta, pago_inicial_cliente, costo_base_proveedor
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'TEST TRIGGER', 'Test', '+58412000000',
  '2026-05-15', 'CCS-BOG', 'Sabre', 'solo_ida',
  'CREDITO', 1000, 300, 850
) RETURNING id, saldo_pendiente_cliente;
```

Expected: saldo_pendiente_cliente = 700 (1000 - 300)

- [ ] **Step 2: Test de validación en trigger**

```sql
INSERT INTO vuelos (
  created_by, pax_nombre, contacto_nombre, contacto_telefono,
  fecha_vuelo, ruta, proveedor, tipo_vuelo,
  forma_emision, monto_total_venta, pago_inicial_cliente, costo_base_proveedor
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'TEST ERROR', 'Test', '+58412000000',
  '2026-05-15', 'CCS-BOG', 'Sabre', 'solo_ida',
  'CREDITO', 600, 800, 500
);
```

Expected: ERROR - "El pago inicial (800) no puede ser mayor al monto total de venta (600)"

- [ ] **Step 3: Limpiar datos de prueba**

```sql
DELETE FROM vuelos WHERE pax_nombre LIKE 'TEST%';
```

---

## FASE 5: Actualización de Módulos Relacionados

### Task 5.1: Actualizar Servicio de Emisiones

**Files:**
- Modify: `src/services/emisionesService.js`

- [ ] **Step 1: Localizar método autorizarEmision**

```bash
grep -n "autorizarEmision" src/services/emisionesService.js
```

- [ ] **Step 2: Actualizar creación de deuda para usar costo_base_proveedor**

Buscar la línea donde se crea la deuda en `deudas_proveedores` y cambiar de `monto_venta` a `costo_base_proveedor`:

```javascript
// ANTES:
const { data: deuda, error: deudaError } = await supabase
  .from('deudas_proveedores')
  .insert({
    vuelo_id: vueloId,
    proveedor: vuelo.proveedor,
    cuenta_emision: cuenta_emision_asignada,
    monto_deuda: vuelo.monto_venta,  // ❌ INCORRECTO
    moneda: vuelo.moneda_precio || 'USD',
    saldo_pendiente: vuelo.monto_venta,
    estado: 'PENDIENTE'
  })
  .select()
  .single();

// DESPUÉS:
const { data: deuda, error: deudaError } = await supabase
  .from('deudas_proveedores')
  .insert({
    vuelo_id: vueloId,
    proveedor: vuelo.proveedor,
    cuenta_emision: cuenta_emision_asignada,
    monto_deuda: vuelo.costo_base_proveedor || vuelo.monto_venta, // ✅ CORRECTO (con fallback)
    moneda: vuelo.moneda_precio || 'USD',
    saldo_pendiente: vuelo.costo_base_proveedor || vuelo.monto_venta,
    estado: 'PENDIENTE'
  })
  .select()
  .single();
```

- [ ] **Step 3: Commit actualización**

```bash
git add src/services/emisionesService.js
git commit -m "fix(emisiones): usar costo_base_proveedor para deudas con proveedores"
```

### Task 5.2: Documentar Cambios

**Files:**
- Create: `docs/CHANGELOG-CREDITO-VUELOS.md`

- [ ] **Step 1: Crear documento de changelog**

```markdown
# Changelog: Gestión de Crédito en Vuelos

**Fecha:** 2026-04-23  
**Versión:** 1.0.0

## Resumen

Implementación completa de gestión de ventas a crédito con pagos iniciales, diferenciando entre deuda del cliente y deuda con el proveedor.

## Cambios en Base de Datos

### Nuevas Columnas en Tabla `vuelos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `monto_total_venta` | numeric | Precio total que debe pagar el cliente (incluye markup) |
| `pago_inicial_cliente` | numeric | Monto inicial que pagó el cliente |
| `saldo_pendiente_cliente` | numeric | Saldo que debe el cliente (calculado automáticamente) |
| `costo_base_proveedor` | numeric | Costo base que la agencia debe al proveedor |

### Triggers Automáticos

- `trigger_calcular_saldo_pendiente`: Calcula automáticamente el saldo pendiente del cliente cuando `forma_emision = 'CREDITO'`

### Índices Nuevos

- `idx_vuelos_saldo_pendiente`: Optimiza consultas de deudas de clientes
- `idx_vuelos_forma_emision`: Optimiza filtros por forma de emisión

## Cambios en Backend

### Validaciones Nuevas (API)

- Validación condicional de campos según `forma_emision`
- Verificación de coherencia de montos (pago inicial ≤ monto total)
- Validación de que costo base ≤ precio de venta

### Servicio de Vuelos

- Nuevo método `_validarDatosCreditoCompleto()`
- Validaciones en `crearVuelo()` para datos de crédito

### Servicio de Emisiones

- Actualizado para usar `costo_base_proveedor` en lugar de `monto_venta` al crear deudas con proveedores

## Cambios en Frontend

### Formulario de Nuevo Vuelo

- 3 campos nuevos en estado del formulario
- Sección "Gestión de Crédito" con renderizado condicional
- Cálculos en vivo: saldo cliente, deuda proveedor, ganancia
- Validaciones cliente-side antes de enviar
- Feedback visual con colores semánticos

### UX Mejorado

- Advertencias visuales para ventas a crédito
- Resumen de montos en tiempo real
- Mensajes de error descriptivos

## Migraciones

1. `2026-04-23-credito-vuelos.sql`: Agregar columnas e índices
2. `2026-04-23-trigger-saldo-credito.sql`: Crear trigger de cálculo automático

## Casos de Uso

### Ejemplo 1: Venta a Crédito con Inicial

```
Boleto en Sabre: $500 USD
Precio al cliente: $600 USD
Pago inicial: $200 USD
────────────────────────────
Saldo cliente: $400 USD (calculado)
Deuda proveedor: $500 USD
Ganancia: $100 USD
```

### Ejemplo 2: Venta al Contado

```
Forma emisión: CONTADO
Campos de crédito: NULL
Saldo cliente: $0
```

## Breaking Changes

Ninguno. Los vuelos existentes sin campos de crédito siguen funcionando normalmente.

## Módulos Afectados

1. **Control de Emisiones**: Ahora usa `costo_base_proveedor` para deudas
2. **Gestión de Deudas**: Puede consultar `saldo_pendiente_cliente`
3. **Confirmación de Pago**: Tiene visibilidad de ambos montos

## Testing

- ✅ Test manual de flujo completo
- ✅ Validaciones de coherencia de montos
- ✅ Trigger de cálculo automático
- ✅ Integración con módulos existentes
```

- [ ] **Step 2: Commit documentación**

```bash
git add docs/CHANGELOG-CREDITO-VUELOS.md
git commit -m "docs: agregar changelog de gestión de crédito en vuelos"
```

---

## FASE 6: Deploy y Verificación Final

### Task 6.1: Ejecutar Migraciones en Producción

- [ ] **Step 1: Backup de base de datos**

```bash
pg_dump -U postgres -d newcrmnova > backup-pre-credito-$(date +%Y%m%d).sql
```

- [ ] **Step 2: Conectar a base de datos de producción**

```bash
psql -U postgres -d newcrmnova_prod
```

- [ ] **Step 3: Ejecutar migraciones**

```sql
\i docs/05-base-de-datos/migraciones/2026-04-23-credito-vuelos.sql
\i docs/05-base-de-datos/migraciones/2026-04-23-trigger-saldo-credito.sql
```

- [ ] **Step 4: Verificar estructura**

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vuelos'
  AND column_name IN ('monto_total_venta', 'pago_inicial_cliente', 'saldo_pendiente_cliente', 'costo_base_proveedor');
```

Expected: 4 columnas visibles

### Task 6.2: Deploy de Frontend y Backend

- [ ] **Step 1: Build de frontend**

```bash
cd dashboard
npm run build
```

Expected: Build exitoso sin errores

- [ ] **Step 2: Restart de backend**

```bash
pm2 restart newcrmnova-api
```

- [ ] **Step 3: Verificar logs**

```bash
pm2 logs newcrmnova-api --lines 50
```

Expected: Sin errores en startup

### Task 6.3: Smoke Test en Producción

- [ ] **Step 1: Crear vuelo a CONTADO**

- Verificar que el flujo normal funciona sin campos de crédito
- Expected: Vuelo creado exitosamente

- [ ] **Step 2: Crear vuelo a CREDITO**

- Llenar todos los campos de crédito
- Verificar cálculos en vivo
- Expected: Vuelo creado con saldo_pendiente_cliente calculado

- [ ] **Step 3: Verificar en Gestión de Deudas**

- Navegar a módulo de deudas
- Buscar el vuelo creado
- Expected: Ver saldo pendiente del cliente

---

## Checklist Final

Antes de marcar como completo, verificar:

- [ ] Base de datos tiene las 4 columnas nuevas
- [ ] Trigger funciona correctamente
- [ ] API valida campos de crédito
- [ ] Frontend muestra sección condicional
- [ ] Cálculos en vivo funcionan
- [ ] Validaciones bloquean datos incorrectos
- [ ] Módulo de emisiones usa costo_base_proveedor
- [ ] Documentación actualizada
- [ ] Tests manuales pasados
- [ ] Deploy en producción exitoso
- [ ] Smoke tests en prod pasados

---

## Plan completo y guardado

**Estructura de commits esperada:**

```
feat(db): agregar campos para gestión de crédito en vuelos
feat(db): agregar trigger para cálculo automático de saldo pendiente
feat(api): agregar validaciones para ventas a crédito
feat(service): agregar validación de datos de crédito en servicio
feat(frontend): agregar campos de crédito al estado del formulario
feat(frontend): agregar sección de gestión de crédito al formulario
feat(frontend): agregar validaciones de crédito en formulario
feat(frontend): incluir campos de crédito en envío de datos
fix(emisiones): usar costo_base_proveedor para deudas con proveedores
docs: agregar changelog de gestión de crédito en vuelos
```

**Tiempo estimado total:** 4-6 horas (incluyendo testing y validación)
