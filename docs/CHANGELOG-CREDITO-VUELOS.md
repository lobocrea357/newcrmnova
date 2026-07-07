# Changelog: Gestión de Crédito en Vuelos

**Fecha:** 2026-04-23  
**Versión:** 1.0.0

## Resumen

Implementación completa de gestión de ventas a crédito con pagos iniciales, diferenciando entre deuda del cliente y deuda con el proveedor.

## Cambios en Base de Datos

### Nuevas Columnas en Tabla `vuelos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `monto_total_venta` | numeric | Precio total que debe pagar el cliente (incluye markup) |
| `pago_inicial_cliente` | numeric | Monto inicial que pagó el cliente |
| `saldo_pendiente_cliente` | numeric | Saldo que debe el cliente (calculado automáticamente) |
| `costo_base_proveedor` | numeric | Costo base que la agencia debe al proveedor |

### Triggers Automáticos

- `trigger_calcular_saldo_pendiente`: Calcula automáticamente el saldo pendiente del cliente cuando `forma_emision = 'CREDITO'`
  - Valida que el pago inicial no sea mayor al monto total
  - Establece saldo en 0 para ventas al contado

### Índices Nuevos

- `idx_vuelos_saldo_pendiente`: Optimiza consultas de deudas de clientes (WHERE saldo_pendiente_cliente > 0)
- `idx_vuelos_forma_emision`: Optimiza filtros por forma de emisión

## Cambios en Backend

### Validaciones Nuevas (API - `src/routes/vuelos.js`)

- Validación condicional de campos según `forma_emision`
- Verificación de campos requeridos para crédito: `monto_total_venta`, `pago_inicial_cliente`, `costo_base_proveedor`
- Validación de coherencia de montos:
  - Pago inicial ≤ Monto total
  - Costo base ≤ Precio de venta
  - Montos no negativos
- Mensajes de error descriptivos con sugerencias

### Servicio de Vuelos (`src/services/vuelosService.js`)

- Nuevo método `_validarDatosCreditoCompleto()`:
  - Verifica existencia de todos los campos de crédito
  - Valida que montos sean positivos
  - Valida coherencia lógica de los montos
  - Logging de validación exitosa
- Validaciones en `crearVuelo()` para datos de crédito

### Servicio de Emisiones (`src/services/emisionesService.js`)

- Actualizado `autorizarEmision()` para incluir `costo_base_proveedor` en la consulta del vuelo
- Actualizado `crearDeudaProveedor()`:
  - Usa `costo_base_proveedor` del vuelo cuando está disponible
  - Fallback a suma de `precio_pantalla` de pasajeros para vuelos viejos
  - Logging para debugging de qué método se usa

## Cambios en Frontend

### Formulario de Nuevo Vuelo (`dashboard/src/components/vuelos/VueloFormNuevo.jsx`)

- 3 campos nuevos en estado del formulario:
  - `monto_total_venta`
  - `pago_inicial_cliente` (default '0')
  - `costo_base_proveedor`

- Sección "Gestión de Crédito" con renderizado condicional:
  - Solo aparece cuando `forma_emision = 'CREDITO'`
  - 3 campos de entrada con colores semánticos:
    - Costo Base (naranja) - Lo que debes al proveedor
    - Monto Total Venta (verde) - Precio al cliente
    - Pago Inicial (azul) - Inicial del cliente
  - Resumen visual de cálculos en tiempo real:
    - Saldo Pendiente Cliente (rojo)
    - Deuda con Proveedor (naranja)
    - Ganancia Proyectada (verde)
  - Advertencia informativa con icono AlertCircle
  - Animaciones CSS para entrada suave

- Validaciones cliente-side:
  - Validaciones condicionales para ventas a crédito
  - Verificación de campos requeridos
  - Validación de coherencia de montos
  - Mensajes de error descriptivos

- Envío de datos:
  - Campos de crédito incluidos en `submitData`
  - Envío condicional: solo si `forma_emision = 'CREDITO'`
  - Conversión a `parseFloat` para asegurar tipo numérico
  - `null` para ventas al contado

## Integración con Módulos Existentes

### Control de Emisiones
- Ahora usa `costo_base_proveedor` para calcular deudas con proveedores
- Compatibilidad con vuelos existentes mediante fallback

### Gestión de Deudas
- `saldo_pendiente_cliente` disponible para consultas de deudas de clientes
- Índice optimizado para consultas de saldos pendientes

## Casos de Uso

### Ejemplo de Venta a Crédito

```
Boleto en Sabre: $500 USD (costo_base_proveedor)
Precio al cliente: $600 USD (monto_total_venta)
Pago inicial: $200 USD (pago_inicial_cliente)
────────────────────────────────────────
Saldo cliente: $400 USD (saldo_pendiente_cliente - calculado automáticamente)
Deuda proveedor: $500 USD (para tabla deudas_proveedores)
Ganancia agencia: $100 USD ($600 - $500)
```

## Testing

Los tests manuales de la FASE 4 fueron omitidos por el usuario.

## Archivos Modificados

- `docs/05-base-de-datos/migraciones/2026-04-23-credito-vuelos.sql` (creado)
- `docs/05-base-de-datos/migraciones/2026-04-23-trigger-saldo-credito.sql` (creado)
- `docs/05-base-de-datos/migraciones/2026-04-23-rollback-migracion-incorrecta.sql` (creado)
- `src/routes/vuelos.js` (modificado)
- `src/services/vuelosService.js` (modificado)
- `src/services/emisionesService.js` (modificado)
- `dashboard/src/components/vuelos/VueloFormNuevo.jsx` (modificado)
- `docs/CHANGELOG-CREDITO-VUELOS.md` (creado)

## Notas Importantes

- La migración de base de datos debe ejecutarse manualmente en el SQL editor
- El trigger de cálculo automático garantiza integridad de datos
- El fallback en emisionesService asegura compatibilidad con datos existentes
- Validaciones en 4 capas: Frontend → API → Servicio → BD
