'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Eye, Sparkles, Edit3, Check, X } from 'lucide-react'
import { PARAMETROS_EVALUACION } from '@/lib/mockRendimiento'

const formatContactName = (conv) => {
    const name = conv.contact_name || conv.contact_phone || conv.contact_number || 'Sin nombre'
    if (/^\d{15,}$/.test(name)) {
        return 'Grupo'
    }
    return name
}

export default function TablaEvaluaciones({
    conversaciones = [],
    evaluaciones = {},
    onEvaluacionChange,
    onVerConversacion,
    seleccionadas = [],
    onSeleccionChange
}) {
    const [expandidas, setExpandidas] = useState(new Set())

    const handleVerConversacion = (chatId) => {
        if (!evaluaciones[chatId]) {
            const evaluacionVacia = {
                ...Object.fromEntries(PARAMETROS_EVALUACION.map(p => [p.key, false])),
                score: 0,
                maxScore: 10,
                percentage: '0.0',
                ai_feedback: '',
                manually_edited: true,
                fecha_analisis: new Date().toISOString(),
                generated_by: 'Manual'
            }
            onEvaluacionChange(chatId, evaluacionVacia)
        }
        onVerConversacion(chatId)
    }

    const toggleExpanded = (chatId) => {
        const newExpanded = new Set(expandidas)
        if (newExpanded.has(chatId)) {
            newExpanded.delete(chatId)
        } else {
            newExpanded.add(chatId)
        }
        setExpandidas(newExpanded)
    }

    const toggleParametro = (chatId, parametro) => {
        const evaluacion = evaluaciones[chatId]
        if (!evaluacion) return

        const newValue = !evaluacion[parametro]
        const newEvaluacion = {
            ...evaluacion,
            [parametro]: newValue,
            manually_edited: true
        }

        const criticalMetrics = PARAMETROS_EVALUACION.filter(p => p.isCritical).map(p => p.key);
        const normalMetrics = PARAMETROS_EVALUACION.filter(p => !p.isCritical && !p.isInfo).map(p => p.key);

        let newScore = 0;
        criticalMetrics.forEach(key => {
            if (newEvaluacion[key]) newScore += 2.0;
        });
        normalMetrics.forEach(key => {
            if (newEvaluacion[key]) newScore += (4.0 / normalMetrics.length);
        });

        newEvaluacion.score = parseFloat(newScore.toFixed(1));
        newEvaluacion.percentage = (newEvaluacion.score * 10).toFixed(1);

        onEvaluacionChange(chatId, newEvaluacion)
    }

    const toggleSeleccion = (chatId) => {
        const newSeleccionadas = [...seleccionadas]
        const index = newSeleccionadas.indexOf(chatId)
        if (index > -1) {
            newSeleccionadas.splice(index, 1)
        } else {
            newSeleccionadas.push(chatId)
        }
        onSeleccionChange(newSeleccionadas)
    }

    const toggleSeleccionTodos = () => {
        if (seleccionadas.length === conversaciones.length) {
            onSeleccionChange([])
        } else {
            onSeleccionChange(conversaciones.map(c => c.id))
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Evaluaciones de Conversaciones
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {conversaciones.length} conversaciones • {Object.keys(evaluaciones).length} evaluadas
                    </p>
                </div>
                {conversaciones.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={seleccionadas.length === conversaciones.length && conversaciones.length > 0}
                            onChange={toggleSeleccionTodos}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Seleccionar todas</span>
                    </label>
                )}
            </div>

            {conversaciones.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900">No hay conversaciones</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Usa los filtros para cargar conversaciones del asesor
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                                    <input
                                        type="checkbox"
                                        checked={seleccionadas.length === conversaciones.length && conversaciones.length > 0}
                                        onChange={toggleSeleccionTodos}
                                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Lead
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Acciones
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-12">

                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {conversaciones.map((conv) => {
                                const evaluacion = evaluaciones[conv.id]
                                const isExpanded = expandidas.has(conv.id)
                                const isSelected = seleccionadas.includes(conv.id)

                                return (
                                    <React.Fragment key={conv.id}>
                                        <tr
                                            className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSeleccion(conv.id)}
                                                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatContactName(conv)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {conv.contact_phone || conv.contact_number}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {evaluacion ? (
                                                    <div>
                                                        <span className={`text-lg font-bold ${evaluacion.score >= 7 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {evaluacion.score}/10
                                                        </span>
                                                        <div className="text-xs text-gray-500">
                                                            {evaluacion.percentage}%
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {evaluacion ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${evaluacion.manually_edited
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                                                            }`}>
                                                            {evaluacion.manually_edited ? (
                                                                <>
                                                                    <Edit3 className="h-3 w-3" />
                                                                    Manual
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="h-3 w-3" />
                                                                    IA
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        Sin evaluar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleVerConversacion(conv.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    {evaluacion ? 'Ver Chat' : 'Evaluar Manualmente'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {evaluacion && (
                                                    <button
                                                        onClick={() => toggleExpanded(conv.id)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-5 w-5" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {isExpanded && evaluacion && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-4 bg-gray-50">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {PARAMETROS_EVALUACION.map((param) => (
                                                            <div
                                                                key={param.key}
                                                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${param.isCritical ? 'bg-indigo-50/50 border-indigo-100' : 'border-transparent'}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={evaluacion[param.key] || false}
                                                                    onChange={() => toggleParametro(conv.id, param.key)}
                                                                    disabled={param.isInfo}
                                                                    className={`h-4 w-4 rounded border-gray-300 focus:ring-indigo-500 ${param.isCritical ? 'text-indigo-600' : 'text-gray-600'}`}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className={`text-xs font-semibold flex items-center gap-1 ${param.isCritical ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                                        {param.icon} {param.label}
                                                                        {param.isCritical && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 rounded uppercase">KPI</span>}
                                                                    </span>
                                                                    {param.isInfo && evaluacion[param.key] && (
                                                                        <span className="text-[10px] text-gray-500 font-mono">
                                                                            {evaluacion[param.key]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {evaluacion.ai_feedback && (
                                                        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                                                            <div className="flex items-start gap-2">
                                                                {evaluacion.manually_edited ? (
                                                                    <Edit3 className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                                                        {evaluacion.manually_edited ? 'Observación del Gerente:' : 'Observación por IA:'}
                                                                    </p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {evaluacion.ai_feedback}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
