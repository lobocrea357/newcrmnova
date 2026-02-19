# 🎯 PROPUESTA: Sistema Integral de Gestión de Vuelos
## Estructura de Módulos, Funcionalidades y Roles

---

## 📋 VISIÓN GENERAL DEL SISTEMA

El sistema está diseñado para gestionar el **ciclo completo** de un vuelo, desde que el cliente hace la reserva hasta que se emite el boleto y se cierra administrativamente. Todo el proceso queda registrado y trazable.

### **Objetivo Principal**
Eliminar la gestión por WhatsApp y centralizar todo el flujo de trabajo en una plataforma única donde cada persona del equipo tenga claridad sobre:
- ✅ Qué debe hacer
- ✅ En qué estado está cada vuelo
- ✅ Qué está pendiente
- ✅ Quién es responsable de cada paso

---

## 🏗️ ESTRUCTURA DE MÓDULOS

El sistema se divide en **7 módulos principales** que trabajan de forma integrada:

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE VUELOS                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ MÓDULO 1 │→ │ MÓDULO 2 │→ │ MÓDULO 3 │→ │ MÓDULO 4 │  │
│  │  VUELOS  │  │  PAGOS   │  │ EMISIONES│  │  DEUDAS  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ MÓDULO 5 │  │ MÓDULO 6 │  │ MÓDULO 7 │                │
│  │ANULABLES │  │TIMELINE  │  │ REPORTES │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 MÓDULO 1: GESTIÓN DE VUELOS

### **¿Qué hace?**
Es el punto de entrada del sistema. Aquí se registra toda la información del vuelo que el asesor vende al cliente.

### **Funcionalidades**
1. **Registro de Información del Vuelo**
   - Datos del pasajero (PAX): nombre, cantidad de adultos/niños/infantes
   - Contacto del cliente: nombre y teléfono
   - Detalles del vuelo: fecha, ruta, horario, aerolínea, localizador
   - Proveedor utilizado (SABRE, Expedia, etc.)

2. **Información Financiera**
   - Monto de venta (lo que paga el cliente)
   - Costos del proveedor (SABRE, Expedia, emisión)
   - **Cálculo automático del FEE** (ganancia)
   - Método de pago del cliente

3. **Gestión de Documentos**
   - Subir pasaportes del cliente
   - Subir comprobantes de pago
   - Visualizar todos los documentos adjuntos

4. **Clasificación del Vuelo**
   - Tipo de vuelo: Migración, Turismo, Negocios, etc.
   - Marcar si requiere seguimiento de anulación

5. **Generador de WhatsApp**
   - Genera automáticamente el formato de mensaje
   - Botón para copiar y enviar al cliente
   - Incluye toda la información del vuelo

### **¿Quién puede usarlo?**
- **Asesores**: Crear y editar sus propios vuelos
- **Administradores**: Ver y editar todos los vuelos

### **Pantallas**
- 📋 **Lista de Vuelos**: Ver todos los vuelos con filtros
- ➕ **Crear Vuelo**: Formulario completo de registro
- 👁️ **Detalle de Vuelo**: Ver toda la información y documentos
- ✏️ **Editar Vuelo**: Modificar información

---

## 💰 MÓDULO 2: GESTIÓN DE PAGOS

### **¿Qué hace?**
Controla el proceso de confirmación de pagos. Cuando un cliente paga, el asesor lo registra aquí y espera que administración lo confirme.

### **Funcionalidades**

#### **Para Asesores:**
1. **Registrar Pago**
   - Indicar monto pagado
   - Seleccionar método (Zelle, Transferencia, Tarjeta, etc.)
   - Ingresar número de referencia
   - Subir foto/PDF del comprobante
   - Estado inicial: "Pendiente de Confirmación"

2. **Ver Estado del Pago**
   - Saber si fue confirmado o rechazado
   - Ver motivo de rechazo (si aplica)
   - Recibir notificación cuando se confirme

