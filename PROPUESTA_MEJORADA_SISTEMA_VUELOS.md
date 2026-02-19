# 🎯 PROPUESTA MEJORADA: Sistema de Gestión de Vuelos
## Basado en Análisis del Flujo Real del Negocio

---

## 📊 ANÁLISIS DEL FLUJO REAL

### **Aclaraciones Importantes del Cliente**

#### **1. Sobre el Proceso de Emisión y Pago**
```
Cliente paga → Proveedor recibe pago → Boleto se emite
                                    ↓
                        Puede generar deuda o no
                                    ↓
                        Boleto entra al sistema como EMITIDO
```

**Punto clave**: El boleto solo entra al sistema **después de ser emitido**, no antes.

#### **2. Sobre los Estados del Boleto**
- ✅ **EMITIDO**: El boleto ya fue emitido por el proveedor
- ⏳ **PENDIENTE POR EMITIR**: Aún no se ha emitido

#### **3. Sobre los Anulables (Vuelos Migratorios)**
```
Cliente compra vuelo migratorio
    ↓
Se compra boleto de IDA + RETORNO
    ↓
Cliente viaja (solo usa IDA)
    ↓
Boleto de RETORNO debe anularse ANTES de la fecha
    ↓
Cliente NO paga el retorno (lo anulamos y recuperamos dinero)
```

**Punto clave**: Los anulables son específicamente para **boletos de retorno** en vuelos migratorios que el cliente no va a usar y no paga.

---

## 🔄 FLUJO CORREGIDO Y MEJORADO

### **FASE 1: Venta y Registro Inicial**

#### **Escenario A: Vuelo Regular (Turismo, Negocios, etc.)**
```
1. Cliente solicita vuelo
2. Asesor cotiza con proveedor
3. Cliente acepta y paga
4. Asesor registra en sistema:
   - Datos del cliente
   - Información del vuelo
   - Monto pagado por cliente
   - Comprobante de pago del cliente
   - Estado: PENDIENTE_PAGO_PROVEEDOR
```

#### **Escenario B: Vuelo Migratorio**
```
1. Cliente solicita vuelo migratorio
2. Asesor cotiza:
   - Boleto de IDA (cliente lo usa)
   - Boleto de RETORNO (se anulará después)
3. Cliente paga SOLO el boleto de IDA
4. Asesor registra en sistema:
   - Datos del cliente
   - Información del vuelo de IDA
   - Información del vuelo de RETORNO (separado)
   - Monto pagado por cliente (solo IDA)
   - Marca RETORNO como "Requiere Anulación"
   - Estado IDA: PENDIENTE_PAGO_PROVEEDOR
   - Estado RETORNO: PENDIENTE_PAGO_PROVEEDOR
```

---

### **FASE 2: Pago al Proveedor**

#### **Admin decide cómo pagar al proveedor:**

**OPCIÓN A: Pago a Crédito**
```
1. Admin selecciona "Pagar a Crédito"
2. Sistema registra:
   - Proveedor da 7 días de crédito
   - Se crea DEUDA automáticamente
   - Fecha vencimiento: +7 días
   - Monto de la deuda
3. Proveedor emite el boleto
4. Estado: EMITIDO
5. Deuda queda PENDIENTE
```

**OPCIÓN B: Pago Inmediato (Contra Pago)**
```
1. Admin selecciona tarjeta a usar:
   - Tarjeta Chase
   - Tarjeta Nova
   - Tarjeta Colombia
   - Otra
2. Se paga inmediatamente al proveedor
3. Proveedor emite el boleto
4. Estado: EMITIDO
5. NO se crea deuda
```

---

### **FASE 3: Boleto Emitido**

#### **Una vez el proveedor emite:**
```
1. Encargado de emisiones (Joan) registra:
   - Número de boleto
   - Fecha de emisión
   - Confirmación de emisión
   
2. Sistema actualiza:
   - Estado: EMITIDO ✓
   - Boleto entra oficialmente al sistema
   - Se registra en timeline
   
3. Asesor recibe notificación:
   - "Boleto emitido"
   - Puede generar formato WhatsApp
   - Puede enviar al cliente
```

