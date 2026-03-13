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

  return { form, errors, handleChange, validate, resetForm, setFormValues  };
};
