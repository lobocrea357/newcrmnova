# Diseño: Módulo de Control de Emisiones (Enfoque B)

**Fecha:** 21 de Abril, 2026  
**Versión:** 1.0  
**Estado:** Aprobado para Implementación

---

## 📋 Resumen Ejecutivo

### Objetivo
Implementar un módulo de "Control de Emisiones" que permite a administración gestionar la autorización de emisiones de boletos después de confirmar pagos y antes de que Johan proceda a emitir, reemplazando el flujo manual de WhatsApp.

### Problema Actual
- Coordinación manual vía WhatsApp entre Johan (emisiones) y Administración
- No hay registro de qué vuelos están autorizados para emitir
- No hay control de deudas con proveedores (emisiones a crédito)
- No hay visibilidad de saldos en cuentas de emisión
- Johan no sabe en tiempo real qué vuelos puede emitir

### Solución Propuesta
Sistema de 3 capas:
1. **Vista de Control de Emisiones** (Administración): Autorizar emisiones, gestionar cuentas
2. **Vista de Emisiones Mejorada** (Johan): Realtime de vuelos autorizados
3. **Sistema de Deudas con Proveedores**: Control de créditos y pagos

---

## 🎯 Casos de Uso

### Caso de Uso 1: Asesor Registra Vuelo con Forma de Emisión
**Actor:** Asesor  
**Flujo:**
1. Asesor crea vuelo nuevo en `/ventas/vuelos/nuevo`
2. Completa formulario con datos del vuelo
3. Selecciona **forma de emisión**: Contado o Crédito
4. Selecciona **cuenta de emisión**: Serv1, Serv2, Chase Nova, etc.
5. Si es Servivuelo → automáticamente se marca como "Contado"
6. Guarda vuelo con estado `PENDIENTE_CONFIRMACION_PAGO`

**Resultado:** Vuelo registrado con metadata de emisión

---

### Caso de Uso 2: Administración Autoriza Emisiones
**Actor:** Administración  
**Flujo:**
1. Admin accede a `/admin/control-emisiones`
2. Ve lista de vuelos con estado `PENDIENTE_EMISION` (pago confirmado)
3. Agrupa vuelos por cuenta de emisión (Serv1, Serv2, etc.)
4. Revisa saldo disponible en cada cuenta (manual)
5. Si no hay saldo → "Marca como recargado" después de meter dinero
6. Selecciona vuelos que tienen saldo disponible
7. Click en "Autorizar Emisión" (batch o individual)
8. Sistema:
   - Marca `autorizado_emision = true`
   - Registra `autorizado_por` y `fecha_autorizacion_emision`
   - Envía notificación a Johan vía Supabase Realtime
   - Si es a crédito → crea registro en `deudas_proveedores`

**Resultado:** Vuelos autorizados para que Johan los emita

---

### Caso de Uso 3: Johan Ve Vuelos Autorizados en Tiempo Real
**Actor:** Johan (Emisor)  
**Flujo:**
1. Johan accede a `/emisiones`
2. Ve lista de vuelos `PENDIENTE_EMISION` con indicador visual:
   - Badge verde: "Autorizado ✓" (puede emitir)
   - Badge amarillo: "Esperando autorización" (no puede emitir aún)
3. Cuando administración autoriza un vuelo:
   - Notificación push en campana
   - Vuelo se actualiza en tiempo real (Supabase Realtime)
   - Badge cambia a verde automáticamente
4. Johan hace click en "Ver & Emitir"
5. Revisa datos del vuelo, PNR, pasajeros
6. Click en "Marcar como Emitido"
7. Sistema cambia estado a `EMITIDO`

**Resultado:** Vuelo emitido con trazabilidad completa

---

### Caso de Uso 4: Gestión de Deudas con Proveedores
**Actor:** Administración  
**Flujo:**
1. Admin accede a `/admin/deudas-proveedores`
2. Ve lista de deudas agrupadas por proveedor:
   - Sabre: $5,000 (3 vuelos pendientes)
   - Amadeus: $2,500 (1 vuelo pendiente)
3. Click en una deuda para ver detalle
4. Ve lista de vuelos que generaron esa deuda
5. Admin realiza pago al proveedor (fuera del sistema)
6. Sube comprobante de pago
7. Ingresa monto pagado
8. Sistema:
   - Actualiza estado de la deuda
   - Registra en `pagos_deudas`
   - Calcula saldo pendiente

