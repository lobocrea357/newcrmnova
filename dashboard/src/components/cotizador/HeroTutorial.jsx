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
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">1</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">👤</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Nombre del cliente</h3>
              <p class="text-indigo-100 text-xs">Ingresa el nombre completo del cliente</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">2</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">👥</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Agrega pasajeros</h3>
              <p class="text-indigo-100 text-xs">Adultos, niños e infantes con sus precios</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">3</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">�</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Método de pago</h3>
              <p class="text-indigo-100 text-xs">Selecciona cómo pagará el cliente</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">4</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">💾</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Guarda cotización</h3>
              <p class="text-indigo-100 text-xs">Se guarda automáticamente en revisión</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">5</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">📄</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Exporta PDF</h3>
              <p class="text-indigo-100 text-xs">Genera y envía el PDF al cliente</p>
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
                  <h4 class="font-semibold text-white mb-1">👥 Múltiples pasajeros</h4>
                  <p class="text-indigo-100 text-sm">Agrega adultos, niños e infantes. Cada uno tiene su propio precio pantalla, fees y equipaje.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">💱 Conversión automática</h4>
                  <p class="text-indigo-100 text-sm">El sistema detecta la moneda según el método de pago (Zelle→USD, Binance→USDT, Pago móvil→VES).</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">� Guardar cotización</h4>
                  <p class="text-indigo-100 text-sm">Al guardar, la cotización queda con estado "EN REVISIÓN" automáticamente. Puedes editarla antes de aprobarla.</p>
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">✏️ Editar cotizaciones</h4>
                  <p class="text-indigo-100 text-sm">Si está en revisión, puedes editarla desde la vista de cotizaciones. Los cambios se guardan y puedes exportar un nuevo PDF.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🇻🇪 Impuesto 4x1000</h4>
                  <p class="text-indigo-100 text-sm">Se aplica automáticamente solo para pagos en Bolívares (VES) según normativa venezolana.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">� PDF profesional</h4>
                  <p class="text-indigo-100 text-sm">El PDF incluye todos los detalles, métodos de pago disponibles y está listo para enviar al cliente.</p>
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
