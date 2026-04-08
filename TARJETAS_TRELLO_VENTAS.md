# 🎯 Tarjetas de Trello - Módulo de Ventas y Cotizador

> **Instrucciones:** Cada sección separada por `---` representa una tarjeta individual de Trello. Copia y pega cada bloque en una tarjeta separada.

---

## 📝 Crear Cotización

**Descripción:** Vista unificada para crear cotizaciones de vuelo con soporte nativo para múltiples pasajeros (ADT/CHD/INF), cálculo automático de precios, conversión de monedas y métodos de pago personalizados.

### 📋 Backend (DB/API)

**Tablas:**
- `cotizaciones` - Tabla principal (id, created_by, nombre_cliente, tipo_vuelo, origen, destino, fecha_salida, fecha_regreso, estado='EN_REVISION', moneda_precio, moneda_cotizacion, precio_final_cotizacion)
- `cotizaciones_pasajeros` - Pasajeros de la cotización (id, cotizacion_id, tipo='ADT|CHD|INF', nombres, apellidos, precio_pantalla, fee_emision, fee_agencia, equipaje_completo, equipaje_mediano, equipaje_ligero)
- `profiles` - Relación FK → created_by

**Endpoints:**
- `POST /api/cotizaciones` - Crear nueva cotización
  - Body: `{ cotizacion, pasajeros: [{ tipo, nombres, precio_pantalla, ... }] }`
  - Validación: Campos requeridos (created_by, nombre_cliente, tipo_vuelo, origen, destino, fecha_salida, moneda_precio, moneda_cotizacion, precio_final_cotizacion)

**Relaciones:**
- `cotizaciones.created_by` → `profiles.id` (FK)
- `cotizaciones_pasajeros.cotizacion_id` → `cotizaciones.id` (FK, CASCADE DELETE)

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/cotizador` - Página principal del cotizador (vista unificada)

**Componentes:**
- `CotizadorForm.jsx` - Formulario principal con soporte nativo para múltiples pasajeros
- `PasajerosManager.jsx` - Gestión de lista de pasajeros (ADT/CHD/INF)
- `AerolineaAutocomplete.jsx` - Selector de aerolínea
- `ResumenCotizacionSticky.jsx` - Panel flotante con resumen y desglose
- `PdfContent.jsx` - Vista para exportación PDF

**Hooks:**
- `useMonedas.js` - Gestión de monedas y tasas de conversión
- `useVueloInfo.js` - Estado de información del vuelo
- `useEscalas.js` - Gestión de escalas
- `useEquipaje.js` - Gestión de equipaje

**Configuraciones:**
- `/lib/cotizador/conversorInteligente.js` - Conversión inteligente de monedas
- `/lib/cotizador/paymentConfig.js` - Métodos de pago por agencia
- `/lib/cotizador/tasasHelpers.js` - Helpers de tasas
- `/lib/cotizador/monedasConfig.js` - Configuración de monedas

### ✅ Checklist de Progreso

- [x] Tabla `cotizaciones` creada con todos los campos
- [x] Tabla `cotizaciones_pasajeros` creada con índice
- [x] Endpoint `POST /api/cotizaciones` implementado
- [x] Servicio `cotizacionesService.crearCotizacion()` con pasajeros
- [x] Componente `CotizadorForm.jsx` completo
- [x] Componente `PasajerosManager.jsx` para gestión de pasajeros
- [x] Soporte para categorías ADT/CHD/INF con precios individuales
- [x] Cálculo automático de precio final con múltiples pasajeros
- [x] Conversión inteligente de monedas en tiempo real
- [x] Validación de campos requeridos
- [x] Selector de métodos de pago por agencia
- [x] Gestión de escalas y equipaje
- [x] Estado inicial `EN_REVISION` automático
- [x] Desglose detallado por pasajero
- [x] Integración con API centralizada (`COTIZACIONES_API.crear`)

---

## 📋 Listar y Filtrar Cotizaciones

**Descripción:** Vista de lista de cotizaciones del usuario con filtros por estado, búsqueda y ordenamiento.

### 📋 Backend (DB/API)

**Tablas:**
- `cotizaciones` - SELECT con filtros
- `cotizaciones_pasajeros` - LEFT JOIN para contar pasajeros
- `profiles` - Datos del creador

**Endpoints:**
- Consulta directa a Supabase desde frontend (sin endpoint Express específico para listar)

**Relaciones:**
- Query con `eq('created_by', user.id)` para filtrar por usuario

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/cotizaciones` - Lista de cotizaciones

**Componentes:**
- `CotizacionesPage` (página principal en `/ventas/cotizaciones/page.jsx`)
- `CotizacionDetail.jsx` - Componente de detalle
- `TutorialCotizaciones.jsx` - Tutorial inicial

**Funcionalidad:**
- Consulta directa a Supabase: `supabase.from('cotizaciones').select('*, pasajeros:cotizaciones_pasajeros(*)')`
- Filtros: por estado (all, PENDIENTE, EN_REVISION, APROBADA, RECHAZADA)
- Búsqueda: por nombre de cliente
- Ordenamiento: por `created_at DESC`

