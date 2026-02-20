'use client'
import { Calculator, DollarSign, TrendingUp, FileText } from 'lucide-react'
import TutorialSection from '../ui/TutorialSection'

export default function HeroTutorial() {
  return (
    <TutorialSection
      title="¿Cómo usar la calculadora?"
      subtitle="Sigue estos 4 pasos simples para cotizar rápidamente"
      mode="description"
      description={`
        <div class="space-y-6">
          <!-- Pasos principales -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">1</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">🧮</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Ingresa el precio</h3>
              <p class="text-indigo-100 text-xs">Precio de pantalla + fees de emisión y agencia</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">2</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">💰</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Selecciona monedas</h3>
              <p class="text-indigo-100 text-xs">Moneda del precio y moneda para cotizar</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">3</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">✈️</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Configura vuelo</h3>
              <p class="text-indigo-100 text-xs">Tipo, fechas, equipaje y método de pago</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">4</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">📄</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Calcula y exporta</h3>
              <p class="text-indigo-100 text-xs">Obtén el resultado y genera PDF</p>
            </div>
          </div>
          
          <!-- Tips adicionales -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="text-xl">💡</span>
              Tips importantes para usar la calculadora
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🎯 Precios exactos</h4>
                  <p class="text-indigo-100 text-sm">Incluye TODOS los costos: tarifa base, fees de emisión, fees de agencia y cualquier cargo adicional del proveedor.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">💱 Conversión inteligente</h4>
                  <p class="text-indigo-100 text-sm">El sistema detecta automáticamente la moneda según el método de pago seleccionado (ej: Binance → USDT).</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">📅 Fechas correctas</h4>
                  <p class="text-indigo-100 text-sm">Usa el formato DD/MM/AAAA. Las fechas afectan el cálculo de tasas según la temporada.</p>
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🧳 Equipaje y fees</h4>
                  <p class="text-indigo-100 text-sm">Selecciona correctamente el equipaje. Cada pieza tiene un fee que se suma al total de la cotización.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🇻🇪 Impuesto 4x1000</h4>
                  <p class="text-indigo-100 text-sm">Se aplica automáticamente solo para pagos en Bolívares (VES) según la normativa venezolana.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">📋 Exportación PDF</h4>
                  <p class="text-indigo-100 text-sm">El PDF generado incluye todos los detalles, tasas aplicadas y está listo para enviar al cliente.</p>
                </div>
              </div>
            </div>
            
            <div class="mt-4 bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
              <h4 class="font-semibold text-yellow-100 mb-1 flex items-center gap-2">
                <span>⚠️</span>
                Recomendación profesional
              </h4>
              <p class="text-yellow-50 text-sm">Verifica SIEMPRE los datos antes de generar el PDF. Una cotización precisa genera confianza y evita problemas futuros con los clientes.</p>
            </div>
          </div>
        </div>
      `}
      defaultExpanded={false}
    />
  )
}
