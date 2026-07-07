import { supabase } from '../config/supabase.js';

/**
 * Registrar un cambio de estado en auditoría
 */
export async function registrarCambioEstado({
  entidadTipo,      // 'vuelo', 'deuda', etc.
  entidadId,        // UUID de la entidad
  campoCambiado,    // 'estado', 'estado_emision', etc.
  valorAnterior,    // Valor antes del cambio
  valorNuevo,       // Valor después del cambio
  usuarioId,        // UUID del usuario que hizo el cambio
  usuarioNombre,    // Nombre del usuario
  razonCambio,      // Motivo del cambio (opcional)
  ipAddress         // IP del usuario (opcional)
}) {
  try {
    const { data, error } = await supabase
      .from('auditoria_cambios_estado')
      .insert({
        entidad_tipo: entidadTipo,
        entidad_id: entidadId,
        campo_cambiado: campoCambiado,
        valor_anterior: valorAnterior,
        valor_nuevo: valorNuevo,
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre,
        razon_cambio: razonCambio,
        ip_address: ipAddress
      })
      .select()
      .single();

    if (error) {
      console.error('Error registrando auditoría:', error);
      throw error;
    }

    console.log(`✅ Auditoría registrada: ${entidadTipo}:${entidadId} - ${campoCambiado}: ${valorAnterior} → ${valorNuevo}`);
    return data;
  } catch (error) {
    // No bloquear el flujo principal si falla auditoría
    console.error('Error en auditoría (no bloqueante):', error.message);
    return null;
  }
}

/**
 * Obtener historial de cambios de una entidad
 */
export async function obtenerHistorialCambios(entidadTipo, entidadId) {
  try {
    const { data, error } = await supabase
      .from('auditoria_cambios_estado')
      .select('*')
      .eq('entidad_tipo', entidadTipo)
      .eq('entidad_id', entidadId)
      .order('fecha_cambio', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
}

export default {
  registrarCambioEstado,
  obtenerHistorialCambios
};
