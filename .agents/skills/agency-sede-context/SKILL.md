---
name: agency-sede-context
description: How to use agency and sede context helpers in React components for the ERP Nova CRM. Use this skill whenever the user mentions creating pages, components, or features that need to validate user agency or sede access, filter data by agency/sede, or implement agency-specific functionality. This includes when users talk about "validar agencia", "filtrar por agencia", "acceso por sede", "tematizar por agencia", or any business logic related to agencies and sedes.
---

# Agency and Sede Context Usage Guide

This skill teaches you how to use the agency and sede context helpers available in the ERP Nova CRM system. These helpers provide easy access to the user's agencies and sede information, similar to how roles and permissions work.

## Available Context Data

### Agency Data
```javascript
const {
  agencias,           // Array of user's agencies
  primaryAgencia,     // User's primary agency (object)
} = useUserProfile()
```

### Sede Data
```javascript
const {
  sede,               // User's sede (object or null)
} = useUserProfile()
```

## Agency Helpers

### `hasAgencia(codigo)` - Check Agency Membership
Verifies if the user belongs to a specific agency by its code.

```javascript
const { hasAgencia } = useUserProfile()

// Check if user belongs to Nova Flash
if (hasAgencia('nova_flash')) {
  // Show Nova Flash specific content
}
```

### `isAgenciaPrimary(codigo)` - Check Primary Agency
Verifies if a specific agency is the user's primary agency.

```javascript
const { isAgenciaPrimary } = useUserProfile()

// Only primary agency users can approve
if (isAgenciaPrimary('nova_flash')) {
  return <ApprovalButton />
}
```

### `getAgenciaByCode(codigo)` - Get Agency Object
Returns the complete agency object by code.

```javascript
const { getAgenciaByCode } = useUserProfile()

const novaAgency = getAgenciaByCode('nova_flash')
const agencyColor = novaAgency?.color_primario || '#6366f1'
```

### `hasAnyAgencia()` - Check Any Agency
Verifies if the user has any agencies assigned.

```javascript
const { hasAnyAgencia } = useUserProfile()

if (!hasAnyAgencia()) {
  return <Alert>No tienes agencias asignadas</Alert>
}
```

### `getAllAgencias()` - Get All Agencies
Returns all agencies the user belongs to.

```javascript
const { getAllAgencias } = useUserProfile()

const agencies = getAllAgencies()
const agencyOptions = agencies.map(a => ({
  value: a.id,
  label: a.nombre
}))
```

### `getAgenciaIds()` - Get Agency IDs
Returns array of agency IDs for filtering.

```javascript
const { getAgenciaIds } = useUserProfile()

const agencyIds = getAgenciaIds()
const { data } = await supabase
  .from('cotizaciones')
  .select('*')
  .in('agencia_id', agencyIds)
```

## Sede Helpers

### `hasSede()` - Check Sede Assignment
Verifies if the user has a sede assigned.

```javascript
const { hasSede } = useUserProfile()

if (!hasSede()) {
  return <Alert>Sin sede asignada</Alert>
}
```

### `isSedeCode(codigo)` - Check Sede by Code
Verifies if the user's sede matches a specific code.

```javascript
const { isSedeCode } = useUserProfile()

if (isSedeCode('parral')) {
  // Show Parral-specific features
}
```

### `getSede()` - Get Sede Object
Returns the complete sede object.

```javascript
const { getSede } = useUserProfile()

const sede = getSede()
console.log(`Trabajas en: ${sede?.nombre}`)
```

### `getSedeId()` - Get Sede ID
Returns the sede ID for filtering.

```javascript
const { getSedeId } = useUserProfile()

const sedeId = getSedeId()
const report = await generateSedeReport(sedeId)
```

## Common Use Cases

### 1. Agency-Based Access Control
```javascript
function NovaFlashPage() {
  const { hasAgencia } = useUserProfile()
  
  if (!hasAgencia('nova_flash')) {
    return <div>No autorizado</div>
  }
  
  return <NovaFlashContent />
}
```

