"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Download
} from "lucide-react";

export default function SalesMetricsCard({
  metrics,
  asesorName,
  fecha,
  onViewDetails,
  onDownloadPDF,
  isLoading = false
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const {
    ventas_confirmadas = 0,
    leads_calientes = 0,
    cotizaciones_enviadas = 0,
    valor_total = 0,
    tasa_conversion = 0,
    valor_promedio = 0,
    conversaciones_analizadas = 0,
    score_ventas = 0,
    percentage_ventas = 0
  } = metrics || {};

  // Determinar color del score
  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Determinar tendencia (mock - en producción vendría del backend)
  const getTrendIcon = (value) => {
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    return trend === 'up' ?
      <ArrowUp className="h-4 w-4 text-green-600" /> :
      <ArrowDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {asesorName || 'Asesor'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDetails?.(metrics)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDownloadPDF?.(metrics)}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Descargar PDF"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {fecha || new Date().toLocaleDateString('es-ES')}
          </span>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getScoreColor(percentage_ventas)}`}>
            {percentage_ventas}% Score
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Ventas Confirmadas */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-green-700">
                💰 Ventas Confirmadas
              </div>
              {getTrendIcon(ventas_confirmadas)}
            </div>
            <div className="text-2xl font-bold text-green-900">
              {ventas_confirmadas}
            </div>
            <div className="text-xs text-green-600">
              de {conversaciones_analizadas} conversaciones
            </div>
          </div>

          {/* Leads Calientes */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-orange-700">
                🔥 Leads Calientes
              </div>
              {getTrendIcon(leads_calientes)}
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {leads_calientes}
            </div>
            <div className="text-xs text-orange-600">
              alta probabilidad
            </div>
          </div>

          {/* Valor Total */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-700">
                💵 Valor Total
              </div>
              {getTrendIcon(valor_total)}
            </div>
            <div className="text-xl font-bold text-purple-900">
              ${valor_total.toLocaleString()}
            </div>
            <div className="text-xs text-purple-600">
              promedio: ${valor_promedio.toLocaleString()}
            </div>
          </div>

          {/* Tasa de Conversión */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-blue-700">
                📈 Conversión
              </div>
              {getTrendIcon(tasa_conversion)}
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {tasa_conversion}%
            </div>
            <div className="text-xs text-blue-600">
              {cotizaciones_enviadas} cotizaciones
            </div>
          </div>
        </div>

        {/* Barra de progreso del score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Score de Ventas</span>
            <span className="text-sm text-gray-500">{score_ventas}/{metrics?.max_score_ventas || 57}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                percentage_ventas >= 80 ? 'bg-green-600' :
                percentage_ventas >= 70 ? 'bg-blue-600' :
                percentage_ventas >= 60 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.min(percentage_ventas, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Detalles expandibles */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium py-2 flex items-center justify-center gap-1 border-t border-gray-100 mt-4 pt-4"
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
          <TrendingUp className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        {/* Detalles expandidos */}
        {showDetails && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">📊 Cotizaciones:</span>
                <span className="font-medium">{cotizaciones_enviadas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">💳 Métodos pago:</span>
                <span className="font-medium">{metrics?.metodo_pago_enviado ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🛡️ Objeciones:</span>
                <span className="font-medium">{metrics?.objeciones_superadas ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📞 Seguimiento:</span>
                <span className="font-medium">{metrics?.seguimiento_efectivo ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">⏰ Urgencia:</span>
                <span className="font-medium">{metrics?.urgencia_creada ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">⭐ Valor agregado:</span>
                <span className="font-medium">{metrics?.valor_agregado ? '✅' : '❌'}</span>
              </div>
            </div>

            {/* Resultado comercial */}
            {metrics?.resultado_comercial && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Resultado Comercial
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    metrics.resultado_comercial.tipo === 'VENTA_CONFIRMADA' ? 'bg-green-100 text-green-800' :
                    metrics.resultado_comercial.tipo === 'LEAD_CALIENTE' ? 'bg-orange-100 text-orange-800' :
                    metrics.resultado_comercial.tipo === 'COTIZACION_ENVIADA' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {metrics.resultado_comercial.descripcion}
                  </span>
                  <span className={`text-xs font-medium ${
                    metrics.resultado_comercial.prioridad === 'ALTA' ? 'text-red-600' :
                    metrics.resultado_comercial.prioridad === 'MEDIA' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    Prioridad: {metrics.resultado_comercial.prioridad}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Última actualización: {new Date().toLocaleTimeString('es-ES')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails?.(metrics)}
              className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              Ver historial
            </button>
            <button
              onClick={() => onDownloadPDF?.(metrics)}
              className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
            >
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para métricas individuales
function MetricItem({ label, value, color = "gray", icon }) {
  const colorClasses = {
    green: "bg-green-50 border-green-200 text-green-900",
    orange: "bg-orange-50 border-orange-200 text-orange-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    gray: "bg-gray-50 border-gray-200 text-gray-900"
  };

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color] || colorClasses.gray}`}>
      <div className="text-xs font-medium opacity-75 mb-1">
        {icon} {label}
      </div>
      <div className="text-lg font-bold">
        {value}
      </div>
    </div>
  );
}

export { MetricItem };
