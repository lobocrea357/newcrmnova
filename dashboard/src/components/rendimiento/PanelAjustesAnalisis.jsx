'use client'

import { useState } from 'react'
import { Sparkles, Save, Edit3 } from 'lucide-react'
import { PARAMETROS_EVALUACION } from '@/lib/mockRendimiento'

export default function PanelAjustesAnalisis({
    chatId,
    evaluacion,
    contactName,
    onEvaluacionChange,
    onSave
}) {
    const [editandoFeedback, setEditandoFeedback] = useState(false)
    const [feedbackTemp, setFeedbackTemp] = useState('')
    if (!chatId || !evaluacion) {
        return (
            <div className="h-full flex items-center justify-center p-6 text-center">
                <div>
                    <Edit3 className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500">
                        Selecciona una conversación para ver su evaluación
                    </p>
                </div>
            </div>
        )
    }

    const toggleParametro = (parametro) => {
        const newValue = !evaluacion[parametro]
        const newEvaluacion = {
            ...evaluacion,
            [parametro]: newValue,
            manually_edited: true
        }

        let newScore = 0
        PARAMETROS_EVALUACION.forEach(param => {
            if (newEvaluacion[param.key]) newScore++
        })
        newEvaluacion.score = newScore
        newEvaluacion.percentage = ((newScore / 7) * 100).toFixed(1)

        onEvaluacionChange(chatId, newEvaluacion)
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="p-4 bg-white border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                    Evaluación de Rendimiento
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {contactName || 'Conversación'}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                            {evaluacion.score}/7
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            {evaluacion.percentage}% de cumplimiento
                        </div>
                        <div className="mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${evaluacion.manually_edited
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                                }`}>
                                {evaluacion.manually_edited ? (
                                    <>
                                        <Edit3 className="h-3 w-3" />
                                        Editado manualmente
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3 w-3" />
                                        Generado por IA
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Parámetros Evaluados
                    </h4>
                    <div className="space-y-2">
                        {PARAMETROS_EVALUACION.map((param) => (
                            <label
                                key={param.key}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={evaluacion[param.key] || false}
                                    onChange={() => toggleParametro(param.key)}
                                    className="mt-0.5 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{param.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">
                                            {param.label}
                                        </span>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            <h4 className="text-sm font-medium text-gray-900">
                                Observaciones
                            </h4>
                        </div>
                        <button
                            onClick={() => {
                                if (!editandoFeedback) {
                                    setFeedbackTemp(evaluacion.ai_feedback || '')
                                    setEditandoFeedback(true)
                                } else {
                                    const newEvaluacion = {
                                        ...evaluacion,
                                        ai_feedback: feedbackTemp,
                                        manually_edited: true
                                    }
                                    onEvaluacionChange(chatId, newEvaluacion)
                                    setEditandoFeedback(false)
                                }
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            {editandoFeedback ? 'Guardar' : 'Editar'}
                        </button>
                    </div>
                    {editandoFeedback ? (
                        <textarea
                            value={feedbackTemp}
                            onChange={(e) => setFeedbackTemp(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={4}
                            placeholder="Escribe observaciones o notas sobre esta conversación..."
                        />
                    ) : (
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {evaluacion.ai_feedback || 'Sin observaciones'}
                        </p>
                    )}
                </div>
            </div>

            {onSave && (
                <div className="p-4 bg-white border-t border-gray-200">
                    <button
                        onClick={() => onSave(chatId, evaluacion)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                    </button>
                </div>
            )}
        </div>
    )
}