### ✅ Checklist de Progreso

- [x] Página `/ventas/cotizaciones` creada
- [x] Query con select de pasajeros anidados
- [x] Filtro por estado implementado
- [x] Búsqueda por nombre cliente
- [x] Ordenamiento por fecha descendente
- [x] Solo cotizaciones del usuario autenticado
- [x] Loading states con skeleton
- [x] Empty state cuando no hay cotizaciones
- [x] Auto-selección de primera cotización
- [ ] Paginación (pendiente para grandes volúmenes)

---

## 🔍 Ver Detalle de Cotización

**Descripción:** Modal/panel lateral con información completa de la cotización, pasajeros e historial de cambios de estado.

### 📋 Backend (DB/API)

**Tablas:**
- `cotizaciones` - Datos principales
- `cotizaciones_pasajeros` - Lista de pasajeros
- `cotizaciones_historial` - Historial de cambios de estado

**Endpoints:**
- `GET /api/cotizaciones/:id` - Obtener cotización con pasajeros e historial
  - Response: `{ cotizacion, pasajeros: [], historial: [] }`

**Relaciones:**
- LEFT JOIN `cotizaciones_pasajeros` ON `cotizacion_id`
- LEFT JOIN `cotizaciones_historial` ON `cotizacion_id`

### 🎨 Frontend (UI/UX)

**Componentes:**
- `CotizacionDetail.jsx` - Panel de detalle completo
- Secciones:
  - Información general (cliente, tipo vuelo, ruta, fechas)
  - Lista de pasajeros (si aplica)
  - Desglose financiero (precio, tasas, total)
  - Historial de estados
  - Acciones (editar, eliminar, cambiar estado)

### ✅ Checklist de Progreso

- [x] Endpoint `GET /api/cotizaciones/:id` implementado
- [x] Servicio `obtenerCotizacion(id)` con joins
- [x] Componente `CotizacionDetail.jsx` creado
- [x] Visualización de datos generales
- [x] Lista de pasajeros en tabla
- [x] Desglose financiero formateado
- [x] Historial de estados con timestamps
- [x] Botones de acción según estado
- [x] API centralizada: `COTIZACIONES_API.obtener(id)`

---

## ✏️ Editar Cotización

**Descripción:** Permite modificar una cotización existente. Solo el creador puede editar y solo si no está en estado RECHAZADA.

### 📋 Backend (DB/API)

**Tablas:**
- `cotizaciones` - UPDATE de campos
- `cotizaciones_pasajeros` - DELETE + INSERT para reemplazar

**Endpoints:**
- `PUT /api/cotizaciones/:id` - Actualizar cotización
  - Body: `{ cotizacion: { campos_a_actualizar }, pasajeros: [] }`
  - Validación: `cotizacion.created_by === userId` (solo creador)

