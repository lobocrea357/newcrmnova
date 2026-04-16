# Usuarios Security & Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement security restrictions and hierarchical access control in the user management interface, ensuring admins cannot access or modify users/roles/permissions of equal or higher level.

**Architecture:** Multi-layered security approach with frontend tab visibility controls, backend API validation, and database-level filtering. Each security layer validates independently to ensure defense in depth.

**Tech Stack:** React (frontend), Node.js/Express (backend), PostgreSQL (database), JWT authentication, role-based access control (RBAC)

---

## ESTADO DE IMPLEMENTACIÓN

**Fases Completadas (sin commit):**
- ✅ FASE 1: Restricciones de Acceso a Tabs (CRÍTICO)
- ✅ FASE 2: Filtrado Jerárquico de Usuarios (CRÍTICO)
- ✅ FASE 3: Validación Jerárquica en Edición/Eliminación de Usuarios (CRÍTICO)
- ✅ FASE 4: Validación Jerárquica en Roles (CRÍTICO)
- ✅ FASE 5: Protección de Permisos Esenciales (CRÍTICO)

**Fases Pendientes:**
- ✅ FASE 6: Restricciones en Equipos (IMPORTANTE)
- ✅ FASE 7: Mejoras UX - Reemplazar Alerts/Confirms (MEJORA)

**Nota:** Los cambios de las fases 1-7 ya están implementados en el código pero NO se han hecho commit todavía. Se recomienda hacer commit de todos los cambios existentes.

**Comandos git para commit de las fases 1-5:**
```bash
# FASE 1
git add dashboard/src/app/(crm)/configuracion/usuarios/page.js src/middleware/auth.js src/routes/permissions.js
git commit -m "feat: restrict tab visibility based on user role"

# FASE 2
git add src/services/userService.js src/routes/users.js
git commit -m "feat: implement hierarchical user filtering backend"

git add dashboard/src/components/users/UserList.jsx
git commit -m "feat: improve empty state for hierarchical user filtering"

# FASE 3
git add src/routes/users.js
git commit -m "feat: add hierarchical validation for user edit/delete"

git add dashboard/src/components/users/UserList.jsx dashboard/src/app/(crm)/configuracion/usuarios/page.js
git commit -m "feat: hide edit buttons for users of equal/higher ranking"

# FASE 4
git add src/services/roleService.js src/routes/users.js src/routes/roles.js
git commit -m "feat: implement hierarchical role management"

# FASE 5
git add docs/05-base-de-datos/migrations/add_permissions_system_protection.sql
git commit -m "feat: add system protection flag to essential permissions"

git add src/services/permisosService.js src/routes/permissions.js
git commit -m "feat: protect essential system permissions from deletion"

git add dashboard/src/components/permissions/PermissionsManager.jsx
git commit -m "feat: add UI protection for system permissions"

# FASE 6
git add src/services/equiposService.js src/routes/equipos.js
git commit -m "feat: implement role-based team management restrictions"

git add dashboard/src/components/users/EquiposTab.jsx dashboard/src/app/(crm)/configuracion/usuarios/page.js
git commit -m "feat: implement frontend team filtering by user role"

# FASE 7
git add dashboard/src/components/users/UserFormModal.jsx
git commit -m "feat: replace native alerts with react-hot-toast"

git add dashboard/src/components/permissions/RolesManager.jsx dashboard/src/components/permissions/PermissionsManager.jsx dashboard/src/components/permissions/UserPermissionsManager.jsx dashboard/src/components/users/EquiposTab.jsx
git commit -m "feat: replace native confirms with SweetAlert2"
```

---

## File Structure Overview

### Frontend Files
- `dashboard/src/app/(crm)/configuracion/usuarios/page.js` - Main users management page with tab visibility
- `dashboard/src/components/users/UserList.jsx` - User list with hierarchical filtering
- `dashboard/src/components/users/UserFormModal.jsx` - User creation/editing modal
- `dashboard/src/components/users/EquiposTab.jsx` - Teams management with role restrictions
- `dashboard/src/components/permissions/RolesManager.jsx` - Role management with hierarchical validation
- `dashboard/src/components/permissions/PermissionsManager.jsx` - Permissions management with system protection
- `dashboard/src/components/permissions/RolePermissionsManager.jsx` - Role-permission assignment (super_admin only)
- `dashboard/src/components/permissions/UserPermissionsManager.jsx` - Special permissions (super_admin only)
- `dashboard/src/components/agencias/AgenciasManager.jsx` - Agency management
- `dashboard/src/components/sedes/SedesManager.jsx` - Office locations management
- `dashboard/src/lib/colors.js` - Shared color utilities (new)

