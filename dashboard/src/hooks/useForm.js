import { useCallback, useState } from "react";

export const useForm = (initialForm, validateForm) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!validateForm) return true; // si no hay reglas, siempre válido
    const newErrors = validateForm(form);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
  };

  const setFormValues = useCallback((values) => {
    setForm((prev) => ({ ...prev, ...values }));
    setErrors({});
  }, []);

  // ============================================
  // FUNCIONES PARA MANEJAR ARRAYS DE CAMPOS
  // ============================================

  /**
   * Actualiza un campo específico de un item en un array del formulario
   * @param {string} arrayName - Nombre del campo array en el form (ej: "pasajeros")
   * @param {number} index - Índice del item a actualizar
   * @param {string} field - Nombre del campo del item a actualizar
   * @param {any} value - Nuevo valor del campo
   */
  const handleArrayChange = useCallback((arrayName, index, field, value) => {
    setForm((prev) => {
      const array = prev[arrayName];
      if (!Array.isArray(array)) {
        console.warn(`El campo "${arrayName}" no es un array`);
        return prev;
      }
      const updatedArray = array.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, [arrayName]: updatedArray };
    });
  }, []);

  /**
   * Agrega un nuevo item al array
   * @param {string} arrayName - Nombre del campo array en el form
   * @param {object} defaultItem - Item por defecto a agregar (opcional, usa {} si no se provee)
   */
  const addArrayItem = useCallback((arrayName, defaultItem = {}) => {
    setForm((prev) => {
      const array = prev[arrayName];
      if (!Array.isArray(array)) {
        console.warn(`El campo "${arrayName}" no es un array`);
        return prev;
      }
      return { ...prev, [arrayName]: [...array, defaultItem] };
    });
  }, []);

  /**
   * Elimina un item del array por su índice
   * @param {string} arrayName - Nombre del campo array en el form
   * @param {number} index - Índice del item a eliminar
   */
  const removeArrayItem = useCallback((arrayName, index) => {
    setForm((prev) => {
      const array = prev[arrayName];
      if (!Array.isArray(array)) {
        console.warn(`El campo "${arrayName}" no es un array`);
        return prev;
      }
      return { ...prev, [arrayName]: array.filter((_, i) => i !== index) };
    });
  }, []);

  /**
   * Mueve un item del array de una posición a otra (útil para drag & drop)
   * @param {string} arrayName - Nombre del campo array en el form
   * @param {number} fromIndex - Índice actual del item
   * @param {number} toIndex - Nuevo índice del item
   */
  const moveArrayItem = useCallback((arrayName, fromIndex, toIndex) => {
    setForm((prev) => {
      const array = prev[arrayName];
      if (!Array.isArray(array)) {
        console.warn(`El campo "${arrayName}" no es un array`);
        return prev;
      }
      const newArray = [...array];
      const [movedItem] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, movedItem);
      return { ...prev, [arrayName]: newArray };
    });
  }, []);

  /**
   * Reemplaza todo el array con un nuevo array
   * @param {string} arrayName - Nombre del campo array en el form
   * @param {array} newArray - Nuevo array completo
   */
  const setArrayValue = useCallback((arrayName, newArray) => {
    if (!Array.isArray(newArray)) {
      console.warn(`El valor provisto no es un array`);
      return;
    }
    setForm((prev) => ({ ...prev, [arrayName]: newArray }));
  }, []);

  return {
    form,
    errors,
    handleChange,
    validate,
    resetForm,
    setFormValues,
    // Funciones para arrays
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    moveArrayItem,
    setArrayValue,
  };
};