**Lógica:**
1. Verificar que usuario es el creador
2. Actualizar campos de cotización
3. Si hay pasajeros: eliminar existentes e insertar nuevos
4. Trigger automático registra en `cotizaciones_historial` si cambia estado

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/cotizador` - Reutiliza el mismo formulario en modo edición

**Componentes:**
- `CotizadorForm.jsx` - Cargado con datos existentes
- Lógica: si hay `cotizacionId` en props/query → modo edición

**Flujo:**
1. Cargar cotización desde `GET /api/cotizaciones/:id`
2. Pre-llenar formulario con datos
3. Permitir modificación
4. `PUT` para guardar cambios

### ✅ Checklist de Progreso

- [x] Endpoint `PUT /api/cotizaciones/:id` implementado
- [x] Validación: solo creador puede editar
- [x] Servicio `actualizarCotizacion(id, updates, userId)`
- [x] Servicio `actualizarPasajeros(id, pasajeros)` - DELETE + INSERT
- [x] Formulario carga datos en modo edición
- [x] Botón "Guardar cambios" vs "Crear cotización"
- [x] Validación frontend: bloquear si estado RECHAZADA
- [x] API centralizada: `COTIZACIONES_API.actualizar(id)`
- [ ] Mensaje de confirmación antes de sobrescribir

---

## 🔄 Cambiar Estado de Cotización

**Descripción:** Cambiar estado de cotización entre PENDIENTE, EN_REVISION, APROBADA, RECHAZADA con historial automático.

### 📋 Backend (DB/API)

**Tablas:**
- `cotizaciones` - UPDATE del campo `estado`
- `cotizaciones_historial` - INSERT automático vía trigger DB

**Endpoints:**
- `PATCH /api/cotizaciones/:id/estado` - Cambiar estado
  - Body: `{ estado: 'APROBADA|RECHAZADA', userId, razon: 'texto opcional' }`
  - Validación: estado debe ser uno de los válidos

**Trigger DB:**
- Automático al cambiar `estado` → INSERT en `cotizaciones_historial`
- Registra: estado_anterior, estado_nuevo, fecha, usuario

### 🎨 Frontend (UI/UX)

**Componentes:**
- `CotizacionDetail.jsx` - Botones de cambio de estado
- Botones condicionales:
  - "Aprobar" → APROBADA
  - "Rechazar" → RECHAZADA
  - "Volver a Revisión" → EN_REVISION

**UX:**
- SweetAlert2 para confirmación crítica
- Input opcional para razón de rechazo
- Toast de éxito al confirmar

### ✅ Checklist de Progreso

- [x] Endpoint `PATCH /api/cotizaciones/:id/estado` implementado
- [x] Validación de estados permitidos
- [x] Servicio `cambiarEstado(id, estado, userId, razon)`
- [x] Trigger DB para historial automático (pendiente verificar)
- [x] Botones en `CotizacionDetail.jsx`
- [x] Confirmación con SweetAlert2
- [x] Registro de razón de cambio
- [x] API centralizada: `COTIZACIONES_API.cambiarEstado(id)`
- [ ] Validación de permisos por rol (pendiente backend)

---

## 🗑️ Eliminar Cotización

**Descripción:** Eliminar una cotización y sus pasajeros asociados (CASCADE).

### 📋 Backend (DB/API)

**Tablas:**
- `cotizaciones` - DELETE con CASCADE a pasajeros

**Endpoints:**
- `DELETE /api/cotizaciones/:id` - Eliminar cotización
  - Validación: verificar permisos (solo creador o admin)

**Relaciones:**
- DELETE CASCADE automático a `cotizaciones_pasajeros`

### 🎨 Frontend (UI/UX)

**Componentes:**
- `CotizacionDetail.jsx` - Botón de eliminar
- Confirmación crítica con SweetAlert2
- Mensaje: "Esta acción no se puede deshacer"

**UX:**
1. Click en "Eliminar"
2. SweetAlert2: "¿Estás seguro?"
3. Si confirma → DELETE
4. Redirect a lista o actualizar

### ✅ Checklist de Progreso

- [x] Endpoint `DELETE /api/cotizaciones/:id` implementado
- [x] Servicio `eliminarCotizacion(id)`
- [x] CASCADE DELETE configurado en DB
- [x] Botón de eliminar en detalle
- [x] Confirmación SweetAlert2
- [x] API centralizada: `COTIZACIONES_API.eliminar(id)`
- [ ] Validación de permisos: solo creador o admin
- [ ] Validación: bloquear si ya tiene vuelo asociado

---

## 💱 Gestión de Tasas de Cambio

**Descripción:** CRUD de tasas de conversión entre monedas con historial y activación/desactivación.

### 📋 Backend (DB/API)

**Tablas:**
- `tasas_conversion` - Tasas entre pares de monedas (id, moneda_origen_id, moneda_destino_id, tasa, activa, fecha_actualizacion)
- `monedas` - Catálogo de monedas (USD, EUR, COP, etc.)

**Endpoints:**
- `POST /api/tasas/crear` - Crear nueva tasa
- `PUT /api/tasas/actualizar` - Actualizar tasa existente
- `DELETE /api/tasas/eliminar/:id` - Eliminar tasa

**Relaciones:**
- `tasas_conversion.moneda_origen_id` → `monedas.id` (FK)
- `tasas_conversion.moneda_destino_id` → `monedas.id` (FK)

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/cotizador` - Tab "Gestión de Tasas" (solo admin/gerente)

**Componentes:**
- `TasasManager.jsx` - CRUD completo de tasas
- `HistorialTasas.jsx` - Historial de cambios
- Tabla con columnas: Origen → Destino, Tasa, Activa, Fecha, Acciones

**Permisos:**
- Solo visible si `hasAnyPermission(['tasas.edit', 'tasas.create', 'tasas.delete', 'tasas.manage'])`

### ✅ Checklist de Progreso

- [x] Tabla `tasas_conversion` creada
- [x] Endpoints CRUD implementados
- [x] Componente `TasasManager.jsx` completo
- [x] Formulario crear/editar tasa
- [x] Toggle activar/desactivar
- [x] Historial de cambios
- [x] Validación: no duplicar par de monedas
- [x] API centralizada: `TASAS_API`
- [x] Permisos granulares en frontend
- [ ] Validación de permisos en backend

---

## 💰 Gestión de Monedas

**Descripción:** CRUD de monedas disponibles en el sistema (USD, EUR, COP, etc.).

### 📋 Backend (DB/API)

**Tablas:**
- `monedas` - Catálogo de monedas (id, codigo='USD', nombre='Dólar Estadounidense', simbolo='$')

**Endpoints:**
- `POST /api/tasas/crear-moneda` - Crear moneda
- `PUT /api/tasas/actualizar-moneda` - Actualizar moneda
- `DELETE /api/tasas/eliminar-moneda/:id` - Eliminar moneda

