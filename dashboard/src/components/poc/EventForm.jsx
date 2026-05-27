import { useState } from 'react';
import { X, Calendar, DollarSign, FileText, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { EVENT_TYPES, EVENT_SUBTYPES } from '@/lib/poc/eventTypes';
import { POC_API } from '@/config/apiConfig';

/**
 * EventForm - Formulario para crear eventos manualmente
 * 
 * @param {Object} props
 * @param {string} props.threadId - ID del thread
 * @param {Function} props.onSuccess - Callback al crear evento exitosamente
 * @param {Function} props.onCancel - Callback al cancelar
 * @param {boolean} props.isOpen - Si el modal está abierto
 */
export default function EventForm({ threadId, onSuccess, onCancel, isOpen }) {
  const [eventType, setEventType] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [relatedVueloId, setRelatedVueloId] = useState('');
  const [relatedCotizacionId, setRelatedCotizacionId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!eventType) {
      setError('Debes seleccionar un tipo de evento');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const eventData = {
        event_type: eventType,
        event_subtype: EVENT_SUBTYPES.MANUAL_MARK,
        occurred_at: new Date(occurredAt).toISOString(),
        notes: notes || null,
        related_vuelo_id: relatedVueloId || null,
        related_cotizacion_id: relatedCotizacionId || null,
        is_milestone: true
      };

      // Si es venta, agregar monto
      if (eventType === EVENT_TYPES.VENTA_CONFIRMADA && amount) {
        eventData.event_data = { amount: parseFloat(amount) };
      }

      const response = await fetch(POC_API.createEvent(threadId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error creando evento');
      }

      // Reset form
      setEventType('');
      setNotes('');
      setRelatedVueloId('');
      setRelatedCotizacionId('');
      setAmount('');

      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (err) {
      console.error('[EventForm] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSale = async () => {
    if (!amount) {
      setError('Debes ingresar el monto de la venta');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const saleData = {
        occurred_at: new Date(occurredAt).toISOString(),
        amount: parseFloat(amount),
        vuelo_id: relatedVueloId || null,
        notes: notes || null
      };

      const response = await fetch(POC_API.markSale(threadId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error marcando venta');
      }

      // Reset form
      setAmount('');
      setNotes('');
      setRelatedVueloId('');

      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (err) {
      console.error('[EventForm] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Marcar Evento Manual
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Tipo de evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Evento
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Seleccionar...</option>
              <option value={EVENT_TYPES.VENTA_CONFIRMADA}>🎉 Venta Confirmada</option>
              <option value={EVENT_TYPES.VENTA_CANCELADA}>❌ Venta Cancelada</option>
              <option value={EVENT_TYPES.COTIZACION_ENVIADA}>📄 Cotización Enviada</option>
              <option value={EVENT_TYPES.COTIZACION_ACEPTADA}>✅ Cotización Aceptada</option>
              <option value={EVENT_TYPES.REUNION_AGENDADA}>📅 Reunión Agendada</option>
              <option value={EVENT_TYPES.LLAMADA_REALIZADA}>📞 Llamada Realizada</option>
              <option value={EVENT_TYPES.LEAD_PERDIDO}>💔 Lead Perdido</option>
              <option value={EVENT_TYPES.LEAD_REACTIVADO}>🔄 Lead Reactivado</option>
              <option value={EVENT_TYPES.REASIGNACION}>🔄 Reasignación</option>
              <option value={EVENT_TYPES.NOTA_AGREGADA}>📝 Nota Agregada</option>
              <option value={EVENT_TYPES.ESTADO_CAMBIADO}>📊 Estado Cambiado</option>
            </select>
          </div>

          {/* Fecha y hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha y Hora del Evento
              </div>
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Campos condicionales para venta */}
          {eventType === EVENT_TYPES.VENTA_CONFIRMADA && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monto de la Venta
                  </div>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ID del Vuelo (opcional)
                  </div>
                </label>
                <input
                  type="text"
                  value={relatedVueloId}
                  onChange={(e) => setRelatedVueloId(e.target.value)}
                  placeholder="UUID del vuelo relacionado"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {/* Campos opcionales para otros eventos */}
          {eventType && eventType !== EVENT_TYPES.VENTA_CONFIRMADA && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ID del Vuelo (opcional)
                  </div>
                </label>
                <input
                  type="text"
                  value={relatedVueloId}
                  onChange={(e) => setRelatedVueloId(e.target.value)}
                  placeholder="UUID del vuelo relacionado"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ID de la Cotización (opcional)
                  </div>
                </label>
                <input
                  type="text"
                  value={relatedCotizacionId}
                  onChange={(e) => setRelatedCotizacionId(e.target.value)}
                  placeholder="UUID de la cotización relacionada"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notas (opcional)
              </div>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega notas adicionales sobre este evento..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            {eventType === EVENT_TYPES.VENTA_CONFIRMADA ? (
              <button
                type="button"
                onClick={handleMarkSale}
                disabled={loading || !amount}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : '🎉 Marcar Venta'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !eventType}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Crear Evento'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
