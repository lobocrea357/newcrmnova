
# 🤖 Guía Rápida para Agentes IA - CRM WhatsApp

## 🎯 **PROPÓSITO**

Esta guía te enseña a usar los 3 archivos de contexto del proyecto en **3 minutos**. Léela ANTES de escribir cualquier código.

---

## ⚡ **PASO 1: LEE AI_CONTEXT.md (30 segundos)**

### **¿Qué hacer?**
Abre y lee `AI_CONTEXT.md` completamente.

### **¿Qué buscar?**
- **Qué es el proyecto**: CRM WhatsApp con Next.js + Express + WAHA
- **Arquitectura clave**: Dashboard accede DIRECTO a Supabase
- **Roles reales**: admin, gerente, administracion, asesor
- **Prohibiciones**: NO TypeScript, NO Server Actions (depende), NO hardcodear URLs

### **✅ Checklist rápido:**
- [ ] Entendí la arquitectura general
- [ ] Sé qué NO debo hacer
- [ ] Conozco los roles del sistema

---

## 🔍 **PASO 2: REGLA DE ORO - Revisa si ya existe (1 minuto)**

### **¿Qué buscar ANTES de crear código?**

```bash
# Busca funciones existentes:
grep -r "nombreFuncion" dashboard/src/lib/
grep -r "nombreHook" dashboard/src/hooks/
grep -r "nombreComponente" dashboard/src/components/

# Busca endpoints:
grep -r "/api/tu-endpoint" dashboard/src/config/
```

### **Lugares específicos que revisar:**
- `dashboard/src/lib/` - Utilidades y helpers
- `dashboard/src/hooks/` - Hooks personalizados  
- `dashboard/src/components/` - Componentes UI
- `dashboard/src/config/apiConfig.js` - Endpoints centralizados
- `src/services/` - Servicios del backend

### **✅ Si encuentras algo similar:**
- **Reutilízalo** en lugar de duplicar
- **Adáptalo** si necesita cambios menores
- **Crea nuevo solo si no existe nada parecido**

---

## 📋 **PASO 3: Consulta CODE_RULES.md (30 segundos)**

### **¿Qué verificar?**
- **Convenciones de nombres**:
  - Componentes: PascalCase (`UserProfile.js`)
  - Hooks: camelCase (`useAuth.js`)
  - Utils: camelCase/kebab-case
- **Patrones de código**:
  - Fetch con manejo de errores completo
  - Notificaciones: SweetAlert2 (críticas) + toast (info)
  - Loading states: mix según contexto
  - Sistema de permisos granular con `useUserProfile`
  - APIs centralizadas en `apiConfig.js`

### **✅ Ejemplo rápido:**
```javascript
// ❌ MALO (sin manejo de errores)
const data = await fetch('/api/users').then(r => r.json())

// ✅ BUENO (con manejo de errores)
try {
  const response = await fetch('/api/users')
  if (!response.ok) throw new Error('HTTP error')
  const data = await response.json()
  return data
} catch (error) {
  toast.error('Error al cargar usuarios')
  throw error
}
```

---

## 🏗️ **PASO 4: Verifica ARCHITECTURE.md (30 segundos)**

### **¿Cuándo consultarlo?**
- Cuando necesites decidir **dónde** va tu código
- Cuando no sepas **si** usar Express o Dashboard directo
- Cuando dudes sobre **flujo de datos**

### **Decisiones rápidas:**
- **¿Dashboard accede a Supabase?** ✅ SÍ, directo
- **¿Express maneja webhooks?** ✅ SÍ, de WAHA
- **¿Archivos se suben a Storage?** ✅ SÍ, desde Dashboard
- **¿Roles se validan en backend?** ❌ NO, solo frontend (pendiente)

---

## 🚀 **FLUJO COMPLETO DE TRABAJO**

### **Antes de escribir CUALQUIER código:**

