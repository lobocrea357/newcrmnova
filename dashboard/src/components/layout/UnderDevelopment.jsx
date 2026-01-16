'use client'

import React from 'react'
import Link from 'next/link'
import { Construction, Home, ArrowLeft, Wrench, Clock } from 'lucide-react'

const UnderDevelopment = ({ 
  moduleName = "Este módulo",
  description = "Estamos trabajando en esta funcionalidad para ofrecerte la mejor experiencia.",
  showBackButton = true,
  estimatedDate = null
}) => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Icono animado */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 opacity-20 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative bg-white rounded-full p-8 shadow-2xl border-4 border-yellow-100">
              <Construction className="h-24 w-24 text-yellow-600 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
          <Wrench className="h-4 w-4" />
          En Desarrollo
        </div>

        {/* Mensaje principal */}
        <h2 className="text-4xl font-bold text-yellow-600 mb-4">
          {moduleName} en construcción
        </h2>
        
        <p className="text-lg text-yellow-400 mb-8 max-w-lg mx-auto">
          {description}
        </p>

        {/* Fecha estimada */}
        {estimatedDate && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm mb-8">
            <Clock className="h-4 w-4" />
            <span>Fecha estimada: <strong>{estimatedDate}</strong></span>
          </div>
        )}

        {/* Características próximamente */}
       {/*  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ¿Qué estamos preparando?
          </h3>
          <ul className="text-left space-y-3 max-w-md mx-auto">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Interfaz intuitiva y fácil de usar</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Integración completa con el sistema</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">Reportes y análisis en tiempo real</span>
            </li>
          </ul>
        </div>
 */}
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl font-medium"
          >
            <Home className="h-5 w-5" />
            Ir al Dashboard
          </Link>
          
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 shadow-md font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver atrás
            </button>
          )}
        </div>

        {/* Mensaje de contacto */}
       {/*  <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            ¿Tienes sugerencias o necesitas esta funcionalidad urgentemente?{' '}
            <Link href="/configuracion" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Contáctanos
            </Link>
          </p>
        </div> */}
      </div>
    </div>
  )
}

export default UnderDevelopment
