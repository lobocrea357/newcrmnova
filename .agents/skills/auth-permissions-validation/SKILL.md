---
name: auth-permissions-validation
description: How to implement authentication, role-based access control, and permission validation in React components for the ERP Nova CRM. Use this skill whenever the user mentions creating protected pages, role-based features, permission checks, route guards, or any access control logic. This includes when users talk about "validar rol", "permisos requeridos", "proteger ruta", "solo admin", "acceso denegado", or implementing business rules based on user roles and permissions.
---

# Authentication and Permissions Validation Guide

This skill teaches you how to implement authentication, role-based access control, and permission validation in the ERP Nova CRM system. The system provides hooks and helpers for validating user access based on roles and permissions.

## Available Auth Context

### Basic Auth Data
```javascript
const {
  user,               // Auth user object
  isAuthenticated,     // Boolean
  loading,            // Loading state
} = useAuth()
```

### User Profile and Permissions
```javascript
const {
  profile,            // User profile data
  role,               // Role name (string)
  roleObject,         // Complete role object
  permissions,        // Combined permissions array
  
  // Role helpers
  isRole,             // Check specific role
  isSuperAdmin,       // Super admin check
  isAdmin,            // Admin check
  isManager,          // Manager check
  isAsesor,           // Asesor check
  isEmisor,           // Emisor check
  
  // Permission helpers
  hasPermission,      // Check specific permission
  hasAnyPermission,   // Check any of multiple permissions
  hasAllPermissions,  // Check all required permissions
  
  // Hierarchical helpers
  getRoleRanking,     // Get role ranking number
  canManageRole,      // Check if can manage target role
} = useUserProfile()
```

## Role-Based Validation

### `isRole(roleName)` - Check Specific Role
Verifies if the user has a specific role (case-insensitive).

```javascript
const { isRole } = useUserProfile()

if (isRole('admin')) {
  return <AdminPanel />
}

if (isRole('gerente')) {
  return <ManagerPanel />
}
```

### Predefined Role Helpers
Quick access to common role checks:

```javascript
const { isSuperAdmin, isAdmin, isManager, isAsesor } = useUserProfile()

// Super admin has all access
if (isSuperAdmin) {
  return <SuperAdminFeatures />
}

// Admin and super admin
if (isAdmin) {
  return <AdminFeatures />
}

// Manager, admin, and super admin
if (isManager) {
  return <ManagerFeatures />
}
```

### Role Hierarchy
Roles have ranking numbers for hierarchical validation:

```javascript
const { getRoleRanking, canManageRole } = useUserProfile()

// Get user's role ranking
const myRanking = getRoleRanking()

// Check if can manage users with lower ranking
if (canManageRole(targetRoleRanking)) {
  return <UserManagement />
}
```

## Permission-Based Validation

### `hasPermission(permissionName)` - Check Single Permission
Verifies if the user has a specific permission.

```javascript
const { hasPermission } = useUserProfile()

if (hasPermission('cotizaciones:crear')) {
  return <CreateCotizacionButton />
}

if (hasPermission('usuarios:editar')) {
  return <EditUserButton />
}
```

### `hasAnyPermission(permissionsArray)` - Check Any Permission
Verifies if the user has at least one of the specified permissions.

```javascript
const { hasAnyPermission } = useUserProfile()

const canManageUsers = hasAnyPermission([
  'usuarios:crear',
  'usuarios:editar',
  'usuarios:eliminar'
])

if (canManageUsers) {
  return <UserManagement />
}
```

### `hasAllPermissions(permissionsArray)` - Check All Permissions
Verifies if the user has ALL specified permissions.

```javascript
const { hasAllPermissions } = useUserProfile()

const canFullManage = hasAllPermissions([
  'cotizaciones:crear',
  'cotizaciones:editar',
  'cotizaciones:eliminar',
  'cotizaciones:aprobar'
])

if (canFullManage) {
  return <FullCotizacionManagement />
}
```

## Route Protection Patterns

### Basic Route Guard
```javascript
function ProtectedPage() {
  const { loading, isAuthenticated } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>
  
  return <PageContent />
}
```

### Role-Based Route Protection
```javascript
function AdminPage() {
  const { loading, isAdmin } = useUserProfile()
  
  if (loading) return <div>Loading...</div>
  if (!isAdmin) return <div>Access denied</div>
  
  return <AdminContent />
}
```

