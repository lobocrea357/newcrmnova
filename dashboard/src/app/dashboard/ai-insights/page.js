'use client'

import { useState } from 'react'

export default function AIInsightsPage() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)

    const handleGenerateReport = async () => {
        setLoading(true)
        // TODO: Implement API call for aggregated report
        // const response = await fetch('/api/analyze-sales', { ... })

        // Simulation for now
        setTimeout(() => {
            setReport({
                totalChats: 45,
                salesCompleted: 12,
                salesFailed: 33,
                conversionRate: '26.6%',
                topAdvisor: 'Sharon',
                commonFailureReasons: ['Precio alto', 'Sin respuesta del cliente', 'Falta de stock']
            })
            setLoading(false)
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Insights de Ventas con IA</h1>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            {loading ? 'Generando...' : 'Generar Reporte'}
                        </button>
                    </div>
                </div>

                {/* Report Display */}
                {report && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <p className="text-sm text-gray-500">Total Conversaciones</p>
                            <p className="text-3xl font-bold text-gray-900">{report.totalChats}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                            <p className="text-sm text-gray-500">Ventas Concretadas</p>
                            <p className="text-3xl font-bold text-gray-900">{report.salesCompleted}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                            <p className="text-sm text-gray-500">Ventas Fallidas</p>
                            <p className="text-3xl font-bold text-gray-900">{report.salesFailed}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                            <p className="text-sm text-gray-500">Tasa de Conversión</p>
                            <p className="text-3xl font-bold text-gray-900">{report.conversionRate}</p>
                        </div>
                    </div>
                )}

                {report && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Mejor Asesor</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold text-xl">
                                    {report.topAdvisor[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{report.topAdvisor}</p>
                                    <p className="text-sm text-gray-500">Mayor tasa de cierre</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Principales Razones de Fallo</h3>
                            <ul className="space-y-2">
                                {report.commonFailureReasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
