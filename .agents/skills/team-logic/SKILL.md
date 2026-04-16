---
name: team-logic
description: How to implement team-based permissions and user relationships in the ERP Nova CRM. Use this skill whenever the user mentions validating manager permissions over team members, filtering data by team, assigning users to teams, auditing access control related to teams, or implementing features that differentiate between managers and advisors. This skill covers the database schema, query patterns, and permission logic for the team management system.
---

# Team Logic in ERP Nova CRM

## Database Schema Architecture

### Core Tables and Relationships

```sql
-- EQUIPOS: Each team has ONE manager who leads it
CREATE TABLE equipos (
  id uuid PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  color text DEFAULT '#6366f1',
  gerente_id uuid NOT NULL REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- PROFILES: Users can belong to ONE team (nullable for managers)
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  role_id uuid REFERENCES roles(id),
  equipo_id uuid REFERENCES equipos(id),  -- NULL for managers
  sede_id uuid REFERENCES sedes(id),
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Key Relationship Rules

1. **Manager (Gerente)**: 
   - Leads a team via `equipos.gerente_id = manager.id`
   - Has `profiles.equipo_id = NULL` (doesn't belong to a team)
   - Can edit resources created by team members

2. **Advisor (Asesor)**: 
   - Belongs to a team via `profiles.equipo_id = team.id`
   - Can only edit their own resources

## Implementation Patterns

### 1. Loading Team Context (UserProfileContext)

```javascript
// Load team led by manager
if (profileData?.role?.name === 'gerente') {
  const { data: equipoData, error: equipoError } = await supabase
    .from('equipos')
    .select('id, nombre, descripcion, color')
    .eq('gerente_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!equipoError && equipoData) {
    equipoLiderado = equipoData
  }
}

// Expose both values in context
setProfileData({
  equipoId: profileData.equipo_id || null,      // For advisors
  equipoLiderado: equipoLiderado || null        // For managers
})
```

### 2. Validating Manager Permissions

```javascript
// In components like VueloCard.jsx
const { role, equipoId, equipoLiderado } = useUserProfile()
const esGerente = role === 'gerente'
const esCreador = recurso.created_by === user?.id

// Manager can edit if they are creator OR if creator belongs to their led team
const puedeEditarGerente = esGerente && (
  esCreador || 
  recurso.creator?.equipo_id === equipoLiderado?.id
)

const puedeEditar = esCreador || esAdmin || puedeEditarGerente
```

### 3. Backend Data Enrichment

```javascript
// In services like vuelosService.js
const creatorIds = [...new Set(vuelos.map(v => v.created_by).filter(Boolean))];
const { data: profiles, error: errorProfiles } = await supabase
  .from('profiles')
  .select('id, full_name, email, equipo_id')  // Include equipo_id for permission checks
  .in('id', creatorIds);

const vuelosEnriquecidos = vuelos.map(v => ({
  ...v,
  creator: profilesMap[v.created_by] || { full_name: 'Desconocido', email: 'N/A' }
}));
```

### 4. Filtering Data by Team

```javascript
// Filter resources for a manager's team view
const getTeamResources = async (managerId) => {
  // First get the manager's team
  const { data: equipo } = await supabase
    .from('equipos')
    .select('id')
    .eq('gerente_id', managerId)
    .single()

  if (!equipo) return []

  // Then get all profiles in that team
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id')
    .eq('equipo_id', equipo.id)

  const memberIds = teamMembers.map(m => m.id)

  // Finally filter resources by team members
  const { data: resources } = await supabase
    .from('vuelos')
    .select('*')
    .in('created_by', memberIds)

  return resources
}
```

## Debug Logging Patterns

### Strategic Debug Logs for Team Logic

```javascript
// In permission-critical components
if (esGerente) {
  console.log('Team Permission Debug:', {
    userId: user.id,
    role: role,
    esCreador: esCreador,
    equipoId: equipoId,                    // Should be null for managers
    equipoLideradoId: equipoLiderado?.id,   // Manager's team ID
    creatorEquipoId: recurso.creator?.equipo_id,
    creatorName: recurso.creator?.full_name,
    canEdit: puedeEditarGerente,
    permissionLogic: 'manager-led-team-validation'
  })
}
```

## Common Use Cases

### 1. Implementing Edit Permissions
- Use `equipoLiderado?.id` for manager validation
- Compare against `recurso.creator?.equipo_id`
- Fall back to creator check for self-editing

### 2. Team-Based Dashboards
- Load manager's team via `equipos.gerente_id`
- Filter data by team member profiles
- Include team member names in aggregations

### 3. User Management Interface
- Show team assignment in profile forms
- Validate manager-team relationships
- Handle team reassignment with permission cascades

### 4. Access Control Auditing
- Log team-based permission decisions
- Track manager access to team member resources
- Audit team membership changes

## Reference Files

- `docs/05-base-de-datos/esquemalocal.sql` - Lines 305-316 (equipos), 466-482 (profiles)
- `dashboard/src/contexts/UserProfileContext.js` - Team context loading
- `dashboard/src/components/vuelos/VueloCard.jsx` - Permission validation example
- `src/services/vuelosService.js` - Data enrichment pattern

## Key Gotchas

1. **Managers have null equipo_id**: This is correct - they lead teams but don't belong to one
2. **Always check equipoLiderado for managers**: Don't use equipo_id for manager validation
3. **Include equipo_id in creator queries**: Backend must return this for frontend validation
4. **Team membership is optional**: Users can have null equipo_id (managers, admins, etc.)

## Testing Team Logic

When implementing team-based features, always test:
1. Manager editing their own resources
2. Manager editing team member resources  
3. Manager editing resources from other teams (should fail)
4. Advisor editing only their own resources
5. Admin/super admin bypassing team restrictions
