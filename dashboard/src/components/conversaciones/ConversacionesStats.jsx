import { FileText } from 'lucide-react'

/**
 * Componente para mostrar contadores de conversaciones y cotizaciones por bot
 * Comentado en page.js para simplificar la UI, disponible para uso futuro
 */
export default function ConversacionesStats({ bot, botCotizaciones }) {
  return (
    <div className="flex flex-col items-end flex-shrink-0 gap-1">
      <span className="text-sm font-semibold text-gray-900">
        <span translate="no">{bot.conversation_count || 0}</span>
      </span>
      <span className="text-xs text-gray-500">
        <span>Conversaciones</span>
      </span>
      {botCotizaciones[bot.id] > 0 && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium border border-green-200 cursor-help"
          title={`${botCotizaciones[bot.id]} cotización(es) enviadas`}
        >
          <FileText className="h-3 w-3" />
          {botCotizaciones[bot.id]}
        </span>
      )}
    </div>
  )
}
