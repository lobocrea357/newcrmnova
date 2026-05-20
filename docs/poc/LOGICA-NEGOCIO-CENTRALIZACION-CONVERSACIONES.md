# 📋 Lógica de Negocio: Centralización de Conversaciones y Sistema de Eventos

**Fecha:** 19 de Mayo, 2026  
**Versión:** 1.0  
**Dominio:** ERP Nova CRM - Módulo POC Conversaciones

---

## 🎯 Objetivo Principal del Sistema

El objetivo del módulo de Conversaciones POC es proporcionar **una vista unificada y completa** de cada cliente, permitiendo a los administradores ver todo el historial de interacción en un solo lugar, identificar cuando se concretó una venta, y hacer seguimiento del estado del lead a lo largo del tiempo.

---

## 📊 Problema de Negocio que Resuelve

### Problema Original: Fragmentación de Conversaciones

**Contexto:**
- Los clientes interactúan con múltiples bots (adriana_nova_moises, daniela_morales_apolo_moises, juan_flash_moises, sabrina_apolo_moises)
- Cada bot tiene su propio chat en WhatsApp
- Si un cliente cambia de bot, la conversación se fragmenta en múltiples chats
- Los asesores no pueden ver el historial completo del cliente
- No se sabe cuándo un cliente compró o en qué estado del proceso está

**Consecuencias:**
- ❌ Experiencia del cliente fragmentada
- ❌ Asesores sin contexto completo
- ❌ Imposible rastrear conversiones
- ❌ No se puede medir efectividad de asesores
- ❌ Pérdida de información crítica

---

## 🏗️ Solución: Centralización por Cliente

### Concepto: Thread (Hilo) por Cliente

**Definición:** Un `Thread` es una agrupación lógica de todos los chats de un mismo cliente (identificado por número de teléfono), sin importar con qué bot interactuó.

**Ejemplo:**
```
Cliente: Juan Pérez (+584141234567)

Chats fragmentados:
- Chat 1: Bot A (adriana_nova_moises) - 15 mensajes
- Chat 2: Bot B (juan_flash_moises) - 8 mensajes
- Chat 3: Bot C (sabrina_apolo_moises) - 3 mensajes

Thread centralizado:
- Thread ID: abc-123-def
- Cliente: Juan Pérez
- Teléfono: +584141234567
- Total mensajes: 26
- Chats vinculados: 3
- Bots involucrados: A, B, C
```

---

## 🔄 Flujo de Sincronización

### 1. Sincronización Incremental

**Mecanismo:**
- El sistema se conecta a la base de datos de WhatsApp (Waha/Supabase)
- Lee todos los chats de los bots POC específicos
- Agrupa chats por número de teléfono del cliente
- Crea o actualiza un `Thread` por cada número único
- Vincula todos los chats de ese cliente al thread
- Calcula métricas agregadas (total mensajes, cotizaciones, menciones de pago)

**Frecuencia:**
- Manual: Endpoint `/api/poc/sync` para sincronizar on-demand
- Automático: Webhook que se activa cuando llega un nuevo mensaje

**Bots incluidos en POC:**
- `adriana_nova_moises`
- `daniela_morales_apolo_moises`
- `juan_flash_moises`
- `sabrina_apolo_moises`

---

## 📈 Métricas del Thread

### Métricas Calculadas

**Tabla: `poc_thread_metrics`**

1. **total_messages**: Cantidad total de mensajes en el thread
2. **total_chats**: Cantidad de chats diferentes (bots) vinculados
3. **advisors**: Array de nombres de bots que interactuaron con el cliente
4. **avg_response_minutes**: Tiempo promedio de respuesta (si es aplicable)
5. **payment_mentions**: Cantidad de veces que el cliente mencionó temas de pago
6. **cotizacion_count**: Cantidad de cotizaciones enviadas

**Propósito:**
- Identificar threads fragmentados (múltiples bots)
- Medir nivel de interacción
- Detectar intención de compra
- Identificar leads calientes

---

## 🎨 Vista de Timeline

### Timeline de Mensajes

**Propósito:** Mostrar el historial completo de conversación en orden cronológico.