### 2. Agency Theming
```javascript
function AgencyThemedComponent() {
  const { primaryAgencia } = useUserProfile()
  
  const theme = {
    borderColor: primaryAgencia?.color_primario || '#6366f1',
    logo: primaryAgencia?.logo_url || '/default-logo.png',
    name: primaryAgencia?.nombre || 'ERP Nova'
  }
  
  return (
    <div style={{ borderColor: theme.borderColor }}>
      <img src={theme.logo} alt={theme.name} />
      <h1>{theme.name}</h1>
    </div>
  )
}
```

### 3. Data Filtering by Agency
```javascript
function UserCotizaciones() {
  const { getAgenciaIds } = useUserProfile()
  const [cotizaciones, setCotizaciones] = useState([])
  
  useEffect(() => {
    const fetchCotizaciones = async () => {
      const agencyIds = getAgenciaIds()
      const { data } = await supabase
        .from('cotizaciones')
        .select('*')
        .in('agencia_id', agencyIds)
      
      setCotizaciones(data || [])
    }
    
    fetchCotizaciones()
  }, [getAgenciaIds])
  
  return (
    <div>
      <h2>Mis Cotizaciones</h2>
      {cotizaciones.map(cot => (
        <CotizacionCard key={cot.id} cotizacion={cot} />
      ))}
    </div>
  )
}
```

### 4. Sede-Based Reporting
```javascript
function SedeReport() {
  const { sede, hasSede } = useUserProfile()
  
  if (!hasSede()) {
    return <div>Sin sede asignada</div>
  }
  
  return (
    <div>
      <h2>Reporte de {sede.nombre}</h2>
      <p>Ubicación: {sede.ciudad}, {sede.pais}</p>
      {/* Report content */}
    </div>
  )
}
```

### 5. Agency Selection (Multiple Agencies)
```javascript
function AgencySelector() {
  const { agencias, primaryAgencia } = useUserProfile()
  const [selectedAgency, setSelectedAgency] = useState(primaryAgencia?.id)
  
  if (agencias.length <= 1) return null
  
  return (
    <select
      value={selectedAgency}
      onChange={(e) => setSelectedAgency(e.target.value)}
    >
      {agencias.map(agency => (
        <option key={agency.id} value={agency.id}>
          {agency.nombre}
          {agency.id === primaryAgencia?.id && ' (Principal)'}
        </option>
      ))}
    </select>
  )
}
```

### 6. Business Logic Validation
```javascript
function CotizacionActions({ cotizacion }) {
  const { isAgenciaPrimary } = useUserProfile()
  
  // Only primary agency users can approve
  const canApprove = isAgenciaPrimary(cotizacion.agencia_codigo)
  
  return (
    <div className="flex gap-2">
      <button>Ver</button>
      <button>Editar</button>
      
      {canApprove && (
        <button className="btn-success">Aprobar</button>
      )}
    </div>
  )
}
```

## Best Practices

### Always Check Loading State
```javascript
function MyComponent() {
  const { loading, hasAgencia } = useUserProfile()
  
  if (loading) return <div>Cargando...</div>
  
  if (!hasAgencia('nova_flash')) {
    return <div>No autorizado</div>
  }
  
  return <ComponentContent />
}
```

### Handle Users Without Agencies
```javascript
const { hasAnyAgencia, primaryAgencia } = useUserProfile()

if (!hasAnyAgencia()) {
  return <Alert>Debes tener agencias asignadas</Alert>
}

// Use primaryAgencia safely
const agencyColor = primaryAgencia?.color_primario || '#6366f1'
```

### Combine with Role/Permission Validation
```javascript
function ProtectedComponent() {
  const { hasAgencia, isSuperAdmin } = useUserProfile()
  
  // Super admins can access any agency
  if (isSuperAdmin || hasAgencia('nova_flash')) {
    return <Component />
  }
  
  return <div>No autorizado</div>
}
```

## Agency and Sede Object Structure

### Agency Object
```javascript
{
  id: "uuid",
  nombre: "Nova Flash",
  codigo: "nova_flash",
  descripcion: "Agencia principal",
  color_primario: "#6366f1",
  logo_url: "https://...",
  is_active: true
}
```

### Sede Object
```javascript
{
  id: "uuid",
  nombre: "Oficina del Parral",
  codigo: "parral",
  ciudad: "Valencia",
  pais: "Venezuela",
  direccion: "Av. Principal...",
  telefono: "+58 xxx xxx xxxx",
  is_active: true
}
```

