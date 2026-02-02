"use client";

import { TrendingUp, TrendingDown, Minus, AlertTriangle, Eye } from "lucide-react";

export default function AdvisorPerformanceCard({ advisor, onClick, isRecentlyViewed = false }) {
  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return "bg-gradient-to-br from-green-50 to-green-100";
    if (score >= 5) return "bg-gradient-to-br from-yellow-50 to-yellow-100";
    return "bg-gradient-to-br from-red-50 to-red-100";
  };

  const getTrendIcon = (trend) => {
    if (trend === "up")
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down")
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getFailedMetrics = (metrics) => {
    const failed = [];
    if (!metrics.tiempo_contacto) failed.push("Contacto lento");
    if (!metrics.tiempo_respuesta) failed.push("Respuesta lenta");
    if (!metrics.tiempo_cotizacion) failed.push("Cotización lenta");
    if (!metrics.cierre_intencion) failed.push("Sin cierre");
    if (!metrics.ofrecio_scalapay) failed.push("No ofreció Scalapay");
    if (!metrics.mas_dos_opciones) failed.push("Pocas opciones");
    if (!metrics.seguimiento_intencion) failed.push("Sin seguimiento");
    return failed;
  };

  const failedMetrics = getFailedMetrics(advisor.metrics);
  const scoreColorClass = getScoreColor(advisor.dailyScore);
  const scoreBgClass = getScoreBgColor(advisor.dailyScore);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] duration-200 relative"
    >
      {/* Badge de visto recientemente */}
      {isRecentlyViewed && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
            <Eye className="h-3 w-3" />
            <span className="text-xs font-bold">Visto</span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {advisor.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{advisor.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(advisor.trend)}
              <span className="text-xs text-gray-500">
                {advisor.trend === "up"
                  ? "Mejorando"
                  : advisor.trend === "down"
                    ? "Bajando"
                    : "Estable"}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-center w-16 h-16 rounded-full border-4 ${scoreColorClass} ${scoreBgClass}`}
        >
          <span className="text-2xl font-bold">
            {advisor.dailyScore.toFixed(1)}
          </span>
        </div>
      </div>

      {failedMetrics.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-900 mb-1">
                Áreas de Atención:
              </p>
              <div className="flex flex-wrap gap-1">
                {failedMetrics.map((metric, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {failedMetrics.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
          <p className="text-xs text-green-700 font-medium flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Cumple todos los parámetros
          </p>
        </div>
      )}
    </div>
  );
}
