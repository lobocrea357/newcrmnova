# Sistema de Control de Emisiones - Documentación Técnica

## 📋 Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Esquema de Base de Datos](#esquema-de-base-de-datos)
3. [Endpoints de API](#endpoints-de-api)
4. [Componentes de Frontend](#componentes-de-frontend)
5. [Supabase Realtime](#supabase-realtime)
6. [Flujo de Datos](#flujo-de-datos)
7. [Seguridad](#seguridad)
8. [Testing](#testing)

---

## Arquitectura del Sistema

### Stack Tecnológico
- **Backend**: Node.js con Express.js
- **Frontend**: Next.js 14 con React
- **Base de Datos**: PostgreSQL vía Supabase
- **Realtime**: Supabase Realtime para sincronización en vivo
- **UI**: TailwindCSS + Lucide Icons
- **Autenticación**: Supabase Auth

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  VueloFormNuevo.jsx  │  ControlEmisiones.jsx  │  Deudas.jsx│
│         ↓                    ↓                    ↓      │
│  VuelosList.jsx      │  (Realtime Update)   │  Pagos Modal│
└────────────┬──────────────────────────────────────────────┘
             │ REST API
             ↓
┌─────────────────────────────────────────────────────────┐
│              Backend (Express.js)                        │
├─────────────────────────────────────────────────────────┤
│  routes/vuelos.js    │  routes/deudas.js                │
│  vuelosService.js    │  deudasService.js                │
└────────────┬──────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│           Base de Datos (Supabase/PostgreSQL)            │
├─────────────────────────────────────────────────────────┤
│  Tabla: vuelos         │  Tabla: deudas_proveedores      │
│  Tabla: vuelos_pasajeros│  Tabla: pagos_deudas           │
│  Tabla: pagos_vuelos   │                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Esquema de Base de Datos

### Tabla: `vuelos`

Campos agregados para control de emisiones:

```sql
-- Campos de control de emisiones
ALTER TABLE vuelos ADD COLUMN forma_emision VARCHAR(20) DEFAULT 'CONTADO';
ALTER TABLE vuelos ADD COLUMN cuenta_emision_asignada VARCHAR(50);
ALTER TABLE vuelos ADD COLUMN autorizado_emision BOOLEAN DEFAULT false;
ALTER TABLE vuelos ADD COLUMN autorizado_emision_por UUID REFERENCES auth.users(id);
ALTER TABLE vuelos ADD COLUMN autorizado_emision_en TIMESTAMP WITH TIME ZONE;
ALTER TABLE vuelos ADD COLUMN observaciones_emision TEXT;

-- Índices para performance
CREATE INDEX idx_vuelos_autorizado_emision ON vuelos(autorizado_emision);
CREATE INDEX idx_vuelos_cuenta_emision ON vuelos(cuenta_emision_asignada);
CREATE INDEX idx_vuelos_estado_autorizado ON vuelos(estado, autorizado_emision);
```

**Restricciones:**
- `forma_emision`: Solo permite 'CONTADO' o 'CREDITO'
- `autorizado_emision`: Default false
- `autorizado_emision_por`: Referencia a usuario que autorizó

### Tabla: `deudas_proveedores`

```sql
CREATE TABLE deudas_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuelo_id UUID REFERENCES vuelos(id) ON DELETE CASCADE,
  proveedor VARCHAR(100) NOT NULL,
  monto_deuda DECIMAL(10,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'USD',
  saldo_pendiente DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_estado_deuda CHECK (estado IN ('PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO_TOTAL'))
);

-- Índices
CREATE INDEX idx_deudas_proveedor ON deudas_proveedores(proveedor);
CREATE INDEX idx_deudas_estado ON deudas_proveedores(estado);
CREATE INDEX idx_deudas_vuelo ON deudas_proveedores(vuelo_id);
```

### Tabla: `pagos_deudas`

```sql
CREATE TABLE pagos_deudas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deuda_id UUID REFERENCES deudas_proveedores(id) ON DELETE CASCADE,
  monto_pagado DECIMAL(10,2) NOT NULL,
  metodo_pago VARCHAR(100),
  referencia_pago VARCHAR(200),
  fecha_pago DATE NOT NULL,
  registrado_por UUID REFERENCES auth.users(id),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_monto_positivo CHECK (monto_pagado > 0)
);

-- Índices
CREATE INDEX idx_pagos_deuda ON pagos_deudas(deuda_id);
CREATE INDEX idx_pagos_fecha ON pagos_deudas(fecha_pago);
```

---

## Endpoints de API

### Vuelos

#### Autorizar Emisión Individual
```
PATCH /api/vuelos/:id/autorizar-emision
```

**Body:**
```json
{
  "autorizado_emision": true,
  "autorizado_emision_por": "user_id",
  "observaciones_emision": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "vuelo_id",
    "autorizado_emision": true,
    "autorizado_emision_en": "2026-04-22T10:00:00Z"
  }
}
```

#### Autorizar Emisión Batch
```
POST /api/vuelos/autorizar-emision-batch
```

**Body:**
```json
{
  "userId": "user_id",
  "vuelo_ids": ["id1", "id2", "id3"],
  "cuenta_emision_asignada": "SERVIVUELO_1",
  "observaciones_emision": "Autorizado en batch"
}
```

**Response:**
```json
{
  "success": true,
  "vuelos_autorizados": 3,
  "deudas_creadas": 1
}
```

### Deudas

#### Listar Deudas
```
GET /api/deudas-proveedores?proveedor=Sabre&estado=PENDIENTE
```

**Response:**
```json
{
  "deudas": [
    {
      "id": "deuda_id",
      "vuelo_id": "vuelo_id",
      "proveedor": "Sabre",
      "monto_deuda": 1500.00,
      "saldo_pendiente": 1500.00,
      "estado": "PENDIENTE",
      "vuelo": {
        "ruta": "BOG-MIA",
        "pax_nombre": "Juan Pérez",
        "localizador": "ABC123"
      }
    }
  ]
}
```

#### Registrar Pago
```
POST /api/deudas-proveedores/pagos
```

**Body:**
```json
{
  "deuda_id": "deuda_id",
  "monto_pagado": 500.00,
  "metodo_pago": "Transferencia",
  "referencia_pago": "REF123456",
  "fecha_pago": "2026-04-22",
  "registrado_por": "user_id",
  "observaciones": "Pago parcial"
}
```

**Response:**
```json
{
  "success": true,
  "pago_id": "pago_id",
  "deuda_actualizada": {
    "estado": "PAGADO_PARCIAL",
    "saldo_pendiente": 1000.00
  }
}
```

---

## Componentes de Frontend

### VueloFormNuevo.jsx
**Ubicación:** `dashboard/src/components/vuelos/VueloFormNuevo.jsx`

**Funcionalidades:**
- Formulario de creación/edición de vuelos
- Sección "Información de Emisión" con:
  - Select de cuenta de emisión
  - Radio buttons para forma de emisión
  - Lógica auto-marcar contado para Servivuelo/Chase
- Envío de campos `forma_emision` y `cuenta_emision_asignada` al backend

**Estados nuevos:**
```javascript
forma_emision: 'CONTADO',
cuenta_emision_asignada: ''
```

**Handler:**
```javascript
const handleCuentaChange = (e) => {
  const cuenta = e.target.value
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

### ControlEmisiones.jsx
**Ubicación:** `dashboard/src/app/(crm)/admin/control-emisiones/page.jsx`

**Funcionalidades:**
- Vista administrativa de control de emisiones
- Carga de vuelos con estado PENDIENTE_EMISION y autorizado_emision = false
- Agrupación por cuenta de emisión
- Selección múltiple con checkboxes
- Autorización batch
- Indicadores visuales de deuda (cuentas a crédito)

**Key Features:**
```javascript
// Agrupación por cuenta
const vuelosPorCuenta = useMemo(() => {
  const agrupados = {}
  vuelos.forEach(vuelo => {
    const cuenta = vuelo.cuenta_emision_asignada || 'SIN_CUENTA'
    if (!agrupados[cuenta]) agrupados[cuenta] = []
    agrupados[cuenta].push(vuelo)
  })
  return agrupados
}, [vuelos])
```

### Deudas.jsx
**Ubicación:** `dashboard/src/app/(crm)/admin/deudas/page.jsx`

**Funcionalidades:**
- Dashboard financiero con resumen de deudas
- Lista de deudas con filtros
- Modal de registro de pagos
- Indicadores de vencimiento
- Estados coloridos (PENDIENTE, PAGADO_PARCIAL, PAGADO_TOTAL)

**Resumen financiero:**
```javascript
const resumen = deudas.reduce((acc, deuda) => ({
  totalAdeudado: acc.totalAdeudado + parseFloat(deuda.monto_deuda),
  totalPagado: acc.totalPagado + (parseFloat(deuda.monto_deuda) - parseFloat(deuda.saldo_pendiente)),
  totalPendiente: acc.totalPendiente + parseFloat(deuda.saldo_pendiente)
}), { totalAdeudado: 0, totalPagado: 0, totalPendiente: 0 })
```

### VuelosList.jsx
**Ubicación:** `dashboard/src/components/vuelos/VuelosList.jsx`

**Funcionalidades:**
- Lista de vuelos con filtros
- Suscripción a Supabase Realtime
- Actualización automática cuando se autoriza una emisión

**Suscripción Realtime:**
```javascript
useEffect(() => {
  if (!vuelos || vuelos.length === 0) return

  const channel = supabase
    .channel('vuelos-autorizacion-emision')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vuelos',
        filter: 'autorizado_emision=eq.true'
      },
      (payload) => {
        console.log('Autorización detectada:', payload)
        onFilterChange(filters)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [vuelos, filters, onFilterChange])
```

---

## Supabase Realtime

### Configuración

La tabla `vuelos` debe tener Realtime habilitado:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE vuelos;
```

### Verificación

```sql
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'vuelos';
```

### Patrón de Implementación

**Patrón utilizado:** Patrón 3 - Notificaciones por Usuario (adaptado)

**Características:**
- Solo evento UPDATE (cuando autorizado_emision cambia)
- Filtro por autorizado_emision=eq.true
- Recarga completa de la lista (Patrón Ranking)
- Cleanup correcto del canal

**Por qué este patrón:**
- Solo nos interesa cuando se autoriza una emisión (UPDATE)
- Es más eficiente recargar la lista que hacer updates granulares
- La lista ya tiene filtros aplicados

---

## Flujo de Datos

### Creación de Vuelo con Emisión a Crédito

```
1. Usuario completa formulario
   ↓
2. Frontend envía:
   {
     forma_emision: 'CREDITO',
     cuenta_emision_asignada: 'SABRE',
     ...otros campos
   }
   ↓
3. Backend valida y guarda en vuelos
   ↓
4. Usuario confirma pago
   ↓
5. Estado cambia a PENDIENTE_EMISION
   ↓
6. Administración autoriza (PATCH /api/vuelos/:id/autorizar-emision)
   ↓
7. Backend:
   - Actualiza autorizado_emision = true
   - Si forma_emision = CREDITO:
     * Crea registro en deudas_proveedores
     * monto_deuda = total del vuelo
     * estado = PENDIENTE
   ↓
8. Supabase Realtime emite evento UPDATE
   ↓
9. Frontend del emisor recibe evento
   ↓
10. VuelosList recarga la lista
   ↓
11. Emisor ve el vuelo autorizado
```

### Registro de Pago de Deuda

```
1. Administración abre modal de pago
   ↓
2. Completa formulario:
   {
     monto_pagado: 500.00,
     metodo_pago: 'Transferencia',
     referencia_pago: 'REF123',
     fecha_pago: '2026-04-22'
   }
   ↓
3. Frontend envía POST /api/deudas-proveedores/pagos
   ↓
4. Backend:
   - Crea registro en pagos_deudas
   - Actualiza saldo_pendiente de deuda
   - Si saldo_pendiente = 0:
     * estado = PAGADO_TOTAL
   - Si 0 < saldo_pendiente < monto_deuda:
     * estado = PAGADO_PARCIAL
   ↓
5. Frontend recarga lista de deudas
   ↓
6. Usuario ve deuda actualizada
```

---

## Seguridad

### Autenticación
- Uso de Supabase Auth para autenticación de usuarios
- Tokens JWT para acceso a API

### Autorización por Rol

**useRouteGuard Hook:**
```javascript
const { user, profile, loading } = useRouteGuard({
  requireAuth: true,
  allowedRoles: ['administracion', 'admin', 'super_admin']
})
```

**Roles con acceso:**
- `administracion`: Control de emisiones, gestión de deudas
- `admin`: Control de emisiones, gestión de deudas
- `super_admin`: Control de emisiones, gestión de deudas
- `asesor`: Solo creación/edición de vuelos
- `emisor`: Solo visualización de vuelos

### Validaciones

**Backend:**
- Validación de campos obligatorios
- Verificación de permisos por rol
- Sanitización de datos
- Transacciones para operaciones críticas

**Frontend:**
- Validación de formularios
- Bloqueo de campos según cuenta seleccionada
- Validación de monto máximo en pagos

### Transacciones SQL

Las operaciones críticas usan transacciones:

```javascript
await db.transaction(async (trx) => {
  // Actualizar vuelo
  await trx('vuelos').where({ id }).update({
    autorizado_emision: true,
    autorizado_emision_por: userId
  })
  
  // Si es crédito, crear deuda
  if (forma_emision === 'CREDITO') {
    await trx('deudas_proveedores').insert({
      vuelo_id: id,
      proveedor: cuenta,
      monto_deuda: total,
      saldo_pendiente: total
    })
  }
})
```

---

## Testing

### Tests Manuales Realizados

**Fase 3: Formulario de Vuelo**
- ✅ Creación de vuelo con cuenta Servivuelo (auto-marca contado)
- ✅ Creación de vuelo con cuenta Sabre (permite crédito)
- ✅ Validación de campos obligatorios
- ✅ Envío correcto de campos al backend

**Fase 4: Control de Emisiones**
- ✅ Carga de vuelos pendientes
- ✅ Agrupación por cuenta
- ✅ Selección múltiple
- ✅ Autorización batch
- ✅ Indicadores visuales de deuda

**Fase 5: Realtime**
- ✅ Suscripción a cambios en vuelos
- ✅ Actualización automática en tiempo real
- ✅ Cleanup correcto del canal

**Fase 6: Gestión de Deudas**
- ✅ Carga de deudas
- ✅ Filtros por proveedor y estado
- ✅ Registro de pago parcial
- ✅ Registro de pago total
- ✅ Actualización de estado de deuda
- ✅ Indicadores de vencimiento

### Tests Recomendados para Futuro

**Unit Tests:**
- Test de lógica de handleCuentaChange
- Test de agrupación por cuenta
- Test de cálculo de resumen financiero

**Integration Tests:**
- Test de flujo completo: crear vuelo → autorizar → emitir
- Test de flujo de deuda: crédito → deuda → pago
- Test de autorización batch

**E2E Tests:**
- Test de usuario completo (asesor → admin → emisor)
- Test de pagos de deudas
- Test de filtros y búsqueda

---

## Configuración de API

### apiConfig.js

**Endpoints agregados:**

```javascript
export const VUELOS_API = {
  // ... endpoints existentes
  autorizarEmision: (id) => buildApiUrl(`/api/vuelos/${id}/autorizar-emision`),
  autorizarEmisionBatch: () => buildApiUrl('/api/vuelos/autorizar-emision-batch')
}

export const DEUDAS_API = {
  listar: buildApiUrl('/api/deudas-proveedores'),
  registrarPago: buildApiUrl('/api/deudas-proveedores/pagos')
}
```

---

## Consideraciones de Performance

### Índices de Base de Datos
```sql
CREATE INDEX idx_vuelos_estado_autorizado ON vuelos(estado, autorizado_emision);
CREATE INDEX idx_deudas_estado ON deudas_proveedores(estado);
```

### Frontend Optimizations
- `useMemo` para agrupación de vuelos
- `useMemo` para cálculo de resumen financiero
- Lazy loading de componentes
- Suscripción Realtime solo cuando hay datos

### API Optimizations
- Filtros en servidor (no en frontend)
- Paginación para listas grandes
- Select específicos de campos necesarios

---

## Troubleshooting

### Realtime no funciona
**Síntoma:** La lista de vuelos no se actualiza cuando se autoriza una emisión.

**Soluciones:**
1. Verificar que Realtime está habilitado en la tabla:
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' AND tablename = 'vuelos';
   ```
2. Verificar logs del handler en consola
3. Verificar que el filtro es correcto: `autorizado_emision=eq.true`

### Deuda no se crea
**Síntoma:** Al autorizar una emisión a crédito, no se crea la deuda.

**Soluciones:**
1. Verificar que `forma_emision` es 'CREDITO'
2. Verificar logs del backend
3. Verificar que la transacción se completó

### Estado de deuda no se actualiza
**Síntoma:** Después de registrar un pago, el estado de la deuda no cambia.

**Soluciones:**
1. Verificar que el monto pagado es positivo
2. Verificar cálculo de saldo pendiente
3. Verificar lógica de actualización de estado en backend

---

## Documentación Relacionada

- [Guía de Usuario](./usuario.md)
- [Plan de Implementación](../superpowers/plans/2026-04-21-control-emisiones-implementation.md)
- [Supabase Realtime Implementation](../10-legacy/REALTIME_UPDATES.md)

---

**Última actualización:** 2026-04-22
**Versión:** 1.0
**Mantenedor:** Equipo de Desarrollo ERP Nova CRM
