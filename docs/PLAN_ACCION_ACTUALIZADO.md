# Plan de Acción Actualizado - Basado en Estado Real

## 🎯 Contexto Real

El usuario ha revertido parcialmente los cambios en el Sidebar.jsx, volviendo a usar `userConfig.js`. El sistema Agencias/Sedes está intacto y listo para continuar.

---

## 📊 Estado Actual Real

### ✅ 100% Intacto y Listo:
- **Backend Agencias/Sedes:** Services, routes, endpoints
- **Frontend Components:** AgenciasManager, SedesManager
- **API Config:** AGENCIAS_API, SEDES_API
- **Base de Datos:** Migration SQL lista
- **Debug Logging:** UserProfileContext y cotizador
- **Mejoras:** Límite de comprobantes, auditoría permisos

### ⚠️ Modificado por Usuario:
- **Sidebar.jsx:** Usa userConfig.js + UserProfileContext (sistema híbrido)

---

## 🎯 Plan de Acción Inmediato

### Fase 1: Sistema Agencias/Sedes (Prioridad #1)
**Independiente del Sidebar, puede continuar inmediatamente**

#### Paso 1.1: Ejecutar Migration SQL
```bash
# En Supabase Dashboard → SQL Editor
# 1. Copiar contenido de docs/05-base-de-datos/migration_agencias_sedes.sql
# 2. Ejecutar script completo
# 3. Verificar sin errores
```

#### Paso 1.2: Integrar Components en Usuarios Page
```javascript
// En dashboard/src/app/(crm)/configuracion/usuarios/page.js

// 1. Agregar imports
import AgenciasManager from '@/components/agencias/AgenciasManager'
import SedesManager from '@/components/sedes/SedesManager'
import { Building2, MapPin } from 'lucide-react'

// 2. Agregar tabs (buscar array de tabs existente)
const tabs = [
  // ... tabs existentes
  {
    id: 'agencias',
    label: 'Agencias',
    icon: Building2,
    condition: isSuperAdmin || isAdmin
  },
  {
    id: 'sedes',
    label: 'Sedes',
    icon: MapPin,
    condition: isSuperAdmin || isAdmin
  }
]

// 3. Agregar renderizado condicional
{activeTab === 'agencias' && <AgenciasManager />}
{activeTab === 'sedes' && <SedesManager />}
```

#### Paso 1.3: Testing Sistema Agencias/Sedes
```bash
# Backend testing
curl http://localhost:4000/api/agencias
curl http://localhost:4000/api/sedes

# Frontend testing
# 1. Login como admin/super_admin
# 2. Navegar a /configuracion/usuarios
# 3. Verificar tabs "Agencias" y "Sedes"
# 4. Probar CRUD operations
```

### Fase 2: Diagnóstico Cotizador (Prioridad #2)

#### Paso 2.1: Recopilar Logs
```bash
# 1. Login como usuario problema (ej: Valeria Reinozo)
# 2. Navegar a /cotizador
# 3. Abrir DevTools → Console
# 4. Buscar logs:
#    🔐 [UserProfileContext] Perfil cargado:
#    📊 [Cotizador] Evaluación de tabs:
```

#### Paso 2.2: Analizar Datos
**Qué buscar en los logs:**
```javascript
// UserProfileContext logs
{
  email: "valeria@email.com",
  role: "asesor",
  rolePermissions: [...],
  userPermissions: [...],
  allPermissions: [...]
}

// Cotizador logs  
{
  hasTasasPermission: false,
  hasMonedasPermission: false,
  canManageTasas: false,
  canManageMonedas: false
}
```

#### Paso 2.3: Identificar Problema
- **Si allPermissions está vacío:** Problema en carga desde BD
- **Si hasPermission es false:** Problema en lógica de evaluación
- **Si canManage es false:** Problema en lógica de OR

---

### Fase 3: Decisión de Sidebar (Opcional)

#### Opción A: Mantener Sistema Híbrido (Actual)
**Ventajas:**
- Ya funciona, no requiere cambios
- userConfig.js probado y estable

