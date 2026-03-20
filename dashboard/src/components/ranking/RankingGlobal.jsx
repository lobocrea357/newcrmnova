'use client'

import { useState, useMemo } from 'react'
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

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}

function FilaUsuario({ usuario, index }) {
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
        {formatMoney(usuario.montoTotal)}
      </td>
    </tr>
  )
}

function TablaUsuarios({ usuarios, emptyMsg }) {
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
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, i) => (
            <FilaUsuario key={u.id} usuario={u} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VistaEquipos({ equipos }) {
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
                <p className="text-xs text-gray-500">{formatMoney(equipo.montoTotal)}</p>
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
                    <span className="font-semibold text-gray-800">{formatMoney(m.montoTotal)}</span>
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
  const { rankingData, loadingRanking, filtroVista, setFiltroVista, realtimeActivo, ultimaActualizacion, recargar } = useRanking()

  const datosVista = useMemo(() => {
    if (!rankingData) return []
    if (filtroVista === 'general') return rankingData.general || []
    if (filtroVista === 'asesores') return rankingData.asesores || []
    if (filtroVista === 'gerentes') return rankingData.gerentes || []
    return []
  }, [rankingData, filtroVista])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900">Ranking Global de Ventas</h2>
          {realtimeActivo && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              En vivo
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {ultimaActualizacion && (
            <p className="text-xs text-gray-400 hidden sm:block">
              Actualizado: {ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <button
            onClick={recargar}
            disabled={loadingRanking}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRanking ? 'animate-spin' : ''}`} />
          </button>

          {/* Selector de vista */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            {VISTAS.map(v => (
              <button
                key={v.id}
                onClick={() => setFiltroVista(v.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtroVista === v.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {loadingRanking ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filtroVista === 'equipos' ? (
          <VistaEquipos equipos={rankingData?.equipos || []} />
        ) : (
          <TablaUsuarios
            usuarios={datosVista}
            emptyMsg={
              filtroVista === 'gerentes'
                ? 'No hay ventas registradas por gerentes'
                : 'No hay ventas registradas'
            }
          />
        )}
      </div>
    </div>
  )
}