**Características:**
- Muestra todos los mensajes de todos los chats vinculados
- Identifica el remitente (bot o cliente)
- Muestra timestamp de cada mensaje
- Detecta reasignaciones (cuando cambia el bot que atiende)

**Detección de Reasignaciones:**
```
Mensaje 1: Bot A → Cliente
Mensaje 2: Cliente → Bot A
Mensaje 3: Bot B → Cliente  ← REASIGNACIÓN DETECTADA
Mensaje 4: Cliente → Bot B
```

**Visualización:**
```
┌─────────────────────────────────┐
│ 10:25 Bot A: Hola, ¿en qué puedo ayudarte? │
│ 10:26 Cliente: Necesito un vuelo a Miami │
│ 10:27 Bot A: ¡Con gusto! ¿Para cuántas personas? │
│                                     │
│ 🔄 REASIGNACIÓN: Bot A → Bot B    │
│                                     │
│ 14:30 Bot B: Continúo con tu solicitud │
│ 14:31 Cliente: Perfecto, gracias │
└─────────────────────────────────┘
```

---

## 🎯 Sistema de Estados del Lead

### Estados Granulares

**Tabla: `poc_thread_status`**

**Estados definidos:**

#### 1. NUEVO
**Definición:** Primer contacto con el cliente, sin interacción profunda.
**Transición automática:** → EN_NEGOCIACION cuando se envía una cotización
**Transición manual:** → EN_NEGOCIACION (asesor lo marca)

#### 2. EN_NEGOCIACION
**Definición:** Cliente en conversación activa, enviando cotizaciones, negociando.
**Transición automática:** → VENTA_CONCRETADA cuando se crea un vuelo
**Transición automática:** → PERDIDO después de 7 días sin actividad
**Transición manual:** → VENTA_CONCRETADA (asesor marca venta)
**Transición manual:** → PERDIDO (asesor marca perdido)

#### 3. VENTA_CONCRETADA
**Definición:** Cliente realizó una compra (se creó un vuelo).
**Transición automática:** → POST_VENTA después de la fecha del viaje
**Transición manual:** → POST_VENTA (asesor inicia seguimiento)
**Transición manual:** → EN_NEGOCIACION (nueva venta en proceso)

#### 4. POST_VENTA
**Definición:** Cliente ya viajó, en fase de seguimiento post-compra.
**Transición manual:** → EN_NEGOCIACION (nuevo viaje)
**Transición manual:** → PERDIDO (cliente no responde)

#### 5. PERDIDO
**Definición:** Cliente no compró o no responde después de múltiples intentos.
**Transición manual:** → EN_NEGOCIACION (reactivación)
**Transición manual:** → LEAD_REACTIVATED (evento de reactivación)

---

## 🎉 Sistema de Eventos

### Propósito

Marcar hitos importantes en el timeline de conversaciones, permitiendo:
- Identificar CUÁNDO ocurrió una venta
- Registrar cotizaciones enviadas
- Documentar llamadas y reuniones
- Hacer auditoría completa de la interacción

### Tipos de Eventos

**Tabla: `poc_thread_events`**

#### Eventos de Venta
- **SALE_CONFIRMED**: Venta confirmada (trigger automático o manual)
- **SALE_CANCELLED**: Venta cancelada (manual)

#### Eventos de Cotización
- **QUOTATION_SENT**: Cotización enviada (manual)
- **QUOTATION_ACCEPTED**: Cotización aceptada (manual)

#### Eventos de Interacción
- **MEETING_SCHEDULED**: Reunión agendada (manual)
- **CALL_MADE**: Llamada realizada (manual)

#### Eventos de Estado
- **LEAD_LOST**: Lead marcado como perdido (manual)
- **LEAD_REACTIVATED**: Lead reactivado (manual)
- **REASSIGNMENT**: Reasignación de asesor (automático)
- **STATUS_CHANGED**: Cambio de estado manual (manual)
- **NOTE_ADDED**: Nota agregada por asesor (manual)

### Subtipos de Eventos

- **AUTO_DETECTED**: Evento generado automáticamente por el sistema (triggers)
- **MANUAL_MARK**: Evento creado manualmente por un usuario

---