**Resultado:** Control completo de deudas con proveedores

---

## 🏗️ Arquitectura del Sistema

### Flujo de Estados de Vuelo

```
PENDIENTE_CONFIRMACION_PAGO
         ↓ (Admin confirma pago)
PENDIENTE_EMISION (autorizado_emision = false)
         ↓ (Admin autoriza emisión)
PENDIENTE_EMISION (autorizado_emision = true)
         ↓ (Johan emite)
EMITIDO
```

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                  MÓDULO DE CONTROL DE EMISIONES             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │   Formulario     │  │  Vista Control   │  │  Vista   │ │
│  │  Nuevo Vuelo     │  │   Emisiones      │  │ Emisiones│ │
│  │   (Asesor)       │  │ (Administración) │  │ (Johan)  │ │
│  └──────────────────┘  └──────────────────┘  └──────────┘ │
│          │                      │                   │       │
│          ▼                      ▼                   ▼       │
│  ┌────────────────────────────────────────────────────────┐│
│  │              Backend API (Express Routes)              ││
│  │  /api/vuelos POST, PATCH                               ││
│  │  /api/vuelos/:id/autorizar-emision                     ││
│  │  /api/deudas-proveedores GET, POST                     ││
│  │  /api/pagos-deudas POST                                ││
│  └────────────────────────────────────────────────────────┘│
│          │                                                  │
│          ▼                                                  │
│  ┌────────────────────────────────────────────────────────┐│
│  │              Supabase Database                         ││
│  │  • vuelos (con nuevos campos)                          ││
│  │  • deudas_proveedores                                  ││
│  │  • pagos_deudas                                        ││
│  │  • notificaciones                                      ││
│  └────────────────────────────────────────────────────────┘│
│          │                                                  │
│          ▼                                                  │
│  ┌────────────────────────────────────────────────────────┐│
│  │           Supabase Realtime                            ││
│  │  • Channel: emisiones-autorizadas                      ││
│  │  • Channel: notificaciones-{user_id}                   ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Diseño de Base de Datos

### Modificaciones a Tabla `vuelos`

**Nuevas columnas:**

```sql
-- Forma de emisión y cuenta
ALTER TABLE public.vuelos
ADD COLUMN forma_emision VARCHAR(10) CHECK (forma_emision IN ('CONTADO', 'CREDITO')),
ADD COLUMN cuenta_emision_original VARCHAR(50),  -- Donde se hizo la reserva
ADD COLUMN cuenta_emision_asignada VARCHAR(50),  -- Donde se va a emitir

-- Control de autorización
ADD COLUMN autorizado_emision BOOLEAN DEFAULT false,
ADD COLUMN autorizado_por UUID REFERENCES public.profiles(id),
ADD COLUMN fecha_autorizacion_emision TIMESTAMP WITH TIME ZONE,
ADD COLUMN observaciones_emision TEXT;

-- Índices para performance
CREATE INDEX idx_vuelos_autorizado_emision ON public.vuelos(autorizado_emision);
CREATE INDEX idx_vuelos_forma_emision ON public.vuelos(forma_emision);
CREATE INDEX idx_vuelos_cuenta_asignada ON public.vuelos(cuenta_emision_asignada);
```

**Valores de `cuenta_emision_original` y `cuenta_emision_asignada`:**
- `SERVIVUELO_1`
- `SERVIVUELO_2`
- `CHASE_NOVA`
- `CHASE_APOLO`
- `SABRE`
- `AMADEUS`
- `EXPEDIA`

---

### Nueva Tabla: `deudas_proveedores`

```sql
CREATE TABLE public.deudas_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuelo_id UUID NOT NULL REFERENCES public.vuelos(id) ON DELETE CASCADE,
  proveedor VARCHAR(50) NOT NULL,  -- SABRE, AMADEUS, etc.
  cuenta_emision VARCHAR(50) NOT NULL,  -- Cuenta específica usada
  monto_deuda NUMERIC(10, 2) NOT NULL CHECK (monto_deuda >= 0),
  moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' 
    CHECK (estado IN ('PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO_TOTAL')),
  saldo_pendiente NUMERIC(10, 2) NOT NULL CHECK (saldo_pendiente >= 0),
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_deudas_estado ON public.deudas_proveedores(estado);
CREATE INDEX idx_deudas_proveedor ON public.deudas_proveedores(proveedor);
CREATE INDEX idx_deudas_vuelo ON public.deudas_proveedores(vuelo_id);
```