1. **📖 Lee AI_CONTEXT.md** - Entiende el proyecto
2. **🔍 Busca código existente** - No dupliques
3. **📋 Revisa CODE_RULES.md** - Sigue convenciones
4. **🏗️ Consulta ARCHITECTURE.md** - Toma decisiones técnicas

### **Durante el desarrollo:**

5. **✅ Usa endpoints centralizados** (apiConfig.js)
6. **✅ Maneja todos los errores** con try/catch
7. **✅ Usa notificaciones apropiadas** (SweetAlert2/toast)
8. **✅ Sigue convenciones de nombres**

---

## 🎯 **EJEMPLOS PRÁCTICOS COMUNES**

### **Caso 1: Necesito formatear fechas**
```javascript
// ❌ ANTES (duplicar lógica):
function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

// ✅ DESPUÉS (reutilizar):
import { formatDate } from '@/lib/utils/date-utils'
```

### **Caso 2: Necesito hacer fetch a API**
```javascript
// ❌ ANTES (hardcodear):
fetch('http://localhost:4000/api/users')

// ✅ DESPUÉS (centralizado):
import { USER_API } from '@/config/apiConfig'
fetch(USER_API.listar)
```

### **Caso 3: Necesito validar permisos de usuario**
```javascript
// ❌ ANTES (solo validar por rol):
if (user.role === 'admin') { ... }

// ✅ DESPUÉS (usar sistema de permisos granular):
import { useUserProfile } from '@/contexts/UserProfileContext'
const { hasPermission, hasAnyPermission, isAdmin } = useUserProfile()

// Validar permiso específico
if (hasPermission('manage_users')) { ... }

// Validar múltiples permisos (OR)
if (hasAnyPermission(['edit_flights', 'view_flights'])) { ... }

// Validar por rol cuando aplica
if (isAdmin) { ... }
```

---

## 🚨 **SEÑALES DE ALERTA**

### **❌ DETENER si:**
- Vas a crear una función que ya existe
- Vas a hardcodear una URL
- No sabes si usar Express o Dashboard directo
- No estás seguro de las convenciones de nombres

### **✅ CONTINUAR si:**
- Ya revisaste que no existe código similar
- Entiendes la arquitectura del flujo
- Sigues las convenciones del proyecto
- Manejas todos los errores posibles

---

## 📞 **EN CASO DE DUDA**

### **Orden de consulta:**
1. **AI_CONTEXT.md** - Respuestas rápidas
2. **CODE_RULES.md** - Convenciones específicas  
3. **ARCHITECTURE.md** - Decisiones de arquitectura
4. **Preguntar** - Si todavía no está claro

### **Frases clave para buscar ayuda:**
- "No encuentro un patrón existente para..."
- "¿Debería usar Express o Dashboard directo para...?"
- "No estoy seguro de las convenciones para..."

---

## 🎯 **RESUMEN EN 15 SEGUNDOS**

1. **Lee AI_CONTEXT.md** → Entiende el proyecto
2. **Busca código existente** → No dupliques lógica  
3. **Sigue CODE_RULES.md** → Usa convenciones correctas
4. **Consulta ARCHITECTURE.md** → Toma decisiones técnicas
5. **Escribe código** → Con contexto completo

**¡Listo para trabajar eficientemente en este proyecto! 🚀**

---

## 🔄 **MANTENIMIENTO DE ESTA GUÍA**

Si encuentras:
- **Nuevos patrones**: Agrega ejemplos aquí
- **Cambios en arquitectura**: Actualiza el flujo
- **Errores comunes**: Agrega a "Señales de Alerta"

## 🔄 **SISTEMA DE MANTENIMIENTO INTELIGENTE**

### **🤖 Para Agentes IA - Auto-Mantenimiento**

**Cuando encuentres nuevos patrones:**
1. **Detecta** el patrón nuevo (hook, componente, utilidad)
2. **Valida** que no esté duplicado
3. **Documenta** en AI_CONTEXT.md con fecha y ejemplos
4. **Actualiza** meta-datos automáticamente

