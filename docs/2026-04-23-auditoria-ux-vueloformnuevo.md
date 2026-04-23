# Auditoría UX: VueloFormNuevo.jsx

**Fecha:** 2026-04-23  
**Componente:** VueloFormNuevo.jsx  
**Objetivo:** Evaluar usabilidad y proponer mejoras en la organización del formulario

---

## 📋 Estructura Actual del Formulario

El formulario tiene las siguientes secciones en orden:

1. **Información del Vuelo** (muy grande, mezcla muchos conceptos)
   - Nombre del cliente
   - Contacto
   - Teléfono
   - Vuelo de Ida (fecha, hora salida, hora llegada)
   - Vuelo de Vuelta (fecha, hora salida, hora llegada) - condicional
   - Ruta
   - Aerolínea
   - Localizador
   - Proveedor
   - Tipo de Vuelo
   - Desglose PNR/GDS
   - Información de Emisión (cuenta, forma de emisión)
   - Gestión de Crédito (condicional)
   - Observaciones

2. **Escalas del Vuelo**
   - Checkbox ¿Tiene escala?
   - Ciudad y duración escala 1
   - Checkbox ¿Tiene segunda escala?
   - Ciudad y duración escala 2

3. **Información Financiera**
   - Moneda de precios
   - Moneda de cotización
   - Tasa de cambio
   - Subtotal
   - Monto venta
   - Método de pago

4. **Gestión de Pasajeros**
   - Lista de pasajeros con datos personales
   - Tipo de documento
   - Número de documento
   - Upload de documento
   - Precios por pasajero
   - Equipaje

5. **Comprobantes de Pago**
   - Upload de comprobantes

---

## 🔴 Problemas Identificados

### 1. Sección "Información del Vuelo" Demasiado Grande y Desordenada

**Problema:** La primera sección mezcla conceptos muy diferentes:
- Datos del cliente (nombre, contacto, teléfono)
- Datos del vuelo (fecha, hora, ruta, aerolínea)
- Datos operativos (localizador, proveedor, PNR)
- Datos financieros (emisión, crédito)
- Observaciones

**Impacto UX:**
- Carga cognitiva excesiva al inicio
- Difícil escanear visualmente
- El usuario no sabe qué priorizar
- Campos importantes se pierden entre muchos otros

**Principio violado:** Interface Design - "Every choice must be a choice" (se mezcló todo sin intención clara)

---

### 2. Orden No Lógico Según Flujo de Trabajo Real

**Problema:** El orden actual no sigue el flujo mental de un agente de viajes:

**Flujo mental real:**
1. ¿Quién viaja? (cliente)
2. ¿Cuándo y dónde? (vuelo)
3. ¿Quiénes son los pasajeros? (personas)
4. ¿Cómo se paga? (financiero)
5. ¿Documentos? (adjuntos)

**Flujo actual:**
1. Mezcla de todo (cliente + vuelo + operativo + financiero)
2. Escalas (operativo)
3. Financiero
4. Pasajeros (personas)
5. Comprobantes (adjuntos)

**Impacto UX:** El usuario tiene que saltar entre secciones para completar información relacionada

---

### 3. Información de Emisión y Crédito en Lugar Incorrecto

**Problema:** La cuenta de emisión y forma de emisión están en la primera sección, pero son decisiones financieras que deberían estar cerca de la información financiera.

**Impacto UX:** El usuario toma decisiones financieras sin contexto de precios y métodos de pago

---

### 4. Escalas Separadas del Vuelo

**Problema:** Las escalas están en una sección separada, pero son parte intrínseca de la información del vuelo.

**Impacto UX:** El usuario tiene que ir a otra sección para especificar escalas del vuelo que acaba de definir

---

### 5. Observaciones al Final de la Primera Sección

**Problema:** Las observaciones están enterradas al final de una sección gigante.

**Impacto UX:** Campo importante difícil de encontrar

---

### 6. Falta de Agrupación Visual por Contexto

**Problema:** No hay separación visual clara entre:
- Datos del cliente
- Datos del vuelo
- Datos operativos
- Datos financieros

**Impacto UX:** Difícil identificar rápidamente qué tipo de información se está editando

---

## ✅ Propuesta de Reorganización

### Nuevo Orden Propuesto:

#### **SECCIÓN 1: Información del Cliente**
- Nombre del cliente
- Contacto
- Teléfono
- Observaciones (movido aquí porque es contextual al cliente)

#### **SECCIÓN 2: Detalles del Vuelo**
- Tipo de Vuelo (primero porque define qué campos mostrar)
- Vuelo de Ida
  - Fecha salida
  - Hora salida
  - Hora llegada
- Vuelo de Vuelta (condicional)
  - Fecha regreso
  - Hora salida
  - Hora llegada
- Ruta
- Aerolínea
- Escalas (integrado aquí, no separado)
  - Checkbox ¿Tiene escala?
  - Ciudad y duración escala 1
  - Checkbox ¿Tiene segunda escala?
  - Ciudad y duración escala 2

#### **SECCIÓN 3: Información Operativa**
- Localizador
- Proveedor
- Desglose PNR/GDS

#### **SECCIÓN 4: Pasajeros**
- Lista de pasajeros
- Datos personales
- Documentos
- Precios por pasajero
- Equipaje

#### **SECCIÓN 5: Información Financiera y Emisión**
- Moneda de precios
- Moneda de cotización
- Tasa de cambio
- Subtotal
- Monto venta
- Método de pago
- Cuenta de emisión (movido aquí)
- Forma de emisión (movido aquí)
- Gestión de Crédito (movido aquí, ya está condicional)

