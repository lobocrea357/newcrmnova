---
name: use-form-hook
description: How to use the useForm custom hook for managing form state, validation, and arrays in React components. Use this skill whenever the user is creating or refactoring forms, handling form validation, managing form state with useState, working with form errors, or implementing array-based form fields (like lists of items, passengers, or nested objects). This includes scenarios like login forms, registration forms, data entry forms, modal forms with validation, and any component that needs to track form data and validate it before submission.
---

# useForm Hook Guide

Complete guide for using the `useForm` custom hook to manage form state, validation, and array fields in React components.

**For complete usage examples, see:** `references/useForm.examples.jsx`

## When to Use

Use `useForm` whenever you need to:
- Manage form state without repetitive `useState` boilerplate
- Validate form fields before submission
- Handle form errors with clear feedback
- Manage arrays of form fields (e.g., lists of items, passengers, nested objects)
- Reset forms to initial values
- Set form values programmatically

## Hook Location

```javascript
import { useForm } from '@/hooks/useForm';
```

## Basic Usage

### Simple Form with Validation

```javascript
import { useForm } from '@/hooks/useForm';

const MyForm = () => {
  // Define validation function
  const validateForm = (form) => {
    const errors = {};
    if (!form.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }
    if (!form.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email inválido";
    }
    return errors;
  };

  // Initialize hook
  const {
    form,
    errors,
    handleChange,
    validate,
    resetForm,
    setFormValues
  } = useForm(
    { nombre: "", email: "" },
    validateForm
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return; // Validation failed, errors are set automatically
    }

    // Form is valid, submit data
    console.log("Form data:", form);
    // Submit to API...
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre</label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className={errors.nombre ? "border-red-500" : ""}
        />
        {errors.nombre && <span className="text-red-500">{errors.nombre}</span>}
      </div>

      <div>
        <label>Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <span className="text-red-500">{errors.email}</span>}
      </div>

      <button type="submit">Enviar</button>
      <button type="button" onClick={resetForm}>Limpiar</button>
    </form>
  );
};
```

## Array Field Management

The hook supports array fields for managing lists of items (passengers, products, etc.).

### Array Functions

- **`handleArrayChange(arrayName, index, field, value)`** - Update a specific field in an array item
- **`addArrayItem(arrayName, defaultItem)`** - Add a new item to the array
- **`removeArrayItem(arrayName, index)`** - Remove an item from the array
- **`moveArrayItem(arrayName, fromIndex, toIndex)`** - Move an item (useful for drag & drop)
- **`setArrayValue(arrayName, newArray)`** - Replace the entire array

### Example: Passenger List

```javascript
import { useForm } from '@/hooks/useForm';

const PassengerForm = () => {
  const {
    form,
    errors,
    handleChange,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    validate,
    resetForm
  } = useForm(
    {
      pax_nombre: '',
      pasajeros: []
    },
    (form) => {
      const errors = {};
      if (!form.pax_nombre.trim()) errors.pax_nombre = 'Nombre requerido';
      if (form.pasajeros.length === 0) errors.pasajeros = 'Agrega al menos un pasajero';
      return errors;
    }
  );

  const agregarPasajero = () => {
    addArrayItem('pasajeros', {
      nombres: '',
      apellidos: '',
      tipo: 'ADULTO',
      orden: form.pasajeros.length + 1
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('Datos completos:', form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Simple field */}
      <input
        name="pax_nombre"
        value={form.pax_nombre}
        onChange={handleChange}
        placeholder="Nombre del cliente"
      />
      {errors.pax_nombre && <span>{errors.pax_nombre}</span>}

      {/* Array of passengers */}
      <div>
        <h3>Pasajeros</h3>
        {form.pasajeros.map((pasajero, index) => (
          <div key={index}>
            <input
              value={pasajero.nombres}
              onChange={(e) => handleArrayChange('pasajeros', index, 'nombres', e.target.value)}
              placeholder="Nombres"
            />
            <input
              value={pasajero.apellidos}
              onChange={(e) => handleArrayChange('pasajeros', index, 'apellidos', e.target.value)}
              placeholder="Apellidos"
            />
            <select
              value={pasajero.tipo}
              onChange={(e) => handleArrayChange('pasajeros', index, 'tipo', e.target.value)}
            >
              <option value="ADULTO">Adulto</option>
              <option value="NINO">Niño</option>
              <option value="INFANTE">Infante</option>
            </select>
            <button type="button" onClick={() => removeArrayItem('pasajeros', index)}>
              Eliminar
            </button>
          </div>
        ))}
        <button type="button" onClick={agregarPasajero}>
          + Agregar Pasajero
        </button>
      </div>
      {errors.pasajeros && <span>{errors.pasajeros}</span>}

      <button type="submit">Enviar</button>
    </form>
  );
};
```

