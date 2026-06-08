import { Clock3, CreditCard, FileText } from 'lucide-react'

/**
 * Componente para mostrar métricas de conversación
 * Comentado en page.js para simplificar la UI, disponible para uso futuro
 */
export default function ConversacionesMetrics({ conv, formatResponseTime }) {
  return (
    <>
      {conv.conversation_metrics?.response && (
        <div
          className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200"
          title="Tiempo promedio de respuesta del asesor"
        >
          <Clock3 className="h-3 w-3 text-indigo-500" />
          <span>
            {formatResponseTime(
              conv.conversation_metrics.response
                .averageMinutes,
            )}{" "}
            avg
          </span>
        </div>
      )}

      {conv.conversation_metrics?.paymentMentions && (
        <div
          className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
          title="La conversación menciona pagos o métodos de pago"
        >
          <CreditCard className="h-3 w-3" />
          <span>
            {
              conv.conversation_metrics.paymentMentions
                .count
            }{" "}
            mención(es)
          </span>
        </div>
      )}

      {conv.conversation_metrics?.cotizacionMentions && (
        <div
          className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 cursor-help"
          title={`Cotizaciones enviadas: ${conv.conversation_metrics.cotizacionMentions.files.join(', ')}`}
        >
          <FileText className="h-3 w-3" />
          <span>
            {conv.conversation_metrics.cotizacionMentions.count}{" "}
            cotización(es)
          </span>
        </div>
      )}

      <span className="text-sm font-semibold text-gray-900">
        {conv.message_count || 0} mensajes
      </span>
    </>
  )
}