### Backend Files
- `src/routes/users.js` - User routes with hierarchical validation
- `src/services/usersService.js` - User service with filtering logic
- `src/routes/roles.js` - Role routes with ranking validation
- `src/services/rolesService.js` - Role service with hierarchy checks
- `src/routes/permissions.js` - Permission routes with system protection
- `src/services/permissionsService.js` - Permission service with validation
- `src/routes/equipos.js` - Team routes with role-based access
- `src/services/equiposService.js` - Team service with gerente restrictions
- `src/routes/agencias.js` - Agency routes
- `src/services/agenciasService.js` - Agency service
- `src/routes/sedes.js` - Office routes
- `src/services/sedesService.js` - Office service

### Database Files
- `docs/05-base-de-datos/migrations/add_permissions_system_protection.sql` - Migration for system permissions protection

---

## FASE 1: Restricciones de Acceso a Tabs (CRÍTICO) - ✅ COMPLETADA

### Task 1: Implement Tab Visibility Logic

**Files:**
- Modify: `dashboard/src/app/(crm)/configuracion/usuarios/page.js:275-363`

- [x] **Step 1: Add tab configuration based on user role**

```javascript
// Add after line 29 (after activeTab state)
const visibleTabs = [
  { id: 'usuarios', label: 'Usuarios', icon: Users, show: true },
  { id: 'roles', label: 'Roles', icon: Shield, show: true },
  { id: 'permisos', label: 'Permisos', icon: Key, show: isSuperAdmin }, // Solo super_admin
  { id: 'permisos-roles', label: 'Permisos por Rol', icon: ShieldCheck, show: isSuperAdmin }, // Solo super_admin
  { id: 'permisos-usuarios', label: 'Permisos Especiales', icon: UserCheck, show: isSuperAdmin }, // Solo super_admin
  { id: 'equipos', label: 'Equipos', icon: UsersRound, show: true },
  { id: 'agencias', label: 'Agencias', icon: Building2, show: true },
  { id: 'sedes', label: 'Sedes', icon: MapPin, show: true }
].filter(tab => tab.show);
```

- [x] **Step 2: Update tab rendering to use filtered tabs**

```javascript
// Replace lines 275-363 with:
<nav 
  ref={tabsRef}
  onMouseDown={handleMouseDown}
  onMouseLeave={handleMouseLeave}
  onMouseUp={handleMouseUp}
  onMouseMove={handleMouseMove}
  className={`-mb-px flex gap-4 overflow-x-auto scrollbar-hide select-none touch-pan-x ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
  style={{ 
    scrollbarWidth: 'none', 
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: isDragging ? 'auto' : 'smooth'
  }}
>
  {visibleTabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
        activeTab === tab.id
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <tab.icon className="w-4 h-4" />
      {tab.label}
    </button>
  ))}
</nav>
```

- [x] **Step 3: Add backend validation for permission tabs**

**Files:**
- Modify: `src/routes/permissions.js:1-10`

```javascript
// Add at the top of the file
const { requireSuperAdmin } = require('../middleware/auth');

// Apply to all permission routes
router.use(requireSuperAdmin);
```

- [x] **Step 4: Create super admin middleware**

**Files:**
- Create: `src/middleware/auth.js`

```javascript
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado: Se requiere rol de super_admin' 
    });
  }
  next();
};

module.exports = { requireSuperAdmin };
```

- [x] **Step 5: Test tab visibility**

Run: `npm run dev` and login as admin user
Expected: Only visible tabs are Usuarios, Roles, Equipos, Agencias, Sedes
Run: `npm run dev` and login as super_admin user  
Expected: All tabs are visible

- [x] **Step 6: Commit**

```bash
git add dashboard/src/app/(crm)/configuracion/usuarios/page.js src/middleware/auth.js src/routes/permissions.js
git commit -m "feat: restrict tab visibility based on user role"
```

---

## FASE 2: Filtrado Jerárquico de Usuarios (CRÍTICO) - ✅ COMPLETADA

### Task 2: Backend Hierarchical User Filtering

**Files:**
- Modify: `src/services/usersService.js`

- [x] **Step 1: Add ranking filter method**

```javascript
// Add at the end of the file
async getUsersFilteredByRanking(currentUserId, currentRanking) {
  const query = this.db('profiles')
    .select(
      'profiles.*',
      'roles.name as role_name',
      'roles.ranking as role_ranking'
    )
    .leftJoin('roles', 'profiles.role_id', 'roles.id')
    .where('profiles.is_active', true);

  // Super admin sees everyone
  if (currentRanking === 'super_admin') {
    return await query;
  }

  // Admin sees users with lower ranking (asesores, gerentes)
  if (currentRanking === 'admin') {
    return await query.where('roles.ranking', '<', 'admin');
  }

  // Other roles shouldn't access this endpoint
  return [];
}
```

- [x] **Step 2: Update users route to use filtering**

**Files:**
- Modify: `src/routes/users.js:15-25`

```javascript
// Replace existing GET /api/users route
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get current user's ranking
    const currentUser = await usersService.getUserById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const users = await usersService.getUsersFilteredByRanking(
      userId, 
      currentUser.role?.name
    );

    res.json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [x] **Step 3: Add helper to get user ranking**

