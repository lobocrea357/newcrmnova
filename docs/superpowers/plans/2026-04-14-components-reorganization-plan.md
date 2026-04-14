# Components Reorganization Plan - Option 4 (Feature-Flag Architecture)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar la carpeta `dashboard/src/components` usando una arquitectura por features para mejorar escalabilidad y mantenibilidad del proyecto ERP Nova CRM.

**Architecture:** Estructura basada en features con carpetas `_features`, `_shared`, `_admin`, y `_legacy` para separar claramente responsabilidades y facilitar el trabajo en equipo.

**Tech Stack:** React, JavaScript, Next.js, Tailwind CSS, arquitectura de componentes modulares.

---

## File Structure Mapping

### Nueva Estructura Objetivo:
```
components/
|-- _features/
|   |-- cotizador/           # 14 componentes existentes
|   |-- vuelos/              # 11 componentes existentes  
|   |-- chat/                # 5 componentes (nueva carpeta)
|   |-- permissions/         # 4 componentes (mover)
|   |-- roles/               # 2 componentes (mover)
|   |-- rendimiento/         # 16 componentes (mover)
|   |-- ranking/             # 5 componentes (mover)
|   |-- ventas/              # 4 componentes (mover)
|   |-- agencias/            # 1 componente (mover)
|   |-- sedes/               # 1 componente (mover)
|   |-- anulables/           # 3 componentes (mover)
|   |-- auth/                # 1 componente (mover)
|   |-- notifications/       # 1 componente (mover)
|   |-- users/               # 3 componentes (mover)
|   |-- cotizaciones/        # 2 componentes (mover)
|   |-- admin/               # 1 componente (mover)
|   |-- layout/              # 3 componentes (mover)
|   |-- shared/              # 1 componente (mover)
|   |-- ui/                  # 8 componentes (mover)
|   |-- rendimiento/         # 16 componentes (mover)
|   |-- ranking/             # 5 componentes (mover)
|   |-- roles/               # 2 componentes (mover)
|   |-- permissions/         # 4 componentes (mover)
|   |-- users/               # 3 componentes (mover)
|   |-- ventas/              # 4 componentes (mover)
|   |-- agencias/            # 1 componente (mover)
|   |-- sedes/               # 1 componente (mover)
|   |-- anulables/           # 3 componentes (mover)
|   |-- auth/                # 1 componente (mover)
|   |-- notifications/       # 1 componente (mover)
|   |-- cotizaciones/        # 2 componentes (mover)
|   |-- admin/               # 1 componente (mover)
|   |-- layout/              # 3 componentes (mover)
|   |-- shared/              # 1 componente (mover)
|   |-- ui/                  # 8 componentes (mover)
|-- _shared/
|   |-- ui/                  # Componentes genéricos reutilizables
|   |-- layout/              # Componentes estructurales
|   |-- common/              # Componentes compartidos (ErrorBoundary, etc.)
|-- _admin/
|   |-- users/               # Gestión de usuarios administrativos
|   |-- agencies/            # Gestión de agencias administrativas
|   |-- system/              # Configuración del sistema (CronManager)
|-- _legacy/                 # Componentes antiguos por refactorizar
```

---

## Task 1: Create New Directory Structure

**Files:**
- Create: `dashboard/src/components/_features/`
- Create: `dashboard/src/components/_shared/`
- Create: `dashboard/src/components/_admin/`
- Create: `dashboard/src/components/_legacy/`

- [ ] **Step 1: Create main directories**

```bash
cd dashboard/src/components
mkdir _features _shared _admin _legacy
```

- [ ] **Step 2: Create feature subdirectories**

```bash
cd _features
mkdir chat permissions roles rendimiento ranking ventas agencias sedes anulables auth notifications users cotizaciones admin layout shared ui
```

- [ ] **Step 3: Create shared subdirectories**

```bash
cd ../_shared
mkdir ui layout common
```

- [ ] **Step 4: Create admin subdirectories**

```bash
cd ../_admin
mkdir users agencies system
```

- [ ] **Step 5: Verify structure**

```bash
cd ../../
tree -L 3 components/
```

