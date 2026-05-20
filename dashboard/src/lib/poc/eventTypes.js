/**
 * Constantes y metadata para tipos de eventos del sistema POC
 */

export const EVENT_TYPES = {
  SALE_CONFIRMED: 'SALE_CONFIRMED',
  SALE_CANCELLED: 'SALE_CANCELLED',
  QUOTATION_SENT: 'QUOTATION_SENT',
  QUOTATION_ACCEPTED: 'QUOTATION_ACCEPTED',
  MEETING_SCHEDULED: 'MEETING_SCHEDULED',
  CALL_MADE: 'CALL_MADE',
  LEAD_LOST: 'LEAD_LOST',
  LEAD_REACTIVATED: 'LEAD_REACTIVATED',
  REASSIGNMENT: 'REASSIGNMENT',
  NOTE_ADDED: 'NOTE_ADDED',
  STATUS_CHANGED: 'STATUS_CHANGED'
};

export const EVENT_SUBTYPES = {
  AUTO_DETECTED: 'AUTO_DETECTED',
  MANUAL_MARK: 'MANUAL_MARK'
};

/**
 * Metadata de tipos de eventos
 * Incluye etiquetas, iconos, colores y descripciones
 */
export const EVENT_METADATA = {
  [EVENT_TYPES.SALE_CONFIRMED]: {
    label: 'Venta Confirmada',
    icon: '🎉',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    description: 'Venta concretada exitosamente',
    isMilestone: true
  },
  [EVENT_TYPES.SALE_CANCELLED]: {
    label: 'Venta Cancelada',
    icon: '❌',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    description: 'Venta cancelada por el cliente',
    isMilestone: true
  },
  [EVENT_TYPES.QUOTATION_SENT]: {
    label: 'Cotización Enviada',
    icon: '📄',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    description: 'Cotización enviada al cliente',
    isMilestone: true
  },
  [EVENT_TYPES.QUOTATION_ACCEPTED]: {
    label: 'Cotización Aceptada',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    description: 'Cliente aceptó la cotización',
    isMilestone: true
  },
  [EVENT_TYPES.MEETING_SCHEDULED]: {
    label: 'Reunión Agendada',
    icon: '📅',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    description: 'Reunión agendada con el cliente',
    isMilestone: true
  },
  [EVENT_TYPES.CALL_MADE]: {
    label: 'Llamada Realizada',
    icon: '📞',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    description: 'Llamada telefónica realizada',
    isMilestone: false
  },
  [EVENT_TYPES.LEAD_LOST]: {
    label: 'Lead Perdido',
    icon: '💔',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    description: 'Lead marcado como perdido',
    isMilestone: true
  },
  [EVENT_TYPES.LEAD_REACTIVATED]: {
    label: 'Lead Reactivado',
    icon: '🔄',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    description: 'Lead reactivado después de estar perdido',
    isMilestone: true
  },
  [EVENT_TYPES.REASSIGNMENT]: {
    label: 'Reasignación',
    icon: '🔄',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    description: 'Asesor reasignado a otro bot',
    isMilestone: true
  },
  [EVENT_TYPES.NOTE_ADDED]: {
    label: 'Nota Agregada',
    icon: '📝',
    color: 'slate',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    description: 'Nota agregada al thread',
    isMilestone: false
  },
  [EVENT_TYPES.STATUS_CHANGED]: {
    label: 'Estado Cambiado',
    icon: '📊',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    description: 'Estado del lead cambiado manualmente',
    isMilestone: true
  }
};

/**
 * Estados válidos de leads
 */
export const LEAD_STATUS = {
  NUEVO: 'NUEVO',
  EN_NEGOCIACION: 'EN_NEGOCIACION',
  VENTA_CONCRETADA: 'VENTA_CONCRETADA',
  POST_VENTA: 'POST_VENTA',
  PERDIDO: 'PERDIDO'
};

/**
 * Metadata de estados de leads
 */
export const STATUS_METADATA = {
  [LEAD_STATUS.NUEVO]: {
    label: 'Nuevo',
    icon: '🆕',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    description: 'Primer contacto, sin interacción profunda'
  },
  [LEAD_STATUS.EN_NEGOCIACION]: {
    label: 'En Negociación',
    icon: '💬',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    description: 'Conversando, enviando cotizaciones'
  },
  [LEAD_STATUS.VENTA_CONCRETADA]: {
    label: 'Venta Concretada',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    description: 'Cliente compró'
  },
  [LEAD_STATUS.POST_VENTA]: {
    label: 'Post-Venta',
    icon: '📦',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    description: 'Seguimiento post-compra'
  },
  [LEAD_STATUS.PERDIDO]: {
    label: 'Perdido',
    icon: '❌',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    description: 'Cliente no compró / no responde'
  }
};

/**
 * Función helper para obtener metadata de un evento
 */
export const getEventMetadata = (eventType) => {
  return EVENT_METADATA[eventType] || {
    label: eventType,
    icon: '📌',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    description: 'Evento desconocido',
    isMilestone: false
  };
};

/**
 * Función helper para obtener metadata de un estado
 */
export const getStatusMetadata = (status) => {
  return STATUS_METADATA[status] || {
    label: status,
    icon: '❓',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    description: 'Estado desconocido'
  };
};

/**
 * Función helper para formatear fecha de evento
 */
export const formatEventDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};