### Permission-Based Route Protection
```javascript
function CreateUserPage() {
  const { loading, hasPermission } = useUserProfile()
  
  if (loading) return <div>Loading...</div>
  if (!hasPermission('usuarios:crear')) {
    return <div>Access denied</div>
  }
  
  return <CreateUserForm />
}
```

### Using useRouteGuard Hook
The system provides a built-in route guard hook:

```javascript
import { useRouteGuard } from '@/hooks/useRouteGuard'

function AdminPage() {
  const { loading, isAuthorized } = useRouteGuard({
    allowedRoles: ['admin', 'super_admin']
  })
  
  if (loading) return <div>Loading...</div>
  if (!isAuthorized) return <div>Access denied</div>
  
  return <AdminContent />
}
```

### Predefined Route Guards
```javascript
import { 
  useAuthRequired,
  useAdminRequired,
  useManagerRequired,
  usePublicPage 
} from '@/hooks/useRouteGuard'

// Require authentication only
function UserProfile() {
  const { loading, user } = useAuthRequired()
  // ... component logic
}

// Require admin or super admin
function AdminPanel() {
  const { loading, user } = useAdminRequired()
  // ... component logic
}

// Require manager, admin, or super admin
function ManagerPanel() {
  const { loading, user } = useManagerRequired()
  // ... component logic
}

// Public page (no auth required)
function HomePage() {
  const { loading, user } = usePublicPage()
  // ... component logic
}
```

## Component-Level Access Control

### Conditional Rendering by Role
```javascript
function UserActions({ userId }) {
  const { isSuperAdmin, isAdmin, isManager } = useUserProfile()
  
  return (
    <div className="flex gap-2">
      <button>View</button>
      
      {isAdmin && <button>Edit</button>}
      
      {isManager && <button>Assign Role</button>}
      
      {isSuperAdmin && <button>Delete</button>}
    </div>
  )
}
```

### Conditional Rendering by Permission
```javascript
function CotizacionActions({ cotizacion }) {
  const { hasPermission } = useUserProfile()
  
  return (
    <div className="flex gap-2">
      <button>View</button>
      
      {hasPermission('cotizaciones:editar') && (
        <button>Edit</button>
      )}
      
      {hasPermission('cotizaciones:aprobar') && (
        <button className="btn-success">Approve</button>
      )}
      
      {hasPermission('cotizaciones:eliminar') && (
        <button className="btn-danger">Delete</button>
      )}
    </div>
  )
}
```

### Component Visibility Wrapper
```javascript
function RoleProtectedComponent({ roles, children, fallback = null }) {
  const { isRole, loading } = useUserProfile()
  
  if (loading) return <div>Loading...</div>
  
  const hasAccess = Array.isArray(roles) 
    ? roles.some(role => isRole(role))
    : isRole(roles)
  
  return hasAccess ? children : fallback
}

// Usage
<RoleProtectedComponent roles={['admin', 'super_admin']} fallback={<div>Access denied</div>}>
  <AdminContent />
</RoleProtectedComponent>
```

### Permission-Based Component Wrapper
```javascript
function PermissionProtectedComponent({ permissions, requireAll = false, children, fallback = null }) {
  const { hasAnyPermission, hasAllPermissions, loading } = useUserProfile()
  
  if (loading) return <div>Loading...</div>
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)
  
  return hasAccess ? children : fallback
}

// Usage - Need ANY of these permissions
<PermissionProtectedComponent permissions={['cotizaciones:editar', 'cotizaciones:aprobar']}>
  <CotizacionManagement />
</PermissionProtectedComponent>

// Usage - Need ALL of these permissions
<PermissionProtectedComponent permissions={['usuarios:crear', 'usuarios:editar']} requireAll={true}>
  <FullUserManagement />
</PermissionProtectedComponent>
```

## Complex Validation Scenarios

### Combining Role and Permission Checks
```javascript
function AdvancedUserManagement() {
  const { isAdmin, hasPermission } = useUserProfile()
  
  // Must be admin AND have user management permissions
  const canManageUsers = isAdmin && hasPermission('usuarios:gestionar')
  
  if (!canManageUsers) {
    return <div>Access denied</div>
  }
  
  return <UserManagementInterface />
}
```

### Hierarchical Role Management
```javascript
function UserRoleManager() {
  const { isSuperAdmin, getRoleRanking, canManageRole } = useUserProfile()
  
  // Only super admins can manage other admins
  if (!isSuperAdmin) {
    return <div>Only super admins can manage roles</div>
  }
  
  const handleRoleChange = (userId, newRoleRanking) => {
    if (!canManageRole(newRoleRanking)) {
      alert('Cannot assign role higher than or equal to your own')
      return
    }
    
    // Proceed with role change
    updateUserRole(userId, newRoleRanking)
  }
  
  return <RoleManagementInterface onRoleChange={handleRoleChange} />
}
```

