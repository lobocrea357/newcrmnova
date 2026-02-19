# 🎯 BLUEPRINT: Sistema Completo de Gestión de Vuelos
## Integración de Módulos Existentes + Flujo Administrativo

---

## 📊 ESTADO ACTUAL (Implementado)

### ✅ Módulo de Vuelos
- Registro de información completa del vuelo
- Sistema de adjuntos (comprobantes y pasaportes)
- Cálculo automático de fee
- Generador de formato WhatsApp
- Integración con anulables

### ✅ Módulo de Anulables
- Gestión de casos de anulación
- Alertas urgentes
- Estados (PENDIENTE, ANULADO, NO_ANULADO)
- Integración bidireccional con vuelos

---

## 🔄 NUEVO FLUJO ADMINISTRATIVO COMPLETO

### **Análisis de Transcripciones del Cliente**

El cliente describe un **flujo de 4 etapas** con seguimiento completo:

#### **ETAPA 1: Registro de Pago** 
- Asesor sube información del pago
- Pago debe ser **confirmado** por administración
- Estados: `PENDIENTE_CONFIRMACION` → `CONFIRMADO` → `RECHAZADO`

#### **ETAPA 2: Solicitud de Emisión**
- Una vez confirmado el pago, pasa a grupo de emisiones
- Se envía toda la información (pasaporte, teléfono, etc.)
- Se envía correo al encargado de emisiones (Joan)

#### **ETAPA 3: Verificación y Listado**
- Encargado de emisiones verifica:
  - Que el pago fue confirmado
  - Que está toda la información completa
- Crea listado de boletos pendientes por emitir
- Envía listado a administración

#### **ETAPA 4: Decisión de Método de Emisión**
- Administración decide **cómo emitir**:
  - **Opción 1: A Crédito** (7 días para pagar al proveedor)
  - **Opción 2: Contra Pago** (pago inmediato con tarjeta)
    - Tarjeta Chase
    - Tarjeta Nova
    - Tarjeta Colombia
    - Otras tarjetas

#### **ETAPA 5: Emisión Final**
- Encargado emite según instrucciones
- Se registra método de emisión usado
- **Cierra el ciclo administrativo**

---

## 🏗️ ARQUITECTURA PROPUESTA

### **NUEVAS TABLAS NECESARIAS**

#### **1. Tabla: `vuelos_pagos`**
```sql
CREATE TABLE vuelos_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación
  vuelo_id UUID REFERENCES vuelos(id) ON DELETE CASCADE NOT NULL,
  
  -- Información del pago
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL, -- 'ZELLE', 'TRANSFERENCIA', 'TARJETA', etc.
  referencia TEXT,
  fecha_pago DATE NOT NULL,
  
  -- Estados del pago
  estado_pago TEXT DEFAULT 'PENDIENTE_CONFIRMACION' CHECK (
    estado_pago IN (
      'PENDIENTE_CONFIRMACION',
      'CONFIRMADO',
      'RECHAZADO'
    )
  ),
  
  -- Confirmación
  confirmado_por UUID, -- user_id del admin que confirmó
  fecha_confirmacion TIMESTAMP WITH TIME ZONE,
  motivo_rechazo TEXT,
  
  -- Adjuntos del pago
  comprobante_url TEXT,
  
  -- Observaciones
  observaciones TEXT
);

CREATE INDEX idx_vuelos_pagos_vuelo ON vuelos_pagos(vuelo_id);
CREATE INDEX idx_vuelos_pagos_estado ON vuelos_pagos(estado_pago);
CREATE INDEX idx_vuelos_pagos_fecha ON vuelos_pagos(fecha_pago);
```

