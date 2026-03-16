'use client'
import { useState, useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, 
  CheckCircle, XCircle, Calendar, Award, User
} from 'lucide-react'

export default function VuelosStats({ vuelos, currentUserId, role }) {
  const [sortConfig, setSortConfig] = useState({ key: 'totalVuelos', direction: 'desc' })

  const stats = useMemo(() => {
    if (!vuelos || vuelos.length === 0) {
      return {
        kpis: { total: 0, pendientesPago: 0, pendientesEmision: 0, emitidos: 0, cancelados: 0, montoTotal: 0 },
        ranking: [],
        actividadSemanal: []
      }
    }

    const totalVuelos = vuelos.length
    const pendientesPago = vuelos.filter(v => v.estado === 'PENDIENTE_CONFIRMACION_PAGO').length
    const pendientesEmision = vuelos.filter(v => v.estado === 'PENDIENTE_EMISION').length
    const emitidos = vuelos.filter(v => v.estado === 'EMITIDO').length
    const cancelados = vuelos.filter(v => v.estado === 'CANCELADO').length
    const montoTotal = vuelos.reduce((sum, v) => sum + (parseFloat(v.monto_venta) || 0), 0)

    const vuelosPorAsesor = {}
    vuelos.forEach(vuelo => {
      const asesorId = vuelo.created_by
      const asesorNombre = vuelo.creator?.full_name || 'Desconocido'
      const asesorEmail = vuelo.creator?.email || 'N/A'

      if (!vuelosPorAsesor[asesorId]) {
        vuelosPorAsesor[asesorId] = {
          id: asesorId,
          nombre: asesorNombre,
          email: asesorEmail,
          totalVuelos: 0,
          pendientesPago: 0,
          pendientesEmision: 0,
          emitidos: 0,
          cancelados: 0,
          montoTotal: 0,
          isCurrentUser: asesorId === currentUserId
        }
      }

      const asesor = vuelosPorAsesor[asesorId]
      asesor.totalVuelos += 1
      asesor.montoTotal += parseFloat(vuelo.monto_venta) || 0

      if (vuelo.estado === 'PENDIENTE_CONFIRMACION_PAGO') asesor.pendientesPago += 1
      if (vuelo.estado === 'PENDIENTE_EMISION') asesor.pendientesEmision += 1
      if (vuelo.estado === 'EMITIDO') asesor.emitidos += 1
      if (vuelo.estado === 'CANCELADO') asesor.cancelados += 1
    })

    const ranking = Object.values(vuelosPorAsesor).map(asesor => ({
      ...asesor,
      porcentajeConversion: asesor.totalVuelos > 0 
        ? ((asesor.emitidos / asesor.totalVuelos) * 100).toFixed(1)
        : '0.0'
    }))

    const ahora = new Date()
    const inicioSemana = new Date(ahora)
    inicioSemana.setDate(ahora.getDate() - ahora.getDay())
    inicioSemana.setHours(0, 0, 0, 0)

    const vuelosSemana = vuelos.filter(v => {
      const fecha = new Date(v.created_at)
      return fecha >= inicioSemana
    })

    const actividadPorDia = {}
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    diasSemana.forEach((dia, idx) => {
      actividadPorDia[dia] = { dia, total: 0, porAsesor: {} }
    })

    vuelosSemana.forEach(vuelo => {
      const fecha = new Date(vuelo.created_at)
      const dia = diasSemana[fecha.getDay()]
      const asesorNombre = vuelo.creator?.full_name || 'Desconocido'
      
      actividadPorDia[dia].total += 1
      actividadPorDia[dia].porAsesor[asesorNombre] = (actividadPorDia[dia].porAsesor[asesorNombre] || 0) + 1
    })

    const actividadSemanal = Object.values(actividadPorDia)

    return {
      kpis: { total: totalVuelos, pendientesPago, pendientesEmision, emitidos, cancelados, montoTotal },
      ranking,
      actividadSemanal
    }
  }, [vuelos, currentUserId])

  const sortedRanking = useMemo(() => {
    const sorted = [...stats.ranking].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })
    return sorted
  }, [stats.ranking, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getMedalla = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}.`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-100 text-sm font-medium">Total Vuelos</div>
            <Calendar className="w-5 h-5 text-blue-100" />
          </div>
          <div className="text-3xl font-bold">{stats.kpis.total}</div>
          <div className="text-blue-100 text-xs mt-1">Registrados en el sistema</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-yellow-100 text-sm font-medium">Pendientes Pago</div>
            <Clock className="w-5 h-5 text-yellow-100" />
          </div>
          <div className="text-3xl font-bold">{stats.kpis.pendientesPago}</div>
          <div className="text-yellow-100 text-xs mt-1">
            {stats.kpis.total > 0 ? `${((stats.kpis.pendientesPago / stats.kpis.total) * 100).toFixed(1)}% del total` : '0% del total'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-orange-100 text-sm font-medium">Pendientes Emisión</div>
            <TrendingUp className="w-5 h-5 text-orange-100" />
          </div>
          <div className="text-3xl font-bold">{stats.kpis.pendientesEmision}</div>
          <div className="text-orange-100 text-xs mt-1">
            {stats.kpis.total > 0 ? `${((stats.kpis.pendientesEmision / stats.kpis.total) * 100).toFixed(1)}% del total` : '0% del total'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-100 text-sm font-medium">Emitidos</div>
            <CheckCircle className="w-5 h-5 text-green-100" />
          </div>
          <div className="text-3xl font-bold">{stats.kpis.emitidos}</div>
          <div className="text-green-100 text-xs mt-1">
            {stats.kpis.total > 0 ? `${((stats.kpis.emitidos / stats.kpis.total) * 100).toFixed(1)}% del total` : '0% del total'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Ranking de Asesores</h3>
          </div>
          <div className="text-sm text-gray-500">
            Ordenar por: <span className="font-medium text-gray-700 capitalize">{sortConfig.key === 'totalVuelos' ? 'Total Vuelos' : sortConfig.key === 'emitidos' ? 'Emitidos' : sortConfig.key === 'montoTotal' ? 'Monto Total' : sortConfig.key}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  #
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('nombre')}
                >
                  Asesor {sortConfig.key === 'nombre' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalVuelos')}
                >
                  Total {sortConfig.key === 'totalVuelos' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('pendientesPago')}
                >
                  Pend. Pago {sortConfig.key === 'pendientesPago' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('pendientesEmision')}
                >
                  Pend. Emisión {sortConfig.key === 'pendientesEmision' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('emitidos')}
                >
                  Emitidos {sortConfig.key === 'emitidos' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('porcentajeConversion')}
                >
                  % Conversión {sortConfig.key === 'porcentajeConversion' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('montoTotal')}
                >
                  Monto Total {sortConfig.key === 'montoTotal' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRanking.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No hay datos de asesores disponibles
                  </td>
                </tr>
              ) : (
                sortedRanking.map((asesor, index) => (
                  <tr
                    key={asesor.id}
                    className={`border-b border-gray-100 transition-colors ${
                      asesor.isCurrentUser 
                        ? 'bg-purple-50 hover:bg-purple-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">
                      {getMedalla(index)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {asesor.isCurrentUser && (
                          <User className="w-4 h-4 text-purple-600" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {asesor.nombre}
                            {asesor.isCurrentUser && (
                              <span className="ml-2 text-xs text-purple-600 font-semibold">(Tú)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{asesor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      {asesor.totalVuelos}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {asesor.pendientesPago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {asesor.pendientesEmision}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {asesor.emitidos}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium text-gray-900">{asesor.porcentajeConversion}%</span>
                        {parseFloat(asesor.porcentajeConversion) >= 60 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatMoney(asesor.montoTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sortedRanking.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">{sortedRanking.length}</span> asesores en total
              </div>
              <div className="text-gray-600">
                Monto total: <span className="font-semibold text-gray-900">{formatMoney(stats.kpis.montoTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Actividad de Esta Semana</h3>
        </div>

        {stats.actividadSemanal.length === 0 || stats.actividadSemanal.every(d => d.total === 0) ? (
          <div className="text-center py-8 text-gray-500">
            No hay actividad registrada esta semana
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Día
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Por Asesor
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.actividadSemanal.map((dia) => (
                  <tr key={dia.dia} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {dia.dia}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {dia.total}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {dia.total === 0 ? (
                        <span className="text-xs text-gray-400">Sin actividad</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(dia.porAsesor).map(([nombre, cantidad]) => (
                            <span
                              key={nombre}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {nombre}: <span className="ml-1 font-semibold">{cantidad}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