**Validación:**
- Código único (3 letras mayúsculas)
- No eliminar si tiene tasas asociadas

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/cotizador` - Tab "Gestión de Monedas" (solo admin/gerente)

**Componentes:**
- `MonedasManager.jsx` - CRUD de monedas
- Tabla: Código, Nombre, Símbolo, Acciones
- Modal para crear/editar

**Permisos:**
- Solo visible si `hasAnyPermission(['monedas.edit', 'monedas.create', 'monedas.delete', 'monedas.manage'])`

### ✅ Checklist de Progreso

- [x] Tabla `monedas` creada
- [x] Endpoints CRUD implementados
- [x] Componente `MonedasManager.jsx` completo
- [x] Formulario crear/editar moneda
- [x] Validación: código único 3 letras
- [x] Prevenir eliminación si tiene tasas
- [x] API centralizada: `TASAS_API`
- [x] Permisos granulares en frontend
- [ ] Validación de permisos en backend

---

## 📄 Exportar Cotización a PDF

**Descripción:** Generar PDF profesional de la cotización con logo, desglose y multipágina.

### 📋 Backend (DB/API)

**Tablas:**
- Solo lectura de cotización existente

**Servicios:**
- `pdfService.js` - Generación de PDF con jsPDF + html2canvas

### 🎨 Frontend (UI/UX)

**Componentes:**
- `CotizadorForm.jsx` - Botón "Exportar PDF"
- `/services/cotizador/pdfService.js` - Lógica de generación
- `/resultados/PdfContent.jsx` - Contenido HTML para PDF

**Configuración:**
- Márgenes: 15mm
- Tamaño: A4 (210x297mm)
- Multi-página automática si contenido excede altura

**Flujo:**
1. Click "Exportar PDF"
2. Renderizar `PdfContent.jsx` oculto
3. html2canvas captura como imagen
4. jsPDF inserta imagen ajustada
5. Descargar archivo

### ✅ Checklist de Progreso

- [x] Servicio `pdfService.js` implementado
- [x] Componente `PdfContent.jsx` creado
- [x] Botón "Exportar PDF" en formulario
- [x] Validación: deshabilitar si no hay desglose
- [x] Logo de empresa incluido
- [x] Desglose detallado de precios
- [x] Multi-página funcional
- [x] Márgenes aumentados (15mm)
- [x] Loading state durante generación
- [ ] Mejora: page-break nativo (limitación html2canvas)

---

## ✈️ Crear Vuelo Nuevo (Manual)

**Descripción:** Crear un vuelo completo sin cotización previa, con pasajeros y datos de contacto.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - Datos principales (id, created_by, pax_nombre, contacto_nombre, contacto_telefono, fecha_vuelo, ruta, proveedor, monto_venta, tipo_vuelo='solo_ida|ida_vuelta|migratorio', estado='PENDIENTE_CONFIRMACION_PAGO', ediciones_disponibles=3)
- `vuelos_pasajeros` - Pasajeros del vuelo
- `vuelos_adjuntos` - Adjuntos opcionales

**Endpoints:**
- `POST /api/vuelos` - Crear vuelo
  - Body: `{ vuelo: {}, pasajeros: [], adjuntos: [] }`
  - Validación: campos requeridos (created_by, pax_nombre, contacto_nombre, contacto_telefono, fecha_vuelo, ruta, proveedor, monto_venta, tipo_vuelo)

**Relaciones:**
- `vuelos_pasajeros.vuelo_id` → `vuelos.id` (FK, CASCADE)
- `vuelos_adjuntos.vuelo_id` → `vuelos.id` (FK, CASCADE)

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/vuelos/nuevo` - Formulario de nuevo vuelo

**Componentes:**
- `VueloFormNuevo.jsx` - Formulario completo
- `FileUpload.jsx` - Subida de adjuntos
- Secciones:
  1. Datos del vuelo (PAX, contacto, fecha, ruta)
  2. Información del vuelo (proveedor, monto, tipo)
  3. Pasajeros (opcional)
  4. Adjuntos (opcional)

### ✅ Checklist de Progreso

- [x] Tabla `vuelos` creada
- [x] Tabla `vuelos_pasajeros` creada
- [x] Tabla `vuelos_adjuntos` creada
- [x] Endpoint `POST /api/vuelos` implementado
- [x] Servicio `crearVuelo(vuelo, pasajeros, adjuntos)`
- [x] Componente `VueloFormNuevo.jsx` completo
- [x] Validación de campos requeridos
- [x] Estado inicial `PENDIENTE_CONFIRMACION_PAGO`
- [x] Ediciones disponibles = 3 por defecto
- [x] API centralizada: `VUELOS_API.crear`
- [x] Notificación automática al crear

---

## 🔗 Crear Vuelo desde Cotización

**Descripción:** Crear vuelo heredando datos de una cotización aprobada y copiar pasajeros automáticamente.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - Con campo `cotizacion_id` (FK nullable)
- `cotizaciones` - Fuente de datos
- `cotizaciones_pasajeros` → `vuelos_pasajeros` (copia)

**Endpoints:**
- `POST /api/vuelos` - Con `cotizacion_id` en body
- `POST /api/vuelos/:vueloId/copiar-pasajeros` - Copiar pasajeros
  - Body: `{ cotizacionId }`