**Estados de deuda:**
- `PENDIENTE`: Deuda activa sin pagos
- `PAGADO_PARCIAL`: Se ha pagado parte de la deuda
- `PAGADO_TOTAL`: Deuda completamente saldada

---

### Nueva Tabla: `pagos_deudas`

```sql
CREATE TABLE public.pagos_deudas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deuda_id UUID NOT NULL REFERENCES public.deudas_proveedores(id) ON DELETE CASCADE,
  monto_pagado NUMERIC(10, 2) NOT NULL CHECK (monto_pagado > 0),
  moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
  metodo_pago VARCHAR(50),  -- Transferencia, Cheque, etc.
  referencia_pago VARCHAR(100),  -- Número de referencia
  comprobante_url TEXT,  -- URL en Supabase Storage
  fecha_pago DATE NOT NULL,
  registrado_por UUID NOT NULL REFERENCES public.profiles(id),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pagos_deuda ON public.pagos_deudas(deuda_id);
CREATE INDEX idx_pagos_fecha ON public.pagos_deudas(fecha_pago);
```

---

## 🎨 Diseño de Interfaces

### Componente 1: Campo "Forma de Emisión" en Formulario de Vuelo

**Ubicación:** `VueloFormNuevo.jsx`

**Diseño:**

```jsx
{/* Sección: Información de Emisión */}
<div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
  <h3 className="text-lg font-bold text-gray-900 mb-4">
    Información de Emisión
  </h3>
  
  {/* Forma de Emisión */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Forma de Emisión *
    </label>
    <div className="flex gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="forma_emision"
          value="CONTADO"
          checked={formData.forma_emision === 'CONTADO'}
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600"
        />
        <span className="text-sm text-gray-900">Contado</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="forma_emision"
          value="CREDITO"
          checked={formData.forma_emision === 'CREDITO'}
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600"
        />
        <span className="text-sm text-gray-900">Crédito</span>
      </label>
    </div>
  </div>

  {/* Cuenta de Emisión */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Cuenta de Emisión *
    </label>
    <select
      name="cuenta_emision_asignada"
      value={formData.cuenta_emision_asignada}
      onChange={handleCuentaChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
    >
      <option value="">Seleccionar cuenta...</option>
      <option value="SERVIVUELO_1">Servivuelo 1 (Contado)</option>
      <option value="SERVIVUELO_2">Servivuelo 2 (Contado)</option>
      <option value="CHASE_NOVA">Chase Bank Nova (Contado)</option>
      <option value="CHASE_APOLO">Chase Bank Apolo (Contado)</option>
      <option value="SABRE">Sabre (Crédito/Contado)</option>
      <option value="AMADEUS">Amadeus (Crédito/Contado)</option>
      <option value="EXPEDIA">Expedia (Crédito/Contado)</option>
    </select>
    
    {/* Nota automática para Servivuelo */}
    {formData.cuenta_emision_asignada?.includes('SERVIVUELO') && (
      <p className="mt-2 text-sm text-indigo-600">
        ℹ️ Servivuelo siempre es al contado
      </p>
    )}
  </div>
</div>
```

**Lógica de Validación:**
```javascript
const handleCuentaChange = (e) => {
  const cuenta = e.target.value
  
  // Auto-marcar como contado si es Servivuelo
  if (cuenta.includes('SERVIVUELO') || cuenta.includes('CHASE')) {
    setFormData(prev => ({
      ...prev,
      cuenta_emision_asignada: cuenta,
      forma_emision: 'CONTADO'
    }))
  } else {
    setFormData(prev => ({
      ...prev,
      cuenta_emision_asignada: cuenta
    }))
  }
}
```

---

### Componente 2: Vista de Control de Emisiones (Administración)

