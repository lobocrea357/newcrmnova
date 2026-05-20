import { MessageSquare, FileText, CreditCard, ArrowRight, Eye } from "lucide-react";
import ComparisonBadge from "./ComparisonBadge";
import StatusBadge from "./StatusBadge";

export default function ThreadRow({ thread }) {
  const metrics = thread.metrics?.[0];
  const status = thread.status?.[0];
  const chats = thread.chats || [];
  const isFragmented = chats.length > 1;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${isFragmented ? 'bg-amber-50 border-l-4 border-amber-400' : ''}`}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          {/* Customer Info */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">
              {thread.customer_name || 'Sin nombre'}
            </h3>
            <span className="text-sm text-gray-500 font-mono">
              {thread.customer_phone}
            </span>
            {status && status.current_status && (
              <StatusBadge status={status.current_status} size="sm" />
            )}
            {isFragmented && (
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold border border-amber-300">
                🔀 FRAGMENTADO ({chats.length} chats)
              </span>
            )}
          </div>

          {/* Timeline de Reasignaciones */}
          {isFragmented && (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Reasignaciones:</span>
              {chats.map((chat, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-200">
                    {chat.bot_name || 'Bot desconocido'}
                  </span>
                  {idx < chats.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Métricas */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded border border-slate-200">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">
                {metrics?.total_messages || 0}
              </span>
              <span className="text-xs text-gray-500">mensajes</span>
            </div>

            {metrics?.cotizacion_count > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded border border-green-200">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {metrics.cotizacion_count}
                </span>
                <span className="text-xs text-green-600">cotización(es)</span>
              </div>
            )}

            {metrics?.payment_mentions > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">
                  {metrics.payment_mentions}
                </span>
                <span className="text-xs text-amber-600">mención(es) pago</span>
              </div>
            )}

            {thread.last_message_at && (
              <span className="text-xs text-gray-500">
                Última actividad: {formatDate(thread.last_message_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => window.location.href = `/conversaciones-poc/${thread.id}/timeline`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Ver Timeline</span>
          </button>
          <ComparisonBadge
            isFragmented={isFragmented}
            chatsCount={chats.length}
          />
        </div>
      </div>
    </div>
  );
}
