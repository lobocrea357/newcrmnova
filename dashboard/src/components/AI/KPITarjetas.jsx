import React from 'react';
import { Activity, Brain, Target, AlertTriangle } from 'lucide-react';

export default function KPITarjetas({ evaluations = [] }) {
  const total = evaluations.length;
  
  if (total === 0) {
    return null;
  }

  const averageScore = Math.round(
    evaluations.reduce((acc, curr) => acc + curr.score, 0) / total
  );

  const ventas = evaluations.filter(e => e.venta_confirmada).length;
  const scalapayMissed = evaluations.filter(e => !e.ofrecio_scalapay && e.score > 0).length; // Asumiendo que score > 0 es charla real
  const fallosGraves = evaluations.filter(e => e.score < 40).length;

  const kpis = [
    {
      title: 'Chats Auditados Hoy',
      value: total,
      icon: Activity,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Score Promedio (IA)',
      value: `${averageScore}/100`,
      icon: Brain,
      color: averageScore >= 80 ? 'bg-green-500' : averageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500',
      lightColor: averageScore >= 80 ? 'bg-green-50' : averageScore >= 60 ? 'bg-yellow-50' : 'bg-red-50',
      textColor: averageScore >= 80 ? 'text-green-600' : averageScore >= 60 ? 'text-yellow-600' : 'text-red-600',
    },
    {
      title: 'Oportunidades Scalapay (Perdidas)',
      value: scalapayMissed,
      icon: Target,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Alertas Críticas',
      value: fallosGraves,
      icon: AlertTriangle,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
      textColor: 'text-red-600',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kpi.lightColor}`}>
            <kpi.icon className={`w-6 h-6 ${kpi.textColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
