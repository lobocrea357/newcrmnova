# use-modal-hook Skill

Skill para enseñar a usar el hook personalizado `useModal` en el proyecto ERP Nova CRM.

## Propósito

Esta skill proporciona guías completas y ejemplos robustos para:
- Manejo de estado de modales sin `useState` repetitivo
- Paso de datos a modales (escenarios de edición)
- Patrón de guardado con refetch automático
- Gestión de múltiples modales en un componente
- Implementación del componente Modal genérico

## Archivos

- `SKILL.md` - Documentación completa con ejemplos de uso
- `README.md` - Este archivo
- `references/Modal.examples.jsx` - Ejemplos completos de uso del componente Modal

## Cuándo se activa

El agente usará esta skill cuando:
- El usuario mencione crear o trabajar con modales
- Hable de diálogos, popups o overlays
- Mencione patrones de CRUD con modales
- Quiera refrescar datos después de guardar en un modal
- Trabaje con estado de modales con `useState`

## Ejemplos cubiertos

1. Modal simple (sin datos)
2. Modal con datos (patrón de edición)
3. Modal con handler de guardado y refetch
4. Múltiples modales en un componente
5. CRUD completo con modales
6. Modal de confirmación
7. Modal de formulario con validación (combinado con useForm)
8. Modal con variantes y tamaños personalizados
9. Modal con loading state
10. Modal con estilos personalizados

## Dependencias

- Hook: `dashboard/src/hooks/useModal.js`
- Componente: `dashboard/src/components/Modal.jsx`
- Helper: `dashboard/src/lib/utils/cn.js`
- React hooks: `useState`, `useCallback`, `useEffect`
- Iconos: lucide-react (X, Loader2)

## Componente Modal Genérico

El componente `Modal` genérico está ubicado en `dashboard/src/components/Modal.jsx`. Es totalmente configurable con:
- 5 variantes predefinidas (default, danger, success, warning, dark)
- 7 tamaños (sm, md, lg, xl, 2xl, 3xl, full)
- Props para clases personalizables en cada sección
- Footer opcional
- Loading state
- Control de cierre (overlay click, Escape key)

## Notas

El hook `useModal` incluye la función `createModalSaveHandler` que:
- Ejecuta la función de refetch proporcionada
- Cierra el modal automáticamente
- Simplifica el patrón común de guardar → refrescar → cerrar
