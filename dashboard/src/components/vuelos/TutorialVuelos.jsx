'use client'
import TutorialSection from '../ui/TutorialSection'

export default function TutorialVuelos() {
  return (
    <TutorialSection
      title="¿Cómo registrar un vuelo vendido?"
      subtitle="Guía super fácil para registrar ventas de vuelos paso a paso"
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
                <div class="w-5 h-5 text-white flex items-center justify-center">✈️</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Datos del vuelo</h3>
              <p class="text-indigo-100 text-xs">Ruta, fecha, horarios y localizador</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">2</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">👤</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Info del cliente</h3>
              <p class="text-indigo-100 text-xs">Nombre, contacto y pasajeros</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">3</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">💰</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Montos y costos</h3>
              <p class="text-indigo-100 text-xs">Venta, Sabre, Expedia, emisión, fees</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">4</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">📎</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Adjunta archivos</h3>
              <p class="text-indigo-100 text-xs">Comprobante de pago y pasaportes</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <span class="text-white font-bold text-sm">5</span>
                </div>
                <div class="w-5 h-5 text-white flex items-center justify-center">✅</div>
              </div>
              <h3 class="font-semibold text-white mb-1">Guarda y listo</h3>
              <p class="text-indigo-100 text-xs">El vuelo queda registrado en el sistema</p>
            </div>
          </div>
          
          <!-- Campos obligatorios vs opcionales -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="text-xl">📋</span>
              ¿Qué campos son obligatorios?
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                <h4 class="font-semibold text-green-100 mb-3 flex items-center gap-2">
                  <span>✅</span>
                  OBLIGATORIOS (sin estos no puedes guardar)
                </h4>
                <ul class="space-y-2 text-sm text-green-50">
                  <li>• Ruta (Ejemplo: CSS → MAD)</li>
                  <li>• Fecha del vuelo</li>
                  <li>• Localizador (código de reserva)</li>
                  <li>• Nombre del pasajero principal</li>
                  <li>• Número de pasajeros (adultos/niños/infantes)</li>
                  <li>• Monto de venta (precio final al cliente)</li>
                  <li>• Proveedor (dónde compraste el boleto)</li>
                </ul>
              </div>
              
              <div class="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                <h4 class="font-semibold text-blue-100 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  OPCIONALES (pero muy recomendados)
                </h4>
                <ul class="space-y-2 text-sm text-blue-50">
                  <li>• Horario del vuelo</li>
                  <li>• Aerolínea</li>
                  <li>• Teléfono de contacto</li>
                  <li>• Método de pago</li>
                  <li>• Montos de Sabre, Expedia, Emisión</li>
                  <li>• Comprobante de pago (foto)</li>
                  <li>• Pasaportes de los pasajeros</li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Tips prácticos -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="text-xl">🎯</span>
              Tips súper útiles
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🔤 Ruta correcta</h4>
                  <p class="text-indigo-100 text-sm">Usa códigos de aeropuerto (CSS, MAD, BOG). El sistema los valida automáticamente. Formato: ORIGEN → DESTINO</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🎫 Localizador único</h4>
                  <p class="text-indigo-100 text-sm">Cada localizador es único. Si intentas registrar uno que ya existe, el sistema te lo avisa para evitar duplicados.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">📸 Subir archivos</h4>
                  <p class="text-indigo-100 text-sm">Acepta JPG, PNG y PDF. Máximo 10MB por archivo. Puedes subir múltiples pasaportes si son varios pasajeros.</p>
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">💰 Monto de venta</h4>
                  <p class="text-indigo-100 text-sm">Es el precio TOTAL que pagó el cliente. Este monto es el que aparece en tus reportes de comisiones.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">✨ Desde cotización</h4>
                  <p class="text-indigo-100 text-sm">Si tienes una cotización aprobada, usa el botón "Crear Venta". Muchos datos se auto-completan y ahorras tiempo.</p>
                </div>
                
                <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 class="font-semibold text-white mb-1">🔍 Confirmar pago después</h4>
                  <p class="text-indigo-100 text-sm">El administrador verá el vuelo en "Confirmar Pagos". Una vez confirmado, el vuelo queda 100% registrado.</p>
                </div>
              </div>
            </div>
            
            <div class="mt-4 bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
              <h4 class="font-semibold text-yellow-100 mb-1 flex items-center gap-2">
                <span>⚠️</span>
                Importante
              </h4>
              <p class="text-yellow-50 text-sm">Guarda el vuelo SOLO cuando tengas los datos confirmados. Una vez guardado, queda pendiente de confirmación de pago por el administrador. Si hay error, contacta al administrador.</p>
            </div>
          </div>
          
          <!-- Estados del vuelo -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="text-xl">🔄</span>
              Estados del vuelo (ciclo completo)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
                <h4 class="font-semibold text-orange-100 mb-2 flex items-center gap-2">
                  <span>🟠</span>
                  PENDIENTE CONFIRMACIÓN
                </h4>
                <p class="text-orange-50 text-sm">Estado inicial. El vuelo espera que el admin confirme que el pago está correcto.</p>
              </div>
              
              <div class="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                <h4 class="font-semibold text-green-100 mb-2 flex items-center gap-2">
                  <span>✅</span>
                  PAGO CONFIRMADO
                </h4>
                <p class="text-green-50 text-sm">Admin confirmó el pago. El vuelo está 100% activo y se ve en todos los reportes.</p>
              </div>
              
              <div class="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                <h4 class="font-semibold text-blue-100 mb-2 flex items-center gap-2">
                  <span>✈️</span>
                  COMPLETADO
                </h4>
                <p class="text-blue-50 text-sm">El vuelo ya sucedió. Aparece en historial pero no en pendientes.</p>
              </div>
            </div>
          </div>
        </div>
      `}
      defaultExpanded={false}
    />
  )
}
