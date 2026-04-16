/**
 * Ejemplos de uso del hook useForm
 * 
 * Este archivo contiene ejemplos de cómo usar el useForm en diferentes escenarios
 */

import { useForm } from '@/hooks/useForm';

// ============================================
// EJEMPLO 1: Formulario Simple con Validación
// ============================================
const SimpleForm = () => {
  const validateForm = (form) => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = "El nombre es requerido";
    if (!form.email.trim()) errors.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email inválido";
    }
    return errors;
  };

  const {
    form,
    errors,
    handleChange,
    validate,
    resetForm
  } = useForm(
    { nombre: '', email: '' },
    validateForm
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('Formulario válido:', form);
    resetForm();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre</label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className={errors.nombre ? 'border-red-500' : ''}
        />
        {errors.nombre && <span>{errors.nombre}</span>}
      </div>
      <div>
        <label>Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <span>{errors.email}</span>}
      </div>
      <button type="submit">Enviar</button>
    </form>
  );
};

// ============================================
// EJEMPLO 2: Formulario con Arrays (Lista de Pasajeros)
// ============================================
const PassengerForm = () => {
  const validateForm = (form) => {
    const errors = {};
    if (!form.pax_nombre.trim()) errors.pax_nombre = 'Nombre requerido';
    if (form.pasajeros.length === 0) errors.pasajeros = 'Agrega al menos un pasajero';
    return errors;
  };

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
    validateForm
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
      <div>
        <label>Nombre del Cliente</label>
        <input
          name="pax_nombre"
          value={form.pax_nombre}
          onChange={handleChange}
          className={errors.pax_nombre ? 'border-red-500' : ''}
        />
        {errors.pax_nombre && <span>{errors.pax_nombre}</span>}
      </div>

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
            <button
              type="button"
              onClick={() => removeArrayItem('pasajeros', index)}
            >
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

// ============================================
// EJEMPLO 3: Formulario de Edición con Carga de Datos
// ============================================
const EditUserForm = ({ userData }) => {
  const validateForm = (form) => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'Nombre requerido';
    if (!form.email.trim()) errors.email = 'Email requerido';
    return errors;
  };

  const {
    form,
    errors,
    handleChange,
    setFormValues,
    validate,
    resetForm
  } = useForm(
    { nombre: '', email: '', roleId: '' },
    validateForm
  );

  // Cargar datos cuando userData cambia
  useEffect(() => {
    if (userData) {
      setFormValues({
        nombre: userData.nombre || '',
        email: userData.email || '',
        roleId: userData.roleId || ''
      });
    }
  }, [userData, setFormValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('Actualizar usuario:', form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre</label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className={errors.nombre ? 'border-red-500' : ''}
        />
        {errors.nombre && <span>{errors.nombre}</span>}
      </div>
      <div>
        <label>Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <span>{errors.email}</span>}
      </div>
      <button type="submit">Actualizar</button>
    </form>
  );
};

// ============================================
// EJEMPLO 4: Validación Condicional
// ============================================
const ConditionalValidationForm = () => {
  const validateForm = (form) => {
    const errors = {};
    
    if (!form.nombre.trim()) errors.nombre = 'Nombre requerido';
    
    // Email solo requerido si mode es 'register'
    if (form.mode === 'register' && !form.email.trim()) {
      errors.email = 'Email requerido para registro';
    }
    
    // Password requerido si mode es 'create'
    if (form.mode === 'create' && !form.password) {
      errors.password = 'Contraseña requerida';
    }
    
    return errors;
  };

  const {
    form,
    errors,
    handleChange,
    validate
  } = useForm(
    { nombre: '', email: '', password: '', mode: 'create' },
    validateForm
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('Formulario válido:', form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre</label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
        />
        {errors.nombre && <span>{errors.nombre}</span>}
      </div>
      <div>
        <label>Modo</label>
        <select
          name="mode"
          value={form.mode}
          onChange={handleChange}
        >
          <option value="create">Crear</option>
          <option value="edit">Editar</option>
          <option value="register">Registrar</option>
        </select>
      </div>
      {form.mode === 'register' && (
        <div>
          <label>Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <span>{errors.email}</span>}
        </div>
      )}
      {form.mode === 'create' && (
        <div>
          <label>Contraseña</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password && <span>{errors.password}</span>}
        </div>
      )}
      <button type="submit">Enviar</button>
    </form>
  );
};

