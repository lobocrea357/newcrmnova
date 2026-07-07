# Sistema de Control de Emisiones - Guía de Usuario

## 📋 Índice
1. [Introducción](#introducción)
2. [Flujo de Trabajo](#flujo-de-trabajo)
3. [Roles y Permisos](#roles-y-permisos)
4. [Funcionalidades por Rol](#funcionalidades-por-rol)
5. [Guía Paso a Paso](#guía-paso-a-paso)
6. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

El Sistema de Control de Emisiones es un módulo del ERP Nova CRM que permite gestionar de manera controlada el proceso de emisión de boletos aéreos. Este sistema asegura que todas las emisiones sean autorizadas por administración antes de procesarse, y mantiene un registro de deudas con proveedores cuando se emite a crédito.

### Objetivos del Sistema
- **Control de autorizaciones**: Administración debe aprobar cada emisión antes de procesarla
- **Gestión de cuentas**: Asignación de cuentas específicas para cada emisión
- **Control de deudas**: Registro automático de deudas cuando se emite a crédito
- **Transparencia**: Auditoría completa de todas las emisiones y pagos

---

## Flujo de Trabajo

### Diagrama del Proceso

```
1. Asesor crea vuelo
   ↓
2. Cliente paga
   ↓
3. Vuelo pasa a estado PENDIENTE_EMISION
   ↓
4. Emisor ve vuelo pendiente (en tiempo real)
   ↓
5. Administración autoriza emisión
   ↓
6. Emisor procesa emisión
   ↓
7. Si es crédito → Se genera deuda con proveedor
   ↓
8. Administración registra pagos de deudas
```

### Estados de un Vuelo

| Estado | Descripción | Acción Requerida |
|--------|-------------|------------------|
| `PENDIENTE_CONFIRMACION_PAGO` | Esperando confirmación de pago del cliente | Asesor debe confirmar pago |
| `PENDIENTE_EMISION` | Pago confirmado, esperando autorización | Administración debe autorizar |
| `EMITIDO` | Emisión autorizada y procesada | Ninguna |
| `CANCELADO` | Vuelo cancelado | Ninguna |

---

## Roles y Permisos

### Asesor
- **Permisos**: Crear y editar vuelos
- **Responsabilidades**:
  - Completar formulario de vuelo con información de emisión
  - Seleccionar cuenta de emisión (Servivuelo, Chase, Sabre, etc.)
  - Indicar forma de emisión (Contado/Crédito)
  - Confirmar pagos de clientes

### Emisor (Johan)
- **Permisos**: Ver vuelos pendientes de emisión
- **Responsabilidades**:
  - Ver en tiempo real los vuelos autorizados
  - Procesar emisiones en el sistema del proveedor
  - Actualizar estado del vuelo a EMITIDO

### Administración
- **Permisos**: Control completo del sistema
- **Responsabilidades**:
  - Autorizar emisiones desde el panel de control
  - Ver y gestionar deudas con proveedores
  - Registrar pagos de deudas
  - Acceso a todas las vistas administrativas

---

## Funcionalidades por Rol

### Para Asesores

#### Formulario de Vuelo
Al crear o editar un vuelo, el asesor debe completar la sección **"Información de Emisión"**:

**Campos a completar:**
1. **Cuenta de Emisión** (obligatorio)
   - SERVIVUELO_1 (Contado)
   - SERVIVUELO_2 (Contado)
   - CHASE_NOVA (Contado)
   - CHASE_APOLO (Contado)
   - SABRE (Crédito/Contado)
   - AMADEUS (Crédito/Contado)
   - EXPEDIA (Crédito/Contado)

2. **Forma de Emisión** (obligatorio)
   - Contado: No genera deuda
   - Crédito: Genera deuda con proveedor

**Comportamiento automático:**
- Si seleccionas SERVIVUELO o CHASE, la forma de emisión se marca automáticamente como CONTADO
- Si seleccionas Crédito, verás una advertencia que se generará una deuda

### Para Emisores

#### Vista de Vuelos
Los emisores pueden ver la lista de vuelos en:
```
Ventas → Vuelos
```

**Filtros útiles:**
- Estado: "Pendientes Emisión"
- Proveedor: Sabre, Kiu, Servivuelo, etc.
- Búsqueda: Por nombre de pasajero, localizador o ruta

**Actualización en tiempo real:**
- Cuando administración autoriza una emisión, la lista se actualiza automáticamente
- No necesitas recargar la página

### Para Administración

#### Control de Emisiones
Acceso desde:
```
Admin → Control de Emisiones
```

**Funcionalidades:**
- Ver todos los vuelos pendientes de autorización
- Agrupados por cuenta de emisión
- Ver total por cuenta
- Seleccionar múltiples vuelos para autorizar en batch
- Ver indicadores de deuda (cuentas a crédito)

**Proceso de autorización:**
1. Filtra por la cuenta que deseas autorizar
2. Selecciona los vuelos (checkbox)
3. Clic en "Autorizar Seleccionados"
4. Los vuelos se actualizan automáticamente para el emisor

#### Gestión de Deudas
Acceso desde:
```
Admin → Gestión de Deudas
```

**Resumen financiero:**
- Total Adeudado: Suma de todas las deudas
- Total Pagado: Suma de pagos registrados
- Saldo Pendiente: Diferencia entre adeudado y pagado

**Lista de deudas:**
- Proveedor
- Vuelo asociado (ruta, pasajero, localizador)
- Monto de deuda
- Saldo pendiente
- Estado (PENDIENTE, PAGADO_PARCIAL, PAGADO_TOTAL)
- Fecha de vencimiento
- Alerta de vencimiento (si aplica)

**Registro de pagos:**
1. Busca la deuda que deseas pagar
2. Clic en "Registrar Pago"
3. Completa el formulario:
   - Monto a pagar (máximo: saldo pendiente)
   - Método de pago
   - Referencia de pago
   - Fecha de pago
   - Observaciones (opcional)
4. Clic en "Registrar Pago"
5. La deuda se actualiza automáticamente

---

## Guía Paso a Paso

### Escenario 1: Emisión a Contado

**Rol: Asesor**
1. Crea un nuevo vuelo
2. Completa la información del vuelo
3. En "Información de Emisión":
   - Cuenta: SERVIVUELO_1
   - Forma de Emisión: CONTADO (automático)
4. Guarda el vuelo
5. Confirma el pago del cliente

**Rol: Administración**
1. Ve a "Control de Emisiones"
2. Busca el vuelo en la cuenta SERVIVUELO_1
3. Selecciona el vuelo
4. Clic en "Autorizar Seleccionados"

**Rol: Emisor**
1. Ve la lista de vuelos (se actualiza en tiempo real)
2. Procesa la emisión en Servivuelo
3. Actualiza el estado a EMITIDO

### Escenario 2: Emisión a Crédito

**Rol: Asesor**
1. Crea un nuevo vuelo
2. Completa la información del vuelo
3. En "Información de Emisión":
   - Cuenta: SABRE
   - Forma de Emisión: CREDITO
4. Guarda el vuelo
5. Confirma el pago del cliente

**Rol: Administración**
1. Ve a "Control de Emisiones"
2. Busca el vuelo en la cuenta SABRE (se muestra en ámbar)
3. Verás la advertencia "Generará deuda con proveedor"
4. Selecciona el vuelo
5. Clic en "Autorizar Seleccionados"
6. Se genera automáticamente una deuda con Sabre

**Rol: Emisor**
1. Ve la lista de vuelos (se actualiza en tiempo real)
2. Procesa la emisión en Sabre
3. Actualiza el estado a EMITIDO

**Rol: Administración (post-emisión)**
1. Ve a "Gestión de Deudas"
2. Busca la deuda con Sabre
3. Cuando recibas el estado de cuenta, registra el pago
4. La deuda se actualiza a PAGADO_TOTAL

### Escenario 3: Autorización en Batch

**Rol: Administración**
1. Ve a "Control de Emisiones"
2. Filtra por una cuenta específica (ej: CHASE_NOVA)
3. Selecciona múltiples vuelos (checkboxes)
4. Clic en "Autorizar Seleccionados (X)"
5. Todos los vuelos se autorizan simultáneamente
6. El emisor ve todos los vuelos actualizados en tiempo real

---

## Preguntas Frecuentes

### ¿Por qué algunas cuentas siempre son al contado?
Servivuelo y Chase Bank son cuentas corporativas que requieren pago inmediato. El sistema fuerza automáticamente la forma de emisión a CONTADO para estas cuentas.

### ¿Qué pasa si selecciono Crédito?
El sistema generará automáticamente una deuda con el proveedor cuando se autorice la emisión. Esta deuda aparecerá en "Gestión de Deudas" y deberás registrar los pagos cuando pagues al proveedor.

### ¿Puedo cambiar la cuenta de emisión después de crear el vuelo?
Sí, puedes editar el vuelo y cambiar la cuenta de emisión mientras el vuelo esté en estado PENDIENTE_EMISION.

### ¿Cómo sé que un vuelo está autorizado?
El emisor verá el vuelo actualizado en tiempo real en su lista. No necesita recargar la página.

### ¿Qué pasa si pago parcialmente una deuda?
La deuda cambiará a estado PAGADO_PARCIAL. El saldo pendiente se actualizará automáticamente. Puedes hacer pagos parciales sucesivos hasta liquidar la deuda completa.

### ¿Cómo se calcula el monto de la deuda?
El monto de la deuda es el precio total del vuelo (sumatoria de precios de todos los pasajeros).

### ¿Puedo ver el historial de pagos de una deuda?
Actualmente, el sistema muestra el estado actual de la deuda (total, pagado, pendiente). El historial detallado de pagos estará disponible en futuras versiones.

### ¿Qué significa "Vencido" en la lista de deudas?
Indica que la fecha de vencimiento de la deuda es anterior a la fecha actual. Estas deudas se muestran en rojo como alerta.

### ¿Puedo autorizar emisiones para cuentas de crédito?
Sí, pero debes tener en cuenta que esto generará deudas con el proveedor. Asegúrate de tener los fondos disponibles para pagar al proveedor.

### ¿Qué pasa si cometo un error al registrar un pago?
Contacta al equipo técnico para revertir el pago. Esta función estará disponible en futuras versiones.

---

## Soporte

Para cualquier pregunta o problema con el Sistema de Control de Emisiones, contacta al equipo de soporte técnico.

**Documentación actualizada:** 2026-04-22
**Versión del sistema:** 1.0
