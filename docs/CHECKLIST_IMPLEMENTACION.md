# Checklist de Implementación - Sistema de Agencias y Sedes

## 🎯 Objetivo
Proporcionar un checklist detallado para completar la implementación del sistema de agencias y sedes, y resolver los problemas de permisos existentes.

---

## 📋 Checklist Principal

### ✅ Fase 1: Preparación - COMPLETADA
- [x] **Debug logging agregado** a UserProfileContext y cotizador
- [x] **Sidebar refactorizado** para eliminar userConfig.js
- [x] **Límite de comprobantes** aumentado de 5 a 10
- [x] **Auditoría de permisos** completada con correcciones
- [x] **Backend services** creados (agenciasService.js, sedesService.js)
- [x] **Backend routes** creados (agencias.js, sedes.js)
- [x] **Frontend components** creados (AgenciasManager.jsx, SedesManager.jsx)
- [x] **API config** actualizado con AGENCIAS_API y SEDES_API
- [x] **Routes registrados** en index.js del backend
- [x] **SQL migration** creada y documentada

---

### ⏳ Fase 2: Base de Datos - PENDIENTE

#### 2.1 Ejecutar Migration SQL
- [ ] **Ir a Supabase Dashboard** → SQL Editor
- [ ] **Copiar contenido** de `docs/05-base-de-datos/migration_agencias_sedes.sql`
- [ ] **Ejecutar script** completo
- [ ] **Verificar creación** de tablas:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('agencias', 'sedes', 'usuario_agencias');
  ```
- [ ] **Verificar columnas** en profiles:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'sede_id';
  ```
- [ ] **Verificar datos iniciales**:
  ```sql
  SELECT * FROM agencias WHERE is_active = true;
  SELECT * FROM sedes WHERE is_active = true;
  ```

#### 2.2 Verificar RLS
- [ ] **Probar acceso público** (debe fallar):
  ```sql
  -- Sin autenticación, esto debe fallar
  SELECT * FROM agencias;
  ```
- [ ] **Probar acceso con service_role** (debe funcionar):
  ```sql
  -- Con service_role key, esto debe funcionar
  SET LOCAL role = service_role;
  SELECT * FROM agencias;
  ```

---

### ⏳ Fase 3: Integración Frontend - PENDIENTE

#### 3.1 Modificar Página de Usuarios
- [ ] **Abrir archivo** `dashboard/src/app/(crm)/configuracion/usuarios/page.js`
- [ ] **Agregar imports** al inicio:
  ```javascript
  import AgenciasManager from '@/components/agencias/AgenciasManager'
  import SedesManager from '@/components/sedes/SedesManager'
  import { Building2, MapPin } from 'lucide-react'
  ```
- [ ] **Localizar sistema de tabs** (usualmente después de línea 50)
- [ ] **Agregar tabs a la lista**:
  ```javascript
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
  ```
- [ ] **Agregar renderizado condicional**:
  ```javascript
  {activeTab === 'agencias' && <AgenciasManager />}
  {activeTab === 'sedes' && <SedesManager />}
  ```

#### 3.2 Verificar Integración
- [ ] **Iniciar servidor** de desarrollo
- [ ] **Login como admin** o super_admin
- [ ] **Navegar a** `/configuracion/usuarios`
- [ ] **Verificar tabs** "Agencias" y "Sedes" visibles
- [ ] **Probar navegación** entre tabs

---

### ⏳ Fase 4: Testing - PENDIENTE

#### 4.1 Backend Testing
- [ ] **Iniciar backend** (npm start en carpeta src)
- [ ] **Probar GET agencias**:
  ```bash
  curl http://localhost:4000/api/agencias
  ```
- [ ] **Probar POST agencia**:
  ```bash
  curl -X POST http://localhost:4000/api/agencias \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Test Agencia","codigo":"test_ag","descripcion":"Test"}'
  ```
- [ ] **Probar GET sedes**:
  ```bash
  curl http://localhost:4000/api/sedes
  ```
- [ ] **Probar POST sede**:
  ```bash
  curl -X POST http://localhost:4000/api/sedes \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Test Sede","codigo":"test_sede","ciudad":"Test City"}'
  ```

#### 4.2 Frontend Testing
- [ ] **Login como admin** - debe ver tabs y poder gestionar
- [ ] **Login como super_admin** - debe ver tabs y poder gestionar
- [ ] **Login como gerente** - NO debe ver tabs
- [ ] **Login como asesor** - NO debe ver tabs
- [ ] **Probar CRUD agencias**:
  - [ ] Crear nueva agencia
  - [ ] Editar agencia existente
  - [ ] Ver usuarios asignados
  - [ ] Eliminar agencia (sin usuarios)
