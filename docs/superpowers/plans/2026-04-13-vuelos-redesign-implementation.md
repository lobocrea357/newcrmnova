# Vuelos Module Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Vuelos module to eliminate statistics tab, add KPIs, improve filters, and create cohesive navigation system.

**Architecture:** Remove the standalone statistics view and integrate compact KPIs directly into the main vuelos list. Enhance filtering capabilities with state-based filtering and add breadcrumb navigation across all vuelos-related views. The approach focuses on actionable data presentation over passive statistics viewing.

**Tech Stack:** React, Next.js, Tailwind CSS, Lucide React Icons, existing Supabase backend

---

## File Structure

### Files to Create:
- `dashboard/src/components/vuelos/VuelosKPIBar.jsx` - Compact KPI display component
- `dashboard/src/components/vuelos/FilterSelect.jsx` - Reusable filter dropdown component

### Files to Modify:
- `dashboard/src/app/(crm)/ventas/vuelos/page.jsx` - Remove stats tab, add KPIs, add breadcrumbs
- `dashboard/src/components/vuelos/VuelosList.jsx` - Add new filters, improve search
- `dashboard/src/app/(crm)/ventas/vuelos/nuevo/page.jsx` - Add breadcrumbs, improve banner
- `dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx` - Add breadcrumbs
- `dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx` - Add breadcrumbs (create if doesn't exist)

### Files to Delete:
- `dashboard/src/components/vuelos/VuelosStats.jsx` - Remove entire statistics component (389 lines)

---

## Task 1: Create Compact KPI Component

**Files:**
- Create: `dashboard/src/components/vuelos/VuelosKPIBar.jsx`

- [ ] **Step 1: Write the KPI component structure**

```jsx
'use client'
import { Plane, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function VuelosKPIBar({ vuelos }) {
  const stats = vuelos?.reduce((acc, vuelo) => {
    acc.total += 1
    if (vuelo.estado === 'PENDIENTE_CONFIRMACION_PAGO') acc.pendientesPago += 1
    if (vuelo.estado === 'PENDIENTE_EMISION') acc.pendientesEmision += 1
    if (vuelo.estado === 'EMITIDO') acc.emitidos += 1
    return acc
  }, { total: 0, pendientesPago: 0, pendientesEmision: 0, emitidos: 0 })

  const kpis = [
    {
      label: 'Total Vuelos',
      value: stats.total,
      icon: Plane,
      color: 'blue',
      description: 'Registrados en el sistema'
    },
    {
      label: 'Pendientes Pago',
      value: stats.pendientesPago,
      icon: Clock,
      color: 'yellow',
      percentage: stats.total > 0 ? ((stats.pendientesPago / stats.total) * 100).toFixed(1) : '0'
    },
    {
      label: 'Pendientes Emisión',
      value: stats.pendientesEmision,
      icon: AlertCircle,
      color: 'orange',
      percentage: stats.total > 0 ? ((stats.pendientesEmision / stats.total) * 100).toFixed(1) : '0'
    },
    {
      label: 'Emitidos',
      value: stats.emitidos,
      icon: CheckCircle,
      color: 'green',
      percentage: stats.total > 0 ? ((stats.emitidos / stats.total) * 100).toFixed(1) : '0'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        const colorClasses = {
          blue: 'from-blue-500 to-blue-600',
          yellow: 'from-yellow-500 to-yellow-600',
          orange: 'from-orange-500 to-orange-600',
          green: 'from-green-500 to-green-600'
        }

        return (
          <div key={index} className={`bg-gradient-to-br ${colorClasses[kpi.color]} rounded-lg shadow-md p-6 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-${kpi.color}-100 text-sm font-medium`}>
                {kpi.label}
              </div>
              <Icon className={`w-5 h-5 text-${kpi.color}-100`} />
            </div>
            <div className="text-3xl font-bold">{kpi.value}</div>
            <div className={`text-${kpi.color}-100 text-xs mt-1`}>
              {kpi.percentage ? `${kpi.percentage}% del total` : kpi.description}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Test KPI component with sample data**

```jsx
// Test in browser console or create temporary test file
const sampleVuelos = [
  { estado: 'PENDIENTE_CONFIRMACION_PAGO' },
  { estado: 'EMITIDO' },
  { estado: 'PENDIENTE_EMISION' },
  { estado: 'EMITIDO' }
]
// Should show: Total=4, Pendientes Pago=1, Pendientes Emisión=1, Emitidos=2
```

- [ ] **Step 3: Commit KPI component**

```bash
git add dashboard/src/components/vuelos/VuelosKPIBar.jsx
git commit -m "feat: add compact KPI bar component for vuelos module"
```

---

## Task 2: Create Reusable Filter Component

**Files:**
- Create: `dashboard/src/components/vuelos/FilterSelect.jsx`

- [ ] **Step 1: Write the filter select component**

```jsx
'use client'
import { ChevronDown } from 'lucide-react'

export default function FilterSelect({ 
  label, 
  value, 
  onChange, 
  options, 
  className = '',
  placeholder = 'Seleccionar...'
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white ${className}`}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test filter component**

```jsx
// Test with different options
const testOptions = [
  { value: 'test1', label: 'Option 1' },
  { value: 'test2', label: 'Option 2' }
]
// Verify dropdown renders correctly and onChange fires
```

- [ ] **Step 3: Commit filter component**

```bash
git add dashboard/src/components/vuelos/FilterSelect.jsx
git commit -m "feat: add reusable FilterSelect component for vuelos filters"
```

---

## Task 3: Remove Statistics Tab and Add KPIs to Main Vuelos Page

**Files:**
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/page.jsx`

- [ ] **Step 1: Remove statistics tab and imports**

```jsx
// REMOVE these lines:
import VuelosStats from '@/components/vuelos/VuelosStats'
import { BarChart3, List } from 'lucide-react'

// REMOVE the entire tab section:
<div className="mb-6">
  <div className="flex space-x-1 rounded-xl bg-white border border-gray-200 p-1 w-fit">
    <button
      onClick={() => setActiveTab('vuelos')}
      className={`...`}
    >
      <List className="w-4 h-4" />
      Vuelos
    </button>
    <button
      onClick={() => setActiveTab('estadisticas')}
      className={`...`}
    >
      <BarChart3 className="w-4 h-4" />
      Estadísticas
    </button>
  </div>
</div>

// REMOVE the conditional rendering:
{activeTab === 'vuelos' ? (
  <VuelosList ... />
) : (
  <VuelosStats ... />
)}
```

- [ ] **Step 2: Add KPI component import and breadcrumbs**

```jsx
// ADD these imports:
import VuelosKPIBar from '@/components/vuelos/VuelosKPIBar'
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'

// ADD breadcrumb items:
const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' }
]

// ADD breadcrumbs in JSX:
<NavigationBreadcrumb items={breadcrumbItems} />
```

- [ ] **Step 3: Add KPIs above the vuelos list**

```jsx
// ADD this right after the header section and before VuelosList:
{/* KPIs Compactos */}
<VuelosKPIBar vuelos={vuelos} />

{/* Lista de Vuelos */}
<VuelosList
  vuelos={vuelos}
  role={role}
  currentUserId={user?.id}
  onFilterChange={handleFilterChange}
  isLoading={isLoading || profileLoading}
/>
```

- [ ] **Step 4: Remove activeTab state and related code**

```jsx
// REMOVE these state variables:
const [activeTab, setActiveTab] = useState('vuelos')

// The component should now be much simpler without tab logic
```

- [ ] **Step 5: Test the updated page**

```bash
# Navigate to /ventas/vuelos
# Verify:
# 1. No statistics tab
# 2. KPI cards show correct numbers
# 3. Breadcrumbs appear
# 4. Vuelos list still works
```

- [ ] **Step 6: Commit vuelos page changes**

```bash
git add dashboard/src/app/(crm)/ventas/vuelos/page.jsx
git commit -m "refactor: remove statistics tab and add KPIs to vuelos page"
```

---

## Task 4: Delete Statistics Component

**Files:**
- Delete: `dashboard/src/components/vuelos/VuelosStats.jsx`

- [ ] **Step 1: Remove the statistics component file**

```bash
rm dashboard/src/components/vuelos/VuelosStats.jsx
```

- [ ] **Step 2: Verify no broken imports**

```bash
# Search for any remaining imports of VuelosStats
grep -r "VuelosStats" dashboard/src/
# Should return no results
```

- [ ] **Step 3: Test application still works**

```bash
# Navigate to various pages to ensure no broken references
# Particularly check /ventas/vuelos
```

- [ ] **Step 4: Commit deletion**

```bash
git add -A
git commit -m "chore: remove VuelosStats component (389 lines eliminated)"
```

---

## Task 5: Add Enhanced Filters to VuelosList

**Files:**
- Modify: `dashboard/src/components/vuelos/VuelosList.jsx`

- [ ] **Step 1: Add new imports and filter options**

```jsx
// ADD these imports:
import FilterSelect from './FilterSelect'

// ADD these constants at the top:
const ESTADOS_VUELO = [
  { value: '', label: 'Todos los Estados' },
  { value: 'PENDIENTE_CONFIRMACION_PAGO', label: 'Pendientes Pago' },
  { value: 'PENDIENTE_EMISION', label: 'Pendientes Emisión' },
  { value: 'EMITIDO', label: 'Emitidos' },
  { value: 'CANCELADO', label: 'Cancelados' }
]

const METODOS_PAGO = [
  { value: '', label: 'Todos los Métodos' },
  { value: 'Zelle', label: 'Zelle' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito' }
]

const PROVEEDORES = [
  { value: '', label: 'Todos los Proveedores' },
  { value: 'Sabre', label: 'Sabre' },
  { value: 'Kiu', label: 'Kiu' },
  { value: 'Servivuelo', label: 'Servivuelo' },
  { value: 'Expedia', label: 'Expedia' }
]
```

- [ ] **Step 2: Update filters state to include new filters**

```jsx
// MODIFY the initial filters state:
const [filters, setFilters] = useState({
  search: '',
  tipo_vuelo: '',
  fecha_desde: '',
  fecha_hasta: '',
  requiere_anulable: '',
  asesor_id: '',
  // NEW filters:
  estado: '',
  metodo_pago: '',
  proveedor: ''
})
```

- [ ] **Step 3: Update clearFilters function**

```jsx
// MODIFY clearFilters to include new filters:
const clearFilters = () => {
  const emptyFilters = {
    search: '',
    tipo_vuelo: '',
    fecha_desde: '',
    fecha_hasta: '',
    requiere_anulable: '',
    asesor_id: '',
    // NEW:
    estado: '',
    metodo_pago: '',
    proveedor: ''
  }
  setFilters(emptyFilters)
  onFilterChange(emptyFilters)
}
```

- [ ] **Step 4: Replace existing filter inputs with FilterSelect components**

```jsx
// REPLACE the existing filter inputs in the showFilters section:
{showFilters && (
  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* NEW: Estado filter (FIRST and most important) */}
    <FilterSelect
      label="Estado"
      value={filters.estado}
      onChange={(value) => handleFilterChange('estado', value)}
      options={ESTADOS_VUELO}
      placeholder="Todos los Estados"
    />

    {/* Asesor filter (existing, but using new component) */}
    {(role === 'super_admin' || role === 'gerente' || role === 'admin') && asesoresUnicos.length > 1 && (
      <FilterSelect
        label="Filtrar por Asesor"
        value={filters.asesor_id}
        onChange={(value) => handleFilterChange('asesor_id', value)}
        options={[
          { value: '', label: 'Todos los asesores' },
          ...asesoresUnicos.map(asesor => ({
            value: asesor.id,
            label: asesor.nombre
          }))
        ]}
        placeholder="Todos los asesores"
      />
    )}

    {/* Tipo de Vuelo (existing, using new component) */}
    <FilterSelect
      label="Tipo de Vuelo"
      value={filters.tipo_vuelo}
      onChange={(value) => handleFilterChange('tipo_vuelo', value)}
      options={TIPOS_VUELO}
      placeholder="Todos los tipos"
    />

    {/* Fecha Desde (keep existing) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Fecha Desde
      </label>
      <input
        type="date"
        value={filters.fecha_desde}
        onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    {/* Fecha Hasta (keep existing) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Fecha Hasta
      </label>
      <input
        type="date"
        value={filters.fecha_hasta}
        onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    {/* NEW: Método de Pago filter */}
    <FilterSelect
      label="Método de Pago"
      value={filters.metodo_pago}
      onChange={(value) => handleFilterChange('metodo_pago', value)}
      options={METODOS_PAGO}
      placeholder="Todos los métodos"
    />

    {/* Anulables (existing, using new component) */}
    <FilterSelect
      label="Anulables"
      value={filters.requiere_anulable}
      onChange={(value) => handleFilterChange('requiere_anulable', value)}
      options={[
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Solo anulables' },
        { value: 'false', label: 'Sin anulables' }
      ]}
      placeholder="Todos"
    />

    {/* NEW: Proveedor filter */}
    <FilterSelect
      label="Proveedor"
      value={filters.proveedor}
      onChange={(value) => handleFilterChange('proveedor', value)}
      options={PROVEEDORES}
      placeholder="Todos los proveedores"
    />
  </div>
)}
```

- [ ] **Step 5: Update vuelos filtering logic to include new filters**

```jsx
// MODIFY the vuelosFiltrados useMemo:
const vuelosFiltrados = useMemo(() => {
  let filtered = vuelos

  // Apply existing filters
  if (filters.asesor_id) {
    filtered = filtered.filter(v => v.created_by === filters.asesor_id)
  }
  if (filters.tipo_vuelo) {
    filtered = filtered.filter(v => v.tipo_vuelo === filters.tipo_vuelo)
  }
  if (filters.fecha_desde) {
    filtered = filtered.filter(v => v.fecha_vuelo >= filters.fecha_desde)
  }
  if (filters.fecha_hasta) {
    filtered = filtered.filter(v => v.fecha_vuelo <= filters.fecha_hasta)
  }
  if (filters.requiere_anulable !== '') {
    filtered = filtered.filter(v => v.requiere_anulable === (filters.requiere_anulable === 'true'))
  }

  // NEW filters
  if (filters.estado) {
    filtered = filtered.filter(v => v.estado === filters.estado)
  }
  if (filters.metodo_pago) {
    filtered = filtered.filter(v => v.metodo_pago === filters.metodo_pago)
  }
  if (filters.proveedor) {
    filtered = filtered.filter(v => v.proveedor === filters.proveedor)
  }

  // Apply search filter last
  if (filters.search) {
    const query = filters.search.toLowerCase()
    filtered = filtered.filter(v => 
      v.pax_nombre?.toLowerCase().includes(query) ||
      v.localizador?.toLowerCase().includes(query) ||
      v.ruta?.toLowerCase().includes(query) ||
      v.contacto_telefono?.toLowerCase().includes(query)
    )
  }

  return filtered
}, [vuelos, filters])
```

- [ ] **Step 6: Test enhanced filters**

```bash
# Test each new filter:
# 1. Estado filter - should show only selected state
# 2. Método de Pago filter - should filter by payment method
# 3. Proveedor filter - should filter by provider
# 4. Clear filters - should reset all filters
# 5. Combined filters - should work together
```

- [ ] **Step 7: Commit enhanced filters**

```bash
git add dashboard/src/components/vuelos/VuelosList.jsx
git commit -m "feat: add enhanced filters to vuelos list (estado, metodo pago, proveedor)"
```

---

## Task 6: Add Breadcrumbs to Nuevo Vuelo Page

**Files:**
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/nuevo/page.jsx`

- [ ] **Step 1: Add breadcrumb import and items**

```jsx
// ADD this import:
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'

// ADD these breadcrumb items:
const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' },
  { label: 'Nuevo', href: '/ventas/vuelos/nuevo' }
]
```

- [ ] **Step 2: Add breadcrumbs to JSX**

```jsx
// ADD breadcrumbs right after the opening div:
<div className="min-h-screen bg-gray-50 py-8">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Breadcrumbs */}
    <NavigationBreadcrumb items={breadcrumbItems} />
    
    <div className="mb-8">
      {/* Keep existing header */}
    </div>
```

- [ ] **Step 3: Improve cotización banner with navigation**

```jsx
// REPLACE the existing cotización banner:
{cotizacion && (
  <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-indigo-900 font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4" />
          Creando desde cotización aprobada
        </p>
        <p className="text-indigo-700 text-sm mt-1">
          Cliente: {cotizacion.nombre_cliente} · Ruta: {cotizacion.origen} {cotizacion.destino}
        </p>
        <p className="text-indigo-700 text-xs mt-2 font-medium">
          Completa los campos faltantes: localizador, teléfono, pasajeros, proveedor y adjuntos
        </p>
      </div>
      <Link href={`/ventas/cotizaciones?id=${cotizacion.id}`}>
        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
          Ver cotización
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  </div>
)}
```

- [ ] **Step 4: Test navigation**

```bash
# Navigate to /ventas/vuelos/nuevo
# Verify:
# 1. Breadcrumbs show correct path
# 2. Clicking breadcrumbs navigates correctly
# 3. Cotización banner has link back to cotización
```

- [ ] **Step 5: Commit navigation improvements**

```bash
git add dashboard/src/app/(crm)/ventas/vuelos/nuevo/page.jsx
git commit -m "feat: add breadcrumbs and improved navigation to nuevo vuelo page"
```

---

## Task 7: Add Breadcrumbs to Editar Vuelo Page

**Files:**
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx`

- [ ] **Step 1: Add breadcrumb import**

```jsx
// ADD this import:
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'
```

- [ ] **Step 2: Add dynamic breadcrumb items**

```jsx
// ADD these breadcrumb items (after vuelo is loaded):
const breadcrumbItems = vuelo ? [
  { label: 'Inicio', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' },
  { label: vuelo.pax_nombre, href: `/ventas/vuelos/${id}` },
  { label: 'Editar', href: `/ventas/vuelos/${id}/editar` }
] : []

// ADD breadcrumbs in JSX (replace the existing header section):
<div className="min-h-screen bg-gray-50 p-4 md:p-6">
  <div className="max-w-4xl mx-auto">
    {/* Breadcrumbs */}
    {vuelo && <NavigationBreadcrumb items={breadcrumbItems} />}
    
    {/* Header */}
    <div className="mb-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <h1 className="text-2xl font-bold text-gray-900">
        Editar Vuelo
      </h1>
      <p className="text-gray-600 mt-1">
        {vuelo?.pax_nombre} - {vuelo?.ruta}
      </p>
    </div>
```

- [ ] **Step 3: Test edit navigation**

```bash
# Navigate to /ventas/vuelos/[id]/editar
# Verify:
# 1. Breadcrumbs show correct path with vuelo name
# 2. Clicking vuelo name goes to detail page
# 3. All breadcrumbs navigate correctly
```

- [ ] **Step 4: Commit edit navigation**

```bash
git add dashboard/src/app/(crm)/ventas/vuelos/[id]/editar/page.jsx
git commit -m "feat: add breadcrumbs to editar vuelo page with dynamic vuelo name"
```

---

## Task 8: Add Breadcrumbs to Vuelo Detail Page

**Files:**
- Modify: `dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx` (create if doesn't exist)

- [ ] **Step 1: Check if detail page exists**

```bash
# Check if the detail page file exists
ls -la dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx
```

- [ ] **Step 2: Create detail page if it doesn't exist**

```jsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { VUELOS_API } from '@/config/apiConfig'
import { toastSuccess, toastError } from '@/helpers/toasts'
import VueloDetail from '@/components/vuelos/VueloDetail'
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'

export default function VueloDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [vuelo, setVuelo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      cargarVuelo()
    }
  }, [id])

  const cargarVuelo = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(VUELOS_API.obtener(id))
      if (!response.ok) {
        throw new Error('Error al cargar el vuelo')
      }

      const { data } = await response.json()

      if (!data) {
        throw new Error('Vuelo no encontrado')
      }

      setVuelo(data)
    } catch (err) {
      console.error('Error cargando vuelo:', err)
      setError(err.message || 'Error al cargar el vuelo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-600">Cargando vuelo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Ventas', href: '/ventas' },
    { label: 'Vuelos', href: '/ventas/vuelos' },
    { label: vuelo.pax_nombre, href: `/ventas/vuelos/${id}` }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <NavigationBreadcrumb items={breadcrumbItems} />

        {/* Success banner if coming from creation */}
        {router.query?.created === 'true' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-900 font-medium flex items-center gap-2">
                  Vuelo creado exitosamente
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Localizador: {vuelo.localizador} · Estado: {vuelo.estado}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => router.push('/ventas/vuelos/nuevo')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Crear otro vuelo
                </button>
                <button 
                  onClick={() => router.push('/ventas/vuelos')}
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                >
                  Ver todos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vuelo Detail Component */}
        <VueloDetail vuelo={vuelo} onUpdate={cargarVuelo} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: If detail page exists, add breadcrumbs to it**

```jsx
// ADD breadcrumb import:
import NavigationBreadcrumb from '@/components/ui/NavigationBreadcrumb'

// ADD breadcrumb items and display:
const breadcrumbItems = vuelo ? [
  { label: 'Inicio', href: '/' },
  { label: 'Ventas', href: '/ventas' },
  { label: 'Vuelos', href: '/ventas/vuelos' },
  { label: vuelo.pax_nombre, href: `/ventas/vuelos/${id}` }
] : []

// ADD breadcrumbs in JSX:
<NavigationBreadcrumb items={breadcrumbItems} />
```

- [ ] **Step 4: Test detail page navigation**

```bash
# Navigate to /ventas/vuelos/[id]
# Verify:
# 1. Breadcrumbs show correct path
# 2. All links work correctly
# 3. Success banner appears when created=true
```

- [ ] **Step 5: Commit detail page**

```bash
git add dashboard/src/app/(crm)/ventas/vuelos/[id]/page.jsx
git commit -m "feat: add breadcrumbs to vuelo detail page with success banner"
```

---

## Task 9: Final Testing and Cleanup

**Files:**
- Multiple files for testing

- [ ] **Step 1: Test complete user flow**

```bash
# Test the complete flow:
# 1. /ventas/vuelos - should show KPIs, no stats tab, breadcrumbs
# 2. Click filters - should show new filters (estado, metodo pago, proveedor)
# 3. Click "Nuevo Vuelo" - should show breadcrumbs
# 4. From nuevo, click breadcrumbs to go back
# 5. Click on a vuelo card - should go to detail with breadcrumbs
# 6. Click "Editar" - should show breadcrumbs with vuelo name
# 7. Navigate back using breadcrumbs
```

- [ ] **Step 2: Test responsive design**

```bash
# Test on different screen sizes:
# 1. Mobile (< 768px) - KPIs should stack 2x2
# 2. Tablet (768px-1024px) - KPIs should be 2x2
# 3. Desktop (>1024px) - KPIs should be 1x4
# 4. Filters should be responsive
# 5. Breadcrumbs should truncate on mobile
```

- [ ] **Step 3: Test performance**

```bash
# Check for any performance issues:
# 1. Large number of vuelos - should still be fast
# 2. Filter application - should be instant
# 3. KPI calculations - should not impact performance
```

- [ ] **Step 4: Verify no broken references**

```bash
# Search for any remaining references to VuelosStats
grep -r "VuelosStats" dashboard/src/

# Search for any tab-related code that might be broken
grep -r "activeTab\|estadisticas" dashboard/src/components/vuelos/
```

- [ ] **Step 5: Final commit with cleanup**

```bash
git add -A
git commit -m "chore: complete vuelos module redesign - remove stats, add KPIs, enhance filters, add navigation"
```

---

## Testing Strategy

### Manual Testing Checklist:
- [ ] KPIs show correct numbers on /ventas/vuelos
- [ ] Statistics tab is completely removed
- [ ] All new filters work (estado, metodo pago, proveedor)
- [ ] Clear filters resets all filters
- [ ] Breadcrumbs work on all vuelos pages
- [ ] Navigation between pages works correctly
- [ ] Responsive design works on all screen sizes
- [ ] No broken links or console errors

### Automated Testing Considerations:
- Unit tests for KPI calculations
- Integration tests for filter combinations
- Visual regression tests for layout changes

---

## Rollback Plan

If issues arise, rollback steps:

1. **Restore VuelosStats component** from git history
2. **Revert vuelos page changes** to restore tab functionality
3. **Remove new filter options** from VuelosList
4. **Remove breadcrumb components** from all pages

```bash
# Rollback commands (if needed):
git revert HEAD~8..HEAD  # Revert all changes
# Or selective revert of specific commits
```

---

## Success Metrics

- **Code Reduction:** ~389 lines eliminated (VuelosStats)
- **New Features:** 3 new filters, KPIs, breadcrumbs
- **User Experience:** No tab switching needed, data always visible
- **Navigation:** Clear context on all pages
- **Performance:** Faster page loads (no statistics calculations)

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-13-vuelos-redesign-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
