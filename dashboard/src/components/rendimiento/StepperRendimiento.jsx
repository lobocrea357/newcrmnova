'use client'

import { Check, Bot, Download, Sparkles, Save } from 'lucide-react'

export default function StepperRendimiento({ currentStep, onStepClick }) {
  const steps = [
    {
      number: 1,
      label: 'Seleccionar Asesor',
      icon: Bot,
      description: 'Elige el asesor a evaluar'
    },
    {
      number: 2,
      label: 'Cargar Conversaciones',
      icon: Download,
      description: 'Últimas 20 conversaciones'
    },
    {
      number: 3,
      label: 'Analizar & Evaluar',
      icon: Sparkles,
      description: 'IA o manual'
    },
    {
      number: 4,
      label: 'Guardar Análisis',
      icon: Save,
      description: 'Persistir resultados'
    }
  ]

  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) return 'completed'
    if (stepNumber === currentStep) return 'active'
    return 'pending'
  }

  const getStepStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-600 border-green-600',
          text: 'text-green-700',
          line: 'bg-green-600',
          icon: 'text-white'
        }
      case 'active':
        return {
          circle: 'bg-indigo-600 border-indigo-600 ring-4 ring-indigo-100',
          text: 'text-indigo-700',
          line: 'bg-gray-300',
          icon: 'text-white'
        }
      case 'pending':
        return {
          circle: 'bg-white border-gray-300',
          text: 'text-gray-500',
          line: 'bg-gray-300',
          icon: 'text-gray-400'
        }
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.number)
            const styles = getStepStyles(status)
            const Icon = step.icon
            const isLast = index === steps.length - 1

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Item */}
                <button
                  onClick={() => onStepClick && onStepClick(step.number)}
                  disabled={status === 'pending'}
                  className={`flex items-center gap-3 group transition-all ${
                    status === 'pending' ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                  }`}
                >
                  {/* Circle with Icon */}
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${styles.circle}`}
                  >
                    {status === 'completed' ? (
                      <Check className="h-6 w-6 text-white" strokeWidth={3} />
                    ) : (
                      <Icon className={`h-6 w-6 ${styles.icon}`} />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-left hidden md:block">
                    <p className={`text-sm font-semibold ${styles.text} transition-colors`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 mx-4 hidden sm:block">
                    <div className={`h-1 rounded-full ${styles.line} transition-all`}></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
