'use client'
import { Clock, DollarSign, FileText, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'

export default function MetricasHeader({ vuelos }) {
  const totalPendientes = vuelos.length
  const montoTotal = vuelos.reduce((sum, v) => sum + (v.monto_venta || 0), 0)
  const conComprobante = vuelos.filter(v => 
    v.adjuntos?.some(a => a.tipo_adjunto === 'COMPROBANTE_PAGO')
  ).length
  const sinComprobante = totalPendientes - conComprobante

  const metricas = [
    {
      label: 'Pendientes',
      valor: totalPendientes,
      icono: FileText,
      color: 'bg-indigo-100 text-indigo-700',
      sublabel: 'vuelos'
    },
    {
      label: 'Monto Total',
      valor: `$${montoTotal.toFixed(2)}`,
      icono: DollarSign,
      color: 'bg-green-100 text-green-700',
      sublabel: 'en validación'
    },
    {
      label: 'Con Comprobante',
      valor: conComprobante,
      icono: CheckCircle,
      color: 'bg-blue-100 text-blue-700',
      sublabel: 'listos para revisar'
    },
    {
      label: 'Sin Comprobante',
      valor: sinComprobante,
      icono: AlertTriangle,
      color: 'bg-amber-100 text-amber-700',
      sublabel: 'requieren atención'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metricas.map((metrica, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{metrica.label}</span>
            <div className={`p-2 rounded-lg ${metrica.color}`}>
              <metrica.icono className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrica.valor}</p>
          <p className="text-xs text-gray-500 mt-1">{metrica.sublabel}</p>
        </div>
      ))}
    </div>
  )
}
