'use client'
import { Plane, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function VuelosKPIBar({ vuelos }) {
  const stats = vuelos?.reduce((acc, vuelo) => {
    acc.total += 1
    if (vuelo.estado === 'PENDIENTE_CONFIRMACION_PAGO') acc.pendientesPago += 1
    if (vuelo.estado === 'PENDIENTE_EMISION') acc.pendientesEmision += 1
    if (vuelo.estado === 'EMITIDO') acc.emitidos += 1
    return acc
  }, { total: 0, pendientesPago: 0, pendientesEmision: 0, emitidos: 0 }) || { total: 0, pendientesPago: 0, pendientesEmision: 0, emitidos: 0 }

  const kpis = [
    {
      label: 'Total Vuelos',
      value: stats.total,
      icon: Plane,
      color: 'blue',
      description: 'Registrados en el sistema'
    },
    {
      label: 'Pendientes Pago',
      value: stats.pendientesPago,
      icon: Clock,
      color: 'yellow',
      percentage: stats.total > 0 ? ((stats.pendientesPago / stats.total) * 100).toFixed(1) : '0'
    },
    {
      label: 'Pendientes Emisión',
      value: stats.pendientesEmision,
      icon: AlertCircle,
      color: 'orange',
      percentage: stats.total > 0 ? ((stats.pendientesEmision / stats.total) * 100).toFixed(1) : '0'
    },
    {
      label: 'Emitidos',
      value: stats.emitidos,
      icon: CheckCircle,
      color: 'green',
      percentage: stats.total > 0 ? ((stats.emitidos / stats.total) * 100).toFixed(1) : '0'
    }
  ]

  const colorStyles = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      text: 'text-blue-100',
      icon: 'text-blue-100'
    },
    yellow: {
      gradient: 'from-yellow-500 to-yellow-600',
      text: 'text-yellow-100',
      icon: 'text-yellow-100'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      text: 'text-orange-100',
      icon: 'text-orange-100'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      text: 'text-green-100',
      icon: 'text-green-100'
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        const styles = colorStyles[kpi.color]

        return (
          <div 
            key={index} 
            className={`bg-gradient-to-br ${styles.gradient} rounded-lg shadow-md p-6 text-white transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${styles.text} text-sm font-medium`}>
                {kpi.label}
              </div>
              <Icon className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <div className="text-3xl font-bold">{kpi.value}</div>
            <div className={`${styles.text} text-xs mt-1`}>
              {kpi.percentage ? `${kpi.percentage}% del total` : kpi.description}
            </div>
          </div>
        )
      })}
    </div>
  )
}
