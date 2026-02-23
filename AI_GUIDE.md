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

### **Caso 3: Necesito validar usuario**
```javascript
// ❌ ANTES (lógica duplicada):
if (user.role === 'admin') { ... }

// ✅ DESPUÉS (usar hooks):
const { isAdmin } = useUserProfile()
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

**Esta guía debe evolucionar con el proyecto.**