#### **Para Administración:**
1. **Revisar Pagos Pendientes**
   - Ver lista de pagos esperando confirmación
   - Ver comprobante adjunto
   - Ver datos del vuelo asociado

2. **Confirmar o Rechazar**
   - Botón "Confirmar Pago" → pasa al siguiente paso
   - Botón "Rechazar" → vuelve al asesor con motivo
   - Queda registrado quién confirmó y cuándo

### **Estados del Pago**
```
PENDIENTE → CONFIRMADO → Pasa a Emisiones
         ↓
      RECHAZADO → Vuelve al Asesor
```

### **¿Quién puede usarlo?**
- **Asesores**: Registrar pagos, ver estado
- **Admin de Pagos**: Confirmar/rechazar pagos
- **Administradores**: Ver todos los pagos y reportes

### **Pantallas**
- 💳 **Registrar Pago**: Formulario para el asesor
- 📊 **Dashboard de Pagos**: Lista de pagos pendientes (Admin)
- ✅ **Confirmar Pago**: Pantalla de revisión con comprobante

---

## ✈️ MÓDULO 3: GESTIÓN DE EMISIONES

### **¿Qué hace?**
Gestiona el proceso de emisión del boleto. Una vez el pago está confirmado, entra aquí para que el encargado de emisiones (Joan) verifique que todo esté completo y luego administración decida cómo emitir.

### **Funcionalidades**

#### **Fase 1: Verificación (Joan)**
1. **Recibir Solicitudes de Emisión**
   - Solo llegan vuelos con pago confirmado
   - Ver toda la información del vuelo
   - Ver todos los documentos adjuntos
   - Recibir notificación por correo

2. **Verificar Información Completa**
   - Checklist de verificación:
     - ✓ Pasaportes subidos
     - ✓ Teléfono del cliente
     - ✓ Pago confirmado
     - ✓ Datos completos del vuelo
   
3. **Aprobar o Rechazar**
   - Si todo está OK: "Verificar" → pasa a Admin
   - Si falta algo: "Rechazar" → vuelve al asesor con nota de qué falta

4. **Generar Listado**
   - Crear lista de boletos verificados
   - Enviar a administración para decisión

#### **Fase 2: Decisión de Método (Administración)**
1. **Recibir Listado de Boletos Verificados**
   - Ver todos los boletos listos para emitir
   - Ver información financiera de cada uno

2. **Decidir Método de Emisión**
   
   **OPCIÓN A: Emitir a Crédito**
   - El proveedor da 7 días para pagar
   - Sistema crea automáticamente una deuda
   - Alerta 3 días antes del vencimiento
   
   **OPCIÓN B: Emitir Contra Pago**
   - Pago inmediato con tarjeta
   - Seleccionar qué tarjeta usar:
     - Tarjeta Chase
     - Tarjeta Nova
     - Tarjeta Colombia
     - Otra tarjeta
   - Registrar últimos 4 dígitos
   - Registrar monto cobrado

#### **Fase 3: Emisión Final (Joan)**
1. **Recibir Instrucciones**
   - Ver método de emisión aprobado
   - Ver tarjeta a usar (si aplica)

2. **Emitir Boleto**
   - Emitir según instrucciones
   - Registrar número de boleto
   - Marcar como "Emitido"
   - **Ciclo cerrado**

### **Estados de Emisión**
```
PENDIENTE VERIFICACIÓN → VERIFICADO → PENDIENTE EMISIÓN → EMITIDO
                      ↓
                  RECHAZADO → Vuelve al Asesor
```

### **¿Quién puede usarlo?**
- **Encargado de Emisiones (Joan)**: Verificar y emitir
- **Admin de Emisiones**: Decidir método de emisión
- **Administradores**: Ver todo el proceso

### **Pantallas**
- 📋 **Lista de Emisiones Pendientes**: Para Joan
- ✓ **Verificar Emisión**: Checklist de información
- 💳 **Decidir Método**: Selector de método de emisión
- 📝 **Emitir Boleto**: Formulario final de emisión

