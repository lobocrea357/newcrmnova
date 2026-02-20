'use client'
import { Lightbulb, DollarSign, TrendingUp, Calculator } from 'lucide-react'

export default function CotizadorTutorial() {
  const steps = [
    {
      icon: DollarSign,
      title: "1. Ingresa el precio",
      description: "Agrega el precio base del ticket en USD o EUR y los fees adicionales."
    },
    {
      icon: TrendingUp,
      title: "2. Selecciona monedas",
      description: "Elige la moneda de tu precio (USD/EUR) y en qué moneda quieres cotizar."
    },
    {
      icon: Calculator,
      title: "3. Calcula automáticamente",
      description: "El sistema aplicará la tasa de cambio y calculará el total con impuestos."
    },
    {
      icon: Lightbulb,
      title: "4. Revisa y comparte",
      description: "Verifica el resultado y genera el PDF para compartir con tu cliente."
    }
  ]

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-indigo-900">Guía Rápida de Uso</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <step.icon className="w-4 h-4 text-indigo-600" />
                <h4 className="font-semibold text-slate-800 text-sm">{step.title}</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-indigo-200">
        <p className="text-xs text-indigo-700 text-center">
          💡 <strong>Tip:</strong> Las tasas de cambio se actualizan automáticamente. Si necesitas ajustes, ve a la pestaña "Gestionar Tasas".
        </p>
      </div>
    </div>
  )
}