#### **2. Tabla: `vuelos_emisiones`**
```sql
CREATE TABLE vuelos_emisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación
  vuelo_id UUID REFERENCES vuelos(id) ON DELETE CASCADE NOT NULL,
  pago_id UUID REFERENCES vuelos_pagos(id) NOT NULL,
  
  -- Estados de emisión
  estado_emision TEXT DEFAULT 'PENDIENTE_VERIFICACION' CHECK (
    estado_emision IN (
      'PENDIENTE_VERIFICACION',    -- Esperando que Joan verifique
      'VERIFICADO',                 -- Joan verificó, esperando decisión admin
      'PENDIENTE_EMISION',          -- Admin decidió método, esperando emisión
      'EMITIDO',                    -- Boleto emitido
      'RECHAZADO'                   -- Rechazado por falta de info
    )
  ),
  
  -- Verificación (Joan)
  verificado_por UUID, -- user_id de Joan
  fecha_verificacion TIMESTAMP WITH TIME ZONE,
  informacion_completa BOOLEAN DEFAULT FALSE,
  motivo_rechazo TEXT,
  
  -- Decisión de método de emisión (Admin)
  metodo_emision TEXT CHECK (
    metodo_emision IN (
      'CREDITO',           -- A crédito con proveedor
      'CONTRA_PAGO_CHASE',
      'CONTRA_PAGO_NOVA',
      'CONTRA_PAGO_COLOMBIA',
      'CONTRA_PAGO_OTRA'
    )
  ),
  decidido_por UUID, -- user_id del admin que decidió
  fecha_decision TIMESTAMP WITH TIME ZONE,
  
  -- Emisión final
  emitido_por UUID, -- user_id de quien emitió
  fecha_emision TIMESTAMP WITH TIME ZONE,
  numero_boleto TEXT,
  
  -- Si es a crédito
  dias_credito INTEGER DEFAULT 7,
  fecha_vencimiento_credito DATE,
  
  -- Si es contra pago
  tarjeta_usada TEXT,
  ultimos_4_digitos TEXT,
  monto_cobrado DECIMAL(10,2),
  
  -- Correo enviado
  correo_enviado BOOLEAN DEFAULT FALSE,
  fecha_envio_correo TIMESTAMP WITH TIME ZONE,
  
  -- Observaciones
  observaciones TEXT
);

CREATE INDEX idx_vuelos_emisiones_vuelo ON vuelos_emisiones(vuelo_id);
CREATE INDEX idx_vuelos_emisiones_estado ON vuelos_emisiones(estado_emision);
CREATE INDEX idx_vuelos_emisiones_metodo ON vuelos_emisiones(metodo_emision);
CREATE INDEX idx_vuelos_emisiones_fecha_vencimiento ON vuelos_emisiones(fecha_vencimiento_credito);
```

#### **3. Tabla: `vuelos_deudas_proveedor`**
```sql
CREATE TABLE vuelos_deudas_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación
  emision_id UUID REFERENCES vuelos_emisiones(id) NOT NULL,
  vuelo_id UUID REFERENCES vuelos(id) NOT NULL,
  
  -- Información de la deuda
  proveedor TEXT NOT NULL, -- 'SABRE', 'EXPEDIA', etc.
  monto_deuda DECIMAL(10,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  
  -- Estado de la deuda
  estado_deuda TEXT DEFAULT 'PENDIENTE' CHECK (
    estado_deuda IN (
      'PENDIENTE',
      'PAGADA',
      'VENCIDA',
      'PARCIALMENTE_PAGADA'
    )
  ),
  
  -- Pago de la deuda
  monto_pagado DECIMAL(10,2) DEFAULT 0,
  fecha_pago DATE,
  referencia_pago TEXT,
  
  -- Alertas
  dias_para_vencimiento INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (fecha_vencimiento - CURRENT_DATE))
  ) STORED,
  
  -- Observaciones
  observaciones TEXT
);

CREATE INDEX idx_deudas_emision ON vuelos_deudas_proveedor(emision_id);
CREATE INDEX idx_deudas_estado ON vuelos_deudas_proveedor(estado_deuda);
CREATE INDEX idx_deudas_vencimiento ON vuelos_deudas_proveedor(fecha_vencimiento);
CREATE INDEX idx_deudas_proveedor ON vuelos_deudas_proveedor(proveedor);
```