**Files:**
- Modify: `src/services/usersService.js`

```javascript
// Add this method
async getUserRanking(userId) {
  const user = await this.db('profiles')
    .select('roles.ranking')
    .leftJoin('roles', 'profiles.role_id', 'roles.id')
    .where('profiles.id', userId)
    .first();
  
  return user?.ranking || null;
}
```

- [x] **Step 4: Test hierarchical filtering**

Run: `npm test` (if tests exist) or manual test:
Expected: Admin users don't see other admins or super_admin in list
Expected: Super_admin sees all users

- [x] **Step 5: Commit**

```bash
git add src/services/usersService.js src/routes/users.js
git commit -m "feat: implement hierarchical user filtering"
```

### Task 3: Frontend User List Improvements

**Files:**
- Modify: `dashboard/src/components/users/UserList.jsx:15-25`

- [x] **Step 1: Add empty state message for filtered users**

```javascript
// Replace the existing empty state (lines 15-25)
if (!users || users.length === 0) {
  return (
    <div className="p-12 text-center">
      <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg">No hay usuarios visibles</p>
      <p className="text-gray-400 text-sm mt-2">
        Según tu rol, solo puedes ver usuarios de nivel inferior
      </p>
    </div>
  );
}
```

- [x] **Step 2: Test empty state**

Run: `npm run dev` and login as admin
Expected: See "No hay usuarios visibles" message if no lower-ranking users exist

- [x] **Step 3: Commit**

```bash
git add dashboard/src/components/users/UserList.jsx
git commit -m "feat: improve empty state for hierarchical user filtering"
```

---

## FASE 3: Validación Jerárquica en Edición/Eliminación de Usuarios (CRÍTICO) - ✅ COMPLETADA

### Task 4: Backend Edit/Delete Validation

**Files:**
- Modify: `src/routes/users.js:40-80`

- [x] **Step 1: Add helper function for hierarchical validation**

```javascript
// Add at the top of the file
async function canEditUser(currentUserId, targetUserId) {
  const currentUser = await usersService.getUserById(currentUserId);
  const targetUser = await usersService.getUserById(targetUserId);
  
  if (!currentUser || !targetUser) {
    return false;
  }

  // Super admin can edit everyone
  if (currentUser.role?.name === 'super_admin') {
    return true;
  }

  // Admin cannot edit other admins or super_admin
  if (currentUser.role?.name === 'admin') {
    const targetRanking = targetUser.role?.ranking || 0;
    const currentRanking = currentUser.role?.ranking || 0;
    return targetRanking < currentRanking;
  }

  return false;
}
```

- [x] **Step 2: Update PUT route with validation**

