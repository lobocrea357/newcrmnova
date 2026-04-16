# Skills del ERP Nova CRM

Esta carpeta contiene las skills especializadas para ayudar al agente IA a generar código que utilice correctamente el contexto de usuario, validaciones de acceso y patrones del sistema.

---

## Skills Disponibles

### 1. [agency-sede-context](./agency-sede-context/)
**Propósito:** Enseñar al agente a usar helpers de agencias y sedes

**Cuándo usar:**
- Validar acceso por agencia específica
- Filtrar datos por agencias/sedes del usuario
- Tematizar UI según agencia
- Crear validaciones de negocio por agencia
- Mostrar información de sede

**Ejemplos de triggers:**
- "validar agencia Nova Flash"
- "filtrar cotizaciones por agencia"
- "tematizar dashboard por agencia"
- "acceso solo para sede del Parral"

---

### 2. [auth-permissions-validation](./auth-permissions-validation/)
**Propósito:** Enseñar al agente a implementar validaciones de roles y permisos

**Cuándo usar:**
- Proteger rutas por rol
- Validar permisos específicos
- Crear componentes con acceso condicional
- Implementar jerarquía de roles
- Validaciones de negocio complejas

**Ejemplos de triggers:**
- "solo admin puede acceder"
- "validar permiso cotizaciones:crear"
- "proteger ruta para gerentes"
- "botón solo para super admin"

---

## ¿Cómo Funcionan?

### Triggering Automático
Las skills se activan automáticamente cuando el agente IA detecta que el usuario necesita implementar funcionalidades relacionadas con:
- Validación de acceso
- Filtrado de datos por contexto de usuario
- Protección de componentes o rutas
- Lógica de negocio basada en roles/agencias

### Patrones Enseñados
Cada skill contiene:
- **Helpers disponibles:** Qué funciones usar
- **Casos de uso prácticos:** 10+ ejemplos reales
- **Mejores prácticas:** Patrones recomendados
- **Integraciones:** Cómo combinar con otros sistemas
- **Consideraciones de seguridad:** Validación backend

---

## Beneficios

### Para el Agente IA
- **Conocimiento del dominio:** Entiende el sistema ERP Nova CRM
- **Patrones consistentes:** Usa siempre las mismas helpers y validaciones
- **Best practices:** Implementa seguridad y performance correctamente
- **Integración:** Sabe cómo combinar agencias/sedes con roles/permisos

### Para los Desarrolladores
- **Código consistente:** Todos los componentes usan los mismos patrones
- **Seguridad:** Validaciones implementadas correctamente
- **Mantenimiento:** Código fácil de entender y mantener
- **Productividad:** El agente genera código listo para producción

---

## Ejemplo de Uso

### Sin Skills
```
Usuario: "Necesito una página que solo vean los de Nova Flash"
Agente: "¿Cómo valido eso? ¿Qué API uso?"
```

### Con Skills
```
Usuario: "Necesito una página que solo vean los de Nova Flash"
Agente: 
```javascript
function NovaFlashPage() {
  const { hasAgencia } = useUserProfile()
  
  if (!hasAgencia('nova_flash')) {
    return <div>No autorizado</div>
  }
  
  return <NovaFlashContent />
}
```
```

---

## Instalación

Para usar estas skills, instala los archivos `.skill` generados:

1. Empaqueta las skills:
   ```bash
   python -m scripts.package_skill skills/agency-sede-context
   python -m scripts.package_skill skills/auth-permissions-validation
   ```

2. Instala los archivos `.skill` resultantes en tu sistema Claude

---

## Mantenimiento

Las skills se mantienen actualizadas con:
- Nuevos helpers del sistema
- Cambios en la arquitectura
- Mejores prácticas identificadas
- Casos de uso reales del proyecto

---

## Contribución

Para agregar nuevas funcionalidades a las skills:

1. Identifica patrones repetitivos en el código
2. Documenta los casos de uso
3. Agrega ejemplos prácticos a la skill correspondiente
4. Actualiza los casos de prueba
5. Re-evalúa la skill

---

**Versión:** 1.0  
**Fecha:** 13 de Abril, 2026  
**Sistema:** ERP Nova CRM