#### **4. Tabla: `vuelos_timeline` (Auditoría/Historial)**
```sql
CREATE TABLE vuelos_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relación
  vuelo_id UUID REFERENCES vuelos(id) ON DELETE CASCADE NOT NULL,
  
  -- Evento
  tipo_evento TEXT NOT NULL CHECK (
    tipo_evento IN (
      'VUELO_CREADO',
      'PAGO_REGISTRADO',
      'PAGO_CONFIRMADO',
      'PAGO_RECHAZADO',
      'ENVIADO_A_EMISION',
      'EMISION_VERIFICADA',
      'EMISION_RECHAZADA',
      'METODO_EMISION_DECIDIDO',
      'BOLETO_EMITIDO',
      'DEUDA_CREADA',
      'DEUDA_PAGADA',
      'ANULABLE_CREADO',
      'ANULABLE_ACTUALIZADO',
      'ADJUNTO_SUBIDO',
      'ADJUNTO_ELIMINADO'
    )
  ),
  
  -- Detalles del evento
  descripcion TEXT NOT NULL,
  usuario_id UUID, -- Quién realizó la acción
  usuario_nombre TEXT,
  
  -- Datos adicionales (JSON)
  metadata JSONB,
  
  -- Estado anterior y nuevo (para cambios de estado)
  estado_anterior TEXT,
  estado_nuevo TEXT
);

CREATE INDEX idx_timeline_vuelo ON vuelos_timeline(vuelo_id);
CREATE INDEX idx_timeline_tipo ON vuelos_timeline(tipo_evento);
CREATE INDEX idx_timeline_fecha ON vuelos_timeline(created_at DESC);
```

---

## 🔄 FLUJO COMPLETO INTEGRADO

### **FASE 1: Creación del Vuelo** ✅ (Ya implementado)
```
1. Asesor crea vuelo con toda la información
2. Sube pasaportes
3. Sistema calcula fee automáticamente
4. Si es tipo MIGRACIÓN → crea anulable automático
```

### **FASE 2: Registro y Confirmación de Pago** 🆕
```
1. Asesor registra pago en sistema
   - Sube comprobante de pago
   - Indica método (Zelle, transferencia, etc.)
   - Indica monto y referencia
   - Estado: PENDIENTE_CONFIRMACION

2. Notificación a grupo de "Pagos" (Admin)

3. Admin revisa comprobante
   - Si es válido: CONFIRMA pago
   - Si no: RECHAZA con motivo
   
4. Timeline: "PAGO_CONFIRMADO" o "PAGO_RECHAZADO"
```

### **FASE 3: Solicitud de Emisión** 🆕
```
1. Una vez pago CONFIRMADO:
   - Sistema crea registro en vuelos_emisiones
   - Estado: PENDIENTE_VERIFICACION
   - Envía notificación a grupo "Emisiones"
   - Envía correo a Joan (encargado de emisiones)

2. Timeline: "ENVIADO_A_EMISION"

3. Información disponible para Joan:
   - Datos del vuelo
   - Pasaportes adjuntos
   - Teléfono del cliente
   - Comprobante de pago confirmado
   - Toda la información necesaria
```

### **FASE 4: Verificación por Emisiones** 🆕
```
1. Joan (encargado de emisiones) verifica:
   - Que el pago fue confirmado ✓
   - Que están todos los documentos ✓
   - Que la información está completa ✓

2. Si falta algo:
   - Marca como RECHAZADO
   - Indica qué falta
   - Vuelve a asesor

3. Si todo está OK:
   - Marca como VERIFICADO
   - Crea listado de boletos pendientes
   - Envía listado a administración

4. Timeline: "EMISION_VERIFICADA" o "EMISION_RECHAZADA"
```