#### **SECCIÓN 6: Comprobantes de Pago**
- Upload de comprobantes

---

## 🎯 Justificación del Nuevo Orden

### 1. **Cliente Primero**
- El cliente es el contexto principal de la transacción
- Saber quién es el cliente ayuda a tomar decisiones posteriores
- Las observaciones suelen ser sobre el cliente/situación específica

### 2. **Vuelo Segundo**
- El vuelo es el producto que se está vendiendo
- Tipo de vuelo primero define qué campos mostrar
- Escalas integradas porque son parte del vuelo, no un concepto separado

### 3. **Operativo Tercero**
- Localizador, proveedor y PNR son datos operativos
- Se necesitan después de definir el vuelo
- Son menos críticos que cliente y pasajeros

### 4. **Pasajeros Cuarto**
- Los pasajeros son las personas que viajan
- Es natural después de definir el vuelo
- Es la sección más compleja, así que mejor cuando ya se tiene contexto

### 5. **Financiero Quinto**
- Las decisiones financieras se toman con contexto completo
- Cuenta y forma de emisión están junto a método de pago
- El usuario ve los precios antes de decidir cómo emitir

### 6. **Comprobantes Último**
- Es el paso final del proceso
- Se sube después de tener toda la información

---

## 🎨 Recomendaciones de Diseño Adicionales

### 1. **Separación Visual Más Clara**
- Usar diferentes colores de fondo para cada sección principal
- Añadir números de sección (1, 2, 3...) para guía visual
- Más espacio entre secciones

### 2. **Indicadores de Progreso**
- Barra de progreso lateral mostrando qué secciones están completas
- Contador de campos requeridos vs completados

### 3. **Agrupación por Cards**
- Cada sección en su propio card con borde y sombra
- Iconos distintivos por sección
- Títulos más prominentes

### 4. **Campos Condicionales Más Visibles**
- Animaciones suaves cuando aparecen campos condicionales
- Indicadores visuales de qué campos son opcionales vs requeridos
- Tooltips explicativos para campos complejos

---

## 📊 Comparación de Complejidad

### Antes:
- 1 sección gigante con 15+ campos mezclados
- 4 secciones más
- Total: 5 secciones, pero la primera es desordenada

### Después:
- 6 secciones bien definidas
- Cada sección tiene propósito claro
- Flujo lógico de trabajo
- Total: 6 secciones, pero cada una es manejable

---

## 🔍 Análisis Según Interface Design Principles

### Domain Concepts
- **Agente de viajes:** Necesita fluidez y contexto
- **Transacción de venta:** Cliente → Producto → Personas → Pago
- **Operaciones aéreas:** Vuelo, escalas, localizador son un solo concepto

### Color World
- **Azul/índigo:** Confianza, profesionalismo (ya se usa)
- **Morado:** Diferenciación de secciones
- **Verde:** Acciones confirmadas
- **Ámbar:** Advertencias y campos condicionales

### Signature Element
- **Cards numerados con iconos distintivos**
- **Animaciones suaves en campos condicionales**
- **Indicador de progreso lateral**

### Defaults Avoided
- ❌ Una sección gigante con todo mezclado
- ❌ Escalas separadas del vuelo
- ❌ Financiero disperso en múltiples secciones
- ✅ Secciones con propósito único
- ✅ Flujo de trabajo natural
- ✅ Agrupación por contexto

---

## ✅ Conclusión

El formulario actual es funcional pero poco intuitivo debido a:
1. Primera sección sobrecargada
2. Orden que no sigue el flujo de trabajo real
3. Conceptos relacionados separados

La propuesta de reorganización:
- Sigue el flujo mental del usuario
- Agrupa información relacionada
- Reduce carga cognitiva por sección
- Mantiene todas las funcionalidades actuales

**Siguiente paso:** Aprobar la reorganización propuesta antes de implementar.

---

## ✅ Implementación Completada

**Fecha de implementación:** 2026-04-23

**Cambios realizados:**
- Reorganización completa del formulario en 6 secciones lógicas
- Integración de escalas en la sección de Detalles del Vuelo
- Unificación de Información Financiera y Emisión
- Agregado de badges numerados en cada sección
- Agregado de separación visual (mt-8) entre secciones
- Eliminación de imports no utilizados (Calendar, Upload, Clock)

**Nueva estructura implementada:**
1. **SECCIÓN 1: Información del Cliente** - Nombre, contacto, teléfono, observaciones
2. **SECCIÓN 2: Detalles del Vuelo** - Tipo de vuelo, vuelo de ida/vuelta, ruta, aerolínea, escalas integradas
3. **SECCIÓN 3: Información Operativa** - Localizador, proveedor, desglose PNR/GDS
4. **SECCIÓN 4: Pasajeros** - Lista de pasajeros con datos personales, documentos, precios, equipaje
5. **SECCIÓN 5: Información Financiera y Emisión** - Monedas, tasas, montos, método de pago, cuenta de emisión, forma de emisión, gestión de crédito
6. **SECCIÓN 6: Comprobantes de Pago** - Upload de comprobantes

**Archivos modificados:**
- `dashboard/src/components/vuelos/VueloFormNuevo.jsx` - Reorganización completa
- `docs/superpowers/plans/2026-04-23-reorganizacion-vueloformnuevo.md` - Plan de implementación
- `docs/2026-04-23-auditoria-ux-vueloformnuevo.md` - Este documento (actualizado)

**Estado:** ✅ Completado
