# Componentes del Cotizador

Esta carpeta contiene componentes específicos del cotizador extraídos de `CotizadorForm.jsx` para mejorar la mantenibilidad y reducir la complejidad del componente principal.

## Arquitectura

Todos los componentes en esta carpeta son **específicos del cotizador** y no están diseñados para ser compartidos con otras partes de la aplicación. Cada componente es "dumb" (sin lógica de negocio compleja) y recibe todas sus dependencies vía props.

## Componentes

### CotizadorAgencySelector

Selector de agencia con temas dinámicos según la agencia seleccionada.

**Props:**
- `agencia: string` - Agencia seleccionada
- `setAgencia: (value) => void` - Actualizar agencia
- `theme: object` - Tema visual

**Líneas:** ~1843 bytes

### CotizadorClientInput

Input de nombre del cliente con validación básica.

**Props:**
- `nombreCliente: string` - Nombre del cliente
- `setNombreCliente: (value) => void` - Actualizar nombre

**Líneas:** ~1147 bytes

### CotizadorFormHeader

Header del formulario con título y descripción.

**Props:**
- Ninguno (componente estático)

**Líneas:** ~1627 bytes

### CotizadorFlightType

Selector de tipo de vuelo (Ida, Ida y Vuelta, Fines Migratorios).

**Props:**
- `vueloInfo: object` - Estado del vuelo
- `updateVueloInfo: (field, value) => void` - Actualizar campo
- `theme: object` - Tema visual

**Líneas:** ~5557 bytes

### CotizadorCurrencyConfig

Configuración de monedas (base, cotización, tasa de cambio).

**Props:**
- `monedaBase: string` - Moneda base seleccionada
- `monedaCotizacion: string` - Moneda de cotización
- `tasaCambio: number` - Tasa de cambio
- `monedasDB: array` - Lista de monedas desde BD
- `tasasDB: array` - Lista de tasas desde BD
- `setMonedaBaseSeleccionada: (value) => void` - Actualizar moneda base
- `setMonedaCotizacionSeleccionada: (value) => void` - Actualizar moneda cotización
- `monedasBase: array` - Monedas base disponibles
- `getMonedasConTasas: () => array` - Obtener monedas con tasas
- `loadingMonedas: boolean` - Estado de carga
- `theme: object` - Tema visual

**Líneas:** ~4595 bytes

### CotizadorPaymentSelector

Selector de método de pago con filtros por moneda.

**Props:**
- `metodoPago: string` - Método seleccionado
- `monedaCotizacionSeleccionada: string` - Moneda de cotización
- `metodosPagoFiltrados: array` - Métodos filtrados
- `setMetodoPago: (value) => void` - Actualizar método
- `theme: object` - Tema visual

**Líneas:** ~5586 bytes

### CotizadorPasajerosSection

Contenedor de la sección de pasajeros con banner informativo y PasajerosManager.

**Props:**
- `pasajeros: object` - Estado de pasajeros
- `setPasajeros: (value) => void` - Actualizar pasajeros
- `monedaPrecio: string` - Moneda del precio
- `monedaCotizacion: string` - Moneda de cotización
- `aerolinea: string` - Aerolínea seleccionada

**Líneas:** ~1181 bytes (25 líneas de código)

### CotizadorFlightDetails

Sección de detalles del vuelo con 3 subsecciones condicionales:
- Fines Migratorios (ámbar)
- Vuelo de Ida (índigo)
- Vuelo de Vuelta (púrpura)

**Props:**
- `vueloInfo: object` - Estado del vuelo
- `updateVueloInfo: (field, value) => void` - Actualizar campo
- `aerolinea: string` - Aerolínea
- `setAerolinea: (value) => void` - Actualizar aerolínea
- `setAerolineaCodigo: (value) => void` - Actualizar código
- `fechaSalidaMigratorio: string`
- `setFechaSalidaMigratorio: (value) => void`
- `horaSalidaMigratorio: string`
- `setHoraSalidaMigratorio: (value) => void`
- `horaLlegadaMigratorio: string`
- `setHoraLlegadaMigratorio: (value) => void`
- `fechaRegreso: string`
- `setFechaRegreso: (value) => void`
- `horaSalidaRegreso: string`
- `setHoraSalidaRegreso: (value) => void`
- `horaLlegadaRegreso: string`
- `setHoraLlegadaRegreso: (value) => void`
- `theme: object` - Tema visual

**Líneas:** ~7188 bytes (140 líneas de código)

### CotizadorScales

Sección de escalas con lista dinámica (máximo 2 escalas).

**Props:**
- `escalas: array` - Lista de escalas
- `agregarEscala: () => void` - Agregar escala
- `eliminarEscala: (index) => void` - Eliminar escala
- `actualizarEscala: (index, field, value) => void` - Actualizar escala

**Líneas:** ~2362 bytes (50 líneas de código)

## Métricas de la Refactorización

### Fase 1 (Componentes Iniciales)
- Componentes creados: 6
- Líneas reducidas: ~253 líneas (1,522 → 1,269)
- Reducción: 16.6%

### Fase 2 (Componentes Adicionales)
- Componentes creados: 3
- Líneas reducidas: ~309 líneas (1,269 → 960)
- Reducción adicional: 24.4%

### Total Acumulado
- **Componentes totales:** 9 componentes
- **Líneas reducidas:** ~562 líneas (1,522 → 960)
- **Reducción total:** 36.9%
- **Lógica modificada:** NINGUNA - Solo extracción de JSX
- **Riesgo de bugs:** MUY BAJO - Componentes "dumb" sin lógica

## Convenciones

- **Prefijo:** Todos los componentes tienen prefijo "Cotizador"
- **Ubicación:** `src/components/cotizador/sections/`
- **Tipos:** Componentes funcionales con hooks
- **Estilos:** TailwindCSS
- **Iconos:** Lucide React