---

## 💵 MÓDULO 4: GESTIÓN DE DEUDAS

### **¿Qué hace?**
Cuando se emite un boleto "a crédito", el sistema crea automáticamente una deuda con el proveedor. Este módulo ayuda a no olvidar pagarlas.

### **Funcionalidades**

1. **Creación Automática de Deudas**
   - Cuando Admin selecciona "Emitir a Crédito"
   - Sistema crea deuda automáticamente
   - Fecha de vencimiento: 7 días después
   - Estado: "Pendiente"

2. **Alertas de Vencimiento**
   - **3 días antes**: Alerta amarilla
   - **Día del vencimiento**: Alerta naranja
   - **Deuda vencida**: Alerta roja urgente

3. **Dashboard de Deudas**
   - Ver todas las deudas pendientes
   - Filtrar por proveedor (SABRE, Expedia, etc.)
   - Ver días restantes para vencimiento
   - Ver monto total adeudado

4. **Registrar Pago de Deuda**
   - Marcar deuda como pagada
   - Subir comprobante de pago al proveedor
   - Registrar fecha y referencia
   - Estado: "Pagada"

5. **Reportes**
   - Total adeudado por proveedor
   - Deudas próximas a vencer
   - Historial de deudas pagadas

### **Estados de Deuda**
```
PENDIENTE → PAGADA
    ↓
 VENCIDA (si no se paga a tiempo)
```

### **¿Quién puede usarlo?**
- **Admin de Deudas**: Gestionar y pagar deudas
- **Administradores**: Ver reportes y alertas

### **Pantallas**
- 🚨 **Dashboard de Deudas**: Vista principal con alertas
- 💳 **Pagar Deuda**: Formulario de registro de pago
- 📊 **Reporte de Deudas**: Por proveedor y estado

---

## ⚠️ MÓDULO 5: GESTIÓN DE ANULABLES

### **¿Qué hace?**
Gestiona los casos de vuelos que pueden ser anulados (principalmente vuelos de migración). Ayuda a no perder dinero recordando cuándo se puede anular.

### **Funcionalidades**

1. **Creación Automática**
   - Cuando se crea un vuelo tipo "Migración"
   - Sistema crea caso de anulable automáticamente
   - Calcula fecha límite (7 días antes del vuelo)
   - Estado inicial: "Pendiente"

2. **Alertas Urgentes**
   - Si faltan 3 días o menos para la fecha límite
   - Tarjeta con borde rojo y badge "¡URGENTE!"
   - Contador de casos urgentes
   - Animación pulsante

3. **Gestión del Caso**
   - Ver información del vuelo asociado
   - Actualizar estado:
     - **Pendiente**: Esperando decisión
     - **Anulado**: Se canceló el vuelo
     - **No Anulado**: Vuelo confirmado
   - Registrar fecha de anulación
   - Registrar monto recuperado
   - Agregar motivo y observaciones

4. **Enlace Bidireccional**
   - Desde el vuelo → ver su anulable
   - Desde el anulable → ver el vuelo original
   - Navegación fácil entre ambos

### **Estados de Anulable**
```
PENDIENTE → ANULADO (se recupera dinero)
         ↓
      NO ANULADO (vuelo confirmado)
```

### **¿Quién puede usarlo?**
- **Asesores**: Ver sus casos de anulables
- **Admin de Anulables**: Gestionar todos los casos
- **Administradores**: Ver reportes y métricas

### **Pantallas**
- 📋 **Lista de Anulables**: Con alertas urgentes
- 👁️ **Detalle de Anulable**: Información completa
- ✏️ **Gestionar Anulable**: Actualizar estado y datos

---

## 📅 MÓDULO 6: TIMELINE (LÍNEA DE TIEMPO)

### **¿Qué hace?**
Es como un "historial médico" del vuelo. Registra TODO lo que pasa con cada vuelo, quién lo hizo y cuándo.

