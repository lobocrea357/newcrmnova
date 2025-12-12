'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'

export default function ChatAnalysis({ messages }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState(null)
    const [error, setError] = useState(null)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
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
        <>
            <button
                onClick={() => setIsPanelOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-purple-700 px-5 py-3 text-white font-semibold shadow-2xl hover:bg-purple-800 transition-all"
            >
                <Sparkles className="h-5 w-5" />
                Análisis IA
            </button>

            {isPanelOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30"
                    onClick={() => setIsPanelOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 right-0 z-40 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-out ${
                    isPanelOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col">
                    <header className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-purple-500 font-semibold">
                                IA Insights
                            </p>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                Análisis IA
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Revisa la conversación y obtén un dictamen con sugerencias accionables.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPanelOpen(false)}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label="Cerrar panel de IA"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <button
                            onClick={() => setShowPrompt(!showPrompt)}
                            className="text-sm font-medium text-purple-600 hover:text-purple-800 underline-offset-4 hover:underline"
                        >
                            {showPrompt ? 'Ocultar instrucciones' : 'Configurar prompt'}
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors ${
                                isAnalyzing
                                    ? 'bg-purple-300 cursor-not-allowed'
                                    : 'bg-purple-700 hover:bg-purple-800'
                            }`}
                        >
                            <Sparkles className="h-4 w-4" />
                            {isAnalyzing ? 'Analizando...' : 'Analizar chat'}
                        </button>
                    </div>

                {showPrompt && (
                    <div className="px-5 py-4 border-b border-gray-100 bg-purple-50/40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prompt del Sistema (Instrucciones para la IA)
                        </label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="w-full h-28 p-3 border border-purple-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-100 focus:border-purple-400 bg-white/80"
                            placeholder="Escribe aquí las instrucciones para la IA..."
                        />
                    </div>
                )}

                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {!analysis && !isAnalyzing && !error && (
                            <div className="text-center text-gray-500 py-10 border-2 border-dashed border-purple-100 rounded-2xl">
                                <p className="font-medium text-gray-600">Pulsa “Analizar chat” para iniciar.</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Obtendrás un resumen de la oportunidad y mejoras sugeridas.
                                </p>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-200 border-t-purple-600 mb-4"></div>
                                <p className="text-gray-600 animate-pulse">La IA está revisando los mensajes…</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                                Error: {error}
                            </div>
                        )}

                        {analysis && (
                            <div className="space-y-4 animate-fadeIn">
                                {/* Resultado Venta */}
                                <div className={`p-4 rounded-2xl border ${analysis.sale_completed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
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
                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-2xl flex items-start gap-3">
                                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <h4 className="font-semibold text-yellow-800">Demora detectada</h4>
                                            <p className="text-sm text-yellow-700">{analysis.system_detected_delay.details}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Desempeño */}
                                <div className="bg-gray-50 p-3 rounded-2xl">
                                    <h4 className="font-semibold text-gray-800 mb-2">Desempeño del asesor</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{analysis.advisor_performance}</p>
                                </div>

                                {/* Momentos Clave */}
                                {analysis.key_moments && analysis.key_moments.length > 0 && (
                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                        <h4 className="font-semibold text-gray-800 mb-2">Momentos clave</h4>
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
                </div>
            </aside>
        </>
    )
}
