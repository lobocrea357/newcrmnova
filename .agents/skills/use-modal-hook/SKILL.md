---
name: use-modal-hook
description: How to use the useModal custom hook for managing modal state, data passing, and save handlers in React components. Use this skill whenever the user is creating or working with modals, dialogs, popups, or any overlay UI components. This includes scenarios like creating/editing items in modals, confirmation dialogs, form modals with data loading, modal state management with useState, and implementing modal patterns with refetch functionality after save operations.
---

# useModal Hook Guide

Complete guide for using the `useModal` custom hook to manage modal state, data passing, and save handlers in React components.

## When to Use

Use `useModal` whenever you need to:
- Open/close modals without manual `useState` boilerplate
- Pass data to modals when opening (e.g., edit an item)
- Handle modal save operations with automatic refetch
- Manage multiple modals in a single component
- Clean up modal state after operations

## Hook Location

```javascript
import { useModal } from '@/hooks/useModal';
```

## Basic Usage

### Simple Modal (No Data)

```javascript
import { useModal } from '@/hooks/useModal';

const MyComponent = () => {
  const {
    isOpen,
    open,
    close
  } = useModal();

  return (
    <div>
      <button onClick={open}>Abrir Modal</button>
      
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Modal Simple</h2>
            <p>Contenido del modal</p>
            <button onClick={close}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Modal with Data (Edit Pattern)

```javascript
import { useModal } from '@/hooks/useModal';

const UserList = () => {
  const {
    isOpen,
    openWithData,
    close,
    data: selectedUser
  } = useModal();

  const users = [
    { id: 1, name: 'Juan', email: 'juan@example.com' },
    { id: 2, name: 'Maria', email: 'maria@example.com' }
  ];

  return (
    <div>
      <h2>Usuarios</h2>
      {users.map(user => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => openWithData(user)}>
            Editar
          </button>
        </div>
      ))}

      {isOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={close}
        />
      )}
    </div>
  );
};
```

## Modal with Save Handler and Refetch

The most common pattern: open a modal, save data, and refresh the list after save.

```javascript
import { useModal } from '@/hooks/useModal';