### Dynamic Permission-Based UI
```javascript
function DynamicNavigation() {
  const { hasPermission } = useUserProfile()
  
  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      visible: true // Always visible
    },
    {
      title: 'Users',
      path: '/users',
      visible: hasPermission('usuarios:ver')
    },
    {
      title: 'Cotizaciones',
      path: '/cotizaciones',
      visible: hasPermission('cotizaciones:ver')
    },
    {
      title: 'Reports',
      path: '/reports',
      visible: hasPermission('reportes:ver')
    },
    {
      title: 'Settings',
      path: '/settings',
      visible: hasPermission('sistema:configurar')
    }
  ]
  
  return (
    <nav>
      {menuItems
        .filter(item => item.visible)
        .map(item => (
          <NavLink key={item.path} to={item.path}>
            {item.title}
          </NavLink>
        ))}
    </nav>
  )
}
```

## Business Logic Validation

### Permission-Based Business Rules
```javascript
function CotizacionApproval({ cotizacion }) {
  const { hasPermission, isSuperAdmin } = useUserProfile()
  
  // Business rule: Only users with approval permission OR super admins can approve
  const canApprove = hasPermission('cotizaciones:aprobar') || isSuperAdmin
  
  // Additional business rule: Can't approve own cotizaciones (unless super admin)
  const isOwnCotizacion = cotizacion.created_by === user.id
  const finalCanApprove = canApprove && (isSuperAdmin || !isOwnCotizacion)
  
  if (!finalCanApprove) {
    return <div>Cannot approve this cotizacion</div>
  }
  
  return <ApprovalButton cotizacionId={cotizacion.id} />
}
```

### Role-Based Data Access
```javascript
function UserDataTable() {
  const { isSuperAdmin, isAdmin, isManager } = useUserProfile()
  
  const getDataQuery = () => {
    if (isSuperAdmin) {
      // Super admins see all data
      return supabase.from('users').select('*')
    } else if (isAdmin) {
      // Admins see users in their agencies
      return supabase.from('users').select('*').in('agencia_id', userAgencies)
    } else if (isManager) {
      // Managers see users in their team
      return supabase.from('users').select('*').eq('equipo_id', user.equipo_id)
    } else {
      // Others see only their own data
      return supabase.from('users').select('*').eq('id', user.id)
    }
  }
  
  // ... rest of component
}
```

## Error Handling and Fallbacks

### Access Denied Components
```javascript
function AccessDenied({ requiredRole, requiredPermission }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <h3 className="text-red-800 font-semibold">Access Denied</h3>
      <p className="text-red-600">
        {requiredRole && `This page requires ${requiredRole} role or higher.`}
        {requiredPermission && `This action requires "${requiredPermission}" permission.`}
      </p>
      <p className="text-sm text-red-500 mt-2">
        Contact your administrator if you believe this is an error.
      </p>
    </div>
  )
}
```

### Loading States
```javascript
function ProtectedComponent({ children, fallback = <div>Loading...</div> }) {
  const { loading } = useUserProfile()
  
  if (loading) return fallback
  
  return children
}
```

## Testing and Debugging

### Console Debug Information
The UserProfileContext logs user permissions and roles to console:

```javascript
// Console output example
{
  email: "user@example.com",
  role: "admin",
  rolePermissionsCount: 15,
  userPermissionsCount: 3,
  allPermissions: ["cotizaciones:crear", "cotizaciones:editar", ...],
  isSuperAdmin: false,
  isAdmin: true
}
```

### Manual Permission Testing
```javascript
// In browser console for debugging
const { hasPermission, isRole, permissions } = useUserProfile()
console.log('Has cotizaciones:crear?', hasPermission('cotizaciones:crear'))
console.log('Is admin?', isRole('admin'))
console.log('All permissions:', permissions)
```

## Best Practices

### 1. Always Check Loading State
```javascript
function MyComponent() {
  const { loading, hasPermission } = useUserProfile()
  
  if (loading) return <div>Loading...</div>
  
  if (!hasPermission('cotizaciones:crear')) {
    return <AccessDenied requiredPermission="cotizaciones:crear" />
  }
  
  return <ComponentContent />
}
```