---

### **FASE 4A: Gestión de Deudas (Si fue a crédito)**

#### **Control de Deudas con Proveedor:**
```
DÍA 1: Boleto emitido a crédito
    ↓
DÍA 4: Alerta "Deuda vence en 3 días"
    ↓
DÍA 7: Alerta "Deuda vence HOY"
    ↓
Admin paga al proveedor
    ↓
Registra pago y comprobante
    ↓
Deuda: PAGADA ✓
```

---

### **FASE 4B: Gestión de Anulables (Solo Vuelos Migratorios)**

#### **Para el Boleto de RETORNO:**
```
DÍA 1: Boletos IDA + RETORNO emitidos
    ↓
Cliente viaja (usa solo IDA)
    ↓
Sistema calcula fecha límite de anulación:
    - Fecha del vuelo de RETORNO - 7 días
    ↓
Sistema crea caso de ANULABLE automáticamente:
    - Tipo: Boleto de Retorno Migratorio
    - Fecha límite: 7 días antes del retorno
    - Monto a recuperar: Costo del boleto de retorno
    - Estado: PENDIENTE_ANULACION
    ↓
Sistema envía alertas:
    - 7 días antes: "Anular en 7 días"
    - 3 días antes: "URGENTE: Anular en 3 días"
    - 1 día antes: "CRÍTICO: Anular mañana"
    ↓
Admin/Asesor anula el boleto con el proveedor
    ↓
Registra en sistema:
    - Fecha de anulación
    - Monto recuperado
    - Referencia de anulación
    - Estado: ANULADO ✓
    ↓
Dinero recuperado se registra como ingreso
```

---

## 🏗️ ESTRUCTURA MEJORADA DE MÓDULOS

### **MÓDULO 1: GESTIÓN DE VUELOS**

#### **Cambios Importantes:**

**1. Estados del Vuelo**
```
PENDIENTE_PAGO_PROVEEDOR → Esperando que se pague al proveedor
         ↓
    EMITIDO → Boleto ya emitido por proveedor
         ↓
    COMPLETADO → Vuelo realizado (opcional)
```

**2. Tipos de Vuelo**
- **Regular**: Turismo, Negocios, Familiar, etc.
- **Migratorio**: Requiere gestión especial de IDA + RETORNO

**3. Campos Adicionales**
- **Estado de Emisión**: PENDIENTE_EMITIR / EMITIDO
- **Número de Boleto**: Se registra al emitir
- **Fecha de Emisión**: Cuándo se emitió
- **Es Boleto de Retorno**: Sí/No
- **Requiere Anulación**: Sí/No (solo retornos migratorios)

**4. Funcionalidades Nuevas**
- Crear vuelo migratorio con IDA + RETORNO en un solo proceso
- Marcar automáticamente RETORNO como "Requiere Anulación"
- Vista separada de boletos pendientes por emitir
- Vista de boletos emitidos

---

### **MÓDULO 2: GESTIÓN DE PAGOS**

#### **Dividido en 2 Sub-Módulos:**

#### **SUB-MÓDULO 2A: Pagos de Clientes**
```
¿Qué hace?
- Registrar pagos que hace el cliente
- Confirmar que el dinero llegó
- Llevar control de ingresos
```

**Funcionalidades:**
1. Registrar pago del cliente
2. Subir comprobante
3. Confirmar recepción del dinero
4. Estado: PENDIENTE / CONFIRMADO / RECHAZADO

#### **SUB-MÓDULO 2B: Pagos a Proveedores**
```
¿Qué hace?
- Decidir cómo pagar al proveedor
- Registrar el pago realizado
- Controlar si genera deuda o no
```

**Funcionalidades:**
1. Seleccionar método de pago:
   - A Crédito (genera deuda)
   - Contra Pago con tarjeta (no genera deuda)
