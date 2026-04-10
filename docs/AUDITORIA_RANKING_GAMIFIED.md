# AUDITORÍA - SISTEMA DE RANKING GAMIFICADO

## ESTRUCTURA ACTUAL DETECTADA

### 1. Backend - `/src/routes/rankings.js`

**Query Actual (Líneas 17-42):**
```sql
SELECT 
  id, estado, monto_venta, total_cotizacion, moneda_precio, 
  moneda_cotizacion, tasa_cambio, created_by, created_at, ruta,
  pasajeros:vuelos_pasajeros(fee_agencia),
  creator:profiles!created_by(
    id, full_name, email, equipo_id,
    equipo:equipos!equipo_id(id, nombre, color),
    role:roles(id, name)
  )
FROM vuelos 
WHERE estado != 'CANCELADO'
```

**PROBLEMAS IDENTIFICADOS:**
1. **SIN FILTRO DE FECHA** - Toma TODOS los vuelos históricos
2. **SIN DATOS DE AGENCIA** - No incluye `usuario_agencias` ni `agencias`
3. **SUMA TOTAL** - `feeAgenciaTotal` es acumulado histórico, no mensual

### 2. Base de Datos - Estructura Relevante

**Tablas Clave:**
- `vuelos` - Tiene `created_at` (para filtro mensual)
- `vuelos_pasajeros` - Tiene `fee_agencia` (valor a sumar)
- `profiles` - Datos del usuario
- `usuario_agencias` - Relación N:M usuario-agencia con `is_primary`
- `agencias` - Códigos: APOLO, NOVA, NOVA_FLASH, NOVA_COLOMBIA

### 3. Frontend - `RankingGlobal.jsx`

**Datos que muestra:**
- `feeAgenciaTotal` (acumulado histórico)
- `montoTotal`
- `emitidos`
- `totalVuelos`
- `porcentajeConversion`

## QUERIES NECESARIAS PARA GAMIFICACIÓN

### Query Modificada con Filtros

```sql
-- Query principal modificada para ranking gamificado
SELECT 
  profiles.id,
  profiles.full_name,
  profiles.email,
  profiles.equipo_id,
  equipos.nombre as equipo_nombre,
  equipos.color as equipo_color,
  roles.name as rol,
  -- Agencia primaria del usuario
  COALESCE(
    (SELECT ag.codigo FROM agencias a 
     JOIN usuario_agencias ua ON a.id = ua.agencia_id 
     WHERE ua.user_id = profiles.id AND ua.is_primary = true 
     LIMIT 1),
    'SIN_AGENCIA'
  ) as agencia_codigo,
  -- Fee del mes actual
  COALESCE(
    (SELECT SUM(vp.fee_agencia) 
     FROM vuelos v 
     JOIN vuelos_pasajeros vp ON v.id = vp.vuelo_id 
     WHERE v.created_by = profiles.id 
       AND v.estado != 'CANCELADO'
       AND DATE_TRUNC('month', v.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    ), 0
  ) as fee_agencia_mensual,
  -- Datos existentes
  COUNT(v.id) as total_vuelos,
  SUM(CASE WHEN v.estado = 'EMITIDO' THEN 1 ELSE 0 END) as emitidos,
  SUM(v.monto_venta) as monto_total
FROM profiles
LEFT JOIN equipos ON profiles.equipo_id = equipos.id
LEFT JOIN roles ON profiles.role_id = roles.id
LEFT JOIN vuelos v ON profiles.id = v.created_by AND v.estado != 'CANCELADO'
GROUP BY profiles.id, equipos.nombre, equipos.color, roles.name
```

### Query para Datos Personales

```sql
-- Para endpoint /api/rankings/personal/:userId
SELECT 
  p.id, p.full_name, p.email,
  COALESCE(ua.agencia_id::text, 'SIN_AGENCIA') as agencia_id,
  COALESCE(a.codigo, 'SIN_AGENCIA') as agencia_codigo,
  COALESCE(a.nombre, 'Sin Agencia') as agencia_nombre,
  -- Fee mensual completo
  (SELECT COALESCE(SUM(vp.fee_agencia), 0)
   FROM vuelos v 
   JOIN vuelos_pasajeros vp ON v.id = vp.vuelo_id 
   WHERE v.created_by = p.id 
     AND v.estado != 'CANCELADO'
     AND DATE_TRUNC('month', v.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  ) as fee_mensual,
  -- Fee quincena actual
  (SELECT COALESCE(SUM(vp.fee_agencia), 0)
   FROM vuelos v 
   JOIN vuelos_pasajeros vp ON v.id = vp.vuelo_id 
   WHERE v.created_by = p.id 
     AND v.estado != 'CANCELADO'
     AND DATE_TRUNC('month', v.created_at) = DATE_TRUNC('month', CURRENT_DATE)
     AND (
       -- Quincena 1: días 1-15
       (EXTRACT(DAY FROM v.created_at) <= 15) OR
       -- Quincena 2: días 16 en adelante
       (EXTRACT(DAY FROM v.created_at) >= 16)
     )
  ) as fee_quincenal
FROM profiles p
LEFT JOIN usuario_agencias ua ON p.id = ua.user_id AND ua.is_primary = true
LEFT JOIN agencias a ON ua.agencia_id = a.id
WHERE p.id = $1
```

## REQUERIMIENTOS DE MODIFICACIÓN

### Backend (src/routes/rankings.js)
1. **Agregar filtro de fecha mensual** a query principal
2. **Incluir JOIN con usuario_agencias y agencias**
3. **Calcular meta según agencia** (APOLO: 3000, otros: 3500)
4. **Crear nuevo endpoint** `/api/rankings/personal/:userId`

### Frontend (RankingContext.js)
1. **Agregar estado para datos personales**
2. **Crear función cargarDatosPersonales()**
3. **Integrar con useAuth para cargar datos del usuario actual**

### Componentes
1. **BarraProgresoMeta.jsx** - Para ranking global (sin cantidades)
2. **BarraPersonalHeader.jsx** - Para header (con cantidades y comisión)

## VALIDACIONES IDENTIFICADAS

### Fechas
- **Mes vigente**: `DATE_TRUNC('month', CURRENT_DATE)` al final del mes
- **Quincena 1**: Día 1-15 de cada mes
- **Quincena 2**: Día 16 al fin del mes
- **Día de cobro**: 15 y último día del mes (ajustado a lunes si cae weekend)

### Metas
- **APOLO**: $3,000 fee_agencia
- **NOVA/NOVA_FLASH/NOVA_COLOMBIA**: $3,500 fee_agencia
- **SIN_AGENCIA**: $3,500 fee_agencia (default)

### Comisiones
- **12%** si NO alcanzó meta mensual
- **15%** SI alcanzó meta mensual
- **Aplica al fee quincenal** (no al mensual)

## ESTADO ACTUAL: AUDITORÍA COMPLETADA

**Próximo paso: FASE 2 - Crear helpers y utilidades**