```javascript
// Replace existing PUT /api/users/:id route
router.put('/:id', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const targetUserId = req.params.id;

    if (!await canEditUser(currentUserId, targetUserId)) {
      return res.status(403).json({ 
        error: 'No puedes editar usuarios de igual o superior nivel' 
      });
    }

    // ... rest of existing PUT logic
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [x] **Step 3: Update DELETE route with validation**

```javascript
// Replace existing DELETE /api/users/:id route  
router.delete('/:id', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const targetUserId = req.params.id;

    if (!await canEditUser(currentUserId, targetUserId)) {
      return res.status(403).json({ 
        error: 'No puedes eliminar usuarios de igual o superior nivel' 
      });
    }

    // ... rest of existing DELETE logic
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [x] **Step 4: Test edit/delete validation**

Run: `npm run dev` and login as admin
Expected: Cannot edit/delete other admin users
Expected: Can edit/delete lower-ranking users

- [x] **Step 5: Commit**

```bash
git add src/routes/users.js
git commit -m "feat: add hierarchical validation for user edit/delete"
```

### Task 5: Frontend Edit/Delete Button Restrictions

**Files:**
- Modify: `dashboard/src/components/users/UserList.jsx:65-71, 140-148`

- [x] **Step 1: Add prop for current user role**

```javascript
// Update component signature (line 5)
export default function UserList({ users, roles, onEdit, onToggleStatus, loading, currentUserRole }) {
```

- [x] **Step 2: Add helper to check if can edit user**

```javascript
// Add after getRoleBadgeColor function (line 45)
const canEditUser = (user) => {
  if (!currentUserRole) return false;
  
  // Super admin can edit everyone
  if (currentUserRole === 'super_admin') return true;
  
  // Admin cannot edit other admins or super_admin
  if (currentUserRole === 'admin') {
    const userRanking = user.role?.ranking || 0;
    const currentRanking = roles.find(r => r.name === currentUserRole)?.ranking || 0;
    return userRanking < currentRanking;
  }
  
  return false;
};
```

- [x] **Step 3: Update edit button in mobile view**

```javascript
// Replace edit button (lines 65-71)
{canEditUser(user) && (
  <button
    onClick={() => onEdit(user)}
    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    title="Editar"
  >
    <Edit2 className="h-4 w-4" />
  </button>
)}
```

- [x] **Step 4: Update edit button in desktop view**

```javascript
// Replace edit button (lines 154-156)
{canEditUser(user) && (
  <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-all">
    <Edit2 className="h-4 w-4" />
  </button>
)}
```

- [x] **Step 5: Update parent component to pass current user role**

**Files:**
- Modify: `dashboard/src/app/(crm)/configuracion/usuarios/page.js:380-386`

```javascript
<UserList
  users={users}
  roles={roles}
  onEdit={handleEditUser}
  onToggleStatus={handleToggleStatus}
  loading={loadingData}
  currentUserRole={profile?.role?.name}
/>
```

- [x] **Step 6: Test button visibility**

Run: `npm run dev` and login as admin
Expected: Edit buttons hidden for other admin users
Expected: Edit buttons visible for lower-ranking users

- [x] **Step 7: Commit**

```bash
git add dashboard/src/components/users/UserList.jsx dashboard/src/app/(crm)/configuracion/usuarios/page.js
git commit -m "feat: hide edit buttons for users of equal/higher ranking"
```

---

## FASE 4: Validación Jerárquica en Roles (CRÍTICO) - ✅ COMPLETADA

### Task 6: Backend Role Hierarchy Validation

**Files:**
- Modify: `src/services/rolesService.js`

- [x] **Step 1: Add method to filter roles by user ranking**

```javascript
// Add at the end of the file
async getRolesFilteredByRanking(currentUserId, currentRanking) {
  const query = this.db('roles').where('is_active', true);

  // Super admin sees all roles
  if (currentRanking === 'super_admin') {
    return await query;
  }

  // Admin sees roles with lower ranking
  if (currentRanking === 'admin') {
    return await query.where('ranking', '<', 'admin');
  }

  return [];
}

async canManageRole(currentUserId, targetRoleRanking) {
  const currentUser = await usersService.getUserById(currentUserId);
  if (!currentUser) return false;

  // Super admin can manage all roles
  if (currentUser.role?.name === 'super_admin') {
    return true;
  }

  // Admin cannot manage roles of equal or higher ranking
  if (currentUser.role?.name === 'admin') {
    const currentRanking = currentUser.role?.ranking || 0;
    return targetRoleRanking < currentRanking;
  }

  return false;
}
```

- [x] **Step 2: Update roles route to use filtering**

**Files:**
- Modify: `src/routes/roles.js:10-20`

```javascript
// Replace existing GET /api/users/roles route
router.get('/roles', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const currentUser = await usersService.getUserById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roles = await rolesService.getRolesFilteredByRanking(
      userId, 
      currentUser.role?.name
    );

    res.json({ data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [x] **Step 3: Add validation to role creation**

**Files:**
- Modify: `src/routes/roles.js:25-35`

```javascript
// Add validation in POST /api/roles route
router.post('/', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const { ranking } = req.body;

    if (!await rolesService.canManageRole(currentUserId, ranking)) {
      return res.status(403).json({ 
        error: 'No puedes crear roles con ranking igual o superior al tuyo' 
      });
    }

    // ... rest of creation logic
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [x] **Step 4: Test role filtering**

Run: `npm run dev` and login as admin
Expected: Don't see super_admin role in roles list
Expected: Can only create roles with ranking lower than admin

- [x] **Step 5: Commit**

```bash
git add src/services/rolesService.js src/routes/roles.js
git commit -m "feat: implement hierarchical role management"
```

---

## FASE 5: Protección de Permisos Esenciales (CRÍTICO) - ✅ COMPLETADA

### Task 7: Database Migration for System Permissions

**Files:**
- Create: `docs/05-base-de-datos/migrations/add_permissions_system_protection.sql`

- [x] **Step 1: Create migration file**

```sql
-- Add system protection flag to permissions
ALTER TABLE permissions ADD COLUMN is_system BOOLEAN DEFAULT false;

-- Mark essential permissions as system permissions
UPDATE permissions SET is_system = true WHERE name IN (
  'usuarios.ver',
  'usuarios.editar', 
  'usuarios.eliminar',
  'usuarios.crear',
  'roles.ver',
  'roles.editar',
  'roles.eliminar',
  'roles.crear',
  'permisos.ver',
  'permisos.editar',
  'permisos.eliminar',
  'permisos.crear',
  'equipos.ver',
  'equipos.editar',
  'equipos.eliminar',
  'equipos.crear',
  'agencias.ver',
  'agencias.editar',
  'agencias.eliminar',
  'agencias.crear',
  'sedes.ver',
  'sedes.editar',
  'sedes.eliminar',
  'sedes.crear'
);

-- Add index for performance
CREATE INDEX idx_permissions_is_system ON permissions(is_system);
```

- [x] **Step 2: Run migration**

Run: `psql -d your_database -f docs/05-base-de-datos/migrations/add_permissions_system_protection.sql`
Expected: Migration completes successfully

- [x] **Step 3: Commit**

```bash
git add docs/05-base-de-datos/migrations/add_permissions_system_protection.sql
git commit -m "feat: add system protection flag to essential permissions"
```

### Task 8: Backend Permission Protection

**Files:**
- Modify: `src/services/permissionsService.js`

- [x] **Step 1: Add validation for system permissions**

```javascript
// Add at the end of the file
async canDeletePermission(permissionId) {
  const permission = await this.db('permissions')
    .where('id', permissionId)
    .first();
  
  if (!permission) {
    return false;
  }

  // Cannot delete system permissions
  if (permission.is_system) {
    return false;
  }

  return true;
}
```

- [x] **Step 2: Update delete route with validation**

**Files:**
- Modify: `src/routes/permissions.js:50-65`

```javascript
// Replace existing DELETE route
router.delete('/:id', async (req, res) => {
  try {
    const permissionId = req.params.id;

    if (!await permissionsService.canDeletePermission(permissionId)) {
      return res.status(403).json({ 
        error: 'No puedes eliminar permisos esenciales del sistema' 
      });
    }

    const { error } = await permissionsService.deletePermission(permissionId);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ error: 'Error al eliminar permiso' });
  }
});
```

- [x] **Step 3: Test permission protection**

Run: `npm run dev` and login as super_admin
Expected: Cannot delete essential permissions
Expected: Can delete non-system permissions

- [x] **Step 4: Commit**

```bash
git add src/services/permissionsService.js src/routes/permissions.js
git commit -m "feat: protect essential system permissions from deletion"
```

### Task 9: Frontend Permission Protection UI

**Files:**
- Modify: `dashboard/src/components/permissions/PermissionsManager.jsx:99-118`

- [x] **Step 1: Add system permission indicator**

```javascript
// Update getCategoryBadgeColor function (after line 151)
const getSystemBadge = (permission) => {
  if (permission.is_system) {
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
        Sistema
      </span>
    );
  }
  return null;
};
```

- [x] **Step 2: Update permission display to show system badge**

```javascript
// Update permission display in table (around line 276)
<td className="px-6 py-4 text-sm font-mono text-slate-800">
  {permission.name}
  {getSystemBadge(permission)}
</td>
```

- [x] **Step 3: Disable delete button for system permissions**

```javascript
// Update delete button (lines 296-302)
{!permission.is_system && (
  <button
    onClick={() => handleDelete(permission.id, permission.name)}
    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    title="Eliminar"
  >
    <Trash2 className="w-4 h-4" />
  </button>
)}
```

- [x] **Step 4: Test UI protection**

Run: `npm run dev` and login as super_admin
Expected: System permissions show "Sistema" badge
Expected: Delete button hidden for system permissions

- [x] **Step 5: Commit**

```bash
git add dashboard/src/components/permissions/PermissionsManager.jsx
git commit -m "feat: add UI protection for system permissions"
```

---

## FASE 6: Restricciones en Equipos (IMPORTANTE)

### Task 10: Backend Team Management Restrictions

**Files:**
- Modify: `src/services/equiposService.js`

- [ ] **Step 1: Add method to check if user can manage team**

```javascript
// Add at the end of the file
async canManageTeam(currentUserId, teamId) {
  const currentUser = await usersService.getUserById(currentUserId);
  if (!currentUser) return false;

  // Super admin and admin can manage all teams
  if (['super_admin', 'admin'].includes(currentUser.role?.name)) {
    return true;
  }

  // Gerente can only manage their own team
  if (currentUser.role?.name === 'gerente') {
    const team = await this.db('equipos')
      .where('id', teamId)
      .where('gerente_id', currentUserId)
      .first();
    return !!team;
  }

  return false;
}

async getTeamsFilteredByUser(currentUserId) {
  const currentUser = await usersService.getUserById(currentUserId);
  if (!currentUser) return [];

  let query = this.db('equipos')
    .select(
      'equipos.*',
      'gerente.full_name as gerente_nombre',
      'gerente.email as gerente_email'
    )
    .leftJoin('profiles as gerente', 'equipos.gerente_id', 'gerente.id')
    .where('equipos.is_active', true);

  // Super admin and admin see all teams
  if (['super_admin', 'admin'].includes(currentUser.role?.name)) {
    return await query;
  }

  // Gerente sees only their team
  if (currentUser.role?.name === 'gerente') {
    return await query.where('equipos.gerente_id', currentUserId);
  }

  return [];
}
```

- [ ] **Step 2: Update teams route to use filtering**

**Files:**
- Modify: `src/routes/equipos.js:10-20`

```javascript
// Replace existing GET route
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    if (!currentUserId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const teams = await equiposService.getTeamsFilteredByUser(currentUserId);
    res.json({ data: teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 3: Add validation to team operations**

**Files:**
- Modify: `src/routes/equipos.js:25-50`

```javascript
// Add validation to PUT route
router.put('/:id', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const teamId = req.params.id;

    if (!await equiposService.canManageTeam(currentUserId, teamId)) {
      return res.status(403).json({ 
        error: 'No puedes editar este equipo' 
      });
    }

    // ... rest of update logic
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add validation to DELETE route
router.delete('/:id', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const teamId = req.params.id;

    if (!await equiposService.canManageTeam(currentUserId, teamId)) {
      return res.status(403).json({ 
        error: 'No puedes eliminar este equipo' 
      });
    }

    // ... rest of delete logic
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 4: Test team restrictions**

Run: `npm run dev` and login as gerente
Expected: See only own team
Expected: Cannot edit/delete other teams

- [x] **Step 5: Commit**

```bash
git add src/services/equiposService.js src/routes/equipos.js
git commit -m "feat: implement role-based team management restrictions"
```

### Task 11: Frontend Team Restrictions

**Files:**
- Modify: `dashboard/src/components/users/EquiposTab.jsx:25-48`

- [ ] **Step 1: Update data loading to use current user context**

```javascript
// Update loadData function (lines 25-48)
const loadData = async () => {
  setLoading(true)
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const headers = {
      "Content-Type": "application/json",
    };
    
    // Add current user ID for filtering
    if (user?.id) {
      headers["x-user-id"] = user.id;
    }

    const [equiposRes, sinEquipoRes] = await Promise.all([
      fetch(EQUIPOS_API.listar, { headers }),
      fetch(EQUIPOS_API.sinEquipo, { headers })
    ])
    
    if (equiposRes.ok) {
      const d = await equiposRes.json()
      setEquipos(d.data || [])
      const expanded = {}
      ;(d.data || []).forEach(e => { expanded[e.id] = true })
      setExpandedEquipos(expanded)
    }
    if (sinEquipoRes.ok) {
      const d = await sinEquipoRes.json()
      setSinEquipo(d.data || [])
    }
  } catch (err) {
    console.error('Error cargando equipos:', err)
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: Add user prop to component**

```javascript
// Update component signature (line 6)
export default function EquiposTab({ allUsers = [], roles = [], onDataChange, user }) {
```

- [ ] **Step 3: Update parent component to pass user**

**Files:**
- Modify: `dashboard/src/app/(crm)/configuracion/usuarios/page.js:398`

```javascript
{activeTab === 'equipos' && <EquiposTab allUsers={users} roles={roles} onDataChange={loadData} user={user} />}
```

- [ ] **Step 4: Test team filtering**

Run: `npm run dev` and login as gerente
Expected: Only see own team in interface

- [x] **Step 5: Commit**

```bash
git add dashboard/src/components/users/EquiposTab.jsx dashboard/src/app/(crm)/configuracion/usuarios/page.js
git commit -m "feat: implement frontend team filtering by user role"
```

---

## FASE 7: Mejoras UX - Reemplazar Alerts/Confirms (MEJORA)

### Task 12: Replace Native Alerts and Confirms

**Files:**
- Modify: `dashboard/src/components/users/UserFormModal.jsx:95-104`

- [ ] **Step 1: Import toast and update error handling**

```javascript
// Add import at the top (line 4)
import { X, Save, Loader2, User, Mail, Lock, Shield } from "lucide-react";
import { toast } from 'react-hot-toast';

// Replace error handling (lines 95-104)
if (response.ok) {
  onSave();
} else {
  const errorData = await response.json();
  toast.error(`Error: ${errorData.error || "Error al guardar usuario"}`);
}
```

- [ ] **Step 2: Update catch block**

```javascript
// Replace catch block (lines 101-106)
} catch (error) {
  console.error("Error al guardar usuario:", error);
  toast.error("Error al guardar el usuario");
}
```

- [ ] **Step 3: Replace confirm in RolesManager**

**Files:**
- Modify: `dashboard/src/components/permissions/RolesManager.jsx:92-95`

```javascript
// Add import at the top (line 4)
import { Shield, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toastSuccess, toastError } from '@/helpers/toasts';
import Swal from 'sweetalert2';

// Replace confirm (lines 92-95)
const result = await Swal.fire({
  title: '¿Estás seguro de eliminar el rol?',
  text: `Esta acción no se puede deshacer.`,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#ef4444',
  cancelButtonColor: '#6b7280',
  confirmButtonText: 'Sí, eliminar',
  cancelButtonText: 'Cancelar'
});

if (!result.isConfirmed) {
  return;
}
```

- [ ] **Step 4: Replace confirm in PermissionsManager**

**Files:**
- Modify: `dashboard/src/components/permissions/PermissionsManager.jsx:99-102`

```javascript
// Replace confirm (lines 99-102)
const result = await Swal.fire({
  title: '¿Estás seguro de eliminar el permiso?',
  text: `Esta acción no se puede deshacer.`,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#ef4444',
  cancelButtonColor: '#6b7280',
  confirmButtonText: 'Sí, eliminar',
  cancelButtonText: 'Cancelar'
});

if (!result.isConfirmed) {
  return;
}
```

- [ ] **Step 5: Replace prompt in UserPermissionsManager**

**Files:**
- Modify: `dashboard/src/components/permissions/UserPermissionsManager.jsx:82-91`

```javascript
// Replace prompt with Swal (lines 82-91)
const { value: reason } = await Swal.fire({
  title: granted ? 'Otorgar Permiso Especial' : 'Revocar Permiso',
  input: 'text',
  inputLabel: granted ? '¿Por qué se otorga este permiso especial?' : '¿Por qué se revoca este permiso?',
  inputPlaceholder: 'Escribe el motivo...',
  inputAttributes: {
    'aria-label': 'Escribe el motivo'
  },
  showCancelButton: true,
  confirmButtonText: granted ? 'Otorgar' : 'Revocar',
  cancelButtonText: 'Cancelar'
});

if (!reason) {
  return;
}
```

- [ ] **Step 6: Test all replacements**

Run: `npm run dev`
Expected: All confirmations use Swal modals
Expected: All errors use toast notifications

- [x] **Step 7: Commit**

```bash
git add dashboard/src/components/users/UserFormModal.jsx dashboard/src/components/permissions/RolesManager.jsx dashboard/src/components/permissions/PermissionsManager.jsx dashboard/src/components/permissions/UserPermissionsManager.jsx
git commit -m "feat: replace native alerts/confirms with Swal and toast"
```

---

## FASE 8: Helper Compartido de Colores (MEJORA)

### Task 13: Create Shared Color Utilities

**Files:**
- Create: `dashboard/src/lib/colors.js`

- [ ] **Step 1: Create color utilities file**

```javascript
// Role badge colors
export const getRoleBadgeColor = (roleName) => {
  const colors = {
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    gerente: "bg-blue-100 text-blue-800 border-blue-200",
    asesor: "bg-green-100 text-green-800 border-green-200",
    manager: "bg-blue-100 text-blue-800 border-blue-200",
    advisor: "bg-green-100 text-green-800 border-green-200",
    super_admin: "bg-red-100 text-red-800 border-red-200"
  };
  return colors[roleName?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
};

// Permission category colors
export const getCategoryBadgeColor = (category) => {
  const colors = {
    tasas: 'bg-blue-100 text-blue-700',
    monedas: 'bg-green-100 text-green-700',
    usuarios: 'bg-purple-100 text-purple-700',
    equipos: 'bg-orange-100 text-orange-700',
    cotizaciones: 'bg-pink-100 text-pink-700',
    vuelos: 'bg-indigo-100 text-indigo-700',
    analisis: 'bg-yellow-100 text-yellow-700'
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
};

// System permission badge
export const getSystemBadge = (permission) => {
  if (permission.is_system) {
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
        Sistema
      </span>
    );
  }
  return null;
};
```

- [ ] **Step 2: Update UserList to use shared colors**

**Files:**
- Modify: `dashboard/src/components/users/UserList.jsx:1-5`

```javascript
// Add import
import { Mail, Edit2, Shield, CheckCircle, XCircle, User } from "lucide-react";
import { getRoleBadgeColor } from "@/lib/colors";

// Remove local getRoleBadgeColor function (lines 36-45)
```

- [ ] **Step 3: Update permission managers to use shared colors**

**Files:**
- Modify: `dashboard/src/components/permissions/PermissionsManager.jsx:1-5`

```javascript
// Add import
import { Key, Plus, Edit2, Trash2, Save, X, Filter } from 'lucide-react';
import { toastSuccess, toastError } from '@/helpers/toasts';
import { getCategoryBadgeColor, getSystemBadge } from "@/lib/colors";

// Remove local getCategoryBadgeColor function (lines 140-151)
// Remove local getSystemBadge function
```

- [ ] **Step 4: Update other permission managers**

**Files:**
- Modify: `dashboard/src/components/permissions/RolePermissionsManager.jsx:1-5`
- Modify: `dashboard/src/components/permissions/UserPermissionsManager.jsx:1-5`

```javascript
// Add imports to both files
import { getCategoryBadgeColor } from "@/lib/colors";

// Remove local getCategoryBadgeColor functions
```

- [ ] **Step 5: Test shared colors**

Run: `npm run dev`
Expected: All components use consistent colors
Expected: No duplicate color functions

- [x] **Step 6: Commit**

```bash
git add dashboard/src/lib/colors.js dashboard/src/components/users/UserList.jsx dashboard/src/components/permissions/PermissionsManager.jsx dashboard/src/components/permissions/RolePermissionsManager.jsx dashboard/src/components/permissions/UserPermissionsManager.jsx
git commit -m "feat: create shared color utilities to reduce duplication"
```

---

## TESTING STRATEGY

### Manual Testing Checklist

1. **Tab Visibility Tests:**
   - [ ] Admin user sees only 5 tabs (no permission tabs)
   - [ ] Super_admin sees all 8 tabs
   - [ ] Non-admin users cannot access the page

2. **User Hierarchy Tests:**
   - [ ] Admin cannot see other admins in user list
   - [ ] Admin cannot see super_admin in user list
   - [ ] Super_admin sees all users
   - [ ] Admin cannot edit/delete other admins
   - [ ] Admin can edit/delete lower-ranking users

3. **Role Hierarchy Tests:**
   - [ ] Admin cannot see super_admin role
   - [ ] Admin cannot create roles with admin or super_admin ranking
   - [ ] Super_admin can manage all roles

4. **Permission Protection Tests:**
   - [ ] System permissions show "Sistema" badge
   - [ ] Delete button hidden for system permissions
   - [ ] Backend rejects deletion of system permissions

5. **Team Management Tests:**
   - [ ] Gerente sees only their own team
   - [ ] Gerente cannot edit other teams
   - [ ] Admin sees all teams
   - [ ] Admin can edit all teams

6. **UX Improvements Tests:**
   - [ ] All confirmations use Swal modals
   - [ ] All errors use toast notifications
   - [ ] No native alerts or confirms

### Automated Testing (Future)

- Unit tests for service layer validation functions
- Integration tests for API endpoint security
- Frontend component tests for role-based UI rendering

---

## DEPLOYMENT CONSIDERATIONS

1. **Database Migration:** Run migration before deploying backend changes
2. **Feature Flags:** Consider using feature flags for gradual rollout
3. **Backwards Compatibility:** Ensure existing admin users still function
4. **Performance:** Test hierarchical filtering with large user bases
5. **Monitoring:** Add logging for security violations (403 errors)

---

## ROLLBACK PLAN

If issues arise:
1. **Database:** Rollback migration using `ALTER TABLE permissions DROP COLUMN is_system;`
2. **Backend:** Revert to previous commit before security changes
3. **Frontend:** Revert to previous commit before UI restrictions
4. **User Impact:** Document which features will be unavailable during rollback

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-16-usuarios-security-hierarchy.md`.**

**Execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you prefer?