**Lógica:**
1. Crear vuelo con referencia a cotización
2. Copiar datos: cliente, ruta, fechas, monto
3. Llamar endpoint para copiar pasajeros

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/vuelos/nuevo?cotizacion_id=xxx` - Formulario pre-llenado

**Componentes:**
- `VueloFormNuevo.jsx` - Detecta `cotizacion_id` en query
- Botón "Copiar Pasajeros" si viene de cotización

**Flujo:**
1. Desde detalle de cotización → Click "Crear Vuelo"
2. Redirect a `/vuelos/nuevo?cotizacion_id=xxx`
3. Formulario pre-llena datos
4. Click "Copiar Pasajeros" → fetch y poblar

### ✅ Checklist de Progreso

- [x] Campo `vuelos.cotizacion_id` (FK nullable)
- [x] Endpoint copiar pasajeros implementado
- [x] Servicio `copiarPasajerosDeCotizacion(cotizacionId, vueloId)`
- [x] Formulario detecta `cotizacion_id` en query
- [x] Pre-llenado automático de datos
- [x] Botón "Copiar Pasajeros"
- [x] API centralizada: `VUELOS_API.copiarPasajeros(vueloId)`
- [ ] Validación: cotización debe estar APROBADA

---

## 📋 Listar y Filtrar Vuelos

**Descripción:** Lista de vuelos filtrada por rol (asesor ve sus vuelos, gerente ve equipo, admin ve todos).

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - SELECT con filtros
- `profiles` - JOIN para datos de creador y equipo
- `equipos` - JOIN para validar equipo del gerente

**Endpoints:**
- `GET /api/vuelos?user_id=xxx&role=xxx&estado=xxx&tipo_vuelo=xxx&fecha_desde=xxx&fecha_hasta=xxx&search=xxx`
  - Filtrado por rol en backend (`vuelosService.obtenerVuelos()`)

**Lógica de Filtrado:**
- Asesor: `WHERE created_by = user_id`
- Gerente: `WHERE created_by IN (SELECT id FROM profiles WHERE equipo_id = gerente_equipo)`
- Admin: `ALL`

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/vuelos` - Lista principal

**Componentes:**
- `VuelosList.jsx` - Lista con tarjetas
- `VueloCard.jsx` - Tarjeta individual
- Filtros:
  - Por estado (PENDIENTE_CONFIRMACION_PAGO, PENDIENTE_EMISION, EMITIDO, CANCELADO)
  - Por tipo vuelo (solo_ida, ida_vuelta, migratorio)
  - Por rango de fechas
  - Búsqueda por PAX o ruta

### ✅ Checklist de Progreso

- [x] Endpoint `GET /api/vuelos` implementado
- [x] Servicio `obtenerVuelos({ userId, role, filters })`
- [x] Filtrado por rol en backend
- [x] Componente `VuelosList.jsx` completo
- [x] Filtros por estado, tipo, fechas
- [x] Búsqueda por texto
- [x] Loading states con skeleton
- [x] Empty state
- [x] API centralizada: `VUELOS_API.listar`
- [ ] Paginación (pendiente)

---

## 🔍 Ver Detalle de Vuelo

**Descripción:** Vista completa del vuelo con pasajeros, adjuntos, historial de ediciones y acciones disponibles.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - Datos principales
- `vuelos_pasajeros` - Lista de pasajeros
- `vuelos_adjuntos` - Adjuntos subidos
- `vuelos_ediciones` - Historial de cambios
- `profiles` - Datos de creador y editores

**Endpoints:**
- `GET /api/vuelos/:id` - Obtener vuelo completo
  - Response: `{ vuelo, pasajeros: [], adjuntos: [] }`
- `GET /api/vuelos/:id/historial-ediciones` - Historial separado

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/vuelos/[id]` - Detalle del vuelo

**Componentes:**
- `VueloDetail.jsx` - Vista completa
- `HistorialEdiciones.jsx` - Timeline de cambios
- Secciones:
  - Información general
  - Estado y timeline
  - Pasajeros
  - Adjuntos con vista previa
  - Historial de ediciones
  - Botones de acción según estado

### ✅ Checklist de Progreso

- [x] Endpoint `GET /api/vuelos/:id` implementado
- [x] Servicio `obtenerVuelo(id)` con joins
- [x] Endpoint historial de ediciones
- [x] Componente `VueloDetail.jsx` completo
- [x] Componente `HistorialEdiciones.jsx`
- [x] Visualización de pasajeros en tabla
- [x] Lista de adjuntos con links
- [x] Timeline de historial
- [x] Botones condicionales por estado
- [x] API centralizada: `VUELOS_API.obtener(id)`

---

## ✏️ Editar Vuelo (Con Límite de Intentos)

**Descripción:** Edición controlada de vuelos con sistema de permisos granular y límite de 3 ediciones para asesores.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - Campo `ediciones_disponibles` (INTEGER, DEFAULT 3)
- `vuelos_ediciones` - Historial (id, vuelo_id, editado_por, campos_modificados, valores_anteriores, valores_nuevos, intento_numero, razon_edicion, editado_at)
- `profiles` - Para validar equipo y permisos
- `role_permissions` - Permisos del rol

**Endpoints:**
- `PUT /api/vuelos/:id/editar` - Editar con validaciones
  - Body: `{ vuelo: {}, pasajeros: [], razon_edicion, user_id, user_role }`
  - Validación:
    - No editable si estado = EMITIDO
    - Admin/Super Admin: edición ilimitada
    - Gerente: edición ilimitada en su equipo
    - Asesor: máximo 3 ediciones en sus vuelos

**Permisos:**
- `vuelos.edit_all` → Admin (ilimitado)
- `vuelos.edit_team` → Gerente (ilimitado en equipo)
- `vuelos.edit_own` → Asesor (3 intentos)

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/vuelos/[id]/editar` - Formulario de edición