const Dashboard = () => {
  const {
    isOpen: showCrearModal,
    open: openCrearModal,
    close: closeCrearModal,
    createModalSaveHandler: onSaveEvento
  } = useModal();

  const [eventos, setEventos] = useState([]);

  const refetch = async () => {
    const response = await fetch('/api/eventos');
    const data = await response.json();
    setEventos(data);
  };

  // Load data on mount
  useEffect(() => {
    refetch();
  }, []);

  return (
    <div>
      <button onClick={openCrearModal}>Crear Evento</button>

      {showCrearModal && (
        <ModalCrearEvento
          onShow={showCrearModal}
          onClose={closeCrearModal}
          onSave={onSaveEvento(refetch)} // ← Auto-refetch after save
        />
      )}

      <ul>
        {eventos.map(evento => (
          <li key={evento.id}>{evento.nombre}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Multiple Modals in One Component

```javascript
import { useModal } from '@/hooks/useModal';

const Dashboard = () => {
  // Modal para crear
  const {
    isOpen: showCrearModal,
    open: openCrearModal,
    close: closeCrearModal,
    createModalSaveHandler: onSaveEvento
  } = useModal();

  // Modal para ver detalles
  const {
    isOpen: showVistaModal,
    close: closeVistaModal,
    data: verEvento,
    openWithData: openVistaModalWithData
  } = useModal();

  // Modal para editar
  const {
    isOpen: showEditarModal,
    close: closeEditarModal,
    data: editarEvento,
    openWithData: openEditarModalWithData,
    createModalSaveHandler: onSaveEditarEvento
  } = useModal();

  const refetch = async () => {
    // Fetch events...
  };

  return (
    <div>
      <button onClick={openCrearModal}>Crear Evento</button>

      {eventos.map(evento => (
        <div key={evento.id}>
          <button onClick={() => openVistaModalWithData(evento)}>
            Vista
          </button>
          <button onClick={() => openEditarModalWithData(evento)}>
            Editar
          </button>
        </div>
      ))}

      {/* Crear Modal */}
      {showCrearModal && (
        <ModalCrearEvento
          onShow={showCrearModal}
          onClose={closeCrearModal}
          onSave={onSaveEvento(refetch)}
        />
      )}

      {/* Vista Modal */}
      {showVistaModal && verEvento && (
        <ModalVistaEvento
          onShow={showVistaModal}
          onClose={closeVistaModal}
          evento={verEvento}
        />
      )}

      {/* Editar Modal */}
      {showEditarModal && editarEvento && (
        <ModalEditarEvento
          onShow={showEditarModal}
          onClose={closeEditarModal}
          evento={editarEvento}
          onSave={onSaveEditarEvento(refetch)}
        />
      )}
    </div>
  );
};
```

## Generic Modal Component

The skill uses a generic `Modal` component located at `dashboard/src/components/Modal.jsx`. This component is fully configurable with variants, sizes, and custom styling.

**For complete usage examples, see:** `references/Modal.examples.jsx`

### Modal Component Features

The Modal component supports:

**Variants:** `default`, `danger`, `success`, `warning`, `dark`
- `default`: Standard white modal
- `danger`: Red-themed for destructive actions
- `success`: Green-themed for success messages
- `warning`: Yellow-themed for warnings
- `dark`: Dark mode modal

**Sizes:** `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`

**Additional Props:**
- `loading`: Show loading spinner overlay
- `footer`: Optional footer content
- `closeOnOverlayClick`: Close when clicking overlay (default: true)
- `closeOnEscape`: Close with Escape key (default: true)
- `headerClassName`, `bodyClassName`, `footerClassName`: Custom Tailwind classes
- `overlayClassName`, `modalClassName`, `titleClassName`: Additional styling

### Basic Usage

```javascript
import Modal from '@/components/Modal';

const MyModal = ({ isOpen, onClose }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="Mi Modal"
  >
    <p>Contenido del modal</p>
  </Modal>
);
```

### With Variant and Size

```javascript
<Modal
  onShow={showDeleteModal}
  onClose={closeDeleteModal}
  titulo="Confirmar Eliminación"
  variant="danger"
  size="lg"
  footer={
    <div className="flex gap-2">
      <button onClick={closeDeleteModal}>Cancelar</button>
      <button onClick={confirmDelete}>Eliminar</button>
    </div>
  }
>
  <p>¿Estás seguro de eliminar este elemento?</p>
</Modal>
```

### With Loading State

```javascript
<Modal
  onShow={showModal}
  onClose={onClose}
  titulo="Procesando"
  loading={isSubmitting}
>
  <p>Guardando datos...</p>
</Modal>
```

### With Custom Styling

```javascript
<Modal
  onShow={showModal}
  onClose={onClose}
  titulo="Modal Personalizado"
  variant="success"
  size="xl"
  headerClassName="bg-green-100"
  bodyClassName="p-8"
  modalClassName="border-4 border-green-500"
>
  <p>Contenido con estilos personalizados</p>
</Modal>
```

### Using Modal Component with useModal

```javascript
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

const CrearEventoModal = ({ onShow, onClose, onSave }) => {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    lugar: '',
    fecha_evento: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Save to API...
    await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    onSave(); // Trigger refetch and close
  };

  return (
    <Modal
      onShow={onShow}
      onClose={onClose}
      titulo="Crear Evento"
      sizeModal="lg"
    >
      <form onSubmit={handleSubmit}>
        <input
          value={form.nombre}
          onChange={(e) => setForm({...form, nombre: e.target.value})}
          placeholder="Nombre del evento"
        />
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({...form, descripcion: e.target.value})}
          placeholder="Descripción"
        />
        <input
          value={form.lugar}
          onChange={(e) => setForm({...form, lugar: e.target.value})}
          placeholder="Lugar"
        />
        <input
          type="date"
          value={form.fecha_evento}
          onChange={(e) => setForm({...form, fecha_evento: e.target.value})}
        />
        <button type="submit">Guardar</button>
      </form>
    </Modal>
  );
};

const Dashboard = () => {
  const {
    isOpen: showCrearModal,
    open: openCrearModal,
    close: closeCrearModal,
    createModalSaveHandler: onSaveEvento
  } = useModal();

  const refetch = async () => {
    // Fetch events...
  };

  return (
    <div>
      <button onClick={openCrearModal}>Crear Evento</button>

      {showCrearModal && (
        <CrearEventoModal
          onShow={showCrearModal}
          onClose={closeCrearModal}
          onSave={onSaveEvento(refetch)}
        />
      )}
    </div>
  );
};
```

## Complete Example: CRUD with Modals

```javascript
import { useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/Modal';

const EventosDashboard = () => {
  const [eventos, setEventos] = useState([]);

  // Modal crear
  const {
    isOpen: showCrearModal,
    open: openCrearModal,
    close: closeCrearModal,
    createModalSaveHandler: onSaveCrear
  } = useModal();

  // Modal editar
  const {
    isOpen: showEditarModal,
    close: closeEditarModal,
    data: eventoEditar,
    openWithData: openEditarModal,
    createModalSaveHandler: onSaveEditar
  } = useModal();

  // Modal vista
  const {
    isOpen: showVistaModal,
    close: closeVistaModal,
    data: eventoVer,
    openWithData: openVistaModal
  } = useModal();

  const refetch = async () => {
    try {
      const response = await fetch('/api/eventos');
      const data = await response.json();
      setEventos(data);
    } catch (error) {
      console.error('Error fetching eventos:', error);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;
    
    await fetch(`/api/eventos/${id}`, { method: 'DELETE' });
    refetch();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between mb-4">
        <h2>Eventos</h2>
        <button className="btn btn-primary" onClick={openCrearModal}>
          + Crear Evento
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map(evento => (
            <tr key={evento.id}>
              <td>{evento.nombre}</td>
              <td>{evento.fecha_evento}</td>
              <td>
                <button
                  className="btn btn-sm btn-info me-2"
                  onClick={() => openVistaModal(evento)}
                >
                  Vista
                </button>
                <button
                  className="btn btn-sm btn-primary me-2"
                  onClick={() => openEditarModal(evento)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(evento.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Crear */}
      {showCrearModal && (
        <ModalCrearEvento
          onShow={showCrearModal}
          onClose={closeCrearModal}
          onSave={onSaveCrear(refetch)}
        />
      )}

      {/* Modal Editar */}
      {showEditarModal && eventoEditar && (
        <ModalEditarEvento
          onShow={showEditarModal}
          onClose={closeEditarModal}
          evento={eventoEditar}
          onSave={onSaveEditar(refetch)}
        />
      )}

      {/* Modal Vista */}
      {showVistaModal && eventoVer && (
        <ModalVistaEvento
          onShow={showVistaModal}
          onClose={closeVistaModal}
          evento={eventoVer}
        />
      )}
    </div>
  );
};
```

## API Reference

### Parameters

- **`initialState`** (boolean, optional): Initial open state. Default: `false`

### Return Value

Returns an object with:

- **`isOpen`** (boolean): Current open state of the modal
- **`open`** (function): Opens the modal
- **`close`** (function): Closes the modal
- **`toggle`** (function): Toggles modal open/close
- **`data`** (any): Data passed to the modal via `openWithData`
- **`openWithData`** (function): Opens the modal and sets data
- **`createModalSaveHandler`** (function): Creates a save handler that closes modal and triggers refetch

### createModalSaveHandler Usage

```javascript
const createModalSaveHandler = (refetchFunction) => {
  return () => {
    if (refetchFunction && typeof refetchFunction === "function") {
      refetchFunction(); // Refresh data after save
    }
    close(); // Close modal
  };
};

// Usage:
const { createModalSaveHandler, close } = useModal();
const onSave = createModalSaveHandler(refetch);

// In modal component:
<Modal onSave={onSave} />
```

## Best Practices

### 1. Always Use Descriptive Variable Names

```javascript
// ✅ Good - Clear what each modal does
const {
  isOpen: showCrearModal,
  open: openCrearModal,
  close: closeCrearModal
} = useModal();

const {
  isOpen: showEditarModal,
  open: openEditarModal,
  close: closeEditarModal
} = useModal();

// ❌ Bad - Unclear
const { isOpen, open, close } = useModal();
const { isOpen: isOpen2, open: open2 } = useModal();
```

### 2. Check Data Before Rendering

```javascript
// ✅ Good - Check if data exists
{showEditarModal && editarEvento && (
  <ModalEditarEvento evento={editarEvento} />
)}

// ❌ Bad - May crash if data is undefined
{showEditarModal && (
  <ModalEditarEvento evento={editarEvento} />
)}
```

### 3. Use createModalSaveHandler for All Save Operations

```javascript
// ✅ Good - Automatic refetch and close
const onSave = createModalSaveHandler(refetch);
<Modal onSave={onSave} />

// ❌ Bad - Manual refetch and close
const handleSave = async () => {
  await saveData();
  refetch();
  close();
};
```

### 4. Separate Modal Components

Keep modal logic in separate components for reusability:

```javascript
// ✅ Good - Reusable modal component
const ModalCrearEvento = ({ onShow, onClose, onSave }) => {
  // Modal logic...
};

// ❌ Bad - Modal inline in parent
const Parent = () => {
  const { isOpen, close } = useModal();
  return (
    <>
      {isOpen && (
        <div>
          {/* All modal logic here... */}
        </div>
      )}
    </>
  );
};
```

### 5. Close Modal on Escape Key

```javascript
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  };
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [isOpen, close]);
```

## Migration from Manual State

### Before (Manual useState)

```javascript
const [showModal, setShowModal] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

const openModal = (item) => {
  setSelectedItem(item);
  setShowModal(true);
};

const closeModal = () => {
  setShowModal(false);
  setSelectedItem(null);
};

const handleSave = async () => {
  await saveData();
  refetch();
  closeModal();
};
```

### After (Using useModal)

```javascript
const {
  isOpen,
  openWithData,
  close,
  data: selectedItem,
  createModalSaveHandler
} = useModal();

const handleSave = async () => {
  await saveData();
  createModalSaveHandler(refetch)();
};
```

**Benefits:**
- Less code (~60% reduction)
- No manual data management
- Built-in refetch pattern
- Consistent across components
- Easier to test and maintain

## Common Patterns

### Confirmation Modal

```javascript
const ConfirmDeleteModal = ({ onShow, onClose, onConfirm, itemName }) => (
  <Modal onShow={onShow} onClose={onClose} titulo="Confirmar Eliminación">
    <p>¿Estás seguro de eliminar "{itemName}"?</p>
    <div className="d-flex gap-2">
      <button className="btn btn-secondary" onClick={onClose}>
        Cancelar
      </button>
      <button className="btn btn-danger" onClick={onConfirm}>
        Eliminar
      </button>
    </div>
  </Modal>
);

const ItemList = () => {
  const {
    isOpen: showConfirmModal,
    close: closeConfirmModal,
    data: itemToDelete,
    openWithData: openConfirmModal
  } = useModal();

  const handleDelete = (item) => {
    openConfirmModal(item);
  };

  const confirmDelete = async () => {
    await fetch(`/api/items/${itemToDelete.id}`, { method: 'DELETE' });
    refetch();
    closeConfirmModal();
  };

  return (
    <>
      {items.map(item => (
        <button key={item.id} onClick={() => handleDelete(item)}>
          Eliminar {item.name}
        </button>
      ))}

      {showConfirmModal && itemToDelete && (
        <ConfirmDeleteModal
          onShow={showConfirmModal}
          onClose={closeConfirmModal}
          onConfirm={confirmDelete}
          itemName={itemToDelete.name}
        />
      )}
    </>
  );
};
```

### Form Modal with Validation

```javascript
import { useForm } from '@/hooks/useForm';
import { useModal } from '@/hooks/useModal';

const UserFormModal = ({ onShow, onClose, onSave, user }) => {
  const validateForm = (form) => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'Nombre requerido';
    if (!form.email.trim()) errors.email = 'Email requerido';
    return errors;
  };

  const { form, errors, handleChange, validate, resetForm, setFormValues } = useForm(
    { nombre: '', email: '', roleId: '' },
    validateForm
  );

  // Load user data when editing
  useEffect(() => {
    if (user) {
      setFormValues({
        nombre: user.nombre || '',
        email: user.email || '',
        roleId: user.roleId || ''
      });
    }
  }, [user, setFormValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const url = user ? `/api/users/${user.id}` : '/api/users';
    const method = user ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    onSave();
    resetForm();
  };

  return (
    <Modal
      onShow={onShow}
      onClose={onClose}
      titulo={user ? 'Editar Usuario' : 'Crear Usuario'}
    >
      <form onSubmit={handleSubmit}>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className={errors.nombre ? 'border-red-500' : ''}
        />
        {errors.nombre && <span>{errors.nombre}</span>}

        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <span>{errors.email}</span>}

        <button type="submit">Guardar</button>
      </form>
    </Modal>
  );
};

const UserDashboard = () => {
  const {
    isOpen: showCrearModal,
    open: openCrearModal,
    close: closeCrearModal,
    createModalSaveHandler: onSaveUsuario
  } = useModal();

  const {
    isOpen: showEditarModal,
    close: closeEditarModal,
    data: usuarioEditar,
    openWithData: openEditarModal,
    createModalSaveHandler: onSaveEditar
  } = useModal();

  const refetch = async () => {
    // Fetch users...
  };

  return (
    <div>
      <button onClick={openCrearModal}>Crear Usuario</button>

      {showCrearModal && (
        <UserFormModal
          onShow={showCrearModal}
          onClose={closeCrearModal}
          onSave={onSaveUsuario(refetch)}
        />
      )}

      {showEditarModal && usuarioEditar && (
        <UserFormModal
          onShow={showEditarModal}
          onClose={closeEditarModal}
          onSave={onSaveEditar(refetch)}
          user={usuarioEditar}
        />
      )}
    </div>
  );
};
```

## Troubleshooting

### Modal Not Opening

**Problem:** Clicking the button doesn't open the modal.

**Solution:** Ensure you're using the correct function:
```javascript
// ✅ Correct
const { open } = useModal();
<button onClick={open}>Abrir</button>

// ❌ Wrong - function not called
const { open } = useModal();
<button onClick={() => open}>Abrir</button> // Missing ()
```

### Data Not Passing to Modal

**Problem:** Modal opens but data is undefined.

**Solution:** Use `openWithData` instead of `open`:
```javascript
// ✅ Correct
const { openWithData, data } = useModal();
<button onClick={() => openWithData(item)}>Editar</button>

// ❌ Wrong
const { open, data } = useModal();
<button onClick={() => open(item)}>Editar</button> // open() doesn't take data
```

### Refetch Not Running After Save

**Problem:** Data doesn't refresh after saving.

**Solution:** Use `createModalSaveHandler` correctly:
```javascript
// ✅ Correct
const onSave = createModalSaveHandler(refetch);
<Modal onSave={onSave} />

// ❌ Wrong - not calling the handler
<Modal onSave={createModalSaveHandler(refetch)} /> // Missing ()
```

### Multiple Modals Interfering

**Problem:** Closing one modal closes another.

**Solution:** Use separate instances of `useModal`:
```javascript
// ✅ Correct - Separate instances
const modal1 = useModal();
const modal2 = useModal();

// ❌ Wrong - Same instance
const modal = useModal();
// Using same modal for different purposes
```

## Summary

The `useModal` hook provides a complete solution for modal management in React:
- Eliminates repetitive `useState` boilerplate for modals
- Built-in data passing for edit scenarios
- Automatic refetch pattern with `createModalSaveHandler`
- Support for multiple modals in one component
- Consistent pattern across your application
- Easy to test and maintain

Use it for all new modals and refactor existing manual state management to use this hook. Combine with `useForm` for form modals for the best developer experience.