## Editing Existing Data

Use `setFormValues` to populate the form when editing existing data:

```javascript
const EditForm = ({ userData }) => {
  const { form, handleChange, setFormValues, validate } = useForm(
    { nombre: "", email: "" },
    validateForm
  );

  // Load data when component mounts or userData changes
  useEffect(() => {
    if (userData) {
      setFormValues({
        nombre: userData.nombre || '',
        email: userData.email || ''
      });
    }
  }, [userData, setFormValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Update API...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
      />
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
      />
      <button type="submit">Actualizar</button>
    </form>
  );
};
```

## Advanced Patterns

### Conditional Validation

```javascript
const validateForm = (form) => {
  const errors = {};
  
  // Always required
  if (!form.nombre.trim()) errors.nombre = "Nombre requerido";
  
  // Conditional: email only required if mode is 'register'
  if (form.mode === 'register' && !form.email.trim()) {
    errors.email = "Email requerido para registro";
  }
  
  // Conditional: password required if creating new user
  if (form.mode === 'create' && !form.password) {
    errors.password = "Contraseña requerida";
  }
  
  return errors;
};
```

### Nested Object Fields

For nested objects, use dot notation in your `name` attributes:

```javascript
const { form, handleChange } = useForm({
  usuario: {
    nombre: '',
    direccion: {
      ciudad: '',
      pais: ''
    }
  }
});

// In JSX:
<input
  name="usuario.nombre"
  value={form.usuario.nombre}
  onChange={handleChange}
/>
<input
  name="usuario.direccion.ciudad"
  value={form.usuario.direccion.ciudad}
  onChange={handleChange}
/>
```

### Clearing Specific Errors

When user corrects a field, the error clears automatically with `handleChange`. For array fields, you may need to clear errors manually:

```javascript
const handlePasajeroChange = (index, field, value) => {
  handleArrayChange('pasajeros', index, field, value);
  // Clear error for this specific field
  if (errors[`pasajero_${index}_${field}`]) {
    setErrors(prev => ({ ...prev, [`pasajero_${index}_${field}`]: null }));
  }
};
```

## Best Practices

### 1. Always Use `name` Attribute

The `handleChange` function expects inputs to have a `name` attribute matching the form field:

```javascript
// ✅ Correct
<input name="email" onChange={handleChange} />

// ❌ Wrong - won't work
<input onChange={(e) => handleChange(e)} /> // Missing name
```

### 2. Validation Function Should Return Empty Object if Valid

```javascript
const validateForm = (form) => {
  const errors = {};
  
  if (!form.nombre.trim()) {
    errors.nombre = "Nombre requerido";
  }
  
  // If no errors, return empty object
  return errors;
};
```

### 3. Display Errors Near Fields

Show validation errors immediately below or next to the corresponding field:

```javascript
<div>
  <label>Email</label>
  <input
    name="email"
    value={form.email}
    onChange={handleChange}
    className={errors.email ? 'border-red-500' : 'border-gray-300'}
  />
  {errors.email && (
    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
  )}
</div>
```

### 4. Use `resetForm` After Successful Submission

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  await submitToAPI(form);
  resetForm(); // Clear form after success
};
```

### 5. Initialize Arrays in `initialForm`

Always initialize arrays even if empty:

```javascript
const { form } = useForm({
  nombre: '',
  pasajeros: [] // ✅ Initialize as empty array
}, validateForm);
```

## Migration from Manual State

### Before (Manual useState)

```javascript
const [formData, setFormData] = useState({
  nombre: '',
  email: ''
});
const [errors, setErrors] = useState({});

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: null }));
  }
};

