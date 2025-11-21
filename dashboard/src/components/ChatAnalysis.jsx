'use client'

import { useState } from 'react'

export default function ChatAnalysis({ messages }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState(null)
    const [error, setError] = useState(null)
    const [customPrompt, setCustomPrompt] = useState(
        `Eres un experto analista de ventas y calidad de atención al cliente.
Analiza la siguiente conversación de WhatsApp entre un Asesor y un Cliente.
Tu objetivo es determinar si la venta se concretó, identificar fallos y evaluar la atención.

Debes responder EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
{
  "sale_completed": boolean, // true si hubo venta/acuerdo explícito, false si no.
  "failure_reason": string, // Breve explicación de por qué no se cerró (o "N/A" si se cerró).
  "advisor_performance": string, // Comentarios sobre el desempeño del asesor.
  "key_moments": string[] // Lista de momentos clave.
}`
    )
    const [showPrompt, setShowPrompt] = useState(false)

    const handleAnalyze = async () => {
        setIsAnalyzing(true)
        setError(null)
        setAnalysis(null)

        try {
            const response = await fetch('/api/analyze-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    customPrompt,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al analizar el chat')
            }

            setAnalysis(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Análisis con IA
                </h2>
                <button
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="text-sm text-gray-500 hover:text-blue-600 underline"
                >
                    {showPrompt ? 'Ocultar Prompt' : 'Configurar Prompt'}
                </button>
            </div>

            {showPrompt && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt del Sistema (Instrucciones para la IA)
                    </label>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="w-full h-32 p-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Escribe aquí las instrucciones para la IA..."
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {!analysis && !isAnalyzing && !error && (
                    <div className="text-center text-gray-500 py-8">
                        <p>Presiona "Analizar Chat" para obtener insights sobre esta conversación.</p>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3"></div>
                        <p className="text-gray-600 animate-pulse">Analizando conversación...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                        Error: {error}
                    </div>
                )}

                {analysis && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Resultado Venta */}
                        <div className={`p-4 rounded-lg border ${analysis.sale_completed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {analysis.sale_completed ? (
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                <h3 className={`font-bold text-lg ${analysis.sale_completed ? 'text-green-800' : 'text-red-800'}`}>
                                    {analysis.sale_completed ? 'Venta Concretada' : 'Venta No Concretada'}
                                </h3>
                            </div>
                            {!analysis.sale_completed && (
                                <p className="text-sm text-red-700 mt-1">
                                    <strong>Razón:</strong> {analysis.failure_reason}
                                </p>
                            )}
                        </div>

                        {/* Alerta de Tiempo */}
                        {analysis.system_detected_delay?.has_long_delay && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="font-semibold text-yellow-800">Demora Detectada</h4>
                                    <p className="text-sm text-yellow-700">{analysis.system_detected_delay.details}</p>
                                </div>
                            </div>
                        )}

                        {/* Desempeño */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">Desempeño del Asesor</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{analysis.advisor_performance}</p>
                        </div>

                        {/* Momentos Clave */}
                        {analysis.key_moments && analysis.key_moments.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Momentos Clave</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                    {analysis.key_moments.map((moment, idx) => (
                                        <li key={idx}>{moment}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`w-full mt-4 py-2 px-4 rounded-md text-white font-medium transition-colors ${isAnalyzing
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                    }`}
            >
                {isAnalyzing ? 'Analizando...' : 'Analizar Chat'}
            </button>
        </div>
    )
}