**Ruta:** `/admin/control-emisiones`  
**Archivo:** `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx`

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│  Control de Emisiones                                      │
│  Vuelos pendientes de autorización para emisión           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🔍 Filtros: [Todo ▼] [Serv1 ▼] [Contado ▼]              │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📦 Servivuelo 1 (5 vuelos)                           │ │
│  │ Total a emitir: $3,580 USD                           │ │
│  │ ──────────────────────────────────────────────────── │ │
│  │                                                       │ │
│  │ ☐ LIM-MIA | 718 USD | LOC: 858K9A | Pérez, Juan     │ │
│  │ ☐ BOG-MAD | 530 USD | LOC: 85D2HY | López, Ana      │ │
│  │ ☐ CCS-MIA | 384 USD | LOC: 82JT90 | García, Pedro   │ │
│  │ ...                                                   │ │
│  │                                                       │ │
│  │ [✓ Autorizar Seleccionados (3)]                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📦 Chase Nova (2 vuelos)                             │ │
│  │ Total a emitir: $2,840 USD                           │ │
│  │ ──────────────────────────────────────────────────── │ │
│  │ ...                                                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 💳 Sabre - A Crédito (1 vuelo)                       │ │
│  │ Total a emitir: $1,320 USD                           │ │
│  │ ⚠️ Generará deuda con proveedor                      │ │
│  │ ──────────────────────────────────────────────────── │ │
│  │ ...                                                   │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Características:**
- Agrupación automática por cuenta de emisión
- Totales por cuenta
- Selección múltiple (checkboxes)
- Badge visual para diferenciar contado vs crédito
- Advertencia cuando genera deuda

---

### Componente 3: Vista de Emisiones Mejorada (Johan)

**Ruta:** `/emisiones`  
**Archivo:** `dashboard/src/app/(crm)/emisiones/page.jsx`

**Modificaciones:**

```jsx
{/* Badge de estado de autorización */}
<td className="px-6 py-4">
  {vuelo.autorizado_emision ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
      <CheckCircle className="w-3 h-3" />
      Autorizado para Emitir
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
      <Clock className="w-3 h-3" />
      Esperando Autorización
    </span>
  )}
</td>

{/* Botón "Ver & Emitir" habilitado/deshabilitado */}
<button
  onClick={() => verDetalles(vuelo)}
  disabled={!vuelo.autorizado_emision}
  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
    vuelo.autorizado_emision
      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  <Eye className="w-4 h-4" />
  Ver & Emitir
</button>
```

