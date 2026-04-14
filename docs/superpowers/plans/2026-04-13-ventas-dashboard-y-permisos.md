# Ventas Dashboard y Corrección de Permisos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar dashboard de ventas con 11 KPIs normalizados y corregir validación de permisos en edición de vuelos según roles específicos.

**Architecture:** Sistema modular con helper de KPIs para normalización de monedas usando tasa_cambio guardada, validación granular de permisos frontend y backend, dashboard responsive con diseño editorial financiero.

**Tech Stack:** React, Next.js, Tailwind CSS, Supabase, Lucide Icons, JavaScript ES6+

---

## File Structure Overview

**New Files:**
- `dashboard/src/lib/ventas/kpiHelpers.js` - Helper functions para cálculo de KPIs con normalización
- `dashboard/src/app/(crm)/ventas/page.jsx` - Dashboard principal de ventas
- `dashboard/src/components/ventas/KPICard.jsx` - Componente reutilizable para KPIs
- `dashboard/src/components/ventas/ChartMini.jsx` - Componente para gráficos pequeños
- `dashboard/src/components/ventas/NavigationCard.jsx` - Cards de navegación a módulos
- `src/services/permisosService.js` - Servicio de validación de permisos centralizado

**Modified Files:**
- `dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx` - Corregir lógica de permisos
- `src/routes/vuelos.js` - Agregar validación backend en endpoint PUT
- `src/services/vuelosService.js` - Agregar métodos de validación e historial
- `dashboard/src/app/(crm)/ventas/vuelos/page.jsx` - Actualizar breadcrumbs
- `dashboard/src/app/(crm)/ventas/vuelos/nuevo/page.jsx` - Actualizar breadcrumbs
- `dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx` - Actualizar breadcrumbs

---

## Task 1: Helper de KPIs con Normalización de Monedas

**Files:**
- Create: `dashboard/src/lib/ventas/kpiHelpers.js`

- [ ] **Step 1: Create base structure for KPI helpers**

```javascript
/**
 * Helper functions para cálculo de KPIs de ventas con normalización de monedas
 * Estrategia: Usar total_cotizacion (monto limpio) normalizado a USD usando tasa_cambio
 */

import { obtenerTasa } from '../cotizador/tasasHelpers'

/**
 * Normalizar monto a USD usando tasa_cambio guardada o tasa actual
 */
export function normalizarMontoUSD(vuelo, tasasActuales = {}) {
  // CASO 1: Moneda precio es USD (directo)
  if (vuelo.moneda_precio === 'USD') {
    return vuelo.total_cotizacion
  }
  
  // CASO 2: Moneda precio es EUR (convertir a USD)
  if (vuelo.moneda_precio === 'EUR') {
    // Usar tasa_cambio guardada si existe, sino tasa actual
    const tasa = vuelo.tasa_cambio || tasasActuales.EUR_USD || 1.1
    return vuelo.total_cotizacion * tasa
  }
  
  // CASO 3: Otras monedas de precio (no debería ocurrir pero por seguridad)
  return vuelo.total_cotizacion
}

/**
 * Calcular total vendido del mes (USD normalizado)
 */
export function calcularTotalVendidoMes(vuelos, fechaActual = new Date(), tasasActuales = {}) {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
  
  return vuelos
    .filter(v => {
      const fechaVuelo = new Date(v.created_at)
      return v.estado === 'EMITIDO' && 
             fechaVuelo >= inicioMes && 
             fechaVuelo <= finMes
    })
    .reduce((total, vuelo) => total + normalizarMontoUSD(vuelo, tasasActuales), 0)
}

/**
 * Contar vuelos emitidos
 */
export function contarVuelosEmitidos(vuelos, fechaActual = new Date()) {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
  
  return vuelos.filter(v => {
    const fechaVuelo = new Date(v.created_at)
    return v.estado === 'EMITIDO' && 
           fechaVuelo >= inicioMes && 
           fechaVuelo <= finMes
  }).length
}

/**
 * Calcular ticket promedio (USD normalizado)
 */
export function calcularTicketPromedio(vuelos, fechaActual = new Date(), tasasActuales = {}) {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
  
  const vuelosEmitidos = vuelos.filter(v => {
    const fechaVuelo = new Date(v.created_at)
    return v.estado === 'EMITIDO' && 
           fechaVuelo >= inicioMes && 
           fechaVuelo <= finMes
  })
  
  if (vuelosEmitidos.length === 0) return 0
  
  const total = vuelosEmitidos.reduce((sum, vuelo) => sum + normalizarMontoUSD(vuelo, tasasActuales), 0)
  return total / vuelosEmitidos.length
}

/**
 * Contar pendientes de emisión
 */
export function contarPendientesEmision(vuelos) {
  return vuelos.filter(v => v.estado === 'PENDIENTE_EMISION').length
}

/**
 * Contar vuelos con observaciones
 */
export function contarVuelosConObservaciones(vuelos) {
  return vuelos.filter(v => v.observaciones_pago && v.observaciones_pago.trim() !== '').length
}

/**
 * Obtener proveedores top 3
 */
export function obtenerProveedoresTop(vuelos, limit = 3) {
  const proveedores = {}
  
  vuelos
    .filter(v => v.estado === 'EMITIDO' && v.proveedor)
    .forEach(v => {
      proveedores[v.proveedor] = (proveedores[v.proveedor] || 0) + 1
    })
  
  return Object.entries(proveedores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([proveedor, count]) => ({ proveedor, count }))
}

/**
 * Obtener ventas por agencia
 */
export function obtenerVentasPorAgencia(vuelos, tasasActuales = {}) {
  const agencias = { nova: 0, 'nova-colombia': 0, apolo: 0 }
  
  vuelos
    .filter(v => v.estado === 'EMITIDO')
    .forEach(v => {
      const monto = normalizarMontoUSD(v, tasasActuales)
      if (v.agencia && agencias[v.agencia] !== undefined) {
        agencias[v.agencia] += monto
      }
    })
  
  return agencias
}

/**
 * Obtener métodos de pago populares
 */
export function obtenerMetodosPagoPopulares(vuelos, limit = 3) {
  const metodos = {}
  
  vuelos
    .filter(v => v.estado === 'EMITIDO' && v.metodo_pago)
    .forEach(v => {
      metodos[v.metodo_pago] = (metodos[v.metodo_pago] || 0) + 1
    })
  
  return Object.entries(metodos)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([metodo, count]) => ({ metodo, count }))
}

/**
 * Obtener rutas más vendidas
 */
export function obtenerRutasMasVendidas(vuelos, limit = 5) {
  const rutas = {}
  
  vuelos
    .filter(v => v.estado === 'EMITIDO' && v.origen && v.destino)
    .forEach(v => {
      const ruta = `${v.origen} - ${v.destino}`
      rutas[ruta] = (rutas[ruta] || 0) + 1
    })
  
  return Object.entries(rutas)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([ruta, count]) => ({ ruta, count }))
}

/**
 * Calcular comparativa mes anterior
 */
export function calcularComparativaMesAnterior(vuelosActuales, vuelosAnteriores, tasasActuales = {}) {
  const totalActual = calcularTotalVendidoMes(vuelosActuales, new Date(), tasasActuales)
  const totalAnterior = calcularTotalVendidoMes(vuelosAnteriores, new Date(Date.now() - 30*24*60*60*1000), tasasActuales)
  
  if (totalAnterior === 0) return { porcentaje: 0, tendencia: 'neutral' }
  
  const porcentaje = ((totalActual - totalAnterior) / totalAnterior) * 100
  const tendencia = porcentaje > 0 ? 'positiva' : porcentaje < 0 ? 'negativa' : 'neutral'
  
  return { porcentaje: Math.abs(porcentaje), tendencia }
}

/**
 * Calcular tiempo promedio de emisión
 */
export function calcularTiempoPromedioEmision(vuelos) {
  const vuelosEmitidos = vuelos.filter(v => 
    v.estado === 'EMITIDO' && 
    v.created_at && 
    v.updated_at
  )
  
  if (vuelosEmitidos.length === 0) return 0
  
  const totalDias = vuelosEmitidos.reduce((sum, vuelo) => {
    const creado = new Date(vuelo.created_at)
    const emitido = new Date(vuelo.updated_at)
    const dias = Math.ceil((emitido - creado) / (1000 * 60 * 60 * 24))
    return sum + dias
  }, 0)
  
  return Math.round(totalDias / vuelosEmitidos.length * 10) / 10
}
```