## 🔍 Detección Híbrida de Ventas

### Enfoque Híbrido: Automático + Manual

**Razón:**
- La detección 100% automática no es confiable (puede haber ventas sin vuelo creado, o vuelos creados sin venta real)
- La detección 100% manual es tediosa y propensa a errores
- El enfoque híbrido combina lo mejor de ambos mundos

### Detección Automática (Trigger)

**Mecanismo:**
```sql
-- Trigger en tabla vuelos
CREATE TRIGGER trigger_poc_detect_sale
AFTER INSERT ON vuelos
FOR EACH ROW
EXECUTE FUNCTION poc_detect_sale_from_vuelo();
```

**Lógica:**
1. Cuando se crea un vuelo en el sistema
2. El trigger busca el thread por `contacto_telefono`
3. Si encuentra un thread, crea evento `SALE_CONFIRMED` con:
   - `event_subtype = 'AUTO_DETECTED'`
   - `is_system_generated = true`
   - Datos del vuelo (localizador, ruta, monto)
4. El trigger de estado actualiza `current_status = 'VENTA_CONCRETADA'`

**Ventajas:**
- ✅ Automático, sin intervención humana
- ✅ Confiable si se usa el sistema correctamente
- ✅ Registro inmediato de la venta

**Limitaciones:**
- ❌ Solo funciona si se crea el vuelo en el sistema
- ❌ No detecta ventas fuera del sistema
- ❌ Puede haber falsos positivos (vuelos creados por error)

### Detección Manual (API)

**Endpoint:**
```http
POST /api/poc/threads/:threadId/mark-sale
```

**Payload:**
```json
{
  "occurred_at": "2026-05-19T14:30:00Z",
  "amount": 850.50,
  "vuelo_id": "uuid-opcional",
  "notes": "Cliente pagó 50% adelanto",
  "created_by": "uuid-del-usuario"
}
```

**Lógica:**
1. Crea evento `SALE_CONFIRMED` con:
   - `event_subtype = 'MANUAL_MARK'`
   - `is_system_generated = false`
   - Datos proporcionados manualmente
2. Actualiza estado del thread a `VENTA_CONCRETADA`

**Ventajas:**
- ✅ Flexible: puede marcar ventas fuera del sistema
- ✅ Permite corregir errores de detección automática
- ✅ Permite agregar contexto (notas)

**Limitaciones:**
- ❌ Requiere intervención humana
- ❌ Propenso a errores si no se usa consistentemente

### Combinación de Ambos

**Estrategia recomendada:**
1. **Predeterminado:** Usar detección automática siempre que sea posible
2. **Corrección:** Si el trigger no detecta una venta, usar marcado manual
3. **Validación:** Revisar periódicamente que las ventas automáticas sean correctas
4. **Auditoría:** El sistema registra quién marcó qué y cuándo

---

## 📊 Timeline Enriquecido

### Concepto

Intercalar mensajes con eventos en una vista cronológica unificada.

**Ejemplo:**
```
┌─────────────────────────────────┐
│ 10:25 Cliente: Hola, necesito un vuelo │
│ 10:26 Bot A: ¡Con gusto! ¿Para dónde? │
│                                     │
│ 📄 COTIZACIÓN ENVIADA               │
│    18 May - 10:35 AM                │
│    Cotización_Miami_Cliente.pdf     │
│    [Manual]                         │
│                                     │
│ 11:20 Cliente: Me interesa          │
│ 11:21 Bot A: Perfecto, te envío     │
│                                     │
│ 🎉 VENTA CONFIRMADA                 │
│    18 May - 14:30 PM                │
│    Monto: $850.50                   │
│    Localizador: ABC123              │
│    [Automático]                     │
│                                     │
│ 14:35 Bot A: ¡Tu vuelo está listo!   │
└─────────────────────────────────┘
```

**Beneficios:**
- ✅ Contexto completo en una sola vista
- ✅ Fácil identificar cuando ocurrió la venta
- ✅ Auditoría visual de la interacción
- ✅ Métricas de tiempo entre eventos

---

## 🔄 Flujos Automáticos del Sistema

### Flujo 1: Sincronización de Threads