// ============================================
// EJEMPLO 5: Campos Anidados con Notación de Puntos
// ============================================
const NestedFieldsForm = () => {
  const validateForm = (form) => {
    const errors = {};
    if (!form.usuario.nombre.trim()) errors['usuario.nombre'] = 'Nombre requerido';
    if (!form.usuario.direccion.ciudad.trim()) {
      errors['usuario.direccion.ciudad'] = 'Ciudad requerida';
    }
    return errors;
  };

  const {
    form,
    errors,
    handleChange,
    validate
  } = useForm(
    {
      usuario: {
        nombre: '',
        direccion: {
          ciudad: '',
          pais: ''
        }
      }
    },
    validateForm
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('Formulario válido:', form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre</label>
        <input
          name="usuario.nombre"
          value={form.usuario.nombre}
          onChange={handleChange}
        />
        {errors['usuario.nombre'] && <span>{errors['usuario.nombre']}</span>}
      </div>
      <div>
        <label>Ciudad</label>
        <input
          name="usuario.direccion.ciudad"
          value={form.usuario.direccion.ciudad}
          onChange={handleChange}
        />
        {errors['usuario.direccion.ciudad'] && <span>{errors['usuario.direccion.ciudad']}</span>}
      </div>
      <div>
        <label>País</label>
        <input
          name="usuario.direccion.pais"
          value={form.usuario.direccion.pais}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Enviar</button>
    </form>
  );
};

// ============================================
// EJEMPLO 6: Reordenar Items (Drag & Drop)
// ============================================
const ReorderableListForm = () => {
  const {
    form,
    handleArrayChange,
    moveArrayItem,
    validate
  } = useForm(
    {
      items: [
        { id: 1, nombre: 'Item 1', prioridad: 1 },
        { id: 2, nombre: 'Item 2', prioridad: 2 },
        { id: 3, nombre: 'Item 3', prioridad: 3 }
      ]
    },
    () => ({})
  );

  const moveUp = (index) => {
    if (index > 0) {
      moveArrayItem('items', index, index - 1);
    }
  };

  const moveDown = (index) => {
    if (index < form.items.length - 1) {
      moveArrayItem('items', index, index + 1);
    }
  };

  return (
    <div>
      <h3>Lista Reordenable</h3>
      {form.items.map((item, index) => (
        <div key={item.id}>
          <input
            value={item.nombre}
            onChange={(e) => handleArrayChange('items', index, 'nombre', e.target.value)}
          />
          <button
            type="button"
            onClick={() => moveUp(index)}
            disabled={index === 0}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveDown(index)}
            disabled={index === form.items.length - 1}
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  );
};

// ============================================
// EJEMPLO 7: Reemplazar Array Completo
// ============================================
const ReplaceArrayForm = () => {
  const {
    form,
    setArrayValue,
    validate
  } = useForm(
    {
      opciones: ['Opción A', 'Opción B', 'Opción C']
    },
    () => ({})
  );

  const handleLoadFromAPI = async () => {
    // Simular carga desde API
    const nuevasOpciones = ['Opción X', 'Opción Y', 'Opción Z'];
    setArrayValue('opciones', nuevasOpciones);
  };

  return (
    <div>
      <h3>Opciones Actuales</h3>
      <ul>
        {form.opciones.map((opcion, index) => (
          <li key={index}>{opcion}</li>
        ))}
      </ul>
      <button onClick={handleLoadFromAPI}>
        Cargar desde API
      </button>
    </div>
  );
};

export {
  SimpleForm,
  PassengerForm,
  EditUserForm,
  ConditionalValidationForm,
  NestedFieldsForm,
  ReorderableListForm,
  ReplaceArrayForm,
};
