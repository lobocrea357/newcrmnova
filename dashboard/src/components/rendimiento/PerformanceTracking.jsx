"use client";

import React from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

/**
 * Componente de gráficos de seguimiento histórico del asesor
 * Muestra evolución de métricas a lo largo del tiempo
 */
export default function PerformanceTracking({ advisor, historicalData = [] }) {
  // Calcular estadísticas del histórico
  const calculateStats = (metric) => {
    if (!historicalData.length) return { avg: 0, trend: 'neutral', change: 0 };

    const values = historicalData.map(h => h.metrics[metric] ? 1 : 0);
    const avg = (values.reduce((a, b) => a + b, 0) / values.length * 100).toFixed(1);

    // Comparar últimos 3 vs primeros 3
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const change = ((recent - previous) * 100).toFixed(1);
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';

    return { avg, trend, change };
  };

  const metrics = [
    { key: 'tiempo_contacto', label: 'Tiempo de Primer Contacto', color: 'blue' },
    { key: 'tiempo_respuesta', label: 'Tiempo de Respuesta', color: 'green' },
    { key: 'tiempo_cotizacion', label: 'Tiempo de Cotización', color: 'purple' },
    { key: 'cierre_intencion', label: 'Cierre con Intención', color: 'indigo' },
    { key: 'ofrecio_scalapay', label: 'Ofreció Scalapay', color: 'pink' },
    { key: 'mas_dos_opciones', label: 'Más de 2 Opciones', color: 'orange' },
    { key: 'seguimiento_intencion', label: 'Seguimiento de Intención', color: 'teal' },
  ];

  const getColorClasses = (color, type = 'bg') => {
    const colors = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200' },
      green: { bg: 'bg-green-500', text: 'text-green-600', bgLight: 'bg-green-50', border: 'border-green-200' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50', border: 'border-purple-200' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', bgLight: 'bg-indigo-50', border: 'border-indigo-200' },
      pink: { bg: 'bg-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50', border: 'border-pink-200' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50', border: 'border-orange-200' },
      teal: { bg: 'bg-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50', border: 'border-teal-200' },
    };
    return colors[color][type];
  };

  if (!historicalData.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin Datos Históricos
          </h3>
          <p className="text-sm text-gray-600">
            Aún no hay análisis previos para mostrar el seguimiento del asesor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-xl font-bold">Seguimiento de Rendimiento</h2>
        </div>
        <p className="text-indigo-100 text-sm">
          Evolución histórica de {advisor?.name || 'Asesor'} basada en {historicalData.length} análisis anteriores
        </p>
      </div>

      {/* Gráfico de Evolución de Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          Evolución del Score General
        </h3>
        <div className="relative h-80">
          {/* Eje Y */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
            <span>10</span>
            <span>7.5</span>
            <span>5</span>
            <span>2.5</span>
            <span>0</span>
          </div>

          {/* Área del gráfico */}
          <div className="ml-12 h-full relative pb-8">
            {/* Líneas guía horizontales */}
            <div className="absolute inset-0 bottom-8 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="border-t border-gray-200 w-full" />
              ))}
            </div>

            {/* Gráfico de línea */}
            <div className="relative w-full" style={{ height: 'calc(100% - 32px)' }}>
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Área sombreada */}
                <defs>
                  <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,${100 - (historicalData[0]?.score || 0) * 10} ${historicalData.map((d, i) =>
                    `L ${(i / (historicalData.length - 1)) * 100},${100 - (d.score || 0) * 10}`
                  ).join(' ')} L 100,100 L 0,100 Z`}
                  fill="url(#scoreGradient)"
                />
                <polyline
                  points={historicalData.map((d, i) =>
                    `${(i / (historicalData.length - 1)) * 100},${100 - (d.score || 0) * 10}`
                  ).join(' ')}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="0.8"
                />
              </svg>

              {/* Puntos interactivos (posicionados absolutamente) */}
              {historicalData.map((d, i) => (
                <div
                  key={i}
                  className="absolute group cursor-pointer"
                  style={{
                    left: `${(i / (historicalData.length - 1)) * 100}%`,
                    top: `${100 - (d.score || 0) * 10}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="w-3 h-3 bg-indigo-600 rounded-full group-hover:w-4 group-hover:h-4 transition-all shadow-md" />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {d.date}: {d.score}
                  </div>
                </div>
              ))}
            </div>

            {/* Eje X - Fechas */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
              {historicalData.map((d, i) => (
                <span key={i} className={i % Math.ceil(historicalData.length / 7) === 0 ? '' : 'invisible'}>
                  {d.date.slice(5)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const stats = calculateStats(metric.key);
          const TrendIcon = stats.trend === 'up' ? TrendingUp : stats.trend === 'down' ? TrendingDown : Activity;

          return (
            <div
              key={metric.key}
              className={`bg-white rounded-xl border ${getColorClasses(metric.color, 'border')} p-5 hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${getColorClasses(metric.color, 'bgLight')}`}>
                  <BarChart3 className={`h-5 w-5 ${getColorClasses(metric.color, 'text')}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${stats.trend === 'up' ? 'text-green-600' :
                  stats.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                  <TrendIcon className="h-4 w-4" />
                  {stats.change > 0 ? '+' : ''}{stats.change}%
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-sm mb-2">
                {metric.label}
              </h3>

              <div className="flex items-baseline gap-2">
                <div className={`text-3xl font-bold ${getColorClasses(metric.color, 'text')}`}>
                  {stats.avg}%
                </div>
                <div className="text-xs text-gray-500">cumplimiento</div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getColorClasses(metric.color, 'bg')} transition-all duration-500`}
                  style={{ width: `${stats.avg}%` }}
                />
              </div>

              {/* Mini gráfico de tendencia */}
              <div className="mt-3 flex items-end gap-0.5 h-12">
                {historicalData.slice(-7).map((h, idx) => {
                  const value = h.metrics[metric.key] ? 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex items-end">
                      <div
                        className={`w-full ${getColorClasses(metric.color, 'bg')} opacity-60 hover:opacity-100 transition-opacity rounded-t`}
                        style={{ height: `${value}%` }}
                        title={`${h.date}: ${value}%`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico de Comparación de Parámetros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Comparación de Parámetros
        </h3>
        <div className="space-y-3">
          {metrics.map((metric) => {
            const stats = calculateStats(metric.key);
            return (
              <div key={metric.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className={`text-sm font-bold ${parseFloat(stats.avg) >= 80 ? 'text-green-600' :
                    parseFloat(stats.avg) >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                    {stats.avg}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${parseFloat(stats.avg) >= 80 ? 'bg-green-500' :
                        parseFloat(stats.avg) >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      style={{ width: `${stats.avg}%` }}
                    />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold min-w-[60px] ${stats.trend === 'up' ? 'text-green-600' :
                    stats.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                    {stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '↔'}
                    {stats.change > 0 ? '+' : ''}{stats.change}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mapa de Calor - Últimas Semanas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          Mapa de Calor - Rendimiento Semanal
        </h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${Math.min(historicalData.length, 10)}, 40px)` }}>
              {/* Header */}
              <div className="text-xs font-semibold text-gray-700"></div>
              {historicalData.slice(-10).map((d, i) => (
                <div key={i} className="text-xs text-gray-600 text-center transform -rotate-45 origin-top-left mt-8">
                  {d.date}
                </div>
              ))}

              {/* Rows */}
              {metrics.map(metric => (
                <React.Fragment key={metric.key}>
                  <div className="text-xs font-medium text-gray-700 py-2">
                    {metric.label.split(' ').slice(-2).join(' ')}
                  </div>
                  {historicalData.slice(-10).map((d, i) => {
                    const value = d.metrics[metric.key] ? 100 : 0;
                    return (
                      <div
                        key={`${metric.key}-${i}`}
                        className={`h-10 rounded ${value === 100 ? 'bg-green-500' : 'bg-red-500'
                          } hover:scale-110 transition-transform cursor-pointer`}
                        title={`${metric.label}: ${value}% - ${d.date}`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de resumen exportable */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Historial Detallado</h3>
          <p className="text-xs text-gray-600 mt-1">
            Últimos {historicalData.length} análisis realizados
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Score</th>
                {metrics.map(m => (
                  <th key={m.key} className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    {m.label.split(' ').slice(-1)[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {historicalData.slice().reverse().map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {record.date}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {record.score || 'N/A'}
                  </td>
                  {metrics.map(m => (
                    <td key={m.key} className="px-4 py-3 text-center">
                      {record.metrics[m.key] ? (
                        <span className="inline-block w-5 h-5 bg-green-500 rounded-full" title="Cumplido" />
                      ) : (
                        <span className="inline-block w-5 h-5 bg-red-500 rounded-full" title="No cumplido" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
