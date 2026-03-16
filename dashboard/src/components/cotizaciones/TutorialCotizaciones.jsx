'use client'
import TutorialSection from '../ui/TutorialSection'

export default function TutorialCotizaciones() {
  return (
    <TutorialSection
      title="¿Cómo gestionar cotizaciones?"
      subtitle="Tutorial súper simple para aprobar, rechazar y editar cotizaciones"
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
                <div class="w-5 h-5 text-white flex items-center justify-center">🔍</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Busca la cotización</h3>
              <p class="text-indigo-100 text-xs">Usa el buscador o filtros para encontrar la cotización</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">2</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">👁️</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Revisa los datos</h3>
              <p class="text-indigo-100 text-xs">Click en la cotización para ver todos los detalles</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">3</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">✏️</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Edita si necesario</h3>
              <p class="text-indigo-100 text-xs">Si está en revisión, puedes editarla fácilmente</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">4</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">✅</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Aprueba o rechaza</h3>
              <p class="text-indigo-100 text-xs">Decide el destino final de la cotización</p>
            </div>
          </div>
          
          <!-- Explicación de estados -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="text-xl">🎯</span>
              Estados de cotización (súper simple)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
                <h4 class="font-semibold text-yellow-100 mb-2 flex items-center gap-2">
                  <span>🟡</span>
                  EN REVISIÓN
                </h4>
                <p class="text-yellow-50 text-sm mb-3">Estado inicial cuando guardas una cotización desde la calculadora.</p>
                <div class="space-y-1 text-xs text-yellow-100">
                  <p>• Puedes editarla</p>
                  <p>• Puedes aprobarla</p>
                  <p>• Puedes rechazarla</p>
                </div>
              </div>
              
              <div class="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                <h4 class="font-semibold text-green-100 mb-2 flex items-center gap-2">
                  <span>✅</span>
                  APROBADA
                </h4>
                <p class="text-green-50 text-sm mb-3">Cotización lista para convertirse en venta de vuelo.</p>
                <div class="space-y-1 text-xs text-green-100">
                  <p>• No se puede editar</p>
                  <p>• Aparece botón "Crear Venta"</p>
                  <p>• Cliente confirmó compra</p>
                </div>
              </div>
              
              <div class="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
                <h4 class="font-semibold text-red-100 mb-2 flex items-center gap-2">
                  <span>❌</span>
                  RECHAZADA
                </h4>
                <p class="text-red-50 text-sm mb-3">Cliente desistió o no aceptó las condiciones.</p>
                <div class="space-y-1 text-xs text-red-100">
                  <p>• No se puede editar</p>
                  <p>• Requiere motivo de rechazo</p>
                  <p>• Queda archivada</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tips prácticos -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="text-xl">💡</span>
              Tips prácticos (a prueba de tontos)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">✏️ ¿Cómo editar?</h4>
                  <p class="text-indigo-100 text-sm">Si está EN REVISIÓN, click en "Editar Cotización". Se abre la calculadora con todos los datos cargados. Cambia lo que necesites y guarda.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🚀 Crear venta rápido</h4>
                  <p class="text-indigo-100 text-sm">Cuando apruebes, aparece botón "Crear Venta de Vuelo". Te lleva directo al formulario con datos pre-cargados.</p>
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">❌ ¿Cuándo rechazar?</h4>
                  <p class="text-indigo-100 text-sm">Cliente no responde, cambió de opinión, o encontró precio mejor. Siempre pon un motivo claro para futuras referencias.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🔍 Búsqueda inteligente</h4>
                  <p class="text-indigo-100 text-sm">Busca por nombre del cliente, ruta, o usa los filtros por estado. Todo súper rápido y fácil.</p>
                </div>
              </div>
            </div>
            
            <div class="mt-4 bg-indigo-500/20 rounded-lg p-3 border border-indigo-500/30">
              <h4 class="font-semibold text-indigo-100 mb-1 flex items-center gap-2">
                <span>⚡</span>
                Consejo profesional
              </h4>
              <p class="text-indigo-50 text-sm">Todas las cotizaciones empiezan EN REVISIÓN. Revísalas bien antes de aprobar. Una vez aprobada, el cliente está listo para pagar y crear el vuelo oficial.</p>
            </div>
          </div>
        </div>
      `}
      defaultExpanded={false}
    />
  )
}