### **FASE 5: Decisión de Método de Emisión** 🆕
```
1. Admin recibe listado de boletos verificados

2. Para cada boleto, decide método:
   
   OPCIÓN A: A CRÉDITO
   - Selecciona "CREDITO"
   - Sistema crea deuda en vuelos_deudas_proveedor
   - Fecha vencimiento: +7 días
   - Estado deuda: PENDIENTE
   
   OPCIÓN B: CONTRA PAGO
   - Selecciona tarjeta específica:
     * CONTRA_PAGO_CHASE
     * CONTRA_PAGO_NOVA
     * CONTRA_PAGO_COLOMBIA
     * CONTRA_PAGO_OTRA
   - Registra últimos 4 dígitos
   - Registra monto cobrado

3. Estado emisión: PENDIENTE_EMISION

4. Timeline: "METODO_EMISION_DECIDIDO"
```

### **FASE 6: Emisión Final** 🆕
```
1. Joan recibe instrucciones de método de emisión

2. Emite boleto según método indicado

3. Registra:
   - Número de boleto
   - Fecha de emisión
   - Confirmación de método usado

4. Estado emisión: EMITIDO

5. Timeline: "BOLETO_EMITIDO"

6. CICLO ADMINISTRATIVO CERRADO ✓
```

### **FASE 7: Seguimiento de Deudas** 🆕 (Si fue a crédito)
```
1. Sistema monitorea deudas pendientes

2. Alertas automáticas:
   - 3 días antes del vencimiento
   - Día del vencimiento
   - Deudas vencidas

3. Admin paga deuda:
   - Registra pago
   - Sube comprobante
   - Estado: PAGADA

4. Timeline: "DEUDA_PAGADA"
```

### **FASE 8: Gestión de Anulables** ✅ (Ya implementado)
```
1. Si el vuelo requiere anulable
2. Seguimiento de fecha límite
3. Actualización de estado
4. Registro de monto recuperado
```

---

## 📱 INTERFACES DE USUARIO NECESARIAS

### **1. Dashboard de Pagos** 🆕
```
Ruta: /vuelos/pagos

Funcionalidades:
- Lista de pagos pendientes de confirmación
- Filtros por estado, fecha, asesor
- Botón "Confirmar" / "Rechazar"
- Vista de comprobante
- Historial de pagos confirmados/rechazados
```

### **2. Dashboard de Emisiones** 🆕
```
Ruta: /vuelos/emisiones

Funcionalidades:
- Lista de emisiones pendientes de verificación
- Checklist de información completa
- Botón "Verificar" / "Rechazar"
- Generación de listado para admin
- Vista de todos los documentos
```

### **3. Panel de Decisión de Método** 🆕
```
Ruta: /vuelos/emisiones/decidir

Funcionalidades:
- Listado de emisiones verificadas
- Selector de método de emisión
- Formulario según método:
  * Si crédito: días de crédito
  * Si contra pago: selección de tarjeta
- Botón "Aprobar emisión"
```

### **4. Dashboard de Deudas** 🆕
```
Ruta: /vuelos/deudas

Funcionalidades:
- Lista de deudas pendientes
- Alertas de vencimiento
- Filtros por proveedor, estado
- Registro de pago de deuda
- Historial de deudas pagadas
```

### **5. Timeline de Vuelo** 🆕
```
Ruta: /vuelos/[id]/timeline

Funcionalidades:
- Línea de tiempo visual
- Todos los eventos del vuelo
- Quién hizo qué y cuándo
- Estados anteriores y nuevos
- Documentos asociados a cada evento
```

### **6. Vista Mejorada de Detalle de Vuelo** 🔄
```
Ruta: /vuelos/[id] (actualizar)

Agregar secciones:
- Estado actual del flujo (visual)
- Información de pago (si existe)
- Estado de emisión (si existe)
- Deudas pendientes (si existen)
- Timeline completo
- Acciones disponibles según estado
```

---

## 🎨 COMPONENTES REACT NECESARIOS

### **Nuevos Componentes**

1. **`PagoForm.jsx`** - Formulario para registrar pago
2. **`PagoCard.jsx`** - Tarjeta de pago en lista
3. **`PagosList.jsx`** - Lista de pagos con filtros
4. **`PagoDetail.jsx`** - Detalle de pago con confirmación

