'use client'

import { useState, useEffect } from 'react'
import { useRanking } from '@/contexts/RankingContext'
import { 
  obtenerColoresAgencia, 
  formatearFee, 
  formatearProyeccion, 
  obtenerMensajeMotivacional,
  getDiasRestantesMes 
} from '@/lib/ranking/helpers'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Target, 
  Award,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import BarraProgresoMeta from './BarraProgresoMeta'

export default function BarraPersonalHeader({ userId }) {
  const { datosPersonales, loadingPersonal, recargarPersonal } = useRanking()
  const [expandida, setExpandida] = useState(false)
  const [animando, setAnimando] = useState(false)

  // Efecto de celebración cuando alcanza meta
  useEffect(() => {
    if (datosPersonales?.mensual?.alcanzoMeta && !animando) {
      setAnimando(true)
      const timer = setTimeout(() => setAnimando(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [datosPersonales?.mensual?.alcanzoMeta])

  if (loadingPersonal || !datosPersonales) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  const { usuario, mensual, quincenal } = datosPersonales
  const coloresAgencia = obtenerColoresAgencia(usuario.agencia?.codigo || 'SIN_AGENCIA')
  const diasRestantes = getDiasRestantesMes()

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
      animando ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''
    }`}>
      {/* Header principal */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpandida(!expandida)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar/Icono */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${coloresAgencia.primario === 'amber' ? '#fef3c7' : coloresAgencia.primario === 'indigo' ? '#eef2ff' : coloresAgencia.primario === 'purple' ? '#faf5ff' : coloresAgencia.primario === 'blue' ? '#eff6ff' : '#f9fafb'}` }}
            >
              <Award className="w-5 h-5" style={{ color: `${coloresAgencia.primario === 'amber' ? '#b45309' : coloresAgencia.primario === 'indigo' ? '#4338ca' : coloresAgencia.primario === 'purple' ? '#7c3aed' : coloresAgencia.primario === 'blue' ? '#1d4ed8' : '#374151'}` }} />
            </div>
            
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Mi Progreso
              </p>
              <p className="text-xs text-gray-500">
                {usuario.agencia?.nombre || 'Sin Agencia'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador principal */}
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatearFee(mensual.fee)}
              </p>
              <p className="text-xs text-gray-500">
                de {formatearFee(mensual.meta)}
              </p>
            </div>

            {/* Toggle expandir */}
            {expandida ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Barra de progreso compacta */}
        <div className="mt-3">
          <BarraProgresoMeta
            feeActual={mensual.fee}
            meta={mensual.meta}
            nombre={usuario.nombre}
            alcanzóMeta={mensual.alcanzoMeta}
            mostrarCantidades={false}
            compacta={true}
            animada={true}
          />
        </div>
      </div>

      {/* Contenido expandido */}
      {expandida && (
        <div className="border-t border-gray-200 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Métricas principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <Target className="w-3 h-3" />
                <span>Meta</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {(mensual.progreso || 0).toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <DollarSign className="w-3 h-3" />
                <span>Comisión</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatearFee(quincenal.comision)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Días</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {diasRestantes}
              </p>
            </div>
          </div>

          {/* Detalle de comisión quincenal */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-700" />
                <span className="text-sm font-medium text-gray-700">
                  Quincena {quincenal.numero}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                quincenal.estado === 'cobrado' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {quincenal.estado === 'cobrado' ? 'Cobrado' : 'Estimado'}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Fee quincenal:</span>
                <span className="font-medium">{formatearFee(quincenal.fee)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Porcentaje:</span>
                <span className="font-bold text-indigo-700">
                  {quincenal.porcentajeComision}%
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-700">Comisión:</span>
                <span className="text-indigo-700">
                  {formatearFee(quincenal.comision)}
                </span>
              </div>
            </div>
            
            {quincenal.estado === 'estimado' && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>
                  Se cobra el {new Date(quincenal.diaCobro).toLocaleDateString('es', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Mensaje motivacional */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 italic">
              &quot;{obtenerMensajeMotivacional(mensual.progreso || 0, diasRestantes)}&quot;
            </p>
          </div>

          {/* Botón de recargar */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              recargarPersonal(userId)
            }}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Actualizar datos
          </button>
        </div>
      )}
    </div>
  )
}
