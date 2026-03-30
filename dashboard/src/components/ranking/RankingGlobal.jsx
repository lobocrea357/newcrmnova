'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRanking } from '@/contexts/RankingContext'
import { Award, TrendingUp, TrendingDown, Users, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'

const VISTAS = [
  { id: 'general', label: 'General' },
  { id: 'asesores', label: 'Asesores' },
  { id: 'gerentes', label: 'Gerentes' },
  { id: 'equipos', label: 'Por Equipo' },
]

function getMedalla(i) {
  if (i === 0) return '🥇'
  if (i === 1) return '🥈'
  if (i === 2) return '🥉'
  return `${i + 1}.`
}

function formatMoney(n, moneda = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(n || 0)
}

function formatFee(n) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0)
}

function FilaUsuario({ usuario, index, monedaVista }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-bold text-gray-700 w-10">
        {getMedalla(index)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-700">
              {usuario.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{usuario.nombre}</p>
            {usuario.equipoNombre && (
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: usuario.equipoColor || '#6366f1' }}
              >
                {usuario.equipoNombre}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          {usuario.rol}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-bold text-gray-900">{usuario.emitidos}</td>
      <td className="px-4 py-3 text-center text-sm text-gray-600">{usuario.totalVuelos}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-medium">{usuario.porcentajeConversion}%</span>
          {parseFloat(usuario.porcentajeConversion) >= 60
            ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          }
        </div>
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
        {formatMoney(usuario.montoTotal, monedaVista)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">
        {formatFee(usuario.feeAgenciaTotal)}
      </td>
    </tr>
  )
}

function TablaUsuarios({ usuarios, emptyMsg, monedaVista }) {
  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{emptyMsg || 'Sin datos'}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 text-left">
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Rol</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Emitidos</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Total</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">% Conv.</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Monto ({monedaVista})</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Fee Gen.</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, i) => (
            <FilaUsuario key={u.id} usuario={u} index={i} monedaVista={monedaVista} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VistaEquipos({ equipos, monedaVista }) {
  const [expandidos, setExpandidos] = useState({})

  if (!equipos || equipos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Sin equipos registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {equipos.map((equipo, i) => (
        <div key={equipo.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandidos(p => ({ ...p, [equipo.id]: !p[equipo.id] }))}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            style={{ borderLeft: `4px solid ${equipo.color}` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">{getMedalla(i)}</span>
              <span className="font-semibold text-gray-900">{equipo.nombre}</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {equipo.miembros.length} miembro{equipo.miembros.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{equipo.totalEmitidos} emitidos</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{formatMoney(equipo.montoTotal, monedaVista)}</span>
                  <span className="text-emerald-600 font-semibold">Fee: {formatFee(equipo.feeAgenciaTotal)}</span>
                </div>
              </div>
              {expandidos[equipo.id]
                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                : <ChevronRight className="w-4 h-4 text-gray-400" />
              }
            </div>
          </button>

          {expandidos[equipo.id] && (
            <div className="divide-y divide-gray-100">
              {equipo.miembros.map((m, mi) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-5">{getMedalla(mi)}</span>
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-700">{m.nombre.charAt(0)}</span>
                    </div>
                    <span className="text-sm text-gray-800">{m.nombre}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{m.emitidos} emitidos</span>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-gray-800">{formatMoney(m.montoTotal, monedaVista)}</span>
                      <span className="text-xs text-emerald-600 font-medium">Fee: {formatFee(m.feeAgenciaTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function RankingGlobal() {
  const { rankingData, loadingRanking, filtroVista, setFiltroVista, monedaVista, setMonedaVista, realtimeActivo, ultimaActualizacion, recargar } = useRanking()
  
  // Estados para el carrusel auto-cíclico
  const [isHovered, setIsHovered] = useState(false)
  const [lastInteraction, setLastInteraction] = useState(Date.now())
  const [animating, setAnimating] = useState(false)

  // Función para cambiar de vista con animación
  const cambiarVistaConAnimacion = (nuevaVista) => {
    if (nuevaVista === filtroVista) return
    setAnimating(true)
    setTimeout(() => {
      setFiltroVista(nuevaVista)
      setLastInteraction(Date.now())
      setAnimating(false)
    }, 300) // Duración de la transición de salida
  }

  // Intervalo para el carrusel de vistas
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = Date.now()
      const tiempoInactivo = ahora - lastInteraction

      // Condiciones para cambiar automáticamente:
      // 1. No estar en hover
      // 2. Haber pasado más de 4 segundos desde la última interacción manual u hover
      if (!isHovered && tiempoInactivo >= 4000) {
        const currentIndex = VISTAS.findIndex(v => v.id === filtroVista)
        const nextIndex = (currentIndex + 1) % VISTAS.length
        cambiarVistaConAnimacion(VISTAS[nextIndex].id)
      }
    }, 4000) // Intento de cambio cada 4 segundos

    return () => clearInterval(interval)
  }, [filtroVista, isHovered, lastInteraction])

  // Intervalo para alternar moneda USD/EUR cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = Date.now()
      const tiempoInactivo = ahora - lastInteraction

      // Cambiar moneda automáticamente si no hay interacción
      if (!isHovered && tiempoInactivo >= 8000) {
        setMonedaVista(prev => prev === 'USD' ? 'EUR' : 'USD')
      }
    }, 8000) // Cambio cada 8 segundos

    return () => clearInterval(interval)
  }, [isHovered, lastInteraction, setMonedaVista])

  const datosVista = useMemo(() => {
    if (!rankingData) return []
    if (filtroVista === 'general') return rankingData.general || []
    if (filtroVista === 'asesores') return rankingData.asesores || []
    if (filtroVista === 'gerentes') return rankingData.gerentes || []
    return []
  }, [rankingData, filtroVista])

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-500"
      onMouseEnter={() => {
        setIsHovered(true)
        setLastInteraction(Date.now())
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setLastInteraction(Date.now())
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ranking Global de Ventas</h2>
            <div className="flex items-center gap-2">
              {realtimeActivo && (
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-blue-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                {monedaVista}
              </span>
              {!isHovered && (Date.now() - lastInteraction >= 10000) && (
                <span className="text-[10px] uppercase font-black text-purple-400 animate-pulse">
                  • Auto-cycle
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {ultimaActualizacion && (
            <p className="text-xs text-gray-400 hidden lg:block whitespace-nowrap">
              Vigente: {ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          
          {/* Selector de vista con estilo moderno */}
          <div className="flex p-1 bg-gray-200/50 rounded-xl border border-gray-200">
            {VISTAS.map(v => (
              <button
                key={v.id}
                onClick={() => cambiarVistaConAnimacion(v.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 whitespace-nowrap ${
                  filtroVista === v.id
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={recargar}
            disabled={loadingRanking}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0"
            title="Sincronizar ahora"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRanking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenido con transiciones suaves */}
      <div className={`p-4 transition-all duration-300 ${animating ? 'opacity-0 scale-[0.98] blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
        {loadingRanking ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-sm font-medium text-gray-400 animate-pulse">Obteniendo métricas actualizadas...</p>
          </div>
        ) : filtroVista === 'equipos' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <VistaEquipos equipos={rankingData?.equipos || []} monedaVista={monedaVista} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <TablaUsuarios
              usuarios={datosVista}
                  monedaVista={monedaVista}
              emptyMsg={
                filtroVista === 'gerentes'
                  ? 'No hay ventas registradas por gerentes'
                  : 'No hay ventas registradas'
              }
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

