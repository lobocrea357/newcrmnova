# Soporte para Cédula de Identidad (C.I.)

## Resumen
Sistema completo para permitir reservas de vuelos con Cédula de Identidad además de Pasaporte.

## Cambios Implementados

### 1. Base de Datos
**Tabla:** `vuelos_pasajeros`
- `tipo_documento` VARCHAR(20) DEFAULT 'PASAPORTE'
- `numero_cedula` VARCHAR(50)
- `pais_emision_cedula` VARCHAR(100)

### 2. Backend - Service Layer
**Archivo:** `src/services/vuelosService.js`

**Método nuevo:** `_validarDatosDocumento(pasajero)`
- Validación específica por tipo de documento
- Validación de formato por país (Venezuela: V-12345678, Colombia: 10 dígitos)
- Mensajes de error descriptivos

**Métodos actualizados:**
- `crearVuelo()`: Validación batch de documentos
- `actualizarPasajero()`: Tracking de cambios de tipo de documento

### 3. Backend - Routes
**Archivo:** `src/routes/vuelos.js`

**Endpoints actualizados:**
- `POST /api/vuelos/:id/adjuntos`: Acepta tipo 'CEDULA'
- `POST /api/vuelos`: Valida tipo_documento de pasajeros
- `PUT /api/vuelos/:id/editar`: Campos editables incluyen tipo_documento, numero_cedula, pais_emision_cedula

### 4. Frontend - Formulario Nuevo
**Archivo:** `dashboard/src/components/vuelos/VueloFormNuevo.jsx`

**Características:**
- Selector visual de tipo de documento con cards interactivos
- Campos dinámicos según tipo seleccionado
- Formato automático de cédula por país
- Extracción IA solo para pasaportes
- Validación en tiempo real con checkmarks
- Tooltips informativos

### 5. Frontend - Formulario Editar
**Archivo:** `dashboard/src/components/vuelos/VueloFormEditar.jsx`

**Características:**
- Smart inference: detecta tipo de documento de datos existentes
- Preserva valores de BD
- Tooltips contextuales para actualización de documentos
- Validación antes de SweetAlert de razón de edición

### 6. Frontend - Vista Detalle
**Archivo:** `dashboard/src/components/vuelos/VueloDetail.jsx`

**Características:**
- Nueva sección "Datos de Pasajeros"
- Badges visuales de tipo de documento (🛂 azul para pasaporte, 🪪 verde para cédula)
- Campos dinámicos según tipo
- Colores semánticos consistentes
- Sección de adjuntos incluye tipo CEDULA

## Validaciones por País

### Venezuela
- Formato: `V-12345678` o `E-12345678`
- Longitud: 7-8 dígitos después del prefijo
- Validación: Prefijo + números

### Colombia
- Formato: 10 dígitos numéricos
- Sin prefijos ni guiones

## Países Soportados
Venezuela, Colombia, Perú, Ecuador, Bolivia, Argentina, Chile, Uruguay, Paraguay, Brasil

## UX/UI
- **Colores:** Azul (pasaporte), Verde (cédula), Púrpura (principal)
- **Iconos:** 🛂 Pasaporte, 🪪 Cédula
- **Animaciones:** Slide-in, hover effects, transitions
- **Validación:** Checkmarks verdes en tiempo real
- **Tooltips:** Contextuales según acción (crear/editar)

## Flujo de Usuario
1. Seleccionar tipo de documento (Pasaporte/Cédula)
2. Campos se actualizan dinámicamente
3. Formato automático según país (para cédula)
4. Validación en tiempo real
5. Submit con validación completa
6. Visualización en detalle con badges

## Notas Técnicas
- Default: PASAPORTE (opción segura)
- Extracción IA: Solo disponible para pasaportes
- Tracking: Cambios de tipo de documento se registran en logs
- Normalización: Uppercase automático, trim de espacios