2. Registrar pago al proveedor
3. Si es a crédito → crear deuda automáticamente
4. Subir comprobante de pago al proveedor

---

### **MÓDULO 3: GESTIÓN DE EMISIONES**

#### **Simplificado:**

**Funcionalidades:**
1. **Recibir Confirmación de Emisión**
   - Joan confirma que el proveedor emitió
   - Registra número de boleto
   - Registra fecha de emisión

2. **Actualizar Estado**
   - De PENDIENTE_EMITIR → EMITIDO
   - Notificar a asesor
   - Registrar en timeline

3. **Vista de Boletos**
   - Pendientes por emitir
   - Emitidos hoy
   - Historial de emisiones

**Nota**: Ya no hay "verificación" previa. El proceso es más directo:
```
Pago al proveedor → Proveedor emite → Joan registra emisión
```

---

### **MÓDULO 4: GESTIÓN DE DEUDAS**

#### **Sin Cambios Mayores**

**Funcionalidades:**
1. Creación automática cuando se paga a crédito
2. Alertas de vencimiento (3 días, 1 día, vencida)
3. Registro de pago de deuda
4. Control por proveedor
5. Dashboard de deudas pendientes

**Estados:**
- PENDIENTE
- PAGADA
- VENCIDA

---

### **MÓDULO 5: GESTIÓN DE ANULABLES**

#### **Rediseñado Completamente**

**Concepto Clave**: Los anulables son **exclusivamente** para boletos de retorno en vuelos migratorios que el cliente no va a usar.

**Funcionalidades:**

1. **Creación Automática**
   - Cuando se crea vuelo migratorio
   - Se crean 2 registros:
     - Vuelo IDA (normal)
     - Vuelo RETORNO (marcado como anulable)
   - Sistema calcula fecha límite automáticamente

2. **Información del Anulable**
   - Datos del cliente
   - Información del boleto de retorno
   - Fecha del vuelo de retorno
   - Fecha límite de anulación (7 días antes)
   - Monto a recuperar
   - Estado

3. **Estados del Anulable**
   ```
   PENDIENTE_ANULACION → Esperando que llegue la fecha
            ↓
       ANULADO → Ya se anuló con el proveedor
            ↓
   MONTO_RECUPERADO → Dinero devuelto
   ```

4. **Alertas Inteligentes**
   - 7 días antes: Alerta informativa
   - 3 días antes: Alerta urgente (amarilla)
   - 1 día antes: Alerta crítica (roja)
   - Día de: Alerta máxima (roja parpadeante)

5. **Proceso de Anulación**
   - Admin/Asesor anula con proveedor
   - Registra en sistema:
     - Fecha de anulación
     - Monto recuperado
     - Referencia de anulación
     - Observaciones
   - Estado: ANULADO
   - Se registra como ingreso recuperado

6. **Reportes de Anulables**
   - Total de anulables pendientes
   - Anulables urgentes (≤3 días)
   - Monto total a recuperar
   - Historial de anulaciones
   - Tasa de recuperación

---

### **MÓDULO 6: TIMELINE**

#### **Sin Cambios**

Registra todos los eventos del ciclo de vida del vuelo.

---

### **MÓDULO 7: REPORTES**

#### **Reportes Adicionales:**

**Reporte de Emisiones**
- Boletos pendientes por emitir
- Boletos emitidos por período
- Tiempo promedio de emisión

**Reporte de Anulables**
- Casos pendientes de anulación
- Casos urgentes
- Monto total recuperado
- Tasa de éxito en anulaciones
- Anulables perdidos (no se anularon a tiempo)

**Reporte Financiero**
- Ingresos por ventas
- Pagos a proveedores
- Deudas pendientes
- Montos recuperados por anulaciones
- Ganancia neta (fee)

---

## 🔄 FLUJO COMPLETO MEJORADO

### **CASO 1: Vuelo Regular (Turismo)**