- [ ] **Step 2: Test KPI helpers with sample data**

```javascript
// Add test at bottom of file for validation
const sampleVuelos = [
  {
    id: 1,
    estado: 'EMITIDO',
    total_cotizacion: 1000,
    moneda_precio: 'USD',
    moneda_cotizacion: 'USD',
    tasa_cambio: 1,
    created_at: '2026-04-15T10:00:00Z',
    proveedor: 'American Airlines',
    agencia: 'nova',
    metodo_pago: 'Zelle',
    origen: 'Miami',
    destino: 'Caracas'
  },
  {
    id: 2,
    estado: 'EMITIDO',
    total_cotizacion: 800,
    moneda_precio: 'EUR',
    moneda_cotizacion: 'USD',
    tasa_cambio: 1.1,
    created_at: '2026-04-10T10:00:00Z',
    proveedor: 'Iberia',
    agencia: 'apolo',
    metodo_pago: 'Bizum',
    origen: 'Madrid',
    destino: 'Bogotá'
  }
]

// Test functions
console.log('Total vendido mes:', calcularTotalVendidoMes(sampleVuelos))
console.log('Vuelos emitidos:', contarVuelosEmitidos(sampleVuelos))
console.log('Ticket promedio:', calcularTicketPromedio(sampleVuelos))
```

- [ ] **Step 3: Commit KPI helpers**

```bash
git add dashboard/src/lib/ventas/kpiHelpers.js
git commit -m "feat: add KPI helpers with USD normalization using tasa_cambio"
```

---

## Task 2: Componentes Reutilizables para Dashboard

**Files:**
- Create: `dashboard/src/components/ventas/KPICard.jsx`
- Create: `dashboard/src/components/ventas/ChartMini.jsx`
- Create: `dashboard/src/components/ventas/NavigationCard.jsx`

- [ ] **Step 1: Create KPICard component**