5. **`EmisionCard.jsx`** - Tarjeta de emisión
6. **`EmisionsList.jsx`** - Lista de emisiones
7. **`EmisionVerificacion.jsx`** - Checklist de verificación
8. **`EmisionDecision.jsx`** - Selector de método

9. **`DeudaCard.jsx`** - Tarjeta de deuda con alerta
10. **`DeudasList.jsx`** - Lista de deudas
11. **`DeudaPagoForm.jsx`** - Formulario para pagar deuda

12. **`VueloTimeline.jsx`** - Línea de tiempo visual
13. **`VueloEstadoFlow.jsx`** - Diagrama de flujo del estado actual

---

## 🔔 SISTEMA DE NOTIFICACIONES

### **Eventos que Generan Notificaciones**

1. **Pago Registrado** → Notificar a Admin (grupo Pagos)
2. **Pago Confirmado** → Notificar a Asesor y Joan (grupo Emisiones)
3. **Pago Rechazado** → Notificar a Asesor
4. **Emisión Verificada** → Notificar a Admin
5. **Emisión Rechazada** → Notificar a Asesor
6. **Método Decidido** → Notificar a Joan
7. **Boleto Emitido** → Notificar a Asesor y Cliente
8. **Deuda Próxima a Vencer** → Notificar a Admin (3 días antes)
9. **Deuda Vencida** → Notificar a Admin (urgente)
10. **Anulable Urgente** → Notificar a responsable

### **Canales de Notificación**

- ✅ **En la aplicación** (badge, panel de notificaciones)
- 📧 **Email** (para eventos importantes)
- 💬 **WhatsApp** (opcional, para urgentes)
- 🔔 **Push notifications** (futuro)

---

## 📊 REPORTES Y MÉTRICAS

### **Dashboards Analíticos**

1. **Dashboard de Pagos**
   - Total de pagos pendientes
   - Tasa de confirmación
   - Tiempo promedio de confirmación
   - Pagos rechazados (motivos)

2. **Dashboard de Emisiones**
   - Emisiones pendientes
   - Tiempo promedio de verificación
   - Tasa de rechazo
   - Métodos de emisión más usados

3. **Dashboard de Deudas**
   - Total de deudas pendientes
   - Deudas por vencer (próximos 7 días)
   - Deudas vencidas
   - Deudas por proveedor
   - Monto total adeudado

4. **Dashboard de Rendimiento**
   - Tiempo total del ciclo (creación → emisión)
   - Cuellos de botella
   - Eficiencia por asesor
   - Vuelos completados vs pendientes

---

## 🔐 PERMISOS Y ROLES

### **Roles Necesarios**

1. **Asesor**
   - Crear vuelos
   - Registrar pagos
   - Ver sus propios vuelos
   - Subir documentos

2. **Admin Pagos**
   - Ver todos los pagos
   - Confirmar/rechazar pagos
   - Ver reportes de pagos

3. **Encargado de Emisiones (Joan)**
   - Ver emisiones pendientes
   - Verificar información
   - Emitir boletos
   - Ver listados

4. **Admin Emisiones**
   - Ver emisiones verificadas
   - Decidir método de emisión
   - Ver deudas
   - Pagar deudas

5. **Super Admin**
   - Acceso total
   - Gestión de usuarios
   - Ver todos los reportes

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Base de Datos y Backend** (Semana 1-2)
- [ ] Crear migraciones SQL para nuevas tablas
- [ ] Implementar API routes para pagos
- [ ] Implementar API routes para emisiones
- [ ] Implementar API routes para deudas
- [ ] Implementar API route para timeline
- [ ] Crear triggers y funciones automáticas

### **FASE 2: Módulo de Pagos** (Semana 2-3)
- [ ] Componente PagoForm
- [ ] Componente PagosList
- [ ] Página de gestión de pagos
- [ ] Lógica de confirmación/rechazo
- [ ] Integración con timeline

