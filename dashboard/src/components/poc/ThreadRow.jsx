import { MessageSquare, FileText, CreditCard, ArrowRight, Bot } from "lucide-react";
import ComparisonBadge from "./ComparisonBadge";
import StatusBadge from "./StatusBadge";

export default function ThreadRow({ thread }) {
  const metrics = thread.metrics?.[0];
  const status = thread.status; // Es un objeto, no un array (relación 1:1)
  const chats = thread.chats || [];
  const isFragmented = chats.length > 1;

  // Obtener el bot actual (el último en la lista, ordenado por started_at)
  const currentBot = chats.length > 0
    ? chats.reduce((latest, chat) => {
      const latestDate = new Date(latest.started_at || 0);
      const chatDate = new Date(chat.started_at || 0);
      return chatDate > latestDate ? chat : latest;
    }, chats[0])
    : null;

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
    <div
      onClick={() => window.location.href = `/conversaciones-poc/${thread.id}/timeline`}
      className={`p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${isFragmented ? 'bg-amber-50 border-l-4 border-amber-400' : ''} hover:shadow-md`}
    >
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Estado:</span>
                <StatusBadge status={status.current_status} size="sm" />
              </div>
            )}
            {status && status.current_status === 'VENTA_CONCRETADA' && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border-2 border-green-400 flex items-center gap-1.5 shadow-sm">
                ✅ Cliente Compró
              </span>
            )}
            {isFragmented && (
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold border border-amber-300">
                🔀 FRAGMENTADO ({chats.length} chats)
              </span>
            )}
          </div>

          {/* Bot Actual */}
          {currentBot && (
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-gray-600">
                Atendido por: <span className="font-semibold text-indigo-700">{currentBot.bot_name || 'Bot desconocido'}</span>
              </span>
              {isFragmented && (
                <span className="text-xs text-gray-500">
                  (de {chats.length} asesores)
                </span>
              )}
            </div>
          )}

          {/* Timeline de Reasignaciones */}
          {isFragmented && (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Historial:</span>
              {chats
                .sort((a, b) => new Date(a.started_at || 0) - new Date(b.started_at || 0))
                .map((chat, idx) => (
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
          <ComparisonBadge
            isFragmented={isFragmented}
            chatsCount={chats.length}
          />
          <div className="text-gray-400">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