```
1. Cliente solicita vuelo a Cancún
2. Asesor cotiza: $500
3. Cliente paga $500
4. Asesor registra en sistema:
   - Tipo: Turismo
   - Monto cliente: $500
   - Estado: PENDIENTE_PAGO_PROVEEDOR

5. Admin decide pagar a proveedor:
   - Opción: Tarjeta Chase
   - Pago inmediato: $450
   - NO genera deuda

6. Proveedor emite boleto
7. Joan registra:
   - Número boleto: ABC123
   - Estado: EMITIDO

8. Asesor notificado
9. Envía boleto al cliente
10. FIN ✓
```

---

### **CASO 2: Vuelo Migratorio (con Anulable)**

```
1. Cliente solicita vuelo migratorio a USA
2. Asesor cotiza:
   - IDA: $300 (cliente paga)
   - RETORNO: $300 (se anulará)
   
3. Cliente paga SOLO $300 (IDA)

4. Asesor registra en sistema:
   - Crea VUELO 1 (IDA):
     * Tipo: Migratorio - IDA
     * Fecha: 15 de Marzo
     * Monto: $300
     * Estado: PENDIENTE_PAGO_PROVEEDOR
   
   - Crea VUELO 2 (RETORNO):
     * Tipo: Migratorio - RETORNO
     * Fecha: 15 de Abril
     * Monto: $300
     * Requiere Anulación: SÍ
     * Estado: PENDIENTE_PAGO_PROVEEDOR

5. Admin paga AMBOS boletos al proveedor:
   - Opción: A Crédito
   - Monto total: $600
   - Genera DEUDA: $600 (vence en 7 días)

6. Proveedor emite AMBOS boletos:
   - Boleto IDA: ABC123
   - Boleto RETORNO: ABC124

7. Joan registra emisiones:
   - IDA: EMITIDO
   - RETORNO: EMITIDO

8. Sistema crea ANULABLE automáticamente:
   - Para boleto RETORNO
   - Fecha límite: 8 de Abril (7 días antes del 15)
   - Monto a recuperar: $300
   - Estado: PENDIENTE_ANULACION

9. Cliente viaja el 15 de Marzo (usa IDA)

10. Sistema envía alertas:
    - 1 de Abril: "Anular en 7 días"
    - 5 de Abril: "URGENTE: Anular en 3 días"
    - 7 de Abril: "CRÍTICO: Anular mañana"

11. Admin anula boleto RETORNO el 8 de Abril:
    - Llama al proveedor
    - Anula boleto ABC124
    - Proveedor devuelve $280 (cobró $20 de penalidad)

12. Admin registra en sistema:
    - Fecha anulación: 8 de Abril
    - Monto recuperado: $280
    - Estado: ANULADO ✓

13. Deuda con proveedor:
    - Deuda original: $600
    - Monto recuperado: $280
    - Deuda real: $320
    - Admin paga $320 al proveedor
    - Deuda: PAGADA ✓

14. Resumen financiero:
    - Ingreso cliente: $300
    - Costo real: $320 ($600 - $280)
    - Pérdida: -$20
    
15. FIN ✓
```

---

## 📋 CAMBIOS CLAVE EN LA PROPUESTA

### **1. Eliminado: Módulo de Verificación Complejo**
❌ **Antes**: Pago cliente → Confirmar → Verificar info → Decidir método → Emitir
✅ **Ahora**: Pago cliente → Pagar proveedor → Emitir → Registrar

**Razón**: Simplificar el flujo. La verificación de información se hace antes de pagar al proveedor, no como paso separado.

---

### **2. Modificado: Concepto de Anulables**
❌ **Antes**: Anulables eran cualquier vuelo que "requiere seguimiento"
✅ **Ahora**: Anulables son SOLO boletos de retorno en vuelos migratorios

**Razón**: Claridad del propósito. Los anulables tienen un objetivo específico: recuperar dinero de boletos que el cliente no va a usar.

---

