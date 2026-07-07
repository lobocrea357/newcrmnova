/**
 * Ejemplos de uso del componente Modal
 * 
 * Este archivo contiene ejemplos de cómo usar el Modal en diferentes escenarios
 */

import Modal from './Modal';

// ============================================
// EJEMPLO 1: Modal Simple
// ============================================
const SimpleModal = ({ isOpen, onClose }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="Información"
  >
    <p>Este es un modal simple con el contenido básico.</p>
  </Modal>
);

// ============================================
// EJEMPLO 2: Modal de Confirmación (Danger)
// ============================================
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="Confirmar Eliminación"
    variant="danger"
    size="md"
    footer={
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    }
  >
    <p className="text-gray-700">
      ¿Estás seguro de eliminar <strong>{itemName}</strong>? Esta acción no se puede deshacer.
    </p>
  </Modal>
);

// ============================================
// EJEMPLO 3: Modal de Éxito
// ============================================
const SuccessModal = ({ isOpen, onClose, message }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="¡Operación Exitosa!"
    variant="success"
    size="sm"
    footer={
      <button
        onClick={onClose}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full"
      >
        Aceptar
      </button>
    }
  >
    <p className="text-gray-700">{message}</p>
  </Modal>
);

// ============================================
// EJEMPLO 4: Modal con Formulario y Loading
// ============================================
const FormModal = ({ isOpen, onClose, onSubmit, loading }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="Crear Nuevo Elemento"
    variant="default"
    size="lg"
    loading={loading}
    footer={
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    }
  >
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Ej: Mi elemento"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Describe el elemento..."
        />
      </div>
    </form>
  </Modal>
);

// ============================================
// EJEMPLO 5: Modal Grande con Contenido Extensivo
// ============================================
const LargeModal = ({ isOpen, onClose }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="Detalles Completos"
    variant="default"
    size="3xl"
    bodyClassName="p-8"
  >
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold mb-3">Información General</h3>
        <p className="text-gray-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </section>
      <section>
        <h3 className="text-lg font-semibold mb-3">Detalles Específicos</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Primer detalle importante</li>
          <li>Segundo detalle importante</li>
          <li>Tercer detalle importante</li>
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-semibold mb-3">Configuración</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Configuración avanzada del elemento con opciones adicionales.
          </p>
        </div>
      </section>
    </div>
  </Modal>
);

// ============================================
// EJEMPLO 6: Modal Dark Mode
// ============================================
const DarkModal = ({ isOpen, onClose }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="Configuración del Sistema"
    variant="dark"
    size="lg"
    footer={
      <button
        onClick={onClose}
        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 w-full"
      >
        Cerrar
      </button>
    }
  >
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Modo oscuro</span>
        <div className="w-12 h-6 bg-gray-700 rounded-full relative">
          <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Notificaciones</span>
        <div className="w-12 h-6 bg-blue-600 rounded-full relative">
          <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
        </div>
      </div>
    </div>
  </Modal>
);

// ============================================
// EJEMPLO 7: Modal con Estilos Personalizados
// ============================================
const CustomStyledModal = ({ isOpen, onClose }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    titulo="Modal Personalizado"
    variant="default"
    size="xl"
    headerClassName="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
    titleClassName="text-white"
    bodyClassName="bg-gradient-to-b from-gray-50 to-white"
    modalClassName="border-4 border-purple-500"
  >
    <p className="text-gray-700">
      Este modal tiene estilos personalizados usando las props de className.
    </p>
  </Modal>
);

// ============================================
// EJEMPLO 8: Modal sin Título (Solo Body)
// ============================================
const TitlelessModal = ({ isOpen, onClose }) => (
  <Modal
    onShow={isOpen}
    onClose={onClose}
    variant="default"
    size="md"
  >
    <div className="text-center">
      <div className="mb-4">
        <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">Información Importante</h3>
      <p className="text-gray-600 mb-4">
        Este modal no tiene título pero muestra contenido personalizado.
      </p>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Entendido
      </button>
    </div>
  </Modal>
);

export {
  SimpleModal,
  DeleteConfirmationModal,
  SuccessModal,
  FormModal,
  LargeModal,
  DarkModal,
  CustomStyledModal,
  TitlelessModal,
};