const validate = () => {
  const newErrors = {};
  if (!formData.nombre.trim()) newErrors.nombre = "Nombre requerido";
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### After (Using useForm)

```javascript
const validateForm = (form) => {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = "Nombre requerido";
  return errors;
};

const { form, errors, handleChange, validate } = useForm(
  { nombre: '', email: '' },
  validateForm
);
```

**Benefits:**
- Less code (~50% reduction)
- No manual error clearing
- Consistent pattern across components
- Built-in array support
- Easier to test and maintain

## Common Use Cases

### Login Form

```javascript
const LoginForm = () => {
  const validateForm = (form) => {
    const errors = {};
    if (!form.email) errors.email = "Email requerido";
    if (!form.password) errors.password = "Contraseña requerida";
    return errors;
  };

  const { form, errors, handleChange, validate } = useForm(
    { email: '', password: '' },
    validateForm
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Login logic...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={form.email} onChange={handleChange} />
      {errors.email && <span>{errors.email}</span>}
      
      <input name="password" type="password" value={form.password} onChange={handleChange} />
      {errors.password && <span>{errors.password}</span>}
      
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
};
```

### Multi-Step Form with Passengers

```javascript
const BookingForm = ({ cotizacion }) => {
  const { form, handleArrayChange, addArrayItem, removeArrayItem, validate } = useForm(
    {
      contacto_nombre: '',
      contacto_telefono: '',
      pasajeros: cotizacion?.pasajeros?.map(p => ({
        nombres: '',
        apellidos: '',
        tipo: p.tipo,
        orden: p.orden
      })) || []
    },
    (form) => {
      const errors = {};
      if (!form.contacto_nombre) errors.contacto_nombre = 'Requerido';
      if (!form.contacto_telefono) errors.contacto_telefono = 'Requerido';
      if (form.pasajeros.length === 0) errors.pasajeros = 'Agrega pasajeros';
      return errors;
    }
  );

  // ... rest of component
};
```

## Troubleshooting

### Input Not Updating Value

**Problem:** Input value doesn't change when typing.

**Solution:** Ensure the input has a `name` attribute matching the form field:
```javascript
<input name="email" value={form.email} onChange={handleChange} />
```

### Validation Not Running

**Problem:** Form submits even with invalid data.

**Solution:** Always call `validate()` and check its return value:
```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  if (!validate()) return; // Stop if invalid
  // Submit...
};
```

### Array Operations Not Working

**Problem:** Array functions throw warnings or don't update.

**Solution:** Ensure the field is initialized as an array in `initialForm`:
```javascript
const { form } = useForm({
  items: [] // Must be array, not undefined
}, validateForm);
```

## API Reference

### Parameters

- **`initialForm`** (object): Initial form state. All fields should be initialized.
- **`validateForm`** (function, optional): Validation function that receives the form and returns an errors object.

### Return Value

Returns an object with:

- **`form`** (object): Current form state
- **`errors`** (object): Current validation errors
- **`handleChange`** (function): Handler for input changes (expects `name` attribute)
- **`validate`** (function): Runs validation, returns `true` if valid, `false` otherwise
- **`resetForm`** (function): Resets form to initial values and clears errors
- **`setFormValues`** (function): Sets multiple form values at once
- **`handleArrayChange`** (function): Updates a field in an array item
- **`addArrayItem`** (function): Adds a new item to an array
- **`removeArrayItem`** (function): Removes an item from an array
- **`moveArrayItem`** (function): Moves an item within an array
- **`setArrayValue`** (function): Replaces an entire array

## Summary

The `useForm` hook provides a complete solution for form management in React:
- Eliminates repetitive `useState` boilerplate
- Built-in validation with error handling
- Support for simple and complex forms
- Array field management for lists and nested data
- Easy data loading for edit scenarios
- Consistent pattern across your application

Use it for all new forms and refactor existing manual state management to use this hook.