### **3. Agregado: Gestión de Vuelos IDA + RETORNO**
✅ **Nuevo**: Sistema maneja vuelos migratorios como 2 vuelos separados pero relacionados
✅ **Nuevo**: Boleto de retorno se marca automáticamente como anulable
✅ **Nuevo**: Cálculo automático de fecha límite de anulación

**Razón**: Reflejar la realidad del negocio. Un vuelo migratorio son 2 boletos con gestiones diferentes.

---

### **4. Simplificado: Proceso de Emisión**
❌ **Antes**: Múltiples pasos de verificación y aprobación
✅ **Ahora**: Pagar → Emitir → Registrar

**Razón**: El proceso real es más directo. Una vez se paga al proveedor, ellos emiten.

---

### **5. Mejorado: Control Financiero**
✅ **Nuevo**: Separación clara entre:
   - Pagos de clientes (ingresos)
   - Pagos a proveedores (egresos)
   - Deudas con proveedores
   - Montos recuperados por anulaciones

**Razón**: Tener claridad financiera completa del negocio.

---

## 👥 ROLES ACTUALIZADOS

### **ROL 1: ASESOR**
**Puede hacer:**
- ✅ Crear vuelos (regulares o migratorios)
- ✅ Registrar pagos de clientes
- ✅ Subir documentos
- ✅ Ver estado de sus vuelos
- ✅ Ver sus anulables
- ✅ Generar formato WhatsApp

**Pantallas:**
- Mis Vuelos
- Crear Vuelo Regular
- Crear Vuelo Migratorio (IDA + RETORNO)
- Registrar Pago Cliente
- Mis Anulables

---

### **ROL 2: ADMIN DE PAGOS**
**Puede hacer:**
- ✅ Confirmar pagos de clientes
- ✅ Decidir cómo pagar a proveedores
- ✅ Registrar pagos a proveedores
- ✅ Ver reportes de pagos

**Pantallas:**
- Confirmar Pagos de Clientes
- Pagar a Proveedores
- Seleccionar Método (Crédito/Contra Pago)
- Reporte de Pagos

---

### **ROL 3: ENCARGADO DE EMISIONES (Joan)**
**Puede hacer:**
- ✅ Registrar emisiones de boletos
- ✅ Ingresar número de boleto
- ✅ Confirmar fecha de emisión
- ✅ Ver boletos pendientes por emitir

**Pantallas:**
- Boletos Pendientes por Emitir
- Registrar Emisión
- Historial de Emisiones

---

### **ROL 4: ADMIN DE DEUDAS**
**Puede hacer:**
- ✅ Ver deudas pendientes
- ✅ Ver alertas de vencimiento
- ✅ Registrar pago de deudas
- ✅ Subir comprobantes
- ✅ Ver reportes de deudas

**Pantallas:**
- Dashboard de Deudas
- Pagar Deuda
- Reporte de Deudas por Proveedor

---

### **ROL 5: ADMIN DE ANULABLES**
**Puede hacer:**
- ✅ Ver todos los anulables pendientes
- ✅ Ver alertas urgentes
- ✅ Anular boletos con proveedor
- ✅ Registrar monto recuperado
- ✅ Ver reportes de anulaciones

**Pantallas:**
- Dashboard de Anulables (con urgentes)
- Anular Boleto
- Registrar Recuperación
- Reporte de Anulaciones

---

### **ROL 6: ADMINISTRADOR GENERAL**
**Puede hacer:**
- ✅ TODO lo anterior
- ✅ Ver todos los reportes
- ✅ Gestionar usuarios
- ✅ Ver timeline completo
- ✅ Exportar datos

**Pantallas:**
- Todas las pantallas
- Dashboard Ejecutivo
- Gestión de Usuarios

---

## 📊 DASHBOARDS PRINCIPALES

### **1. Dashboard del Asesor**
```
┌─────────────────────────────────────┐
│ MIS VUELOS                          │
├─────────────────────────────────────┤
│ Pendientes por Emitir: 3            │
│ Emitidos: 15                        │
│ Mis Anulables Urgentes: 1 🔴        │
├─────────────────────────────────────┤
│ [Crear Vuelo Regular]               │
│ [Crear Vuelo Migratorio]            │
└─────────────────────────────────────┘
```