### 2. Use Specific Permissions Over Generic Roles
```javascript
// Good: Specific permission
if (hasPermission('cotizaciones:aprobar')) {
  return <ApprovalButton />
}

// Avoid: Generic role (unless necessary)
if (isAdmin) {
  return <ApprovalButton />
}
```

### 3. Combine Multiple Checks When Needed
```javascript
// Complex validation
const canManage = isAdmin && hasPermission('usuarios:editar')
const notOwnAccount = userId !== user.id

if (canManage && notOwnAccount) {
  return <EditUserButton userId={userId} />
}
```

### 4. Provide Clear Feedback
```javascript
function PermissionGate({ children, permission, role, fallback }) {
  const { hasPermission, isRole, loading } = useUserProfile()
  
  if (loading) return <div>Loading...</div>
  
  const hasAccess = (permission && hasPermission(permission)) || 
                   (role && isRole(role))
  
  if (!hasAccess) {
    return fallback || <AccessDenied requiredPermission={permission} requiredRole={role} />
  }
  
  return children
}
```

### 5. Security: Always Validate Backend
Frontend validation is for UX only. Always validate in backend:

```javascript
// Backend validation example
router.post('/users', authMiddleware, async (req, res) => {
  const userId = req.user.id
  
  // Check user permissions
  const hasPermission = await checkUserPermission(userId, 'usuarios:crear')
  if (!hasPermission) {
    return res.status(403).json({ error: 'No autorizado' })
  }
  
  // Continue with creation
})
```

## Integration with Agency/Sede Context

You can combine auth validation with agency/sede context:

```javascript
function AgencyAdminPanel() {
  const { isAdmin, hasAgencia } = useUserProfile()
  
  // Must be admin AND belong to the agency
  if (!isAdmin || !hasAgencia('nova_flash')) {
    return <AccessDenied />
  }
  
  return <NovaFlashAdminContent />
}
```

## Common Patterns

### 1. Permission-Based Button Visibility
```javascript
function ActionButton({ permission, children, ...props }) {
  const { hasPermission } = useUserProfile()
  
  if (!hasPermission(permission)) {
    return null
  }
  
  return <button {...props}>{children}</button>
}

// Usage
<ActionButton permission="cotizaciones:crear" className="btn-primary">
  Create Cotizacion
</ActionButton>
```

### 2. Role-Based Layout
```javascript
function RoleBasedLayout() {
  const { isSuperAdmin, isAdmin, isAsesor } = useUserProfile()
  
  return (
    <div>
      <Header />
      
      {isSuperAdmin && <SuperAdminSidebar />}
      {isAdmin && !isSuperAdmin && <AdminSidebar />}
      {isAsesor && !isAdmin && <AsesorSidebar />}
      
      <MainContent />
    </div>
  )
}
```

### 3. Dynamic Permission Checking
```javascript
function usePermissionChecker() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useUserProfile()
  
  return {
    can: hasPermission,
    canAny: hasAnyPermission,
    canAll: hasAllPermissions
  }
}

// Usage
function MyComponent() {
  const { can } = usePermissionChecker()
  
  if (can('cotizaciones:editar')) {
    return <EditButton />
  }
}
```

## Migration from Manual Checks

### Before (Manual Role Checks)
```javascript
function OldComponent() {
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchUserRole = async () => {
      const response = await fetch(`/api/users/${userId}/role`)
      const data = await response.json()
      setUserRole(data.role)
      setLoading(false)
    }
    fetchUserRole()
  }, [userId])
  
  if (loading) return <div>Loading...</div>
  if (userRole !== 'admin') return <div>Access denied</div>
  
  return <AdminContent />
}
```

### After (Using Context)
```javascript
function NewComponent() {
  const { loading, isAdmin } = useUserProfile()
  
  if (loading) return <div>Loading...</div>
  if (!isAdmin) return <div>Access denied</div>
  
  return <AdminContent />
}
```

**Benefits:**
- Automatic loading state management
- Consistent across entire application
- Built-in error handling
- Performance optimized (single load)
- Type safety and better DX

## When to Use This Skill

Use this skill when you need to:
- Create protected pages or routes
- Implement role-based features
- Check specific permissions for actions
- Validate user access to components
- Create business rules based on roles/permissions
- Implement dynamic UI based on user permissions
- Create admin panels with different access levels
- Filter data based on user roles
- Implement hierarchical role management

**Trigger phrases:** "validar rol", "permisos requeridos", "proteger ruta", "solo admin", "acceso denegado", "role validation", "permission check", "access control", "route protection", "user permissions", "role-based access".