**Desventajas:**
- Doble sistema de permisos
- Mantenimiento más complejo

**Acciones requeridas:**
- Documentar sistema híbrido
- Mantener sincronización userConfig.js ↔ BD

#### Opción B: Restaurar Sistema Unificado (Plan Original)
**Ventajas:**
- Un solo sistema de verdad
- Más escalable y mantenible

**Desventajas:**
- Requiere revertir cambios del usuario
- Más trabajo inicial

**Acciones requeridas:**
```javascript
// Revertir Sidebar.jsx a ROUTES_BY_ROLE
// Eliminar import de userConfig.js
// Restaurar sistema de filtrado por rol
```

---

## 📋 Checklist Actualizado

### ✅ Inmediato (Hoy):
- [ ] Ejecutar migration SQL en Supabase
- [ ] Integrar AgenciasManager en usuarios page
- [ ] Integrar SedesManager en usuarios page
- [ ] Probar CRUD de agencias y sedes
- [ ] Recopilar logs del cotizador
- [ ] Analizar problema de tabs

### ⏳ Corto Plazo (Mañana):
- [ ] Tomar decisión sobre sistema de Sidebar
- [ ] Documentar arquitectura final
- [ ] Actualizar documentación
- [ ] Testing completo con diferentes roles

### 📈 Mediano Plazo:
- [ ] Optimizar rendimiento del sistema híbrido (si se mantiene)
- [ ] Capacitar equipo sobre nuevo sistema de permisos
- [ ] Monitorear errores y problemas

---

## 🎯 Success Criteria

### Sistema Agencias/Sedes:
- [ ] Migration ejecutada sin errores
- [ ] Tabs visibles solo para admin/super_admin
- [ ] CRUD funciona correctamente
- [ ] Asignación de usuarios funciona

### Problema Cotizador:
- [ ] Logs muestran datos correctos
- [ ] Causa raíz identificada
- [ ] Solución implementada
- [ ] Tabs ocultos para no autorizados

### Sistema General:
- [ ] No hay errores en backend
- [ ] No hay errores en frontend
- [ ] Documentación actualizada
- [ ] Sistema funciona como esperado

---

## 🔧 Herramientas y Comandos

### Base de Datos:
```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('agencias', 'sedes', 'usuario_agencias');

-- Verificar datos iniciales
SELECT * FROM agencias WHERE is_active = true;
SELECT * FROM sedes WHERE is_active = true;
```

### Backend:
```bash
# Verificar endpoints
curl http://localhost:4000/health
curl http://localhost:4000/api/agencias
curl http://localhost:4000/api/sedes
```

### Frontend:
```bash
# Verificar imports en usuarios page
grep -n "AgenciasManager\|SedesManager" dashboard/src/app/(crm)/configuracion/usuarios/page.js

# Verificar errores en console
# Navegar a /configuracion/usuarios y revisar DevTools
```

---

## 📞 Soporte y Troubleshooting

### Si Agencias/Sedes no funciona:
1. **Verificar migration** en Supabase
2. **Revisar backend logs** (consola servidor)
3. **Verificar API endpoints** con curl
4. **Revisar frontend console** errors

### Si Cotizador sigue con problema:
1. **Revisar logs** 🔐 y 📊 en console
2. **Verificar permisos** en BD directamente
3. **Probar con super_admin** (debe funcionar)
4. **Verificar timing** de carga vs evaluación

### Si Sidebar tiene problemas:
1. **Verificar userConfig.js** tenga datos correctos
2. **Revisar UserProfileContext** esté cargando
3. **Verificar sincronización** entre sistemas
4. **Probar con diferentes roles**

---

## 🚀 Timeline Estimado

- **Fase 1 (Agencias/Sedes):** 2 horas
- **Fase 2 (Cotizador):** 1 hora
- **Fase 3 (Sidebar):** 30 minutos (opcional)
- **Total:** 3.5 horas

**Prioridad:** Fase 1 y 2 son críticas y deben completarse primero.
