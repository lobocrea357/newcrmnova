# use-form-hook Skill

Skill para enseñar a usar el hook personalizado `useForm` en el proyecto ERP Nova CRM.

## Propósito

Esta skill proporciona guías completas y ejemplos robustos para:
- Manejo de estado de formularios sin `useState` repetitivo
- Validación de formularios con feedback de errores claro
- Gestión de campos de array (listas de pasajeros, productos, etc.)
- Carga de datos para escenarios de edición
- Patrones de migración desde estado manual

## Archivos

- `SKILL.md` - Documentación completa con ejemplos de uso
- `README.md` - Este archivo
- `references/useForm.examples.jsx` - Ejemplos completos de uso

## Cuándo se activa

El agente usará esta skill cuando:
- El usuario mencione crear o refactorizar formularios
- Hable de validación de formularios
- Mencione manejo de errores en formularios
- Trabaje con campos de array en formularios
- Quiera eliminar código repetitivo de `useState` en formularios

## Ejemplos cubiertos

1. Formulario simple con validación
2. Formulario con arrays (lista de pasajeros)
3. Edición de datos existentes
4. Validación condicional
5. Campos anidados
6. Reordenamiento de items (drag & drop)
7. Reemplazo completo de arrays
8. Patrones de migración desde estado manual

## Dependencias

- Hook: `dashboard/src/hooks/useForm.js`
- React hooks: `useState`, `useCallback`, `useEffect`

## Notas

El hook `useForm` fue extendido para soportar arrays de campos con las siguientes funciones:
- `handleArrayChange(arrayName, index, field, value)`
- `addArrayItem(arrayName, defaultItem)`
- `removeArrayItem(arrayName, index)`
- `moveArrayItem(arrayName, fromIndex, toIndex)`
- `setArrayValue(arrayName, newArray)`
