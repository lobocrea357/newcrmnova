'use client'

import { useState, useEffect } from 'react'
import { obtenerColorProgreso, obtenerBadgeMeta, animacionesBarra } from '@/lib/ranking/helpers'
import { Target, TrendingUp } from 'lucide-react'

export default function BarraProgresoMeta({ 
  feeActual = 0, 
  meta = 3500, 
  nombre = '',
  alcanzóMeta = false, 
  mostrarCantidades = false,
  compacta = false,
  animada = true 
}) {
  const [progresoAnimado, setProgresoAnimado] = useState(0)
  const progresoReal = meta > 0 ? Math.min((feeActual / meta) * 100, 100) : 0
  
  // Animación de entrada
  useEffect(() => {
    if (!animada) {
      setProgresoAnimado(progresoReal)
      return
    }
    
    const timer = setTimeout(() => {
      setProgresoAnimado(progresoReal)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [progresoReal, animada])

  const colorBarra = obtenerColorProgreso(progresoReal)
  const badge = obtenerBadgeMeta(alcanzóMeta, progresoReal)
  
  if (compacta) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${colorBarra} transition-all duration-1000 ease-out`}
            style={{ width: `${progresoAnimado}%` }}
          />
        </div>
        <span className="text-xs font-bold text-gray-600 min-w-[38px] text-right">
          {progresoReal.toFixed(0)}%
        </span>
        {badge && (
          <span className="text-sm">
            {badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <Target className="w-3 h-3" />
          <span>Meta</span>
        </div>
        
        {mostrarCantidades && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">
              ${feeActual.toLocaleString()}
            </span>
            <span className="text-gray-400">/ ${meta.toLocaleString()}</span>
          </div>
        )}
        
        {badge && (
          <span className={`text-sm ${alcanzóMeta ? 'animate-bounce' : ''}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="relative">
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full ${colorBarra} transition-all duration-1000 ease-out relative ${alcanzóMeta ? 'animate-pulse' : ''}`}
            style={{ width: `${progresoAnimado}%` }}
          >
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12" />
          </div>
        </div>
        
        {/* Indicador de porcentaje */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${
            progresoReal > 50 ? 'text-white' : 'text-gray-700'
          }`}>
            {progresoReal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Footer informativo */}
      {alcanzóMeta && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <TrendingUp className="w-3 h-3" />
          <span>Meta alcanzada</span>
        </div>
      )}
    </div>
  )
}