## Integration with Existing Systems

### With Agency Themes
```javascript
import { getAgencyTheme } from '@/lib/cotizador/agencyThemes'

function ThemedComponent() {
  const { primaryAgencia } = useUserProfile()
  const theme = getAgencyTheme(primaryAgencia?.codigo || 'nova')
  
  return (
    <div style={{ backgroundColor: theme.colors.light }}>
      <h2 style={{ color: theme.colors.primary }}>
        {primaryAgencia?.nombre}
      </h2>
    </div>
  )
}
```

### With Route Guards
```javascript
function useAgencyRequired(requiredAgency) {
  const { hasAgencia, loading } = useUserProfile()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !hasAgencia(requiredAgency)) {
      router.push('/no-autorizado')
    }
  }, [loading, hasAgencia, requiredAgency, router])
  
  return { loading, hasAccess: hasAgencia(requiredAgency) }
}
```

## Security Considerations

**IMPORTANT:** Agency validation in frontend is for UX only. Always validate in backend:

```javascript
// Backend validation example
router.post('/cotizaciones', async (req, res) => {
  const userId = req.user.id
  const { agencia_id } = req.body
  
  // Validate user belongs to agency
  const { data: userAgencias } = await getAgenciasByUserId(userId)
  const hasAccess = userAgencias.some(ua => ua.agencia_id === agencia_id)
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'No autorizado' })
  }
  
  // Continue with creation
})
```

## Debugging

The UserProfileContext logs agency information to console:

```javascript
// Console output example
{
  agenciasCount: 2,
  agencias: ["Nova Flash", "Apolo Viajes"],
  primaryAgencia: "Nova Flash",
  sede: "Oficina del Parral"
}
```

Use browser dev tools to inspect context data:
```javascript
// In browser console
window.__userProfile = useUserProfile()
console.log(window.__userProfile.agencias)
```

## Common Patterns

### Agency-Based Component Visibility
```javascript
function AgencySpecificFeature({ agencyCode, children }) {
  const { hasAgencia } = useUserProfile()
  
  if (!hasAgencia(agencyCode)) {
    return null
  }
  
  return <>{children}</>
}

// Usage
<AgencySpecificFeature agencyCode="nova_flash">
  <NovaFlashBanner />
</AgencySpecificFeature>
```

### Sede-Based Data Filtering
```javascript
function useSedeFilteredData(tableName) {
  const { getSedeId, hasSede } = useUserProfile()
  
  return useMemo(() => {
    if (!hasSede()) return null
    
    const sedeId = getSedeId()
    return supabase
      .from(tableName)
      .select('*')
      .eq('sede_id', sedeId)
  }, [getSedeId, hasSede, tableName])
}
```

## Migration from Manual API Calls

### Before (Manual API Calls)
```javascript
function OldComponent() {
  const [agencias, setAgencias] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchAgencias = async () => {
      const response = await fetch(`/api/agencias/user/${userId}`)
      const data = await response.json()
      setAgencias(data.data || [])
      setLoading(false)
    }
    fetchAgencias()
  }, [userId])
  
  if (loading) return <div>Cargando...</div>
  
  const primaryAgencia = agencias.find(a => a.is_primary)
  return <div>{primaryAgencia?.nombre}</div>
}
```

### After (Using Context)
```javascript
function NewComponent() {
  const { primaryAgencia, loading } = useUserProfile()
  
  if (loading) return <div>Cargando...</div>
  
  return <div>{primaryAgencia?.nombre}</div>
}
```

**Benefits:**
- Less code
- Faster (already loaded)
- Consistent across app
- Automatic updates
- Built-in error handling

## When to Use This Skill

Use this skill when you need to:
- Validate agency access for pages or features
- Filter data based on user's agencies or sede
- Implement agency-specific theming or branding
- Show agency/sede information in UI
- Create business rules based on agency membership
- Generate reports by sede or agency
- Protect routes or components by agency

**Trigger phrases:** "validar agencia", "filtrar por agencia", "acceso por sede", "tematizar por agencia", "agency validation", "sede access", "agency filtering", "business rules by agency".