**Componentes:**
- `VueloFormEditar.jsx` - Formulario con datos pre-cargados
- Modal de confirmación con input de razón
- Badge de ediciones disponibles

**Campos NO Editables:**
- created_by, estado, moneda_precio, moneda_cotizacion, tasa_cambio, metodo_pago

### ✅ Checklist de Progreso

- [x] Campo `ediciones_disponibles` en tabla
- [x] Tabla `vuelos_ediciones` creada
- [x] Endpoint `PUT /api/vuelos/:id/editar` implementado
- [x] Validación de permisos granular
- [x] Decrementar intentos solo para asesores
- [x] Registro de historial con cambios detallados
- [x] Bloqueo si estado = EMITIDO
- [x] Componente `VueloFormEditar.jsx`
- [x] Input de razón de edición (min 10 chars)
- [x] Mostrar ediciones disponibles
- [x] API centralizada: `VUELOS_API.editar(id)`

---

## ✅ Confirmar Pago de Vuelo

**Descripción:** Cambiar estado de vuelo a PENDIENTE_EMISION tras verificar pago. Solo Admin.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - UPDATE: estado='PENDIENTE_EMISION', pago_confirmado_por, pago_confirmado_at

**Endpoints:**
- `PATCH /api/vuelos/:id/confirmar-pago` - Confirmar pago
  - Body: `{ userId }`
  - Solo si estado actual = PENDIENTE_CONFIRMACION_PAGO

**Lógica:**
1. Validar estado actual
2. UPDATE estado → PENDIENTE_EMISION
3. Registrar quién y cuándo confirmó

### 🎨 Frontend (UI/UX)

**Componentes:**
- Botón "Confirmar Pago" en `VueloDetail.jsx`
- Visible solo si:
  - Estado = PENDIENTE_CONFIRMACION_PAGO
  - Usuario tiene permiso `vuelos.confirm_payment` o es Admin

**UX:**
- SweetAlert2: "¿Confirmar que el pago fue recibido?"
- Al confirmar → estado cambia a PENDIENTE_EMISION

### ✅ Checklist de Progreso

- [x] Endpoint `PATCH /api/vuelos/:id/confirmar-pago` implementado
- [x] Servicio `confirmarPago(id, userId)`
- [x] Validación de estado previo
- [x] Registro de `pago_confirmado_por` y `pago_confirmado_at`
- [x] Botón en detalle de vuelo
- [x] Confirmación SweetAlert2
- [x] API centralizada: `VUELOS_API.confirmarPago(id)`
- [ ] Validación de permisos en backend (pendiente)

---

## 🎫 Marcar Vuelo como Emitido

**Descripción:** Marcar vuelo como EMITIDO tras emitir el boleto. Bloquea futuras ediciones.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - UPDATE: estado='EMITIDO', emitido_por, emitido_at

**Endpoints:**
- `PATCH /api/vuelos/:id/marcar-emitido` - Marcar emitido
  - Body: `{ userId }`
  - Solo si estado actual = PENDIENTE_EMISION

**Lógica:**
1. Validar estado = PENDIENTE_EMISION
2. UPDATE estado → EMITIDO
3. Registrar emisor y fecha
4. Disparar notificaciones

### 🎨 Frontend (UI/UX)

**Componentes:**
- Botón "Marcar como Emitido" en `VueloDetail.jsx`
- Visible solo si:
  - Estado = PENDIENTE_EMISION
  - Usuario tiene permiso emisión o es Admin/Gerente

**UX:**
- SweetAlert2: "¿Confirmar que el vuelo fue emitido?"
- Advertencia: "No podrá editarse después"

### ✅ Checklist de Progreso

- [x] Endpoint `PATCH /api/vuelos/:id/marcar-emitido` implementado
- [x] Servicio `marcarEmitido(id, userId)`
- [x] Validación de estado previo
- [x] Registro de `emitido_por` y `emitido_at`
- [x] Bloqueo de edición si estado = EMITIDO
- [x] Botón en detalle de vuelo
- [x] Confirmación crítica
- [x] Notificación automática
- [x] API centralizada: `VUELOS_API.marcarEmitido(id)`
- [ ] Validación de permisos en backend

---

## 📎 Subir Adjuntos (Comprobantes/Pasaportes)

