'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'

export default function ComprobantesCarouselModal({ isOpen, onClose, comprobantes, vueloId }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const hasMultiple = comprobantes.length > 1

  // Reset index cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
    }
  }, [isOpen])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? comprobantes.length - 1 : prev - 1))
  }, [comprobantes.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === comprobantes.length - 1 ? 0 : prev + 1))
  }, [comprobantes.length])

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        handlePrevious()
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasMultiple, onClose, handlePrevious, handleNext])

  if (!isOpen || comprobantes.length === 0) return null

  const currentComprobante = comprobantes[currentIndex]

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = currentComprobante.url_storage
    link.download = currentComprobante.nombre_archivo || 'comprobante.jpg'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent z-10 p-4 flex items-center justify-between">
          <div className="text-white">
            <p className="text-sm font-medium">
              Comprobante {currentIndex + 1} de {comprobantes.length}
            </p>
            <p className="text-xs text-gray-300 mt-1 truncate max-w-md">
              {currentComprobante.nombre_archivo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
              title="Descargar imagen"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Imagen principal */}
        <div className="relative w-full h-[80vh] bg-gray-900 flex items-center justify-center">
          <img
            src={currentComprobante.url_storage}
            alt={currentComprobante.nombre_archivo}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Error cargando imagen:', currentComprobante.url_storage)
              e.target.src = '/placeholder-image.png'
              e.target.alt = 'Imagen no disponible'
            }}
          />

          {/* Controles de navegación */}
          {hasMultiple && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                title="Anterior"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                title="Siguiente"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            </>
          )}
        </div>

        {/* Footer con indicadores */}
        {hasMultiple && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent z-10 p-4">
            <div className="flex items-center justify-center gap-2">
              {comprobantes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/70'
                    }`}
                  title={`Ver comprobante ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Navegación con teclado */}
        <div className="sr-only">
          <p>Usa las flechas izquierda/derecha para navegar entre comprobantes</p>
        </div>
      </div>
    </div>
  )
}