- [ ] **Probar CRUD sedes**:
  - [ ] Crear nueva sede
  - [ ] Editar sede existente
  - [ ] Ver usuarios asignados
  - [ ] Eliminar sede (sin usuarios)

---

### ⏳ Fase 5: Diagnóstico Cotizador - PENDIENTE

#### 5.1 Recopilar Logs
- [ ] **Abrir DevTools** → Console
- [ ] **Login como usuario problema** (ej: Valeria Reinozo)
- [ ] **Navegar a** `/cotizador`
- [ ] **Buscar logs con prefijos**:
  - `🔐 [UserProfileContext] Perfil cargado:`
  - `📊 [Cotizador] Evaluación de tabs:`

#### 5.2 Analizar Logs
- [ ] **Verificar rolePermissions** - ¿tiene los permisos esperados?
- [ ] **Verificar userPermissions** - ¿tiene permisos individuales?
- [ ] **Verificar allPermissions** - ¿combina correctamente?
- [ ] **Verificar hasTasasPermission** - ¿es true cuando debería?
- [ ] **Verificar hasMonedasPermission** - ¿es true cuando debería?
- [ ] **Verificar canManageTasas** - ¿evalúa correctamente?
- [ ] **Verificar canManageMonedas** - ¿evalúa correctamente?

#### 5.3 Identificar Problema
- [ ] **Si allPermissions está vacío** → Problema en carga desde BD
- [ ] **Si hasPermission es false** → Problema en lógica de evaluación
- [ ] **Si canManage es false** → Problema en lógica de OR
- [ ] **Si timing issue** → Problema en orden de carga

---

### ⏳ Fase 6: Documentación Final - PENDIENTE

- [ ] **Actualizar README** del proyecto
- [ ] **Documentar nuevos endpoints** en API docs
- [ ] **Crear guía de uso** para agencias/sedes
- [ ] **Actualizar diagrama** de arquitectura
- [ ] **Documentar troubleshooting** para permisos

---

## 🚨 Checklist de Emergencia

### Si algo falla:

#### Backend no responde:
- [ ] **Verificar puerto 4000** está libre
- [ ] **Revisar logs** de consola del backend
- [ ] **Verificar variables** de entorno (.env)
- [ ] **Probar health check**: `curl http://localhost:4000/health`

#### Frontend no carga:
- [ ] **Verificar imports** correctos
- [ ] **Revisar sintaxis** JSX
- [ ] **Verificar rutas** en Next.js
- [ ] **Revisar console** errors

#### Permisos no funcionan:
- [ ] **Verificar RLS** en Supabase
- [ ] **Revisar logs** de UserProfileContext
- [ ] **Verificar rol** del usuario en BD
- [ ] **Probar con super_admin** (debe funcionar siempre)

#### Tabs no visibles:
- [ ] **Verificar condition** en tabs array
- [ ] **Revisar isSuperAdmin/isAdmin** values
- [ ] **Probar console.log** de los valores
- [ ] **Verificar activeTab** state

---

## 📊 Métricas de Éxito

### Backend:
- [ ] Todos los endpoints responden 200
- [ ] RLS bloquea accesos no autorizados
- [ ] Logs no muestran errores

### Frontend:
- [ ] Tabs visibles solo para admin/super_admin
- [ ] CRUD funciona sin errores
- [ ] UI responde correctamente
- [ ] No hay errores en console

### Base de Datos:
- [ ] Tablas creadas correctamente
- [ ] Datos iniciales insertados
- [ ] RLS funciona como esperado
- [ ] Relaciones funcionan

### Permisos:
- [ ] Logs de debug muestran datos correctos
- [ ] Tabs del cotizador funcionan como esperado
- [ ] Todos los roles tienen acceso correcto

---

## 🎯 Timeline Estimado

- **Fase 2 (BD):** 15 minutos
- **Fase 3 (UI):** 30 minutos
- **Fase 4 (Testing):** 45 minutos
- **Fase 5 (Diagnóstico):** 30 minutos
- **Fase 6 (Docs):** 20 minutos

**Total estimado:** 2 horas 20 minutos

---

## 📞 Soporte

Si encuentras problemas:
1. **Revisar este checklist** sistemáticamente
2. **Consultar archivos de documentación** creados
3. **Revisar logs** de backend y frontend
4. **Verificar estado actual** en `docs/ESTADO_ACTUAL_IMPLEMENTACION.md`
