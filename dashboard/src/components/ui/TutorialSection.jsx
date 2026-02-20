'use client'
import { useState } from 'react'
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react'

export default function TutorialSection({
  title,
  subtitle,
  steps,
  gradient = "from-indigo-600 via-purple-600 to-indigo-700",
  className = "",
  defaultExpanded = true
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl shadow-2xl border border-indigo-200 ${className} transition-all duration-300 ${isExpanded ? 'p-8 mb-8' : 'p-4 mb-4'}`}>
      {/* Header con botón de colapsar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-white font-bold transition-all duration-300 ${isExpanded ? 'text-2xl' : 'text-lg'}`}>
              {title}
            </h2>
            {subtitle && isExpanded && (
              <p className="text-indigo-100 text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Botón de colapsar/desplegar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200 group"
          title={isExpanded ? "Colapsar tutorial" : "Desplegar tutorial"}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Contenido de pasos (solo si está expandido) */}
      {isExpanded && (
        <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
          <div className={`grid grid-cols-1 md:grid-cols-${steps.length} gap-6`}>
            {steps.map((step, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  {step.icon && (
                    <step.icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-indigo-100 text-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