**Supabase Realtime:**
```javascript
useEffect(() => {
  cargarVuelosPendientes()

  // Suscripción a cambios en vuelos pendientes de emisión
  const channel = supabase
    .channel('emisiones-autorizadas')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vuelos',
        filter: 'estado=eq.PENDIENTE_EMISION'
      },
      (payload) => {
        const vueloActualizado = payload.new
        
        // Actualizar en lista
        setVuelos(prev => prev.map(v =>
          v.id === vueloActualizado.id ? vueloActualizado : v
        ))
        
        // Si fue autorizado, mostrar notificación
        if (vueloActualizado.autorizado_emision) {
          toastSuccess(`✅ Vuelo ${vueloActualizado.ruta} autorizado para emisión`)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

---

### Componente 4: Vista de Deudas con Proveedores

**Ruta:** `/admin/deudas-proveedores`  
**Archivo:** `dashboard/src/app/(crm)/admin/deudas-proveedores/page.jsx`

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│  Deudas con Proveedores                                    │
│  Control de créditos y pagos a proveedores                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📊 Resumen                                                │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Total Adeudado│ Pagado Parcial│ Vencidas    │          │
│  │  $7,820      │    $2,500    │    $1,200    │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🏢 SABRE                                             │ │
│  │ Deuda total: $5,000 | Pendiente: $3,000             │ │
│  │ ──────────────────────────────────────────────────── │ │
│  │                                                       │ │
│  │ Vuelo LIM-MAD | $1,320 | Vence: 15/05/2026          │ │
│  │ Vuelo BOG-MIA | $2,500 | Vence: 20/05/2026          │ │
│  │ Vuelo CCS-MEX | $1,180 | Pagado Parcial ($500)      │ │
│  │                                                       │ │
│  │ [📎 Registrar Pago]                                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🏢 AMADEUS                                           │ │
│  │ Deuda total: $2,820 | Pendiente: $2,820             │ │
│  │ ...                                                   │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 🔌 Diseño de API

### Endpoint 1: Autorizar Emisión de Vuelo

**Método:** `PATCH`  
**Ruta:** `/api/vuelos/:id/autorizar-emision`  
**Autenticación:** Requerida  
**Roles permitidos:** `administracion`, `admin`, `super_admin`

**Request Body:**
```json
{
  "userId": "uuid-del-admin",
  "cuenta_emision_asignada": "SERVIVUELO_1",
  "observaciones_emision": "Cuenta recargada con $5,000"
}
```

**Response (200):**
```json
{
  "message": "Vuelo autorizado para emisión",
  "vuelo": {
    "id": "uuid",
    "autorizado_emision": true,
    "autorizado_por": "uuid-admin",
    "fecha_autorizacion_emision": "2026-04-21T10:30:00Z",
    "cuenta_emision_asignada": "SERVIVUELO_1"
  },
  "deuda_creada": {
    "id": "uuid-deuda",
    "proveedor": "SABRE",
    "monto_deuda": 1320.00
  }
}
```

**Lógica del Endpoint:**
1. Validar rol del usuario
2. Obtener vuelo de BD
3. Verificar que estado sea `PENDIENTE_EMISION`
4. Actualizar campos de autorización
5. Si `forma_emision === 'CREDITO'` → Crear registro en `deudas_proveedores`
6. Enviar notificación a Johan (user con rol `emisor`)
7. Retornar vuelo actualizado

---

### Endpoint 2: Autorizar Múltiples Vuelos (Batch)

**Método:** `POST`  
**Ruta:** `/api/vuelos/autorizar-emision-batch`  
**Autenticación:** Requerida  
**Roles permitidos:** `administracion`, `admin`, `super_admin`

**Request Body:**
```json
{
  "userId": "uuid-del-admin",
  "vuelo_ids": ["uuid1", "uuid2", "uuid3"],
  "cuenta_emision_asignada": "SERVIVUELO_1",
  "observaciones_emision": "Lote autorizado después de recarga"
}
```

**Response (200):**
```json
{
  "message": "3 vuelos autorizados para emisión",
  "vuelos_autorizados": 3,
  "deudas_creadas": 0,
  "vuelos": [...]
}
```

---

### Endpoint 3: Crear Pago de Deuda

**Método:** `POST`  
**Ruta:** `/api/pagos-deudas`  
**Autenticación:** Requerida  
**Roles permitidos:** `administracion`, `admin`, `super_admin`

**Request Body:**
```json
{
  "deuda_id": "uuid-deuda",
  "monto_pagado": 1500.00,
  "moneda": "USD",
  "metodo_pago": "Transferencia Bancaria",
  "referencia_pago": "TRX-123456",
  "comprobante_url": "https://storage.supabase.co/...",
  "fecha_pago": "2026-04-21",
  "observaciones": "Pago parcial de deuda con Sabre"
}
```

**Response (201):**
```json
{
  "message": "Pago registrado exitosamente",
  "pago": {...},
  "deuda_actualizada": {
    "id": "uuid",
    "monto_deuda": 5000.00,
    "saldo_pendiente": 3500.00,
    "estado": "PAGADO_PARCIAL"
  }
}
```

**Lógica del Endpoint:**
1. Validar rol del usuario
2. Obtener deuda de BD
3. Crear registro en `pagos_deudas`
4. Actualizar `saldo_pendiente` de la deuda
5. Actualizar estado (`PAGADO_PARCIAL` o `PAGADO_TOTAL`)
6. Retornar pago y deuda actualizada

---

### Endpoint 4: Listar Deudas con Proveedores

**Método:** `GET`  
**Ruta:** `/api/deudas-proveedores`  
**Autenticación:** Requerida  
**Roles permitidos:** `administracion`, `admin`, `super_admin`

**Query Parameters:**
- `proveedor`: Filtrar por proveedor (opcional)
- `estado`: Filtrar por estado (opcional)
- `grupo_por`: Agrupar por `proveedor` o `cuenta` (opcional)

**Response (200):**
```json
{
  "deudas": [
    {
      "id": "uuid",
      "proveedor": "SABRE",
      "monto_deuda": 5000.00,
      "saldo_pendiente": 3500.00,
      "estado": "PAGADO_PARCIAL",
      "vuelo": {...},
      "pagos": [...]
    }
  ],
  "resumen": {
    "total_adeudado": 7820.00,
    "total_pagado": 2500.00,
    "total_pendiente": 5320.00
  }
}
```

---

## 🔔 Sistema de Notificaciones

### Nuevos Tipos de Notificación

#### Tipo 1: `emision_autorizada`

**Cuándo:** Admin autoriza un vuelo para emisión  
**Receptor:** Johan (usuario con rol `emisor`)

**Payload:**
```json
{
  "user_id": "uuid-johan",
  "tipo": "emision_autorizada",
  "titulo": "✅ Vuelo autorizado para emisión",
  "descripcion": "Ana Martínez autorizó el vuelo LIM-MIA. Puedes proceder a emitir.",
  "datos": {
    "vuelo_id": "uuid",
    "admin_nombre": "Ana Martínez",
    "ruta": "LIM-MIA",
    "cuenta_emision": "SERVIVUELO_1",
    "precio_base": 718.00,
    "localizador": "858K9A",
    "accion_requerida": "Proceder con emisión del vuelo"
  }
}
```

---

#### Tipo 2: `recordatorio_autorizacion`

**Cuándo:** Johan solicita a admin autorizar un vuelo específico  
**Receptor:** Administración (usuarios con rol `administracion`)

**Payload:**
```json
{
  "user_id": "uuid-admin",
  "tipo": "recordatorio_autorizacion",
  "titulo": "📌 Solicitud de autorización de emisión",
  "descripcion": "Johan Viajes solicita autorización para emitir el vuelo LIM-MIA. Favor revisar saldo en Servivuelo 1.",
  "datos": {
    "vuelo_id": "uuid",
    "solicitante_nombre": "Johan Viajes",
    "ruta": "LIM-MIA",
    "cuenta_emision": "SERVIVUELO_1",
    "precio_base": 718.00,
    "localizador": "858K9A",
    "accion_requerida": "Revisar saldo y autorizar emisión"
  }
}
```

---

#### Tipo 3: `deuda_generada`

**Cuándo:** Se crea una nueva deuda con proveedor (emisión a crédito)  
**Receptor:** Administración (usuarios con rol `administracion`)

**Payload:**
```json
{
  "user_id": "uuid-admin",
  "tipo": "deuda_generada",
  "titulo": "💳 Nueva deuda generada con proveedor",
  "descripcion": "Se generó una deuda de $1,320 USD con Sabre por el vuelo LIM-MAD.",
  "datos": {
    "deuda_id": "uuid",
    "proveedor": "SABRE",
    "monto_deuda": 1320.00,
    "vuelo_id": "uuid",
    "ruta": "LIM-MAD",
    "fecha_vencimiento": "2026-05-15",
    "accion_requerida": "Planificar pago antes del vencimiento"
  }
}
```

---

## 🔒 Control de Acceso

### Roles y Permisos

| Vista / Acción | asesor | gerente | administracion | admin | super_admin |
|----------------|--------|---------|----------------|-------|-------------|
| Crear vuelo con forma de emisión | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver control de emisiones | ❌ | ❌ | ✅ | ✅ | ✅ |
| Autorizar emisión | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver deudas proveedores | ❌ | ❌ | ✅ | ✅ | ✅ |
| Registrar pago de deuda | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver página de emisiones | ❌ | ❌ | ✅ | ✅ | ✅ |
| Marcar como emitido | ❌ | ❌ | ✅ | ✅ | ✅ |

**Nota:** El rol específico `emisor` (Johan) tiene permisos especiales para la página de emisiones.

### Validaciones de Seguridad

**Frontend:**
- Rutas protegidas con `useRouteGuard`
- Componentes protegidos con validación de rol
- Botones deshabilitados según permisos

**Backend:**
- Validación de rol en TODOS los endpoints
- Validación de estado antes de autorizar
- Validación de ownership para editar

---

## 📊 Métricas y KPIs

### Métricas del Módulo

1. **Tiempo de autorización**: Tiempo promedio desde pago confirmado hasta autorización
2. **Vuelos autorizados por día**: Cantidad de vuelos autorizados diariamente
3. **Deudas activas**: Total de deudas pendientes con proveedores
4. **Tasa de pago de deudas**: Porcentaje de deudas pagadas a tiempo
5. **Distribución por cuenta**: Cantidad de vuelos emitidos por cada cuenta

### Dashboard Propuesto (Futuro)

```
┌────────────────────────────────────────────────────────────┐
│  Dashboard de Emisiones                                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📈 Esta Semana                                            │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Autorizados  │ Emitidos     │ Pendientes   │          │
│  │     45       │     38       │      7       │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                            │
│  💰 Deudas con Proveedores                                 │
│  Sabre: $5,000 | Amadeus: $2,820                          │
│                                                            │
│  📊 Por Cuenta                                             │
│  Serv1: 15 | Serv2: 12 | Chase Nova: 8 | Sabre: 10       │
└────────────────────────────────────────────────────────────┘
```

---

## 🧪 Plan de Testing

### Tests Unitarios (Backend)

1. **Autorización de emisión:**
   - Autorizar vuelo válido
   - Rechazar vuelo no encontrado
   - Rechazar vuelo sin pago confirmado
   - Crear deuda si es a crédito
   - No crear deuda si es contado

2. **Pago de deudas:**
   - Registrar pago parcial
   - Registrar pago total
   - Actualizar estado correctamente
   - Calcular saldo pendiente

3. **Validación de permisos:**
   - Rechazar asesor sin permisos
   - Aceptar administración
   - Aceptar admin y super_admin

### Tests de Integración

1. **Flujo completo:**
   - Crear vuelo → Confirmar pago → Autorizar emisión → Emitir
   - Verificar notificaciones en cada paso
   - Verificar cambios de estado

2. **Supabase Realtime:**
   - Suscripción activa
   - Actualización en tiempo real
   - Cleanup al desmontar

### Tests E2E (Playwright)

1. **Flujo de administración:**
   - Login como admin
   - Navegar a control de emisiones
   - Seleccionar vuelos
   - Autorizar batch
   - Verificar notificación en campana

2. **Flujo de Johan:**
   - Login como emisor
   - Ver vuelos autorizados
   - Emitir vuelo
   - Verificar cambio de estado

---

## 🚀 Roadmap de Implementación

### Fase 1: Base de Datos y Backend Core (2 días)
- Migraciones de BD
- Endpoints básicos
- Validación de permisos

### Fase 2: Frontend - Formulario de Vuelo (1 día)
- Campo forma de emisión
- Selector de cuenta
- Validaciones

### Fase 3: Control de Emisiones (Administración) (1.5 días)
- Vista principal
- Agrupación por cuenta
- Autorización individual y batch

### Fase 4: Vista de Emisiones Mejorada (Johan) (1 día)
- Indicadores de autorización
- Supabase Realtime
- Notificaciones

### Fase 5: Deudas con Proveedores (1.5 días)
- Vista de deudas
- Registro de pagos
- Upload de comprobantes

### Fase 6: Testing y Refinamiento (1 día)
- Tests unitarios
- Tests E2E
- Corrección de bugs

**Total estimado:** 8 días de desarrollo

---

## 📝 Notas de Implementación

### Consideraciones Técnicas

1. **Supabase Realtime:**
   - Habilitar Realtime en tabla `vuelos`
   - Canal único por usuario para notificaciones
   - Cleanup adecuado para evitar memory leaks

2. **Upload de Comprobantes:**
   - Usar Supabase Storage
   - Bucket: `comprobantes-deudas`
   - Validar tipo de archivo (PDF, PNG, JPG)
   - Max size: 5MB

3. **Performance:**
   - Índices en columnas de búsqueda frecuente
   - Paginación en lista de deudas
   - Cache de totales (Redis en futuro)

4. **Auditoría:**
   - Todos los campos `autorizado_por`, `registrado_por`
   - Timestamps en todas las tablas
   - Logs de cambios de estado

### Dependencias de Terceros

- **Supabase:** v2.x
- **Lucide React:** Para iconos
- **SweetAlert2:** Para confirmaciones
- **React Hook Form:** Para formularios (opcional)

---

## 🔄 Plan de Migración de Datos

### Paso 1: Backup
```sql
-- Backup de tabla vuelos
CREATE TABLE vuelos_backup AS SELECT * FROM vuelos;
```

### Paso 2: Agregar Columnas
```sql
-- Ejecutar migraciones de columnas nuevas
ALTER TABLE vuelos ADD COLUMN forma_emision...
```

### Paso 3: Poblar Datos Iniciales
```sql
-- Marcar vuelos de Servivuelo como contado
UPDATE vuelos 
SET forma_emision = 'CONTADO'
WHERE proveedor ILIKE '%servivuelo%';

-- Resto como NULL (se completará al editar)
```

### Paso 4: Validación
```sql
-- Verificar que no hay datos corruptos
SELECT COUNT(*) FROM vuelos WHERE forma_emision IS NULL;
```

---

## 📚 Referencias

- **Skill Notification Implementation:** `.agents/skills/notification-implementation`
- **Skill Supabase Realtime:** `.agents/skills/supabase-realtime-implementation`
- **Skill View Access Auditor:** `.agents/skills/view-access-auditor`
- **Documentación Supabase:** https://supabase.com/docs
- **Auditoría Módulo Ventas:** `docs/AUDITORIA_MODULO_VENTAS.md`

---

**Fin del Documento de Diseño**