**Descripción:** Subir archivos PDF/imágenes como comprobantes de pago o pasaportes de pasajeros.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos_adjuntos` - Metadatos (id, vuelo_id, tipo_adjunto='COMPROBANTE_PAGO|PASAPORTE', nombre_archivo, url_storage, mime_type, tamano_bytes, uploaded_by, pasajero_id)

**Storage:**
- Bucket: `vuelos-adjuntos`
- Path: `vuelos/{vueloId}_{tipo}_{timestamp}_{filename}`

**Endpoints:**
- `POST /api/vuelos/:id/adjuntos` - Subir archivo
  - Content-Type: multipart/form-data
  - Body: `{ file, tipo_adjunto, uploaded_by, pasajero_id? }`
  - Validación: tipo_adjunto IN ('COMPROBANTE_PAGO', 'PASAPORTE')

**Flujo:**
1. Upload a Supabase Storage
2. Obtener URL pública
3. INSERT metadata en `vuelos_adjuntos`

### 🎨 Frontend (UI/UX)

**Componentes:**
- `FileUpload.jsx` - Componente de drag & drop
- Validación:
  - Tamaño máximo: 10MB
  - Tipos permitidos: PDF, PNG, JPG, JPEG

**UX:**
- Drag & drop o click para seleccionar
- Vista previa de archivos
- Progress bar durante upload
- Lista de adjuntos subidos con link de descarga

### ✅ Checklist de Progreso

- [x] Bucket `vuelos-adjuntos` creado
- [x] Tabla `vuelos_adjuntos` creada
- [x] Endpoint `POST /api/vuelos/:id/adjuntos` implementado
- [x] Upload a Storage con multer
- [x] Validación de tipo y tamaño
- [x] Componente `FileUpload.jsx` completo
- [x] Drag & drop funcional
- [x] Vista previa de PDFs
- [x] Lista de adjuntos en detalle
- [x] API centralizada: `VUELOS_API.subirAdjunto(vueloId)`

---

## 📊 Estadísticas de Vuelos

**Descripción:** Dashboard con métricas de vuelos por usuario/equipo: total, emitidos, pendientes, conversión.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - Agregación con COUNT, SUM
- `profiles` - JOIN para equipos

**Query:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN estado = 'EMITIDO' THEN 1 END) as emitidos,
  COUNT(CASE WHEN estado = 'PENDIENTE_EMISION' THEN 1 END) as pendientes,
  SUM(monto_venta) as monto_total
FROM vuelos
WHERE created_by = :userId
```

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/vuelos` - Tab "Estadísticas"

**Componentes:**
- `VuelosStats.jsx` - Dashboard de métricas
- Cards:
  - Total de vuelos
  - Vuelos emitidos
  - Pendientes de emisión
  - Tasa de conversión
  - Monto total vendido
- Gráficos:
  - Recharts para visualización

### ✅ Checklist de Progreso

- [x] Componente `VuelosStats.jsx` creado
- [x] Cálculo de métricas en frontend
- [x] Cards con estadísticas
- [x] Tasa de conversión (emitidos/total)
- [x] Monto total formateado
- [x] Gráficos con Recharts
- [x] Filtrado por rol (mis vuelos vs equipo)
- [ ] Endpoint backend optimizado para stats (pendiente)
- [ ] Filtros por rango de fechas

---

## 🗑️ Eliminar Vuelo

**Descripción:** Eliminar vuelo y datos relacionados con CASCADE. Restricciones según estado.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos` - DELETE con CASCADE

**Endpoints:**
- `DELETE /api/vuelos/:id` - Eliminar vuelo
  - Validación: no permitir si estado = EMITIDO

**Relaciones CASCADE:**
- `vuelos_pasajeros`
- `vuelos_adjuntos`
- `vuelos_ediciones`

### 🎨 Frontend (UI/UX)

**Componentes:**
- Botón "Eliminar" en `VueloDetail.jsx`
- Solo visible si estado != EMITIDO

**UX:**
- SweetAlert2 crítico: "Esta acción no se puede deshacer"
- Mostrar impacto: "Se eliminarán X pasajeros y X adjuntos"
- Confirmación doble si tiene adjuntos

### ✅ Checklist de Progreso

- [x] Endpoint `DELETE /api/vuelos/:id` implementado
- [x] Servicio `eliminarVuelo(id)`
- [x] CASCADE DELETE configurado en DB
- [x] Validación: bloquear si EMITIDO
- [x] Botón de eliminar
- [x] Confirmación SweetAlert2
- [x] API centralizada: `VUELOS_API.eliminar(id)`
- [ ] Validación de permisos: solo creador o admin
- [ ] Soft delete en lugar de hard delete (considerar)

---

## 🔍 Ver Historial de Ediciones de Vuelo

**Descripción:** Timeline detallado de todas las modificaciones realizadas al vuelo con diff de cambios.

### 📋 Backend (DB/API)

**Tablas:**
- `vuelos_ediciones` - Registro completo (campos_modificados, valores_anteriores, valores_nuevos, intento_numero, razon_edicion, editado_at, editado_por)
- `profiles` - JOIN para nombre del editor

