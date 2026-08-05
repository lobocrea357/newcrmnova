import React from 'react';
import { ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function AuditorAlerts({ evaluations = [] }) {
  // Solo mostramos alertas recientes de fallos (ej. score < 60 o no ofreció scalapay, etc)
  const alerts = evaluations
    .filter(e => e.score < 60 || (!e.ofrecio_scalapay && !e.venta_confirmada))
    .slice(0, 10); // Últimas 10 alertas

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900">Alertas del Auditor</h2>
      </div>
      <div className="p-0">
        {alerts.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-gray-500">
            <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
            <p className="text-center font-medium">Todo en orden</p>
            <p className="text-sm text-center">No hay alertas críticas en los chats auditados hoy.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {alerts.map((alert) => {
              // Extraer un poco de info del JSON
              let feedbackData = {};
              try {
                if (typeof alert.ai_feedback === 'string') {
                  feedbackData = JSON.parse(alert.ai_feedback);
                } else {
                  feedbackData = alert.ai_feedback;
                }
              } catch (e) {}
              
              const isCritical = alert.score < 40;
              
              return (
                <li key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {isCritical ? (
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                      ) : (
                        <Info className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {alert.bot?.session_name || 'Asesor'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.evaluation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Chat con <strong>{alert.chat?.contact_name || 'Cliente'}</strong> (Score: {alert.score}/100)
                      </p>
                      
                      <div className="text-xs text-gray-700 bg-gray-100 rounded p-2">
                        {feedbackData.justification || 'Falta información en el feedback o no se ofreció Scalapay y opciones adecuadamente.'}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
