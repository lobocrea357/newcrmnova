'use client'

import { useState, useRef, useEffect } from 'react'
import { useRanking } from '@/contexts/RankingContext'
import { 
  obtenerColoresAgencia, 
  formatearFee, 
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
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import BarraProgresoMeta from './BarraProgresoMeta'

export default function BarraProgresoCompacta({ userId }) {
  const { datosPersonales, loadingPersonal, recargarPersonal } = useRanking()
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [animando, setAnimando] = useState(false)
  const dropdownRef = useRef(null)

  // Efecto de celebración cuando alcanza meta
  useEffect(() => {
    if (datosPersonales?.mensual?.alcanzoMeta && !animando) {
      setAnimando(true)
      const timer = setTimeout(() => setAnimando(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [datosPersonales?.mensual?.alcanzoMeta])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false)
      }
    }

    if (mostrarDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mostrarDropdown])

  if (loadingPersonal || !datosPersonales) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-2 bg-gray-200 rounded w-20" />
        <div className="h-2 bg-gray-200 rounded w-8" />
      </div>
    )
  }

  const { usuario, mensual, quincenal } = datosPersonales
  const coloresAgencia = obtenerColoresAgencia(usuario.agencia?.codigo || 'SIN_AGENCIA')
  const diasRestantes = getDiasRestantesMes()
  const progreso = mensual.progreso || 0

  // Determinar color de fondo según agencia
  const getBgColor = () => {
    switch(coloresAgencia.primario) {
      case 'amber': return 'bg-amber-50'
      case 'indigo': return 'bg-indigo-50'
      case 'purple': return 'bg-purple-50'
      case 'blue': return 'bg-blue-50'
      default: return 'bg-gray-50'
    }
  }

  // Determinar color de texto según agencia
  const getTextColor = () => {
    switch(coloresAgencia.primario) {
      case 'amber': return 'text-amber-700'
      case 'indigo': return 'text-indigo-700'
      case 'purple': return 'text-purple-700'
      case 'blue': return 'text-blue-700'
      default: return 'text-gray-700'
    }
  }

  // Determinar color de borde según agencia
  const getBorderColor = () => {
    switch(coloresAgencia.primario) {
      case 'amber': return 'border-amber-200 hover:border-amber-300'
      case 'indigo': return 'border-indigo-200 hover:border-indigo-300'
      case 'purple': return 'border-purple-200 hover:border-purple-300'
      case 'blue': return 'border-blue-200 hover:border-blue-300'
      default: return 'border-gray-200 hover:border-gray-300'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Componente compacto inline */}
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className={`
          flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-200
          ${getBgColor()} ${getTextColor()} ${getBorderColor()}
          ${animando ? 'ring-2 ring-emerald-500 ring-opacity-50 animate-pulse' : ''}
          ${mostrarDropdown ? 'shadow-md scale-105' : 'hover:shadow-sm hover:scale-102'}
        `}
      >
        {/* Icono de progreso */}
        <div className="relative">
          <Award className="w-4 h-4" />
          {animando && (
            <Sparkles className="w-2 h-2 text-emerald-500 absolute -top-1 -right-1 animate-ping" />
          )}
        </div>

        {/* Barra de progreso ultra compacta */}
        <div className="w-16 bg-white/60 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r from-current to-current/80 transition-all duration-1000 ease-out`}
            style={{ width: `${progreso}%` }}
          />
        </div>

        {/* Porcentaje */}
        <span className="text-sm font-bold">
          {progreso.toFixed(0)}%
        </span>

        {/* Indicador de dropdown */}
        {mostrarDropdown ? (
          <ChevronUp className="w-3 h-3 opacity-60" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-60" />
        )}
      </button>

      {/* Dropdown con detalles */}
      {mostrarDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header del dropdown */}
          <div className={`p-4 ${getBgColor()} border-b border-gray-100`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-gray-900">Mi Progreso</p>
                  <p className="text-xs text-gray-600">{usuario.agencia?.nombre || 'Sin Agencia'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatearFee(mensual.fee)}
                </p>
                <p className="text-xs text-gray-500">
                  de {formatearFee(mensual.meta)}
                </p>
              </div>
            </div>
            
            {/* Barra de progreso completa */}
            <BarraProgresoMeta
              feeActual={mensual.fee}
              meta={mensual.meta}
              nombre={usuario.nombre}
              alcanzóMeta={mensual.alcanzoMeta}
              mostrarCantidades={true}
              compacta={false}
              animada={true}
            />
          </div>

          {/* Métricas principales */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                  <Target className="w-3 h-3" />
                  <span>Meta</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {progreso.toFixed(1)}%
                </p>
              </div>
              
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Comisión</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatearFee(quincenal.comision)}
                </p>
              </div>
              
              <div className="text-center p-2 bg-gray-50 rounded-lg">
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
            <div className="text-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 italic">
                "{obtenerMensajeMotivacional(progreso, diasRestantes)}"
              </p>
            </div>

            {/* Botón de recargar */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                recargarPersonal(userId)
              }}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Actualizar datos
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