### **FASE 3: Módulo de Emisiones** (Semana 3-4)
- [ ] Componente EmisionVerificacion
- [ ] Componente EmisionDecision
- [ ] Página de emisiones
- [ ] Lógica de verificación
- [ ] Generación de listados

### **FASE 4: Módulo de Deudas** (Semana 4-5)
- [ ] Componente DeudasList
- [ ] Sistema de alertas de vencimiento
- [ ] Formulario de pago de deudas
- [ ] Dashboard de deudas

### **FASE 5: Timeline y Notificaciones** (Semana 5-6)
- [ ] Componente VueloTimeline
- [ ] Sistema de notificaciones en app
- [ ] Emails automáticos
- [ ] Integración con todos los módulos

### **FASE 6: Dashboards y Reportes** (Semana 6-7)
- [ ] Dashboard de pagos
- [ ] Dashboard de emisiones
- [ ] Dashboard de deudas
- [ ] Dashboard de rendimiento
- [ ] Exportación de reportes

### **FASE 7: Testing y Optimización** (Semana 7-8)
- [ ] Testing de flujo completo
- [ ] Optimización de queries
- [ ] Ajustes de UX
- [ ] Documentación
- [ ] Capacitación de usuarios

---

## 📋 RESUMEN DE INTEGRACIÓN

### **Lo que YA TENEMOS** ✅
```
Vuelos → Anulables
- Creación de vuelo
- Adjuntos (pasaportes, comprobantes)
- Cálculo de fee
- Gestión de anulables
- Formato WhatsApp
```

### **Lo que NECESITAMOS AGREGAR** 🆕
```
Vuelos → Pagos → Emisiones → Deudas
- Registro y confirmación de pagos
- Verificación de emisiones
- Decisión de método de emisión
- Seguimiento de deudas a proveedores
- Timeline completo
- Notificaciones automáticas
- Dashboards analíticos
```

### **FLUJO COMPLETO FINAL**
```
1. Asesor crea vuelo ✅
2. Asesor registra pago 🆕
3. Admin confirma pago 🆕
4. Sistema envía a emisiones 🆕
5. Joan verifica información 🆕
6. Admin decide método de emisión 🆕
7. Joan emite boleto 🆕
8. Si es a crédito → crea deuda 🆕
9. Sistema alerta vencimiento deuda 🆕
10. Admin paga deuda 🆕
11. Si requiere anulable → gestión ✅
12. Timeline completo visible 🆕
```

---

## 💡 BENEFICIOS DEL SISTEMA COMPLETO

### **Para Asesores**
- ✅ Visibilidad completa del estado de sus vuelos
- ✅ Notificaciones automáticas de cambios
- ✅ Menos preguntas de "¿en qué estado está?"
- ✅ Proceso claro y estructurado

### **Para Administración**
- ✅ Control total del flujo de pagos
- ✅ Seguimiento de deudas automático
- ✅ Alertas de vencimientos
- ✅ Reportes en tiempo real
- ✅ Auditoría completa (timeline)

### **Para Emisiones (Joan)**
- ✅ Solo recibe casos con pago confirmado
- ✅ Toda la información en un solo lugar
- ✅ Checklist claro de verificación
- ✅ Instrucciones claras de método de emisión

### **Para la Empresa**
- ✅ Reducción de errores
- ✅ Menos comunicación por WhatsApp
- ✅ Métricas de rendimiento
- ✅ Identificación de cuellos de botella
- ✅ Mejor control financiero
- ✅ Escalabilidad

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Validar este blueprint con el cliente**
   - Confirmar que el flujo es correcto
   - Ajustar según feedback
   - Priorizar funcionalidades

2. **Crear plan de implementación detallado**
   - Definir sprints
   - Asignar recursos
   - Establecer fechas

3. **Comenzar con FASE 1**
   - Diseño de base de datos
   - API routes básicos
   - Testing de estructura

---

**Fecha de Creación**: Febrero 19, 2026
**Versión**: 1.0.0
**Estado**: 📋 Blueprint - Pendiente de Aprobación
