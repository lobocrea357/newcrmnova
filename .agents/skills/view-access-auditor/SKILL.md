---
name: view-access-auditor
description: How to audit React components and pages for access control and data filtering requirements in the ERP Nova CRM. Make sure to use this skill whenever the user mentions auditing views for security, checking access control, validating permissions, or asking about protection for pages/components. This includes when users talk about "audita esta vista", "revisa si necesita validaciones", "¿debería proteger esta página?", "analiza este componente para seguridad", "¿qué validaciones necesito?", or any access control review of React components that display user data or provide functionality.
---

# View Access Auditor: Access Control and Data Filtering Audit

This skill helps you audit React components and pages to identify required access control validations and data filtering based on user roles, agencies, sedes, and permissions in the ERP Nova CRM system.

## Audit Process

### Step 1: Analyze the Component
When given a React component, analyze:
- What data is being displayed
- What functionality is provided
- Who should be able to access this
- What data should be filtered

### Step 2: Ask Targeted Questions
Based on your analysis, ask specific questions about:
- **Role-based access:** Who can see this?
- **Agency filtering:** Should data be filtered by user's agency?
- **Sede restrictions:** Is sede-based access needed?
- **Permission requirements:** What permissions are needed?
- **Business rules:** Any special validation logic?

### Step 3: Provide Recommendations
Suggest specific implementations using:
- `useUserProfile()` hook helpers
- Role and permission validation
- Agency and sede context
- Route protection patterns
- Component-level access control

## Question Framework

### Access Control Questions
Always ask these questions when auditing a component:

#### Role-Based Access
- "¿Qué roles deberían poder ver esta vista? (admin, gerente, asesor, etc.)"
- "¿Es solo para administradores o también para otros roles?"
- "¿Los super admins deberían tener acceso completo?"

#### Agency-Based Access
- "¿Los datos deben filtrarse por las agencias del usuario?"
- "¿Solo usuarios de ciertas agencias pueden acceder?"
- "¿Los administradores pueden ver datos de todas las agencias?"

#### Sede-Based Access
- "¿La sede del usuario afecta qué puede ver?"
- "¿Es contenido específico para una sede en particular?"

#### Permission Requirements
- "¿Qué permisos específicos se necesitan?"
- "¿Se necesita permiso para ver vs. editar vs. eliminar?"

#### Business Logic
- "¿Hay reglas de negocio especiales? (ej: solo ver propios datos)"
- "¿Hay restricciones de tiempo o fechas?"

### Data Filtering Questions
- "¿Los datos mostrados deben filtrarse automáticamente?"
- "¿Qué criterios de filtrado se aplican?"
- "¿Los usuarios pueden ver datos de otros usuarios?"

## Common Patterns and Recommendations

### Pattern 1: Data Listing Components
**When you see:** Components that display lists (cotizaciones, usuarios, vuelos, etc.)

**Ask:**
- "¿Quién puede ver esta lista?"
- "¿Se debe filtrar por agencia/sede del usuario?"
- "¿Los administradores ven todo?"

**Recommend:**
```javascript
function UserCotizaciones() {
  const { getAgenciaIds, isAdmin } = useUserProfile()
  
  const fetchData = async () => {
    if (isAdmin) {
      // Admins see all
      return supabase.from('cotizaciones').select('*')
    } else {
      // Filter by user's agencies
      const agencyIds = getAgenciaIds()
      return supabase.from('cotizaciones').select('*').in('agencia_id', agencyIds)
    }
  }
}
```

### Pattern 2: Form Components
**When you see:** Forms that create or edit data

**Ask:**
- "¿Quién puede crear/editar estos datos?"
- "¿Se necesita permiso específico?"
- "¿Pueden editar datos de otros usuarios?"

**Recommend:**
```javascript
function CreateCotizacionForm() {
  const { hasPermission } = useUserProfile()
  
  if (!hasPermission('cotizaciones:crear')) {
    return <AccessDenied requiredPermission="cotizaciones:crear" />
  }
  
  // Form implementation
}
```

### Pattern 3: Dashboard/Analytics
**When you see:** Components showing analytics or reports

**Ask:**
- "¿Es un dashboard personal o de equipo?"
- "¿Pueden ver datos de otras agencias?"
- "¿Hay restricciones por sede?"

**Recommend:**
```javascript
function Dashboard() {
  const { isAdmin, getAgenciaIds, getSedeId } = useUserProfile()
  
  const query = useMemo(() => {
    if (isAdmin) {
      return supabase.from('analytics').select('*')
    } else {
      let query = supabase.from('analytics').select('*')
      
      // Filter by agencies
      const agencyIds = getAgenciaIds()
      query = query.in('agencia_id', agencyIds)
      
      // Filter by sede if needed
      const sedeId = getSedeId()
      if (sedeId) query = query.eq('sede_id', sedeId)
      
      return query
    }
  }, [isAdmin, getAgenciaIds, getSedeId])
}
```

### Pattern 4: User Management
**When you see:** Components that manage users or roles

**Ask:**
- "¿Quién puede gestionar usuarios?"
- "¿Pueden editar usuarios de mismo nivel?"
- "¿Qué restricciones jerárquicas hay?"

**Recommend:**
```javascript
function UserManagement() {
  const { isSuperAdmin, canManageRole } = useUserProfile()
  
  const handleRoleChange = (userId, newRole) => {
    if (!canManageRole(newRole.ranking)) {
      alert('No puedes asignar un rol igual o superior al tuyo')
      return
    }
    
    updateUserRole(userId, newRole)
  }
}
```

## Validation Checklist

Always check for these common security issues:

### Access Control
- [ ] Role-based access validation
- [ ] Permission checks for sensitive actions
- [ ] Route protection if needed
- [ ] Component-level access control

### Data Filtering
- [ ] Agency-based filtering
- [ ] Sede-based filtering
- [ ] User ownership validation
- [ ] Administrative override logic

### Business Logic
- [ ] Hierarchical role restrictions
- [ ] Time-based restrictions
- [ ] Data ownership rules
- [ ] Cross-agency access rules

## Team and Agency Assignment Validation

When auditing components that handle team or agency assignments, check for:

### Team Assignment Validation
- "¿Solo asesores pueden ser asignados a equipos?"
- "¿Se valida que el asesor no tenga equipo ya asignado?"
- "¿Los gerentes solo pueden liderar un equipo a la vez?"
- "¿El backend valida estas reglas o solo el frontend?"

### Agency Assignment Validation
- "¿Los admins pueden tener agencias asignadas? (deberían ser excluidos)"
- "¿Un usuario puede tener múltiples agencias asignadas?"
- "¿Se requiere que una agencia sea marcada como primaria?"
- "¿El backend valida roles antes de asignar?"

### Common Patterns for Assignment Validation

```javascript
// Frontend: Filter available users by role
const availableAdvisors = allUsers.filter(u => {
  const roleName = u.role?.name?.toLowerCase()
  return roleName === 'asesor' || roleName === 'advisor'
})

// Backend: Validate before assignment
export async function assignUserToTeam(userId, teamId) {
  const { data: user } = await supabase
    .from('profiles')
    .select('equipo_id, role:roles(name)')
    .eq('id', userId)
    .single();

  if (user.role.name !== 'asesor') {
    return { error: 'Solo asesores pueden ser asignados' };
  }

  if (user.equipo_id) {
    return { error: 'Usuario ya tiene equipo asignado' };
  }

  // Proceed with assignment
}
```

### Audit Checklist for Assignment Components

- [ ] Role filtering in select options (frontend)
- [ ] Backend validation of role before assignment
- [ ] Backend validation of current state (team/agency already assigned)
- [ ] Error handling and user feedback
- [ ] Business rules enforced at both frontend and backend

## Implementation Examples

### Example 1: Cotizaciones List
**User says:** "Audita esta vista de cotizaciones"

**Your response:**
"He analizado tu componente de cotizaciones. Tengo algunas preguntas:

**Acceso:**
1. ¿Qué roles deberían ver las cotizaciones? (¿solo admin, también gerentes, todos?)
2. ¿Los usuarios deben ver solo sus cotizaciones o también las de su equipo/agencia?
3. ¿Los administradores pueden ver cotizaciones de todas las agencias?

**Filtrado:**
1. ¿Se deben filtrar por la agencia del usuario?
2. ¿La sede afecta qué cotizaciones se muestran?
3. ¿Hay restricción por fechas (ej: solo últimos 30 días)?

**Permisos:**
1. ¿Qué permisos se necesitan para ver vs. editar vs. eliminar?
2. ¿Los usuarios pueden ver cotizaciones de otros usuarios?

**Recomendaciones basadas en tu código:**
- No veo validación de rol - considera usar `isAdmin` o `hasPermission('cotizaciones:ver')`
- No hay filtrado por agencia - podrías usar `getAgenciaIds()`
- Considera agregar validación de `hasPermission('cotizaciones:editar')` para botones de edición

¿Quieres que implemente alguna de estas validaciones?"

### Example 2: User Profile
**User says:** "Revisa si el perfil de usuario necesita validaciones"

**Your response:**
"He revisado tu componente de perfil. Preguntas:

**Acceso:**
1. ¿Los usuarios pueden ver su propio perfil siempre?
2. ¿Pueden ver perfiles de otros usuarios?
3. ¿Qué rol puede editar perfiles?

**Datos:**
1. ¿Se debe mostrar información sensible (salario, etc.)?
2. ¿La agencia/sede del usuario es visible para todos?

**Recomendaciones:**
- Para ver perfil propio: siempre permitir
- Para ver otros perfiles: requiere `hasPermission('usuarios:ver')`
- Para editar: requiere `hasPermission('usuarios:editar')`
- Considera ocultar datos sensibles según rol"

## Security Best Practices

### Always Validate
- Never trust frontend alone - always validate backend
- Use specific permissions rather than generic roles when possible
- Implement defense in depth (route + component + data level)

### Common Mistakes to Catch
- Missing role validation on sensitive data
- No agency filtering on data lists
- Admin functions accessible to non-admins
- User data visible to unauthorized users

### Performance Considerations
- Filter data at database level when possible
- Use memoization for complex filtering logic
- Cache user permissions when appropriate

## Integration with Other Skills

This skill works with:
- **agency-sede-context:** For agency and sede filtering
- **auth-permissions-validation:** For role and permission checks

Always reference these skills when suggesting implementations.

## Output Format

Always structure your audit as:

1. **Analysis Summary:** Brief description of what the component does
2. **Security Questions:** Targeted questions about access control
3. **Recommendations:** Specific code suggestions with helpers
4. **Implementation Options:** Different approaches based on requirements
5. **Next Steps:** What the user should decide

## When to Use This Skill

Use this skill when you need to:
- Audit React components for security issues
- Identify missing access control validations
- Review data filtering requirements
- Plan security implementation for new features
- Validate existing components meet security requirements

**Trigger phrases:** "audita esta vista", "revisa si necesita validaciones", "¿debería proteger esta página?", "analiza este componente para seguridad", "¿qué validaciones necesito?", "security review", "access control audit", "validate component security".