**Endpoints:**
- `GET /api/vuelos/:id/historial-ediciones`
  - Response: `[{ editor: { full_name, avatar_url }, campos_modificados, valores_anteriores, valores_nuevos, intento_numero, razon_edicion, editado_at }]`

**Orden:**
- Por `editado_at DESC` (más reciente primero)

### 🎨 Frontend (UI/UX)

**Componentes:**
- `HistorialEdiciones.jsx` - Timeline visual
- Para cada edición:
  - Avatar y nombre del editor
  - Fecha/hora
  - Intento número
  - Razón de edición
  - Lista de campos modificados con antes/después
  - Badge de diff (agregado/modificado/eliminado)

### ✅ Checklist de Progreso

- [x] Endpoint `GET /api/vuelos/:id/historial-ediciones` implementado
- [x] Query con JOIN de profiles
- [x] Componente `HistorialEdiciones.jsx` completo
- [x] Timeline vertical con línea conectora
- [x] Diff visual de cambios (antes → después)
- [x] Formato de fechas legible
- [x] Avatar del editor
- [x] Badge de intento número
- [x] Empty state si no hay ediciones
- [x] API centralizada: `VUELOS_API.historialEdiciones(id)`

---

## 📑 Listar Anulables

**Descripción:** Vista de vuelos anulables (reembolsables) con gestión de estados y tracking.

### 📋 Backend (DB/API)

**Tablas:**
- `anulables` - Tabla principal (id, vuelo_id, motivo, estado='PENDIENTE|APROBADO|RECHAZADO', fecha_solicitud, fecha_resolucion, resuelto_por)
- `vuelos` - Relación con vuelo original

**Endpoints:**
- `GET /api/anulables` - Listar anulables
- `GET /api/anulables/:id` - Obtener detalle
- `POST /api/anulables` - Crear solicitud de anulable
- `PUT /api/anulables/:id` - Actualizar estado
- `DELETE /api/anulables/:id` - Eliminar

**Relaciones:**
- `anulables.vuelo_id` → `vuelos.id` (FK)

### 🎨 Frontend (UI/UX)

**Páginas:**
- `/ventas/anulables` - Lista de anulables
- `/ventas/anulables/[id]` - Detalle

**Componentes:**
- Lista con filtros por estado
- Card de anulable con datos del vuelo asociado
- Acciones según permisos

### ✅ Checklist de Progreso

- [x] Tabla `anulables` creada
- [x] Endpoints CRUD implementados
- [x] Página `/ventas/anulables` creada
- [x] API centralizada: `ANULABLES_API`
- [ ] Componentes de lista y detalle (pendiente implementar)
- [ ] Flujo de aprobación/rechazo
- [ ] Notificaciones de cambio de estado
- [ ] Validación de permisos

---

**FIN DE TARJETAS**

---

## 📊 Resumen del Módulo

**Total de funcionalidades detectadas:** 21 tarjetas

### Módulo Cotizador (9 tarjetas)
1. **Crear Cotización** ✅ (vista unificada con soporte múltiples pasajeros)
2. **Listar y Filtrar Cotizaciones** ✅
3. **Ver Detalle de Cotización** ✅
4. **Editar Cotización** ✅
5. **Cambiar Estado de Cotización** ✅
6. **Eliminar Cotización** ✅
7. **Gestión de Tasas de Cambio** ✅
8. **Gestión de Monedas** ✅
9. **Exportar Cotización a PDF** ✅

### Módulo Vuelos (12 tarjetas)
10. **Crear Vuelo Nuevo (Manual)** ✅
11. **Crear Vuelo desde Cotización** ✅
12. **Listar y Filtrar Vuelos** ✅
13. **Ver Detalle de Vuelo** ✅
14. **Editar Vuelo (Con Límite de Intentos)** ✅
15. **Confirmar Pago de Vuelo** ✅
16. **Marcar Vuelo como Emitido** ✅
17. **Subir Adjuntos (Comprobantes/Pasaportes)** ✅
18. **Estadísticas de Vuelos** ✅
19. **Eliminar Vuelo** ✅
20. **Ver Historial de Ediciones** ✅
21. **Listar Anulables** 🚧

**Estado de implementación:**
- ✅ Completadas: 17 funcionalidades (~81%)
- 🚧 En progreso: 2 funcionalidades (~9%)
- ⏸️ Pendientes: 2 funcionalidades (~10%)

**Tecnologías principales:**
- **Backend:** Express.js + Supabase (PostgreSQL)
- **Frontend:** Next.js 16 + React + Tailwind CSS
- **Servicios:** 2 servicios principales (cotizacionesService, vuelosService)
- **Rutas API:** 2 archivos (cotizaciones.js, vuelos.js)
- **Componentes:** 20+ componentes especializados
- **Hooks personalizados:** 4 hooks del cotizador (useMonedas, useVueloInfo, useEscalas, useEquipaje)

**Pendientes críticos:**
- Validación de permisos en backend
- Paginación en listas
- Componentes de anulables
- Soft delete en lugar de hard delete
- RLS en Supabase
