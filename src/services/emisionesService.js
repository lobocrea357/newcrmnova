import { supabase } from '../config/supabase.js';
import { notificarEmisionAutorizada, notificarDeudaGenerada } from './notificacionesService.js';

/**
 * Autorizar emisión de un vuelo
 */
export async function autorizarEmision(vueloId, userId, cuentaEmision, observaciones) {
  try {
    // 1. Obtener vuelo
    const { data: vuelo, error: errorVuelo } = await supabase
      .from('vuelos')
      .select('*, created_by, forma_emision')
      .eq('id', vueloId)
      .single();

    if (errorVuelo) throw new Error('Vuelo no encontrado');

    // 2. Validar estado
    if (vuelo.estado !== 'PENDIENTE_EMISION') {
      throw new Error('El vuelo no está en estado PENDIENTE_EMISION');
    }

    // 3. Actualizar vuelo con autorización
    const { data: vueloActualizado, error: errorUpdate } = await supabase
      .from('vuelos')
      .update({
        autorizado_emision: true,
        autorizado_por: userId,
        fecha_autorizacion_emision: new Date().toISOString(),
        cuenta_emision_asignada: cuentaEmision,
        observaciones_emision: observaciones
      })
      .eq('id', vueloId)
      .select()
      .single();

    if (errorUpdate) throw errorUpdate;

    // 4. Si es a crédito, crear deuda
    let deudaCreada = null;
    if (vuelo.forma_emision === 'CREDITO') {
      deudaCreada = await crearDeudaProveedor(vuelo, cuentaEmision);
    }

    // 5. Obtener nombre del admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const adminNombre = admin?.full_name || 'Administración';

    // 6. Notificar a emisor (rol: emisor)
    await notificarEmisionAutorizada(vueloActualizado, adminNombre);

    // 7. Si creó deuda, notificar a administración
    if (deudaCreada) {
      await notificarDeudaGenerada(deudaCreada, vueloActualizado);
    }

    return {
      vuelo: vueloActualizado,
      deuda: deudaCreada
    };
  } catch (error) {
    console.error('Error autorizando emisión:', error);
    throw error;
  }
}

/**
 * Crear deuda con proveedor
 */
async function crearDeudaProveedor(vuelo, cuentaEmision) {
  try {
    // Calcular monto de la deuda (suma de precios_pantalla de pasajeros)
    const { data: pasajeros } = await supabase
      .from('vuelos_pasajeros')
      .select('precio_pantalla')
      .eq('vuelo_id', vuelo.id);

    const montoDeuda = pasajeros.reduce((sum, p) => sum + parseFloat(p.precio_pantalla || 0), 0);

    // Determinar proveedor según cuenta
    const proveedorMap = {
      'SABRE': 'SABRE',
      'AMADEUS': 'AMADEUS',
      'EXPEDIA': 'EXPEDIA'
    };

    const proveedor = Object.keys(proveedorMap).find(key => 
      cuentaEmision.includes(key)
    ) || 'OTRO';

    // Fecha de vencimiento: 30 días desde hoy
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    const { data: deuda, error } = await supabase
      .from('deudas_proveedores')
      .insert({
        vuelo_id: vuelo.id,
        proveedor,
        cuenta_emision: cuentaEmision,
        monto_deuda: montoDeuda,
        saldo_pendiente: montoDeuda,
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Deuda creada con ${proveedor}: $${montoDeuda}`);
    return deuda;
  } catch (error) {
    console.error('Error creando deuda:', error);
    return null;
  }
}

/**
 * Autorizar múltiples vuelos en batch
 */
export async function autorizarEmisionBatch(vueloIds, userId, cuentaEmision, observaciones) {
  const resultados = [];
  
  for (const vueloId of vueloIds) {
    try {
      const resultado = await autorizarEmision(vueloId, userId, cuentaEmision, observaciones);
      resultados.push({ vueloId, success: true, ...resultado });
    } catch (error) {
      resultados.push({ vueloId, success: false, error: error.message });
    }
  }

  return resultados;
}

export default {
  autorizarEmision,
  autorizarEmisionBatch
};
