'use client'

import { MessageSquare, TrendingUp, Target, Award } from 'lucide-react'

export default function ResumenRendimiento({ evaluaciones = {}, conversaciones = [] }) {
  const totalConversaciones = conversaciones.length
  const evaluacionesCount = Object.keys(evaluaciones).length

  const calcularPromedio = () => {
    if (evaluacionesCount === 0) return 0
    const totalScore = Object.values(evaluaciones).reduce((sum, ev) => sum + ev.score, 0)
    return (totalScore / evaluacionesCount).toFixed(1)
  }

  const calcularPorcentaje = () => {
    const promedio = calcularPromedio()
    return ((promedio / 7) * 100).toFixed(1)
  }

  const calcularTendencia = () => {
    return '+5'
  }

  const promedio = calcularPromedio()
  const porcentaje = calcularPorcentaje()

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Conversaciones</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalConversaciones}</p>
            {evaluacionesCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {evaluacionesCount} evaluadas
              </p>
            )}
          </div>
          <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Score Promedio</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {promedio}/7
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {evaluacionesCount} evaluaciones
            </p>
          </div>
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Porcentaje</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{porcentaje}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Desempeño general
            </p>
          </div>
          <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Award className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Tendencia</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-bold text-emerald-600">{calcularTendencia()}%</p>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs. período anterior
            </p>
          </div>
          <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