### **2. Dashboard de Admin de Pagos**
```
┌─────────────────────────────────────┐
│ PAGOS                               │
├─────────────────────────────────────┤
│ Pagos Clientes Pendientes: 5        │
│ Boletos Pendientes Pagar Prov: 8    │
├─────────────────────────────────────┤
│ [Confirmar Pagos Clientes]          │
│ [Pagar a Proveedores]               │
└─────────────────────────────────────┘
```

### **3. Dashboard de Emisiones (Joan)**
```
┌─────────────────────────────────────┐
│ EMISIONES                           │
├─────────────────────────────────────┤
│ Pendientes por Emitir: 12           │
│ Emitidos Hoy: 8                     │
├─────────────────────────────────────┤
│ [Registrar Emisión]                 │
│ [Ver Pendientes]                    │
└─────────────────────────────────────┘
```

### **4. Dashboard de Deudas**
```
┌─────────────────────────────────────┐
│ DEUDAS CON PROVEEDORES              │
├─────────────────────────────────────┤
│ Total Adeudado: $12,500             │
│ Vencen Hoy: 2 🔴                    │
│ Vencen en 3 días: 5 🟡              │
├─────────────────────────────────────┤
│ [Ver Deudas Urgentes]               │
│ [Pagar Deuda]                       │
└─────────────────────────────────────┘
```

### **5. Dashboard de Anulables**
```
┌─────────────────────────────────────┐
│ ANULABLES (Retornos Migratorios)    │
├─────────────────────────────────────┤
│ Casos Urgentes (≤3 días): 4 🔴      │
│ Pendientes Total: 15                │
│ Monto a Recuperar: $4,200           │
├─────────────────────────────────────┤
│ [Ver Urgentes]                      │
│ [Anular Boleto]                     │
└─────────────────────────────────────┘
```

---

## 🎯 BENEFICIOS DE LA PROPUESTA MEJORADA

### **1. Más Simple**
- ✅ Menos pasos en el proceso
- ✅ Flujo más directo
- ✅ Menos confusión

### **2. Más Claro**
- ✅ Concepto de anulables bien definido
- ✅ Separación clara IDA vs RETORNO
- ✅ Estados más simples

### **3. Más Preciso**
- ✅ Refleja el proceso real del negocio
- ✅ No hay pasos innecesarios
- ✅ Control financiero exacto

### **4. Más Útil**
- ✅ Alertas de anulables evitan pérdidas
- ✅ Control de deudas automático
- ✅ Reportes financieros completos

---

## 📋 RESUMEN EJECUTIVO

### **¿Qué cambió?**

**1. Proceso de Emisión Simplificado**
- Eliminamos pasos de verificación complejos
- Flujo directo: Pagar → Emitir → Registrar

**2. Anulables Redefinidos**
- Solo para boletos de retorno migratorios
- Propósito claro: recuperar dinero
- Alertas para no perder plata

**3. Gestión de Vuelos Migratorios**
- Se manejan como 2 vuelos separados (IDA + RETORNO)
- Sistema automático de anulables
- Control financiero preciso

**4. Control Financiero Mejorado**
- Separación clara de ingresos y egresos
- Seguimiento de montos recuperados
- Reportes de ganancia real

### **¿Qué se mantiene?**
- ✅ Gestión de deudas con alertas
- ✅ Timeline completo
- ✅ Reportes y dashboards
- ✅ Sistema de notificaciones
- ✅ Roles y permisos

### **¿Cuál es el resultado?**
Un sistema más **simple**, más **claro** y más **útil** que refleja exactamente cómo funciona el negocio en la realidad.

---

**Fecha**: Febrero 19, 2026
**Versión**: 2.0 - MEJORADA
**Estado**: 📋 Lista para Revisión Final