### **Funcionalidades**

1. **Registro Automático de Eventos**
   - Vuelo creado
   - Pago registrado
   - Pago confirmado/rechazado
   - Enviado a emisiones
   - Emisión verificada/rechazada
   - Método de emisión decidido
   - Boleto emitido
   - Deuda creada
   - Deuda pagada
   - Anulable creado
   - Anulable actualizado
   - Documentos subidos/eliminados

2. **Información de Cada Evento**
   - ¿Qué pasó?
   - ¿Quién lo hizo?
   - ¿Cuándo?
   - Estado anterior y nuevo
   - Detalles adicionales

3. **Visualización**
   - Línea de tiempo visual
   - Iconos por tipo de evento
   - Colores según importancia
   - Orden cronológico

4. **Auditoría**
   - Saber exactamente qué pasó
   - Resolver disputas
   - Identificar cuellos de botella
   - Medir tiempos de cada fase

### **¿Quién puede usarlo?**
- **Todos los roles**: Ver timeline de sus vuelos
- **Administradores**: Ver timeline de todos los vuelos

### **Pantallas**
- 📅 **Timeline del Vuelo**: Vista cronológica completa
- 🔍 **Filtrar Eventos**: Por tipo, usuario, fecha

---

## 📊 MÓDULO 7: REPORTES Y DASHBOARDS

### **¿Qué hace?**
Proporciona visibilidad y métricas del negocio. Ayuda a tomar decisiones basadas en datos.

### **Funcionalidades**

#### **Dashboard Principal**
1. **Métricas Generales**
   - Total de vuelos activos
   - Vuelos pendientes por fase
   - Pagos pendientes de confirmación
   - Emisiones pendientes
   - Deudas pendientes
   - Casos urgentes de anulables

2. **Gráficos**
   - Vuelos por mes
   - Fee generado por mes
   - Vuelos por tipo
   - Vuelos por asesor
   - Métodos de emisión más usados

#### **Reportes Específicos**

**Reporte de Pagos**
- Total de pagos confirmados vs rechazados
- Tiempo promedio de confirmación
- Pagos por método
- Motivos de rechazo más comunes

**Reporte de Emisiones**
- Total de emisiones por mes
- Tiempo promedio del proceso
- Tasa de rechazo en verificación
- Distribución de métodos de emisión

**Reporte de Deudas**
- Total adeudado por proveedor
- Deudas próximas a vencer (7 días)
- Deudas vencidas
- Historial de pagos a proveedores

**Reporte de Anulables**
- Total de casos pendientes
- Casos urgentes
- Tasa de anulación por tipo de vuelo
- Monto total recuperado

**Reporte de Rendimiento**
- Tiempo total del ciclo (creación → emisión)
- Identificación de cuellos de botella
- Eficiencia por asesor
- Vuelos completados vs pendientes

### **¿Quién puede usarlo?**
- **Administradores**: Acceso completo a todos los reportes
- **Gerencia**: Dashboards ejecutivos

### **Pantallas**
- 📊 **Dashboard Principal**: Vista general del negocio
- 📈 **Reportes Detallados**: Por módulo
- 📥 **Exportar**: Excel, PDF de reportes

---

## 👥 ROLES Y PERMISOS

### **ROL 1: ASESOR**

**¿Qué puede hacer?**
- ✅ Crear vuelos
- ✅ Editar sus propios vuelos
- ✅ Ver sus propios vuelos
- ✅ Registrar pagos
- ✅ Subir documentos (pasaportes, comprobantes)
- ✅ Ver estado de sus pagos
- ✅ Ver estado de sus emisiones
- ✅ Ver sus casos de anulables
- ✅ Generar formato WhatsApp
- ✅ Ver timeline de sus vuelos