**Ejemplo de actualización:**
```markdown
### **Hooks Personalizados**
- **useApiCache**: Cache para llamadas API (detectado 2026-02-24)
  - Uso: Optimizar fetch repetitivos
  - Ejemplo: `const { data, loading } = useApiCache(url)`
  - Archivos: `/cotizador/CotizadorForm.jsx`
```

### **🛠️ Script de Mantenimiento Automatizado**

**⚠️ IMPORTANTE: Estos comandos SOLO se ejecutan en entorno de desarrollo**

**¿Cuándo usar los comandos de mantenimiento?**

#### **🔍 1. Validación de Contexto (Uso Diario)**
**Usa cuando:**
- Vas a hacer cambios importantes en el proyecto
- Quieres verificar si el contexto está actualizado
- Detectas posibles inconsistencias

**Comando:**
```bash
npm run context:validate
```

**Qué hace el agente IA:**
1. **Verifica** que AI_CONTEXT.md exista y sea válido
2. **Escanea** el código en busca de patrones no documentados
3. **Compara** patrones documentados vs encontrados
4. **Reporta** inconsistencias o problemas

**Ejemplo de salida:**
```
✅ AI_CONTEXT.md cargado exitosamente
📊 Meta-datos parseados: { patrones_documentados: "47", ... }
🔍 Encontrados 52 patrones en el código
📈 Patrones documentados: 47
🔍 Patrones encontrados: 52
❌ Problemas encontrados:
  - Diferencia significativa entre patrones documentados (47) y encontrados (52)
```

#### **📊 2. Generar Reporte (Uso Mensual)**
**Usa cuando:**
- Es inicio de mes y quieres un reporte completo
- Necesitas métricas sobre la salud del contexto
- Quieres identificar patrones obsoletos

**Comando:**
```bash
npm run context:report
```

**Qué hace el agente IA:**
1. **Analiza** estado actual del contexto
2. **Calcula** métricas de salud (activos vs obsoletos)
3. **Identifica** patrones que no se usan
4. **Genera** reporte detallado y lo guarda en archivo

**Ejemplo de reporte generado:**
```markdown
## 📊 Reporte de Mantenimiento - 24 de febrero de 2026

### 📈 Estadísticas:
- **Patrones totales**: 52
- **Patrones activos**: 48 (92.3%)
- **Patrones obsoletos**: 4 (7.7%)
- **Última actualización**: 2026-02-15

### 🔄 Cambios Este Mes:
- ✅ Nuevo: `useApiCache` hook
- ✅ Actualizado: Ejemplos de fetch con manejo de errores
- ✅ Obsoleto: `formatDateLegacy` (reemplazado)

### 🎯 Salud del Contexto: ✅ EXCELENTE
```

#### **🔄 3. Actualizar Meta-datos (Uso Inmediato)**
**Usa cuando:**
- Acabas de agregar nuevos patrones al contexto
- Modificaste la estructura del proyecto
- Quieres sincronizar los contadores

**Comando:**
```bash
npm run context:update
```

**Qué hace el agente IA:**
1. **Actualiza** fecha de última modificación
2. **Sincroniza** contador de patrones documentados
3. **Registra** validación más reciente
4. **Guarda** cambios en AI_CONTEXT.md

#### **🚀 4. Mantenimiento Completo (Uso Semanal)**
**Usa cuando:**
- Quieres ejecutar todo el proceso de una vez
- Es mantenimiento regular semanal
- Necesitas una revisión completa

**Comando:**
```bash
npm run context:maintenance
```

**Qué hace el agente IA:**
1. **Ejecuta** validación completa
2. **Genera** reporte automático
3. **Actualiza** meta-datos
4. **Reporta** estado final

---

## 🤖 **GUIA PASO A PASO PARA AGENTES IA**

## 🔒 **VERIFICACIÓN DE ENTORNO (OBLIGATORIO)**

### **Antes de ejecutar CUALQUIER comando de mantenimiento:**

**Paso 1: Verificar entorno de desarrollo**
```bash
# El agente IA debe verificar:
echo $NODE_ENV  # Debe ser 'development' o no estar definido
```

