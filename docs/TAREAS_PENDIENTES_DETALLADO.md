# Tareas Pendientes - Detalle Completo

## 🎯 Objetivo Principal
Completar la implementación del sistema de agencias y sedes, y resolver el problema de visibilidad de tabs en el cotizador.

---

## 📋 Lista Detallada de Tareas Pendientes

### 1. Ejecutar Migration SQL en Supabase (ALTA PRIORIDAD)
**Archivo:** `docs/05-base-de-datos/migration_agencias_sedes.sql`

**Acciones requeridas:**
1. Ir a Supabase Dashboard → SQL Editor
2. Copiar y pegar el contenido del archivo migration
3. Ejecutar el script SQL completo

**¿Qué crea el script?**
- Tabla `agencias` (id, nombre, codigo, descripcion, logo_url, color_primario, is_active)
- Tabla `sedes` (id, nombre, codigo, direccion, ciudad, pais, telefono, is_active)
- Tabla `usuario_agencias` (relación N:M entre usuarios y agencias)
- Columna `sede_id` en tabla `profiles` (relación 1:1)
- Triggers para `updated_at`
- RLS (Row Level Security) para todas las tablas
- Datos iniciales de agencias (Nova, Nova Flash, Nova Colombia, Apolo)
- Datos iniciales de sedes (Oficina del Parral, Torre Seguro Los Andes)

**Verificación post-ejecución:**
```sql
SELECT * FROM agencias;
SELECT * FROM sedes;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sede_id';
```

---

### 2. Integrar Components en Página de Usuarios

**Archivo:** `dashboard/src/app/(crm)/configuracion/usuarios/page.js`

**Pasos detallados:**

#### Paso 2.1: Importar componentes
Agregar al inicio del archivo:
```javascript
import AgenciasManager from '@/components/agencias/AgenciasManager'
import SedesManager from '@/components/sedes/SedesManager'
```

#### Paso 2.2: Agregar tabs al sistema existente
Localizar el sistema de tabs (usualmente alrededor de la línea 50-100) y agregar:
```javascript
{activeTab === 'agencias' && <AgenciasManager />}
{activeTab === 'sedes' && <SedesManager />}
```

#### Paso 2.3: Actualizar lista de tabs
Agregar a la lista de tabs existente:
```javascript
{{
  id: 'agencias',
  label: 'Agencias',
  icon: Building2,
  condition: isSuperAdmin || isAdmin
}}
{{
  id: 'sedes', 
  label: 'Sedes',
  icon: MapPin,
  condition: isSuperAdmin || isAdmin
}}
```

#### Paso 2.4: Importar iconos requeridos
```javascript
import { Building2, MapPin } from 'lucide-react'
```

---

### 3. Probar Sistema Completo

#### 3.1 Backend Testing
**Endpoints a probar:**
- `GET /api/agencias` - Listar agencias
- `POST /api/agencias` - Crear agencia
- `GET /api/sedes` - Listar sedes
- `POST /api/sedes` - Crear sede

**Herramienta:** Postman, curl o Insomnia

#### 3.2 Frontend Testing
**Pasos:**
1. Iniciar sesión como usuario `admin` o `super_admin`
2. Navegar a `/configuracion/usuarios`
3. Verificar que tabs "Agencias" y "Sedes" sean visibles
4. Probar CRUD en ambas secciones
5. Verificar que usuarios sin rol admin no vean los tabs

#### 3.3 Validación de Permisos
**Usuarios de prueba:**
- Usuario con rol `admin`: debe ver tabs y poder gestionar
- Usuario con rol `gerente`: NO debe ver tabs
- Usuario con rol `asesor`: NO debe ver tabs

---

### 4. Diagnóstico de Tabs del Cotizador

**Archivos con debug logging:**
- `dashboard/src/contexts/UserProfileContext.js` - Líneas 123-145
- `dashboard/src/app/cotizador/page.js` - Líneas 39-56

**Pasos para diagnóstico:**
1. Abrir DevTools → Console
2. Navegar a `/cotizador` con usuario problema (ej: Valeria Reinozo)
3. Buscar logs con prefijos:
   - `🔐 [UserProfileContext] Perfil cargado:`
   - `📊 [Cotizador] Evaluación de tabs:`

**Qué buscar en los logs:**
- `rolePermissions` y `userPermissions` arrays
- `allPermissions` combinado
- `hasTasasPermission` y `hasMonedasPermission` valores
- `canManageTasas` y `canManageMonedas` resultados

---

## 🔧 Archivos Modificados/Creados - Referencia

### Backend
- `src/services/agenciasService.js` - Service layer completo
- `src/services/sedesService.js` - Service layer completo  
- `src/routes/agencias.js` - REST endpoints
- `src/routes/sedes.js` - REST endpoints
- `src/index.js` - Registro de nuevas rutas

### Frontend
- `dashboard/src/config/apiConfig.js` - URLs de APIs
- `dashboard/src/components/agencias/AgenciasManager.jsx` - UI completa
- `dashboard/src/components/sedes/SedesManager.jsx` - UI completa

### Base de Datos
- `docs/05-base-de-datos/migration_agencias_sedes.sql` - Migration completa

### Correcciones de Permisos
- `dashboard/src/app/(crm)/gestion-equipos/page.js` - Permitir admin/super_admin
- `dashboard/src/components/layout/Sidebar.jsx` - Eliminar userConfig.js
- `dashboard/src/contexts/UserProfileContext.js` - Debug logging
- `dashboard/src/app/cotizador/page.js` - Debug logging

---

## 🚨 Consideraciones Importantes

### Seguridad
- Todos los endpoints tienen RLS configurado
- Solo admin y super_admin pueden acceder a gestión de agencias/sedes
- Validación tanto en frontend como backend

### Rendimiento
- Los componentes usan `useCallback` para optimización
- Loading states implementados
- Lazy loading de datos de usuarios

### UX
- UI moderna y consistente con el resto del sistema
- Confirmaciones para acciones destructivas
- Estados de carga claros
- Retroalimentación visual inmediata

---

## 📞 Contacto y Soporte

Si surgen problemas durante la implementación:

1. **Para problemas de BD:** Revisar logs de Supabase y verificar que la migration se ejecutó correctamente
2. **Para problemas de Backend:** Revisar logs del servidor Express (usualmente en consola)
3. **Para problemas de Frontend:** Revisar DevTools Console y Network tabs
4. **Para problemas de permisos:** Usar los logs de debug agregados al UserProfileContext

---

## ✅ Checklist de Finalización

- [ ] Migration SQL ejecutada en Supabase
- [ ] AgenciasManager importado en usuarios/page.js
- [ ] SedesManager importado en usuarios/page.js  
- [ ] Tabs agregados al sistema de navegación
- [ ] Iconos Building2 y MapPin importados
- [ ] Condiciones de permisos aplicadas a los tabs
- [ ] Backend probado con Postman/Insomnia
- [ ] Frontend probado con usuario admin
- [ ] Frontend probado con usuario no-admin
- [ ] Logs del cotizador revisados para diagnóstico
- [ ] Documentación actualizada si es necesario