**¿Qué NO puede hacer?**
- ❌ Ver vuelos de otros asesores
- ❌ Confirmar pagos
- ❌ Verificar emisiones
- ❌ Decidir método de emisión
- ❌ Gestionar deudas
- ❌ Ver reportes generales

**Pantallas principales:**
- Mis Vuelos
- Crear Vuelo
- Registrar Pago
- Ver Estado

---

### **ROL 2: ADMIN DE PAGOS**

**¿Qué puede hacer?**
- ✅ Ver todos los pagos pendientes
- ✅ Confirmar pagos
- ✅ Rechazar pagos (con motivo)
- ✅ Ver comprobantes
- ✅ Ver historial de pagos
- ✅ Ver reportes de pagos

**¿Qué NO puede hacer?**
- ❌ Crear vuelos
- ❌ Verificar emisiones
- ❌ Decidir método de emisión
- ❌ Gestionar deudas

**Pantallas principales:**
- Dashboard de Pagos
- Confirmar/Rechazar Pago
- Reporte de Pagos

---

### **ROL 3: ENCARGADO DE EMISIONES (Joan)**

**¿Qué puede hacer?**
- ✅ Ver emisiones pendientes de verificación
- ✅ Verificar información completa
- ✅ Rechazar emisiones (si falta info)
- ✅ Generar listados para admin
- ✅ Ver instrucciones de método de emisión
- ✅ Emitir boletos
- ✅ Registrar número de boleto
- ✅ Ver todos los documentos del vuelo

**¿Qué NO puede hacer?**
- ❌ Confirmar pagos
- ❌ Decidir método de emisión
- ❌ Gestionar deudas

**Pantallas principales:**
- Emisiones Pendientes
- Verificar Emisión
- Emitir Boleto
- Generar Listado

---

### **ROL 4: ADMIN DE EMISIONES**

**¿Qué puede hacer?**
- ✅ Ver listado de emisiones verificadas
- ✅ Decidir método de emisión (crédito o contra pago)
- ✅ Seleccionar tarjeta para contra pago
- ✅ Ver reportes de emisiones
- ✅ Ver todas las emisiones

**¿Qué NO puede hacer?**
- ❌ Verificar emisiones (eso es de Joan)
- ❌ Emitir boletos (eso es de Joan)

**Pantallas principales:**
- Listado de Emisiones Verificadas
- Decidir Método de Emisión
- Reporte de Emisiones

---

### **ROL 5: ADMIN DE DEUDAS**

**¿Qué puede hacer?**
- ✅ Ver todas las deudas pendientes
- ✅ Ver alertas de vencimiento
- ✅ Registrar pago de deudas
- ✅ Subir comprobantes de pago a proveedores
- ✅ Ver historial de deudas
- ✅ Ver reportes de deudas por proveedor

**¿Qué NO puede hacer?**
- ❌ Crear deudas manualmente (se crean automáticamente)
- ❌ Eliminar deudas

**Pantallas principales:**
- Dashboard de Deudas
- Pagar Deuda
- Reporte de Deudas

---

### **ROL 6: ADMIN DE ANULABLES**

**¿Qué puede hacer?**
- ✅ Ver todos los casos de anulables
- ✅ Ver alertas urgentes
- ✅ Actualizar estado de anulables
- ✅ Registrar monto recuperado
- ✅ Agregar motivos y observaciones
- ✅ Ver reportes de anulables

**¿Qué NO puede hacer?**
- ❌ Crear anulables manualmente (se crean automáticamente)

**Pantallas principales:**
- Lista de Anulables
- Gestionar Anulable
- Reporte de Anulables

---

### **ROL 7: ADMINISTRADOR GENERAL**

**¿Qué puede hacer?**
- ✅ **TODO** lo que pueden hacer los demás roles
- ✅ Ver todos los vuelos
- ✅ Ver todos los reportes
- ✅ Gestionar usuarios
- ✅ Configurar el sistema
- ✅ Acceso completo a timeline
- ✅ Exportar reportes

