# Contexto de Usuario: Agencias y Sedes

Esta carpeta contiene la documentación completa sobre la implementación del **contexto de agencias y sedes** en el sistema de autenticación del ERP.

---

## 📚 Documentos Disponibles

### 1. [AUDITORIA.md](./AUDITORIA.md)
**Auditoría técnica completa del sistema**

Contenido:
- Análisis del esquema de base de datos
- Relaciones usuario-agencia-sede
- Arquitectura actual del sistema de autenticación
- Servicios y endpoints backend existentes
- Solución propuesta con código detallado
- Root cause analysis
- Plan de implementación
- Consideraciones de performance y seguridad

**Ideal para:** Desarrolladores que necesiten entender la arquitectura y el "por qué" de la implementación.

---

### 2. [GUIA_DE_USO.md](./GUIA_DE_USO.md)
**Guía práctica de uso para desarrolladores**

Contenido:
- Datos disponibles en el contexto
- 10 ejemplos prácticos de uso
- Helpers disponibles (hasAgencia, hasSede, etc.)
- Casos de uso comunes
- Validaciones de negocio
- Filtrado de datos
- Personalización de UI
- Consideraciones importantes
- Guía de migración de código existente
- Tips de debugging

**Ideal para:** Desarrolladores que necesiten usar el contexto en sus componentes.

---

## 🎯 Resumen Rápido

### ¿Qué se implementó?

Se extendió el `UserProfileContext` para incluir información de **agencias** y **sedes** del usuario autenticado, haciéndola tan accesible como los roles y permisos.

### ¿Cómo usar?

```javascript
import { useUserProfile } from '@/contexts/UserProfileContext'

function MiComponente() {
  const { 
    primaryAgencia,    // Agencia principal del usuario
    agencias,          // Todas las agencias
    sede,              // Sede del usuario
    hasAgencia,        // Helper para validar agencia
    hasSede,           // Helper para validar sede
  } = useUserProfile()
  
  // Usar los datos...
}
```

### Datos Disponibles

**Agencias:**
- `agencias` - Array de agencias del usuario
- `primaryAgencia` - Agencia primaria (objeto completo)

**Sede:**
- `sede` - Sede del usuario (objeto completo o null)

**Helpers:**
- `hasAgencia(codigo)` - Verificar si pertenece a una agencia
- `isAgenciaPrimary(codigo)` - Verificar si es la agencia primaria
- `getAgenciaByCode(codigo)` - Obtener agencia por código
- `hasAnyAgencia()` - Verificar si tiene alguna agencia
- `getAllAgencias()` - Obtener todas las agencias
- `getAgenciaIds()` - Obtener IDs para filtros
- `hasSede()` - Verificar si tiene sede
- `isSedeCode(codigo)` - Verificar código de sede
- `getSede()` - Obtener sede
- `getSedeId()` - Obtener ID para filtros

---

## 📁 Archivos Modificados

### Frontend
- `dashboard/src/contexts/UserProfileContext.js` - Contexto extendido con agencias y sedes

### Backend
- ✅ No se modificó (endpoints ya existían)

---

## 🚀 Casos de Uso

1. **Validar agencia antes de crear cotización**
2. **Tematizar UI según agencia (colores, logos)**
3. **Filtrar datos por agencias del usuario**
4. **Mostrar información de sede en perfil**
5. **Proteger rutas por agencia específica**
6. **Generar reportes por sede**
7. **Validaciones de negocio condicionales**

---

## ⚠️ Importante

### Seguridad
El contexto frontend es para **UX**, NO para seguridad. Siempre valida en el backend.

### Usuarios sin Agencias
Siempre verifica si el usuario tiene agencias asignadas:
```javascript
if (!hasAnyAgencia()) {
  return <Alert>Sin agencias asignadas</Alert>
}
```

---

## 📖 Documentación Relacionada

- Sistema de autenticación: `docs/AUTENTICACION_COMPLETA.md`
- Base de datos: `docs/05-base-de-datos/esquemalocal.sql`
- Configuración de agencias: `dashboard/src/config/apiConfig.js`

---

**Fecha de implementación:** 13 de Abril, 2026  
**Versión:** 1.0