```jsx
/**
 * Componente reutilizable para mostrar KPIs con diseño editorial financiero
 */
import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon: Icon, 
  color = 'indigo',
  size = 'medium', // 'small', 'medium', 'large'
  loading = false 
}) => {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      iconBg: 'bg-green-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      iconBg: 'bg-red-100'
    }
  }

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  }

  const valueSizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  }

  const colors = colorClasses[color] || colorClasses.indigo

  const getTrendIcon = () => {
    if (trend === 'positiva') return TrendingUp
    if (trend === 'negativa') return TrendingDown
    return Minus
  }

  const getTrendColor = () => {
    if (trend === 'positiva') return 'text-green-600'
    if (trend === 'negativa') return 'text-red-600'
    return 'text-gray-500'
  }

  const TrendIcon = getTrendIcon()

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${colors.bg} ${colors.border} border rounded-lg animate-pulse`}>
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${colors.bg} ${colors.border} border rounded-lg transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${colors.iconBg} rounded-lg`}>
          {Icon && <Icon className={`w-5 h-5 ${colors.text}`} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className={`font-bold ${valueSizeClasses[size]} ${colors.text} tabular-nums`}>
          {value}
        </h3>
        <p className="text-sm text-gray-600 font-medium">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default KPICard
```

- [ ] **Step 2: Create ChartMini component**

```jsx
/**
 * Componente para gráficos pequeños tipo sparkline
 */
import React from 'react'

const ChartMini = ({ 
  data, 
  type = 'bar', // 'bar', 'line', 'pie'
  height = 60,
  color = 'indigo',
  labels = true 
}) => {
  const colorClasses = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }

  const barColor = colorClasses[color] || colorClasses.indigo

  if (type === 'bar') {
    const maxValue = Math.max(...data.map(d => d.value))
    
    return (
      <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className={`${barColor} rounded-t transition-all duration-300 hover:opacity-80`}
              style={{ 
                height: `${(item.value / maxValue) * height}px`,
                minHeight: '4px'
              }}
              title={labels ? `${item.label}: ${item.value}` : item.value}
            />
            {labels && (
              <span className="text-xs text-gray-500 mt-1 truncate max-w-full">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="relative w-12 h-12">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const rotation = index === 0 ? 0 : data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0)
            
            return (
              <div
                key={index}
                className={`absolute inset-0 ${barColor} rounded-full`}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((rotation - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotation - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotation + percentage * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotation + percentage * 3.6 - 90) * Math.PI / 180)}%)`
                }}
                title={labels ? `${item.label}: ${item.value} (${percentage.toFixed(1)}%)` : `${item.value} (${percentage.toFixed(1)}%)`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return <div className="text-gray-400 text-sm">Chart type not supported</div>
}

export default ChartMini
```

- [ ] **Step 3: Create NavigationCard component**

```jsx
/**
 * Componente para tarjetas de navegación a módulos
 */
import React from 'react'
import { ChevronRight } from 'lucide-react'

const NavigationCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = 'indigo',
  metric = null,
  metricLabel = null 
}) => {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-100',
      iconBg: 'bg-indigo-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      hoverBg: 'hover:bg-green-100',
      iconBg: 'bg-green-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      hoverBg: 'hover:bg-amber-100',
      iconBg: 'bg-amber-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      hoverBg: 'hover:bg-red-100',
      iconBg: 'bg-red-100'
    }
  }

  const colors = colorClasses[color] || colorClasses.indigo

  return (
    <a 
      href={href}
      className={`${colors.bg} ${colors.border} border rounded-lg p-6 transition-all duration-200 ${colors.hoverBg} hover:shadow-md group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${colors.iconBg} rounded-lg`}>
          {Icon && <Icon className={`w-6 h-6 ${colors.text}`} />}
        </div>
        <ChevronRight className={`w-5 h-5 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
      
      <div className="space-y-2">
        <h3 className={`font-bold text-lg ${colors.text}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
        
        {metric !== null && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${colors.text} tabular-nums`}>
                {metric}
              </span>
              {metricLabel && (
                <span className="text-sm text-gray-500">
                  {metricLabel}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </a>
  )
}

export default NavigationCard
```

- [ ] **Step 4: Commit dashboard components**

```bash
git add dashboard/src/components/ventas/KPICard.jsx dashboard/src/components/ventas/ChartMini.jsx dashboard/src/components/ventas/NavigationCard.jsx
git commit -m "feat: add reusable dashboard components with editorial financial design"
```

---

## Task 3: Corrección de Validación de Permisos - Frontend

**Files:**
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx`

- [ ] **Step 1: Add helper function to get manager teams**

```jsx
// Add after imports, before EditarVueloPage function
/**
 * Obtener equipos que gestiona un gerente
 */
async function obtenerEquiposDelGerente(userId) {
  const { data, error } = await supabase
    .from('equipos')
    .select('id, nombre')
    .eq('gerente_id', userId)
    .eq('is_active', true)
  
  if (error) {
    console.error('Error obteniendo equipos del gerente:', error)
    return []
  }
  
  return data || []
}
```

- [ ] **Step 2: Replace permission validation logic**

```jsx
// Find and replace the existing permission validation (around lines 58-84)

// OLD CODE TO REPLACE:
// Validar permisos con sistema granular
const esCreador = data.created_by === user?.id
const mismoEquipo = profile?.equipo_id && data.creator?.equipo_id === profile.equipo_id

let puedeEditar = false

if (tieneEditAll) {
  // Admin/Super Admin pueden editar todo
  puedeEditar = true
} else if (tieneEditTeam && mismoEquipo) {
  // Gerente puede editar vuelos de su equipo
  puedeEditar = true
} else if (tieneEditOwn && esCreador) {
  // Asesor puede editar sus propios vuelos (con límite)
  const edicionesDisponibles = data.ediciones_disponibles ?? 3
  if (edicionesDisponibles > 0) {
    puedeEditar = true
  } else {
    setError('Has agotado tus intentos de edición para este vuelo.')
    return
  }
}

// NEW CODE:
// Validar permisos con sistema granular corregido
const esCreador = data.created_by === user?.id
const esAdmin = isRole('admin')
const esSuperAdmin = isRole('super_admin')

let puedeEditar = false
let sinLimiteEdiciones = false

// 1. Super Admin puede editar TODO (incluso emitidos)
if (tieneEditAll && esSuperAdmin) {
  puedeEditar = true
  sinLimiteEdiciones = true
}
// 2. Admin puede editar cualquier vuelo NO emitido
else if (tieneEditAll && esAdmin && data.estado !== 'EMITIDO') {
  puedeEditar = true
  sinLimiteEdiciones = true
}
// 3. Gerente puede editar vuelos de su equipo (no emitidos)
else if (tieneEditTeam && data.estado !== 'EMITIDO') {
  // Obtener equipos que gestiona el gerente
  const equiposGestionados = await obtenerEquiposDelGerente(user?.id)
  const equipoIdsGestionados = equiposGestionados.map(e => e.id)
  const creadorEnMiEquipo = equipoIdsGestionados.includes(data.creator?.equipo_id)
  
  if (creadorEnMiEquipo) {
    puedeEditar = true
    sinLimiteEdiciones = true
  }
}
// 4. Asesor puede editar sus propios vuelos (con límite)
else if (tieneEditOwn && esCreador && data.estado !== 'EMITIDO') {
  const edicionesDisponibles = data.ediciones_disponibles ?? 3
  if (edicionesDisponibles > 0) {
    puedeEditar = true
    sinLimiteEdiciones = false
  } else {
    setError('Has agotado tus intentos de edición para este vuelo.')
    return
  }
}

if (!puedeEditar) {
  setError('No tienes permisos para editar este vuelo.')
  return
}
```

- [ ] **Step 3: Update form submission to use sinLimiteEdiciones**

```jsx
// Find the handleSubmit function and update the API call

// Look for the API call around line 200+ and update:
const response = await fetch(`/api/vuelos/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    vuelo: formData,
    pasajeros: pasajeros,
    razon_edicion: razonEdicion,
    user_id: user?.id,
    user_role: profile?.role,
    sin_limite_ediciones: sinLimiteEdiciones // Add this line
  })
})
```

- [ ] **Step 4: Test frontend permission changes**

```bash
# Run dev server to test
npm run dev
# Navigate to /ventas/vuelos/[id]/editar and test different roles
```

- [ ] **Step 5: Commit frontend permission fixes**

```bash
git add dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx
git commit -m "fix: correct team validation for manager permissions in flight editing"
```

---

## Task 4: Servicio de Validación de Permisos - Backend

**Files:**
- Create: `src/services/permisosService.js`
- Modify: `src/routes/vuelos.js`
- Modify: `src/services/vuelosService.js`

- [ ] **Step 1: Create permissions service**

```javascript
/**
 * Servicio centralizado de validación de permisos
 */

/**
 * Validar permisos de edición de vuelo según rol y estado
 */
async function validarPermisosEdicionVuelo(vueloId, userId, userRole) {
  try {
    // 1. Obtener vuelo actual
    const { data: vuelo, error } = await supabase
      .from('vuelos')
      .select('*')
      .eq('id', vueloId)
      .single()
    
    if (error || !vuelo) {
      throw new Error('Vuelo no encontrado')
    }
    
    // 2. Si está emitido, solo super_admin puede editar
    if (vuelo.estado === 'EMITIDO' && userRole !== 'super_admin') {
      throw new Error('Solo super admin puede editar vuelos emitidos')
    }
    
    // 3. Super admin puede editar todo
    if (userRole === 'super_admin') {
      return { 
        permitido: true, 
        sinLimite: true,
        vuelo 
      }
    }
    
    // 4. Admin puede editar cualquier vuelo NO emitido
    if (userRole === 'admin') {
      return { 
        permitido: true, 
        sinLimite: true,
        vuelo 
      }
    }
    
    // 5. Gerente puede editar vuelos de su equipo (no emitidos)
    if (userRole === 'gerente') {
      // Obtener equipos que gestiona
      const { data: equipos } = await supabase
        .from('equipos')
        .select('id')
        .eq('gerente_id', userId)
        .eq('is_active', true)
      
      const equipoIds = (equipos || []).map(e => e.id)
      
      // Obtener creador del vuelo
      const { data: creador } = await supabase
        .from('profiles')
        .select('equipo_id')
        .eq('id', vuelo.created_by)
        .single()
      
      if (creador && equipoIds.includes(creador.equipo_id)) {
        return { 
          permitido: true, 
          sinLimite: true,
          vuelo 
        }
      }
    }
    
    // 6. Asesor puede editar sus propios vuelos (con límite)
    if (vuelo.created_by === userId) {
      const edicionesDisponibles = vuelo.ediciones_disponibles ?? 3
      if (edicionesDisponibles <= 0) {
        throw new Error('Has agotado tus ediciones para este vuelo')
      }
      return { 
        permitido: true, 
        sinLimite: false,
        vuelo 
      }
    }
    
    // 7. No tiene permisos
    throw new Error('No tienes permisos para editar este vuelo')
    
  } catch (error) {
    console.error('Error validando permisos de edición:', error)
    throw error
  }
}

/**
 * Guardar historial de ediciones de vuelo
 */
async function guardarHistorialEdicion(vueloId, userId, razonEdicion, vueloAnterior) {
  try {
    const { error } = await supabase
      .from('vuelos_historial')
      .insert({
        vuelo_id: vueloId,
        usuario_id: userId,
        razon_edicion: razonEdicion,
        datos_anteriores: vueloAnterior,
        fecha_edicion: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error guardando historial de edición:', error)
      // No lanzar error para no interrumpir la edición
    }
    
  } catch (error) {
    console.error('Error en guardado de historial:', error)
  }
}

module.exports = {
  validarPermisosEdicionVuelo,
  guardarHistorialEdicion
}
```

- [ ] **Step 2: Update vuelos route PUT endpoint**

```javascript
// In src/routes/vuelos.js, find the PUT endpoint and replace

// Find router.put('/:id', ...) and replace the entire handler
router.put('/:id', async (req, res) => {
  try {
    const { vuelo, pasajeros, razon_edicion, user_id, user_role, sin_limite_ediciones } = req.body
    
    if (!user_id || !user_role) {
      return res.status(400).json({ error: 'Se requieren datos de usuario' })
    }
    
    if (!razon_edicion || razon_edicion.trim() === '') {
      return res.status(400).json({ error: 'La razón de edición es obligatoria' })
    }
    
    // Validar permisos usando el servicio
    const { permitido, sinLimite, vuelo: vueloActual } = await permisosService.validarPermisosEdicionVuelo(
      id, user_id, user_role
    )
    
    if (!permitido) {
      return res.status(403).json({ error: 'No tienes permisos para editar este vuelo' })
    }
    
    // Guardar historial antes de editar
    await permisosService.guardarHistorialEdicion(id, user_id, razon_edicion, vueloActual)
    
    // Editar vuelo con validación de límite de ediciones
    const resultado = await vuelosService.editarVuelo(
      id, 
      vuelo, 
      pasajeros, 
      sin_limite_ediciones || sinLimite
    )
    
    res.json(resultado)
    
  } catch (error) {
    console.error('Error editando vuelo:', error)
    res.status(500).json({ 
      error: error.message || 'Error al editar el vuelo' 
    })
  }
})
```

- [ ] **Step 3: Add permisosService import to vuelos route**

```javascript
// Add at the top of src/routes/vuelos.js
const permisosService = require('../services/permisosService')
```

- [ ] **Step 4: Update vuelosService.editarVuelo method**

```javascript
// In src/services/vuelosService.js, find or create editarVuelo method

/**
 * Editar vuelo con control de ediciones disponibles
 */
async editarVuelo(id, datosVuelo, pasajeros, sinLimiteEdiciones = false) {
  try {
    console.log(`[VuelosService] Editando vuelo ${id}`)
    
    // Si no tiene límite de ediciones, omitir validación
    if (!sinLimiteEdiciones) {
      // Obtener vuelo actual para verificar ediciones disponibles
      const { data: vueloActual } = await supabase
        .from('vuelos')
        .select('ediciones_disponibles')
        .eq('id', id)
        .single()
      
      if (!vueloActual) {
        throw new Error('Vuelo no encontrado')
      }
      
      const edicionesDisponibles = vueloActual.ediciones_disponibles ?? 3
      if (edicionesDisponibles <= 0) {
        throw new Error('Has agotado tus ediciones para este vuelo')
      }
      
      // Reducir ediciones disponibles
      await supabase
        .from('vuelos')
        .update({ 
          ediciones_disponibles: edicionesDisponibles - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    }
    
    // Actualizar datos del vuelo
    const { data: vueloActualizado, error } = await supabase
      .from('vuelos')
      .update({
        ...datosVuelo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('[VuelosService] Error editando vuelo:', error)
      throw error
    }
    
    // Actualizar pasajeros si se proporcionaron
    if (pasajeros && pasajeros.length > 0) {
      // Eliminar pasajeros existentes
      await supabase
        .from('vuelos_pasajeros')
        .delete()
        .eq('vuelo_id', id)
      
      // Insertar nuevos pasajeros
      const pasajerosConVuelo = pasajeros.map(p => ({
        ...p,
        vuelo_id: id
      }))
      
      await supabase
        .from('vuelos_pasajeros')
        .insert(pasajerosConVuelo)
    }
    
    console.log('[VuelosService] Vuelo editado exitosamente')
    return vueloActualizado
    
  } catch (error) {
    console.error('[VuelosService] Error en editarVuelo:', error)
    throw error
  }
}
```

- [ ] **Step 5: Test backend permission validation**

```bash
# Test the PUT endpoint with different roles
curl -X PUT http://localhost:3000/api/vuelos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "vuelo": {"estado": "PENDIENTE_EMISION"},
    "pasajeros": [],
    "razon_edicion": "Test edit",
    "user_id": "user123",
    "user_role": "gerente",
    "sin_limite_ediciones": false
  }'
```

- [ ] **Step 6: Commit backend permission changes**

```bash
git add src/services/permisosService.js src/routes/vuelos.js src/services/vuelosService.js
git commit -m "feat: implement role-based permission validation for flight editing"
```

---

## Task 5: Dashboard de Ventas Principal

**Files:**
- Create: `dashboard/src/app/(crm)/ventas/page.jsx`

- [ ] **Step 1: Create main dashboard structure**

```jsx
/**
 * Dashboard principal de ventas con KPIs y navegación a módulos
 * Diseño: Editorial Financiero - Bloomberg-inspired pero accesible
 */
'use client'

import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Plane, 
  FileText, 
  Package, 
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  CreditCard,
  MapPin,
  Calendar
} from 'lucide-react'
import KPICard from '../../../components/ventas/KPICard'
import ChartMini from '../../../components/ventas/ChartMini'
import NavigationCard from '../../../components/ventas/NavigationCard'
import NavigationBreadcrumb from '../../../components/ui/NavigationBreadcrumb'
import {
  calcularTotalVendidoMes,
  contarVuelosEmitidos,
  calcularTicketPromedio,
  contarPendientesEmision,
  contarVuelosConObservaciones,
  obtenerProveedoresTop,
  obtenerVentasPorAgencia,
  obtenerMetodosPagoPopulares,
  obtenerRutasMasVendidas,
  calcularComparativaMesAnterior,
  calcularTiempoPromedioEmision,
  normalizarMontoUSD
} from '../../../lib/ventas/kpiHelpers'

const VentasDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [vuelos, setVuelos] = useState([])
  const [vuelosMesAnterior, setVuelosMesAnterior] = useState([])
  const [tasas, setTasas] = useState({})
  const [kpis, setKpis] = useState({
    totalVendido: 0,
    vuelosEmitidos: 0,
    ticketPromedio: 0,
    pendientesEmision: 0,
    vuelosConObservaciones: 0,
    comparativa: { porcentaje: 0, tendencia: 'neutral' },
    tiempoPromedioEmision: 0
  })

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'CRM', href: '/' },
    { label: 'Ventas', href: '/ventas' }
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar tasas actuales
      const tasasResponse = await fetch('/api/tasas/activas')
      const tasasData = await tasasResponse.json()
      setTasas(tasasData)
      
      // Cargar vuelos del mes actual
      const vuelosResponse = await fetch('/api/vuelos?role=all')
      const vuelosData = await vuelosResponse.json()
      setVuelos(vuelosData)
      
      // Cargar vuelos del mes anterior para comparativa
      const fechaAnterior = new Date()
      fechaAnterior.setMonth(fechaAnterior.getMonth() - 1)
      const vuelosAnteriorResponse = await fetch(`/api/vuelos?role=all&mes=${fechaAnterior.getMonth()}&año=${fechaAnterior.getFullYear()}`)
      const vuelosAnteriorData = await vuelosAnteriorResponse.json()
      setVuelosMesAnterior(vuelosAnteriorData)
      
      // Calcular KPIs
      const nuevosKpis = {
        totalVendido: calcularTotalVendidoMes(vuelosData, new Date(), tasasData),
        vuelosEmitidos: contarVuelosEmitidos(vuelosData),
        ticketPromedio: calcularTicketPromedio(vuelosData, new Date(), tasasData),
        pendientesEmision: contarPendientesEmision(vuelosData),
        vuelosConObservaciones: contarVuelosConObservaciones(vuelosData),
        comparativa: calcularComparativaMesAnterior(vuelosData, vuelosAnteriorData, tasasData),
        tiempoPromedioEmision: calcularTiempoPromedioEmision(vuelosData)
      }
      
      setKpis(nuevosKpis)
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num)
  }

  // Datos para gráficos
  const proveedoresTop = obtenerProveedoresTop(vuelos, 3)
  const ventasPorAgencia = obtenerVentasPorAgencia(vuelos, tasas)
  const metodosPagoPopulares = obtenerMetodosPagoPopulares(vuelos, 3)
  const rutasMasVendidas = obtenerRutasMasVendidas(vuelos, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
              <p className="text-sm text-gray-500">Dashboard de rendimiento y operaciones</p>
            </div>
            <NavigationBreadcrumb items={breadcrumbItems} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fila 1 - KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Vendido del Mes"
            value={formatCurrency(kpis.totalVendido)}
            subtitle="Ventas brutas normalizadas"
            icon={DollarSign}
            color="indigo"
            size="large"
            trend={kpis.comparativa.tendencia}
            trendValue={`${kpis.comparativa.porcentaje.toFixed(1)}% vs mes anterior`}
            loading={loading}
          />
          
          <KPICard
            title="Vuelos Emitidos"
            value={formatNumber(kpis.vuelosEmitidos)}
            subtitle="Este mes"
            icon={Plane}
            color="green"
            size="large"
            loading={loading}
          />
          
          <KPICard
            title="Ticket Promedio"
            value={formatCurrency(kpis.ticketPromedio)}
            subtitle="Por vuelo emitido"
            icon={TrendingUp}
            color="indigo"
            size="large"
            loading={loading}
          />
          
          <KPICard
            title="Pendientes de Emisión"
            value={formatNumber(kpis.pendientesEmision)}
            subtitle="Requieren atención"
            icon={Clock}
            color={kpis.pendientesEmision > 10 ? "red" : "amber"}
            size="large"
            loading={loading}
          />
        </div>

        {/* Fila 2 - Métricas Operativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Vuelos con Observaciones"
            value={formatNumber(kpis.vuelosConObservaciones)}
            subtitle="Requieren seguimiento"
            icon={AlertTriangle}
            color="red"
            size="medium"
            loading={loading}
          />
          
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Proveedores Top 3</h3>
            <ChartMini
              data={proveedoresTop.map(p => ({ label: p.proveedor, value: p.count }))}
              type="bar"
              height={80}
              color="indigo"
              labels={true}
            />
          </div>
          
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Ventas por Agencia</h3>
            <ChartMini
              data={[
                { label: 'NOVA', value: ventasPorAgencia.nova },
                { label: 'NOVA CO', value: ventasPorAgencia['nova-colombia'] },
                { label: 'APOLO', value: ventasPorAgencia.apolo }
              ].filter(a => a.value > 0)}
              type="pie"
              height={80}
              color="green"
              labels={true}
            />
          </div>
          
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Métodos de Pago Populares</h3>
            <ChartMini
              data={metodosPagoPopulares.map(m => ({ 
                label: m.metodo.split(' ')[0], 
                value: m.count 
              }))}
              type="bar"
              height={80}
              color="amber"
              labels={false}
            />
          </div>
        </div>

        {/* Fila 3 - Insights Avanzados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rutas Más Vendidas</h3>
            <div className="space-y-2">
              {rutasMasVendidas.map((ruta, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate pr-2">{ruta.ruta}</span>
                  <span className="text-sm font-medium text-indigo-600">{ruta.count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <KPICard
            title="Comparativa Mes Anterior"
            value={`${kpis.comparativa.porcentaje.toFixed(1)}%`}
            subtitle={kpis.comparativa.tendencia === 'positiva' ? 'Crecimiento' : kpis.comparativa.tendencia === 'negativa' ? 'Declinación' : 'Estable'}
            icon={kpis.comparativa.tendencia === 'positiva' ? TrendingUp : kpis.comparativa.tendencia === 'negativa' ? TrendingUp : Calendar}
            color={kpis.comparativa.tendencia === 'positiva' ? 'green' : kpis.comparativa.tendencia === 'negativa' ? 'red' : 'gray'}
            size="medium"
            loading={loading}
          />
          
          <KPICard
            title="Tiempo Promedio de Emisión"
            value={`${kpis.tiempoPromedioEmision} días`}
            subtitle="Desde creación hasta emisión"
            icon={Clock}
            color="indigo"
            size="medium"
            loading={loading}
          />
        </div>

        {/* Sección de Navegación a Módulos */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos de Ventas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NavigationCard
              title="Cotizaciones"
              description="Gestionar cotizaciones y seguimiento de clientes"
              icon={FileText}
              href="/ventas/cotizaciones"
              color="indigo"
              metric={vuelos.filter(v => v.cotizacion_id).length}
              metricLabel="activas"
            />
            
            <NavigationCard
              title="Vuelos"
              description="Administración de vuelos y emisiones"
              icon={Plane}
              href="/ventas/vuelos"
              color="green"
              metric={kpis.vuelosEmitidos}
              metricLabel="emitidos"
            />
            
            <NavigationCard
              title="Paquetes"
              description="Creación y gestión de paquetes turísticos"
              icon={Package}
              href="/ventas/paquetes"
              color="amber"
              metric={0}
              metricLabel="disponibles"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default VentasDashboard
```

- [ ] **Step 2: Test dashboard rendering**

```bash
# Run dev server
npm run dev
# Navigate to /ventas and test dashboard
```

- [ ] **Step 3: Commit dashboard page**

```bash
git add dashboard/src/app/(crm)/ventas/page.jsx
git commit -m "feat: create sales dashboard with 11 KPIs and editorial financial design"
```

---

## Task 6: Actualizar Breadcrumbs

**Files:**
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/page.jsx`
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/nuevo/page.jsx`
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx`
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx`

- [ ] **Step 1: Update vuelos page breadcrumbs**

```jsx
// In dashboard/src/app/(crm)/ventas/vuelos/page.jsx
// Find the breadcrumbItems array and update:

// OLD:
const breadcrumbItems = [
  { label: 'CRM', href: '/' },
  { label: 'Ventas', href: '/ventas' }, // This was pointing to non-existent page
  { label: 'Vuelos', href: '/ventas/vuelos' }
]

// NEW (keep as is, now /ventas exists):
const breadcrumbItems = [
  { label: 'CRM', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' }
]
```

- [ ] **Step 2: Update nuevo vuelo page breadcrumbs**

```jsx
// In dashboard/src/app/(crm)/ventas/vuelos/nuevo/page.jsx
// Find breadcrumbItems and ensure it matches:

const breadcrumbItems = [
  { label: 'CRM', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' },
  { label: 'Nuevo Vuelo', href: '/ventas/vuelos/nuevo' }
]
```

- [ ] **Step 3: Update editar vuelo page breadcrumbs**

```jsx
// In dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx
// Find breadcrumbItems and ensure it matches:

const breadcrumbItems = [
  { label: 'CRM', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' },
  { label: data.nombre_cliente || 'Vuelo', href: `/ventas/vuelos/${id}` },
  { label: 'Editar', href: `/ventas/vuelos/${id}/editar` }
]
```

- [ ] **Step 4: Update vuelo detail page breadcrumbs**

```jsx
// In dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx
// Find breadcrumbItems and ensure it matches:

const breadcrumbItems = [
  { label: 'CRM', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' },
  { label: data.nombre_cliente || 'Vuelo', href: `/ventas/vuelos/${id}` }
]
```

- [ ] **Step 5: Test breadcrumb navigation**

```bash
# Test all pages to ensure breadcrumbs work correctly
# /ventas/vuelos
# /ventas/vuelos/nuevo
# /ventas/vuelos/[id]
# /ventas/vuelos/[id]/editar
```

- [ ] **Step 6: Commit breadcrumb updates**

```bash
git add dashboard/src/app/(crm)/ventas/vuelos/page.jsx dashboard/src/app/(crm)/ventas/vuelos/nuevo/page.jsx dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx
git commit -m "fix: update breadcrumbs to point to existing /ventas dashboard page"
```

---

## Task 7: Testing y Verificación Final

**Files:**
- Test all modified and new files

- [ ] **Step 1: Test permission validation by role**

```bash
# Create test users with different roles if needed
# Test scenarios:
# 1. Super admin editing emitted flight -> ALLOWED
# 2. Admin editing emitted flight -> DENIED
# 3. Admin editing pending flight -> ALLOWED
# 4. Manager editing team member's flight -> ALLOWED
# 5. Manager editing non-team flight -> DENIED
# 6. Advisor editing own flight (has edits left) -> ALLOWED
# 7. Advisor editing own flight (no edits left) -> DENIED
# 8. Advisor editing other's flight -> DENIED
```

- [ ] **Step 2: Test dashboard KPI calculations**

```bash
# Navigate to /ventas and verify:
# 1. Total Vendido uses total_cotizacion normalized to USD
# 2. All KPIs show correct values
# 3. Charts render properly
# 4. Navigation cards work
# 5. Breadcrumbs navigate correctly
```

- [ ] **Step 3: Test responsive design**

```bash
# Test dashboard on different screen sizes:
# - Mobile (< 640px)
# - Tablet (640px - 1024px)
# - Desktop (> 1024px)
```

- [ ] **Step 4: Test error handling**

```bash
# Test error scenarios:
# 1. Network errors when loading dashboard data
# 2. Permission denied errors
# 3. Invalid vuelo IDs
# 4. Missing required fields in edit form
```

- [ ] **Step 5: Performance testing**

```bash
# Test dashboard load time with large datasets
# Check for memory leaks in KPI calculations
# Verify API response times
```

- [ ] **Step 6: Final commit with documentation**

```bash
git add .
git commit -m "feat: complete sales dashboard and permission system implementation

- Add 11 KPIs with USD normalization using tasa_cambio
- Implement role-based permission validation for flight editing
- Create editorial financial design dashboard
- Add reusable dashboard components
- Fix breadcrumb navigation to existing /ventas page
- Support super_admin, admin, manager, advisor permission levels
- Include flight emission state validation
- Add edit history tracking with reason

Features:
- Total Vendido uses total_cotizacion (clean amount) normalized to USD
- Manager permissions based on equipos.gerente_id relationship
- Admin cannot edit emitted flights, only super_admin can
- Edit history with required reason field
- Responsive dashboard with charts and navigation cards
- Real-time KPI calculations with proper currency handling"
```

---

## Testing Requirements

### Manual Testing Checklist

**Permission Validation:**
- [ ] Super admin can edit emitted flights
- [ ] Admin cannot edit emitted flights
- [ ] Admin can edit non-emitted flights
- [ ] Manager can edit team member flights
- [ ] Manager cannot edit non-team flights
- [ ] Advisor can edit own flights (with edit limit)
- [ ] Advisor cannot edit when edit limit reached
- [ ] Edit history is saved with reason

**Dashboard Functionality:**
- [ ] All 11 KPIs display correctly
- [ ] Total Vendido uses USD normalization
- [ ] Charts render with proper data
- [ ] Navigation cards link correctly
- [ ] Breadcrumbs work properly
- [ ] Responsive design works on all devices

**Data Accuracy:**
- [ ] KPI calculations match expected values
- [ ] Currency formatting is correct
- [ ] Date filtering works properly
- [ ] Role-based data filtering works

### Automated Testing

Add these test files:
- `__tests__/ventas/kpiHelpers.test.js`
- `__tests__/permisos/permisosService.test.js`
- `__tests__/dashboard/VentasDashboard.test.js`

---

## Success Criteria

1. **Permission System**: All role-based editing permissions work correctly with proper validation
2. **Dashboard**: Complete sales dashboard with all 11 KPIs functioning
3. **Navigation**: Breadcrumbs and navigation cards work properly
4. **Design**: Editorial financial aesthetic implemented consistently
5. **Performance**: Dashboard loads quickly with large datasets
6. **Responsiveness**: Works on all device sizes
7. **Data Accuracy**: KPI calculations are correct and properly normalized

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-13-ventas-dashboard-y-permisos.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