**Pantallas principales:**
- Todas las pantallas del sistema
- Dashboard Ejecutivo
- Gestión de Usuarios
- Configuración

---

## 🔔 SISTEMA DE NOTIFICACIONES

### **¿Cómo funciona?**
El sistema envía notificaciones automáticas para que nadie tenga que estar preguntando "¿en qué estado está?"

### **Tipos de Notificaciones**

#### **En la Aplicación**
- Badge con número de notificaciones pendientes
- Panel de notificaciones
- Sonido (opcional)

#### **Por Email**
- Para eventos importantes
- Resumen diario (opcional)

#### **Por WhatsApp** (Futuro)
- Solo para urgentes
- Deudas vencidas
- Anulables urgentes

### **Eventos que Generan Notificaciones**

**Para Asesores:**
- ✉️ Tu pago fue confirmado
- ✉️ Tu pago fue rechazado (ver motivo)
- ✉️ Tu emisión fue rechazada (ver qué falta)
- ✉️ Tu boleto fue emitido
- ✉️ Tienes un caso de anulable urgente

**Para Admin de Pagos:**
- ✉️ Nuevo pago pendiente de confirmación
- ✉️ Tienes X pagos pendientes

**Para Joan (Emisiones):**
- ✉️ Nueva emisión pendiente de verificación
- ✉️ Método de emisión decidido (listo para emitir)

**Para Admin de Emisiones:**
- ✉️ Nueva emisión verificada (decidir método)
- ✉️ Tienes X emisiones pendientes de decisión

**Para Admin de Deudas:**
- 🚨 Deuda vence en 3 días
- 🚨 Deuda vence HOY
- 🚨 Tienes deudas vencidas

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

### **Ejemplo Práctico: Desde que el Cliente Compra hasta que se Emite**

#### **DÍA 1 - Lunes**
```
09:00 AM - Cliente llama para comprar vuelo
09:15 AM - ASESOR crea vuelo en el sistema
           - Ingresa todos los datos
           - Sube pasaportes
           - Sistema calcula fee automáticamente
           - Como es migración, crea anulable automático

09:30 AM - Cliente hace transferencia
09:45 AM - ASESOR registra pago
           - Sube comprobante
           - Estado: PENDIENTE_CONFIRMACION
           - Sistema notifica a Admin de Pagos

10:00 AM - ADMIN DE PAGOS revisa comprobante
           - Confirma que el pago es válido
           - Presiona "Confirmar Pago"
           - Sistema notifica a Asesor
           - Sistema notifica a Joan (Emisiones)
           - Sistema crea registro en Emisiones
```

#### **DÍA 1 - Lunes (continuación)**
```
10:30 AM - JOAN (Emisiones) recibe notificación
           - Revisa que esté toda la información
           - Verifica pasaportes ✓
           - Verifica pago confirmado ✓
           - Verifica datos completos ✓
           - Presiona "Verificar"
           - Agrega al listado del día

02:00 PM - JOAN envía listado a Admin de Emisiones
           - 15 boletos verificados listos para emitir

02:30 PM - ADMIN DE EMISIONES revisa listado
           - Para este vuelo decide: "Emitir a Crédito"
           - Sistema crea deuda automáticamente
           - Vencimiento: Lunes próximo (7 días)
           - Notifica a Joan
```

#### **DÍA 1 - Lunes (tarde)**
```
03:00 PM - JOAN recibe instrucción
           - Ve que debe emitir a crédito
           - Emite el boleto con el proveedor
           - Registra número de boleto
           - Presiona "Emitido"
           - Sistema notifica a Asesor
           - CICLO CERRADO ✓

03:15 PM - ASESOR recibe notificación
           - "Tu boleto fue emitido"
           - Genera formato WhatsApp
           - Envía al cliente
```

#### **DÍA 5 - Viernes (5 días después)**
```
09:00 AM - ADMIN DE DEUDAS recibe alerta
           - "Deuda vence en 3 días"
           - Revisa deudas pendientes
           - Programa pago para el lunes
```