```
Webhook (nuevo mensaje)
         ↓
pocThreadService.syncThreadsFromMessages()
         ↓
Obtener chats de bots POC
         ↓
Agrupar por teléfono
         ↓
Crear/actualizar thread
         ↓
Vincular chats al thread
         ↓
Calcular métricas
         ↓
Actualizar timestamps (first_message_at, last_message_at)
```

### Flujo 2: Detección Automática de Venta

```
Usuario crea vuelo en sistema
         ↓
INSERT en tabla vuelos
         ↓
Trigger: trigger_poc_detect_sale
         ↓
Función: poc_detect_sale_from_vuelo()
    1. Buscar thread por contacto_telefono
    2. Verificar que no exista evento duplicado
    3. Crear evento SALE_CONFIRMED
         ↓
Trigger: trigger_poc_update_status
         ↓
Función: poc_update_thread_status_from_event()
    1. current_status = 'VENTA_CONCRETADA'
    2. total_sales += 1
    3. total_sales_amount += monto
    4. first_sale_at / last_sale_at actualizados
```

### Flujo 3: Actualización de Estado por Evento

```
Se crea evento (manual o automático)
         ↓
INSERT en poc_thread_events
         ↓
Trigger: trigger_poc_update_status
         ↓
Evaluar event_type:
    - SALE_CONFIRMED → current_status = 'VENTA_CONCRETADA'
    - LEAD_LOST → current_status = 'PERDIDO'
    - QUOTATION_SENT + estado=NUEVO → current_status = 'EN_NEGOCIACION'
         ↓
UPSERT en poc_thread_status
```

---

## 🎯 Casos de Uso del Negocio

### Caso 1: Seguimiento de Lead Nuevo

**Escenario:** Cliente nuevo llega por primera vez.

**Flujo:**
1. Cliente envía mensaje a bot
2. Webhook activa sincronización
3. Thread creado con estado `NUEVO`
4. Asesor ve thread en lista
5. Asesor entra al timeline
6. Asesor envía cotización (evento `QUOTATION_SENT`)
7. Estado cambia automáticamente a `EN_NEGOCIACION`
8. Asesor monitorea interacción

### Caso 2: Detección de Venta Automática

**Escenario:** Cliente compra y asesor crea vuelo en sistema.

**Flujo:**
1. Asesor crea vuelo en el sistema
2. Trigger detecta venta automáticamente
3. Evento `SALE_CONFIRMED` creado en timeline
4. Estado cambia a `VENTA_CONCRETADA`
5. Badge en lista de threads actualizado
6. Métricas de ventas actualizadas

### Caso 3: Corrección Manual de Venta

**Escenario:** Cliente compró fuera del sistema (pago directo, etc.)

**Flujo:**
1. Asesor detecta que cliente compró
2. Asesor entra al timeline del cliente
3. Asesor usa botón "Marcar Venta"
4. Llena formulario con datos (monto, fecha, notas)
5. Evento `SALE_CONFIRMED` creado manualmente
6. Estado cambia a `VENTA_CONCRETADA`
7. Sistema registra quién marcó y cuándo

### Caso 4: Reactivación de Lead Perdido

**Escenario:** Cliente que no respondió, vuelve a contactar.

**Flujo:**
1. Cliente envía nuevo mensaje
2. Sincronización actualiza `last_activity_at`
3. Asesor ve thread en estado `PERDIDO`
4. Asesor usa botón "Reactivar Lead"
5. Crea evento `LEAD_REACTIVATED`
6. Estado cambia a `EN_NEGOCIACION`
7. Asesor continúa seguimiento

### Caso 5: Análisis de Fragmentación

**Escenario:** Gerente quiere saber qué clientes cambiaron de bot.

**Flujo:**
1. Gerente ve lista de threads
2. Filtra por `total_chats > 1`
3. Identifica clientes fragmentados
4. Entra al timeline de cada uno
5. Ve marcadores de reasignación
6. Analiza por qué ocurrió el cambio
7. Toma decisiones para mejorar proceso

---

## 📊 Métricas de Negocio

### KPIs Disponibles

#### 1. Tasa de Conversión
```
Tasa de Conversión = (Threads con VENTA_CONCRETADA / Total Threads) × 100
```

