# Control de Emisiones - Interfaz Flexible

## Descripción
Vista administrativa que permite visualizar y gestionar vuelos pendientes de autorización con capacidad de edición inline de cuentas de emisión.

## Características

### Visualización Completa
- **Método de Pago**: Cómo pagó el cliente
- **Proveedor**: Plataforma de reserva (Sabre, Servivuelo, etc.)
- **Forma de Emisión**: CONTADO o CREDITO con badges visuales
- **Cuenta Original vs Asignada**: Trazabilidad de cambios
- **Borde Superior Color-Coded**: Verde esmeralda para CONTADO, ámbar para CREDITO

### Edición Inline
- Cambiar `cuenta_emision_asignada` sin salir de la vista
- Validaciones dinámicas según `forma_emision`
- Indicadores visuales en dropdown (💵 para cuentas solo-contado)
- Observaciones opcionales para auditoría
- Optimistic UI con feedback inmediato

### Agrupación Inteligente
- Grupos por `cuenta_emision_asignada`
- Métricas agregadas (total vuelos, monto, distribución CONTADO/CREDITO)
- Filtros dinámicos por forma de emisión
- Ordenamiento por cantidad de vuelos

## Endpoints

### PATCH /api/vuelos-emisiones/:id/cambiar-cuenta
Actualizar cuenta de emisión asignada

**Request:**
```json
{
  "userId": "uuid",
  "nueva_cuenta": "REVOLUT_GADDIEL",
  "observaciones": "Cambio solicitado por administración"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cuenta de emisión actualizada exitosamente",
  "vuelo": { ... }
}
```

**Validaciones:**
- Solo vuelos en `PENDIENTE_EMISION`
- Solo vuelos no autorizados
- CREDITO no puede usar Servivuelo/Chase

### GET /api/vuelos-emisiones/pendientes/agrupados
Obtener vuelos agrupados por cuenta

**Response 200:**
```json
{
  "grupos": {
    "CHASE_NOVA": {
      "vuelos": [...],
      "total_vuelos": 5,
      "total_monto": 4250.00,
      "forma_emision": { "CONTADO": 5, "CREDITO": 0 }
    }
  },
  "total_general": 8,
  "monto_general": 6350.00
}
```

## Componentes

### EmisionVueloCard
Card completa con información del vuelo y acciones

**Props:**
- `vuelo`: Objeto con datos del vuelo
- `userId`: ID del usuario actual
- `onCuentaChanged`: Callback al cambiar cuenta
- `onAutorizar`: Callback al aprobar
- `onVerDetalles`: Callback al ver detalles

**Features:**
- Borde superior color-coding según forma_emision
- Animación fade-in slide-in-from-bottom-4
- Hover effects con shadow
- Badges semánticos (💵 contado, 📋 crédito)

### InlineAccountEditor
Editor inline para cambiar cuenta de emisión

**Props:**
- `vueloId`: UUID del vuelo
- `cuentaActual`: Cuenta actual asignada
- `formaEmision`: CONTADO o CREDITO
- `userId`: ID del usuario
- `onSave`: Callback al guardar
- `onCancel`: Callback al cancelar

**Features:**
- Dropdown con indicadores visuales (💵 para cuentas solo-contado)
- Validación dinámica según forma_emision
- Estados: default, saving (spinner), error
- Animación slide-in al abrir

## Flujos de Usuario

### Cambiar Cuenta de Emisión
1. Usuario ve vuelo en grupo actual
2. Click en "Editar" en sección de cuenta
3. Card expande `InlineAccountEditor`
4. Selecciona nueva cuenta del dropdown (filtrado según forma_emision)
5. Indicadores visuales muestran cuentas solo-contado (💵)
6. Opcionalmente escribe observación
7. Click en "Guardar Cambio"
8. Optimistic UI actualiza inmediatamente
9. Backend valida y confirma
10. Vuelo se reagrupa automáticamente

### Aprobar Emisión
1. Usuario revisa información completa del vuelo
2. Confirma que cuenta asignada es correcta
3. Click en "Aprobar Emisión"
4. Vuelo se marca como autorizado
5. Desaparece de la vista de pendientes

## Validaciones

### Frontend
- Campo `nueva_cuenta` requerido
- Dropdown dinámico según `forma_emision`
- Deshabilitar botones durante guardado
- Indicadores visuales para cuentas solo-contado

### Backend
- Estado debe ser `PENDIENTE_EMISION`
- No puede estar autorizado previamente
- CREDITO no puede usar cuentas solo-contado
- UserId válido y con permisos

## Seguridad
- Solo roles: administracion, admin, super_admin
- Validación de permisos en backend
- Auditoría de cambios en `observaciones_emision`

## Performance
- Agrupación en backend (evitar N queries)
- Optimistic UI reduce latencia percibida
- Lazy loading de detalles de vuelo
- Animaciones CSS (no JS) para performance

## Design System
- **Base unit spacing**: 4px (8px, 12px, 16px, 20px, 24px)
- **Border progression**: Standard → Soft → Emphasis → Focus
- **Color world**: Índigo (acciones), verde esmeralda (contado/éxito), ámbar (crédito/advertencia), rojo (error)
- **Depth**: Borders-only con hover shadows
- **Typography**: 4-level hierarchy (primary, secondary, tertiary, muted)
