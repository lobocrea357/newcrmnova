'use client'

import { useState } from 'react'
import { FileText, Download, X, Check, AlertCircle } from 'lucide-react'
import { generarReporteMock } from '@/lib/mockRendimiento'

export default function GeneradorReporte({ 
  isOpen, 
  onClose, 
  evaluaciones = {},
  conversaciones = [],
  botName = 'Asesor'
}) {
  const [generando, setGenerando] = useState(false)
  const [reporte, setReporte] = useState(null)

  const handleGenerar = async () => {
    setGenerando(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const reporteGenerado = generarReporteMock(evaluaciones, conversaciones, botName)
    setReporte(reporteGenerado)
    setGenerando(false)
  }

  const handleDescargar = () => {
    const blob = new Blob([reporte], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reporte_${botName}_${new Date().toISOString().split('T')[0]}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCopiar = () => {
    navigator.clipboard.writeText(reporte)
    alert('Reporte copiado al portapapeles')
  }

  if (!isOpen) return null

  const totalEvaluaciones = Object.keys(evaluaciones).length
  const scorePromedio = totalEvaluaciones > 0
    ? (Object.values(evaluaciones).reduce((sum, ev) => sum + ev.score, 0) / totalEvaluaciones).toFixed(1)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Generar Reporte de Correcciones
              </h2>
              <p className="text-sm text-purple-100 mt-1">
                {botName} • {totalEvaluaciones} evaluaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!reporte ? (
            <div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-900">
                      Vista Previa de Reporte
                    </h3>
                    <p className="text-sm text-indigo-700 mt-2">
                      Se generará un reporte completo con el análisis de las {totalEvaluaciones} conversaciones evaluadas.
                      El score promedio actual es de <strong>{scorePromedio}/8</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Conversaciones Totales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {conversaciones.length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Score Promedio</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {scorePromedio}/8
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">
                      Nota Importante
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Este es un MVP con datos simulados. El reporte se genera localmente 
                      y no se guarda en la base de datos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Reporte Generado
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopiar}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={handleDescargar}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {reporte}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          {!reporte ? (
            <button
              onClick={handleGenerar}
              disabled={generando || totalEvaluaciones === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generando ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generando reporte...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar y Generar
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-5 w-5" />
              Reporte generado exitosamente
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