#### 2. Tiempo a Venta
```
Tiempo a Venta = (Fecha de VENTA_CONFIRMED - Fecha de Primer Contacto)
```

#### 3. Fragmentación de Threads
```
% Threads Fragmentados = (Threads con >1 chat / Total Threads) × 100
```

#### 4. Distribución de Estados
```
Threads por Estado:
- NUEVO: X%
- EN_NEGOCIACION: Y%
- VENTA_CONCRETADA: Z%
- POST_VENTA: W%
- PERDIDO: V%
```

#### 5. Actividad por Asesor/Bot
```
Mensajes por Bot:
- Bot A: X mensajes, Y threads
- Bot B: Z mensajes, W threads
```

---

## 🔐 Seguridad y Permisos

### Control de Acceso

**Roles permitidos:**
- **Super Admin:** Acceso completo a threads, eventos, estados
- **Admin:** Acceso a threads de su agencia/sede
- **Asesor:** Solo sus propios threads (si aplica)

**RLS (Row Level Security):**
- Tablas `poc_thread_events` y `poc_thread_status` con RLS activado
- Solo usuarios autenticados pueden ver datos
- Super admins pueden ver todos los datos

### Auditoría

**Registro de cambios:**
- `created_by`: Quién creó un evento (NULL si automático)
- `created_at`: Cuándo se creó el evento
- `is_system_generated`: Si fue automático o manual
- `notes`: Notas adicionales del evento

---

## 🚀 Roadmap Futuro

### Fase 1.5 (Corto Plazo)
- Notificaciones en tiempo real cuando cambia estado
- Filtros avanzados en timeline (solo ventas, solo cotizaciones)
- Exportar timeline a PDF
- Dashboard de KPIs en tiempo real

### Fase 2 (Medio Plazo)
- Reproducción de audios/videos/imágenes
- Transcripción automática de audios
- Análisis de sentimiento en mensajes
- Lead scoring automático

### Fase 3 (Largo Plazo)
- Predicción de probabilidad de venta con ML
- Automatizaciones (recordatorios si no hay actividad)
- Integración con CRM completo
- Chatbot inteligente para seguimiento

---

## 📚 Referencias Técnicas

### Archivos de Configuración
- `docs/05-base-de-datos/esquemalocal.sql` - Esquema de base de datos
- `src/services/pocThreadService.js` - Lógica de sincronización
- `src/services/pocEventService.js` - Lógica de eventos
- `src/routes/poc.js` - Endpoints API

### Componentes Frontend
- `dashboard/src/app/(crm)/conversaciones-poc/page.js` - Lista de threads
- `dashboard/src/app/(crm)/conversaciones-poc/[threadId]/timeline/page.js` - Timeline
- `dashboard/src/components/poc/ThreadRow.jsx` - Fila de thread
- `dashboard/src/components/poc/TimelineEnriched.jsx` - Timeline enriquecido
- `dashboard/src/components/poc/EventMarker.jsx` - Marcador de evento
- `dashboard/src/components/poc/StatusBadge.jsx` - Badge de estado

### Documentación
- `docs/poc/2026-05-15-debugging-poc-conversations-resumen.md` - Debugging POC
- `docs/poc/funcionalidades-pendientes-media.md` - Funcionalidades pendientes
- `docs/superpowers/plans/PLAN-FINAL-CORREGIDO.md` - Plan de implementación

---

## 🎓 Conclusiones

### Valor del Sistema

1. **Centralización:** Vista unificada del cliente
2. **Visibilidad:** Identificar cuándo ocurren ventas
3. **Métricas:** Datos para tomar decisiones
4. **Auditoría:** Registro completo de interacciones
5. **Eficiencia:** Ahorro de tiempo para asesores

### Impacto en el Negocio

- ✅ Mejor experiencia del cliente
- ✅ Mayor tasa de conversión
- ✅ Mejor asignación de recursos
- ✅ Datos para optimización
- ✅ Reducción de errores

---

**Última actualización:** 19 de Mayo, 2026  
**Mantenido por:** Equipo de Desarrollo ERP Nova CRM