**Paso 2: Confirmar que no es producción**
```bash
# El script automáticamente validará:
# - NODE_ENV !== 'production'
# - No hay variables CI/CD activas
```

**Paso 3: Ejecutar comando solo si es seguro**
```bash
# Solo si las validaciones pasan:
npm run context:validate
```

### **🚫 Qué hacer si el entorno no es seguro:**
- **Si NODE_ENV=production**: Detener ejecución inmediatamente
- **Si hay variables CI**: No ejecutar comandos de mantenimiento
- **Si no estás seguro**: Preguntar al desarrollador humano

---

### **ESCENARIO 1: Agente IA detecta nuevo patrón**

**Paso 1: Detectar el patrón nuevo**
```javascript
// La IA encuentra este código nuevo
const useCustomValidation = () => {
  // Lógica de validación personalizada
}
```

**Paso 2: Documentar en AI_CONTEXT.md**
```markdown
### **Hooks Personalizados**
- **useCustomValidation**: Validación personalizada de formularios (detectado 2026-02-24)
  - Uso: Validar formularios complejos con reglas personalizadas
  - Ejemplo: `const { validate, errors } = useCustomValidation(rules)`
  - Archivos: `/components/forms/CustomForm.jsx`
```

**Paso 3: Actualizar meta-datos**
```bash
npm run context:update
```

**Paso 4: Validar cambios**
```bash
npm run context:validate
```

### **ESCENARIO 2: Mantenimiento mensual automático**

**Paso 1: Ejecutar mantenimiento completo**
```bash
npm run context:maintenance
```

**Paso 2: Revisar reporte generado**
- El archivo se guarda como: `context-report-2026-02-24.md`
- Revisar métricas y recomendaciones

**Paso 3: Actuar sobre alertas (si hay)
- Si hay patrones obsoletos: marcarlos o eliminarlos
- Si hay inconsistencias: corregirlas
- Si hay nuevos patrones: documentarlos

### **ESCENARIO 3: Antes de cambios importantes**

**Paso 1: Validar estado actual**
```bash
npm run context:validate
```

**Paso 2: Hacer los cambios en el código**
- Implementar nuevas features
- Refactorizar componentes
- Agregar nuevos patrones

**Paso 3: Actualizar contexto si es necesario**
- Documentar nuevos patrones
- Actualizar ejemplos
- Marcar obsoletos

**Paso 4: Validar estado final**
```bash
npm run context:validate
```

---

## ⚠️ **REGLAS IMPORTANTES**

### **🚫 SOLO ENTORNO DE DESARROLLO**
- **NUNCA** ejecutar estos comandos en producción
- **NUNCA** hacer commit de archivos de reporte generados
- **SOLO** usar durante desarrollo local

### **🔄 FRECUENCIA RECOMENDADA**
- **Validación**: Cada vez que hagas cambios importantes
- **Reporte**: Mensualmente (inicio de mes)
- **Actualización**: Inmediatamente después de documentar algo nuevo
- **Mantenimiento completo**: Semanalmente

### **📋 ARCHIVOS GENERADOS**
- **Reportes**: `context-report-YYYY-MM-DD.md` (no commitear)
- **Logs**: Consola únicamente
- **Contexto**: `AI_CONTEXT.md` (sí se commitea)

### **📊 Ciclo de Vida del Contexto**

| Período | Acción | Responsable |
|---------|--------|-------------|
| **Diario** | Detectar y documentar nuevos patrones | IA |
| **Mensual** | Revisar patrones obsoletos, generar reportes | IA |
| **Trimestral** | Validar visión general, limpiar obsoletos | Humano |
| **Anual** | Reestructuración mayor si es necesario | Humano |

### **🎯 Objetivos de Largo Plazo**
- **8 meses**: 85-95% de información relevante
- **12 meses**: 75-85% de información relevante  
- **18 meses**: 65-75% de información relevante

---

**Esta guía debe evolucionar con el proyecto y mantenerse actualizada automáticamente.**