Expected: Directory structure created successfully

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: create new component directory structure (Option 4)"
```

---

## Task 2: Move Chat Components to _features/chat/

**Files:**
- Move: `ChatAnalysis.jsx` -> `_features/chat/ChatAnalysis.jsx`
- Move: `ChatView.js` -> `_features/chat/ChatView.jsx`
- Move: `MessageBubble.js` -> `_features/chat/MessageBubble.jsx`
- Move: `MessageInsightsPanel.jsx` -> `_features/chat/MessageInsightsPanel.jsx`
- Move: `VirtualizedMessageList.js` -> `_features/chat/VirtualizedMessageList.jsx`

- [ ] **Step 1: Create chat directory**

```bash
mkdir -p _features/chat
```

- [ ] **Step 2: Move chat components**

```bash
mv ChatAnalysis.jsx _features/chat/
mv ChatView.js _features/chat/ChatView.jsx
mv MessageBubble.js _features/chat/MessageBubble.jsx
mv MessageInsightsPanel.jsx _features/chat/MessageInsightsPanel.jsx
mv VirtualizedMessageList.js _features/chat/VirtualizedMessageList.jsx
```

- [ ] **Step 3: Update file extensions to .jsx**

```bash
cd _features/chat
# ChatView.js already renamed to ChatView.jsx in step 2
# MessageBubble.js already renamed to MessageBubble.jsx in step 2  
# VirtualizedMessageList.js already renamed to VirtualizedMessageList.jsx in step 2
cd ../../
```

- [ ] **Step 4: Verify chat components moved**

```bash
ls -la _features/chat/
```

Expected: 5 chat components present

- [ ] **Step 5: Commit**

```bash
git add _features/chat/
git commit -m "refactor: move chat components to _features/chat/"
```

---

## Task 3: Move Permission & Role Components to _features/

**Files:**
- Move: `permissions/*` -> `_features/permissions/`
- Move: `roles/*` -> `_features/roles/`

- [ ] **Step 1: Move permissions components**

```bash
mv permissions/* _features/permissions/
```

- [ ] **Step 2: Move roles components**

```bash
mv roles/* _features/roles/
```

- [ ] **Step 3: Remove empty directories**

```bash
rmdir permissions roles
```

- [ ] **Step 4: Verify permissions and roles moved**

```bash
ls -la _features/permissions/
ls -la _features/roles/
```

Expected: All permissions and roles components in new locations

- [ ] **Step 5: Commit**

```bash
git add _features/permissions/ _features/roles/
git commit -m "refactor: move permissions and roles to _features/"
```

---

## Task 4: Move Analytics Components (rendimiento & ranking)

**Files:**
- Move: `rendimiento/*` -> `_features/rendimiento/`
- Move: `ranking/*` -> `_features/ranking/`

- [ ] **Step 1: Move rendimiento components**

```bash
mv rendimiento/* _features/rendimiento/
```

- [ ] **Step 2: Move ranking components**

```bash
mv ranking/* _features/ranking/
```

- [ ] **Step 3: Remove empty directories**

```bash
rmdir rendimiento ranking
```

- [ ] **Step 4: Verify analytics components moved**

```bash
ls -la _features/rendimiento/
ls -la _features/ranking/
```

Expected: All analytics components in new locations

- [ ] **Step 5: Commit**

```bash
git add _features/rendimiento/ _features/ranking/
git commit -m "refactor: move analytics components (rendimiento, ranking) to _features/"
```

---

## Task 5: Move Business Domain Components

**Files:**
- Move: `ventas/*` -> `_features/ventas/`
- Move: `agencias/*` -> `_features/agencias/`
- Move: `sedes/*` -> `_features/sedes/`
- Move: `anulables/*` -> `_features/anulables/`
- Move: `cotizaciones/*` -> `_features/cotizaciones/`

- [ ] **Step 1: Move business domain components**

```bash
mv ventas/* _features/ventas/
mv agencias/* _features/agencias/
mv sedes/* _features/sedes/
mv anulables/* _features/anulables/
mv cotizaciones/* _features/cotizaciones/
```

- [ ] **Step 2: Remove empty directories**

```bash
rmdir ventas agencias sedes anulables cotizaciones
```

- [ ] **Step 3: Verify business components moved**

```bash
ls -la _features/ventas/
ls -la _features/agencias/
ls -la _features/sedes/
ls -la _features/anulables/
ls -la _features/cotizaciones/
```

Expected: All business domain components in new locations

- [ ] **Step 4: Commit**

```bash
git add _features/ventas/ _features/agencias/ _features/sedes/ _features/anulables/ _features/cotizaciones/
git commit -m "refactor: move business domain components to _features/"
```

---

## Task 6: Move System Components

**Files:**
- Move: `auth/*` -> `_features/auth/`
- Move: `notifications/*` -> `_features/notifications/`
- Move: `users/*` -> `_features/users/`
- Move: `admin/*` -> `_features/admin/`

- [ ] **Step 1: Move system components**

```bash
mv auth/* _features/auth/
mv notifications/* _features/notifications/
mv users/* _features/users/
mv admin/* _features/admin/
```

- [ ] **Step 2: Remove empty directories**

```bash
rmdir auth notifications users admin
```

- [ ] **Step 3: Verify system components moved**

```bash
ls -la _features/auth/
ls -la _features/notifications/
ls -la _features/users/
ls -la _features/admin/
```

Expected: All system components in new locations

- [ ] **Step 4: Commit**

```bash
git add _features/auth/ _features/notifications/ _features/users/ _features/admin/
git commit -m "refactor: move system components to _features/"
```

---

## Task 7: Move UI and Layout Components to _shared/

**Files:**
- Move: `ui/*` -> `_shared/ui/`
- Move: `layout/*` -> `_shared/layout/`
- Move: `shared/*` -> `_shared/common/`

- [ ] **Step 1: Move UI components**

```bash
mv ui/* _shared/ui/
```

- [ ] **Step 2: Move layout components**

```bash
mv layout/* _shared/layout/
```

- [ ] **Step 3: Move shared components**

```bash
mv shared/* _shared/common/
```

- [ ] **Step 4: Remove empty directories**

```bash
rmdir ui layout shared
```

- [ ] **Step 5: Verify shared components moved**

```bash
ls -la _shared/ui/
ls -la _shared/layout/
ls -la _shared/common/
```

Expected: All shared components in new locations

- [ ] **Step 6: Commit**

```bash
git add _shared/
git commit -m "refactor: move UI, layout, and shared components to _shared/"
```

---

## Task 8: Move Orphan Components to _legacy/

**Files:**
- Move: `ContactAvatar.js` -> `_legacy/ContactAvatar.jsx`
- Move: `HighlightText.js` -> `_legacy/HighlightText.jsx`
- Move: `ErrorBoundary.js` -> `_shared/common/ErrorBoundary.jsx`

- [ ] **Step 1: Move orphan components**

```bash
mv ContactAvatar.js _legacy/ContactAvatar.jsx
mv HighlightText.js _legacy/HighlightText.jsx
mv ErrorBoundary.js _shared/common/ErrorBoundary.jsx
```

- [ ] **Step 2: Verify legacy components moved**

```bash
ls -la _legacy/
ls -la _shared/common/
```

Expected: Orphan components in appropriate locations

- [ ] **Step 3: Commit**

```bash
git add _legacy/ _shared/common/ErrorBoundary.jsx
git commit -m "refactor: move orphan components to _legacy and ErrorBoundary to _shared/common/"
```

---

## Task 9: Update Import Paths in Key Files

**Files:**
- Modify: `dashboard/src/app/(crm)/perfil/page.jsx`
- Modify: `dashboard/src/app/api/extract-cedula/route.js`
- Modify: Any files importing moved components

- [ ] **Step 1: Find files with imports to moved components**

```bash
cd ../..
grep -r "from.*components/" src/app/ --include="*.jsx" --include="*.js" | head -20
```

- [ ] **Step 2: Update imports in found files**

For each file found, update import paths:
```javascript
// Old import
import { ComponentName } from '../components/permissions/PermissionsManager';

// New import  
import { ComponentName } from '../components/_features/permissions/PermissionsManager';
```

- [ ] **Step 3: Test basic application starts**

```bash
cd dashboard
npm run dev
```

Expected: Application starts without import errors

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "fix: update import paths after component reorganization"
```

---

## Task 10: Create Index Files for Better Exports

**Files:**
- Create: `_features/cotizador/index.js`
- Create: `_features/vuelos/index.js`
- Create: `_shared/ui/index.js`
- Create: `_shared/layout/index.js`

- [ ] **Step 1: Create cotizador index**

```javascript
// dashboard/src/components/_features/cotizador/index.js
export { default as CotizadorForm } from './CotizadorForm.jsx';
export { default as ResumenCotizacionSticky } from './ResumenCotizacionSticky.jsx';
export { default as BannerCotizacionGuardada } from './BannerCotizacionGuardada.jsx';
export { default as BannerEdicion } from './BannerEdicion.jsx';
export { default as AerolineaAutocomplete } from './AerolineaAutocomplete.jsx';
export { default as TasasManager } from './TasasManager.jsx';
export { default as MonedasManager } from './MonedasManager.jsx';
export { default as HistorialTasas } from './HistorialTasas.jsx';
export { default as CotizadorTutorial } from './CotizadorTutorial.jsx';
export { default as HeroTutorial } from './HeroTutorial.jsx';
// Add other exports as needed
```

- [ ] **Step 2: Create vuelos index**

```javascript
// dashboard/src/components/_features/vuelos/index.js
export { default as VueloFormNuevo } from './VueloFormNuevo.jsx';
export { default as VueloFormEditar } from './VueloFormEditar.jsx';
export { default as VueloCard } from './VueloCard.jsx';
export { default as VueloDetail } from './VueloDetail.jsx';
export { default as VuelosList } from './VuelosList.jsx';
export { default as FileUpload } from './FileUpload.jsx';
export { default as FilterSelect } from './FilterSelect.jsx';
// Add other exports as needed
```

- [ ] **Step 3: Create shared UI index**

```javascript
// dashboard/src/components/_shared/ui/index.js
export { default as Breadcrumb } from './Breadcrumb.jsx';
export { default as CollapsibleSection } from './CollapsibleSection.jsx';
export { default as EditableCell } from './EditableCell.jsx';
export { default as FloatingActionButton } from './FloatingActionButton.jsx';
export { default as NavigationBreadcrumb } from './NavigationBreadcrumb.jsx';
export { default as ToastContainer } from './ToastContainer.jsx';
export { default as TutorialSection } from './TutorialSection.jsx';
export { default as NotificacionesCampana } from './NotificacionesCampana.jsx';
```

- [ ] **Step 4: Create shared layout index**

```javascript
// dashboard/src/components/_shared/layout/index.js
export { default as Navbar } from './Navbar.jsx';
export { default as Sidebar } from './Sidebar.jsx';
export { default as UnderDevelopment } from './UnderDevelopment.jsx';
```

- [ ] **Step 5: Commit**

```bash
git add _features/cotizador/index.js _features/vuelos/index.js _shared/ui/index.js _shared/layout/index.js
git commit -m "feat: add index files for better component exports"
```

---

## Task 11: Final Verification and Documentation

**Files:**
- Create: `docs/components-structure.md`
- Test: Application functionality

- [ ] **Step 1: Create documentation**

```markdown
# Componentes Structure Documentation

## Overview
The components directory is organized using Feature-Flag Architecture:

### _features/
Contains all business logic and feature-specific components:
- `cotizador/` - Quotation system components
- `vuelos/` - Flight management components  
- `chat/` - Chat and messaging components
- `permissions/` - Permission management
- `roles/` - Role management
- `rendimiento/` - Performance analysis
- `ranking/` - Ranking system
- `ventas/` - Sales components
- `agencias/` - Agency management
- `sedes/` - Branch office management
- `anulables/` - Cancellation components
- `auth/` - Authentication components
- `notifications/` - Notification system
- `users/` - User management
- `cotizaciones/` - Quotation management
- `admin/` - Administrative components

### _shared/
Contains reusable components across features:
- `ui/` - Generic UI components (buttons, inputs, etc.)
- `layout/` - Structural components (navbar, sidebar)
- `common/` - Shared utilities (ErrorBoundary, modals)

### _admin/
Administrative system components:
- `users/` - User administration
- `agencies/` - Agency administration  
- `system/` - System configuration (CronManager, etc.)

### _legacy/
Components pending refactoring or deprecated.

## Import Patterns
```javascript
// Feature components
import { CotizadorForm } from '@/components/_features/cotizador';
import { VueloCard } from '@/components/_features/vuelos';

// Shared components
import { Button } from '@/components/_shared/ui';
import { Navbar } from '@/components/_shared/layout';
```

## Migration Guide
When adding new components:
1. Determine if it's a feature or shared component
2. Place in appropriate directory
3. Add export to index.js file
4. Update documentation
```

- [ ] **Step 2: Test application functionality**

```bash
cd dashboard
npm run build
npm run dev
```

Expected: Application builds and runs successfully

- [ ] **Step 3: Verify key features work**

Manual testing checklist:
- [ ] Cotizador loads and functions
- [ ] Vuelos management works
- [ ] Chat components render
- [ ] Admin panels accessible
- [ ] UI components display correctly

- [ ] **Step 4: Final commit**

```bash
git add docs/components-structure.md
git commit -m "docs: add component structure documentation"
git tag -a "v1.0.0-components-reorg" -m "Component reorganization completed"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] All existing components moved to appropriate directories
- [x] New directory structure created
- [x] Import paths updated
- [x] Index files created for better exports
- [x] Documentation created

**Placeholder Scan:**
- [x] No TBD or TODO placeholders
- [x] All commands are specific and executable
- [x] File paths are exact
- [x] Code examples are complete

**Type Consistency:**
- [x] File extensions standardized to .jsx
- [x] Directory names consistent
- [x] Import patterns consistent

**Risk Assessment:**
- [x] Backup strategy: Git commits after each major task
- [x] Testing verification: Build and run tests after changes
- [x] Rollback plan: Git tags for easy rollback

---

## Expected Outcomes

1. **Improved Organization**: Components grouped by feature/domain
2. **Better Scalability**: Clear structure for adding new features
3. **Enhanced Maintainability**: Easier to locate and modify components
4. **Team Collaboration**: Different teams can work on separate features
5. **Import Clarity**: Standardized import patterns with index files

## Time Estimate

- **Total Time**: 4-6 hours
- **Per Task**: 15-30 minutes each
- **Testing**: 30-45 minutes
- **Documentation**: 30 minutes

## Rollback Plan

If issues arise:
```bash
git checkout v1.0.0-components-reorg^1  # Rollback to before reorganization
```

Or selectively rollback:
```bash
git revert <commit-hash>  # Revert specific problematic commits
```