#### **DÍA 8 - Lunes (día de vencimiento)**
```
09:00 AM - ADMIN DE DEUDAS recibe alerta urgente
           - "Deuda vence HOY"
           - Paga al proveedor
           - Registra pago en sistema
           - Sube comprobante
           - Marca como "Pagada"
           - Deuda cerrada ✓
```

---

## 📈 BENEFICIOS DEL SISTEMA

### **Para la Empresa**
- ✅ **Control total** del proceso
- ✅ **Trazabilidad completa** (timeline)
- ✅ **No se olvidan deudas** (alertas automáticas)
- ✅ **Métricas en tiempo real**
- ✅ **Menos errores humanos**
- ✅ **Escalable** (puede crecer sin caos)

### **Para los Asesores**
- ✅ **Claridad** del estado de cada vuelo
- ✅ **Menos preguntas** de clientes ("¿ya está?")
- ✅ **Notificaciones automáticas**
- ✅ **Generador de WhatsApp** (ahorra tiempo)
- ✅ **Historial completo** de cada vuelo

### **Para Administración**
- ✅ **Visibilidad** de todo el proceso
- ✅ **Alertas** de lo que requiere atención
- ✅ **Reportes** para tomar decisiones
- ✅ **Control de deudas** automático
- ✅ **Auditoría** de quién hizo qué

### **Para Joan (Emisiones)**
- ✅ Solo recibe casos **con pago confirmado**
- ✅ Toda la información **en un solo lugar**
- ✅ **Instrucciones claras** de cómo emitir
- ✅ **Menos WhatsApp**, más eficiencia

### **Para los Clientes**
- ✅ **Proceso más rápido**
- ✅ **Menos errores**
- ✅ **Información clara** (formato WhatsApp)
- ✅ **Mejor servicio**

---

## 🎯 RESUMEN EJECUTIVO

### **¿Qué problema resuelve?**
Actualmente todo se gestiona por WhatsApp, lo que genera:
- ❌ Mensajes perdidos
- ❌ Falta de claridad del estado
- ❌ Deudas olvidadas
- ❌ Procesos lentos
- ❌ Errores de comunicación

### **¿Cómo lo resuelve?**
Con un sistema centralizado donde:
- ✅ Todo queda registrado
- ✅ Cada persona sabe qué hacer
- ✅ Las alertas son automáticas
- ✅ El proceso es claro y trazable
- ✅ Se pueden ver métricas y reportes

### **¿Cuántos módulos tiene?**
**7 módulos integrados:**
1. Gestión de Vuelos
2. Gestión de Pagos
3. Gestión de Emisiones
4. Gestión de Deudas
5. Gestión de Anulables
6. Timeline (Historial)
7. Reportes y Dashboards

### **¿Cuántos roles hay?**
**7 roles con permisos específicos:**
1. Asesor
2. Admin de Pagos
3. Encargado de Emisiones (Joan)
4. Admin de Emisiones
5. Admin de Deudas
6. Admin de Anulables
7. Administrador General

### **¿Cuál es el flujo completo?**
```
Asesor crea vuelo
    ↓
Asesor registra pago
    ↓
Admin confirma pago
    ↓
Joan verifica información
    ↓
Admin decide método de emisión
    ↓
Joan emite boleto
    ↓
Si es a crédito → Sistema crea deuda
    ↓
Admin paga deuda antes del vencimiento
    ↓
PROCESO COMPLETO ✓
```

---

## 🚀 PRÓXIMOS PASOS

1. **Validar esta propuesta** con el equipo
2. **Ajustar** según feedback
3. **Priorizar** funcionalidades
4. **Comenzar implementación** por fases
5. **Capacitar** al equipo
6. **Lanzar** módulo por módulo

---

**Fecha**: Febrero 19, 2026
**Versión**: 1.0
**Estado**: 📋 Propuesta para Revisión
