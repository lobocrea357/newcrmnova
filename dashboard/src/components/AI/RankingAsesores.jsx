import React from 'react';
import { Trophy, TrendingUp, AlertCircle, Phone, MessageSquare } from 'lucide-react';

export default function RankingAsesores({ evaluations = [] }) {
  // Procesar evaluaciones para agrupar por asesor
  const asesoresMap = evaluations.reduce((acc, curr) => {
    const botId = curr.bot_id;
    if (!botId) return acc;

    if (!acc[botId]) {
      acc[botId] = {
        name: curr.bot?.session_name || 'Desconocido',
        total_evaluations: 0,
        total_score: 0,
        ventas_confirmadas: 0,
        ofrecio_scalapay: 0,
        intentos_cierre: 0,
        errores_graves: 0
      };
    }

    acc[botId].total_evaluations++;
    acc[botId].total_score += curr.score;
    if (curr.venta_confirmada) acc[botId].ventas_confirmadas++;
    if (curr.ofrecio_scalapay) acc[botId].ofrecio_scalapay++;
    if (curr.cierre_intencion) acc[botId].intentos_cierre++;
    
    // Suponemos que un score bajo (ej. < 40) o algún campo en feedback indica error grave
    if (curr.score < 40) acc[botId].errores_graves++;

    return acc;
  }, {});

  const ranking = Object.values(asesoresMap)
    .map(asesor => ({
      ...asesor,
      average_score: Math.round(asesor.total_score / asesor.total_evaluations)
    }))
    .sort((a, b) => b.average_score - a.average_score);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Ranking Calidad IA</h2>
        </div>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Hoy
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium">
            <tr>
              <th className="px-6 py-4 text-left">Asesor</th>
              <th className="px-6 py-4 text-center">Score (IA)</th>
              <th className="px-6 py-4 text-center">Ventas</th>
              <th className="px-6 py-4 text-center">Scalapay</th>
              <th className="px-6 py-4 text-center">Errores Crit.</th>
              <th className="px-6 py-4 text-center">Evaluados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranking.map((asesor, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-200 text-gray-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{asesor.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                    ${asesor.average_score >= 80 ? 'bg-green-100 text-green-800' : 
                      asesor.average_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {asesor.average_score}/100
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    {asesor.ventas_confirmadas}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                  {Math.round((asesor.ofrecio_scalapay / asesor.total_evaluations) * 100) || 0}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  {asesor.errores_graves > 0 ? (
                    <span className="text-red-600 flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {asesor.errores_graves}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {asesor.total_evaluations}
                </td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                    <p>No hay evaluaciones de IA todavía para hoy.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
